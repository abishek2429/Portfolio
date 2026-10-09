/**
 * ResponsiveUIManager - Multi-Device Responsiveness & Adaptive Touch Control System
 * 
 * Dark Forest Portfolio Game
 * Provides comprehensive cross-device adaptation:
 * - Breakpoint management: Desktop (1200px+), Tablet (768-1199px), Mobile (<768px)
 * - Canvas aspect ratio preservation & dynamic sizing (1200x800, 1024x682, 480x320)
 * - Proportional UI scaling (Desktop 1.0x, Tablet 0.9x, Mobile 0.7x)
 * - Typographic scaling hierarchy with 10px readability floor
 * - Mobile on-screen touch overlay: 80x80px 8-directional D-Pad, 60x60px Action Buttons (E, M, T),
 *   and 50x50px persistent top-right Pause Button with haptic vibration
 * - Device safe area insets (notches, gesture bars) and orientation locking
 * - HUD element relocation (e.g. Minimap relocated from top-right to bottom-right on mobile)
 * - Testing preset overrides and state serialization
 * - Universal runtime architecture (Phaser / DOM / Node headless safe)
 */

import eventBus, { GAME_EVENTS } from '../events/EventBus.js';
import defaultInputHandler, { INPUT_CONTEXTS } from '../input/InputHandler.js';
import defaultAudioManager from '../audio/AudioManager.js';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

export const BREAKPOINTS = {
  mobile: { max: 767 },
  tablet: { min: 768, max: 1199 },
  desktop: { min: 1200 }
};

export const SCALES = {
  mobile: 0.7,
  tablet: 0.9,
  desktop: 1.0
};

export const CANVAS_SIZES = {
  mobile: { width: 480, height: 320 },
  tablet: { width: 1024, height: 682 },
  desktop: { width: 1200, height: 800 }
};

export const FONT_SIZES = {
  desktop: { title: 48, large: 24, normal: 16, small: 12, tiny: 10 },
  tablet: { title: 43, large: 22, normal: 14, small: 11, tiny: 10 },
  mobile: { title: 36, large: 18, normal: 13, small: 10, tiny: 10 }
};

export const MIN_FONT_SIZE = 10;

export const HUD_RESPONSIVE_CONFIG = {
  progressBar: {
    desktop: { width: 200, height: 8, x: 980, y: 105, visible: true },
    tablet: { width: 180, height: 8, x: 820, y: 80, visible: true },
    mobile: { width: 150, height: 8, x: 'right', y: 40, visible: true }
  },
  minimap: {
    desktop: { width: 100, height: 75, position: 'top-right', x: 1080, y: 20, visible: true },
    tablet: { width: 80, height: 60, position: 'top-right', x: 920, y: 15, visible: true },
    mobile: { width: 60, height: 45, position: 'bottom-right', x: 'right', y: 'bottom', visible: true }
  },
  zoneName: {
    desktop: { fontSize: 24, fullText: true, y: 60 },
    tablet: { fontSize: 18, fullText: true, y: 50 },
    mobile: { fontSize: 16, fullText: false, y: 35 }
  },
  interactionPrompt: {
    desktop: { mode: 'floating', fontSize: 12 },
    tablet: { mode: 'floating', fontSize: 11 },
    mobile: { mode: 'action-button', fontSize: 10 }
  },
  nextMilestone: {
    desktop: { fontSize: 11, visible: true },
    tablet: { fontSize: 10, visible: true },
    mobile: { visible: false }
  },
  controlHints: {
    desktop: { visible: true, text: 'WASD to move | E to interact | ESC for menu' },
    tablet: { visible: true, text: 'WASD / Touch | E to interact | ESC for menu' },
    mobile: { visible: false, text: '' }
  }
};

