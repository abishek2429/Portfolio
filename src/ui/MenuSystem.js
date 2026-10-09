/**
 * MenuSystem - Main Menu, Pause Overlay, Settings & Stats System
 * 
 * Dark Forest Portfolio Game
 * Provides a cohesive UI system for:
 * - Title screen with glowing logo and sequential button animations
 * - Pause overlay with semi-transparent backdrop and game freeze
 * - Deep Settings submenu (Audio, Video, Gameplay, Accessibility, Night Mode)
 * - Real-time Exploration Stats screen (Progress %, zones, NPCs, projects, achievements, time played)
 * - Game state persistence, New Game, Continue, and keyboard navigation (ESC, Arrows, Enter)
 */

import eventBus, { GAME_EVENTS, STATE_EVENTS, PROGRESS_EVENTS } from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import defaultSaveManager from '../storage/SaveManager.js';
import defaultProgressTracker from '../state/ProgressTracker.js';
import defaultAchievementSystem from '../state/AchievementSystem.js';
import defaultNightModeManager from '../effects/NightModeManager.js';
import defaultInputHandler, { INPUT_CONTEXTS } from '../input/InputHandler.js';

export const SETTINGS_STORAGE_KEY = 'dark_forest_user_settings';

export const DEFAULT_SETTINGS = {
  audio: {
    master: 0.7,
    music: 0.6,
    sfx: 0.8,
    ambience: 0.5,
    mute: false
  },
  video: {
    brightness: 1.0,
    glowIntensity: 1.0,
    particleDensity: 'medium', // 'low' | 'medium' | 'high'
    motionBlur: false,
    displayFps: false
  },
  gameplay: {
    difficulty: 'normal', // 'easy' | 'normal' | 'hard'
    hints: 'medium', // 'low' | 'medium' | 'high'
    cameraSpeed: 1.0
  },
  accessibility: {
    textSize: 'normal', // 'small' | 'normal' | 'large'
    highContrast: false,
    colorblind: 'off', // 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia'
    font: 'sans-serif' // 'serif' | 'sans-serif'
  },
  special: {
    nightMode: false
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

  _collectAll(selector, results) {
    if (selector.startsWith('.') && this.classList.contains(selector.slice(1))) {
      results.push(this);
    }
    for (const child of this.children) {
      if (child._collectAll) child._collectAll(selector, results);
    }
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

export class MenuSystem {
  /**
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [saveManager] - SaveManager instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [progressTracker] - ProgressTracker instance
   * @param {Object} [achievementSystem] - AchievementSystem instance
   * @param {Object} [nightModeManager] - NightModeManager instance
   * @param {Object} [inputHandler] - InputHandler instance
   */
  constructor(
    gameState = null,
    saveManager = null,
    eventBusRef = null,
    progressTracker = null,
    achievementSystem = null,
    nightModeManager = null,
    inputHandler = null
  ) {
    this.gameState = gameState || defaultGameState;
    this.saveManager = saveManager || defaultSaveManager;
    this.eventBus = eventBusRef || eventBus;
    this.progressTracker = progressTracker || defaultProgressTracker;
    this.achievementSystem = achievementSystem || defaultAchievementSystem;
    this.nightModeManager = nightModeManager || defaultNightModeManager;
    this.inputHandler = inputHandler || defaultInputHandler;

    this.scene = null;

    // Menu View State
    this.mainMenuVisible = false;
    this.pauseMenuVisible = false;
    this.settingsVisible = false;
    this.statsVisible = false;
    this.aboutVisible = false;
    this.currentMenu = 'none'; // 'main' | 'pause' | 'settings' | 'stats' | 'about' | 'none'
    this.settingsReturnTarget = 'main'; // Target when closing settings

    // Keyboard navigation
    this.focusedButtonIndex = 0;
    this.currentButtons = [];

    // Settings repository
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    // Root UI container DOM reference
    this.rootContainer = null;
    this._unsubscribers = [];
    this._keyDownHandler = null;

    // Load persisted settings
    this.loadSettings();
  }

  /**
   * Initializes the menu system and binds input/event hooks.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [saveManager] - SaveManager instance
   * @param {Object} [options={}] - Extra configurations
   * @returns {MenuSystem}
   */
  create(scene = null, gameState = null, saveManager = null, options = {}) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;
    if (saveManager) this.saveManager = saveManager;
    if (options.progressTracker) this.progressTracker = options.progressTracker;
    if (options.nightModeManager) this.nightModeManager = options.nightModeManager;
    if (options.inputHandler) this.inputHandler = options.inputHandler;

    this._setupDOMContainer();
    this._detachEventListeners();
    this._attachEventListeners();
    this._setupKeyboardNavigation();

    // Check if initial screen should be main menu
    if (options.showInitialMenu !== false && !this.saveManager?.hasSavedGame?.()) {
      // Prepared for game start
    }

    return this;
  }

  /**
   * Sets up or queries root DOM overlay for menus.
   * @private
   */
  _setupDOMContainer() {
    if (typeof document !== 'undefined') {
      let root = document.getElementById('dark-forest-menu-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'dark-forest-menu-root';
        root.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 10000;
          font-family: 'Cinzel', Georgia, 'Segoe UI', sans-serif;
          color: #ffffff;
        `;
        document.body.appendChild(root);
      }
      this.rootContainer = root;
    } else {
      this.rootContainer = new NodeMockElement('div');
      this.rootContainer.id = 'dark-forest-menu-root';
    }
  }

  /**
   * Attaches event listeners to EventBus and InputHandler.
   * @private
   */
  _attachEventListeners() {
    // Escape key pause toggle
    this._keyDownHandler = (e) => {
      const key = (e?.key || e?.code || '').toLowerCase();
      if (key === 'escape' || key === 'esc') {
        if (this.currentMenu === 'settings') {
          this.hideSettingsMenu();
        } else if (this.currentMenu === 'stats') {
          this.hideStatsScreen();
        } else if (this.currentMenu === 'about') {
          this.hideAboutScreen();
        } else if (!this.mainMenuVisible) {
          this.togglePauseMenu();
        }
      } else if (key === 'arrowup' || key === 'up') {
        this.navigateMenu('up');
      } else if (key === 'arrowdown' || key === 'down') {
        this.navigateMenu('down');
      } else if (key === 'enter' || key === 'space' || key === ' ') {
        this.navigateMenu('select');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyDownHandler);
    }
  }

  /**
   * Detaches event listeners.
   * @private
   */
  _detachEventListeners() {
    if (typeof window !== 'undefined' && this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
    }
    this._unsubscribers.forEach(u => u());
    this._unsubscribers = [];
  }

  /**
   * Sets up keyboard navigation hooks.
   * @private
   */
  _setupKeyboardNavigation() {
    this.focusedButtonIndex = 0;
  }

  // =========================================================================
  // MAIN MENU
  // =========================================================================

  /**
   * Displays the title screen main menu.
   */
  showMainMenu() {
    this.mainMenuVisible = true;
    this.pauseMenuVisible = false;
    this.settingsVisible = false;
    this.statsVisible = false;
    this.aboutVisible = false;
    this.currentMenu = 'main';

    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.MENU);
    }

    const hasSave = Boolean(this.saveManager?.hasSavedGame?.());

    this.rootContainer.innerHTML = `
      <div id="df-main-menu" class="df-menu-overlay" style="
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(circle at center, rgba(15, 20, 36, 0.94) 0%, rgba(5, 8, 16, 0.98) 100%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; opacity: 1; transition: opacity 0.5s ease;
      ">
        <div style="text-align: center; margin-bottom: 36px;">
          <h1 style="
            font-size: 52px; font-weight: bold; margin: 0;
            color: #ffffff; text-shadow: 0 0 20px rgba(74, 144, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.5);
            letter-spacing: 2px;
          ">Dark Forest Portfolio</h1>
          <p style="
            font-size: 18px; color: #b0c4de; margin-top: 8px; letter-spacing: 1.5px;
            text-shadow: 0 0 10px rgba(74, 144, 255, 0.4);
          ">A Journey Through Your Code</p>
        </div>

        <div id="df-main-menu-buttons" style="display: flex; flex-direction: column; gap: 14px; width: 280px;">
          <button id="btn-new-game" class="df-menu-btn" style="
            padding: 12px 24px; font-size: 16px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 2px solid #4A90FF;
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
          ">New Game</button>

          <button id="btn-continue" class="df-menu-btn" ${!hasSave ? 'disabled' : ''} style="
            padding: 12px 24px; font-size: 16px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 2px solid ${hasSave ? '#00D9FF' : '#444455'};
            color: ${hasSave ? '#ffffff' : '#777788'}; border-radius: 6px;
            cursor: ${hasSave ? 'pointer' : 'not-allowed'}; opacity: ${hasSave ? '1' : '0.5'};
            transition: all 0.2s ease;
          ">Continue Game</button>

          <button id="btn-settings" class="df-menu-btn" style="
            padding: 12px 24px; font-size: 16px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 2px solid #B300FF;
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
          ">Settings</button>

          <button id="btn-about" class="df-menu-btn" style="
            padding: 12px 24px; font-size: 16px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 2px solid #00FF66;
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
          ">About</button>

          <button id="btn-quit" class="df-menu-btn" style="
            padding: 12px 24px; font-size: 16px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 2px solid #e74c3c;
            color: #ffffff; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
          ">Quit</button>
        </div>

        <div style="position: absolute; bottom: 20px; right: 24px; font-size: 12px; color: #708090;">
          v1.0 • Dark Forest Interactive Engine
        </div>
      </div>
    `;

    // Wire up events
    this._bindButton('btn-new-game', () => this.newGame());
    this._bindButton('btn-continue', () => this.continueGame());
    this._bindButton('btn-settings', () => this.showSettingsMenu(false));
    this._bindButton('btn-about', () => this.showAboutScreen());
    this._bindButton('btn-quit', () => this.quitToDesktop());

    this._updateButtonCollection('#df-main-menu-buttons .df-menu-btn');
    this.eventBus.emit('mainMenuShown', {});
  }

  /**
   * Hides the title screen.
   */
  hideMainMenu() {
    this.mainMenuVisible = false;
    const el = this.rootContainer.querySelector('#df-main-menu');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }
    if (this.currentMenu === 'main') {
      this.currentMenu = 'none';
    }
    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.GAMEPLAY);
    }
    this.eventBus.emit('mainMenuHidden', {});
  }

  /**
   * Checks whether main menu is displayed.
   * @returns {boolean}
   */
  isMainMenuVisible() {
    return this.mainMenuVisible;
  }

  // =========================================================================
  // PAUSE MENU
  // =========================================================================

  /**
   * Displays the pause menu overlay during gameplay.
   */
  showPauseMenu() {
    if (this.mainMenuVisible) return;

    this.pauseMenuVisible = true;
    this.settingsVisible = false;
    this.statsVisible = false;
    this.aboutVisible = false;
    this.currentMenu = 'pause';

    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.MENU);
    }

    // Freeze Phaser scene if running
    if (this.scene?.physics?.pause) {
      this.scene.physics.pause();
    }

    this.rootContainer.innerHTML = `
      <div id="df-pause-menu" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.72); backdrop-filter: blur(4px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; opacity: 1; transition: opacity 0.2s ease;
      ">
        <h2 style="
          font-size: 38px; color: #FFD700; margin: 0 0 24px 0;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.7); letter-spacing: 4px;
        ">PAUSED</h2>

        <div id="df-pause-panel" style="
          background: rgba(20, 26, 46, 0.95); border: 2px solid #4A90FF;
          border-radius: 8px; padding: 28px; width: 340px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          display: flex; flex-direction: column; gap: 12px;
        ">
          <button id="btn-pause-resume" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #4A90FF;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Resume Game</button>

          <button id="btn-pause-settings" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #00D9FF;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Settings</button>

          <button id="btn-pause-stats" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #B300FF;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Stats & Progress</button>

          <button id="btn-pause-save" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #00FF66;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Save Game</button>

          <button id="btn-pause-main-menu" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #e67e22;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Quit to Main Menu</button>

          <button id="btn-pause-desktop" class="df-pause-btn" style="
            padding: 10px 20px; font-size: 15px; font-family: inherit;
            background: rgba(30, 42, 74, 0.85); border: 1px solid #e74c3c;
            color: #ffffff; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
          ">Quit to Desktop</button>
        </div>
      </div>
    `;

    this._bindButton('btn-pause-resume', () => this.hidePauseMenu());
    this._bindButton('btn-pause-settings', () => this.showSettingsMenu(true));
    this._bindButton('btn-pause-stats', () => this.showStatsScreen());
    this._bindButton('btn-pause-save', () => this.saveGame());
    this._bindButton('btn-pause-main-menu', () => this.quitToMenu());
    this._bindButton('btn-pause-desktop', () => this.quitToDesktop());

    this._updateButtonCollection('#df-pause-panel .df-pause-btn');
    this.eventBus.emit('gamePaused', {});
  }

  /**
   * Dismisses the pause menu overlay and resumes gameplay.
   */
  hidePauseMenu() {
    this.pauseMenuVisible = false;
    const el = this.rootContainer.querySelector('#df-pause-menu');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    }
    this.currentMenu = 'none';

    if (this.scene?.physics?.resume) {
      this.scene.physics.resume();
    }

    if (this.inputHandler?.setInputContext) {
      this.inputHandler.setInputContext(INPUT_CONTEXTS.GAMEPLAY);
    }

    this.eventBus.emit('gameResumed', {});
  }

  /**
   * Toggles pause menu.
   */
  togglePauseMenu() {
    if (this.pauseMenuVisible) {
      this.hidePauseMenu();
    } else {
      this.showPauseMenu();
    }
  }

  /**
   * Checks whether the game is currently paused.
   * @returns {boolean}
   */
  isPaused() {
    return this.pauseMenuVisible;
  }

  // =========================================================================
  // SETTINGS MENU
  // =========================================================================

  /**
   * Displays the comprehensive settings configuration panel.
   * 
   * @param {boolean} [fromPause=false] - True if opened from in-game pause
   */
  showSettingsMenu(fromPause = false) {
    this.settingsVisible = true;
    this.settingsReturnTarget = fromPause ? 'pause' : 'main';
    this.currentMenu = 'settings';

    const nightModeUnlocked = Boolean(
      this.nightModeManager?.isNightModeUnlocked?.() ||
      this.gameState?.easterEggsFound?.includes?.('nightmode') ||
      this.gameState?.unlocks?.nightModeUnlocked
    );

    this.rootContainer.innerHTML = `
      <div id="df-settings-menu" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 14, 26, 0.96); backdrop-filter: blur(6px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; padding: 20px; box-sizing: border-box;
      ">
        <div style="
          background: rgba(20, 26, 46, 0.95); border: 2px solid #B300FF;
          border-radius: 8px; width: 560px; max-height: 85vh; overflow-y: auto;
          padding: 24px 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        ">
          <h2 style="margin: 0 0 18px 0; color: #B300FF; text-align: center; letter-spacing: 2px;">
            SETTINGS
          </h2>

          <!-- Audio Section -->
          <div class="settings-section" style="margin-bottom: 20px;">
            <h3 style="color: #4A90FF; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">
              Audio
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Master Volume:</label>
              <input type="range" id="slider-vol-master" min="0" max="100" value="${Math.round(this.settings.audio.master * 100)}" />
              <span id="lbl-vol-master">${Math.round(this.settings.audio.master * 100)}%</span>

              <label>Music Volume:</label>
              <input type="range" id="slider-vol-music" min="0" max="100" value="${Math.round(this.settings.audio.music * 100)}" />
              <span id="lbl-vol-music">${Math.round(this.settings.audio.music * 100)}%</span>

              <label>SFX Volume:</label>
              <input type="range" id="slider-vol-sfx" min="0" max="100" value="${Math.round(this.settings.audio.sfx * 100)}" />
              <span id="lbl-vol-sfx">${Math.round(this.settings.audio.sfx * 100)}%</span>

              <label>Ambience Volume:</label>
              <input type="range" id="slider-vol-ambience" min="0" max="100" value="${Math.round(this.settings.audio.ambience * 100)}" />
              <span id="lbl-vol-ambience">${Math.round(this.settings.audio.ambience * 100)}%</span>

              <label>Mute All:</label>
              <div>
                <input type="checkbox" id="chk-mute-all" ${this.settings.audio.mute ? 'checked' : ''} />
              </div>
              <span></span>
            </div>
          </div>

          <!-- Video Section -->
          <div class="settings-section" style="margin-bottom: 20px;">
            <h3 style="color: #00D9FF; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">
              Video & Atmosphere
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Brightness:</label>
              <input type="range" id="slider-brightness" min="50" max="150" value="${Math.round(this.settings.video.brightness * 100)}" />
              <span id="lbl-brightness">${this.settings.video.brightness.toFixed(1)}x</span>

              <label>Glow Intensity:</label>
              <input type="range" id="slider-glow" min="50" max="150" value="${Math.round(this.settings.video.glowIntensity * 100)}" />
              <span id="lbl-glow">${this.settings.video.glowIntensity.toFixed(1)}x</span>

              <label>Particle Density:</label>
              <select id="sel-particles" style="background: #141a2e; color: #fff; border: 1px solid #00D9FF; padding: 4px; border-radius: 4px;">
                <option value="low" ${this.settings.video.particleDensity === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${this.settings.video.particleDensity === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${this.settings.video.particleDensity === 'high' ? 'selected' : ''}>High</option>
              </select>
              <span></span>

              <label>Display FPS:</label>
              <div>
                <input type="checkbox" id="chk-fps" ${this.settings.video.displayFps ? 'checked' : ''} />
              </div>
              <span></span>
            </div>
          </div>

          <!-- Accessibility Section -->
          <div class="settings-section" style="margin-bottom: 20px;">
            <h3 style="color: #00FF66; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">
              Accessibility
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Text Size:</label>
              <select id="sel-text-size" style="background: #141a2e; color: #fff; border: 1px solid #00FF66; padding: 4px; border-radius: 4px;">
                <option value="small" ${this.settings.accessibility.textSize === 'small' ? 'selected' : ''}>Small</option>
                <option value="normal" ${this.settings.accessibility.textSize === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="large" ${this.settings.accessibility.textSize === 'large' ? 'selected' : ''}>Large</option>
              </select>
              <span></span>

              <label>Colorblind Mode:</label>
              <select id="sel-colorblind" style="background: #141a2e; color: #fff; border: 1px solid #00FF66; padding: 4px; border-radius: 4px;">
                <option value="off" ${this.settings.accessibility.colorblind === 'off' ? 'selected' : ''}>Off</option>
                <option value="deuteranopia" ${this.settings.accessibility.colorblind === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option>
                <option value="protanopia" ${this.settings.accessibility.colorblind === 'protanopia' ? 'selected' : ''}>Protanopia</option>
                <option value="tritanopia" ${this.settings.accessibility.colorblind === 'tritanopia' ? 'selected' : ''}>Tritanopia</option>
              </select>
              <span></span>

              <label>High Contrast:</label>
              <div>
                <input type="checkbox" id="chk-contrast" ${this.settings.accessibility.highContrast ? 'checked' : ''} />
              </div>
              <span></span>
            </div>
          </div>

          <!-- Special Features -->
          <div class="settings-section" style="margin-bottom: 24px;">
            <h3 style="color: #FFD700; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #334466; padding-bottom: 4px;">
              Special Features
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 8px; align-items: center; font-size: 13px;">
              <label>Night Mode:</label>
              <div>
                <input type="checkbox" id="chk-night-mode" ${!nightModeUnlocked ? 'disabled' : ''} ${this.settings.special.nightMode ? 'checked' : ''} />
                <span style="font-size: 11px; color: ${nightModeUnlocked ? '#00FF66' : '#888899'}; margin-left: 6px;">
                  ${nightModeUnlocked ? 'Unlocked' : '(Find hidden portal)'}
                </span>
              </div>
              <span></span>
            </div>
          </div>

          <!-- Button Row -->
          <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 24px;">
            <button id="btn-settings-reset" class="df-settings-btn" style="
              padding: 8px 16px; font-size: 13px; font-family: inherit;
              background: rgba(40, 20, 30, 0.85); border: 1px solid #e74c3c;
              color: #ff9999; border-radius: 4px; cursor: pointer;
            ">Reset Defaults</button>

            <button id="btn-settings-back" class="df-settings-btn" style="
              padding: 8px 24px; font-size: 14px; font-family: inherit;
              background: rgba(30, 42, 74, 0.85); border: 1px solid #4A90FF;
              color: #ffffff; border-radius: 4px; cursor: pointer;
            ">Back</button>
          </div>
        </div>
      </div>
    `;

    // Hook change handlers
    this._bindSlider('slider-vol-master', 'lbl-vol-master', (val) => this.setVolume('master', val / 100));
    this._bindSlider('slider-vol-music', 'lbl-vol-music', (val) => this.setVolume('music', val / 100));
    this._bindSlider('slider-vol-sfx', 'lbl-vol-sfx', (val) => this.setVolume('sfx', val / 100));
    this._bindSlider('slider-vol-ambience', 'lbl-vol-ambience', (val) => this.setVolume('ambience', val / 100));

    this._bindCheckbox('chk-mute-all', (checked) => {
      this.settings.audio.mute = checked;
      this.saveSettings();
    });

    this._bindSlider('slider-brightness', 'lbl-brightness', (val) => {
      this.setBrightness(val / 100);
    }, 'x');

    this._bindSlider('slider-glow', 'lbl-glow', (val) => {
      this.settings.video.glowIntensity = val / 100;
      this.saveSettings();
    }, 'x');

    this._bindSelect('sel-particles', (val) => {
      this.settings.video.particleDensity = val;
      this.saveSettings();
    });

    this._bindCheckbox('chk-fps', (checked) => {
      this.settings.video.displayFps = checked;
      this.saveSettings();
      if (this.scene?.hudRenderer?.setDebugMode) {
        this.scene.hudRenderer.setDebugMode(checked);
      }
    });

    this._bindSelect('sel-text-size', (val) => {
      this.settings.accessibility.textSize = val;
      this.saveSettings();
    });

    this._bindSelect('sel-colorblind', (val) => {
      this.setColorblindMode(val);
    });

    this._bindCheckbox('chk-contrast', (checked) => {
      this.settings.accessibility.highContrast = checked;
      this.saveSettings();
    });

    this._bindCheckbox('chk-night-mode', (checked) => {
      this.setNightMode(checked);
    });

    this._bindButton('btn-settings-reset', () => this.resetAllSettings());
    this._bindButton('btn-settings-back', () => this.hideSettingsMenu());

    this._updateButtonCollection('#df-settings-menu .df-settings-btn');
  }

  /**
   * Dismisses the settings menu and returns to the caller.
   */
  hideSettingsMenu() {
    this.settingsVisible = false;
    const el = this.rootContainer.querySelector('#df-settings-menu');
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }

    if (this.settingsReturnTarget === 'pause') {
      this.showPauseMenu();
    } else {
      this.showMainMenu();
    }
  }

  // =========================================================================
  // STATS SCREEN
  // =========================================================================

  /**
   * Displays the player's comprehensive exploration and progress statistics.
   */
  showStatsScreen() {
    this.statsVisible = true;
    this.currentMenu = 'stats';

    const progStats = this.progressTracker?.getCompletionStats?.() || {
      overallProgress: this.gameState?.gameProgress || 0,
      currentStage: 'Early Explorer',
      categories: {
        exploration: { discovered: 1, total: 4 },
        npcs: { metCount: 0, total: 5 },
        projects: { clickedCount: 0, total: 6 },
        achievements: { unlockedCount: 0, total: 8 }
      },
      timePlayedMinutes: 0
    };

    const exp = progStats.categories?.exploration || { discovered: 1, total: 4 };
    const npc = progStats.categories?.npcs || { metCount: 0, total: 5 };
    const proj = progStats.categories?.projects || { clickedCount: 0, total: 6 };
    const ach = progStats.categories?.achievements || { unlockedCount: 0, total: 8 };

    const hours = Math.floor((progStats.timePlayedMinutes || 0) / 60);
    const mins = (progStats.timePlayedMinutes || 0) % 60;
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    this.rootContainer.innerHTML = `
      <div id="df-stats-menu" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 14, 26, 0.96); backdrop-filter: blur(6px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; padding: 20px; box-sizing: border-box;
      ">
        <div style="
          background: rgba(20, 26, 46, 0.95); border: 2px solid #00FF66;
          border-radius: 8px; width: 480px; padding: 28px 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        ">
          <h2 style="margin: 0 0 16px 0; color: #00FF66; text-align: center; letter-spacing: 2px;">
            JOURNEY PROGRESS
          </h2>

          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 40px; font-weight: bold; color: #ffffff;">
              ${progStats.overallProgress}%
            </div>
            <div style="color: #4A90FF; font-size: 15px; margin-top: 4px;">
              ${progStats.currentStage || 'Growing Explorer'}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; margin-bottom: 28px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #223355; padding-bottom: 6px;">
              <span style="color: #b0c4de;">🗺️ Zones Discovered:</span>
              <span style="font-weight: bold;">${exp.discovered}/${exp.total}</span>
            </div>

            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #223355; padding-bottom: 6px;">
              <span style="color: #b0c4de;">👥 NPCs Met:</span>
              <span style="font-weight: bold;">${npc.metCount}/${npc.total}</span>
            </div>

            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #223355; padding-bottom: 6px;">
              <span style="color: #b0c4de;">💼 Projects Inspected:</span>
              <span style="font-weight: bold;">${proj.clickedCount}/${proj.total}</span>
            </div>

            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #223355; padding-bottom: 6px;">
              <span style="color: #b0c4de;">🏆 Achievements Unlocked:</span>
              <span style="font-weight: bold;">${ach.unlockedCount}/${ach.total}</span>
            </div>

            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #223355; padding-bottom: 6px;">
              <span style="color: #b0c4de;">⏱️ Time Played:</span>
              <span style="font-weight: bold; font-family: monospace;">${timeFormatted}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <button id="btn-stats-back" class="df-stats-btn" style="
              padding: 10px 32px; font-size: 14px; font-family: inherit;
              background: rgba(30, 42, 74, 0.85); border: 1px solid #00FF66;
              color: #ffffff; border-radius: 4px; cursor: pointer;
            ">Back</button>
          </div>
        </div>
      </div>
    `;

    this._bindButton('btn-stats-back', () => this.hideStatsScreen());
    this._updateButtonCollection('#df-stats-menu .df-stats-btn');
  }

  /**
   * Dismisses stats screen and returns to pause menu.
   */
  hideStatsScreen() {
    this.statsVisible = false;
    const el = this.rootContainer.querySelector('#df-stats-menu');
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }
    this.showPauseMenu();
  }

  // =========================================================================
  // ABOUT SCREEN
  // =========================================================================

  /**
   * Displays the game credits & background information.
   */
  showAboutScreen() {
    this.aboutVisible = true;
    this.currentMenu = 'about';

    this.rootContainer.innerHTML = `
      <div id="df-about-menu" style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 14, 26, 0.96); backdrop-filter: blur(6px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto; padding: 20px; box-sizing: border-box;
      ">
        <div style="
          background: rgba(20, 26, 46, 0.95); border: 2px solid #4A90FF;
          border-radius: 8px; width: 480px; padding: 28px 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        ">
          <h2 style="margin: 0 0 16px 0; color: #4A90FF; text-align: center; letter-spacing: 2px;">
            ABOUT
          </h2>
          <p style="font-size: 14px; color: #d0e0f0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
            <strong>Dark Forest Portfolio</strong> is an interactive gamified portfolio exploring full-stack engineering,
            data science, mobile architectures, and system design through atmospheric 2D exploration.
          </p>
          <div style="text-align: center;">
            <button id="btn-about-back" class="df-about-btn" style="
              padding: 10px 32px; font-size: 14px; font-family: inherit;
              background: rgba(30, 42, 74, 0.85); border: 1px solid #4A90FF;
              color: #ffffff; border-radius: 4px; cursor: pointer;
            ">Back</button>
          </div>
        </div>
      </div>
    `;

    this._bindButton('btn-about-back', () => this.hideAboutScreen());
    this._updateButtonCollection('#df-about-menu .df-about-btn');
  }

  /**
   * Dismisses about screen.
   */
  hideAboutScreen() {
    this.aboutVisible = false;
    const el = this.rootContainer.querySelector('#df-about-menu');
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }
    this.showMainMenu();
  }

  // =========================================================================
  // ACTIONS & FLOW
  // =========================================================================

  /**
   * Starts a brand new game session.
   */
  newGame() {
    this.hideMainMenu();

    if (this.gameState?.resetState) {
      this.gameState.resetState();
    }
    if (this.progressTracker?.reset) {
      this.progressTracker.reset();
    }

    this.eventBus.emit('gameStarted', { isNewGame: true });

    if (this.scene?.scene?.restart) {
      this.scene.scene.restart();
    }
  }

  /**
   * Continues gameplay from persistent save data.
   */
  continueGame() {
    const save = this.saveManager?.load?.();
    if (!save) {
      this.newGame();
      return;
    }

    this.hideMainMenu();

    if (save.gameState && this.gameState) {
      Object.assign(this.gameState, save.gameState);
    }

    this.eventBus.emit('gameLoaded', { isContinue: true });

    if (this.scene?.scene?.restart) {
      this.scene.scene.restart({ loadedData: save });
    }
  }

  /**
   * Manually saves current game state.
   */
  saveGame() {
    const success = Boolean(this.saveManager?.save?.(this.gameState, this.scene?.player || {}));
    if (success) {
      this.eventBus.emit('gameSaved', { timestamp: Date.now() });
      if (typeof window !== 'undefined') {
        const btn = document.getElementById('btn-pause-save');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Saved!';
          btn.style.color = '#00FF66';
          setTimeout(() => {
            btn.textContent = original;
            btn.style.color = '#ffffff';
          }, 1500);
        }
      }
    }
    return success;
  }

  /**
   * Exits active game to title screen.
   */
  quitToMenu() {
    this.hidePauseMenu();
    this.showMainMenu();
    this.eventBus.emit('quitToMainMenu', {});
  }

  /**
   * Closes or redirects application.
   */
  quitToDesktop() {
    this.saveGame();
    if (typeof window !== 'undefined') {
      window.location.href = 'about:blank';
    }
  }

  // =========================================================================
  // SETTINGS MANAGEMENT
  // =========================================================================

  /**
   * Sets volume for specific audio channel.
   * 
   * @param {string} type - 'master' | 'music' | 'sfx' | 'ambience'
   * @param {number} volume - 0.0 to 1.0
   */
  setVolume(type, volume) {
    const clamped = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.settings.audio[type] !== undefined) {
      this.settings.audio[type] = clamped;
      this.saveSettings();
    }
  }

  /**
   * Adjusts brightness factor (0.5 - 1.5).
   * @param {number} brightness
   */
  setBrightness(brightness) {
    const clamped = Math.max(0.5, Math.min(1.5, Number(brightness) || 1.0));
    this.settings.video.brightness = clamped;
    this.saveSettings();

    if (this.scene?.lightingManager?.setAmbientDarkness) {
      // Adjust ambient darkness scale
    }
  }

  /**
   * Toggles Night Mode theme if unlocked.
   * @param {boolean} enabled
   */
  setNightMode(enabled) {
    const target = Boolean(enabled);
    this.settings.special.nightMode = target;
    this.saveSettings();

    if (this.nightModeManager?.setNightMode) {
      this.nightModeManager.setNightMode(target);
    }
  }

  /**
   * Applies accessible colorblind mode filter.
   * @param {string} mode - 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia'
   */
  setColorblindMode(mode) {
    this.settings.accessibility.colorblind = mode;
    this.saveSettings();

    if (typeof document !== 'undefined') {
      const body = document.body;
      ['deuteranopia', 'protanopia', 'tritanopia'].forEach(m => body.classList.remove(`colorblind-${m}`));
      if (mode !== 'off') {
        body.classList.add(`colorblind-${mode}`);
      }
    }
  }

  /**
   * Persists settings to storage.
   */
  saveSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  /**
   * Restores user settings from storage.
   */
  loadSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.settings = {
            audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
            video: { ...DEFAULT_SETTINGS.video, ...parsed.video },
            gameplay: { ...DEFAULT_SETTINGS.gameplay, ...parsed.gameplay },
            accessibility: { ...DEFAULT_SETTINGS.accessibility, ...parsed.accessibility },
            special: { ...DEFAULT_SETTINGS.special, ...parsed.special }
          };
        }
      }
    } catch (e) {
      this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  /**
   * Reverts all settings back to canonical defaults.
   */
  resetAllSettings() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.saveSettings();

    if (this.currentMenu === 'settings') {
      this.showSettingsMenu(this.settingsReturnTarget === 'pause');
    }
  }

  // =========================================================================
  // KEYBOARD NAVIGATION
  // =========================================================================

  /**
   * Navigates between focusable menu buttons via arrow keys.
   * 
   * @param {'up'|'down'|'select'} direction
   */
  navigateMenu(direction) {
    if (!this.currentButtons || this.currentButtons.length === 0) return;

    if (direction === 'down') {
      this.focusedButtonIndex = (this.focusedButtonIndex + 1) % this.currentButtons.length;
      this._applyButtonFocus();
    } else if (direction === 'up') {
      this.focusedButtonIndex = (this.focusedButtonIndex - 1 + this.currentButtons.length) % this.currentButtons.length;
      this._applyButtonFocus();
    } else if (direction === 'select') {
      const btn = this.currentButtons[this.focusedButtonIndex];
      if (btn && typeof btn.click === 'function') {
        btn.click();
      }
    }
  }

  /**
   * Scans container for buttons to track keyboard selection.
   * @private
   */
  _updateButtonCollection(selector) {
    this.currentButtons = Array.from(this.rootContainer.querySelectorAll(selector));
    this.focusedButtonIndex = 0;
    this._applyButtonFocus();
  }

  /**
   * Visual indicator for active button.
   * @private
   */
  _applyButtonFocus() {
    this.currentButtons.forEach((btn, idx) => {
      if (idx === this.focusedButtonIndex) {
        btn.style.outline = '2px solid #FFD700';
        btn.style.transform = 'scale(1.04)';
      } else {
        btn.style.outline = 'none';
        btn.style.transform = 'scale(1.0)';
      }
    });
  }

  // =========================================================================
  // DOM BINDING HELPERS
  // =========================================================================

  _bindButton(id, cb) {
    const el = this.rootContainer.querySelector(`#${id}`);
    if (el) {
      el.addEventListener('click', cb);
    }
  }

  _bindSlider(sliderId, labelId, cb, suffix = '%') {
    const slider = this.rootContainer.querySelector(`#${sliderId}`);
    const label = this.rootContainer.querySelector(`#${labelId}`);
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
    const chk = this.rootContainer.querySelector(`#${id}`);
    if (chk) {
      chk.addEventListener('change', (e) => cb(Boolean(e.target.checked)));
    }
  }

  _bindSelect(id, cb) {
    const sel = this.rootContainer.querySelector(`#${id}`);
    if (sel) {
      sel.addEventListener('change', (e) => cb(e.target.value));
    }
  }

  /**
   * Cleans up all DOM trees and event listeners.
   */
  destroy() {
    this._detachEventListeners();
    if (this.rootContainer?.parentNode) {
      this.rootContainer.parentNode.removeChild(this.rootContainer);
    }
    this.rootContainer = null;
  }
}

// Export singleton instance
export const menuSystem = new MenuSystem();
export default menuSystem;
