/**
 * EasterEggManager - Secret Discovery & Hidden Lore Management System
 * 
 * Dark Forest Portfolio Game
 * Defines 5 secret world locations, manages silent proximity triggering,
 * unlocks hidden lore and rewards (The Researcher NPC & Night Mode),
 * and reports discovery metrics for achievements and UI.
 */

import eventBus, {
  GAME_EVENTS,
  PROGRESS_EVENTS
} from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';

export const EASTER_EGG_DEFINITIONS = {
  competitive: {
    id: 'competitive',
    name: 'Competitive Programming Cave',
    location: { x: 100, y: 500 },
    zone: 'off-map-left',
    description: 'A hidden cave with coding problems etched on walls',
    discoveryRadius: 50,
    reward: 'Achievement progress + lore unlock',
    hint: 'A cave entrance visible through the trees to the left',
    content: 'You practice algorithms. Few developers do.',
    icon: '🏔️',
    requirements: { type: 'none' }
  },
  football: {
    id: 'football',
    name: 'Football Field',
    location: { x: 1100, y: 600 },
    zone: 'off-map-right',
    description: 'A clearing with a makeshift football pitch',
    discoveryRadius: 50,
    reward: 'Achievement progress + character lore',
    hint: 'Sports echoes from the right side of the map',
    content: 'Football keeps you grounded. Balance matters.',
    icon: '⚽',
    requirements: { type: 'none' }
  },
  gym: {
    id: 'gym',
    name: 'Gym Training Grounds',
    location: { x: 1000, y: 200 },
    zone: 'off-map-right',
    description: 'A fitness area where you train',
    discoveryRadius: 50,
    reward: 'Achievement progress + character lore',
    hint: 'Strong muscles echo from the mountain side',
    content: "You invest in health. That's rare among developers.",
    icon: '💪',
    requirements: { type: 'none' }
  },
  research: {
    id: 'research',
    name: 'Secret Research Lab',
    location: { x: 150, y: 100 },
    zone: 'off-map-left',
    description: 'Hidden laboratory with research archives',
    discoveryRadius: 50,
    reward: 'Unlock special NPC: "The Researcher"',
    hint: 'Deep in the AI & ML Woods, beyond the temple',
    content: 'Your published research. Not many do this.',
    icon: '🔬',
    special: 'Unlocks bonus dialogue with "The Researcher" NPC',
    requirements: { allZonesVisited: true, tier3NpcCount: 1 }
  },
  nightmode: {
    id: 'nightmode',
    name: 'Night Mode Portal',
    location: { x: 550, y: 120 },
    zone: 'summit-area',
    description: 'A mystical portal near the summit that transforms world',
    discoveryRadius: 75,
    reward: 'Unlock night mode aesthetic variant',
    hint: 'A shimmering vortex near the peak',
    content: 'The forest reveals another face in darkness',
    icon: '🌙',
    special: 'Toggles global night mode on/off',
    requirements: { summitReached: true }
  }
};

export class EasterEggManager {
  constructor(gameState = null, eventBusRef = null) {
    this.gameState = gameState || defaultGameState;
    this.eventBus = eventBusRef || eventBus;
    this.scene = null;

    // Easter egg repository: eggId -> egg object
    this.eggs = new Map();
    this.timestamps = new Map();

    // Active toast notification tracking
    this.activeToast = null;
    this.toastTimer = null;

    // Event bus handlers
    this._unsubscribers = [];

    // Pre-populate definitions
    this._initDefinitions();
  }

  /**
   * Initializes egg objects from canonical definitions.
   * @private
   */
  _initDefinitions() {
    this.eggs.clear();
    this.timestamps.clear();

    Object.values(EASTER_EGG_DEFINITIONS).forEach(def => {
      this.eggs.set(def.id, {
        ...def,
        location: { ...def.location },
        requirements: { ...(def.requirements || {}) },
        discovered: false,
        discoveredTime: null
      });
    });
  }