// ==========================================
// HEADLESS / DOM COMPATIBILITY HELPERS
// ==========================================

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
    this.id = '';
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
  }

  get textContent() { return this._textContent; }
  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val);
  }

  appendChild(child) {
    if (!child) return child;
    child.parentNode = this;
    this.children.push(child);
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
    const clean = sel.replace(/^[#.]/, '');
    for (const child of this.children) {
      if (child.id === clean || child.classList.contains(clean)) return child;
      const found = child.querySelector?.(sel);
      if (found) return found;
    }
    return null;
  }

  querySelectorAll(sel) {
    const results = [];
    const clean = sel.replace(/^[#.]/, '');
    for (const child of this.children) {
      if (child.id === clean || child.classList.contains(clean)) results.push(child);
      if (child.querySelectorAll) results.push(...child.querySelectorAll(sel));
    }
    return results;
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event?.type || event] || [];
    handlers.forEach(h => h(event));
    return true;
  }

  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  getBoundingClientRect() {
    return { top: 0, left: 0, width: 80, height: 80, bottom: 80, right: 80, x: 0, y: 0 };
  }
}

function createDOMElement(tagName = 'div') {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    return document.createElement(tagName);
  }
  return new NodeMockElement(tagName);
}

// ==========================================
// RESPONSIVE UI MANAGER CLASS
// ==========================================

export class ResponsiveUIManager {
  /**
   * @param {Object} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.scene = null;
    this.baseWidth = 1200;
    this.baseHeight = 800;
    this.currentWidth = 1200;
    this.currentHeight = 800;

    this.deviceType = 'desktop';
    this.scale = 1.0;
    this.presetOverride = null;
    this.portraitLocked = false;
    this.isPortrait = false;
    this.touchControlsVisible = false;
    this.safeArea = { top: 0, bottom: 0, left: 0, right: 0 };

    // Touch controls state
    this.touchControls = null;
    this.activeMovement = { up: false, down: false, left: false, right: false };
    this.currentDpadDirection = null; // 'up', 'down', 'left', 'right', 'up-left', etc.
    this.dpadCenter = { x: 0, y: 0 };
    this.touchIdentifier = null;

    // Gesture tracking
    this.touchStartY = 0;
    this.touchStartX = 0;

    // Service dependencies
    this.eventBus = options.eventBus || eventBus;
    this.inputHandler = options.inputHandler || defaultInputHandler;
    this.audioManager = options.audioManager || defaultAudioManager;
    this.hudRenderer = options.hudRenderer || null;
    this.pauseScreenManager = options.pauseScreenManager || null;

    // Bound listeners for cleanup
    this._boundOnResize = this._handleResize.bind(this);
    this._boundOnOrientationChange = this._handleOrientationChange.bind(this);
  }

  // ==========================================
  // INITIALIZATION & LIFECYCLE
  // ==========================================

  /**
   * Initializes the responsiveness system for the given scene and viewport.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {number} [gameWidth=1200] - Base virtual game canvas width
   * @param {number} [gameHeight=800] - Base virtual game canvas height
   * @returns {ResponsiveUIManager}
   */
  create(scene = null, gameWidth = 1200, gameHeight = 800) {
    this.scene = scene;
    this.baseWidth = Number(gameWidth) || 1200;
    this.baseHeight = Number(gameHeight) || 800;

    // Resolve initial viewport
    this._updateViewportDimensions();

    // Detect device type and scale
    this.deviceType = this.detectDeviceType();
    this.scale = this.getResponsiveScale();
    this.safeArea = this.calculateSafeArea();

    // Setup window resize & orientation listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._boundOnResize);
      window.addEventListener('orientationchange', this._boundOnOrientationChange);
    }

    if (this.scene?.scale?.on) {
      this.scene.scale.on('resize', (gameSize) => {
        if (gameSize?.width && gameSize?.height) {
          this.onWindowResize(gameSize.width, gameSize.height);
        }
      });
    }

    // Auto-lock landscape orientation for mobile devices
    if (this.deviceType === 'mobile') {
      this.lockPortrait();
    }

    // Initialize touch controls
    if (this.isTouchDevice() || this.deviceType === 'mobile' || this.deviceType === 'tablet') {
      this.createTouchControls();
      if (this.deviceType === 'mobile') {
        this.showTouchControls();
      } else {
        this.hideTouchControls();
      }
    }

    // Apply layout transformations across registered UI systems
    this.enableResponsiveLayout();

    // Emit initialization telemetry
    this.eventBus.emit('responsive:initialized', this.getUILayout());

    return this;
  }

  /**
   * Destroys all registered listeners and removes touch control elements.
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._boundOnResize);
      window.removeEventListener('orientationchange', this._boundOnOrientationChange);
    }

    if (this.touchControls?.container?.parentNode) {
      this.touchControls.container.parentNode.removeChild(this.touchControls.container);
    }
    this.touchControls = null;
  }

  // ==========================================
  // DEVICE DETECTION & SCALING
  // ==========================================

  /**
   * Identifies the current device profile based on width.
   * 
   * @param {number} [width=null] - Optional override width in pixels
   * @returns {'mobile'|'tablet'|'desktop'}
   */
  detectDeviceType(width = null) {
    if (this.presetOverride) {
      return this.presetOverride;
    }

    const testWidth = width !== null ? Number(width) : this._resolveCurrentWidth();

    if (testWidth <= BREAKPOINTS.mobile.max) {
      return 'mobile';
    } else if (testWidth <= BREAKPOINTS.tablet.max) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Calculates the responsive UI scale factor multiplier.
   * 
   * @param {'mobile'|'tablet'|'desktop'} [deviceType=null]
   * @returns {number} Scale factor (0.7, 0.9, or 1.0)
   */
  getResponsiveScale(deviceType = null) {
    const type = deviceType || this.deviceType;
    return SCALES[type] ?? 1.0;
  }

  /**
   * Returns target game canvas dimensions maintaining aspect ratio.
   * 
   * @param {number} [screenWidth=null]
   * @param {number} [screenHeight=null]
   * @returns {{ width: number, height: number }}
   */
  getCanvasDimensions(screenWidth = null, screenHeight = null) {
    const type = this.deviceType;
    const base = CANVAS_SIZES[type] || CANVAS_SIZES.desktop;

    if (screenWidth && screenHeight && type === 'mobile') {
      // On mobile, fill available width while maintaining ~16:10 / 3:2 ratio
      const aspect = 480 / 320;
      const width = Math.min(screenWidth, 480);
      const height = Math.round(width / aspect);
      return { width, height };
    }

    return { ...base };
  }

  /**
   * Returns responsive font size for a specific typographic role.
   * 
   * @param {'title'|'large'|'normal'|'small'|'tiny'} type
   * @param {'mobile'|'tablet'|'desktop'} [deviceType=null]
   * @returns {number} Pixel font size (guaranteed >= 10)
   */
  getFontSize(type, deviceType = null) {
    const dev = deviceType || this.deviceType;
    const sizeMap = FONT_SIZES[dev] || FONT_SIZES.desktop;
    const size = sizeMap[type] ?? sizeMap.normal ?? 16;
    return Math.max(this.getMinimumFontSize(type), size);
  }

  /**
   * Hard minimum font size floor to guarantee accessibility & readability.
   * 
   * @param {string} [type=null]
   * @returns {number} Hard floor in pixels (10px)
   */
  getMinimumFontSize(type = null) {
    return MIN_FONT_SIZE;
  }

  /**
   * Resizes and scales a UI element (DOM, Phaser, or generic geometry object).
   * 
   * @param {Object} element - Target element
   * @param {number|Object} baseSize - Base dimensions or numerical size
   * @returns {Object|number} Scaled result
   */
  scaleElement(element, baseSize) {
    const scale = this.getResponsiveScale();

    if (typeof baseSize === 'number') {
      const scaled = Math.round(baseSize * scale);
      if (element?.style) {
        element.style.fontSize = `${scaled}px`;
      }
      if (typeof element?.setScale === 'function') {
        element.setScale(scale);
      }
      return scaled;
    }

    if (typeof baseSize === 'object' && baseSize !== null) {
      const scaled = {
        width: Math.round((baseSize.width || 0) * scale),
        height: Math.round((baseSize.height || 0) * scale),
        x: baseSize.x !== undefined ? Math.round(baseSize.x * scale) : undefined,
        y: baseSize.y !== undefined ? Math.round(baseSize.y * scale) : undefined,
        fontSize: baseSize.fontSize ? Math.max(MIN_FONT_SIZE, Math.round(baseSize.fontSize * scale)) : undefined
      };

      if (element?.style) {
        if (scaled.width) element.style.width = `${scaled.width}px`;
        if (scaled.height) element.style.height = `${scaled.height}px`;
        if (scaled.fontSize) element.style.fontSize = `${scaled.fontSize}px`;
      }

      if (typeof element?.setDisplaySize === 'function' && scaled.width && scaled.height) {
        element.setDisplaySize(scaled.width, scaled.height);
      } else if (typeof element?.setScale === 'function') {
        element.setScale(scale);
      }

      return scaled;
    }

    return baseSize;
  }

  // ==========================================
  // INPUT MODE & CAPABILITIES
  // ==========================================

  /**
   * Checks the active input mode for the current device and profile.
   * 
   * @returns {'keyboard'|'touch'|'mixed'}
   */
  getInputMode() {
    if (this.deviceType === 'desktop') {
      return 'keyboard';
    }
    if (this.deviceType === 'mobile') {
      return 'touch';
    }
    return this.isTouchDevice() ? 'mixed' : 'keyboard';
  }

  /**
   * Checks whether the current environment supports touch inputs.
   * 
   * @returns {boolean}
   */
  isTouchDevice() {
    if (this.presetOverride === 'mobile') return true;
    if (typeof window === 'undefined') return false;

    return (
      'ontouchstart' in window ||
      (navigator?.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (navigator?.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
    );
  }

  /**
   * Returns whether orientation is locked to landscape.
   * 
   * @returns {boolean}
   */
  isPortraitLocked() {
    return this.portraitLocked;
  }

  /**
   * Locks the screen orientation to landscape (primarily for mobile devices).
   * 
   * @returns {Promise<boolean>|boolean}
   */
  lockPortrait() {
    this.portraitLocked = true;

    if (typeof screen !== 'undefined' && screen.orientation?.lock) {
      try {
        const lockPromise = screen.orientation.lock('landscape');
        if (lockPromise?.catch) {
          lockPromise.catch(() => {
            // Orientation lock may require user gesture on certain mobile browsers
          });
        }
      } catch (e) {
        // Fallback for browsers with restricted orientation lock
      }
    } else if (typeof screen !== 'undefined' && screen.lockOrientation) {
      try {
        screen.lockOrientation('landscape');
      } catch (e) {}
    }

    this.eventBus.emit('responsive:orientationLock', { locked: true, mode: 'landscape' });
    return true;
  }

  /**
   * Calculates device safe area insets (notches, gesture bars).
   * 
   * @returns {{ top: number, bottom: number, left: number, right: number }}
   */
  calculateSafeArea() {
    let result;
    if (this.deviceType === 'desktop') {
      result = { top: 0, bottom: 0, left: 0, right: 0 };
    } else if (this.deviceType === 'mobile') {
      // Default safe area margins for mobile in landscape orientation
      result = { top: 0, bottom: 12, left: 24, right: 24 };
    } else {
      // Tablet default margins
      result = { top: 0, bottom: 0, left: 12, right: 12 };
    }
    this.safeArea = result;
    return result;
  }

  /**
   * Returns the safe active interaction rect.
   * 
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getInputArea() {
    const sa = this.safeArea || this.calculateSafeArea();
    const w = this.currentWidth;
    const h = this.currentHeight;

    return {
      x: sa.left,
      y: sa.top,
      width: Math.max(100, w - sa.left - sa.right),
      height: Math.max(100, h - sa.top - sa.bottom)
    };
  }

  // ==========================================
  // MOBILE TOUCH CONTROLS
  // ==========================================

  /**
   * Builds the mobile on-screen D-Pad, Action Buttons, and Pause Button.
   * 
   * @returns {Object} References to controls
   */
  createTouchControls() {
    if (this.touchControls?.container) {
      return this.touchControls;
    }

    const container = createDOMElement('div');
    container.id = 'touch-controls-overlay';
    container.setAttribute('aria-label', 'Mobile Touch Controls');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '950';
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';
    container.style.touchAction = 'none';
    container.style.opacity = this.touchControlsVisible ? '1' : '0';
    container.style.transition = 'opacity 200ms ease';

    // 1. D-Pad (Movement) - Bottom-Left (80x80px)
    const dpad = createDOMElement('div');
    dpad.id = 'touch-dpad';
    dpad.style.position = 'absolute';
    dpad.style.width = '80px';
    dpad.style.height = '80px';
    dpad.style.borderRadius = '50%';
    dpad.style.background = 'radial-gradient(circle, rgba(26,36,64,0.85) 0%, rgba(12,16,30,0.92) 100%)';
    dpad.style.border = '2px solid rgba(74, 144, 255, 0.6)';
    dpad.style.boxShadow = '0 0 16px rgba(74, 144, 255, 0.35)';
    dpad.style.pointerEvents = 'auto';
    dpad.style.touchAction = 'none';
    dpad.style.display = 'flex';
    dpad.style.alignItems = 'center';
    dpad.style.justifyContent = 'center';

    // Center Deadzone Indicator (24px)
    const deadzone = createDOMElement('div');
    deadzone.className = 'dpad-deadzone';
    deadzone.style.width = '24px';
    deadzone.style.height = '24px';
    deadzone.style.borderRadius = '50%';
    deadzone.style.background = 'rgba(74, 144, 255, 0.4)';
    deadzone.style.border = '1px solid #4A90FF';
    dpad.appendChild(deadzone);

    // D-Pad Directional Indicators (Visual arrows)
    const directions = [
      { id: 'up', symbol: '▲', style: { top: '4px', left: '33px' } },
      { id: 'down', symbol: '▼', style: { bottom: '4px', left: '33px' } },
      { id: 'left', symbol: '◀', style: { top: '33px', left: '4px' } },
      { id: 'right', symbol: '▶', style: { top: '33px', right: '4px' } }
    ];

    directions.forEach(dir => {
      const arrow = createDOMElement('span');
      arrow.className = `dpad-arrow dpad-arrow-${dir.id}`;
      arrow.textContent = dir.symbol;
      arrow.style.position = 'absolute';
      arrow.style.fontSize = '10px';
      arrow.style.color = 'rgba(255, 255, 255, 0.7)';
      Object.assign(arrow.style, dir.style);
      dpad.appendChild(arrow);
    });

    // 2. Action Buttons Container - Bottom-Right (60x60px each)
    const actionContainer = createDOMElement('div');
    actionContainer.id = 'touch-action-buttons';
    actionContainer.style.position = 'absolute';
    actionContainer.style.display = 'flex';
    actionContainer.style.gap = '12px';
    actionContainer.style.pointerEvents = 'auto';

    // Button Factory
    const makeButton = (id, label, icon, colorHex, borderHex, hotkey) => {
      const btn = createDOMElement('button');
      btn.id = `touch-btn-${id}`;
      btn.setAttribute('aria-label', label);
      btn.style.width = '60px';
      btn.style.height = '60px';
      btn.style.borderRadius = '50%';
      btn.style.background = `radial-gradient(circle, ${colorHex} 0%, rgba(12,16,30,0.92) 100%)`;
      btn.style.border = `2px solid ${borderHex}`;
      btn.style.color = '#ffffff';
      btn.style.fontFamily = 'monospace';
      btn.style.fontSize = '18px';
      btn.style.fontWeight = 'bold';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = `0 0 12px ${borderHex}`;
      btn.style.outline = 'none';
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.lineHeight = '1';
      btn.style.transition = 'transform 80ms ease, box-shadow 80ms ease';

      const labelSpan = createDOMElement('span');
      labelSpan.textContent = icon;
      labelSpan.style.fontSize = '16px';
      labelSpan.style.marginBottom = '2px';
      btn.appendChild(labelSpan);

      const hotkeySpan = createDOMElement('span');
      hotkeySpan.textContent = hotkey;
      hotkeySpan.style.fontSize = '10px';
      hotkeySpan.style.color = 'rgba(255, 255, 255, 0.8)';
      btn.appendChild(hotkeySpan);

      return btn;
    };

    // Button 1: E (Interact) - Cyan / Green
    const btnE = makeButton('e', 'Interact', '💬', 'rgba(0, 217, 255, 0.25)', '#00D9FF', 'E');
    // Button 2: M (Menu/Pause) - Purple
    const btnM = makeButton('m', 'Menu', '⚙️', 'rgba(179, 0, 255, 0.25)', '#B300FF', 'M');
    // Button 3: T (Minimap) - Blue
    const btnT = makeButton('t', 'Minimap', '🗺️', 'rgba(74, 144, 255, 0.25)', '#4A90FF', 'T');

    actionContainer.appendChild(btnT);
    actionContainer.appendChild(btnM);
    actionContainer.appendChild(btnE);

    // 3. Pause Button - Top-Right Corner (50x50px)
    const pauseBtn = createDOMElement('button');
    pauseBtn.id = 'touch-pause-button';
    pauseBtn.setAttribute('aria-label', 'Pause Game');
    pauseBtn.style.position = 'absolute';
    pauseBtn.style.width = '50px';
    pauseBtn.style.height = '50px';
    pauseBtn.style.borderRadius = '50%';
    pauseBtn.style.background = 'rgba(26, 26, 46, 0.85)';
    pauseBtn.style.border = '2px solid #FFD700';
    pauseBtn.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    pauseBtn.style.color = '#FFD700';
    pauseBtn.style.fontSize = '20px';
    pauseBtn.style.fontWeight = 'bold';
    pauseBtn.style.cursor = 'pointer';
    pauseBtn.style.pointerEvents = 'auto';
    pauseBtn.style.display = 'flex';
    pauseBtn.style.alignItems = 'center';
    pauseBtn.style.justifyContent = 'center';
    pauseBtn.textContent = '⏸';

    // Assemble DOM
    container.appendChild(dpad);
    container.appendChild(actionContainer);
    container.appendChild(pauseBtn);

    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(container);
    }

    // Bind Touch Events
    this._bindDpadEvents(dpad);
    this._bindActionButtonEvents(btnE, 'e');
    this._bindActionButtonEvents(btnM, 'escape');
    this._bindActionButtonEvents(btnT, 'tab');
    this._bindPauseButtonEvents(pauseBtn);

    this.touchControls = {
      container,
      dpad,
      deadzone,
      actionContainer,
      actionButtons: { e: btnE, m: btnM, t: btnT },
      pauseButton: pauseBtn
    };

    // Initial layout positioning
    this.updateTouchControlsLayout(this.currentWidth, this.currentHeight);

    return this.touchControls;
  }

  /**
   * Binds directional tracking to the D-Pad touch element.
   * @private
   */
  _bindDpadEvents(dpad) {
    const handleTouchStart = (e) => {
      e?.preventDefault?.();
      const touch = e.touches ? e.touches[0] : e;
      this.touchIdentifier = touch.identifier ?? 'mouse';
      this._updateDpadCenter(dpad);
      this._processDpadCoords(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e) => {
      e?.preventDefault?.();
      if (this.touchIdentifier === null) return;
      let touch = null;
      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.touchIdentifier) {
            touch = e.touches[i];
            break;
          }
        }
      } else {
        touch = e;
      }
      if (touch) {
        this._processDpadCoords(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e) => {
      e?.preventDefault?.();
      this._releaseDpadMovement();
      this.touchIdentifier = null;
    };

    dpad.addEventListener('touchstart', handleTouchStart);
    dpad.addEventListener('touchmove', handleTouchMove);
    dpad.addEventListener('touchend', handleTouchEnd);
    dpad.addEventListener('touchcancel', handleTouchEnd);

    // Fallback for desktop testing / mouse emulation
    dpad.addEventListener('mousedown', handleTouchStart);
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        if (this.touchIdentifier === 'mouse') handleTouchMove(e);
      });
      window.addEventListener('mouseup', () => {
        if (this.touchIdentifier === 'mouse') handleTouchEnd();
      });
    }
  }

  /**
   * Computes D-Pad center position on screen.
   * @private
   */
  _updateDpadCenter(dpad) {
    if (dpad?.getBoundingClientRect) {
      const rect = dpad.getBoundingClientRect();
      this.dpadCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
  }

  /**
   * Translates touch coordinate into 8-directional vector and sets virtual keys.
   * @private
   */
  _processDpadCoords(clientX, clientY) {
    const dx = clientX - this.dpadCenter.x;
    const dy = clientY - this.dpadCenter.y;
    const distance = Math.hypot(dx, dy);

    // Deadzone check (12px)
    if (distance < 12) {
      this._releaseDpadMovement();
      return;
    }

    // Calculate angle in degrees [-180, 180]
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    let nextDir = null;
    const newMovement = { up: false, down: false, left: false, right: false };

    // 8-direction sector partitioning (45 deg each)
    if (angle >= -22.5 && angle < 22.5) {
      nextDir = 'right';
      newMovement.right = true;
    } else if (angle >= 22.5 && angle < 67.5) {
      nextDir = 'down-right';
      newMovement.down = true;
      newMovement.right = true;
    } else if (angle >= 67.5 && angle < 112.5) {
      nextDir = 'down';
      newMovement.down = true;
    } else if (angle >= 112.5 && angle < 157.5) {
      nextDir = 'down-left';
      newMovement.down = true;
      newMovement.left = true;
    } else if (angle >= 157.5 || angle < -157.5) {
      nextDir = 'left';
      newMovement.left = true;
    } else if (angle >= -157.5 && angle < -112.5) {
      nextDir = 'up-left';
      newMovement.up = true;
      newMovement.left = true;
    } else if (angle >= -112.5 && angle < -67.5) {
      nextDir = 'up';
      newMovement.up = true;
    } else if (angle >= -67.5 && angle < -22.5) {
      nextDir = 'up-right';
      newMovement.up = true;
      newMovement.right = true;
    }

    // Trigger haptic vibration on direction transition
    if (nextDir !== this.currentDpadDirection) {
      this._triggerHapticFeedback(15);
      this.currentDpadDirection = nextDir;
    }

    // Synchronize keys with InputHandler
    this._syncVirtualMovementKeys(newMovement);
    this.activeMovement = newMovement;

    // Visual highlight on arrows
    this._highlightDpadVisuals(newMovement);
  }

  /**
   * Synchronizes active direction flags with InputHandler virtual keys.
   * @private
   */
  _syncVirtualMovementKeys(nextMovement) {
    const keys = [
      { dir: 'up', key: 'w' },
      { dir: 'down', key: 's' },
      { dir: 'left', key: 'a' },
      { dir: 'right', key: 'd' }
    ];

    keys.forEach(({ dir, key }) => {
      if (nextMovement[dir] && !this.activeMovement[dir]) {
        this.inputHandler?.simulateKeyDown?.(key);
      } else if (!nextMovement[dir] && this.activeMovement[dir]) {
        this.inputHandler?.simulateKeyUp?.(key);
      }
    });

    this.eventBus.emit('touch:dpad', {
      direction: this.currentDpadDirection,
      movement: nextMovement
    });
  }

  /**
   * Releases all virtual movement keys when D-Pad is released.
   * @private
   */
  _releaseDpadMovement() {
    this._syncVirtualMovementKeys({ up: false, down: false, left: false, right: false });
    this.activeMovement = { up: false, down: false, left: false, right: false };
    this.currentDpadDirection = null;
    this._highlightDpadVisuals(this.activeMovement);
  }

  /**
   * Highlights D-Pad arrows corresponding to active direction.
   * @private
   */
  _highlightDpadVisuals(movement) {
    if (!this.touchControls?.dpad?.querySelectorAll) return;
    const arrows = this.touchControls.dpad.querySelectorAll('.dpad-arrow');
    arrows.forEach(arrow => {
      const isUp = arrow.classList.contains('dpad-arrow-up') && movement.up;
      const isDown = arrow.classList.contains('dpad-arrow-down') && movement.down;
      const isLeft = arrow.classList.contains('dpad-arrow-left') && movement.left;
      const isRight = arrow.classList.contains('dpad-arrow-right') && movement.right;

      if (isUp || isDown || isLeft || isRight) {
        arrow.style.color = '#00D9FF';
        arrow.style.transform = 'scale(1.3)';
      } else {
        arrow.style.color = 'rgba(255, 255, 255, 0.7)';
        arrow.style.transform = 'scale(1.0)';
      }
    });
  }

  /**
   * Binds interaction handling to Action Buttons.
   * @private
   */
  _bindActionButtonEvents(button, keyTarget) {
    const pressHandler = (e) => {
      e?.preventDefault?.();
      button.style.transform = 'scale(0.92)';
      this._triggerHapticFeedback(25);
      this.audioManager?.playSfx?.('ui-click');

      this.inputHandler?.simulateKeyDown?.(keyTarget);

      if (keyTarget === 'e') {
        this.eventBus.emit('interactionAttempted', { type: 'interact', source: 'touch' });
      } else if (keyTarget === 'escape') {
        if (this.pauseScreenManager?.togglePause) {
          this.pauseScreenManager.togglePause();
        } else {
          this.eventBus.emit('togglePauseMenu');
        }
      } else if (keyTarget === 'tab') {
        this.eventBus.emit('toggleMinimap');
      }
    };

    const releaseHandler = (e) => {
      e?.preventDefault?.();
      button.style.transform = 'scale(1.0)';
      this.inputHandler?.simulateKeyUp?.(keyTarget);
    };

    button.addEventListener('touchstart', pressHandler);
    button.addEventListener('touchend', releaseHandler);
    button.addEventListener('touchcancel', releaseHandler);
    button.addEventListener('mousedown', pressHandler);
    button.addEventListener('mouseup', releaseHandler);
  }

  /**
   * Binds click/touch handler to top-right Pause Button.
   * @private
   */
  _bindPauseButtonEvents(button) {
    const pressHandler = (e) => {
      e?.preventDefault?.();
      this._triggerHapticFeedback(20);
      this.audioManager?.playSfx?.('ui-click');

      if (this.pauseScreenManager?.togglePause) {
        this.pauseScreenManager.togglePause();
      } else {
        this.eventBus.emit('togglePauseMenu');
      }
    };

    button.addEventListener('touchstart', pressHandler);
    button.addEventListener('click', pressHandler);
  }

  /**
   * Triggers haptic feedback pulse if device supports Vibration API.
   * @private
   */
  _triggerHapticFeedback(durationMs = 20) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {}
    }
  }

  /**
   * Fades in mobile touch controls overlay.
   */
  showTouchControls() {
    this.touchControlsVisible = true;
    if (this.touchControls?.container?.style) {
      this.touchControls.container.style.opacity = '1';
      this.touchControls.container.style.pointerEvents = 'none';
      if (this.touchControls.dpad) this.touchControls.dpad.style.pointerEvents = 'auto';
      if (this.touchControls.actionContainer) this.touchControls.actionContainer.style.pointerEvents = 'auto';
      if (this.touchControls.pauseButton) this.touchControls.pauseButton.style.pointerEvents = 'auto';
    }
  }

  /**
   * Fades out mobile touch controls overlay.
   */
  hideTouchControls() {
    this.touchControlsVisible = false;
    this._releaseDpadMovement();
    if (this.touchControls?.container?.style) {
      this.touchControls.container.style.opacity = '0';
      this.touchControls.container.style.pointerEvents = 'none';
      if (this.touchControls.dpad) this.touchControls.dpad.style.pointerEvents = 'none';
      if (this.touchControls.actionContainer) this.touchControls.actionContainer.style.pointerEvents = 'none';
      if (this.touchControls.pauseButton) this.touchControls.pauseButton.style.pointerEvents = 'none';
    }
  }

  /**
   * Repositions touch controls taking safe areas into account.
   * 
   * @param {number} [width=null]
   * @param {number} [height=null]
   */
  updateTouchControlsLayout(width = null, height = null) {
    if (!this.touchControls) return;

    const w = width !== null ? Number(width) : this.currentWidth;
    const h = height !== null ? Number(height) : this.currentHeight;
    const sa = this.safeArea;

    // D-Pad: Bottom-Left
    if (this.touchControls.dpad?.style) {
      this.touchControls.dpad.style.left = `${sa.left + 24}px`;
      this.touchControls.dpad.style.bottom = `${sa.bottom + 24}px`;
      this._updateDpadCenter(this.touchControls.dpad);
    }

    // Action Buttons: Bottom-Right
    if (this.touchControls.actionContainer?.style) {
      this.touchControls.actionContainer.style.right = `${sa.right + 24}px`;
      this.touchControls.actionContainer.style.bottom = `${sa.bottom + 24}px`;
    }

    // Pause Button: Top-Right
    if (this.touchControls.pauseButton?.style) {
      this.touchControls.pauseButton.style.right = `${sa.right + 16}px`;
      this.touchControls.pauseButton.style.top = `${sa.top + 16}px`;
    }
  }

  // ==========================================
  // RESPONSIVE LAYOUT ORCHESTRATION
  // ==========================================

  /**
   * Applies layout reorganizations and element adjustments according to device profile.
   */
  enableResponsiveLayout() {
    const dev = this.deviceType;

    // Toggle touch controls visibility
    if (dev === 'mobile') {
      this.showTouchControls();
    } else {
      this.hideTouchControls();
    }

    // Adjust standard HUD elements
    this.adjustHudElement('progressBar');
    this.adjustHudElement('minimap');
    this.adjustHudElement('zoneName');
    this.adjustHudElement('interactionPrompt');
    this.adjustHudElement('nextMilestone');
    this.adjustHudElement('controlHints');

    // Emit layout change event
    this.eventBus.emit('responsive:layoutChange', this.getUILayout());
  }

  /**
   * Repositions and reformats a specific HUD component based on active device profile.
   * 
   * @param {string} elementId - Component identifier ('minimap', 'progressBar', etc.)
   * @param {Object} [positioning=null] - Optional override positioning
   * @returns {Object} Resulting positioning config
   */
  adjustHudElement(elementId, positioning = null) {
    const dev = this.deviceType;
    const defaults = HUD_RESPONSIVE_CONFIG[elementId]?.[dev] || {};
    const config = { ...defaults, ...(positioning || {}) };

    if (!this.hudRenderer) return config;

    const el = this.hudRenderer.elements?.get?.(elementId);
    if (!el) return config;

    // Apply visibility
    if (config.visible !== undefined && typeof el.setVisible === 'function') {
      el.setVisible(config.visible);
    }

    // Apply positioning
    if (config.x !== undefined && config.y !== undefined && typeof el.setPosition === 'function') {
      let x = config.x;
      let y = config.y;
      if (x === 'right') x = this.currentWidth - (config.width || 0) - this.safeArea.right - 20;
      if (y === 'bottom') y = this.currentHeight - (config.height || 0) - this.safeArea.bottom - 20;
      el.setPosition(x, y);
    }

    // Apply font size
    if (config.fontSize && typeof el.setFontSize === 'function') {
      el.setFontSize(`${config.fontSize}px`);
    }

    // Apply custom text if provided
    if (config.text !== undefined && typeof el.setText === 'function') {
      el.setText(config.text);
    }

    return config;
  }

  /**
   * Constrains and scales a modal dialog to comfortably fit smaller screens.
   * 
   * @param {Object} modal - DOM element or modal container
   * @param {number} [baseWidth=600] - Baseline desktop width
   * @param {number} [baseHeight=500] - Baseline desktop height
   * @returns {{ width: number, height: number, scale: number }}
   */
  adjustModalSize(modal, baseWidth = 600, baseHeight = 500) {
    const scale = this.getResponsiveScale();
    const maxAllowedWidth = Math.round(this.currentWidth * 0.9);
    const maxAllowedHeight = Math.round(this.currentHeight * 0.85);

    const width = Math.min(Math.round(baseWidth * scale), maxAllowedWidth);
    const height = Math.min(Math.round(baseHeight * scale), maxAllowedHeight);

    if (modal?.style) {
      modal.style.width = `${width}px`;
      modal.style.maxWidth = `${maxAllowedWidth}px`;
      modal.style.maxHeight = `${maxAllowedHeight}px`;
      modal.style.overflowY = 'auto';
    }

    return { width, height, scale };
  }

  // ==========================================
  // RESIZE & ORIENTATION EVENT HANDLERS
  // ==========================================

  /**
   * Handles window / viewport resize events.
   * 
   * @param {number} width - New viewport width
   * @param {number} height - New viewport height
   * @returns {Object} Updated layout configuration
   */
  onWindowResize(width, height) {
    this.currentWidth = Number(width) || this._resolveCurrentWidth();
    this.currentHeight = Number(height) || this._resolveCurrentHeight();

    // Re-evaluate orientation & device profile
    this.isPortrait = this.currentHeight > this.currentWidth;
    this.deviceType = this.detectDeviceType(this.currentWidth);
    this.scale = this.getResponsiveScale();
    this.safeArea = this.calculateSafeArea();

    // Update layout across elements
    this.updateTouchControlsLayout(this.currentWidth, this.currentHeight);
    this.enableResponsiveLayout();

    const layout = this.getUILayout();
    this.eventBus.emit('responsive:resize', layout);
    return layout;
  }

  /**
   * Internal resize event callback.
   * @private
   */
  _handleResize() {
    this._updateViewportDimensions();
    this.onWindowResize(this.currentWidth, this.currentHeight);
  }

  /**
   * Internal orientation change callback.
   * @private
   */
  _handleOrientationChange() {
    setTimeout(() => {
      this._handleResize();
      this.eventBus.emit('responsive:orientationChange', {
        isPortrait: this.isPortrait,
        deviceType: this.deviceType
      });
    }, 100);
  }

  /**
   * Refreshes internal dimensions from DOM / window.
   * @private
   */
  _updateViewportDimensions() {
    this.currentWidth = this._resolveCurrentWidth();
    this.currentHeight = this._resolveCurrentHeight();
    this.isPortrait = this.currentHeight > this.currentWidth;
  }

  /**
   * Resolves current viewport width.
   * @private
   */
  _resolveCurrentWidth() {
    if (typeof window !== 'undefined' && window.innerWidth) {
      return window.innerWidth;
    }
    if (this.scene?.scale?.width) {
      return this.scene.scale.width;
    }
    return this.currentWidth || 1200;
  }

  /**
   * Resolves current viewport height.
   * @private
   */
  _resolveCurrentHeight() {
    if (typeof window !== 'undefined' && window.innerHeight) {
      return window.innerHeight;
    }
    if (this.scene?.scale?.height) {
      return this.scene.scale.height;
    }
    return this.currentHeight || 800;
  }

  // ==========================================
  // PRESETS & TELEMETRY
  // ==========================================

  /**
   * Applies an explicit layout preset, overriding auto-detection for testing.
   * 
   * @param {'desktop'|'tablet'|'mobile'|null} preset
   * @returns {Object} Updated layout config
   */
  presetLayout(preset) {
    if (preset && !['desktop', 'tablet', 'mobile'].includes(preset)) {
      throw new Error(`Invalid layout preset "${preset}". Expected "desktop", "tablet", or "mobile".`);
    }

    this.presetOverride = preset;
    this.deviceType = preset || this.detectDeviceType();
    this.scale = this.getResponsiveScale();
    this.safeArea = this.calculateSafeArea();

    // Map simulated canvas dimensions
    const dims = CANVAS_SIZES[this.deviceType];
    this.currentWidth = dims.width;
    this.currentHeight = dims.height;

    this.updateTouchControlsLayout(this.currentWidth, this.currentHeight);
    this.enableResponsiveLayout();

    return this.getUILayout();
  }

  /**
   * Returns complete snapshot of the current responsive layout configuration.
   * 
   * @returns {Object}
   */
  getUILayout() {
    return {
      deviceType: this.deviceType,
      scale: this.getResponsiveScale(),
      canvasDimensions: this.getCanvasDimensions(),
      inputMode: this.getInputMode(),
      portraitLocked: this.portraitLocked,
      safeArea: { ...this.safeArea },
      touchControlsVisible: this.touchControlsVisible,
      fontScales: { ...(FONT_SIZES[this.deviceType] || FONT_SIZES.desktop) }
    };
  }

  /**
   * Logs current responsive state to console for debugging.
   */
  logResponsiveState() {
    const layout = this.getUILayout();
    console.log('[ResponsiveUIManager] State Snapshot:', {
      device: layout.deviceType,
      scale: `${(layout.scale * 100).toFixed(0)}%`,
      canvas: `${layout.canvasDimensions.width}x${layout.canvasDimensions.height}`,
      inputMode: layout.inputMode,
      touchControls: layout.touchControlsVisible ? 'Visible' : 'Hidden',
      safeArea: layout.safeArea
    });
  }

  // ==========================================
  // SERIALIZATION & PERSISTENCE
  // ==========================================

  /**
   * Serializes responsive configuration state for persistent storage.
   * 
   * @returns {Object}
   */
  serialize() {
    return {
      deviceType: this.deviceType,
      userPreference: this.presetOverride,
      orientationPreference: this.portraitLocked ? 'landscape' : 'auto',
      inputModeOverride: this.presetOverride ? this.getInputMode() : null,
      timestamp: Date.now()
    };
  }

  /**
   * Restores responsive preferences from saved state.
   * 
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    if (data.userPreference) {
      this.presetLayout(data.userPreference);
    }
    if (data.orientationPreference === 'landscape') {
      this.lockPortrait();
    }
  }
}

// Global Singleton Instance
export const responsiveUIManager = new ResponsiveUIManager();
export default responsiveUIManager;
