/**
 * ZoneUnlockTracker - Zone Discovery, Exploration & Progression Gating System
 * 
 * Dark Forest Portfolio Game
 * Tracks discovery states, visits, exploration metrics, and evaluates
 * conditional unlocking for the culminating Summit Nexus.
 */

import eventBus, { GAME_EVENTS, NPC_EVENTS, PROGRESS_EVENTS, STATE_EVENTS } from '../events/EventBus.js';
import defaultGameState, { ZONES } from '../state/GameState.js';
import { zoneLayoutPlanner as defaultZonePlanner } from './ZoneLayoutPlanner.js';

export const ZONE_DISCOVERY_STATES = {
  UNDISCOVERED: 'undiscovered',
  DISCOVERED: 'discovered',
  VISITED: 'visited',
  FULLY_EXPLORED: 'fully-explored'
};

export const ZONE_NAMES = {
  foundation: 'Foundation Clearing',
  webdev: 'Web Dev Outpost',
  aiml: 'AI & ML Woods',
  mobile: 'Mobile Valley',
  summit: 'The Summit'
};

// Inter-zone path topology (reciprocal connections across the dark forest)
export const ZONE_PATH_NETWORK = {
  foundation: ['webdev', 'aiml', 'mobile', 'summit'],
  webdev: ['foundation', 'aiml', 'mobile', 'summit'],
  aiml: ['foundation', 'webdev', 'mobile', 'summit'],
  mobile: ['foundation', 'webdev', 'aiml', 'summit'],
  summit: ['foundation', 'webdev', 'aiml', 'mobile']
};

export const DEFAULT_UNLOCK_REQUIREMENTS = {
  summit: {
    zonesVisited: 3,
    npcsMetCount: 2
  }
};

export class ZoneUnlockTracker {
  constructor(gameState = null, planner = null) {
    this.gameState = gameState || defaultGameState;
    this.planner = planner || defaultZonePlanner;

    // Tracking state
    this.discoveredZones = new Set();
    this.visitedZones = new Set();
    this.zoneVisitCounts = new Map();
    this.zoneDiscoveryTimes = new Map();
    this.zoneTimeSpent = new Map();

    // Active zone tracking for time accumulation
    this.currentZoneId = null;
    this.currentZoneEnterTime = null;

    // Summit conditional unlock state
    this.summitUnlocked = false;
    this.summitUnlockTime = null;

    // Unlock requirements configuration
    this.unlockRequirements = { ...DEFAULT_UNLOCK_REQUIREMENTS };

    // Auto-visit duration threshold (30 seconds)
    this.autoVisitThresholdMs = 30000;

    // Event bus unsubscriber handlers
    this._unsubscribers = [];

    // Initialize with default state
    this._initDefaultState();
  }

  /**
   * Initializes or re-initializes tracker with GameState reference.
   * @param {Object} [gameState] - GameState instance
   * @returns {ZoneUnlockTracker}
   */
  create(gameState = null) {
    if (gameState) {
      this.gameState = gameState;
    }

    // Clean up previous event listeners if re-creating
    this._detachEventListeners();

    // Unlocks Foundation at start and syncs state
    this._initDefaultState();

    // Synchronize with existing gameState records
    this._syncFromGameState();

    // Attach event listeners
    this._attachEventListeners();

    // Check if summit condition is already met
    this.checkSummitUnlock();

    return this;
  }

  /**
   * Sets up default unlocked state: Foundation, Web Dev, AI/ML, and Mobile are accessible.
   * @private
   */
  _initDefaultState() {
    this.discoveredZones.clear();
    this.visitedZones.clear();
    this.zoneVisitCounts.clear();
    this.zoneDiscoveryTimes.clear();
    this.zoneTimeSpent.clear();

    const allZones = ['foundation', 'webdev', 'aiml', 'mobile', 'summit'];
    allZones.forEach(z => {
      this.zoneVisitCounts.set(z, 0);
      this.zoneTimeSpent.set(z, 0);
    });

    this.summitUnlocked = false;
    this.summitUnlockTime = null;
    this.currentZoneId = null;
    this.currentZoneEnterTime = null;

    // Foundation is the starting clearing
    this.discoveredZones.add('foundation');
    this.visitedZones.add('foundation');
    this.zoneDiscoveryTimes.set('foundation', Date.now());
    this.zoneVisitCounts.set('foundation', 1);
  }

