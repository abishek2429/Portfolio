/**
 * InputHandler - Centralized Keyboard, Mouse, and Contextual Input System
 * 
 * Dark Forest Portfolio Game
 * Centralizes WASD/arrow movement, E/Space interactions, UI modal controls,
 * context filtering ('gameplay', 'dialogue', 'menu', 'modal'), debug hotkeys,
 * mouse raycasting, and high-performance EventBus emissions.
 */

import eventBus, { GAME_EVENTS } from '../events/EventBus.js';

export const INPUT_CONTEXTS = {
  GAMEPLAY: 'gameplay',
  DIALOGUE: 'dialogue',
  MENU: 'menu',
  MODAL: 'modal'
};

export const DEFAULT_KEY_BINDINGS = {
  MOVE_UP: ['w', 'up'],
  MOVE_DOWN: ['s', 'down'],
  MOVE_LEFT: ['a', 'left'],
  MOVE_RIGHT: ['d', 'right'],
  INTERACT: ['e', 'enter', 'space'],
  PAUSE: ['escape'],
  TOGGLE_MINIMAP: ['tab'],
  TOGGLE_MUTE: ['m'],
  DEBUG_TELEPORT: ['t'],
  DEBUG_ACHIEVEMENTS: ['g'],
  DEBUG_RESET: ['r']
};

export class InputHandler {
  constructor() {
    this.scene = null;

    // Core Data Structure
    this.keysPressed = new Map();       // key -> boolean (currently held)
    this.keyJustPressed = new Map();    // key -> boolean (pressed this frame)
    this.inputContext = INPUT_CONTEXTS.GAMEPLAY;
    this.inputLocked = false;
    this.debugMode = false;
    this.keyBindings = new Map(Object.entries(DEFAULT_KEY_BINDINGS));

    // Listeners & Callbacks
    this._keyDownCallbacks = new Map(); // key -> Set<Function>
    this._keyUpCallbacks = new Map();   // key -> Set<Function>
    this._clickCallbacks = new Set();   // Set<Function>
    this._moveCallbacks = new Set();    // Set<Function>

    // Mouse Tracking
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      isDown: false,
      button: 0
    };

