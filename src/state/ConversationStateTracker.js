/**
 * ConversationStateTracker - NPC Dialogue Tier & Exploration Progression System
 * 
 * Dark Forest Portfolio Game
 * Tracks per-NPC dialogue tiers (1-3) based on world exploration and prior interactions.
 * Unlocks Tier 2 after 1+ zones explored, Tier 3 after 3+ zones explored, and
 * Summit accessibility after visiting 3+ zones and conversing with 2+ NPCs.
 */

import eventBus, { NPC_EVENTS, GAME_EVENTS } from '../events/EventBus.js';
import defaultGameState from './GameState.js';

export const DEFAULT_NPC_IDS = [
  'mentor',
  'fullstack',
  'ada',
  'mobilearch',
  'futureyou'
];

export const TIER_UNLOCK_RULES = {
  TIER_1: { minZones: 0, requireTalked: false },
  TIER_2: { minZones: 1, requireTalked: true },
  TIER_3: { minZones: 3, requireTalked: true },
  SUMMIT: { minZones: 3, minNpcsTalked: 2 }
};

export class ConversationStateTracker {
  constructor() {
    this.gameState = null;
    this._states = {};
    this._tierOverrides = new Map();
    this._unsubscribers = [];

    // Initialize default states for known NPCs
    this._initDefaultStates();
  }

  /**
   * Initializes the tracker with the active GameState instance.
   * 
   * @param {Object} [gameState=defaultGameState] - GameState instance
   * @returns {ConversationStateTracker}
   */
  create(gameState = defaultGameState) {
    this.gameState = gameState;

    // Cleanup previous event listeners if re-created
    this._cleanupListeners();

    // Listen to world exploration events to update unlocks dynamically
    const onZoneDiscovered = () => {
      this._checkAllTierUnlocks();
      this._checkSummitUnlock();
    };

    const onStateReset = () => {
      this.resetAllConversations();
    };

    const unsubZone = eventBus.on(GAME_EVENTS.ZONE_ENTERED, onZoneDiscovered);
    const unsubReset = eventBus.on('stateReset', onStateReset);
    this._unsubscribers.push(unsubZone, unsubReset);

    // Initial check of unlock conditions
    this._checkAllTierUnlocks();
    this._checkSummitUnlock();

    return this;
  }

  /**
   * Logs an interaction with an NPC.
   * Increments conversation count, updates timestamp, triggers unlock checks,
   * and emits 'conversationRecorded'.
   * 
   * @param {string} npcId - NPC identifier ('mentor', 'fullstack', etc.)
   * @returns {number} The active dialogue tier that was experienced
   */
  recordConversation(npcId) {
    if (!npcId) return 1;

    const state = this._getOrCreateState(npcId);
    const wasAlreadyTalkedTo = state.hasBeenTalkedTo;

    // If first time, conversation tier is 1 (unless overridden)
    // If talked to before, determine tier according to exploration
    let tierToRecord;
    if (this._tierOverrides.has(npcId)) {
      tierToRecord = this._tierOverrides.get(npcId);
    } else if (!wasAlreadyTalkedTo) {
      tierToRecord = 1;
    } else {
      tierToRecord = this.getCurrentTier(npcId);
    }

    // Update conversation metadata
    state.timesTalkedTo += 1;
    state.hasBeenTalkedTo = true;
    state.currentTier = tierToRecord;
    state.lastTalkedToTime = Date.now();

    // Check newly unlocked tiers for this NPC
    this._evaluateNpcTierUnlocks(npcId);

    // Check if summit accessible condition is now satisfied
    this._checkSummitUnlock();

    // Sync with GameState if available
    if (this.gameState && typeof this.gameState.talkToNpc === 'function') {
      this.gameState.talkToNpc(npcId, tierToRecord);
    }

    // Emit EventBus dialogue recorded event
    eventBus.emit(NPC_EVENTS.CONVERSATION_RECORDED || 'conversationRecorded', {
      npcId,
      tier: tierToRecord
    });

    return tierToRecord;
  }

