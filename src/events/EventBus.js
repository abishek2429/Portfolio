/**
 * EventBus - Centralized Publish-Subscribe System
 * 
 * Dark Forest Portfolio Game
 * Decouples game systems (player, scenes, zones, NPCs, project modals, and UI HUD)
 * via high-performance event emissions with wildcard debugging and leak detection.
 */

// Canonical Event Constants
export const GAME_EVENTS = {
  PLAYER_MOVED: 'playerMoved',       // { x, y, zone }
  PLAYER_SPAWNED: 'playerSpawned',   // { startX, startY }
  ZONE_ENTERED: 'zoneEntered',       // { zoneId, zoneName }
  ZONE_EXITED: 'zoneExited'          // { zoneId }
};

export const NPC_EVENTS = {
  INTERACTION_START: 'npcInteractionStart', // { npcId, npcName }
  DIALOGUE_TIER_1: 'dialogueTier1',         // { npcId, dialogueText }
  DIALOGUE_TIER_2: 'dialogueTier2',         // { npcId, dialogueText }
  DIALOGUE_TIER_3: 'dialogueTier3',         // { npcId, dialogueText }
  INTERACTION_END: 'npcInteractionEnd'      // { npcId }
};

export const PROJECT_EVENTS = {
  PROJECT_CLICKED: 'projectClicked',           // { projectId, projectName }
  PROJECT_MODAL_OPENED: 'projectModalOpened',   // { projectId }
  PROJECT_MODAL_CLOSED: 'projectModalClosed'    // { projectId }
};

export const PROGRESS_EVENTS = {
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked', // { achievementId, achievementName }
  SUMMIT_UNLOCKED: 'summitUnlocked',           // {}
  NIGHT_MODE_UNLOCKED: 'nightModeUnlocked',     // {}
  EASTER_EGG_FOUND: 'easterEggFound'           // { eggId, eggName }
};

export const STATE_EVENTS = {
  GAME_STATE_CHANGED: 'gameStateChanged', // { newState }
  PROGRESS_UPDATED: 'progressUpdated'     // { progress }
};

export const ALL_EVENTS = {
  ...GAME_EVENTS,
  ...NPC_EVENTS,
  ...PROJECT_EVENTS,
  ...PROGRESS_EVENTS,
  ...STATE_EVENTS
};

export class EventBus {
  /**
   * Singleton constructor
   * @param {number} [maxListeners=10] - Threshold for leak detection warning
   */
  constructor(maxListeners = 10) {
    if (EventBus._instance) {
      return EventBus._instance;
    }

    this._listeners = new Map();
    this.maxListeners = maxListeners;
    EventBus._instance = this;
  }

  /**
   * Subscribes a callback to an event.
   * @param {string} eventName - Name of event or '*' for wildcard debugging
   * @param {Function} callback - Event handler function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      console.warn(`[EventBus] Callback for "${eventName}" must be a function.`);
      return () => {};
    }

    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }

    const listeners = this._listeners.get(eventName);

    // Prevent listener stack overflow / memory leaks
    if (listeners.size >= this.maxListeners) {
      console.warn(
        `[EventBus] Warning: Possible memory leak detected. ` +
        `Event "${eventName}" has ${listeners.size + 1} listeners subscribed (limit is ${this.maxListeners}).`
      );
    }

    listeners.add(callback);

    // Return auto-unsubscriber
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribes a callback from an event.
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function reference to remove
   */
  off(eventName, callback) {
    if (!this._listeners.has(eventName)) return;

    const listeners = this._listeners.get(eventName);

    // Match either the direct function or its wrapper (e.g. from once())
    for (const fn of listeners) {
      if (fn === callback || fn._original === callback) {
        listeners.delete(fn);
      }
    }

    if (listeners.size === 0) {
      this._listeners.delete(eventName);
    }
  }

  /**
   * Subscribes a callback that triggers once and immediately self-unsubscribes.
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    if (typeof callback !== 'function') return () => {};

    const onceWrapper = (data) => {
      this.off(eventName, onceWrapper);
      callback(data);
    };

    // Store original function reference so off(eventName, callback) works before trigger
    onceWrapper._original = callback;

    return this.on(eventName, onceWrapper);
  }

  /**
   * Publishes an event to all registered listeners.
   * Also triggers wildcard '*' listeners for debugging/monitoring.
   * 
   * @param {string} eventName - Name of the event
   * @param {any} [data={}] - Payload data passed to callbacks
   */
  emit(eventName, data = {}) {
    // 1. Invoke direct event listeners
    if (this._listeners.has(eventName)) {
      const listeners = [...this._listeners.get(eventName)];
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (err) {
          console.error(`[EventBus] Error executing listener for "${eventName}":`, err);
        }
      }
    }

    // 2. Invoke wildcard '*' listeners (debug monitoring)
    if (eventName !== '*' && this._listeners.has('*')) {
      const wildcardListeners = [...this._listeners.get('*')];
      for (const listener of wildcardListeners) {
        try {
          listener(eventName, data);
        } catch (err) {
          console.error(`[EventBus] Error executing wildcard listener for "${eventName}":`, err);
        }
      }
    }
  }

  /**
   * Removes all listeners for a specific event, or clears everything.
   * @param {string} [eventName] - If omitted, clears all event listeners.
   */
  clear(eventName) {
    if (eventName) {
      this._listeners.delete(eventName);
    } else {
      this._listeners.clear();
    }
  }

  /**
   * Helper to retrieve count of active listeners for an event.
   * @param {string} eventName
   * @returns {number}
   */
  listenerCount(eventName) {
    return this._listeners.get(eventName)?.size || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();
export default eventBus;
