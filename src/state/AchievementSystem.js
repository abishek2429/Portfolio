/**
 * AchievementSystem - Achievement & Recognition System
 * 
 * Dark Forest Portfolio Game
 * Defines and tracks 8 achievements across Exploration, Social, Project Discovery,
 * Mastery, and Secret categories. Handles condition evaluation, toast notifications,
 * unlock events, and persistent progress tracking.
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS
} from '../events/EventBus.js';
import defaultGameState from './GameState.js';

export const RARITY_LEVELS = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  LEGENDARY: 'Legendary',
  SECRET: 'Secret'
};

export const RARITY_CONFIG = {
  Common: { name: 'Common', borderColor: '#b0b0b0', bgColor: 'rgba(30, 30, 40, 0.95)', textColor: '#e0e0e0' },
  Uncommon: { name: 'Uncommon', borderColor: '#4A90FF', bgColor: 'rgba(20, 30, 60, 0.95)', textColor: '#82b1ff' },
  Rare: { name: 'Rare', borderColor: '#B300FF', bgColor: 'rgba(40, 20, 60, 0.95)', textColor: '#d580ff' },
  Legendary: { name: 'Legendary', borderColor: '#FFD700', bgColor: 'rgba(60, 50, 20, 0.95)', textColor: '#ffe57f' },
  Secret: { name: 'Secret', borderColor: '#7c4dff', bgColor: 'rgba(20, 20, 30, 0.98)', textColor: '#b388ff' }
};

export const ACHIEVEMENT_DEFINITIONS = {
  'first-steps': {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Visit your first zone',
    category: 'Exploration',
    unlockCondition: { type: 'zoneVisited', count: 1 },
    reward: null,
    icon: '👣',
    rarity: RARITY_LEVELS.COMMON,
    secret: false
  },
  'explorer': {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover all four main zones',
    category: 'Exploration',
    unlockCondition: { type: 'zonesVisited', count: 4 },
    reward: null,
    icon: '🗺️',
    rarity: RARITY_LEVELS.UNCOMMON,
    secret: false
  },
  'summit-seeker': {
    id: 'summit-seeker',
    name: 'Summit Seeker',
    description: 'Reach The Summit',
    category: 'Exploration',
    unlockCondition: { type: 'zoneReached', zoneId: 'summit' },
    reward: null,
    icon: '⛰️',
    rarity: RARITY_LEVELS.RARE,
    secret: false
  },
  'connector': {
    id: 'connector',
    name: 'Connector',
    description: 'Talk to all 5 NPCs',
    category: 'Social',
    unlockCondition: { type: 'npcsMetCount', count: 5 },
    reward: null,
    icon: '👥',
    rarity: RARITY_LEVELS.UNCOMMON,
    secret: false
  },
  'deep-learner': {
    id: 'deep-learner',
    name: 'Deep Learner',
    description: 'Reach Tier 3 dialogue with any NPC',
    category: 'Social',
    unlockCondition: { type: 'npcTier3Reached', minCount: 1 },
    reward: null,
    icon: '📚',
    rarity: RARITY_LEVELS.UNCOMMON,
    secret: false
  },
  'comprehensive': {
    id: 'comprehensive',
    name: 'Comprehensive',
    description: 'View all 6 projects',
    category: 'Project Discovery',
    unlockCondition: { type: 'projectsClicked', count: 6 },
    reward: null,
    icon: '💼',
    rarity: RARITY_LEVELS.RARE,
    secret: false
  },
  'polymath': {
    id: 'polymath',
    name: 'Polymath',
    description: 'Master multiple domains: complete all zones + all NPCs + all projects',
    category: 'Mastery',
    unlockCondition: { type: 'multi', requirements: ['explorer', 'connector', 'comprehensive'] },
    reward: 'Special badge + "Legendary" status',
    icon: '👑',
    rarity: RARITY_LEVELS.LEGENDARY,
    secret: false
  },
  'night-explorer': {
    id: 'night-explorer',
    name: 'Night Explorer',
    description: 'Unlock and activate Night Mode',
    category: 'Hidden',
    unlockCondition: { type: 'easterEggFound', eggId: 'nightmode' },
    reward: null,
    icon: '🌙',
    rarity: RARITY_LEVELS.SECRET,
    secret: true
  }
};

export class AchievementSystem {
  constructor(gameState = null, eventBusRef = null, conversationTracker = null) {
    this.gameState = gameState || defaultGameState;
    this.eventBus = eventBusRef || eventBus;
    this.conversationTracker = conversationTracker;
    this.scene = null;

    // Achievement state: achievementId -> { unlocked: boolean, unlockedTime: number|null }
    this.achievements = new Map();
    this.timestamps = new Map();

    // Active notification state
    this.activeToast = null;
    this.toastTimer = null;

    // Event bus handlers
    this._unsubscribers = [];

    // Pre-populate initial definitions
    this._initDefinitions();
  }

  /**
   * Initializes definitions and sets up achievement tracking.
   * @private
   */
  _initDefinitions() {
    this.achievements.clear();
    this.timestamps.clear();

    Object.values(ACHIEVEMENT_DEFINITIONS).forEach(def => {
      this.achievements.set(def.id, {
        ...def,
        unlocked: false,
        unlockedTime: null
      });
    });
  }

  /**
   * Initializes the AchievementSystem with game dependencies and listeners.
   * 
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [conversationTracker] - ConversationStateTracker instance
   * @param {Phaser.Scene} [scene] - Active scene for UI toasts
   * @returns {AchievementSystem}
   */
  create(gameState = null, eventBusRef = null, conversationTracker = null, scene = null) {
    if (gameState) this.gameState = gameState;
    if (eventBusRef) this.eventBus = eventBusRef;
    if (conversationTracker) this.conversationTracker = conversationTracker;
    if (scene) this.scene = scene;

    this._detachEventListeners();
    this._initDefinitions();
    this._syncFromGameState();
    this._attachEventListeners();

    // Initial evaluation
    this.checkAchievements();

    return this;
  }

  /**
   * Synchronizes unlocked status from GameState.achievementsUnlocked.
   * @private
   */
  _syncFromGameState() {
    if (!this.gameState?.achievementsUnlocked) return;

    this.gameState.achievementsUnlocked.forEach(id => {
      const ach = this.achievements.get(id);
      if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedTime = this.timestamps.get(id) || Date.now();
        this.timestamps.set(id, ach.unlockedTime);
      }
    });
  }

  /**
   * Subscribes to runtime gameplay events to trigger achievement checks.
   * @private
   */
  _attachEventListeners() {
    // 1. Zone events
    const unsubZone = this.eventBus.on(GAME_EVENTS.ZONE_ENTERED, () => {
      this.checkAchievements();
    });

    const unsubZoneDisc = this.eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, () => {
      this.checkAchievements();
    });

    // 2. NPC events
    const unsubNpc1 = this.eventBus.on(NPC_EVENTS.CONVERSATION_RECORDED, () => {
      this.checkAchievements();
    });
    const unsubNpc2 = this.eventBus.on(NPC_EVENTS.TIER_UNLOCKED, () => {
      this.checkAchievements();
    });
    const unsubNpc3 = this.eventBus.on(NPC_EVENTS.DIALOGUE_ENDED, () => {
      this.checkAchievements();
    });

    // 3. Project events
    const unsubProj = this.eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, () => {
      this.checkAchievements();
    });

    // 4. Easter Egg / Night Mode events
    const unsubEgg = this.eventBus.on(PROGRESS_EVENTS.EASTER_EGG_FOUND, () => {
      this.checkAchievements();
    });
    const unsubNight = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, () => {
      this.checkAchievements();
    });

    // 5. Game state change
    const unsubState = this.eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      this._syncFromGameState();
      this.checkAchievements();
    });

    this._unsubscribers = [
      unsubZone,
      unsubZoneDisc,
      unsubNpc1,
      unsubNpc2,
      unsubNpc3,
      unsubProj,
      unsubEgg,
      unsubNight,
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
   * Evaluates all achievement unlock conditions against current game state.
   * Checks every achievement and unlocks newly qualified ones.
   */
  checkAchievements() {
    let unlockedAny = false;

    for (const [id, ach] of this.achievements.entries()) {
      if (ach.unlocked) continue;

      if (this._evaluateCondition(ach.unlockCondition)) {
        this.unlockAchievement(id);
        unlockedAny = true;
      }
    }

    return unlockedAny;
  }

  /**
   * Evaluates a single unlock condition object.
   * @private
   */
  _evaluateCondition(condition) {
    if (!condition) return false;

    switch (condition.type) {
      case 'zoneVisited': {
        const count = condition.count || 1;
        const visited = this.gameState?.zonesVisited || [];
        return visited.length >= count;
      }

      case 'zonesVisited': {
        const requiredZones = ['foundation', 'webdev', 'aiml', 'mobile'];
        const visited = this.gameState?.zonesVisited || [];
        const count = requiredZones.filter(z => visited.includes(z)).length;
        return count >= (condition.count || 4);
      }

      case 'zoneReached': {
        const targetZone = condition.zoneId;
        const current = this.gameState?.currentZone;
        const visited = this.gameState?.zonesVisited || [];
        return current === targetZone || visited.includes(targetZone);
      }

      case 'npcsMetCount': {
        const count = condition.count || 5;
        const metCount = this._getNpcsMetCount();
        return metCount >= count;
      }

      case 'npcTier3Reached': {
        const minCount = condition.minCount || 1;
        const tier3Count = this._getTier3NpcCount();
        return tier3Count >= minCount;
      }

      case 'projectsClicked': {
        const count = condition.count || 6;
        const projects = this.gameState?.projectsClicked || [];
        return projects.length >= count;
      }

      case 'multi': {
        const reqs = condition.requirements || [];
        return reqs.every(reqId => this.isAchievementUnlocked(reqId));
      }

      case 'easterEggFound': {
        const eggId = condition.eggId;
        const eggs = this.gameState?.easterEggsFound || [];
        const hasEgg = eggs.includes(eggId);
        const nightUnlocked = eggId === 'nightmode' && this.gameState?.unlocks?.nightModeUnlocked;
        return hasEgg || nightUnlocked;
      }

      default:
        return false;
    }
  }

  /**
   * Helper to count distinct NPCs met.
   * @private
   */
  _getNpcsMetCount() {
    if (this.conversationTracker?.getMetCount) {
      return this.conversationTracker.getMetCount();
    }
    const interacted = this.gameState?.npcsInteracted;
    if (Array.isArray(interacted)) return interacted.length;
    if (interacted && typeof interacted === 'object') {
      return Object.values(interacted).filter(tier => Number(tier) > 0).length;
    }
    return 0;
  }

  /**
   * Helper to count NPCs reached Tier 3.
   * @private
   */
  _getTier3NpcCount() {
    const interacted = this.gameState?.npcsInteracted;
    if (!interacted || typeof interacted !== 'object') return 0;
    return Object.values(interacted).filter(tier => Number(tier) >= 3).length;
  }

  /**
   * Marks an achievement as unlocked, records timestamp, displays toast, and emits events.
   * 
   * @param {string} achievementId - Unique achievement identifier
   * @returns {boolean} True if newly unlocked
   */
  unlockAchievement(achievementId) {
    const ach = this.achievements.get(achievementId);
    if (!ach || ach.unlocked) return false;

    ach.unlocked = true;
    ach.unlockedTime = Date.now();
    this.timestamps.set(achievementId, ach.unlockedTime);

    // Sync with GameState
    if (this.gameState) {
      if (!this.gameState.achievementsUnlocked) {
        this.gameState.achievementsUnlocked = [];
      }
      if (!this.gameState.achievementsUnlocked.includes(achievementId)) {
        this.gameState.achievementsUnlocked.push(achievementId);
      }
    }

    // Emit achievementUnlocked event on EventBus
    const eventPayload = {
      achievementId: ach.id,
      achievementName: ach.name,
      rarity: ach.rarity,
      icon: ach.icon,
      description: ach.description,
      reward: ach.reward,
      timestamp: ach.unlockedTime
    };

    this.eventBus.emit(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, eventPayload);

    // Display on-screen toast notification
    this.displayAchievementNotification(achievementId);

    // Re-check multi-condition achievements like 'polymath'
    if (achievementId !== 'polymath') {
      this.checkAchievements();
    }

    return true;
  }

  /**
   * Checks whether an achievement is currently unlocked.
   * @param {string} achievementId
   * @returns {boolean}
   */
  isAchievementUnlocked(achievementId) {
    return Boolean(this.achievements.get(achievementId)?.unlocked);
  }

  /**
   * Returns array of all unlocked achievement objects.
   * @returns {Array<Object>}
   */
  getUnlockedAchievements() {
    return Array.from(this.achievements.values()).filter(a => a.unlocked);
  }

  /**
   * Returns array of all locked achievement objects.
   * Secret achievements remain hidden if still locked.
   * 
   * @param {boolean} [includeSecrets=false]
   * @returns {Array<Object>}
   */
  getLockedAchievements(includeSecrets = false) {
    return Array.from(this.achievements.values()).filter(a => {
      if (a.unlocked) return false;
      if (a.secret && !includeSecrets) return false;
      return true;
    });
  }

  /**
   * Returns array of all achievements (locked + unlocked).
   * Hidden secret achievements mask description unless unlocked.
   * 
   * @returns {Array<Object>}
   */
  getAllAchievements() {
    return Array.from(this.achievements.values()).map(a => {
      if (a.secret && !a.unlocked) {
        return {
          ...a,
          name: '???',
          description: 'Secret Achievement - explore the mysterious forest to uncover'
        };
      }
      return { ...a };
    });
  }

  /**
   * Returns progress details for an achievement.
   * @param {string} achievementId
   * @returns {{ unlocked: boolean, progress: number, description: string }}
   */
  getAchievementProgress(achievementId) {
    const ach = this.achievements.get(achievementId);
    if (!ach) {
      return { unlocked: false, progress: 0, description: 'Unknown' };
    }

    if (ach.unlocked) {
      return { unlocked: true, progress: 100, description: ach.description };
    }

    const cond = ach.unlockCondition;
    let progress = 0;
    let desc = ach.description;

    switch (cond?.type) {
      case 'zoneVisited': {
        const visited = (this.gameState?.zonesVisited || []).length;
        progress = visited >= 1 ? 100 : 0;
        desc = `Visit 1 zone (${visited}/1)`;
        break;
      }
      case 'zonesVisited': {
        const requiredZones = ['foundation', 'webdev', 'aiml', 'mobile'];
        const visited = (this.gameState?.zonesVisited || []).filter(z => requiredZones.includes(z)).length;
        progress = Math.round((visited / 4) * 100);
        desc = `Discover all 4 main zones (${visited}/4)`;
        break;
      }
      case 'zoneReached': {
        progress = this.gameState?.zonesVisited?.includes('summit') ? 100 : 0;
        desc = 'Reach The Summit (0/1)';
        break;
      }
      case 'npcsMetCount': {
        const count = this._getNpcsMetCount();
        progress = Math.round((count / 5) * 100);
        desc = `Talk to all 5 NPCs (${count}/5)`;
        break;
      }
      case 'npcTier3Reached': {
        const count = this._getTier3NpcCount();
        progress = count >= 1 ? 100 : 0;
        desc = `Reach Tier 3 dialogue with any NPC (${count}/1)`;
        break;
      }
      case 'projectsClicked': {
        const count = (this.gameState?.projectsClicked || []).length;
        progress = Math.round((count / 6) * 100);
        desc = `View all 6 projects (${count}/6)`;
        break;
      }
      case 'multi': {
        const reqs = cond.requirements || [];
        const completed = reqs.filter(r => this.isAchievementUnlocked(r)).length;
        progress = Math.round((completed / reqs.length) * 100);
        desc = `Complete Explorer, Connector, and Comprehensive (${completed}/${reqs.length})`;
        break;
      }
      case 'easterEggFound': {
        progress = 0;
        desc = 'Hidden Secret';
        break;
      }
    }

    const payload = {
      unlocked: false,
      progress: Math.min(100, Math.max(0, progress)),
      description: desc
    };

    this.eventBus.emit(PROGRESS_EVENTS.ACHIEVEMENT_PROGRESS, {
      achievementId,
      ...payload
    });

    return payload;
  }

  /**
   * Retrieves single achievement by ID.
   * @param {string} achievementId
   * @returns {Object|null}
   */
  getAchievementById(achievementId) {
    return this.achievements.get(achievementId) || null;
  }

  /**
   * Returns achievements belonging to a specific category.
   * @param {string} category
   * @returns {Array<Object>}
   */
  getAchievementsByCategory(category) {
    return Array.from(this.achievements.values()).filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * When an achievement was unlocked.
   * @param {string} achievementId
   * @returns {number|null}
   */
  getAchievementUnlockTime(achievementId) {
    return this.timestamps.get(achievementId) || null;
  }

  /**
   * Returns overall achievement completion percentage (0-100%).
   * @returns {number}
   */
  getUnlockPercentage() {
    const total = this.achievements.size || 8;
    const unlocked = this.getUnlockedAchievements().length;
    return Math.round((unlocked / total) * 100);
  }

  /**
   * Displays an on-screen toast notification for 5 seconds.
   * Works with Phaser Scene, DOM overlay, or headless log.
   * 
   * @param {string} achievementId
   */
  displayAchievementNotification(achievementId) {
    const ach = this.achievements.get(achievementId);
    if (!ach) return;

    this.hideAchievementNotification();

    const rarity = RARITY_CONFIG[ach.rarity] || RARITY_CONFIG.Common;

    // 1. Phaser Scene UI Toast
    if (this.scene?.add) {
      const screenWidth = this.scene.cameras?.main?.width || 1200;
      const posX = screenWidth / 2;
      const posY = 70;

      const container = this.scene.add.container(posX, posY);
      container.setScrollFactor(0);
      container.setDepth(1000); // Above all game layers

      // Toast background box
      const bg = this.scene.add.rectangle(0, 0, 360, 70, 0x1a1a2e, 0.95);
      bg.setStrokeStyle(3, parseInt(rarity.borderColor.replace('#', '0x'), 16));
      container.add(bg);

      // Icon + Text
      const icon = this.scene.add.text(-150, 0, ach.icon, { fontSize: '28px' }).setOrigin(0, 0.5);
      const title = this.scene.add.text(-110, -14, `Achievement: ${ach.name}`, {
        fontSize: '15px',
        fontFamily: 'serif',
        fontStyle: 'bold',
        color: rarity.textColor
      }).setOrigin(0, 0);

      const desc = this.scene.add.text(-110, 8, ach.description, {
        fontSize: '12px',
        color: '#c0c0c0'
      }).setOrigin(0, 0);

      container.add([icon, title, desc]);

      // Fade-in (200ms) -> hold 4600ms -> Fade-out (200ms)
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
            }, 4600);
          }
        });
      } else {
        container.setAlpha(1);
        this.toastTimer = setTimeout(() => {
          container.destroy();
          this.activeToast = null;
        }, 5000);
      }

      this.activeToast = container;
      return;
    }

    // 2. DOM / Browser Toast fallback
    if (typeof document !== 'undefined' && document.body) {
      let toastEl = document.getElementById('achievement-toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'achievement-toast';
        document.body.appendChild(toastEl);
      }

      toastEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${rarity.bgColor};
        border: 2px solid ${rarity.borderColor};
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
        <span style="font-size: 28px;">${ach.icon}</span>
        <div>
          <div style="font-size: 14px; font-weight: bold; color: ${rarity.textColor};">Achievement Unlocked!</div>
          <div style="font-size: 16px; font-weight: bold;">${ach.name}</div>
          <div style="font-size: 12px; color: #a0a0b0;">${ach.description}</div>
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
      }, 4800);

      this.activeToast = toastEl;
      return;
    }

    // 3. Headless mock toast
    this.activeToast = {
      achievementId,
      name: ach.name,
      displayed: true
    };
    this.toastTimer = setTimeout(() => {
      this.activeToast = null;
    }, 5000);
  }

  /**
   * Immediately dismisses active toast notification.
   */
  hideAchievementNotification() {
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
   * Serializes achievement state for the save system.
   * @returns {Object}
   */
  serialize() {
    const unlockedIds = [];
    const timestamps = {};

    this.achievements.forEach((ach, id) => {
      if (ach.unlocked) {
        unlockedIds.push(id);
        timestamps[id] = ach.unlockedTime;
      }
    });

    return {
      unlockedAchievements: unlockedIds,
      timestamps
    };
  }

  /**
   * Restores achievement state from save data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;

    this.reset();

    if (Array.isArray(data.unlockedAchievements)) {
      data.unlockedAchievements.forEach(id => {
        const ach = this.achievements.get(id);
        if (ach) {
          ach.unlocked = true;
          ach.unlockedTime = data.timestamps?.[id] || Date.now();
          this.timestamps.set(id, ach.unlockedTime);
        }
      });
    }

    if (this.gameState) {
      this.gameState.achievementsUnlocked = this.getUnlockedAchievements().map(a => a.id);
    }
  }

  /**
   * Resets all achievements to locked state.
   */
  reset() {
    this.hideAchievementNotification();
    this.timestamps.clear();

    this.achievements.forEach(ach => {
      ach.unlocked = false;
      ach.unlockedTime = null;
    });

    if (this.gameState) {
      this.gameState.achievementsUnlocked = [];
    }
  }

  /**
   * Destroys system and cleans up listeners and notifications.
   */
  destroy() {
    this._detachEventListeners();
    this.hideAchievementNotification();
  }
}

// Export singleton instance
export const achievementSystem = new AchievementSystem();
export default achievementSystem;
