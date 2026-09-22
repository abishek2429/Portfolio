/**
 * GameState - Centralized World State Manager
 * 
 * Manages player progression, zone exploration, NPC dialogue tiers,
 * project discoveries, achievements, and world unlocks for the
 * Dark Forest portfolio game.
 */

import eventBus, {
  STATE_EVENTS,
  PROGRESS_EVENTS,
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS
} from '../events/EventBus.js';

// Canonical zone identifiers
export const ZONES = {
  FOUNDATION: 'foundation',
  WEBDEV: 'webdev',
  AIML: 'aiml',
  MOBILE: 'mobile',
  SUMMIT: 'summit'
};


export const INITIAL_STATE = {
  zonesVisited: [],
  npcsInteracted: {},
  projectsClicked: [],
  achievementsUnlocked: [],
  playerPosition: { x: 600, y: 400 },
  currentZone: ZONES.FOUNDATION,
  gameProgress: 0,
  unlocks: {
    summitAccessible: false,
    nightModeUnlocked: false,
    secretShrineUnlocked: false
  }
};

export class GameState {
  constructor(initialOverrides = {}) {
    this._listeners = new Map();
    this.resetState(initialOverrides);
  }

  /**
   * Resets all progress back to initial default values.
   * @param {Object} [overrides={}] - Optional initial state overrides
   * @returns {Object} Fresh state snapshot
   */
  resetState(overrides = {}) {
    this.zonesVisited = [...(overrides.zonesVisited || INITIAL_STATE.zonesVisited)];
    this.npcsInteracted = { ...(overrides.npcsInteracted || INITIAL_STATE.npcsInteracted) };
    this.projectsClicked = [...(overrides.projectsClicked || INITIAL_STATE.projectsClicked)];
    this.achievementsUnlocked = [...(overrides.achievementsUnlocked || INITIAL_STATE.achievementsUnlocked)];
    this.playerPosition = { ...(overrides.playerPosition || INITIAL_STATE.playerPosition) };
    this.currentZone = overrides.currentZone || INITIAL_STATE.currentZone;
    this.unlocks = { ...(overrides.unlocks || INITIAL_STATE.unlocks) };
    this.gameProgress = 0;

    // Ensure initial starting zone is marked as visited
    if (this.currentZone && !this.zonesVisited.includes(this.currentZone)) {
      this.zonesVisited.push(this.currentZone);
    }

    this._updateUnlocks();
    this._calculateProgress();
    this._emit('stateReset', this.getCurrentState());

    return this.getCurrentState();
  }

  /**
   * Records a visited zone. Updates current zone and unlocks if applicable.
   * @param {string} zoneId - ID of the zone (e.g. 'foundation', 'webdev', 'aiml', 'mobile', 'summit')
   * @returns {boolean} True if this was a new discovery
   */
  visitZone(zoneId) {
    if (!zoneId) return false;

    this.currentZone = zoneId;
    let isNew = false;

    if (!this.zonesVisited.includes(zoneId)) {
      this.zonesVisited.push(zoneId);
      isNew = true;
      this._emit('zoneDiscovered', { zoneId, zonesVisited: [...this.zonesVisited] });
    }

    this._updateUnlocks();
    this._calculateProgress();
    this._emit('zoneChanged', { currentZone: this.currentZone, isNew });
    this._emit('stateChange', this.getCurrentState());

    return isNew;
  }

  /**
   * Updates an NPC's dialogue interaction tier.
   * @param {string} npcName - Name or identifier of the NPC
   * @param {number} [tier] - Target tier (1, 2, or 3). If omitted, increments current tier by 1.
   * @returns {number} The updated dialogue tier (1-3)
   */
  talkToNpc(npcName, tier) {
    if (!npcName) return 1;

    let targetTier;
    if (typeof tier === 'number') {
      targetTier = Math.max(1, Math.min(3, Math.round(tier)));
    } else {
      const current = this.npcsInteracted[npcName] || 0;
      targetTier = Math.min(3, current + 1);
    }

    const previousTier = this.npcsInteracted[npcName] || 0;
    this.npcsInteracted[npcName] = targetTier;

    this._calculateProgress();
    this._emit('npcInteracted', { npcName, tier: targetTier, previousTier });
    this._emit('stateChange', this.getCurrentState());

    return targetTier;
  }

  /**
   * Logs a project interaction when clicked or inspected by player.
   * @param {string} projectId - Unique project identifier
   * @returns {boolean} True if this was the first time clicking this project
   */
  clickProject(projectId) {
    if (!projectId) return false;

    if (!this.projectsClicked.includes(projectId)) {
      this.projectsClicked.push(projectId);
      this._calculateProgress();
      this._emit('projectClicked', { projectId, totalClicked: this.projectsClicked.length });
      this._emit('stateChange', this.getCurrentState());
      return true;
    }

    return false;
  }

  /**
   * Unlocks an achievement if not already unlocked.
   * @param {string} achievementId - Unique achievement ID
   * @returns {boolean} True if the achievement was newly unlocked
   */
  unlockAchievement(achievementId) {
    if (!achievementId) return false;

    if (!this.achievementsUnlocked.includes(achievementId)) {
      this.achievementsUnlocked.push(achievementId);
      this._updateUnlocks();
      this._calculateProgress();
      this._emit('achievementUnlocked', { achievementId, allAchievements: [...this.achievementsUnlocked] });
      this._emit('stateChange', this.getCurrentState());
      return true;
    }

    return false;
  }