  /**
   * Determines which dialogue tier should be displayed for the NPC.
   * 
   * Logic:
   * - Tier override takes precedence if set
   * - If player hasn't talked to NPC yet -> Tier 1
   * - If 3+ zones visited -> Tier 3
   * - If 1-2 zones visited -> Tier 2
   * - Otherwise -> Tier 1
   * 
   * @param {string} npcId - NPC identifier
   * @returns {number} 1, 2, or 3
   */
  getCurrentTier(npcId) {
    if (this._tierOverrides.has(npcId)) {
      return this._tierOverrides.get(npcId);
    }

    const state = this._getOrCreateState(npcId);
    if (!state.hasBeenTalkedTo) {
      return 1;
    }

    const zonesVisited = this._getZonesVisitedCount();

    if (zonesVisited >= TIER_UNLOCK_RULES.TIER_3.minZones) {
      return 3;
    } else if (zonesVisited >= TIER_UNLOCK_RULES.TIER_2.minZones) {
      return 2;
    } else {
      return 1;
    }
  }

  /**
   * Checks whether a specific dialogue tier is currently unlocked for an NPC.
   * 
   * @param {string} npcId - NPC identifier
   * @param {number} tier - Tier number (1, 2, or 3)
   * @returns {{ unlocked: boolean, reason: string }}
   */
  getTierUnlockStatus(npcId, tier) {
    const state = this._getOrCreateState(npcId);
    const zonesVisited = this._getZonesVisitedCount();

    if (tier === 1) {
      return {
        unlocked: true,
        reason: 'Initial meeting tier always available'
      };
    }

    if (tier === 2) {
      const unlocked = zonesVisited >= TIER_UNLOCK_RULES.TIER_2.minZones && state.hasBeenTalkedTo;
      let reason = '1+ zones visited';
      if (!state.hasBeenTalkedTo) {
        reason = 'Must complete initial meeting first';
      } else if (zonesVisited < TIER_UNLOCK_RULES.TIER_2.minZones) {
        reason = 'Requires exploring at least 1 zone';
      }
      return { unlocked, reason };
    }

    if (tier === 3) {
      const unlocked = zonesVisited >= TIER_UNLOCK_RULES.TIER_3.minZones && state.hasBeenTalkedTo;
      let reason = '3+ zones visited';
      if (!state.hasBeenTalkedTo) {
        reason = 'Must complete initial meeting first';
      } else if (zonesVisited < TIER_UNLOCK_RULES.TIER_3.minZones) {
        reason = 'Requires exploring at least 3 zones';
      }
      return { unlocked, reason };
    }

    return {
      unlocked: false,
      reason: `Unknown tier: ${tier}`
    };
  }

  /**
   * Checks whether the player has spoken to this NPC at least once.
   * @param {string} npcId - NPC identifier
   * @returns {boolean}
   */
  hasNpcBeenTalkedTo(npcId) {
    return Boolean(this._states[npcId]?.hasBeenTalkedTo);
  }

  /**
   * Returns total count of conversations held with this NPC.
   * @param {string} npcId - NPC identifier
   * @returns {number}
   */
  getTimesTalkedTo(npcId) {
    return this._states[npcId]?.timesTalkedTo || 0;
  }

  /**
   * Returns complete conversation state snapshot for an NPC.
   * @param {string} npcId - NPC identifier
   * @returns {{ currentTier: number, hasBeenTalkedTo: boolean, timesTalkedTo: number, lastTalkedToTime: number|null, tier2Unlocked: boolean, tier3Unlocked: boolean }}
   */
  getConversationState(npcId) {
    const state = this._getOrCreateState(npcId);
    return {
      currentTier: this.getCurrentTier(npcId),
      hasBeenTalkedTo: state.hasBeenTalkedTo,
      timesTalkedTo: state.timesTalkedTo,
      lastTalkedToTime: state.lastTalkedToTime,
      tier2Unlocked: state.tier2Unlocked,
      tier3Unlocked: state.tier3Unlocked
    };
  }

