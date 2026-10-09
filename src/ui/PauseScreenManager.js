/**
 * PauseScreenManager - In-Game Pause Overlay & Interface System
 * 
 * Dark Forest Portfolio Game
 * Provides a dedicated, responsive pause screen interface featuring:
 * - Full-screen atmospheric translucent backdrop (rgba(0, 0, 0, 0.7))
 * - Golden glowing "PAUSED" title banner
 * - Centralized 500x450px main pause panel with Foundation blue border
 * - 6-button stack: Resume, Settings, Progress & Stats, Save & Continue, Quit to Menu, Quit to Desktop
 * - Cyan-themed Settings submenu (Audio sliders, Video toggles, Accessibility, Night Mode)
 * - Purple-themed Progress & Statistics overlay (Overall %, stage, time played, zones, NPCs, projects, achievements, easter eggs, badges)
 * - Modal confirmation dialogs for destructive actions (Quit to Menu, Quit to Desktop, Reset Settings)
 * - Complete keyboard shortcut bindings (ESC, SPACE, S, P, Ctrl+S, Q, Alt+F4, Arrows, Enter)
 */

import eventBus, { GAME_EVENTS, STATE_EVENTS, PROGRESS_EVENTS } from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import defaultSaveManager from '../storage/SaveManager.js';
import defaultProgressTracker from '../state/ProgressTracker.js';
import defaultAchievementSystem from '../state/AchievementSystem.js';
import defaultNightModeManager from '../effects/NightModeManager.js';
import defaultMenuSystem from './MenuSystem.js';
import defaultInputHandler, { INPUT_CONTEXTS } from '../input/InputHandler.js';

export const PAUSE_CONFIG = {
  overlay: {
    width: 1200,
    height: 800,
    color: 'rgba(0, 0, 0, 0.7)',
    fadeInDuration: 200,
    zIndex: 999
  },
  overlayColor: 'rgba(0, 0, 0, 0.7)',
  title: {
    text: 'PAUSED',
    fontSize: 48,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: 0xFFD700,
    colorHex: '#FFD700',
    topOffset: 100,
    fadeInDuration: 300
  },
  titleColor: '#FFD700',
  titleFontSize: '48px',
  mainPanel: {
    width: 500,
    height: 450,
    bgColor: 'rgba(26, 26, 46, 0.95)',
    borderHex: 0x4A90FF,
    borderColor: '#4A90FF', // Foundation Blue
    borderWidth: '3px',
    borderRadius: '8px',
    padding: '32px',
    scaleInDuration: 250
  },
  settingsPanel: {
    width: 600,
    height: 500,
    bgColor: 'rgba(26, 26, 46, 0.95)',
    borderHex: 0x00D9FF,
    borderColor: '#00D9FF', // Web Dev Cyan
    borderWidth: '3px',
    borderRadius: '8px',
    padding: '32px'
  },
  statsPanel: {
    width: 500,
    height: 550,
    bgColor: 'rgba(26, 26, 46, 0.95)',
    borderHex: 0xB300FF,
    borderColor: '#B300FF', // AI & ML Purple
    borderWidth: '3px',
    borderRadius: '8px',
    padding: '32px'
  },
  buttonHeight: 50,
  buttonSpacing: 12,
  buttons: [
    { id: 'resume', label: 'Resume Game', hotkey: 'ESC / SPACE', icon: '▶' },
    { id: 'settings', label: 'Settings', hotkey: 'S', icon: '⚙' },
    { id: 'stats', label: 'Progress & Stats', hotkey: 'P', icon: '📊' },
    { id: 'save', label: 'Save & Continue', hotkey: 'Ctrl+S', icon: '💾' },
    { id: 'quit-menu', label: 'Quit to Menu', hotkey: 'Q', icon: '⏮' },
    { id: 'quit-desktop', label: 'Quit to Desktop', hotkey: 'Alt+F4', icon: '⊗' }
  ],
  timings: {
    overlayFadeIn: 200,
    menuPanelScaleIn: 250,
    submenuFadeTransition: 300,
    buttonHoverTransition: 150
  }
};

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...tokens) { tokens.forEach(t => this._classes.add(t)); }
  remove(...tokens) { tokens.forEach(t => this._classes.delete(t)); }
  contains(token) { return this._classes.has(token); }
  has(token) { return this._classes.has(token); }
  toggle(token, force) {
    if (force !== undefined) {
      if (force) this.add(token);
      else this.remove(token);
      return force;
    }
    if (this.contains(token)) {
      this.remove(token);
      return false;
    }
    this.add(token);
    return true;
  }
  toString() { return Array.from(this._classes).join(' '); }
}

function parseMockHTMLTree(html, parent) {
  const root = parent || new NodeMockElement('root');
  const stack = [root];
  const tagRegex = /<\/?([a-zA-Z0-9\-]+)([^>]*)\/?>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const full = match[0];
    const tagName = match[1];
    const attrsStr = match[2];
    const textContent = match[3];

    if (textContent) {
      const current = stack[stack.length - 1];
      if (current && textContent.trim()) {
        current._textContent = (current._textContent || '') + textContent.trim();
      }
      continue;
    }

    if (full.startsWith('</')) {
      if (stack.length > 1) {
        stack.pop();
      }
      continue;
    }

    const el = new NodeMockElement(tagName);
    const currentParent = stack[stack.length - 1];
    el.parentNode = currentParent;
    currentParent.children.push(el);

    if (attrsStr) {
      const idMatch = /id=["']([^"']+)["']/.exec(attrsStr);
      if (idMatch) el.id = idMatch[1];

      const classMatch = /class=["']([^"']+)["']/.exec(attrsStr);
      if (classMatch) {
        classMatch[1].split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
      }

      if (/\bdisabled\b/.test(attrsStr)) el.disabled = true;
    }

    const isVoid = full.endsWith('/>') || ['input', 'br', 'hr', 'img'].includes(tagName.toLowerCase());
    if (!isVoid) {
      stack.push(el);
    }
  }

  return root.children;
}

class NodeMockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.classList = new MockClassList();
    this.listeners = {};
    this._innerHTML = '';
    this._textContent = '';
    this.parentNode = null;
    this.disabled = false;
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
    if (!val) return;
    this.children = parseMockHTMLTree(this._innerHTML, this);
  }

  get textContent() { return this._textContent; }
  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val);
  }

  appendChild(child) {
    if (child) {
      child.parentNode = this;
      this.children.push(child);
    }
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

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const lastSelector = selector.trim().split(/\s+/).pop();
    const results = [];
    const targetClass = lastSelector.startsWith('.') ? lastSelector.slice(1) : null;
    const targetId = lastSelector.startsWith('#') ? lastSelector.slice(1) : null;
    const targetTag = (!targetClass && !targetId) ? lastSelector.toUpperCase() : null;

    const traverse = (node) => {
      for (const child of node.children) {
        if (targetClass && child.classList.contains(targetClass)) results.push(child);
        else if (targetId && child.id === targetId) results.push(child);
        else if (targetTag && child.tagName === targetTag) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  addEventListener(type, cb) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }

  removeEventListener(type, cb) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(fn => fn !== cb);
  }

  click() {
    if (this.disabled) return;
    if (this.listeners['click']) {
      this.listeners['click'].forEach(fn => fn({ target: this, type: 'click' }));
    }
    if (typeof this.onclick === 'function') {
      this.onclick({ target: this, type: 'click' });
    }
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
}

export class PauseScreenManager {
  /**
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [menuSystem] - MenuSystem instance
   * @param {Object} [saveManager] - SaveManager instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [progressTracker] - ProgressTracker instance
   * @param {Object} [achievementSystem] - AchievementSystem instance
   * @param {Object} [nightModeManager] - NightModeManager instance
   * @param {Object} [inputHandler] - InputHandler instance
   */
  constructor(
    gameState = null,
    menuSystem = null,
    saveManager = null,
    eventBusRef = null,
    progressTracker = null,
    achievementSystem = null,
    nightModeManager = null,
    inputHandler = null
  ) {
    this.gameState = gameState || defaultGameState;
    this.menuSystem = menuSystem || defaultMenuSystem;
    this.saveManager = saveManager || defaultSaveManager;
    this.eventBus = eventBusRef || eventBus;
    this.progressTracker = progressTracker || defaultProgressTracker;
    this.achievementSystem = achievementSystem || defaultAchievementSystem;
    this.nightModeManager = nightModeManager || defaultNightModeManager;
    this.inputHandler = inputHandler || defaultInputHandler;

    this.scene = null;
    this.paused = false;

    // View state: 'main' | 'settings' | 'stats' | 'confirmation' | 'none'
    this.activeView = 'none';
    this.pendingConfirmation = null;

    // Keyboard navigation
    this.focusedButtonIndex = 0;
    this.currentButtons = [];

    // Root UI container DOM reference
    this.overlayContainer = null;
    this._unsubscribers = [];
    this._keyListener = null;
    this.settingsCache = {};
  }

  /**
   * Initializes the pause screen manager and connects runtime systems.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [menuSystem] - MenuSystem instance
   * @param {Object} [saveManager] - SaveManager instance
   * @param {Object} [options] - Optional system overrides (progressTracker, inputHandler, etc.)
   * @returns {PauseScreenManager}
   */
  create(scene = null, gameState = null, menuSystem = null, saveManager = null, options = {}) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;
    if (menuSystem) this.menuSystem = menuSystem;
    if (saveManager) this.saveManager = saveManager;
    if (options.progressTracker) this.progressTracker = options.progressTracker;
    if (options.inputHandler) this.inputHandler = options.inputHandler;
    if (options.achievementSystem) this.achievementSystem = options.achievementSystem;
    if (options.nightModeManager) this.nightModeManager = options.nightModeManager;

    this._setupDOMContainer();
    this._detachEventListeners();
    this._attachEventListeners();

    return this;
  }

  /**
   * Sets up or queries root DOM overlay for the pause interface.
   * @private
   */
  _setupDOMContainer() {
    if (typeof document !== 'undefined') {
      let root = document.getElementById('dark-forest-pause-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'dark-forest-pause-root';
        root.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 999;
          font-family: 'Cinzel', Georgia, 'Segoe UI', sans-serif;
          color: #ffffff;
        `;
        document.body.appendChild(root);
      }
      this.overlayContainer = root;
    } else {
      this.overlayContainer = new NodeMockElement('div');
      this.overlayContainer.id = 'dark-forest-pause-root';
    }
  }

  /**
   * Subscribes to keyboard events for shortcuts (ESC, SPACE, S, P, Ctrl+S, Q, Alt+F4, Arrows).
   * @private
   */
  _attachEventListeners() {
    this._keyListener = (e) => {
      const key = (e?.key || e?.code || '').toLowerCase();
      const isCtrl = Boolean(e?.ctrlKey || e?.metaKey);
      const isAlt = Boolean(e?.altKey);

      // 1. If not paused: ESC triggers pause
      if (!this.paused) {
        if (key === 'escape' || key === 'esc') {
          this.pause();
        }
        return;
      }

      // 2. If paused: handle submenu / modal escapes
      if (key === 'escape' || key === 'esc') {
        if (this.pendingConfirmation) {
          this._closeConfirmation();
        } else if (this.activeView === 'settings') {
          this.hideSettingsSubmenu();
        } else if (this.activeView === 'stats') {
          this.hideStatsOverlay();
        } else {
          this.onResumeClick();
        }
        return;
      }

      // 3. Submenu back shortcuts (B)
      if (key === 'b') {
        if (this.activeView === 'settings') {
          this.hideSettingsSubmenu();
          return;
        } else if (this.activeView === 'stats') {
          this.hideStatsOverlay();
          return;
        }
      }

      // 4. Main pause panel shortcuts (only if on main pause screen)
      if (this.activeView === 'main') {
        if (key === ' ' || key === 'space') {
          this.onResumeClick();
          return;
        }
        if (isCtrl && key === 's') {
          e?.preventDefault?.();
          this.onSaveClick();
          return;
        }
        if (key === 's') {
          this.onSettingsClick();
          return;
        }
        if (key === 'p') {
          this.onStatsClick();
          return;
        }
        if (key === 'q') {
          this.onQuitMenuClick();
          return;
        }
        if (isAlt && (key === 'f4' || key === 'q')) {
          e?.preventDefault?.();
          this.onQuitDesktopClick();
          return;
        }

        // Arrow navigation
        if (key === 'arrowup' || key === 'up') {
          this._navigateButtons('up');
        } else if (key === 'arrowdown' || key === 'down') {
          this._navigateButtons('down');
        } else if (key === 'enter') {
          this._navigateButtons('select');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyListener);
    }
  }

  /**
   * Detaches listeners.
   * @private
   */
  _detachEventListeners() {
    if (typeof window !== 'undefined' && this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
    }
    this._unsubscribers.forEach(u => u());
    this._unsubscribers = [];
  }

  // =========================================================================
  // PAUSE / UNPAUSE STATE MANAGEMENT
  // =========================================================================

  /**
   * Triggers the pause state: freezes time, lowers audio volume, and displays overlay.
   */
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.activeView = 'main';
    this.pendingConfirmation = null;

    // Freeze game loop / physics
    if (this.scene?.physics?.pause) {
      this.scene.physics.pause();
    }

    // Lower audio volume to 30% (save previous volume)
    if (this.scene?.sound) {
      this._savedAudioVolume = typeof this.scene.sound.volume === 'number' ? this.scene.sound.volume : 1.0;
      if (typeof this.scene.sound.setVolume === 'function') {
        this.scene.sound.setVolume(0.3);
      }
    }

    // Lock game movement input
    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.MENU);
    }

    this._renderMainPauseView();

    this.eventBus.emit('gamePaused', {});
    this.eventBus.emit('pauseScreenOpened', {});
  }

  /**
   * Resumes gameplay: restores time, audio volume, and dismisses overlay.
   */
  unpause() {
    if (!this.paused) return;
    this.paused = false;
    this.activeView = 'none';
    this.pendingConfirmation = null;

    // Restore physics / time
    if (this.scene?.physics?.resume) {
      this.scene.physics.resume();
    }

    // Restore audio volume
    if (this.scene?.sound?.setVolume) {
      const targetVol = this._savedAudioVolume ?? this.menuSystem?.settings?.audio?.master ?? 1.0;
      this.scene.sound.setVolume(targetVol);
    }

    // Restore game movement input
    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.GAMEPLAY);
    }

    this._clearOverlay();

    this.eventBus.emit('gameResumed', {});
    this.eventBus.emit('pauseScreenClosed', {});
  }

  /**
   * Flips current pause state.
   */
  togglePause() {
    if (this.paused) {
      this.unpause();
    } else {
      this.pause();
    }
  }

  /**
   * Checks whether the game is currently paused.
   * @returns {boolean}
   */
  isPaused() {
    return this.paused;
  }

  isSettingsOpen() {
    return this.activeView === 'settings';
  }

  isStatsOpen() {
    return this.activeView === 'stats';
  }

  isConfirmationOpen() {
    return this.activeView === 'confirmation';
  }

  getActiveModal() {
    return this.pendingConfirmation;
  }

  getFocusedButtonIndex() {
    return this.focusedButtonIndex;
  }

  dismissConfirmation(confirm = false, payload = null) {
    if (!this.pendingConfirmation) return;
    const { onConfirm, onCancel } = this.pendingConfirmation;
    this._closeConfirmation();
    if (confirm) {
      if (typeof onConfirm === 'function') onConfirm(payload);
    } else {
      if (typeof onCancel === 'function') onCancel();
    }
  }

  handleKeyDown(e) {
    if (typeof this._keyListener === 'function') {
      this._keyListener(e);
    }
  }

  // =========================================================================
  // MAIN PAUSE MENU VIEW
  // =========================================================================

  /**
   * Renders the 500x450px main pause panel with title and button stack.
   * @private
   */
  _renderMainPauseView() {
    this.overlayContainer.innerHTML = `
      <div id="df-pause-backdrop" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: ${PAUSE_CONFIG.overlayColor}; backdrop-filter: blur(4px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; opacity: 1; transition: opacity 0.2s ease;
      ">
        <h1 style="
          font-size: ${PAUSE_CONFIG.titleFontSize}; color: ${PAUSE_CONFIG.titleColor};
          margin: 0 0 24px 0; text-shadow: 0 0 20px rgba(255, 215, 0, 0.75), 0 4px 10px rgba(0,0,0,0.8);
          letter-spacing: 4px; font-weight: bold;
        ">PAUSED</h1>

        <div id="df-pause-panel" style="
          width: ${PAUSE_CONFIG.mainPanel.width}px;
          min-height: ${PAUSE_CONFIG.mainPanel.height}px;
          background: ${PAUSE_CONFIG.mainPanel.bgColor};
          border: ${PAUSE_CONFIG.mainPanel.borderWidth} solid ${PAUSE_CONFIG.mainPanel.borderColor};
          border-radius: 8px; padding: 32px; box-sizing: border-box;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
          display: flex; flex-direction: column; gap: ${PAUSE_CONFIG.buttonSpacing}px;
          transform: scale(1.0); transition: transform 0.25s ease;
        ">
          <button id="btn-pause-resume" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">▶ Resume Game <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[ESC / SPACE]</span></button>

          <button id="btn-pause-settings" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">⚙ Settings <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[S]</span></button>

          <button id="btn-pause-stats" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">📊 Progress & Stats <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[P]</span></button>

          <button id="btn-pause-save" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">💾 Save & Continue <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[Ctrl+S]</span></button>

          <button id="btn-pause-quit-menu" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">⏮ Quit to Menu <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[Q]</span></button>

          <button id="btn-pause-quit-desktop" class="df-pause-btn" style="
            height: ${PAUSE_CONFIG.buttonHeight}px; font-size: 16px; font-family: inherit;
            background: transparent; border: 2px solid rgba(255, 255, 255, 0.3);
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">⊗ Quit to Desktop <span style="font-size: 11px; color: #a0b0c0; margin-left: 6px;">[Alt+F4]</span></button>
        </div>
      </div>
    `;

    this._bindButton('btn-pause-resume', () => this.onResumeClick());
    this._bindButton('btn-pause-settings', () => this.onSettingsClick());
    this._bindButton('btn-pause-stats', () => this.onStatsClick());
    this._bindButton('btn-pause-save', () => this.onSaveClick());
    this._bindButton('btn-pause-quit-menu', () => this.onQuitMenuClick());
    this._bindButton('btn-pause-quit-desktop', () => this.onQuitDesktopClick());

    this._setupButtonCollection('#df-pause-panel .df-pause-btn');
  }

  // =========================================================================
  // BUTTON ACTIONS
  // =========================================================================

  onResumeClick() {
    this.unpause();
  }

  onSettingsClick() {
    this.showSettingsSubmenu();
  }

  onStatsClick() {
    this.showStatsOverlay();
  }

  onSaveClick() {
    const success = Boolean(this.saveManager?.save?.(this.gameState, this.scene?.player || {}));
    if (success) {
      this.eventBus.emit('gameSaved', { timestamp: Date.now() });
      if (typeof window !== 'undefined') {
        const btn = document.getElementById('btn-pause-save');
        if (btn) {
          btn.innerHTML = '💾 Saved!';
          btn.style.borderColor = '#00FF66';
          btn.style.color = '#00FF66';
        }
      }
    }
    // Save & Continue resumes gameplay
    this.unpause();
    return success;
  }

  onQuitMenuClick() {
    this.showConfirmationDialog('quit-menu', (saveFirst) => {
      if (saveFirst) {
        this.saveManager?.save?.(this.gameState, this.scene?.player || {});
      }
      this.unpause();
      if (this.menuSystem?.showMainMenu) {
        this.menuSystem.showMainMenu();
      }
      this.eventBus.emit('quitToMainMenu', {});
    });
  }

  onQuitDesktopClick() {
    this.showConfirmationDialog('quit-desktop', (saveFirst) => {
      if (saveFirst) {
        this.saveManager?.save?.(this.gameState, this.scene?.player || {});
      }
      if (typeof window !== 'undefined') {
        window.location.href = 'about:blank';
      }
    });
  }

  // =========================================================================
  // SETTINGS SUBMENU (600x500px, Cyan border)
  // =========================================================================

  /**
   * Displays the 600x500px settings submenu panel with cyan tech border.
   */
  showSettingsSubmenu() {
    this.activeView = 'settings';
    const settings = this.menuSystem?.settings || {
      audio: { master: 0.7, music: 0.6, sfx: 0.8, ambience: 0.5, mute: false },
      video: { brightness: 1.0, glowIntensity: 1.0, particleDensity: 'medium', displayFps: false },
      gameplay: { hints: 'medium', cameraSpeed: 1.0 },
      accessibility: { textSize: 'normal', highContrast: false, colorblind: 'off' },
      special: { nightMode: false }
    };

    const nightModeUnlocked = Boolean(
      this.nightModeManager?.isNightModeUnlocked?.() ||
      this.gameState?.easterEggsFound?.includes?.('nightmode') ||
      this.gameState?.unlocks?.nightModeUnlocked
    );

    this.overlayContainer.innerHTML = `
      <div id="df-settings-backdrop" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: ${PAUSE_CONFIG.overlayColor}; backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; pointer-events: auto;
      ">
        <div id="df-settings-panel" style="
          width: ${PAUSE_CONFIG.settingsPanel.width}px;
          max-height: ${PAUSE_CONFIG.settingsPanel.height}px;
          background: ${PAUSE_CONFIG.settingsPanel.bgColor};
          border: ${PAUSE_CONFIG.settingsPanel.borderWidth} solid ${PAUSE_CONFIG.settingsPanel.borderColor};
          border-radius: 8px; padding: 28px 32px; box-sizing: border-box; overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #00D9FF; font-size: 26px; letter-spacing: 2px;">SETTINGS</h2>
            <button id="btn-settings-close-top" style="background: none; border: none; color: #a0b0c0; font-size: 20px; cursor: pointer;">✕</button>
          </div>

          <!-- Audio -->
          <div style="margin-bottom: 18px;">
            <h3 style="color: #4A90FF; font-size: 15px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">Audio</h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Master Volume:</label>
              <input type="range" id="slider-vol-master" min="0" max="100" value="${Math.round((settings.audio.master || 0.7) * 100)}" />
              <span id="lbl-vol-master">${Math.round((settings.audio.master || 0.7) * 100)}%</span>

              <label>Music Volume:</label>
              <input type="range" id="slider-vol-music" min="0" max="100" value="${Math.round((settings.audio.music || 0.6) * 100)}" />
              <span id="lbl-vol-music">${Math.round((settings.audio.music || 0.6) * 100)}%</span>

              <label>SFX Volume:</label>
              <input type="range" id="slider-vol-sfx" min="0" max="100" value="${Math.round((settings.audio.sfx || 0.8) * 100)}" />
              <span id="lbl-vol-sfx">${Math.round((settings.audio.sfx || 0.8) * 100)}%</span>

              <label>Ambience Volume:</label>
              <input type="range" id="slider-vol-ambience" min="0" max="100" value="${Math.round((settings.audio.ambience || 0.5) * 100)}" />
              <span id="lbl-vol-ambience">${Math.round((settings.audio.ambience || 0.5) * 100)}%</span>

              <label>Mute All:</label>
              <div><input type="checkbox" id="chk-mute" ${settings.audio.mute ? 'checked' : ''} /></div>
              <span></span>
            </div>
          </div>

          <!-- Video -->
          <div style="margin-bottom: 18px;">
            <h3 style="color: #00D9FF; font-size: 15px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">Video & Visuals</h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Brightness:</label>
              <input type="range" id="slider-brightness" min="50" max="150" value="${Math.round((settings.video.brightness || 1.0) * 100)}" />
              <span id="lbl-brightness">${(settings.video.brightness || 1.0).toFixed(1)}x</span>

              <label>Glow Intensity:</label>
              <input type="range" id="slider-glow" min="50" max="150" value="${Math.round((settings.video.glowIntensity || 1.0) * 100)}" />
              <span id="lbl-glow">${(settings.video.glowIntensity || 1.0).toFixed(1)}x</span>

              <label>Particle Density:</label>
              <select id="sel-particles" style="background: #141a2e; color: #fff; border: 1px solid #00D9FF; padding: 4px; border-radius: 4px;">
                <option value="low" ${settings.video.particleDensity === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${settings.video.particleDensity === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${settings.video.particleDensity === 'high' ? 'selected' : ''}>High</option>
              </select>
              <span></span>

              <label>Display FPS:</label>
              <div><input type="checkbox" id="chk-fps" ${settings.video.displayFps ? 'checked' : ''} /></div>
              <span></span>
            </div>
          </div>

          <!-- Accessibility & Special -->
          <div style="margin-bottom: 22px;">
            <h3 style="color: #00FF66; font-size: 15px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">Accessibility & Special</h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Text Size:</label>
              <select id="sel-text-size" style="background: #141a2e; color: #fff; border: 1px solid #00FF66; padding: 4px; border-radius: 4px;">
                <option value="small" ${settings.accessibility.textSize === 'small' ? 'selected' : ''}>Small</option>
                <option value="normal" ${settings.accessibility.textSize === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="large" ${settings.accessibility.textSize === 'large' ? 'selected' : ''}>Large</option>
              </select>
              <span></span>

              <label>Colorblind Mode:</label>
              <select id="sel-colorblind" style="background: #141a2e; color: #fff; border: 1px solid #00FF66; padding: 4px; border-radius: 4px;">
                <option value="off" ${settings.accessibility.colorblind === 'off' ? 'selected' : ''}>Off</option>
                <option value="deuteranopia" ${settings.accessibility.colorblind === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option>
                <option value="protanopia" ${settings.accessibility.colorblind === 'protanopia' ? 'selected' : ''}>Protanopia</option>
                <option value="tritanopia" ${settings.accessibility.colorblind === 'tritanopia' ? 'selected' : ''}>Tritanopia</option>
              </select>
              <span></span>

              <label>Night Mode:</label>
              <div>
                <input type="checkbox" id="chk-night-mode" ${!nightModeUnlocked ? 'disabled' : ''} ${settings.special.nightMode ? 'checked' : ''} />
                <span style="font-size: 11px; color: ${nightModeUnlocked ? '#00FF66' : '#888899'}; margin-left: 6px;">
                  ${nightModeUnlocked ? 'Unlocked' : '(Portal required)'}
                </span>
              </div>
              <span></span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button id="btn-settings-reset" style="
              padding: 8px 16px; font-size: 13px; font-family: inherit;
              background: rgba(40, 20, 30, 0.85); border: 1px solid #e74c3c;
              color: #ff9999; border-radius: 4px; cursor: pointer;
            ">Reset Defaults</button>

            <button id="btn-settings-back" style="
              padding: 8px 24px; font-size: 14px; font-family: inherit;
              background: rgba(30, 42, 74, 0.85); border: 1px solid #00D9FF;
              color: #ffffff; border-radius: 4px; cursor: pointer;
            ">Back [ESC]</button>
          </div>
        </div>
      </div>
    `;

    // Bind settings actions
    this._bindSlider('slider-vol-master', 'lbl-vol-master', (val) => this.applyAudioSetting('master', val / 100));
    this._bindSlider('slider-vol-music', 'lbl-vol-music', (val) => this.applyAudioSetting('music', val / 100));
    this._bindSlider('slider-vol-sfx', 'lbl-vol-sfx', (val) => this.applyAudioSetting('sfx', val / 100));
    this._bindSlider('slider-vol-ambience', 'lbl-vol-ambience', (val) => this.applyAudioSetting('ambience', val / 100));

    this._bindSlider('slider-brightness', 'lbl-brightness', (val) => this.applyVideoSetting('brightness', val / 100), 'x');
    this._bindSlider('slider-glow', 'lbl-glow', (val) => this.applyVideoSetting('glow', val / 100), 'x');

    this._bindCheckbox('chk-night-mode', (checked) => {
      if (this.menuSystem?.setNightMode) {
        this.menuSystem.setNightMode(checked);
      }
    });

    this._bindButton('btn-settings-reset', () => {
      this.showConfirmationDialog('reset', () => {
        this.menuSystem?.resetAllSettings?.();
        this.showSettingsSubmenu();
      });
    });

    this._bindButton('btn-settings-back', () => this.hideSettingsSubmenu());
    this._bindButton('btn-settings-close-top', () => this.hideSettingsSubmenu());
  }

  hideSettingsSubmenu() {
    this.activeView = 'main';
    this._renderMainPauseView();
  }

  // =========================================================================
  // STATS OVERLAY (500x550px, Purple border)
  // =========================================================================

  /**
   * Displays the 500x550px progress & statistics overlay with purple border.
   */
  showStatsOverlay() {
    this.activeView = 'stats';

    const progStats = this.progressTracker?.getCompletionStats?.() || {
      overallProgress: this.gameState?.gameProgress || 0,
      currentStage: 'Experienced Developer',
      categories: {
        exploration: { discovered: 3, total: 4 },
        npcs: { metCount: 4, total: 5 },
        projects: { clickedCount: 5, total: 6 },
        achievements: { unlockedCount: 6, total: 8 }
      },
      timePlayedMinutes: 83
    };

    const exp = progStats.categories?.exploration || { discovered: 3, total: 4 };
    const npc = progStats.categories?.npcs || { metCount: 4, total: 5 };
    const proj = progStats.categories?.projects || { clickedCount: 5, total: 6 };
    const ach = progStats.categories?.achievements || { unlockedCount: 6, total: 8 };
    const eggsCount = (this.gameState?.easterEggsFound || []).length;

    const hours = Math.floor((progStats.timePlayedMinutes || 0) / 60);
    const mins = (progStats.timePlayedMinutes || 0) % 60;
    const timeDisplay = `${hours}h ${mins}m`;

    const nextMilestone = this.progressTracker?.getMilestoneProgress?.()?.nextMilestone || '50% Completion';

    // Achievement badges preview
    const badges = [
      { name: 'First Steps', icon: '👣' },
      { name: 'Growing Explorer', icon: '🌱' },
      { name: 'Experienced Developer', icon: '🛠️' },
      { name: 'Summit Seeker', icon: '⛰️' },
      { name: 'Polymath', icon: '🧠' },
      { name: 'Connector', icon: '👥' },
      { name: 'Deep Learner', icon: '📚' },
      { name: 'Night Explorer', icon: '🌙' }
    ];

    this.overlayContainer.innerHTML = `
      <div id="df-stats-backdrop" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: ${PAUSE_CONFIG.overlayColor}; backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; pointer-events: auto;
      ">
        <div id="df-stats-panel" style="
          width: ${PAUSE_CONFIG.statsPanel.width}px;
          max-height: ${PAUSE_CONFIG.statsPanel.height}px;
          background: ${PAUSE_CONFIG.statsPanel.bgColor};
          border: ${PAUSE_CONFIG.statsPanel.borderWidth} solid ${PAUSE_CONFIG.statsPanel.borderColor};
          border-radius: 8px; padding: 28px 32px; box-sizing: border-box; overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h2 style="margin: 0; color: #B300FF; font-size: 26px; letter-spacing: 2px;">Progress & Statistics</h2>
            <button id="btn-stats-close-top" style="background: none; border: none; color: #a0b0c0; font-size: 20px; cursor: pointer;">✕</button>
          </div>

          <!-- Overall -->
          <div style="text-align: center; margin-bottom: 20px; background: rgba(15, 20, 36, 0.6); padding: 12px; border-radius: 6px;">
            <div style="font-size: 36px; font-weight: bold; color: #ffffff;">${progStats.overallProgress}%</div>
            <div style="color: #4A90FF; font-size: 14px; margin-top: 2px;">${progStats.currentStage}</div>
            <div style="color: #a0b0c0; font-size: 12px; margin-top: 4px;">Time Played: ${timeDisplay}</div>
          </div>

          <!-- Discovery Metrics -->
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #b0c4de;">🗺️ Zones Discovered:</span>
              <span style="font-weight: bold;">${exp.discovered}/${exp.total}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #b0c4de;">👥 NPCs Met:</span>
              <span style="font-weight: bold;">${npc.metCount}/${npc.total}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #b0c4de;">💼 Projects Viewed:</span>
              <span style="font-weight: bold;">${proj.clickedCount}/${proj.total}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #b0c4de;">🏆 Achievements Unlocked:</span>
              <span style="font-weight: bold;">${ach.unlockedCount}/${ach.total}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #b0c4de;">✨ Easter Eggs Found:</span>
              <span style="font-weight: bold;">${eggsCount}/5</span>
            </div>
          </div>

          <!-- Next Milestone -->
          <div style="margin-bottom: 20px; font-size: 12px; color: #FFD700; background: rgba(255, 215, 0, 0.1); padding: 8px 12px; border-radius: 4px;">
            Next Milestone: <strong>${nextMilestone}</strong>
          </div>

          <!-- Badges -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 13px; color: #b0c4de; margin-bottom: 8px;">Badges Earned:</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${badges.map(b => `
                <div title="${b.name}" style="
                  font-size: 22px; background: rgba(30, 40, 70, 0.8);
                  padding: 6px 10px; border-radius: 6px; border: 1px solid #4A90FF; cursor: default;
                ">${b.icon}</div>
              `).join('')}
            </div>
          </div>

          <div style="text-align: right;">
            <button id="btn-stats-back" style="
              padding: 8px 24px; font-size: 14px; font-family: inherit;
              background: rgba(30, 42, 74, 0.85); border: 1px solid #B300FF;
              color: #ffffff; border-radius: 4px; cursor: pointer;
            ">Back [ESC]</button>
          </div>
        </div>
      </div>
    `;

    this._bindButton('btn-stats-back', () => this.hideStatsOverlay());
    this._bindButton('btn-stats-close-top', () => this.hideStatsOverlay());
  }

  hideStatsOverlay() {
    this.activeView = 'main';
    this._renderMainPauseView();
  }

  // =========================================================================
  // CONFIRMATION DIALOGS
  // =========================================================================

  /**
   * Displays a confirmation modal dialog before destructive actions.
   * 
   * @param {'quit-menu'|'quit-desktop'|'reset'} type
   * @param {Function} onConfirm - Callback if confirmed
   * @param {Function} [onCancel] - Callback if cancelled
   */
  showConfirmationDialog(type, onConfirm, onCancel = null) {
    this.activeView = 'confirmation';
    this.pendingConfirmation = { type, onConfirm, onCancel };

    let titleText = 'Confirm Action';
    let promptText = 'Are you sure?';
    let buttonsHtml = '';

    if (type === 'quit-menu') {
      titleText = 'Quit to Main Menu';
      promptText = 'Save progress before returning to menu?';
      buttonsHtml = `
        <button id="btn-modal-save-quit" style="padding: 8px 16px; background: #27ae60; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Save & Quit</button>
        <button id="btn-modal-nosave-quit" style="padding: 8px 16px; background: #e74c3c; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Quit Without Saving</button>
        <button id="btn-modal-cancel" style="padding: 8px 16px; background: #555566; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
      `;
    } else if (type === 'quit-desktop') {
      titleText = 'Quit to Desktop';
      promptText = 'Save progress before closing application?';
      buttonsHtml = `
        <button id="btn-modal-save-quit" style="padding: 8px 16px; background: #27ae60; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Save & Quit</button>
        <button id="btn-modal-nosave-quit" style="padding: 8px 16px; background: #e74c3c; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Quit Without Saving</button>
        <button id="btn-modal-cancel" style="padding: 8px 16px; background: #555566; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
      `;
    } else if (type === 'reset') {
      titleText = 'Reset Settings';
      promptText = 'Reset all settings to defaults?';
      buttonsHtml = `
        <button id="btn-modal-confirm-reset" style="padding: 8px 20px; background: #e74c3c; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Reset</button>
        <button id="btn-modal-cancel" style="padding: 8px 20px; background: #555566; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
      `;
    }

    this.overlayContainer.innerHTML = `
      <div id="df-confirm-backdrop" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; pointer-events: auto;
      ">
        <div style="
          background: rgba(20, 26, 46, 0.98); border: 2px solid #e74c3c;
          border-radius: 8px; width: 440px; padding: 24px 28px; text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        ">
          <h3 style="margin: 0 0 12px 0; color: #ff9999; font-size: 20px;">${titleText}</h3>
          <p style="font-size: 14px; color: #d0e0f0; margin-bottom: 24px;">${promptText}</p>
          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            ${buttonsHtml}
          </div>
        </div>
      </div>
    `;

    this._bindButton('btn-modal-save-quit', () => {
      this._closeConfirmation();
      if (typeof onConfirm === 'function') onConfirm(true); // save = true
    });

    this._bindButton('btn-modal-nosave-quit', () => {
      this._closeConfirmation();
      if (typeof onConfirm === 'function') onConfirm(false); // save = false
    });

    this._bindButton('btn-modal-confirm-reset', () => {
      this._closeConfirmation();
      if (typeof onConfirm === 'function') onConfirm();
    });

    this._bindButton('btn-modal-cancel', () => {
      this._closeConfirmation();
      if (typeof onCancel === 'function') onCancel();
    });
  }

  _closeConfirmation() {
    this.pendingConfirmation = null;
    this.activeView = 'main';
    this._renderMainPauseView();
  }

  // =========================================================================
  // SETTINGS SETTERS
  // =========================================================================

  applyAudioSetting(type, value) {
    this.settingsCache[`audio.${type}`] = value;
    if (this.menuSystem?.setVolume) {
      this.menuSystem.setVolume(type, value);
    } else if (this.menuSystem?.updateSetting) {
      this.menuSystem.updateSetting(`audio.${type}`, value);
    }
  }

  applyVideoSetting(type, value) {
    this.settingsCache[`video.${type}`] = value;
    if (type === 'brightness' && this.menuSystem?.setBrightness) {
      this.menuSystem.setBrightness(value);
    } else if (this.menuSystem?.updateSetting) {
      this.menuSystem.updateSetting(`video.${type}`, value);
    }
  }

  applyAccessibilitySetting(type, value) {
    this.settingsCache[`accessibility.${type}`] = value;
    if (type === 'colorblind' && this.menuSystem?.setColorblindMode) {
      this.menuSystem.setColorblindMode(value);
    } else if (this.menuSystem?.updateSetting) {
      this.menuSystem.updateSetting(`accessibility.${type}`, value);
    }
  }

  getEffectiveSetting(path) {
    if (this.settingsCache[path] !== undefined) {
      return this.settingsCache[path];
    }
    const [section, prop] = path.split('.');
    const sysSettings = this.menuSystem?.getSettings?.() || this.menuSystem?.settings;
    if (sysSettings && sysSettings[section]) {
      return sysSettings[section][prop];
    }
    return undefined;
  }

  updateStatsDisplay(progressData) {
    if (this.activeView === 'stats') {
      this.showStatsOverlay();
    }
  }

  // =========================================================================
  // KEYBOARD NAVIGATION
  // =========================================================================

  _setupButtonCollection(selector) {
    this.currentButtons = Array.from(this.overlayContainer.querySelectorAll(selector));
    this.focusedButtonIndex = 0;
    this._highlightFocusedButton();
  }

  _navigateButtons(dir) {
    if (!this.currentButtons || this.currentButtons.length === 0) return;

    if (dir === 'down') {
      this.focusedButtonIndex = (this.focusedButtonIndex + 1) % this.currentButtons.length;
      this._highlightFocusedButton();
    } else if (dir === 'up') {
      this.focusedButtonIndex = (this.focusedButtonIndex - 1 + this.currentButtons.length) % this.currentButtons.length;
      this._highlightFocusedButton();
    } else if (dir === 'select') {
      const btn = this.currentButtons[this.focusedButtonIndex];
      if (btn && typeof btn.click === 'function') {
        btn.click();
      }
    }
  }

  _highlightFocusedButton() {
    this.currentButtons.forEach((btn, idx) => {
      if (idx === this.focusedButtonIndex) {
        btn.style.borderColor = '#FFD700';
        btn.style.background = 'rgba(74, 144, 255, 0.2)';
        btn.style.transform = 'scale(1.02)';
      } else {
        btn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        btn.style.background = 'transparent';
        btn.style.transform = 'scale(1.0)';
      }
    });
  }

  // =========================================================================
  // DOM HELPERS
  // =========================================================================

  _clearOverlay() {
    this.overlayContainer.innerHTML = '';
  }

  _bindButton(id, cb) {
    const el = this.overlayContainer.querySelector(`#${id}`);
    if (el) {
      el.addEventListener('click', cb);
    }
  }

  _bindSlider(sliderId, labelId, cb, suffix = '%') {
    const slider = this.overlayContainer.querySelector(`#${sliderId}`);
    const label = this.overlayContainer.querySelector(`#${labelId}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (label) {
          label.textContent = suffix === 'x' ? (val / 100).toFixed(1) + suffix : `${val}${suffix}`;
        }
        cb(val);
      });
    }
  }

  _bindCheckbox(id, cb) {
    const chk = this.overlayContainer.querySelector(`#${id}`);
    if (chk) {
      chk.addEventListener('change', (e) => cb(Boolean(e.target.checked)));
    }
  }

  /**
   * Cleans up all DOM trees and listeners.
   */
  destroy() {
    if (this.paused) {
      this.unpause();
    }
    this._detachEventListeners();
    if (this.overlayContainer?.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
    }
    this.overlayContainer = null;
    this.activeView = 'none';
    this.pendingConfirmation = null;
  }
}

// Export singleton instance
export const pauseScreenManager = new PauseScreenManager();
export default pauseScreenManager;