  /**
   * Updates player coordinates in the world.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updatePlayerPosition(x, y) {
    this.playerPosition.x = x;
    this.playerPosition.y = y;
    this._emit('playerPositionUpdated', { ...this.playerPosition });
  }

  /**
   * Computes and returns the overall game progress percentage (0-100).
   * Progress weighting:
   * - Zones Visited (5 zones total): 30%
   * - NPC Interactions: 25%
   * - Projects Explored: 30%
   * - Achievements Unlocked: 15%
   * @returns {number} Percentage between 0 and 100
   */
  getGameProgress() {
    return this.gameProgress;
  }

  /**
   * Internal progress calculation helper
   * @private
   */
  _calculateProgress() {
    const TOTAL_ZONES = 5;
    const TARGET_NPCS = 4;      // Expected key NPCs
    const TARGET_PROJECTS = 8;  // Expected project monuments
    const TARGET_ACHIEVEMENTS = 5;

    // Zones component (0 - 30%)
    const zoneScore = Math.min(1, this.zonesVisited.length / TOTAL_ZONES) * 30;

    // NPC component (0 - 25% based on dialogue tiers reached)
    const npcScores = Object.values(this.npcsInteracted).reduce((acc, tier) => acc + (tier / 3), 0);
    const npcScore = Math.min(1, npcScores / TARGET_NPCS) * 25;

    // Projects component (0 - 30%)
    const projectScore = Math.min(1, this.projectsClicked.length / TARGET_PROJECTS) * 30;

    // Achievements component (0 - 15%)
    const achievementScore = Math.min(1, this.achievementsUnlocked.length / TARGET_ACHIEVEMENTS) * 15;

    const rawTotal = zoneScore + npcScore + projectScore + achievementScore;
    this.gameProgress = Math.min(100, Math.round(rawTotal));
    return this.gameProgress;
  }

  /**
   * Evaluates dynamic unlocks (e.g. Summit access requires discovering the 4 lower forest zones).
   * @private
   */
  _updateUnlocks() {
    const lowerZones = [ZONES.FOUNDATION, ZONES.WEBDEV, ZONES.AIML, ZONES.MOBILE];
    const hasAllLowerZones = lowerZones.every(z => this.zonesVisited.includes(z));

    if (hasAllLowerZones && !this.unlocks.summitAccessible) {
      this.unlocks.summitAccessible = true;
      this._emit('unlockGained', { unlockKey: 'summitAccessible', value: true });
    }

    if (this.achievementsUnlocked.length >= 3 && !this.unlocks.nightModeUnlocked) {
      this.unlocks.nightModeUnlocked = true;
      this._emit('unlockGained', { unlockKey: 'nightModeUnlocked', value: true });
    }
  }

  /**
   * Returns a deep clone snapshot of the current game state to prevent external mutation.
   * @returns {Object} Complete state object
   */
  getCurrentState() {
    return {
      zonesVisited: [...this.zonesVisited],
      npcsInteracted: { ...this.npcsInteracted },
      projectsClicked: [...this.projectsClicked],
      achievementsUnlocked: [...this.achievementsUnlocked],
      playerPosition: { ...this.playerPosition },
      currentZone: this.currentZone,
      gameProgress: this.gameProgress,
      unlocks: { ...this.unlocks }
    };
  }

  // --- Lightweight Event Subscription System (Ready for Prompt 5 integration) ---

  /**
   * Subscribe to state change events.
   * @param {string} event - Event name (e.g. 'stateChange', 'zoneChanged', 'achievementUnlocked')
   * @param {Function} handler - Callback handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from state change events.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(handler);
    }
  }

  /**
   * Internal event emitter
   * @private
   */
  _emit(event, payload) {
    // 1. Direct GameState listeners
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(handler => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[GameState] Error in listener for event "${event}":`, err);
        }
      });
    }

    // 2. Bridge to global EventBus
    try {
      if (event === 'stateChange' || event === 'stateReset') {
        eventBus.emit(STATE_EVENTS.GAME_STATE_CHANGED, { newState: this.getCurrentState() });
        eventBus.emit(STATE_EVENTS.PROGRESS_UPDATED, { progress: this.gameProgress });
      } else if (event === 'zoneChanged') {
        eventBus.emit(GAME_EVENTS.ZONE_ENTERED, { zoneId: payload.currentZone });
      } else if (event === 'achievementUnlocked') {
        eventBus.emit(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, {
          achievementId: payload.achievementId
        });
      } else if (event === 'projectClicked') {
        eventBus.emit(PROJECT_EVENTS.PROJECT_CLICKED, {
          projectId: payload.projectId
        });
      } else if (event === 'unlockGained') {
        if (payload.unlockKey === 'summitAccessible') {
          eventBus.emit(PROGRESS_EVENTS.SUMMIT_UNLOCKED, {});
        } else if (payload.unlockKey === 'nightModeUnlocked') {
          eventBus.emit(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, {});
        }
      } else if (event === 'playerPositionUpdated') {
        eventBus.emit(GAME_EVENTS.PLAYER_MOVED, {
          x: payload.x,
          y: payload.y,
          zone: this.currentZone
        });
      }
    } catch (e) {
      console.error('[GameState] Error bridging to EventBus:', e);
    }
  }
}

// Export singleton instance for global access across Phaser scenes
export const gameState = new GameState();
export default gameState;
