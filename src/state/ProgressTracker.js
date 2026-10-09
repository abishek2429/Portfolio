/**
 * ProgressTracker - Centralized Progression & Milestone Tracking System
 * 
 * Dark Forest Portfolio Game
 * Calculates holistic completion percentage across 4 weighted pillars:
 * Exploration (30%), NPC Interactions (30%), Projects (20%), and Achievements (20%).
 * Evaluates progression stages, milestone badges, and game completion.
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS
} from '../events/EventBus.js';
import defaultGameState, { ZONES } from './GameState.js';

export const PROGRESS_WEIGHTS = {
  EXPLORATION: 30, // 4 lower zones × 25% each
  NPCS: 30,        // 5 NPCs × 20% each (including Future You)
  PROJECTS: 20,    // 6 projects × ~16.67% each
  ACHIEVEMENTS: 20 // 8 achievements × 12.5% each
};

export const CANONICAL_PROGRESS_ENTITIES = {
  ZONES: ['foundation', 'webdev', 'aiml', 'mobile'],
  NPCS: ['mentor', 'fullstack', 'ada', 'mobilearch', 'futureyou'],
  PROJECTS: ['eduvault', 'codexcape', 'sentiment', 'ijprems', 'tensorflow', 'gmmx'],
  ACHIEVEMENT_COUNT: 8
};

export const PROGRESS_STAGES = [
  { min: 0, max: 24, name: 'Early Explorer' },
  { min: 25, max: 49, name: 'Growing Explorer' },
  { min: 50, max: 74, name: 'Experienced Developer' },
  { min: 75, max: 89, name: 'Polymath Developer' },
  { min: 90, max: 99, name: 'Legendary Developer' },
  { min: 100, max: 100, name: 'Complete Journey' }
];

export const MILESTONES = {
  EXPLORER_25: { id: 'milestone_25', threshold: 25, name: 'Growing Explorer', icon: '🌱' },
  DEVELOPER_50: { id: 'milestone_50', threshold: 50, name: 'Experienced Developer', icon: '🛠️' },
  POLYMATH_75: { id: 'milestone_75', threshold: 75, name: 'Polymath Developer', icon: '🧠' },
  SUMMIT_SEEKER: { id: 'milestone_summit', threshold: null, name: 'Summit Seeker', icon: '⛰️' },
  LEGENDARY_100: { id: 'milestone_100', threshold: 100, name: 'Legendary Developer', icon: '👑' }
};

export class ProgressTracker {
  constructor(gameState = null, npcSpawner = null, conversationTracker = null) {
    this.gameState = gameState || defaultGameState;
    this.npcSpawner = npcSpawner;
    this.conversationTracker = conversationTracker;

    // Progress metrics
    this.overallProgress = 0;
    this.previousProgress = 0;
    this.categoryProgress = {
      exploration: 0,
      npcs: 0,
      projects: 0,
      achievements: 0
    };

    // Stage & Milestones
    this.currentStage = PROGRESS_STAGES[0].name;
    this.unlockedMilestones = new Map(); // milestoneId -> { name, timestamp }
    this.summitReached = false;
    this.gameComplete = false;
    this.completionTime = null;

    // Timestamps and telemetry
    this.startTime = Date.now();
    this.firstZoneDiscoveredTime = null;
    this.lastZoneDiscoveredTime = null;
    this.firstNpcMet = null;

    // Event bus handlers
    this._unsubscribers = [];
  }

  /**
   * Initializes or connects tracker to runtime game dependencies and attaches listeners.
   * 
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [npcSpawner] - NPCSpawner instance
   * @param {Object} [conversationTracker] - ConversationStateTracker instance
   * @returns {ProgressTracker}
   */
  create(gameState = null, npcSpawner = null, conversationTracker = null) {
    if (gameState) this.gameState = gameState;
    if (npcSpawner) this.npcSpawner = npcSpawner;
    if (conversationTracker) this.conversationTracker = conversationTracker;

    this._detachEventListeners();
    this._attachEventListeners();

    // Initial calculation from active game state
    this.updateProgress(false);

    return this;
  }

  /**
   * Attaches listeners to EventBus for automated real-time progress updates.
   * @private
   */
  _attachEventListeners() {
    // 1. Zone discoveries and movements
    const unsubZoneDiscover = eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, () => {
      this.updateProgress(true, 'exploration');
    });

    const unsubZoneEnter = eventBus.on(GAME_EVENTS.ZONE_ENTERED, (payload) => {
      if (payload?.zoneId === 'summit' && !this.summitReached) {
        this.summitReached = true;
        this.recordMilestoneUnlock('Summit Seeker');
        this.updateProgress(true, 'exploration');
      }
    });

    // 2. NPC interactions
    const unsubNpc1 = eventBus.on(NPC_EVENTS.CONVERSATION_RECORDED, () => {
      this.updateProgress(true, 'npcs');
    });

    const unsubNpc2 = eventBus.on(NPC_EVENTS.TIER_UNLOCKED, () => {
      this.updateProgress(true, 'npcs');
    });

    const unsubNpc3 = eventBus.on(NPC_EVENTS.DIALOGUE_ENDED, () => {
      this.updateProgress(true, 'npcs');
    });

    // 3. Project interactions
    const unsubProj = eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, () => {
      this.updateProgress(true, 'projects');
    });

    // 4. Achievement unlocks
    const unsubAch = eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, () => {
      this.updateProgress(true, 'achievements');
    });

    // 5. Summit unlocked
    const unsubSummit = eventBus.on(PROGRESS_EVENTS.SUMMIT_UNLOCKED, () => {
      this.updateProgress(true, 'exploration');
    });

    // 6. Global State changes
    const unsubState = eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      if (this._isResetting) return;
      this.updateProgress(true);
    });

    this._unsubscribers = [
      unsubZoneDiscover,
      unsubZoneEnter,
      unsubNpc1,
      unsubNpc2,
      unsubNpc3,
      unsubProj,
      unsubAch,
      unsubSummit,
      unsubState
    ];
  }

  /**
   * Detaches registered event listeners.
   * @private
   */
  _detachEventListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Recalculates all progress metrics, milestones, and stages from current game state.
   * 
   * @param {boolean} [emitEvents=true] - Whether to emit change events
   * @param {string} [changedCategory='all'] - Which category triggered calculation
   * @returns {number} Updated overall progress percentage
   */
  updateProgress(emitEvents = true, changedCategory = 'all') {
    const prevOverall = this.overallProgress;
    const prevStage = this.currentStage;

    // 1. Calculate Exploration Contribution (30% max)
    const exploration = this.getExplorationProgress();
    const explorationContribution = (exploration.discovered / exploration.total) * PROGRESS_WEIGHTS.EXPLORATION;

    // 2. Calculate NPC Contribution (30% max)
    const npc = this.getNpcProgress();
    const npcContribution = (npc.metCount / npc.total) * PROGRESS_WEIGHTS.NPCS;

    // 3. Calculate Project Contribution (20% max)
    const project = this.getProjectProgress();
    const projectContribution = (project.clickedCount / project.total) * PROGRESS_WEIGHTS.PROJECTS;

    // 4. Calculate Achievement Contribution (20% max)
    const achievement = this.getAchievementProgress();
    const achievementContribution = (achievement.unlockedCount / achievement.total) * PROGRESS_WEIGHTS.ACHIEVEMENTS;

    this.categoryProgress = {
      exploration: Math.round(explorationContribution * 10) / 10,
      npcs: Math.round(npcContribution * 10) / 10,
      projects: Math.round(projectContribution * 10) / 10,
      achievements: Math.round(achievementContribution * 10) / 10
    };

    const rawTotal = explorationContribution + npcContribution + projectContribution + achievementContribution;
    this.overallProgress = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Synchronize GameState gameProgress property
    if (this.gameState && typeof this.gameState.gameProgress === 'number') {
      this.gameState.gameProgress = this.overallProgress;
    }

    // Check summit visited flag
    if (this.gameState?.zonesVisited?.includes('summit')) {
      if (!this.summitReached) {
        this.summitReached = true;
        this.recordMilestoneUnlock('Summit Seeker');
      }
    }

    // Evaluate progression stage
    this._evaluateProgressStage(prevStage, emitEvents);

    // Evaluate milestone unlocks
    this._evaluateMilestones(emitEvents);

    // Evaluate full game completion
    this._evaluateGameCompletion(emitEvents);

    // Emit progressChanged event
    if (emitEvents && prevOverall !== this.overallProgress) {
      eventBus.emit(PROGRESS_EVENTS.PROGRESS_CHANGED, {
        newProgress: this.overallProgress,
        previousProgress: prevOverall,
        change: this.overallProgress - prevOverall,
        category: changedCategory,
        breakdown: this.getProgressByCategory()
      });
      eventBus.emit(STATE_EVENTS.PROGRESS_UPDATED, { progress: this.overallProgress });
    }

    this.previousProgress = this.overallProgress;
    return this.overallProgress;
  }

  /**
   * Returns overall game completion percentage (0-100).
   * @returns {number}
   */
  getOverallProgress() {
    return this.overallProgress;
  }

  /**
   * Returns completion breakdown by category contribution.
   * @returns {{ exploration: number, npcs: number, projects: number, achievements: number }}
   */
  getProgressByCategory() {
    return { ...this.categoryProgress };
  }

  /**
   * Returns current progression stage tier label.
   * @returns {string}
   */
  getProgressStage() {
    return this.currentStage;
  }

  /**
   * Evaluates and updates current progression stage.
   * @private
   */
  _evaluateProgressStage(previousStage, emitEvents = true) {
    let nextStage = PROGRESS_STAGES[0].name;

    for (let i = PROGRESS_STAGES.length - 1; i >= 0; i--) {
      const stage = PROGRESS_STAGES[i];
      if (this.overallProgress >= stage.min) {
        nextStage = stage.name;
        break;
      }
    }

    if (nextStage !== previousStage) {
      this.currentStage = nextStage;
      if (emitEvents) {
        eventBus.emit(PROGRESS_EVENTS.STAGE_CHANGED, {
          newStage: this.currentStage,
          previousStage,
          progress: this.overallProgress
        });
      }
    }
  }

  /**
   * Evaluates percentage milestones and awards milestone badges.
   * @private
   */
  _evaluateMilestones(emitEvents = true) {
    // 25% milestone
    if (this.overallProgress >= 25 && !this.isMilestoneUnlocked('Growing Explorer')) {
      this.recordMilestoneUnlock('Growing Explorer', Date.now(), emitEvents);
    }

    // 50% milestone
    if (this.overallProgress >= 50 && !this.isMilestoneUnlocked('Experienced Developer')) {
      this.recordMilestoneUnlock('Experienced Developer', Date.now(), emitEvents);
    }

    // 75% milestone
    if (this.overallProgress >= 75 && !this.isMilestoneUnlocked('Polymath Developer')) {
      this.recordMilestoneUnlock('Polymath Developer', Date.now(), emitEvents);
    }

    // 100% milestone
    if (this.overallProgress >= 100 && !this.isMilestoneUnlocked('Legendary Developer')) {
      this.recordMilestoneUnlock('Legendary Developer', Date.now(), emitEvents);
    }
  }

  /**
   * Evaluates complete journey criteria across all 5 dimensions.
   * @private
   */
  _evaluateGameCompletion(emitEvents = true) {
    if (this.gameComplete) return;

    const exp = this.getExplorationProgress();
    const npc = this.getNpcProgress();
    const proj = this.getProjectProgress();
    const ach = this.getAchievementProgress();

    const allZonesExplored = exp.discovered >= exp.total;
    const allNpcsMet = npc.metCount >= npc.total;
    const allProjectsViewed = proj.clickedCount >= proj.total;
    const allAchievementsUnlocked = ach.unlockedCount >= ach.total;
    const summitReached = this.summitReached;

    if (allZonesExplored && allNpcsMet && allProjectsViewed && allAchievementsUnlocked && summitReached) {
      this.gameComplete = true;
      this.completionTime = Date.now();

      if (emitEvents) {
        eventBus.emit(PROGRESS_EVENTS.GAME_COMPLETE, {
          completionTime: this.completionTime,
          durationMs: this.completionTime - this.startTime,
          stats: this.getCompletionStats()
        });
      }
    }
  }

  /**
   * Records a milestone unlock with optional timestamp and event emission.
   * 
   * @param {string} milestoneName - Display name of milestone/badge
   * @param {number} [timestamp] - Timestamp
   * @param {boolean} [emitEvent=true]
   * @returns {boolean} True if newly recorded
   */
  recordMilestoneUnlock(milestoneName, timestamp = Date.now(), emitEvent = true) {
    if (this.unlockedMilestones.has(milestoneName)) {
      return false;
    }

    this.unlockedMilestones.set(milestoneName, {
      name: milestoneName,
      timestamp
    });

    if (emitEvent) {
      eventBus.emit(PROGRESS_EVENTS.MILESTONE_UNLOCKED, {
        milestoneName,
        progress: this.overallProgress,
        timestamp
      });
    }

    return true;
  }

  /**
   * Checks whether a milestone is unlocked.
   * @param {string} milestoneName
   * @returns {boolean}
   */
  isMilestoneUnlocked(milestoneName) {
    return this.unlockedMilestones.has(milestoneName);
  }

  /**
   * Returns list of all unlocked milestone names.
   * @returns {Array<string>}
   */
  getMilestonesReached() {
    return Array.from(this.unlockedMilestones.keys());
  }

  /**
   * Returns progress toward next milestone for HUD progress bars.
   * @returns {{ current: number, nextMilestone: string, percentToNext: number }}
   */
  getMilestoneProgress() {
    const thresholds = [
      { pct: 25, name: 'Growing Explorer' },
      { pct: 50, name: 'Experienced Developer' },
      { pct: 75, name: 'Polymath Developer' },
      { pct: 100, name: 'Legendary Developer' }
    ];

    for (const item of thresholds) {
      if (this.overallProgress < item.pct) {
        return {
          current: this.overallProgress,
          nextMilestone: item.name,
          percentToNext: item.pct - this.overallProgress
        };
      }
    }

    return {
      current: this.overallProgress,
      nextMilestone: 'Journey Complete',
      percentToNext: 0
    };
  }

  /**
   * Returns current overall progress percentage (0-100).
   * @returns {number}
   */
  getOverallProgress() {
    return this.overallProgress;
  }

  /**
   * Returns detailed Exploration progress (4 base zones).
   * @returns {{ discovered: number, total: number, percentage: number }}
   */
  getExplorationProgress() {
    const total = CANONICAL_PROGRESS_ENTITIES.ZONES.length;
    let discovered = 0;

    const visitedList = this.gameState?.zonesVisited || [];
    CANONICAL_PROGRESS_ENTITIES.ZONES.forEach(z => {
      if (visitedList.includes(z)) {
        discovered++;
      }
    });

    const percentage = Math.round((discovered / total) * 100);
    return { discovered, total, percentage };
  }

  /**
   * Returns detailed NPC interaction progress (5 NPCs total, including Future You).
   * @returns {{ metCount: number, total: number, percentage: number }}
   */
  getNpcProgress() {
    const total = CANONICAL_PROGRESS_ENTITIES.NPCS.length;
    let metCount = 0;

    const interacted = this.gameState?.npcsInteracted || {};

    CANONICAL_PROGRESS_ENTITIES.NPCS.forEach(npc => {
      const tier = interacted[npc];
      if (Number(tier) >= 1) {
        metCount++;
      }
    });

    const percentage = Math.round((metCount / total) * 100);
    return { metCount, total, percentage };
  }

  /**
   * Returns detailed Project discovery progress (6 projects).
   * @returns {{ clickedCount: number, total: number, percentage: number }}
   */
  getProjectProgress() {
    const total = CANONICAL_PROGRESS_ENTITIES.PROJECTS.length;
    let clickedCount = 0;

    const clickedList = this.gameState?.projectsClicked || [];
    CANONICAL_PROGRESS_ENTITIES.PROJECTS.forEach(proj => {
      if (clickedList.includes(proj)) {
        clickedCount++;
      }
    });

    const percentage = Math.round((clickedCount / total) * 100);
    return { clickedCount, total, percentage };
  }

  /**
   * Returns detailed Achievement progress (8 achievements).
   * @returns {{ unlockedCount: number, total: number, percentage: number }}
   */
  getAchievementProgress() {
    const total = CANONICAL_PROGRESS_ENTITIES.ACHIEVEMENT_COUNT;
    const unlockedList = this.gameState?.achievementsUnlocked || [];
    const unlockedCount = Math.min(total, unlockedList.length);
    const percentage = Math.round((unlockedCount / total) * 100);

    return { unlockedCount, total, percentage };
  }

  /**
   * Estimates remaining gameplay minutes based on incomplete targets.
   * @returns {number} Estimated minutes remaining
   */
  estimateTimeToCompletion() {
    if (this.gameComplete) return 0;

    const exp = this.getExplorationProgress();
    const npc = this.getNpcProgress();
    const proj = this.getProjectProgress();
    const ach = this.getAchievementProgress();

    const remainingZones = exp.total - exp.discovered;
    const remainingNpcs = npc.total - npc.metCount;
    const remainingProjects = proj.total - proj.clickedCount;
    const remainingAchievements = ach.total - ach.unlockedCount;
    const remainingSummit = this.summitReached ? 0 : 1;

    // Weight estimate: ~1.5 mins per zone/NPC/project, ~2 mins per achievement
    const totalMinutes = (remainingZones * 1.5) +
                         (remainingNpcs * 1.5) +
                         (remainingProjects * 1.0) +
                         (remainingAchievements * 2.0) +
                         (remainingSummit * 2.0);

    return Math.max(1, Math.round(totalMinutes));
  }

  /**
   * Provides contextual exploration hints for next progression unlock.
   * @returns {{ zonesNeeded: number, zonesExplored: number, summary: string }}
   */
  getProgressPercentageToNextZone() {
    const exp = this.getExplorationProgress();
    const zonesNeeded = Math.max(0, 3 - exp.discovered);

    if (zonesNeeded > 0) {
      return {
        zonesNeeded,
        zonesExplored: exp.discovered,
        summary: `Explore ${zonesNeeded} more zone${zonesNeeded > 1 ? 's' : ''} to unlock the Summit path`
      };
    }

    if (!this.summitReached) {
      return {
        zonesNeeded: 0,
        zonesExplored: exp.discovered,
        summary: 'Ascend to The Summit to complete your journey'
      };
    }

    return {
      zonesNeeded: 0,
      zonesExplored: exp.discovered,
      summary: 'All zones explored!'
    };
  }

  /**
   * Returns comprehensive completion statistics.
   * @returns {Object}
   */
  getCompletionStats() {
    return {
      overallProgress: this.overallProgress,
      currentStage: this.currentStage,
      milestones: this.getMilestonesReached(),
      summitReached: this.summitReached,
      gameComplete: this.gameComplete,
      categories: {
        exploration: this.getExplorationProgress(),
        npcs: this.getNpcProgress(),
        projects: this.getProjectProgress(),
        achievements: this.getAchievementProgress()
      },
      timePlayedMinutes: Math.round((Date.now() - this.startTime) / 60000)
    };
  }

  /**
   * Serializes progress state for the save system.
   * @returns {Object}
   */
  serialize() {
    return {
      overallProgress: this.overallProgress,
      currentStage: this.currentStage,
      categoryProgress: { ...this.categoryProgress },
      unlockedMilestones: Array.from(this.unlockedMilestones.entries()),
      summitReached: this.summitReached,
      gameComplete: this.gameComplete,
      completionTime: this.completionTime,
      startTime: this.startTime
    };
  }

  /**
   * Restores progress state from saved data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;

    if (typeof data.overallProgress === 'number') {
      this.overallProgress = data.overallProgress;
    }
    if (data.currentStage) {
      this.currentStage = data.currentStage;
    }
    if (data.categoryProgress) {
      this.categoryProgress = { ...data.categoryProgress };
    }
    if (Array.isArray(data.unlockedMilestones)) {
      this.unlockedMilestones = new Map(data.unlockedMilestones);
    }
    if (typeof data.summitReached === 'boolean') {
      this.summitReached = data.summitReached;
    }
    if (typeof data.gameComplete === 'boolean') {
      this.gameComplete = data.gameComplete;
    }
    if (data.completionTime !== undefined) {
      this.completionTime = data.completionTime;
    }
    if (data.startTime) {
      this.startTime = data.startTime;
    }
  }

  /**
   * Cleans up listeners and resets all progress metrics to new-game state.
   */
  reset() {
    this._isResetting = true;
    this.overallProgress = 0;
    this.previousProgress = 0;
    this.categoryProgress = {
      exploration: 0,
      npcs: 0,
      projects: 0,
      achievements: 0
    };
    this.currentStage = PROGRESS_STAGES[0].name;
    this.unlockedMilestones.clear();
    this.summitReached = false;
    this.gameComplete = false;
    this.completionTime = null;
    this.startTime = Date.now();

    if (this.gameState && typeof this.gameState.resetState === 'function') {
      this.gameState.resetState();
    }
    this.overallProgress = 0;
    this._isResetting = false;
  }

  /**
   * Destroys tracker and unbinds all event listeners.
   */
  destroy() {
    this._detachEventListeners();
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker();
export default progressTracker;