    // Bound DOM & Phaser event handlers for clean removal
    this._boundOnKeyDown = this._handleKeyDown.bind(this);
    this._boundOnKeyUp = this._handleKeyUp.bind(this);
    this._boundOnPointerDown = this._handlePointerDown.bind(this);
    this._boundOnPointerUp = this._handlePointerUp.bind(this);
    this._boundOnPointerMove = this._handlePointerMove.bind(this);
  }

  /**
   * Initializes the input handling system and binds Phaser / DOM listeners.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @returns {InputHandler}
   */
  create(scene) {
    this.scene = scene;

    // Bind Phaser Keyboard if available
    if (scene?.input?.keyboard) {
      scene.input.keyboard.on('keydown', this._boundOnKeyDown);
      scene.input.keyboard.on('keyup', this._boundOnKeyUp);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._boundOnKeyDown);
      window.addEventListener('keyup', this._boundOnKeyUp);
    }

    // Bind Phaser Pointer (Mouse / Touch) if available
    if (scene?.input) {
      scene.input.on('pointerdown', this._boundOnPointerDown);
      scene.input.on('pointerup', this._boundOnPointerUp);
      scene.input.on('pointermove', this._boundOnPointerMove);
    }

    return this;
  }

  /**
   * Per-frame update loop.
   * Resets single-frame keyJustPressed flags.
   */
  update() {
    this.keyJustPressed.clear();
  }

  /**
   * Changes the active input context mode ('gameplay' | 'dialogue' | 'menu' | 'modal').
   * 
   * @param {string} context - Target input context
   */
  setInputContext(context) {
    const valid = Object.values(INPUT_CONTEXTS);
    if (valid.includes(context)) {
      this.inputContext = context;
    } else {
      console.warn(`[InputHandler] Unknown input context: ${context}`);
      this.inputContext = context;
    }
  }

  /**
   * Returns current active input context.
   * @returns {string}
   */
  getInputContext() {
    return this.inputContext;
  }

  /**
   * Checks whether a key is currently being held down.
   * 
   * @param {string} keyName - Target key identifier (case-insensitive)
   * @returns {boolean}
   */
  isKeyPressed(keyName) {
    if (this.inputLocked) return false;
    const key = this._normalizeKey(keyName);
    if (!this._isKeyAllowedInContext(key)) return false;
    return Boolean(this.keysPressed.get(key));
  }

  /**
   * Checks whether a key was just pressed during the current frame.
   * 
   * @param {string} keyName - Target key identifier
   * @returns {boolean}
   */
  isKeyJustPressed(keyName) {
    if (this.inputLocked) return false;
    const key = this._normalizeKey(keyName);
    if (!this._isKeyAllowedInContext(key)) return false;
    return Boolean(this.keyJustPressed.get(key));
  }

  /**
   * Registers a callback for a specific key press.
   * 
   * @param {string} keyName - Key name
   * @param {Function} callback - Handler callback
   * @returns {Function} Unsubscribe function
   */
  onKeyDown(keyName, callback) {
    const key = this._normalizeKey(keyName);
    if (!this._keyDownCallbacks.has(key)) {
      this._keyDownCallbacks.set(key, new Set());
    }
    this._keyDownCallbacks.get(key).add(callback);
    return () => this._keyDownCallbacks.get(key)?.delete(callback);
  }

  /**
   * Registers a callback for a specific key release.
   * 
   * @param {string} keyName - Key name
   * @param {Function} callback - Handler callback
   * @returns {Function} Unsubscribe function
   */
  onKeyUp(keyName, callback) {
    const key = this._normalizeKey(keyName);
    if (!this._keyUpCallbacks.has(key)) {
      this._keyUpCallbacks.set(key, new Set());
    }
    this._keyUpCallbacks.get(key).add(callback);
    return () => this._keyUpCallbacks.get(key)?.delete(callback);
  }

  /**
   * Registers a callback for mouse clicks.
   * 
   * @param {Function} callback - Receives { x, y, worldX, worldY, button, pointer }
   * @returns {Function} Unsubscribe function
   */
  onMouseClick(callback) {
    this._clickCallbacks.add(callback);
    return () => this._clickCallbacks.delete(callback);
  }

  /**
   * Registers a callback for mouse movement.
   * 
   * @param {Function} callback - Receives { x, y, worldX, worldY, pointer }
   * @returns {Function} Unsubscribe function
   */
  onMouseMove(callback) {
    this._moveCallbacks.add(callback);
    return () => this._moveCallbacks.delete(callback);
  }

  /**
   * Returns current mouse position in screen and world coordinates.
   * 
   * @returns {{ x: number, y: number, worldX: number, worldY: number }}
   */
  getMousePosition() {
    if (this.scene?.input?.activePointer) {
      const p = this.scene.input.activePointer;
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.worldX = p.worldX ?? (p.x + (this.scene.cameras?.main?.scrollX || 0));
      this.mouse.worldY = p.worldY ?? (p.y + (this.scene.cameras?.main?.scrollY || 0));
    }
    return { ...this.mouse };
  }

  /**
   * Disables or enables all input processing (cutscenes, transitions).
   * 
   * @param {boolean} locked
   */
  lockInput(locked) {
    this.inputLocked = Boolean(locked);
    if (this.inputLocked) {
      this.keysPressed.clear();
      this.keyJustPressed.clear();
    }
  }

  lockMovement(locked = true) {
    if (locked) {
      this.setInputContext(INPUT_CONTEXTS.DIALOGUE);
    } else {
      this.setInputContext(INPUT_CONTEXTS.GAMEPLAY);
    }
  }

  /**
   * Returns whether input is currently frozen.
   * @returns {boolean}
   */
  isInputLocked() {
    return this.inputLocked;
  }

  /**
   * Enables or disables development debug hotkeys (T, G, R).
   * 
   * @param {boolean} enabled
   */
  enableDebugMode(enabled) {
    this.debugMode = Boolean(enabled);
  }

  /**
   * Returns whether debug mode is currently active.
   * @returns {boolean}
   */
  isDebugMode() {
    return this.debugMode;
  }

  /**
   * Returns normalized 4-directional movement booleans.
   * Only active during 'gameplay' context when input is unlocked.
   * 
   * @returns {{ up: boolean, down: boolean, left: boolean, right: boolean }}
   */
  getMovementInput() {
    if (this.inputLocked || this.inputContext !== INPUT_CONTEXTS.GAMEPLAY) {
      return { up: false, down: false, left: false, right: false };
    }

    const up = this.isKeyPressed('w') || this.isKeyPressed('up');
    const down = this.isKeyPressed('s') || this.isKeyPressed('down');
    const left = this.isKeyPressed('a') || this.isKeyPressed('left');
    const right = this.isKeyPressed('d') || this.isKeyPressed('right');

    return { up, down, left, right };
  }

  /**
   * Returns whether an interaction action was triggered this frame (E, Enter, or Space).
   * 
   * @returns {boolean}
   */
  getInteractionInput() {
    if (this.inputLocked) return false;
    if (this.inputContext !== INPUT_CONTEXTS.GAMEPLAY && this.inputContext !== INPUT_CONTEXTS.DIALOGUE) {
      return false;
    }

    const triggered = (
      this.isKeyJustPressed('e') ||
      this.isKeyJustPressed('enter') ||
      this.isKeyJustPressed('space')
    );

    if (triggered) {
      eventBus.emit('interactionAttempted', {
        type: this.inputContext === INPUT_CONTEXTS.DIALOGUE ? 'dialogue' : 'interact',
        context: this.inputContext
      });
    }

    return triggered;
  }

  /**
   * Simulates a key down event for virtual / touch controls.
   * 
   * @param {string} key - Key identifier (e.g. 'w', 'a', 's', 'd', 'e')
   */
  simulateKeyDown(key) {
    this._handleKeyDown({ key: String(key).toLowerCase() });
  }

  /**
   * Simulates a key up event for virtual / touch controls.
   * 
   * @param {string} key - Key identifier
   */
  simulateKeyUp(key) {
    this._handleKeyUp({ key: String(key).toLowerCase() });
  }

  /**
   * Cleans up all listeners and resets input maps on scene shutdown.
   */
  destroy() {
    if (this.scene?.input?.keyboard) {
      this.scene.input.keyboard.off('keydown', this._boundOnKeyDown);
      this.scene.input.keyboard.off('keyup', this._boundOnKeyUp);
    } else if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._boundOnKeyDown);
      window.removeEventListener('keyup', this._boundOnKeyUp);
    }

    if (this.scene?.input) {
      this.scene.input.off('pointerdown', this._boundOnPointerDown);
      this.scene.input.off('pointerup', this._boundOnPointerUp);
      this.scene.input.off('pointermove', this._boundOnPointerMove);
    }

    this.keysPressed.clear();
    this.keyJustPressed.clear();
    this._keyDownCallbacks.clear();
    this._keyUpCallbacks.clear();
    this._clickCallbacks.clear();
    this._moveCallbacks.clear();
  }

  // --- Internal Event Handlers ---

  _handleKeyDown(event) {
    if (this.inputLocked) return;

    const rawKey = event.key || event.code;
    const key = this._normalizeKey(rawKey);

    // Prevent key-repeat spam; only flag justPressed if wasn't already held
    if (!this.keysPressed.get(key)) {
      this.keyJustPressed.set(key, true);
    }
    this.keysPressed.set(key, true);

    // Emit EventBus general key press event
    eventBus.emit('keyPressed', { key, context: this.inputContext });

    // Handle debug shortcuts if debugMode enabled
    if (this.debugMode) {
      this._handleDebugHotkeys(key);
    }

    // Context-specific actions
    this._handleContextHotkeys(key);

    // Invoke registered key callbacks
    if (this._keyDownCallbacks.has(key)) {
      this._keyDownCallbacks.get(key).forEach((cb) => cb(event));
    }
  }

  _handleKeyUp(event) {
    const rawKey = event.key || event.code;
    const key = this._normalizeKey(rawKey);

    this.keysPressed.set(key, false);
    this.keyJustPressed.delete(key);

    if (this._keyUpCallbacks.has(key)) {
      this._keyUpCallbacks.get(key).forEach((cb) => cb(event));
    }
  }

  _handlePointerDown(pointer) {
    if (this.inputLocked) return;

    const coords = this._resolvePointerCoords(pointer);
    this.mouse = { ...coords, isDown: true, button: pointer.button ?? 0 };

    eventBus.emit('mouseClicked', {
      x: coords.x,
      y: coords.y,
      worldX: coords.worldX,
      worldY: coords.worldY,
      button: coords.button
    });

    this._clickCallbacks.forEach((cb) => cb({ ...coords, pointer }));
  }

  _handlePointerUp(pointer) {
    const coords = this._resolvePointerCoords(pointer);
    this.mouse = { ...coords, isDown: false, button: pointer.button ?? 0 };
  }

  _handlePointerMove(pointer) {
    const coords = this._resolvePointerCoords(pointer);
    this.mouse = { ...coords, isDown: this.mouse.isDown, button: this.mouse.button };

    this._moveCallbacks.forEach((cb) => cb({ ...coords, pointer }));
  }

  _resolvePointerCoords(pointer) {
    const x = pointer.x ?? 0;
    const y = pointer.y ?? 0;
    const worldX = pointer.worldX ?? (x + (this.scene?.cameras?.main?.scrollX || 0));
    const worldY = pointer.worldY ?? (y + (this.scene?.cameras?.main?.scrollY || 0));
    return { x, y, worldX, worldY, button: pointer.button ?? 0 };
  }

  _handleDebugHotkeys(key) {
    if (key === 't') {
      const mouse = this.getMousePosition();
      if (this.scene?.player?.setPosition) {
        this.scene.player.setPosition(mouse.worldX, mouse.worldY);
      }
      eventBus.emit('debugTeleport', { x: mouse.worldX, y: mouse.worldY });
    } else if (key === 'g') {
      eventBus.emit('debugGrantAchievements');
    } else if (key === 'r') {
      eventBus.emit('debugResetGame');
    }
  }

  _handleContextHotkeys(key) {
    if (key === 'tab') {
      eventBus.emit('toggleMinimap');
    } else if (key === 'm') {
      eventBus.emit('toggleMusic');
    } else if (key === 'escape') {
      eventBus.emit('togglePauseMenu', { context: this.inputContext });
    }
  }

  _isKeyAllowedInContext(key) {
    switch (this.inputContext) {
      case INPUT_CONTEXTS.GAMEPLAY:
        return true;

      case INPUT_CONTEXTS.DIALOGUE:
        // Dialogue navigation: arrow keys / WASD + interaction confirmation
        return ['up', 'down', 'left', 'right', 'w', 'a', 's', 'd', 'e', 'enter', 'space', 'escape'].includes(key);

      case INPUT_CONTEXTS.MENU:
        // Menu selection: arrow keys / WASD + Enter / Space / Escape
        return ['up', 'down', 'left', 'right', 'w', 'a', 's', 'd', 'enter', 'space', 'escape'].includes(key);

      case INPUT_CONTEXTS.MODAL:
        // Modal viewing: Escape to close, Enter to confirm
        return ['escape', 'enter', 'space'].includes(key);

      default:
        return true;
    }
  }

  _normalizeKey(key) {
    if (!key) return '';
    const k = String(key).toLowerCase().trim();
    switch (k) {
      case 'arrowup':
      case 'up_arrow':
      case 'up':
        return 'up';
      case 'arrowdown':
      case 'down_arrow':
      case 'down':
        return 'down';
      case 'arrowleft':
      case 'left_arrow':
      case 'left':
        return 'left';
      case 'arrowright':
      case 'right_arrow':
      case 'right':
        return 'right';
      case ' ':
      case 'spacebar':
      case 'space':
        return 'space';
      case 'enter':
      case 'return':
        return 'enter';
      case 'escape':
      case 'esc':
        return 'escape';
      case 'tab':
        return 'tab';
      default:
        if (k.startsWith('key')) return k.slice(3);
        return k;
    }
  }
}

// Export singleton instance
export const inputHandler = new InputHandler();
export default inputHandler;