  /**
   * Returns Map of all NPC conversation states.
   * @returns {Map<string, Object>}
   */
  getAllConversationStates() {
    const statesMap = new Map();
    for (const [npcId, state] of Object.entries(this._states)) {
      statesMap.set(npcId, {
        currentTier: this.getCurrentTier(npcId),
        hasBeenTalkedTo: state.hasBeenTalkedTo,
        timesTalkedTo: state.timesTalkedTo,
        lastTalkedToTime: state.lastTalkedToTime,
        tier2Unlocked: state.tier2Unlocked,
        tier3Unlocked: state.tier3Unlocked
      });
    }
    return statesMap;
  }

  /**
   * Calculates progress toward late-game tier & Summit unlock conditions.
   * @returns {{ zonesVisited: number, zonesNeeded: number, npcsTalkedTo: number, npcsTalkedToNeeded: number }}
   */
  getUnlockProgress() {
    const zonesVisited = this._getZonesVisitedCount();
    const npcsTalkedTo = this.getNpcsTalkedToCount();

    return {
      zonesVisited,
      zonesNeeded: TIER_UNLOCK_RULES.SUMMIT.minZones,
      npcsTalkedTo,
      npcsTalkedToNeeded: TIER_UNLOCK_RULES.SUMMIT.minNpcsTalked
    };
  }

  /**
   * Returns count of unique NPCs the player has conversed with.
   * @returns {number}
   */
  getNpcsTalkedToCount() {
    return Object.values(this._states).filter(s => s.hasBeenTalkedTo).length;
  }

  /**
   * Sets a debug or testing override tier for an NPC.
   * 
   * @param {string} npcId - NPC identifier
   * @param {number|null} tier - Tier override (1, 2, 3) or null to remove override
   */
  setTierOverride(npcId, tier) {
    if (typeof tier === 'number' && tier >= 1 && tier <= 3) {
      this._tierOverrides.set(npcId, tier);
    } else {
      this._tierOverrides.delete(npcId);
    }
  }

  /**
   * Resets conversation history for a single NPC back to initial meeting state.
   * 
   * @param {string} npcId - NPC identifier
   */
  resetNpcConversation(npcId) {
    this._tierOverrides.delete(npcId);
    this._states[npcId] = {
      currentTier: 1,
      hasBeenTalkedTo: false,
      timesTalkedTo: 0,
      lastTalkedToTime: null,
      tier2Unlocked: false,
      tier3Unlocked: false
    };

    if (this.gameState?.npcsInteracted && this.gameState.npcsInteracted[npcId]) {
      delete this.gameState.npcsInteracted[npcId];
    }
  }

  /**
   * Resets conversation history across all NPCs.
   * Called on New Game or save reset.
   */
  resetAllConversations() {
    this._tierOverrides.clear();
    this._initDefaultStates();
  }

  /**
   * Serializes all conversation states for the save manager.
   * 
   * @returns {Object<string, { tier: number, talkedTo: boolean, count: number, timestamp: number|null, tier2Unlocked: boolean, tier3Unlocked: boolean }>}
   */
  serialize() {
    const serialized = {};
    for (const [npcId, state] of Object.entries(this._states)) {
      serialized[npcId] = {
        tier: this.getCurrentTier(npcId),
        talkedTo: state.hasBeenTalkedTo,
        count: state.timesTalkedTo,
        timestamp: state.lastTalkedToTime,
        tier2Unlocked: state.tier2Unlocked,
        tier3Unlocked: state.tier3Unlocked
      };
    }
    return serialized;
  }