  /**
   * Synchronizes discoveries and visits from GameState.
   * @private
   */
  _syncFromGameState() {
    if (!this.gameState) return;

    if (Array.isArray(this.gameState.zonesVisited)) {
      this.gameState.zonesVisited.forEach(zoneId => {
        if (zoneId) {
          this.discoveredZones.add(zoneId);
          this.visitedZones.add(zoneId);
          if (!this.zoneDiscoveryTimes.has(zoneId)) {
            this.zoneDiscoveryTimes.set(zoneId, Date.now());
          }
          if ((this.zoneVisitCounts.get(zoneId) || 0) === 0) {
            this.zoneVisitCounts.set(zoneId, 1);
          }
        }
      });
    }

    if (this.gameState.unlocks?.summitAccessible) {
      this.summitUnlocked = true;
      if (!this.summitUnlockTime) {
        this.summitUnlockTime = Date.now();
      }
    }
  }

  /**
   * Attaches listeners to EventBus to react to player movement and dialogue changes.
   * @private
   */
  _attachEventListeners() {
    // 1. Zone entry
    const unsubEntered = eventBus.on(GAME_EVENTS.ZONE_ENTERED, (payload) => {
      const zoneId = payload?.zoneId;
      if (zoneId) {
        this.onZoneEntered(zoneId);
      }
    });

    // 2. Zone exit
    const unsubExited = eventBus.on(GAME_EVENTS.ZONE_EXITED, (payload) => {
      const zoneId = payload?.zoneId;
      this.onZoneExited(zoneId);
    });

    // 3. NPC interaction changes (to evaluate summit unlock progress)
    const unsubNpcInteracted = eventBus.on(NPC_EVENTS.CONVERSATION_RECORDED, () => {
      this.checkSummitUnlock();
      this._emitUnlockProgressChanged();
    });

    const unsubTierUnlocked = eventBus.on(NPC_EVENTS.TIER_UNLOCKED, () => {
      this.checkSummitUnlock();
      this._emitUnlockProgressChanged();
    });

    const unsubDialogueEnded = eventBus.on(NPC_EVENTS.DIALOGUE_ENDED, () => {
      this.checkSummitUnlock();
      this._emitUnlockProgressChanged();
    });

    // 4. Global state reset or restore
    const unsubStateChange = eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      this._syncFromGameState();
      this.checkSummitUnlock();
    });

    this._unsubscribers = [
      unsubEntered,
      unsubExited,
      unsubNpcInteracted,
      unsubTierUnlocked,
      unsubDialogueEnded,
      unsubStateChange
    ];
  }

  /**
   * Detaches registered EventBus listeners.
   * @private
   */
  _detachEventListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Called when player enters a zone.
   * @param {string} zoneId
   */
  onZoneEntered(zoneId) {
    if (!zoneId) return;

    // Flush previous zone time if needed
    if (this.currentZoneId && this.currentZoneId !== zoneId) {
      this.onZoneExited(this.currentZoneId);
    }

    this.currentZoneId = zoneId;
    this.currentZoneEnterTime = Date.now();

    const isFirstDiscovery = !this.discoveredZones.has(zoneId);
    this.discoverZone(zoneId);

    // Increment visit count for re-entries
    if (!isFirstDiscovery) {
      const prevCount = this.zoneVisitCounts.get(zoneId) || 0;
      this.zoneVisitCounts.set(zoneId, prevCount + 1);
    }

    this.checkSummitUnlock();
  }

  /**
   * Called when player leaves a zone.
   * @param {string} [zoneId]
   */
  onZoneExited(zoneId) {
    const targetZone = zoneId || this.currentZoneId;
    if (targetZone && this.currentZoneEnterTime) {
      const elapsed = Date.now() - this.currentZoneEnterTime;
      const currentTotal = this.zoneTimeSpent.get(targetZone) || 0;
      this.zoneTimeSpent.set(targetZone, currentTotal + elapsed);

      // Auto-mark visited if spent over threshold
      if (currentTotal + elapsed >= this.autoVisitThresholdMs) {
        this.visitZone(targetZone);
      }
    }

    if (this.currentZoneId === targetZone) {
      this.currentZoneId = null;
      this.currentZoneEnterTime = null;
    }
  }

  /**
   * Per-frame or tick update hook.
   * Accumulates time spent and checks auto-visit threshold and summit condition.
   * @param {number} delta - Frame delta time in ms
   */
  update(delta = 16.6) {
    if (this.currentZoneId) {
      const currentTotal = (this.zoneTimeSpent.get(this.currentZoneId) || 0) + delta;
      this.zoneTimeSpent.set(this.currentZoneId, currentTotal);

      // Auto-visit after threshold (30s)
      if (currentTotal >= this.autoVisitThresholdMs && !this.visitedZones.has(this.currentZoneId)) {
        this.visitZone(this.currentZoneId);
      }
    }

    this.checkSummitUnlock();
  }

  /**
   * Marks a zone as discovered.
   * Called when player first enters a zone.
   * @param {string} zoneId - Zone ID
   * @returns {boolean} True if this was a newly discovered zone
   */
  discoverZone(zoneId) {
    if (!zoneId) return false;

    let isNew = false;
    const now = Date.now();

    if (!this.discoveredZones.has(zoneId)) {
      this.discoveredZones.add(zoneId);
      this.zoneDiscoveryTimes.set(zoneId, now);
      if ((this.zoneVisitCounts.get(zoneId) || 0) === 0) {
        this.zoneVisitCounts.set(zoneId, 1);
      }
      isNew = true;

      // Also ensure it is recorded as visited
      this.visitedZones.add(zoneId);

      // Sync with GameState
      if (this.gameState && typeof this.gameState.visitZone === 'function') {
        if (!this.gameState.zonesVisited?.includes(zoneId)) {
          this.gameState.visitZone(zoneId);
        }
      }

      const zoneName = this.getZoneName(zoneId);

      // Emit zoneDiscovered event
      eventBus.emit(GAME_EVENTS.ZONE_DISCOVERED, {
        zoneId,
        zoneName,
        timestamp: now
      });

      this._emitUnlockProgressChanged();
      this.checkSummitUnlock();
    }

    return isNew;
  }

  /**
   * Marks a zone as visited.
   * Called when player confirms they've explored the zone or auto-called after 30+ seconds.
   * @param {string} zoneId - Zone ID
   * @returns {boolean} True if state changed to visited
   */
  visitZone(zoneId) {
    if (!zoneId) return false;

    // Ensure it is also discovered
    if (!this.discoveredZones.has(zoneId)) {
      this.discoverZone(zoneId);
    }

    const wasAlreadyVisited = this.visitedZones.has(zoneId);
    this.visitedZones.add(zoneId);

    // Sync with GameState
    if (this.gameState && typeof this.gameState.visitZone === 'function') {
      if (!this.gameState.zonesVisited?.includes(zoneId)) {
        this.gameState.visitZone(zoneId);
      }
    }

    const zoneName = this.getZoneName(zoneId);

    // Emit zoneVisited event
    eventBus.emit(GAME_EVENTS.ZONE_VISITED, {
      zoneId,
      zoneName
    });

    this._emitUnlockProgressChanged();
    this.checkSummitUnlock();

    return !wasAlreadyVisited;
  }

  /**
   * Checks whether a zone is accessible to the player.
   * Lower 4 zones are always accessible; Summit requires conditional unlock.
   * @param {string} zoneId - Zone ID
   * @returns {boolean}
   */
  isZoneUnlocked(zoneId) {
    if (!zoneId) return false;
    if (zoneId === 'summit') {
      return this.summitUnlocked;
    }
    // foundation, webdev, aiml, mobile are always unlocked
    return ['foundation', 'webdev', 'aiml', 'mobile'].includes(zoneId);
  }

  /**
   * Checks whether the player has entered/discovered the zone at least once.
   * @param {string} zoneId - Zone ID
   * @returns {boolean}
   */
  isZoneDiscovered(zoneId) {
    return this.discoveredZones.has(zoneId);
  }

  /**
   * Returns current discovery lifecycle state for a zone.
   * @param {string} zoneId - Zone ID
   * @returns {'undiscovered'|'discovered'|'visited'|'fully-explored'}
   */
  getDiscoveryState(zoneId) {
    if (!this.isZoneDiscovered(zoneId)) {
      return ZONE_DISCOVERY_STATES.UNDISCOVERED;
    }

    // Check if fully explored
    if (this._isFullyExplored(zoneId)) {
      return ZONE_DISCOVERY_STATES.FULLY_EXPLORED;
    }

    if (this.visitedZones.has(zoneId)) {
      return ZONE_DISCOVERY_STATES.VISITED;
    }

    return ZONE_DISCOVERY_STATES.DISCOVERED;
  }

  /**
   * Internal helper to determine if a zone is fully explored.
   * Requires:
   * 1. Player has visited the zone
   * 2. Player has interacted with resident NPCs
   * 3. Player has clicked/inspected resident projects
   * @private
   */
  _isFullyExplored(zoneId) {
    if (!this.visitedZones.has(zoneId)) return false;

    // Check resident NPCs
    const npcs = this.planner?.getNpcsInZone ? this.planner.getNpcsInZone(zoneId) : [];
    if (npcs && npcs.length > 0) {
      const interacted = this.gameState?.npcsInteracted || {};
      const allNpcsMet = npcs.every(npc => (interacted[npc] || 0) >= 1);
      if (!allNpcsMet) return false;
    }

    // Check resident projects
    const projects = this.planner?.getProjectsInZone ? this.planner.getProjectsInZone(zoneId) : [];
    if (projects && projects.length > 0) {
      const clicked = this.gameState?.projectsClicked || [];
      const allProjectsViewed = projects.every(proj => clicked.includes(proj));
      if (!allProjectsViewed) return false;
    }

    return true;
  }

  /**
   * Returns array of all discovered zone IDs.
   * @returns {Array<string>}
   */
  getDiscoveredZones() {
    return Array.from(this.discoveredZones);
  }

  /**
   * Returns array of all visited zone IDs.
   * @returns {Array<string>}
   */
  getVisitedZones() {
    return Array.from(this.visitedZones);
  }

  /**
   * Returns number of times player has entered the zone.
   * @param {string} zoneId
   * @returns {number}
   */
  getZoneVisitCount(zoneId) {
    return this.zoneVisitCounts.get(zoneId) || 0;
  }

  /**
   * Returns total time spent in zone in milliseconds.
   * @param {string} zoneId
   * @returns {number}
   */
  getTimeInZone(zoneId) {
    let total = this.zoneTimeSpent.get(zoneId) || 0;
    if (this.currentZoneId === zoneId && this.currentZoneEnterTime) {
      total += (Date.now() - this.currentZoneEnterTime);
    }
    return total;
  }

  /**
   * Evaluates summit unlock condition.
   * Condition: zonesVisited.length >= 3 AND npcsMetCount >= 2.
   * @returns {boolean} True if the summit is unlocked
   */
  checkSummitUnlock() {
    if (this.summitUnlocked) {
      return true;
    }

    const zonesVisitedCount = this._getZonesVisitedCount();
    const npcsMetCount = this._getNpcsMetCount();

    const { zonesVisited: zonesNeeded, npcsMetCount: npcNeeded } = this.unlockRequirements.summit;

    if (zonesVisitedCount >= zonesNeeded && npcsMetCount >= npcNeeded) {
      this.unlockSummit();
      return true;
    }

    return false;
  }

  /**
   * Forces summit unlock and alerts all connected systems.
   * @param {string} [reason] - Unlock justification
   * @returns {boolean}
   */
  unlockSummit(reason = 'explored 3 zones and met 2 NPCs') {
    if (this.summitUnlocked) return false;

    this.summitUnlocked = true;
    this.summitUnlockTime = Date.now();

    // Mark as accessible in GameState
    if (this.gameState) {
      if (!this.gameState.unlocks) {
        this.gameState.unlocks = {};
      }
      this.gameState.unlocks.summitAccessible = true;
    }

    const payload = {
      reason,
      timestamp: this.summitUnlockTime
    };

    // Emit events via EventBus
    eventBus.emit('summitUnlocked', payload);
    eventBus.emit(PROGRESS_EVENTS.SUMMIT_UNLOCKED, payload);

    this._emitUnlockProgressChanged();

    return true;
  }

  /**
   * Returns current progress towards unlocking Summit Nexus.
   * @returns {{ zonesVisited: number, zonesNeeded: number, npcsMetCount: number, npcNeeded: number, unlocked: boolean, percentage: number }}
   */
  getSummitUnlockProgress() {
    const zonesVisited = this._getZonesVisitedCount();
    const npcsMetCount = this._getNpcsMetCount();
    const { zonesVisited: zonesNeeded, npcsMetCount: npcNeeded } = this.unlockRequirements.summit;

    const zoneFrac = Math.min(1, zonesVisited / zonesNeeded);
    const npcFrac = Math.min(1, npcsMetCount / npcNeeded);
    const percentage = Math.round(((zoneFrac + npcFrac) / 2) * 100);

    return {
      zonesVisited,
      zonesNeeded,
      npcsMetCount,
      npcNeeded,
      unlocked: this.summitUnlocked,
      percentage
    };
  }

  /**
   * Returns conditions and current unlock status for a zone.
   * @param {string} zoneId - Zone ID
   * @returns {{ met: boolean, requirements: Array<string>, reason: string }}
   */
  getUnlockRequirements(zoneId) {
    if (zoneId !== 'summit') {
      return {
        met: true,
        requirements: [],
        reason: 'Always accessible'
      };
    }

    const progress = this.getSummitUnlockProgress();
    const requirements = [
      `Explore 3 zones (${Math.min(progress.zonesVisited, 3)}/3)`,
      `Meet 2 mentors (${Math.min(progress.npcsMetCount, 2)}/2)`
    ];

    if (this.summitUnlocked) {
      return {
        met: true,
        requirements,
        reason: 'The Summit is unlocked and awaiting your arrival'
      };
    }

    return {
      met: false,
      requirements,
      reason: 'Locked until you explore at least 3 zones and speak with 2 mentors'
    };
  }

  /**
   * Returns a Map of all zones and their accessibility status.
   * @returns {Map<string, { locked: boolean, reason: string }>}
   */
  getZoneAccessibility() {
    const accessibilityMap = new Map();
    const allZones = ['foundation', 'webdev', 'aiml', 'mobile', 'summit'];

    allZones.forEach(zoneId => {
      const isLocked = !this.isZoneUnlocked(zoneId);
      const req = this.getUnlockRequirements(zoneId);
      accessibilityMap.set(zoneId, {
        locked: isLocked,
        reason: req.reason
      });
    });

    return accessibilityMap;
  }

  /**
   * Returns an Object representation of zone accessibility for direct UI consumption.
   * @returns {Record<string, { locked: boolean, reason: string }>}
   */
  getZoneAccessibilityObject() {
    return Object.fromEntries(this.getZoneAccessibility());
  }

  /**
   * Checks whether the travel path between two zones is open and traversable.
   * @param {string} fromZoneId - Current origin zone
   * @param {string} toZoneId - Destination zone
   * @returns {boolean}
   */
  isPathToZoneAccessible(fromZoneId, toZoneId) {
    if (!fromZoneId || !toZoneId) return false;
    if (fromZoneId === toZoneId) return true;

    // Both zones must be valid
    if (!ZONE_PATH_NETWORK[fromZoneId] || !ZONE_PATH_NETWORK[toZoneId]) {
      return false;
    }

    // Origin and destination must both be unlocked
    if (!this.isZoneUnlocked(fromZoneId) || !this.isZoneUnlocked(toZoneId)) {
      return false;
    }

    // Direct path must exist in topology
    return ZONE_PATH_NETWORK[fromZoneId].includes(toZoneId);
  }

  /**
   * Provides dynamic UI progress string hint for HUD.
   * @returns {string}
   */
  getUnlockHint() {
    if (this.summitUnlocked) {
      return 'The Summit awaits! The celestial path is open.';
    }

    const { zonesVisited, zonesNeeded, npcsMetCount, npcNeeded } = this.getSummitUnlockProgress();

    if (zonesVisited < zonesNeeded) {
      return `Explore 3 zones to reach the Summit (${zonesVisited}/${zonesNeeded})`;
    }

    if (npcsMetCount < npcNeeded) {
      return `Meet 2 mentors to unlock the celestial path (${npcsMetCount}/${npcNeeded})`;
    }

    return 'The path to the Summit is emerging...';
  }

  /**
   * Resolves friendly display name for a zone.
   * @param {string} zoneId
   * @returns {string}
   */
  getZoneName(zoneId) {
    return ZONE_NAMES[zoneId] || this.planner?.getZoneLayout?.(zoneId)?.name || zoneId;
  }

  /**
   * Helper to count distinct zones visited across GameState and internal sets.
   * @private
   * @returns {number}
   */
  _getZonesVisitedCount() {
    const visitedSet = new Set();

    if (this.gameState?.zonesVisited && Array.isArray(this.gameState.zonesVisited)) {
      this.gameState.zonesVisited.forEach(z => {
        if (z && z !== 'summit') visitedSet.add(z);
      });
    }

    this.visitedZones.forEach(z => {
      if (z && z !== 'summit') visitedSet.add(z);
    });

    this.discoveredZones.forEach(z => {
      if (z && z !== 'summit') visitedSet.add(z);
    });

    return visitedSet.size;
  }

  /**
   * Helper to count distinct NPCs met.
   * @private
   * @returns {number}
   */
  _getNpcsMetCount() {
    if (!this.gameState) return 0;

    if (typeof this.gameState.getNpcsMetCount === 'function') {
      return this.gameState.getNpcsMetCount();
    }

    const interacted = this.gameState.npcsInteracted;
    if (Array.isArray(interacted)) {
      return interacted.length;
    }

    if (interacted && typeof interacted === 'object') {
      return Object.values(interacted).filter(tier => Number(tier) > 0).length;
    }

    if (Array.isArray(this.gameState.npcsMet)) {
      return this.gameState.npcsMet.length;
    }

    return 0;
  }

  /**
   * Emits unlock progress changed event on EventBus.
   * @private
   */
  _emitUnlockProgressChanged() {
    const progress = this.getSummitUnlockProgress();
    eventBus.emit(PROGRESS_EVENTS.UNLOCK_PROGRESS_CHANGED, {
      zonesVisited: progress.zonesVisited,
      npcsMetCount: progress.npcsMetCount,
      zonesNeeded: progress.zonesNeeded,
      npcNeeded: progress.npcNeeded,
      unlocked: progress.unlocked
    });
  }

  /**
   * Serializes tracker state for save system integration.
   * @returns {Object}
   */
  serialize() {
    return {
      discoveredZones: Array.from(this.discoveredZones),
      visitedZones: Array.from(this.visitedZones),
      zoneVisitCounts: Object.fromEntries(this.zoneVisitCounts),
      zoneDiscoveryTimes: Object.fromEntries(this.zoneDiscoveryTimes),
      zoneTimeSpent: Object.fromEntries(this.zoneTimeSpent),
      summitUnlocked: this.summitUnlocked,
      summitUnlockTime: this.summitUnlockTime
    };
  }

  /**
   * Restores tracker state from serialized save data.
   * @param {Object} data - Serialized state object
   */
  deserialize(data) {
    if (!data) return;

    if (Array.isArray(data.discoveredZones)) {
      this.discoveredZones = new Set(data.discoveredZones);
    }

    if (Array.isArray(data.visitedZones)) {
      this.visitedZones = new Set(data.visitedZones);
    }

    if (data.zoneVisitCounts && typeof data.zoneVisitCounts === 'object') {
      this.zoneVisitCounts = new Map(Object.entries(data.zoneVisitCounts));
    }

    if (data.zoneDiscoveryTimes && typeof data.zoneDiscoveryTimes === 'object') {
      this.zoneDiscoveryTimes = new Map(Object.entries(data.zoneDiscoveryTimes));
    }

    if (data.zoneTimeSpent && typeof data.zoneTimeSpent === 'object') {
      this.zoneTimeSpent = new Map(Object.entries(data.zoneTimeSpent));
    }

    if (typeof data.summitUnlocked === 'boolean') {
      this.summitUnlocked = data.summitUnlocked;
    }

    if (data.summitUnlockTime !== undefined) {
      this.summitUnlockTime = data.summitUnlockTime;
    }

    // Sync GameState
    if (this.gameState && this.summitUnlocked) {
      if (!this.gameState.unlocks) this.gameState.unlocks = {};
      this.gameState.unlocks.summitAccessible = true;
    }

    this._emitUnlockProgressChanged();
  }

  /**
   * Cleans up listeners and resets all discovery and unlock progress.
   */
  reset() {
    this._initDefaultState();
    if (this.gameState) {
      if (typeof this.gameState.resetState === 'function') {
        this.gameState.resetState();
      } else if (this.gameState.unlocks) {
        this.gameState.unlocks.summitAccessible = false;
      }
    }
    this._emitUnlockProgressChanged();
  }

  /**
   * Destroys tracker instance and unbinds all event listeners.
   */
  destroy() {
    this._detachEventListeners();
    this.currentZoneId = null;
    this.currentZoneEnterTime = null;
  }
}

// Export singleton instance
export const zoneUnlockTracker = new ZoneUnlockTracker();
export default zoneUnlockTracker;
