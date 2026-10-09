/**
 * MilestoneRewardManager - Progression Milestone & Reward Dispensing System
 * 
 * Dark Forest Portfolio Game
 * Tracks 8 major milestones (progress percentages, zone discoveries, summit ascent,
 * complete NPC connections, and portfolio inspections), dispenses badge rewards,
 * unlocks special portfolio features (Resume Download, Synthesis View, Portfolio View),
 * and coordinates celebratory visual/audio feedback.
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS
} from '../events/EventBus.js';
import defaultGameState from './GameState.js';
import defaultProgressTracker from './ProgressTracker.js';

export const REWARD_TYPES = {
  BADGE: 'badge',
  HINT: 'hint',
  SPECIAL: 'special',
  COSMETIC: 'cosmetic',
  STAT: 'stat'
};

export const MILESTONE_DEFINITIONS = {
  'progress-25': {
    id: 'progress-25',
    name: '25% Completion',
    threshold: 25,
    trigger: { type: 'progressReached', percentage: 25 },
    reward: { type: 'badge', badgeId: 'growing-explorer', badgeName: 'Growing Explorer' },
    description: "You're exploring more. Good start!",
    celebration: { particles: true, particleColor: 0x4A90FF, sound: 'chime', notification: true },
    icon: '🌱'
  },
  'progress-50': {
    id: 'progress-50',
    name: '50% Completion',
    threshold: 50,
    trigger: { type: 'progressReached', percentage: 50 },
    reward: { type: 'badge', badgeId: 'experienced-developer', badgeName: 'Experienced Developer' },
    description: "Halfway there! You're becoming competent.",
    celebration: { particles: true, particleColor: 0x00D9FF, sound: 'chime', notification: true },
    icon: '🛠️'
  },
  'progress-75': {
    id: 'progress-75',
    name: '75% Completion',
    threshold: 75,
    trigger: { type: 'progressReached', percentage: 75 },
    reward: { type: 'badge', badgeId: 'polymath-developer', badgeName: 'Polymath Developer' },
    description: "Almost done! You're a true polymath.",
    celebration: { particles: true, particleColor: 0xB300FF, sound: 'chime_enhanced', notification: true },
    icon: '🧠'
  },
  'progress-100': {
    id: 'progress-100',
    name: '100% Completion',
    threshold: 100,
    trigger: { type: 'progressReached', percentage: 100 },
    reward: { type: 'badge', badgeId: 'legendary-developer', badgeName: 'Legendary Developer' },
    description: "You've completed the journey! Legendary!",
    celebration: { particles: true, particleColor: 0xFFD700, sound: 'fanfare', notification: true, major: true },
    icon: '👑'
  },
  'first-zone': {
    id: 'first-zone',
    name: 'First Zone Discovered',
    threshold: null,
    trigger: { type: 'zoneDiscovered' },
    reward: { type: 'hint', hint: 'More zones await in the dark forest...' },
    description: "You've entered your first zone!",
    celebration: { particles: true, particleColor: 0x4A90FF, sound: 'soft_chime', notification: true },
    icon: '🗺️'
  },
  'summit-reached': {
    id: 'summit-reached',
    name: 'Summit Reached',
    threshold: null,
    trigger: { type: 'zoneReached', zoneId: 'summit' },
    reward: { type: 'special', feature: 'resume-download', description: 'Unlock Resume Download at Summit' },
    description: "You've reached the peak. Download your resume!",
    celebration: { particles: true, particleColor: 0xFFD700, sound: 'orchestral_swell', notification: true, special: true },
    icon: '⛰️'
  },
  'all-npcs-met': {
    id: 'all-npcs-met',
    name: 'All NPCs Met',
    threshold: null,
    trigger: { type: 'npcsMetCount', minCount: 5 },
    reward: { type: 'special', feature: 'synthesis-view', description: 'Unlock Connected Project Synthesis View' },
    description: "You've connected with everyone!",
    celebration: { particles: true, particleColor: 0x00FF66, sound: 'harmony', notification: true },
    icon: '👥'
  },
  'all-projects': {
    id: 'all-projects',
    name: 'All Projects Viewed',
    threshold: null,
    trigger: { type: 'projectsClicked', minCount: 6 },
    reward: { type: 'special', feature: 'portfolio-view', description: 'Unlock Comprehensive Portfolio View' },
    description: "You've seen everything!",
    celebration: { particles: true, particleColor: 0xFFD700, sound: 'success', notification: true },
    icon: '💼'
  }
};

export class MilestoneRewardManager {
  constructor(gameState = null, eventBusRef = null, progressTracker = null) {
    this.gameState = gameState || defaultGameState;
    this.eventBus = eventBusRef || eventBus;
    this.progressTracker = progressTracker || defaultProgressTracker;
    this.scene = null;
    this.particleManager = null;

    // Milestone state repository: milestoneId -> milestone object
    this.milestones = new Map();
    this.rewardHistory = new Map(); // milestoneId -> timestamp
    this.unlockedFeatures = new Set();
    this.unlockedBadges = new Set();
    this.activeHints = [];

    // Notification queue for staggered celebrations
    this.toastQueue = [];
    this.activeToast = null;
    this.toastTimer = null;
    this.isProcessingQueue = false;

    // Event bus handlers
    this._unsubscribers = [];

    this._initMilestones();
  }

  /**
   * Initializes milestone records from canonical definitions.
   * @private
   */
  _initMilestones() {
    this.milestones.clear();
    this.rewardHistory.clear();
    this.unlockedFeatures.clear();
    this.unlockedBadges.clear();
    this.activeHints = [];

    Object.values(MILESTONE_DEFINITIONS).forEach(def => {
      this.milestones.set(def.id, {
        ...def,
        reward: { ...def.reward },
        celebration: { ...def.celebration },
        reached: false,
        reachedTime: null
      });
    });
  }

  /**
   * Initializes manager with runtime game systems and listeners.
   * 
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [progressTracker] - ProgressTracker instance
   * @param {Phaser.Scene} [scene] - Active scene
   * @param {Object} [particleManager] - ParticleEffectManager instance
   * @returns {MilestoneRewardManager}
   */
  create(gameState = null, eventBusRef = null, progressTracker = null, scene = null, particleManager = null) {
    if (gameState) this.gameState = gameState;
    if (eventBusRef) this.eventBus = eventBusRef;
    if (progressTracker) this.progressTracker = progressTracker;
    if (scene) this.scene = scene;
    if (particleManager) this.particleManager = particleManager;

    this._detachEventListeners();
    this._initMilestones();
    this._attachEventListeners();

    // Initial milestone check
    this.checkMilestones();

    return this;
  }

  /**
   * Subscribes to events for responsive milestone evaluation.
   * @private
   */
  _attachEventListeners() {
    // 1. Progress updates
    const unsubProg = this.eventBus.on(PROGRESS_EVENTS.PROGRESS_CHANGED, () => {
      this.checkMilestones();
    });

    // 2. Zone entries & discoveries
    const unsubZone = this.eventBus.on(GAME_EVENTS.ZONE_ENTERED, (payload) => {
      if (payload?.zoneId === 'summit') {
        this.checkMilestones();
      }
    });

    const unsubZoneDisc = this.eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, () => {
      this.checkMilestones();
    });

    // 3. NPC interactions
    const unsubNpc = this.eventBus.on(NPC_EVENTS.CONVERSATION_RECORDED, () => {
      this.checkMilestones();
    });

    // 4. Projects inspected
    const unsubProj = this.eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, () => {
      this.checkMilestones();
    });

    // 5. Global state reset/restore
    const unsubState = this.eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      this.checkMilestones();
    });

    this._unsubscribers = [
      unsubProg,
      unsubZone,
      unsubZoneDisc,
      unsubNpc,
      unsubProj,
      unsubState
    ];
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
   * Evaluates all milestone trigger conditions and dispenses rewards for newly achieved goals.
   * If multiple milestones trigger simultaneously, queues them in prioritized order.
   * 
   * @returns {Array<string>} Array of newly reached milestone IDs
   */
  checkMilestones() {
    const newlyReached = [];

    // Evaluate in canonical priority order
    for (const [id, milestone] of this.milestones.entries()) {
      if (milestone.reached) continue;

      if (this._evaluateTrigger(milestone.trigger)) {
        newlyReached.push(id);
      }
    }

    if (newlyReached.length > 0) {
      // Sort: Progress-based percentage milestones first, then special event/count milestones
      newlyReached.sort((a, b) => {
        const mA = this.milestones.get(a);
        const mB = this.milestones.get(b);
        const prioA = mA.threshold !== null ? 100 - mA.threshold : 200;
        const prioB = mB.threshold !== null ? 100 - mB.threshold : 200;
        return prioA - prioB;
      });

      newlyReached.forEach(id => {
        this.dispenseMilestoneReward(id);
      });
    }

    return newlyReached;
  }

  /**
   * Evaluates a single milestone trigger condition.
   * @private
   */
  _evaluateTrigger(trigger) {
    if (!trigger) return false;

    switch (trigger.type) {
      case 'progressReached': {
        const trackerProgress = (typeof this.progressTracker?.getOverallProgress === 'function')
          ? this.progressTracker.getOverallProgress()
          : (this.progressTracker?.overallProgress ?? 0);
        const stateProgress = this.gameState?.gameProgress || 0;
        const currentProgress = Math.max(trackerProgress, stateProgress);
        return currentProgress >= trigger.percentage;
      }

      case 'zoneDiscovered': {
        const visited = this.gameState?.zonesVisited || [];
        return visited.length >= 1;
      }

      case 'zoneReached': {
        const targetZone = trigger.zoneId;
        const visited = this.gameState?.zonesVisited || [];
        const current = this.gameState?.currentZone;
        return current === targetZone || visited.includes(targetZone);
      }

      case 'npcsMetCount': {
        const minCount = trigger.minCount || 5;
        const interacted = this.gameState?.npcsInteracted || {};
        const metCount = Object.values(interacted).filter(t => Number(t) >= 1).length;
        return metCount >= minCount;
      }

      case 'projectsClicked': {
        const minCount = trigger.minCount || 6;
        const clicked = (this.gameState?.projectsClicked || []).length;
        return clicked >= minCount;
      }

      default:
        return false;
    }
  }

  /**
   * Marks milestone reached, applies rewards, records history, and queues celebrations.
   * 
   * @param {string} milestoneId - Milestone identifier
   * @returns {boolean} True if successfully dispensed
   */
  dispenseMilestoneReward(milestoneId) {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone || milestone.reached) return false;

    const now = Date.now();
    milestone.reached = true;
    milestone.reachedTime = now;
    this.rewardHistory.set(milestoneId, now);

    // Apply specific reward payload
    this.applyReward(milestone.reward);

    // Emit milestoneReached event
    this.eventBus.emit(PROGRESS_EVENTS.MILESTONE_REACHED, {
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      reward: { ...milestone.reward },
      timestamp: now
    });

    // Emit rewardDispensed event
    this.eventBus.emit(PROGRESS_EVENTS.REWARD_DISPENSED, {
      milestoneId: milestone.id,
      rewardType: milestone.reward.type,
      rewardDetails: { ...milestone.reward }
    });

    // Trigger celebration particles and queue notification
    this._triggerCelebration(milestone);
    this.displayMilestoneNotification(milestoneId);

    return true;
  }

  /**
   * Executes domain reward actions based on reward type.
   * 
   * @param {Object} reward - Reward object
   */
  applyReward(reward) {
    if (!reward) return;

    switch (reward.type) {
      case REWARD_TYPES.BADGE: {
        this.unlockedBadges.add(reward.badgeId);
        if (this.progressTracker?.recordMilestoneUnlock) {
          this.progressTracker.recordMilestoneUnlock(reward.badgeName || reward.badgeId);
        }
        break;
      }

      case REWARD_TYPES.HINT: {
        this.activeHints.push(reward.hint);
        break;
      }

      case REWARD_TYPES.SPECIAL: {
        if (reward.feature) {
          this.unlockFeature(reward.feature);
        }
        break;
      }

      case REWARD_TYPES.COSMETIC:
      case REWARD_TYPES.STAT:
        break;
    }
  }

  /**
   * Unlocks a special feature in GameState and broadcasts feature unlock.
   * 
   * @param {string} featureId - Feature ID ('resume-download', 'synthesis-view', 'portfolio-view')
   */
  unlockFeature(featureId) {
    if (!featureId) return;
    this.unlockedFeatures.add(featureId);

    if (this.gameState) {
      if (!this.gameState.unlocks) this.gameState.unlocks = {};

      if (featureId === 'resume-download') {
        this.gameState.unlocks.resumeDownloadAvailable = true;
      } else if (featureId === 'synthesis-view') {
        this.gameState.unlocks.synthesisViewUnlocked = true;
      } else if (featureId === 'portfolio-view') {
        this.gameState.unlocks.portfolioViewUnlocked = true;
      }
    }

    this.eventBus.emit(PROGRESS_EVENTS.BONUS_CONTENT_UNLOCKED, {
      featureId,
      contentType: 'feature',
      name: featureId
    });
  }

  /**
   * Triggers visual particle bursts and sound cues.
   * @private
   */
  _triggerCelebration(milestone) {
    const cel = milestone.celebration;
    if (!cel) return;

    // Particle burst via ParticleEffectManager
    if (cel.particles && this.particleManager?.createBurst) {
      const playerPos = this.gameState?.playerPosition || { x: 600, y: 400 };
      this.particleManager.createBurst(playerPos.x, playerPos.y, {
        color: cel.particleColor || 0xFFD700,
        count: cel.major ? 40 : 20,
        speed: cel.major ? 150 : 90
      });
    }
  }

  /**
   * Enqueues and displays on-screen milestone toast notification.
   * 
   * @param {string} milestoneId
   */
  displayMilestoneNotification(milestoneId) {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    this.toastQueue.push(milestone);
    this._processToastQueue();
  }

  /**
   * Staggers display of notifications when multiple milestones unlock.
   * @private
   */
  _processToastQueue() {
    if (this.isProcessingQueue || this.toastQueue.length === 0) return;

    this.isProcessingQueue = true;
    const milestone = this.toastQueue.shift();

    this.hideMilestoneNotification();

    // 1. Phaser Scene UI Toast
    if (this.scene?.add) {
      const screenWidth = this.scene.cameras?.main?.width || 1200;
      const posX = screenWidth / 2;
      const posY = 75;

      const container = this.scene.add.container(posX, posY);
      container.setScrollFactor(0);
      container.setDepth(1000);

      // Toast background box
      const bg = this.scene.add.rectangle(0, 0, 380, 75, 0x141a2e, 0.95);
      bg.setStrokeStyle(3, milestone.celebration?.particleColor || 0xFFD700);
      container.add(bg);

      // Icon + Texts
      const icon = this.scene.add.text(-160, 0, milestone.icon, { fontSize: '28px' }).setOrigin(0, 0.5);
      const title = this.scene.add.text(-115, -14, `Milestone: ${milestone.name}`, {
        fontSize: '15px',
        fontFamily: 'serif',
        fontStyle: 'bold',
        color: '#FFD700'
      }).setOrigin(0, 0);

      const desc = this.scene.add.text(-115, 8, milestone.description, {
        fontSize: '12px',
        color: '#d0d8e8'
      }).setOrigin(0, 0);

      container.add([icon, title, desc]);

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
                    this.isProcessingQueue = false;
                    this._processToastQueue();
                  }
                });
              } else {
                container.destroy();
                this.activeToast = null;
                this.isProcessingQueue = false;
                this._processToastQueue();
              }
            }, 3600);
          }
        });
      } else {
        container.setAlpha(1);
        this.toastTimer = setTimeout(() => {
          container.destroy();
          this.activeToast = null;
          this.isProcessingQueue = false;
          this._processToastQueue();
        }, 4000);
      }

      this.activeToast = container;
      return;
    }

    // 2. DOM fallback
    if (typeof document !== 'undefined' && document.body) {
      let toastEl = document.getElementById('milestone-toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'milestone-toast';
        document.body.appendChild(toastEl);
      }

      const borderColor = '#' + (milestone.celebration?.particleColor || 0xFFD700).toString(16).padStart(6, '0');

      toastEl.style.cssText = `
        position: fixed;
        top: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 26, 46, 0.95);
        border: 2px solid ${borderColor};
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
        <span style="font-size: 28px;">${milestone.icon}</span>
        <div>
          <div style="font-size: 14px; font-weight: bold; color: ${borderColor};">Milestone Reached!</div>
          <div style="font-size: 16px; font-weight: bold;">${milestone.name}</div>
          <div style="font-size: 12px; color: #b0c0d8;">${milestone.description}</div>
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
          this.isProcessingQueue = false;
          this._processToastQueue();
        }, 200);
      }, 3800);

      this.activeToast = toastEl;
      return;
    }

    // 3. Headless mock toast
    this.activeToast = {
      milestoneId: milestone.id,
      name: milestone.name,
      displayed: true
    };
    this.toastTimer = setTimeout(() => {
      this.activeToast = null;
      this.isProcessingQueue = false;
      this._processToastQueue();
    }, 100);
  }

  /**
   * Dismisses active notification toast.
   */
  hideMilestoneNotification() {
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
   * Checks whether a milestone has been reached.
   * @param {string} milestoneId
   * @returns {boolean}
   */
  isMilestoneReached(milestoneId) {
    return Boolean(this.milestones.get(milestoneId)?.reached);
  }

  /**
   * Returns array of all reached milestone objects.
   * @returns {Array<Object>}
   */
  getMilestonesReached() {
    return Array.from(this.milestones.values()).filter(m => m.reached);
  }

  /**
   * Returns overall milestone completion progress.
   * @returns {{ reachedCount: number, totalCount: number, percentage: number }}
   */
  getMilestoneProgress() {
    const totalCount = this.milestones.size || 8;
    const reachedCount = this.getMilestonesReached().length;
    const percentage = Math.round((reachedCount / totalCount) * 100);
    return { reachedCount, totalCount, percentage };
  }

  /**
   * Returns single milestone definition object.
   * @param {string} milestoneId
   * @returns {Object|null}
   */
  getMilestoneById(milestoneId) {
    return this.milestones.get(milestoneId) || null;
  }

  /**
   * Returns the next unreached percentage milestone or event milestone.
   * @returns {Object|null}
   */
  getNextMilestone() {
    // Check percentage thresholds in order
    const pctMilestones = ['progress-25', 'progress-50', 'progress-75', 'progress-100'];
    for (const id of pctMilestones) {
      const m = this.milestones.get(id);
      if (m && !m.reached) return m;
    }

    // Check event milestones
    for (const m of this.milestones.values()) {
      if (!m.reached) return m;
    }

    return null;
  }

  /**
   * Returns progress toward the next unreached percentage milestone.
   * @returns {{ milestoneName: string, progress: number }}
   */
  getProgressToNextMilestone() {
    const next = this.getNextMilestone();
    if (!next) {
      return { milestoneName: 'All Milestones Completed', progress: 100 };
    }

    const trackerProgress = (typeof this.progressTracker?.getOverallProgress === 'function')
      ? this.progressTracker.getOverallProgress()
      : (this.progressTracker?.overallProgress ?? 0);
    const stateProgress = this.gameState?.gameProgress || 0;
    const currentProgress = Math.max(trackerProgress, stateProgress);

    if (next.threshold !== null) {
      const targetPct = next.threshold;
      const progress = Math.min(100, Math.round((currentProgress / targetPct) * 100));
      return { milestoneName: next.name, progress };
    }

    return { milestoneName: next.name, progress: 0 };
  }

  /**
   * Returns map of reached milestone timestamps.
   * @returns {Record<string, number>}
   */
  getMilestoneRewardHistory() {
    return Object.fromEntries(this.rewardHistory);
  }

  /**
   * Checks if a special feature is unlocked.
   * @param {string} featureId
   * @returns {boolean}
   */
  isFeatureUnlocked(featureId) {
    return this.unlockedFeatures.has(featureId);
  }

  /**
   * Serializes milestone state for the save system.
   * @returns {Object}
   */
  serialize() {
    const reachedIds = [];
    const timestamps = {};

    this.milestones.forEach((m, id) => {
      if (m.reached) {
        reachedIds.push(id);
        timestamps[id] = m.reachedTime;
      }
    });

    return {
      reachedMilestones: reachedIds,
      timestamps,
      unlockedFeatures: Array.from(this.unlockedFeatures),
      unlockedBadges: Array.from(this.unlockedBadges)
    };
  }

  /**
   * Restores milestone state from save data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;

    this.reset();

    if (Array.isArray(data.reachedMilestones)) {
      data.reachedMilestones.forEach(id => {
        const m = this.milestones.get(id);
        if (m) {
          m.reached = true;
          m.reachedTime = data.timestamps?.[id] || Date.now();
          this.rewardHistory.set(id, m.reachedTime);
          this.applyReward(m.reward);
        }
      });
    }

    if (Array.isArray(data.unlockedFeatures)) {
      data.unlockedFeatures.forEach(f => this.unlockFeature(f));
    }
  }

  /**
   * Resets all milestones to unreached state.
   */
  reset() {
    this.hideMilestoneNotification();
    this.toastQueue = [];
    this.isProcessingQueue = false;
    this.rewardHistory.clear();
    this.unlockedFeatures.clear();
    this.unlockedBadges.clear();
    this.activeHints = [];

    this.milestones.forEach(m => {
      m.reached = false;
      m.reachedTime = null;
    });
  }

  /**
   * Cleans up listeners and active notifications.
   */
  destroy() {
    this._detachEventListeners();
    this.hideMilestoneNotification();
  }
}

// Export singleton instance
export const milestoneRewardManager = new MilestoneRewardManager();
export default milestoneRewardManager;