  /**
   * Restores conversation states from serialized save payload.
   * 
   * @param {Object} data - Serialized conversation state object
   * @returns {boolean} True if successfully restored
   */
  deserialize(data) {
    if (!data || typeof data !== 'object') return false;

    for (const [npcId, saved] of Object.entries(data)) {
      if (!saved || typeof saved !== 'object') continue;
      const state = this._getOrCreateState(npcId);

      state.currentTier = Number(saved.tier ?? saved.currentTier ?? 1);
      state.hasBeenTalkedTo = Boolean(saved.talkedTo ?? saved.hasBeenTalkedTo ?? false);
      state.timesTalkedTo = Number(saved.count ?? saved.timesTalkedTo ?? 0);
      state.lastTalkedToTime = saved.timestamp ?? saved.lastTalkedToTime ?? null;
      state.tier2Unlocked = Boolean(saved.tier2Unlocked ?? (state.currentTier >= 2));
      state.tier3Unlocked = Boolean(saved.tier3Unlocked ?? (state.currentTier >= 3));
    }

    this._checkAllTierUnlocks();
    this._checkSummitUnlock();
    return true;
  }

  /**
   * Cleans up all listeners and instances.
   */
  destroy() {
    this._cleanupListeners();
    this._tierOverrides.clear();
  }

  // --- Internal Helpers ---

  _initDefaultStates() {
    this._states = {};
    for (const npcId of DEFAULT_NPC_IDS) {
      this._states[npcId] = {
        currentTier: 1,
        hasBeenTalkedTo: false,
        timesTalkedTo: 0,
        lastTalkedToTime: null,
        tier2Unlocked: false,
        tier3Unlocked: false
      };
    }
  }

  _getOrCreateState(npcId) {
    if (!this._states[npcId]) {
      this._states[npcId] = {
        currentTier: 1,
        hasBeenTalkedTo: false,
        timesTalkedTo: 0,
        lastTalkedToTime: null,
        tier2Unlocked: false,
        tier3Unlocked: false
      };
    }
    return this._states[npcId];
  }

  _getZonesVisitedCount() {
    if (this.gameState?.zonesVisited && Array.isArray(this.gameState.zonesVisited)) {
      return this.gameState.zonesVisited.length;
    }
    return 1; // Default starting zone (foundation)
  }

  _evaluateNpcTierUnlocks(npcId) {
    const state = this._states[npcId];
    if (!state || !state.hasBeenTalkedTo) return;

    const zonesVisited = this._getZonesVisitedCount();

    // Check Tier 2 unlock
    if (!state.tier2Unlocked && zonesVisited >= TIER_UNLOCK_RULES.TIER_2.minZones) {
      state.tier2Unlocked = true;
      eventBus.emit(NPC_EVENTS.TIER_UNLOCKED || 'tierUnlocked', {
        npcId,
        tier: 2,
        reason: '1+ zones visited'
      });
    }

    // Check Tier 3 unlock
    if (!state.tier3Unlocked && zonesVisited >= TIER_UNLOCK_RULES.TIER_3.minZones) {
      state.tier3Unlocked = true;
      eventBus.emit(NPC_EVENTS.TIER_UNLOCKED || 'tierUnlocked', {
        npcId,
        tier: 3,
        reason: '3+ zones visited'
      });
    }
  }

  _checkAllTierUnlocks() {
    for (const npcId of Object.keys(this._states)) {
      this._evaluateNpcTierUnlocks(npcId);
    }
  }

  _checkSummitUnlock() {
    const zonesVisited = this._getZonesVisitedCount();
    const npcsTalkedTo = this.getNpcsTalkedToCount();

    if (
      zonesVisited >= TIER_UNLOCK_RULES.SUMMIT.minZones &&
      npcsTalkedTo >= TIER_UNLOCK_RULES.SUMMIT.minNpcsTalked
    ) {
      if (this.gameState?.unlocks && !this.gameState.unlocks.summitAccessible) {
        this.gameState.unlocks.summitAccessible = true;
        eventBus.emit('summitUnlocked', {});
        eventBus.emit('unlockGained', { unlockKey: 'summitAccessible', value: true });
      }
    }
  }

  _cleanupListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }
}

// Global Singleton Export
export const conversationStateTracker = new ConversationStateTracker();
export default conversationStateTracker;