  /**
   * Initializes the EasterEggManager with game dependencies and syncs state.
   * 
   * @param {Phaser.Scene} [scene] - Active Phaser scene
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @returns {EasterEggManager}
   */
  create(scene = null, gameState = null, eventBusRef = null) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;
    if (eventBusRef) this.eventBus = eventBusRef;

    this._detachEventListeners();
    this._initDefinitions();
    this._syncFromGameState();
    this._attachEventListeners();

    return this;
  }

  /**
   * Synchronizes discovered status from GameState.easterEggsFound.
   * @private
   */
  _syncFromGameState() {
    if (!this.gameState?.easterEggsFound) return;

    this.gameState.easterEggsFound.forEach(eggId => {
      const egg = this.eggs.get(eggId);
      if (egg && !egg.discovered) {
        egg.discovered = true;
        egg.discoveredTime = this.timestamps.get(eggId) || Date.now();
        this.timestamps.set(eggId, egg.discoveredTime);
      }
    });
  }

  /**
   * Listens to player movement or state sync.
   * @private
   */
  _attachEventListeners() {
    const unsubMove = this.eventBus.on(GAME_EVENTS.PLAYER_MOVED, (payload) => {
      if (payload && typeof payload.x === 'number' && typeof payload.y === 'number') {
        this.update(payload);
      }
    });

    this._unsubscribers = [unsubMove];
  }

  /**
   * Detaches event listeners.
   * @private
   */
  _detachEventListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Per-frame proximity evaluator.
   * Checks player distance against undiscovered easter eggs.
   * 
   * @param {Object} playerPos - { x, y } coordinates
   */
  update(playerPos) {
    if (!playerPos) return;

    const px = playerPos.x ?? playerPos.position?.x ?? 0;
    const py = playerPos.y ?? playerPos.position?.y ?? 0;

    for (const egg of this.eggs.values()) {
      if (egg.discovered) continue;

      const reqCheck = this.checkEggRequirements(egg.id);
      if (!reqCheck.canDiscover) continue;

      const dist = Math.hypot(px - egg.location.x, py - egg.location.y);
      if (dist <= egg.discoveryRadius) {
        this.discoverEgg(egg.id);
      }
    }
  }

  /**
   * Marks an easter egg as discovered, records timestamp, unlocks rewards, and shows toast.
   * 
   * @param {string} eggId - Easter egg identifier
   * @returns {boolean} True if newly discovered
   */
  discoverEgg(eggId) {
    const egg = this.eggs.get(eggId);
    if (!egg || egg.discovered) return false;

    egg.discovered = true;
    egg.discoveredTime = Date.now();
    this.timestamps.set(eggId, egg.discoveredTime);

    // Sync with GameState
    if (this.gameState) {
      if (typeof this.gameState.findEasterEgg === 'function') {
        this.gameState.findEasterEgg(eggId);
      } else {
        if (!this.gameState.easterEggsFound) {
          this.gameState.easterEggsFound = [];
        }
        if (!this.gameState.easterEggsFound.includes(eggId)) {
          this.gameState.easterEggsFound.push(eggId);
        }
      }
    }

    // Trigger secondary unlock effects
    this.unlockBonusContent(eggId);

    // Emit EventBus notifications
    this.eventBus.emit(PROGRESS_EVENTS.EASTER_EGG_DISCOVERED, {
      eggId: egg.id,
      eggName: egg.name,
      location: { ...egg.location },
      content: egg.content,
      icon: egg.icon,
      timestamp: egg.discoveredTime
    });

    this.eventBus.emit(PROGRESS_EVENTS.EASTER_EGG_PROGRESS, this.getDiscoveryCount());

    // Display on-screen discovery notification
    this.displayEggDiscoveryNotification(eggId);

    return true;
  }

  /**
   * Evaluates prerequisites to discover a specific easter egg.
   * 
   * @param {string} eggId - Easter egg ID
   * @returns {{ canDiscover: boolean, requirements: Array<string>, reason: string }}
   */
  checkEggRequirements(eggId) {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      return { canDiscover: false, requirements: [], reason: 'Unknown easter egg' };
    }

    if (egg.discovered) {
      return { canDiscover: true, requirements: [], reason: 'Already discovered' };
    }

    if (eggId === 'research') {
      const baseZones = ['foundation', 'webdev', 'aiml', 'mobile'];
      const visited = this.gameState?.zonesVisited || [];
      const allZonesVisited = baseZones.every(z => visited.includes(z));

      const interacted = this.gameState?.npcsInteracted || {};
      const tier3Npcs = Object.values(interacted).filter(t => Number(t) >= 3).length;
      const hasTier3 = tier3Npcs >= 1;

      const canDiscover = allZonesVisited && hasTier3;
      const requirements = [
        'Explore all 4 main zones',
        'Reach Tier 3 dialogue with at least 1 mentor'
      ];
      const reason = canDiscover
        ? 'Prerequisites met - Research Lab can be discovered'
        : 'Secret Research Lab requires exploring all 4 zones and reaching Tier 3 with an NPC';

      return { canDiscover, requirements, reason };
    }

    if (eggId === 'nightmode') {
      const visited = this.gameState?.zonesVisited || [];
      const current = this.gameState?.currentZone;
      const summitReached = visited.includes('summit') || current === 'summit' || this.gameState?.unlocks?.summitAccessible;

      const requirements = ['Reach The Summit'];
      const reason = summitReached
        ? 'Prerequisites met - Portal active'
        : 'Night Mode Portal can only be discovered after reaching The Summit';

      return { canDiscover: Boolean(summitReached), requirements, reason };
    }

    // competitive, football, gym
    return {
      canDiscover: true,
      requirements: [],
      reason: 'Always accessible'
    };
  }

  /**
   * Triggers bonus rewards and secondary unlocks associated with an easter egg.
   * 
   * @param {string} eggId - Easter egg ID
   */
  unlockBonusContent(eggId) {
    if (eggId === 'research') {
      this.eventBus.emit(PROGRESS_EVENTS.BONUS_CONTENT_UNLOCKED, {
        eggId: 'research',
        contentType: 'npc',
        name: 'The Researcher',
        description: 'Unlocked special NPC: The Researcher with unique academic lore'
      });
    } else if (eggId === 'nightmode') {
      if (this.gameState) {
        if (!this.gameState.unlocks) this.gameState.unlocks = {};
        this.gameState.unlocks.nightModeUnlocked = true;
      }

      this.eventBus.emit(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, {});
      this.eventBus.emit(PROGRESS_EVENTS.BONUS_CONTENT_UNLOCKED, {
        eggId: 'nightmode',
        contentType: 'theme',
        description: 'Unlocked Night Mode aesthetic variant'
      });
    } else {
      this.eventBus.emit(PROGRESS_EVENTS.BONUS_CONTENT_UNLOCKED, {
        eggId,
        contentType: 'lore',
        description: `Unlocked lore: ${this.getEggById(eggId)?.name}`
      });
    }
  }

  /**
   * Checks if an easter egg has been discovered.
   * @param {string} eggId
   * @returns {boolean}
   */
  isEggDiscovered(eggId) {
    return Boolean(this.eggs.get(eggId)?.discovered);
  }

  /**
   * Returns array of all discovered easter eggs.
   * @returns {Array<Object>}
   */
  getDiscoveredEggs() {
    return Array.from(this.eggs.values()).filter(e => e.discovered);
  }

  /**
   * Returns array of all undiscovered easter eggs.
   * @returns {Array<Object>}
   */
  getUndiscoveredEggs() {
    return Array.from(this.eggs.values()).filter(e => !e.discovered);
  }

  /**
   * Returns array of all easter eggs.
   * Undiscovered eggs mask sensitive lore description as '???'.
   * 
   * @returns {Array<Object>}
   */
  getAllEggs() {
    return Array.from(this.eggs.values()).map(e => {
      if (!e.discovered) {
        return {
          ...e,
          name: '???',
          description: 'Undiscovered secret - explore the wild corners of the dark forest',
          content: '???'
        };
      }
      return { ...e };
    });
  }

  /**
   * Retrieves single easter egg by ID.
   * @param {string} eggId
   * @returns {Object|null}
   */
  getEggById(eggId) {
    return this.eggs.get(eggId) || null;
  }

  /**
   * Returns discovery text/lore revealed upon finding egg.
   * @param {string} eggId
   * @returns {string}
   */
  getEggContent(eggId) {
    const egg = this.eggs.get(eggId);
    return egg ? egg.content : '';
  }

  /**
   * Returns exploration hint text for an egg.
   * @param {string} eggId
   * @returns {string}
   */
  getEggHint(eggId) {
    const egg = this.eggs.get(eggId);
    return egg ? egg.hint : '';
  }

  /**
   * Returns all eggs located in a specific zone or region.
   * @param {string} zoneId
   * @returns {Array<Object>}
   */
  getEggsByZone(zoneId) {
    return Array.from(this.eggs.values()).filter(e => e.zone.toLowerCase() === zoneId.toLowerCase());
  }

  /**
   * Returns overall discovery percentage (0 to 100%).
   * @returns {number}
   */
  getDiscoveryPercentage() {
    const total = this.eggs.size || 5;
    const discovered = this.getDiscoveredEggs().length;
    return Math.round((discovered / total) * 100);
  }

  /**
   * Returns discovery count fraction.
   * @returns {{ discovered: number, total: number }}
   */
  getDiscoveryCount() {
    return {
      discovered: this.getDiscoveredEggs().length,
      total: this.eggs.size || 5
    };
  }

  /**
   * Returns world coordinates for an egg (useful for dev mode / debugging).
   * @param {string} eggId
   * @returns {{ x: number, y: number }|null}
   */
  getEggLocation(eggId) {
    const egg = this.eggs.get(eggId);
    return egg ? { ...egg.location } : null;
  }

  /**
   * When an egg was discovered.
   * @param {string} eggId
   * @returns {number|null}
   */
  getEggDiscoveryTime(eggId) {
    return this.timestamps.get(eggId) || null;
  }

  /**
   * Displays discovery toast notification top-center of screen.
   * 
   * @param {string} eggId
   */
  displayEggDiscoveryNotification(eggId) {
    const egg = this.eggs.get(eggId);
    if (!egg) return;

    this.hideEggNotification();

    // 1. Phaser Scene UI Toast
    if (this.scene?.add) {
      const screenWidth = this.scene.cameras?.main?.width || 1200;
      const posX = screenWidth / 2;
      const posY = 70;

      const container = this.scene.add.container(posX, posY);
      container.setScrollFactor(0);
      container.setDepth(1000);

      // Toast background box with mystic border
      const bg = this.scene.add.rectangle(0, 0, 360, 70, 0x141026, 0.95);
      bg.setStrokeStyle(3, 0x9c27b0);
      container.add(bg);

      // Icon + Text
      const icon = this.scene.add.text(-150, 0, egg.icon, { fontSize: '28px' }).setOrigin(0, 0.5);
      const title = this.scene.add.text(-110, -14, 'Easter Egg Discovered!', {
        fontSize: '15px',
        fontFamily: 'serif',
        fontStyle: 'bold',
        color: '#e1bee7'
      }).setOrigin(0, 0);

      const name = this.scene.add.text(-110, 8, egg.name, {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0);

      container.add([icon, title, name]);

      container.setAlpha(0);
      if (this.scene.tweens) {
        this.scene.tweens.add({
          targets: container,
          alpha: 1,
          duration: 200,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.toastTimer = setTimeout(() => {
              if (this.scene?.tweens) {
                this.scene.tweens.add({
                  targets: container,
                  alpha: 0,
                  duration: 200,
                  ease: 'Power2.easeIn',
                  onComplete: () => {
                    container.destroy();
                    this.activeToast = null;
                  }
                });
              } else {
                container.destroy();
                this.activeToast = null;
              }
            }, 3600);
          }
        });
      } else {
        container.setAlpha(1);
        this.toastTimer = setTimeout(() => {
          container.destroy();
          this.activeToast = null;
        }, 4000);
      }

      this.activeToast = container;
      return;
    }

    // 2. DOM / Browser Toast fallback
    if (typeof document !== 'undefined' && document.body) {
      let toastEl = document.getElementById('egg-toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'egg-toast';
        document.body.appendChild(toastEl);
      }

      toastEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 16, 38, 0.95);
        border: 2px solid #9c27b0;
        border-radius: 8px;
        padding: 12px 24px;
        color: #ffffff;
        font-family: 'Cinzel', serif, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: opacity 0.2s ease;
        opacity: 0;
      `;

      toastEl.innerHTML = `
        <span style="font-size: 28px;">${egg.icon}</span>
        <div>
          <div style="font-size: 14px; font-weight: bold; color: #e1bee7;">Easter Egg Discovered!</div>
          <div style="font-size: 16px; font-weight: bold;">${egg.name}</div>
          <div style="font-size: 12px; color: #ce93d8;">${egg.content}</div>
        </div>
      `;

      requestAnimationFrame(() => {
        toastEl.style.opacity = '1';
      });

      this.toastTimer = setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
          if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
          this.activeToast = null;
        }, 200);
      }, 3800);

      this.activeToast = toastEl;
      return;
    }

    // 3. Headless mock toast
    this.activeToast = {
      eggId,
      name: egg.name,
      displayed: true
    };
    this.toastTimer = setTimeout(() => {
      this.activeToast = null;
    }, 4000);
  }

  /**
   * Dismisses active notification toast.
   */
  hideEggNotification() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (this.activeToast) {
      if (typeof this.activeToast.destroy === 'function') {
        this.activeToast.destroy();
      } else if (this.activeToast.parentNode) {
        this.activeToast.parentNode.removeChild(this.activeToast);
      }
      this.activeToast = null;
    }
  }

  /**
   * Serializes easter egg state for the save system.
   * @returns {Object}
   */
  serialize() {
    const discoveredEggs = [];
    const timestamps = {};

    this.eggs.forEach((egg, id) => {
      if (egg.discovered) {
        discoveredEggs.push(id);
        timestamps[id] = egg.discoveredTime;
      }
    });

    return {
      discoveredEggs,
      timestamps
    };
  }

  /**
   * Restores easter egg discovery state from save data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;

    this.reset();

    if (Array.isArray(data.discoveredEggs)) {
      data.discoveredEggs.forEach(id => {
        const egg = this.eggs.get(id);
        if (egg) {
          egg.discovered = true;
          egg.discoveredTime = data.timestamps?.[id] || Date.now();
          this.timestamps.set(id, egg.discoveredTime);
        }
      });
    }

    if (this.gameState) {
      this.gameState.easterEggsFound = this.getDiscoveredEggs().map(e => e.id);
    }
  }

  /**
   * Resets all easter eggs to undiscovered state.
   */
  reset() {
    this.hideEggNotification();
    this.timestamps.clear();

    this.eggs.forEach(egg => {
      egg.discovered = false;
      egg.discoveredTime = null;
    });

    if (this.gameState) {
      this.gameState.easterEggsFound = [];
    }
  }

  /**
   * Cleans up listeners and notifications.
   */
  destroy() {
    this._detachEventListeners();
    this.hideEggNotification();
  }
}

// Export singleton instance
export const easterEggManager = new EasterEggManager();
export default easterEggManager;
