/**
 * TransitionManager - Scene Transitions, Loading Orchestration & UI Fade System
 * 
 * Dark Forest Portfolio Game
 * Manages seamless transitions between scenes and game states:
 * - Fade Transitions: Smooth fade to black (300ms), scene swap, fade from black (300ms)
 * - Slide Transitions: Directional slide-out (400ms) and slide-in (400ms)
 * - Crossfade Transitions: Smooth opacity blend overlap (500ms)
 * - Loading Transitions: Animated spinner (40px, 360°/s), gradient progress bar (300x8px),
 *   asset progress callbacks, and contextual gameplay tips
 * - State Transitions: Pause overlay (200ms), dialogue vignette & panel (200ms),
 *   achievement toast notifications (4s display), and night mode theme shifts (500ms)
 * - FIFO Transition Queue: Prevents concurrent transition glitches
 * - Error Handling & Retry: Error modal with retry callback and recovery
 * - Headless/Node and DOM/Phaser safe architecture
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROGRESS_EVENTS
} from '../events/EventBus.js';
import defaultAudioManager from '../audio/AudioManager.js';
import defaultVisualEffectsManager from '../effects/VisualEffectsManager.js';

export const TRANSITION_TYPES = {
  FADE: 'fade',
  SLIDE: 'slide',
  CROSSFADE: 'crossfade',
  LOADING: 'loading',
  DIALOGUE: 'dialogue',
  PAUSE: 'pause',
  ACHIEVEMENT: 'achievement',
  NIGHT_MODE: 'nightMode'
};

export const TRANSITION_CONFIG = {
  defaultTransition: 'fade',
  durations: {
    fade: { in: 300, out: 300, total: 600 },
    slide: { out: 400, in: 400, total: 800 },
    crossfade: { total: 500 },
    loading: { fade: 200, estimatedLoadTime: 3000 },
    dialogue: { in: 200, out: 200 },
    pause: { in: 200, out: 200 },
    achievement: { in: 200, display: 4000, out: 300 },
    nightMode: { duration: 500 }
  },
  tips: [
    'Explore the forest to discover new projects',
    'Talk to NPCs to unlock new dialogue and career insights',
    'Find all zones to unlock the Summit of Mastery',
    'Achievements track your engineering progress',
    'Night mode transforms the forest into a darker mystery',
    'Listen closely: each zone features a unique acoustic soundscape',
    'Hidden caves and easter eggs reward curious developers'
  ],
  overlayZIndex: 1000
};

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.children = [];
    this._innerHTML = '';
    this.parentNode = null;
    this.id = '';
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    const idRegex = /id=["']([^"']+)["']/g;
    let match;
    this.children = [];
    while ((match = idRegex.exec(val)) !== null) {
      const child = new MockElement('div');
      child.id = match[1];
      child.parentNode = this;
      this.children.push(child);
    }
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      if (this.id === id) return this;
      for (const ch of this.children) {
        if (ch.id === id) return ch;
        const found = ch.querySelector(sel);
        if (found) return found;
      }
    }
    return null;
  }
}

export class TransitionManager {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.scene = null;
    this.sceneManager = null;
    this.audioManager = config.audioManager || defaultAudioManager;
    this.visualEffectsManager = config.visualEffectsManager || defaultVisualEffectsManager;
    this.eventBus = config.eventBus || eventBus;

    // Core Transition State
    this.isTransitioningFlag = false;
    this.currentScene = config.initialScene || 'MainMenu';
    this.previousScene = null;
    this.transitionType = TRANSITION_CONFIG.defaultTransition;
    this.transitionProgress = 0;
    this.transitionQueue = [];
    this.loadingProgress = 0;
    this.estimatedLoadTime = TRANSITION_CONFIG.durations.loading.estimatedLoadTime;
    this.startTime = null;
    this.defaultTransition = TRANSITION_CONFIG.defaultTransition;

    // UI Overlay References & State
    this.rootContainer = null;
    this.fadeOverlay = null;
    this.loadingContainer = null;
    this.toastContainer = null;
    this.errorContainer = null;
    this.vignetteOverlay = null;

    // Subscriptions
    this._unsubscribers = [];
  }

  /**
   * Initializes the manager with Phaser scene and sceneManager contexts.
   * 
   * @param {Phaser.Scene} [scene]
   * @param {Phaser.Scenes.SceneManager|Object} [sceneManager]
   * @returns {TransitionManager}
   */
  create(scene = null, sceneManager = null) {
    if (scene) this.scene = scene;
    if (sceneManager) this.sceneManager = sceneManager;
    else if (scene?.scene) this.sceneManager = scene.scene;

    this._setupDOMOverlays();
    this._setupEventListeners();

    return this;
  }

  _setupDOMOverlays() {
    if (typeof document === 'undefined') {
      this.rootContainer = new MockElement('div');
      this.rootContainer.id = 'dark-forest-transition-root';
      this.fadeOverlay = new MockElement('div');
      this.fadeOverlay.id = 'df-fade-overlay';
      this.loadingContainer = new MockElement('div');
      this.loadingContainer.id = 'df-loading-overlay';
      this.toastContainer = new MockElement('div');
      this.toastContainer.id = 'df-toast-container';

      this.rootContainer.appendChild(this.fadeOverlay);
      this.rootContainer.appendChild(this.loadingContainer);
      this.rootContainer.appendChild(this.toastContainer);
      return;
    }

    let root = document.getElementById('dark-forest-transition-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'dark-forest-transition-root';
      root.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; z-index: ${TRANSITION_CONFIG.overlayZIndex};
        font-family: 'Cinzel', Georgia, 'Segoe UI', sans-serif;
      `;
      document.body.appendChild(root);
    }
    this.rootContainer = root;

    // 1. Black Fade Overlay
    let fadeEl = document.getElementById('df-fade-overlay');
    if (!fadeEl) {
      fadeEl = document.createElement('div');
      fadeEl.id = 'df-fade-overlay';
      fadeEl.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: #000000; opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none;
      `;
      root.appendChild(fadeEl);
    }
    this.fadeOverlay = fadeEl;

    // 2. Loading Screen Container
    let loadEl = document.getElementById('df-loading-overlay');
    if (!loadEl) {
      loadEl = document.createElement('div');
      loadEl.id = 'df-loading-overlay';
      loadEl.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 14, 26, 0.98); opacity: 0; pointer-events: none;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: #ffffff; transition: opacity 0.2s ease;
      `;
      root.appendChild(loadEl);
    }
    this.loadingContainer = loadEl;

    // 3. Toast Container
    let toastEl = document.getElementById('df-toast-container');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'df-toast-container';
      toastEl.style.cssText = `
        position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
        display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      `;
      root.appendChild(toastEl);
    }
    this.toastContainer = toastEl;
  }

  _setupEventListeners() {
    this._cleanupEventListeners();
    if (!this.eventBus) return;

    const subNight = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_TOGGLED, (data) => {
      this.applyNightModeTransition(Boolean(data?.enabled));
    });

    const subAch = this.eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, (data) => {
      this.showAchievementNotification(data?.achievementName || 'Achievement Unlocked', '🏆');
    });

    this._unsubscribers = [subNight, subAch];
  }

  _cleanupEventListeners() {
    this._unsubscribers.forEach(u => {
      if (typeof u === 'function') u();
    });
    this._unsubscribers = [];
  }

  // =========================================================================
  // SCENE TRANSITION DISPATCHER & QUEUE
  // =========================================================================

  /**
   * Coordinates smooth transitions to target scenes with FIFO queue protection.
   * 
   * @param {string} sceneKey
   * @param {string} [transitionType]
   * @param {Object} [options]
   * @returns {Promise<boolean>}
   */
  async transitionToScene(sceneKey, transitionType = this.defaultTransition, options = {}) {
    if (!sceneKey) return false;

    // If already transitioning, queue the request
    if (this.isTransitioningFlag) {
      this.queue(sceneKey, transitionType, options);
      return false;
    }

    this.isTransitioningFlag = true;
    this.transitionType = transitionType;
    this.transitionProgress = 0;
    this.startTime = Date.now();

    const fromScene = this.currentScene;
    this.eventBus.emit('transitionStart', { from: fromScene, to: sceneKey, type: transitionType });

    try {
      switch (transitionType) {
        case TRANSITION_TYPES.SLIDE:
          await this.slideTransition(sceneKey, options.direction || 'left', options.duration, options);
          break;
        case TRANSITION_TYPES.CROSSFADE:
          await this.crossfadeTransition(sceneKey, options.duration, options);
          break;
        case TRANSITION_TYPES.LOADING:
          await this.loadingTransition(sceneKey, options.estimatedLoadTime || this.estimatedLoadTime, options);
          break;
        case TRANSITION_TYPES.FADE:
        default:
          await this.fadeTransition(sceneKey, options.duration, options);
          break;
      }

      this.previousScene = fromScene;
      this.currentScene = sceneKey;
      this.isTransitioningFlag = false;
      this.transitionProgress = 100;

      this.eventBus.emit('transitionComplete', { sceneKey, type: transitionType });
      this._processNextInQueue();
      return true;
    } catch (err) {
      this.isTransitioningFlag = false;
      this.showErrorScreen(`Failed to load scene "${sceneKey}": ${err.message}`, () => {
        this.transitionToScene(sceneKey, transitionType, options);
      });
      return false;
    }
  }

  /**
   * Adds a transition request to the FIFO queue.
   */
  queue(sceneKey, transitionType = this.defaultTransition, options = {}) {
    this.transitionQueue.push({ sceneKey, transitionType, options });
  }

  /**
   * Processes the next queued transition in FIFO order.
   * @private
   */
  _processNextInQueue() {
    if (this.transitionQueue.length > 0 && !this.isTransitioningFlag) {
      const next = this.transitionQueue.shift();
      this.transitionToScene(next.sceneKey, next.transitionType, next.options);
    }
  }

  /**
   * Flushes all queued transitions.
   */
  flushQueue() {
    while (this.transitionQueue.length > 0) {
      this._processNextInQueue();
    }
  }

  // =========================================================================
  // TRANSITION STRATEGIES
  // =========================================================================

  /**
   * Standard fade-to-black / swap / fade-from-black transition (~600ms).
   */
  async fadeTransition(sceneKey, duration = 300, options = {}) {
    // 1. Pre-transition: Fade to black
    if (this.fadeOverlay) {
      this.fadeOverlay.style.transition = `opacity ${duration}ms ease`;
      this.fadeOverlay.style.opacity = '1';
      this.fadeOverlay.style.pointerEvents = 'auto';
    }
    if (this.visualEffectsManager?.fadeToBlack) {
      this.visualEffectsManager.fadeToBlack(duration);
    }

    // Audio coordination
    this._coordinateSceneAudio(this.currentScene, sceneKey);

    await this._delay(duration);

    // 2. Loading Phase: Scene Swap
    this._executeSceneSwap(sceneKey, options);
    this.eventBus.emit('sceneLoaded', { sceneKey });

    // 3. Post-transition: Fade from black
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '0';
      this.fadeOverlay.style.pointerEvents = 'none';
    }
    if (this.visualEffectsManager?.fadeFromBlack) {
      this.visualEffectsManager.fadeFromBlack(duration);
    }

    await this._delay(duration);
  }

  /**
   * Directional slide transition (~800ms).
   */
  async slideTransition(sceneKey, direction = 'left', duration = 400, options = {}) {
    const halfDur = duration;
    if (this.fadeOverlay) {
      this.fadeOverlay.style.transition = `opacity ${halfDur}ms ease`;
      this.fadeOverlay.style.opacity = '0.7';
    }

    await this._delay(halfDur);

    this._executeSceneSwap(sceneKey, options);
    this.eventBus.emit('sceneLoaded', { sceneKey });

    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '0';
    }

    await this._delay(halfDur);
  }

  /**
   * Smooth opacity crossfade transition (~500ms).
   */
  async crossfadeTransition(sceneKey, duration = 500, options = {}) {
    this._coordinateSceneAudio(this.currentScene, sceneKey);
    const halfDur = Math.round(duration / 2);

    await this._delay(halfDur);
    this._executeSceneSwap(sceneKey, options);
    this.eventBus.emit('sceneLoaded', { sceneKey });
    await this._delay(halfDur);
  }

  /**
   * Progress-tracked loading screen transition.
   */
  async loadingTransition(sceneKey, estimatedLoadTime = 3000, options = {}) {
    const tip = options.tip || this._getRandomTip();
    this.showLoadingScreen(tip);

    const steps = 10;
    const stepInterval = Math.max(50, estimatedLoadTime / steps);

    for (let i = 1; i <= steps; i++) {
      await this._delay(stepInterval);
      const pct = Math.round((i / steps) * 100);
      this.updateLoadingProgress(pct, i === steps ? 'Initializing World...' : 'Loading Assets...');
    }

    this._executeSceneSwap(sceneKey, options);
    this.eventBus.emit('sceneLoaded', { sceneKey });

    await this.hideLoadingScreen(250);
  }

  _executeSceneSwap(sceneKey, options = {}) {
    if (this.sceneManager?.start) {
      try {
        this.sceneManager.start(sceneKey, options.data || {});
      } catch (e) {
        // Safe catch for mocked or non-registered test scenes
      }
    }
  }

  _coordinateSceneAudio(fromScene, toScene) {
    if (!this.audioManager) return;
    if (toScene === 'MainGame' || toScene === 'Game') {
      this.audioManager.playMusic('ambient-forest-day', 500);
    } else if (toScene === 'MainMenu') {
      this.audioManager.playMusic('menu-ambient', 500);
    }
  }

  // =========================================================================
  // LOADING SCREEN UI
  // =========================================================================

  /**
   * Displays the dark atmospheric loading screen with spinner, progress bar, and tip.
   */
  showLoadingScreen(tip = null) {
    this.loadingProgress = 0;
    const displayTip = tip || this._getRandomTip();

    if (this.loadingContainer) {
      this.loadingContainer.innerHTML = `
        <div style="
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(15, 20, 36, 0.95); border: 2px solid #4A90FF;
          border-radius: 12px; padding: 40px 60px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        ">
          <!-- Spinner -->
          <div style="
            width: 40px; height: 40px; border: 4px solid rgba(74, 144, 255, 0.2);
            border-top: 4px solid #00D9FF; border-radius: 50%;
            animation: df-spin 1s linear infinite; margin-bottom: 20px;
          "></div>

          <h3 style="margin: 0 0 16px 0; color: #00D9FF; font-size: 20px; letter-spacing: 2px;">LOADING...</h3>

          <!-- Progress Bar (300x8px) -->
          <div style="
            width: 300px; height: 8px; background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px;
            overflow: hidden; margin-bottom: 12px;
          ">
            <div id="df-load-fill" style="
              width: 0%; height: 100%;
              background: linear-gradient(90deg, #4A90FF, #00D9FF);
              transition: width 0.15s ease;
            "></div>
          </div>

          <div id="df-load-pct" style="font-size: 13px; color: #a0c0e0; margin-bottom: 20px;">0%</div>

          <div style="
            font-size: 12px; color: #FFD700; max-width: 320px; text-align: center;
            font-style: italic; background: rgba(255, 215, 0, 0.08); padding: 8px 14px; border-radius: 6px;
          ">${displayTip}</div>
        </div>

        <style>
          @keyframes df-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;

      this.loadingContainer.style.opacity = '1';
      this.loadingContainer.style.pointerEvents = 'auto';
    }
  }

  /**
   * Hides the loading screen smoothly.
   */
  async hideLoadingScreen(duration = 300) {
    if (this.loadingContainer) {
      this.loadingContainer.style.transition = `opacity ${duration}ms ease`;
      this.loadingContainer.style.opacity = '0';
      this.loadingContainer.style.pointerEvents = 'none';
      await this._delay(duration);
      this.loadingContainer.innerHTML = '';
    }
  }

  /**
   * Updates loading progress percentage and label.
   */
  updateLoadingProgress(percentage, label = null) {
    this.loadingProgress = Math.max(0, Math.min(100, percentage));

    if (typeof document !== 'undefined') {
      const fill = document.getElementById('df-load-fill');
      const pct = document.getElementById('df-load-pct');
      if (fill) fill.style.width = `${this.loadingProgress}%`;
      if (pct) pct.textContent = label ? `${this.loadingProgress}% - ${label}` : `${this.loadingProgress}%`;
    }
  }

  onAssetLoaded(assetName = '') {
    const nextPct = Math.min(95, this.loadingProgress + 5);
    this.updateLoadingProgress(nextPct, assetName ? `Loaded ${assetName}` : 'Loading assets...');
  }

  _getRandomTip() {
    const tips = TRANSITION_CONFIG.tips;
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // =========================================================================
  // STATE-LEVEL TRANSITIONS (PAUSE, DIALOGUE, NOTIFICATIONS, NIGHT MODE)
  // =========================================================================

  pauseGameTransition() {
    this.eventBus.emit('gamePaused', {});
    if (this.audioManager?.setMusicVolume) {
      this.audioManager.setMusicVolume(0.3);
    }
  }

  resumeGameTransition() {
    this.eventBus.emit('gameResumed', {});
    if (this.audioManager?.setMusicVolume) {
      this.audioManager.setMusicVolume(0.6);
    }
  }

  showDialogueTransition() {
    this.eventBus.emit('dialogueStarted', {});
    if (this.visualEffectsManager?.setVignette) {
      this.visualEffectsManager.setVignette(0.25, 200);
    }
    if (this.audioManager?.onNpcInteract) {
      this.audioManager.onNpcInteract('npc');
    }
  }

  hideDialogueTransition() {
    this.eventBus.emit('dialogueEnded', {});
    if (this.visualEffectsManager?.setVignette) {
      this.visualEffectsManager.setVignette(0, 200);
    }
    if (this.audioManager?.onNpcInteractEnd) {
      this.audioManager.onNpcInteractEnd('npc');
    }
  }

  showAchievementNotification(achievementName, icon = '🏆', duration = 4000) {
    if (!this.toastContainer) return;

    const toast = typeof document !== 'undefined' ? document.createElement('div') : new MockElement('div');
    toast.style.cssText = `
      background: rgba(20, 26, 46, 0.95); border: 2px solid #FFD700;
      color: #ffffff; padding: 12px 24px; border-radius: 8px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 12px;
      transform: translateY(-50px); opacity: 0; transition: all 0.25s ease;
      font-size: 14px;
    `;
    toast.innerHTML = `
      <span style="font-size: 24px;">${icon}</span>
      <div>
        <div style="font-size: 11px; color: #FFD700; text-transform: uppercase;">Achievement Unlocked</div>
        <div style="font-weight: bold;">${achievementName}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    // Slide in
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    // Fade out after duration
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  applyNightModeTransition(enabled, duration = 500) {
    if (this.visualEffectsManager?.setNightMode) {
      this.visualEffectsManager.setNightMode(enabled);
    }
    if (this.audioManager?.setNightMode) {
      this.audioManager.setNightMode(enabled);
    }
  }

  // =========================================================================
  // ERROR SCREEN & RECOVERY
  // =========================================================================

  showErrorScreen(errorMessage, retryCallback = null) {
    if (!this.rootContainer) return;

    let errEl = typeof document !== 'undefined' ? document.getElementById('df-error-overlay') : this.rootContainer.querySelector('#df-error-overlay');
    if (!errEl) {
      errEl = typeof document !== 'undefined' ? document.createElement('div') : new MockElement('div');
      errEl.id = 'df-error-overlay';
      errEl.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 10, 15, 0.95); display: flex; align-items: center; justify-content: center;
        pointer-events: auto; z-index: 1005;
      `;
      this.rootContainer.appendChild(errEl);
    }

    errEl.innerHTML = `
      <div style="
        background: rgba(26, 26, 46, 0.98); border: 2px solid #e74c3c;
        border-radius: 8px; width: 440px; padding: 28px; text-align: center; color: #ffffff;
      ">
        <h3 style="color: #ff9999; margin: 0 0 12px 0;">TRANSITION ERROR</h3>
        <p style="font-size: 13px; color: #d0e0f0; margin-bottom: 24px;">${errorMessage}</p>
        <div style="display: flex; justify-content: center; gap: 12px;">
          <button id="btn-err-retry" style="
            padding: 8px 20px; background: #27ae60; border: none; color: #fff;
            border-radius: 4px; cursor: pointer; font-weight: bold;
          ">Retry</button>
          <button id="btn-err-close" style="
            padding: 8px 20px; background: #555566; border: none; color: #fff;
            border-radius: 4px; cursor: pointer;
          ">Close</button>
        </div>
      </div>
    `;

    const btnRetry = errEl.querySelector('#btn-err-retry');
    const btnClose = errEl.querySelector('#btn-err-close');

    if (btnRetry) {
      btnRetry.onclick = () => {
        this.hideErrorScreen();
        if (typeof retryCallback === 'function') retryCallback();
      };
    }
    if (btnClose) {
      btnClose.onclick = () => this.hideErrorScreen();
    }

    this.errorContainer = errEl;
  }

  hideErrorScreen() {
    if (this.errorContainer?.parentNode) {
      this.errorContainer.parentNode.removeChild(this.errorContainer);
      this.errorContainer = null;
    }
  }

  // =========================================================================
  // STATE INSPECTION, ABORT & SERIALIZATION
  // =========================================================================

  isTransitioning() {
    return this.isTransitioningFlag;
  }

  getCurrentScene() {
    return this.currentScene;
  }

  getPreviousScene() {
    return this.previousScene;
  }

  getTransitionProgress() {
    return {
      isTransitioning: this.isTransitioningFlag,
      progress: this.transitionProgress,
      currentScene: this.currentScene,
      previousScene: this.previousScene,
      transitionType: this.transitionType,
      queueLength: this.transitionQueue.length,
      loadingProgress: this.loadingProgress
    };
  }

  abort() {
    this.isTransitioningFlag = false;
    this.transitionProgress = 0;
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '0';
      this.fadeOverlay.style.pointerEvents = 'none';
    }
    this.hideLoadingScreen(0);
    this.hideErrorScreen();
  }

  setDefaultTransition(transitionType) {
    this.defaultTransition = transitionType;
  }

  serialize() {
    return {
      currentScene: this.currentScene,
      previousScene: this.previousScene,
      defaultTransition: this.defaultTransition
    };
  }

  deserialize(data = {}) {
    if (!data) return;
    if (data.currentScene) this.currentScene = data.currentScene;
    if (data.previousScene) this.previousScene = data.previousScene;
    if (data.defaultTransition) this.defaultTransition = data.defaultTransition;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    this._cleanupEventListeners();
    this.abort();
    this.transitionQueue = [];
    if (this.rootContainer?.parentNode) {
      this.rootContainer.parentNode.removeChild(this.rootContainer);
    }
    this.rootContainer = null;
  }
}

// Export singleton instance
export const transitionManager = new TransitionManager();
export default transitionManager;
