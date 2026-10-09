/**
 * UnlockConditionEvaluator - Centralized Unlock Logic & Condition Engine
 * 
 * Dark Forest Portfolio Game
 * Central source of truth for condition evaluation across zones, dialogue tiers,
 * easter eggs, achievements, and game features. Supports composable boolean logic
 * (AND, OR, NOT, nesting), progress metrics, and human-readable feedback.
 */

import eventBus, { PROGRESS_EVENTS } from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';

export const CONDITION_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
};

export const DEFAULT_UNLOCK_PRESETS = {
  // Zones
  'zone:summit': {
    AND: [
      { type: 'zonesVisited', minCount: 3 },
      { type: 'npcsMetCount', minCount: 2 }
    ]
  },
  'zone:foundation': { type: 'always' },
  'zone:webdev': { type: 'always' },
  'zone:aiml': { type: 'always' },
  'zone:mobile': { type: 'always' },

  // Easter Eggs
  'easteregg:research': {
    AND: [
      { type: 'allZonesVisited' },
      { type: 'npcTier3Count', minCount: 1 }
    ]
  },
  'easteregg:nightmode': {
    type: 'summitReached',
    value: true
  },
  'easteregg:competitive': { type: 'always' },
  'easteregg:football': { type: 'always' },
  'easteregg:gym': { type: 'always' },

  // Dialogue Tiers
  'dialogue:tier2': {
    AND: [
      { type: 'zonesVisited', minCount: 1 },
      { type: 'npcAlreadyTalked', value: true }
    ]
  },
  'dialogue:tier3': {
    AND: [
      { type: 'zonesVisited', minCount: 3 },
      { type: 'npcAlreadyTalked', value: true }
    ]
  },

  // Features
  'feature:nightmode': {
    type: 'easterEggFound',
    eggId: 'nightmode'
  },

  // Achievements
  'achievement:first-steps': { type: 'zonesVisited', minCount: 1 },
  'achievement:explorer': { type: 'allZonesVisited' },
  'achievement:summit-seeker': { type: 'zoneReached', zoneId: 'summit' },
  'achievement:connector': { type: 'npcsMetCount', minCount: 5 },
  'achievement:deep-learner': { type: 'npcTier3Count', minCount: 1 },
  'achievement:comprehensive': { type: 'projectsClicked', minCount: 6 },
  'achievement:polymath': {
    type: 'achievementsUnlocked',
    achievementIds: ['explorer', 'connector', 'comprehensive']
  },
  'achievement:night-explorer': {
    type: 'easterEggFound',
    eggId: 'nightmode'
  }
};

export class UnlockConditionEvaluator {
  constructor(gameState = null, conversationTracker = null) {
    this.gameState = gameState || defaultGameState;
    this.conversationTracker = conversationTracker;

    // Extensible custom condition evaluators: key -> function(condition, state)
    this.customEvaluators = new Map();

    // Condition preset repository: "type:id" -> condition object
    this.presets = new Map();
    this._initPresets();
  }

  /**
   * Initializes built-in condition presets.
   * @private
   */
  _initPresets() {
    this.presets.clear();
    Object.entries(DEFAULT_UNLOCK_PRESETS).forEach(([key, condition]) => {
      this.presets.set(key, JSON.parse(JSON.stringify(condition)));
    });
  }

  /**
   * Connects evaluator to runtime game dependencies.
   * 
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [conversationTracker] - ConversationStateTracker instance
   * @returns {UnlockConditionEvaluator}
   */
  create(gameState = null, conversationTracker = null) {
    if (gameState) this.gameState = gameState;
    if (conversationTracker) this.conversationTracker = conversationTracker;
    this._initPresets();
    return this;
  }

  /**
   * Evaluates any condition object (simple leaf or nested boolean tree).
   * 
   * @param {Object} condition - Condition definition
   * @param {Object} [stateOverride] - Optional state for testing/overrides
   * @returns {boolean} True if condition is met
   */
  evaluate(condition, stateOverride = null) {
    if (!condition) return false;

    const state = stateOverride || this.gameState;

    // 1. Complex AND operator
    if (Array.isArray(condition.AND)) {
      return this.evaluateComplex(condition.AND, CONDITION_OPERATORS.AND, state);
    }

    // 2. Complex OR operator
    if (Array.isArray(condition.OR)) {
      return this.evaluateComplex(condition.OR, CONDITION_OPERATORS.OR, state);
    }

    // 3. Complex NOT operator
    if (condition.NOT && typeof condition.NOT === 'object') {
      return !this.evaluate(condition.NOT, state);
    }

    // 4. Simple Leaf Condition
    return this.evaluateSimple(condition, state);
  }

  /**
   * Evaluates a single non-nested leaf condition.
   * 
   * @param {Object} condition - Simple condition
   * @param {Object} [state] - Game state object
   * @returns {boolean}
   */
  evaluateSimple(condition, state = null) {
    if (!condition) return false;
    const s = state || this.gameState;

    // Check custom evaluator registrations first
    if (this.customEvaluators.has(condition.type)) {
      return Boolean(this.customEvaluators.get(condition.type)(condition, s));
    }

    switch (condition.type) {
      case 'always':
        return true;

      case 'never':
        return false;

      case 'zonesVisited': {
        const visited = s?.zonesVisited || [];
        const minCount = condition.minCount !== undefined ? condition.minCount : (condition.count || 1);
        return visited.length >= minCount;
      }

      case 'allZonesVisited': {
        const base = ['foundation', 'webdev', 'aiml', 'mobile'];
        const visited = s?.zonesVisited || [];
        return base.every(z => visited.includes(z));
      }

      case 'npcsMetCount': {
        const metCount = this._getNpcsMetCount(s);
        const minCount = condition.minCount !== undefined ? condition.minCount : (condition.count || 1);
        return metCount >= minCount;
      }

      case 'npcTier3Count': {
        const count = this._getTier3NpcCount(s);
        const minCount = condition.minCount !== undefined ? condition.minCount : (condition.count || 1);
        return count >= minCount;
      }

      case 'npcAlreadyTalked': {
        const interacted = s?.npcsInteracted || {};
        if (condition.npcId) {
          return (Number(interacted[condition.npcId]) || 0) >= 1;
        }
        return Object.values(interacted).some(tier => Number(tier) >= 1);
      }

      case 'easterEggFound': {
        const eggId = condition.eggId;
        const eggs = s?.easterEggsFound || [];
        const hasEgg = eggs.includes(eggId);
        const nightUnlocked = eggId === 'nightmode' && s?.unlocks?.nightModeUnlocked;
        return Boolean(hasEgg || nightUnlocked);
      }

      case 'summitReached': {
        const visited = s?.zonesVisited || [];
        const current = s?.currentZone;
        const reached = visited.includes('summit') || current === 'summit' || Boolean(s?.unlocks?.summitAccessible);
        return condition.value !== undefined ? (reached === Boolean(condition.value)) : reached;
      }

      case 'zoneReached': {
        const targetZone = condition.zoneId;
        const visited = s?.zonesVisited || [];
        const current = s?.currentZone;
        return current === targetZone || visited.includes(targetZone);
      }

      case 'projectsClicked': {
        const clicked = s?.projectsClicked || [];
        if (condition.projectId) {
          return clicked.includes(condition.projectId);
        }
        const minCount = condition.minCount !== undefined ? condition.minCount : (condition.count || 1);
        return clicked.length >= minCount;
      }

      case 'achievementsUnlocked': {
        const unlocked = s?.achievementsUnlocked || [];
        if (Array.isArray(condition.achievementIds)) {
          return condition.achievementIds.every(id => unlocked.includes(id));
        }
        const minCount = condition.minCount !== undefined ? condition.minCount : 1;
        return unlocked.length >= minCount;
      }

      default:
        console.warn(`[UnlockConditionEvaluator] Unknown condition type: "${condition.type}"`);
        return false;
    }
  }

  /**
   * Evaluates an array of conditions combined with a logical operator.
   * 
   * @param {Array<Object>} conditions - Array of condition objects
   * @param {'AND'|'OR'} operator - Logical operator
   * @param {Object} [state] - Game state object
   * @returns {boolean}
   */
  evaluateComplex(conditions, operator, state = null) {
    if (!Array.isArray(conditions) || conditions.length === 0) return true;

    if (operator === CONDITION_OPERATORS.OR) {
      return conditions.some(c => this.evaluate(c, state));
    }

    // Default to AND
    return conditions.every(c => this.evaluate(c, state));
  }

  /**
   * Evaluates whether a target entity or feature can be unlocked.
   * Returns comprehensive status, requirement metrics, and human-readable feedback.
   * 
   * @param {string} targetId - Identifier of target (e.g. 'summit', 'research', 'nightmode')
   * @param {string} targetType - Type of target ('zone', 'easteregg', 'dialogue', 'feature', 'achievement')
   * @returns {{ canUnlock: boolean, requirements: Array<Object>, missing: Array<string>, reason: string }}
   */
  canUnlock(targetId, targetType) {
    const condition = this.getUnlockRequirements(targetId, targetType);

    if (!condition || condition.type === 'always') {
      return {
        canUnlock: true,
        requirements: [],
        missing: [],
        reason: 'Always accessible'
      };
    }

    const requirements = this._extractRequirementItems(condition);
    const missing = [];

    requirements.forEach(req => {
      if (!req.met) {
        const diff = Math.max(1, req.needed - req.current);
        missing.push(`${req.name} (${diff} more needed)`);
      }
    });

    const canUnlock = requirements.every(req => req.met);
    let reason = '';

    if (canUnlock) {
      reason = `All requirements met. ${this._formatTargetName(targetId)} is unlocked!`;
      eventBus.emit(PROGRESS_EVENTS.UNLOCK_CONDITION_MET, {
        targetId,
        targetType,
        reason
      });
    } else {
      const summaryList = requirements.map(r => `${r.current}/${r.needed} ${r.name.toLowerCase()}`).join(', ');
      reason = `You need to ${this.getUnlockDescription(targetId, targetType)}. Currently at: ${summaryList}.`;
    }

    return {
      canUnlock,
      requirements,
      missing,
      reason
    };
  }

  /**
   * Returns condition definition for a target entity.
   * 
   * @param {string} targetId
   * @param {string} targetType
   * @returns {Object|null}
   */
  getUnlockRequirements(targetId, targetType) {
    const key = `${targetType.toLowerCase()}:${targetId.toLowerCase()}`;
    if (this.presets.has(key)) {
      return this.presets.get(key);
    }

    // Fallback checks for direct key
    if (this.presets.has(targetId)) {
      return this.presets.get(targetId);
    }

    return null;
  }

  /**
   * Returns human-readable string description of unlock requirements.
   * 
   * @param {string} targetId
   * @param {string} targetType
   * @returns {string}
   */
  getUnlockDescription(targetId, targetType) {
    const key = `${targetType.toLowerCase()}:${targetId.toLowerCase()}`;

    switch (key) {
      case 'zone:summit':
        return 'explore 3 zones and meet 2 mentors to reach the Summit';

      case 'easteregg:research':
        return 'explore all 4 main zones and reach Tier 3 dialogue with a mentor';

      case 'easteregg:nightmode':
        return 'reach The Summit to open the Night Mode Portal';

      case 'dialogue:tier2':
        return 'explore at least 1 zone and speak with this mentor';

      case 'dialogue:tier3':
        return 'explore at least 3 zones and speak with this mentor';

      case 'feature:nightmode':
        return 'discover the Night Mode Portal easter egg';

      case 'achievement:explorer':
        return 'discover all 4 main clearings in the dark forest';

      case 'achievement:polymath':
        return 'unlock Explorer, Connector, and Comprehensive achievements';

      default: {
        const cond = this.getUnlockRequirements(targetId, targetType);
        if (!cond || cond.type === 'always') return 'Always accessible';
        return `satisfy requirements for ${this._formatTargetName(targetId)}`;
      }
    }
  }

  /**
   * Returns progress toward unlock as a percentage and detailed requirement metrics.
   * 
   * @param {string} targetId
   * @param {string} targetType
   * @returns {{ progress: number, requirements: Array<Object> }}
   */
  getUnlockProgress(targetId, targetType) {
    const status = this.canUnlock(targetId, targetType);
    const reqs = status.requirements;

    if (!reqs || reqs.length === 0) {
      return { progress: status.canUnlock ? 100 : 0, requirements: [] };
    }

    const totalPct = reqs.reduce((acc, r) => {
      const frac = r.needed > 0 ? Math.min(1, r.current / r.needed) : (r.met ? 1 : 0);
      return acc + (frac * 100);
    }, 0);

    const progress = Math.min(100, Math.round(totalPct / reqs.length));

    eventBus.emit(PROGRESS_EVENTS.UNLOCK_PROGRESS_CHANGED, {
      targetId,
      targetType,
      progress
    });

    return { progress, requirements: reqs };
  }

  /**
   * Registers a custom condition evaluator or preset.
   * 
   * @param {string} key - Identifier or condition type
   * @param {Object|Function} conditionDefOrFn - Condition preset or custom evaluator function
   */
  registerCondition(key, conditionDefOrFn) {
    if (typeof conditionDefOrFn === 'function') {
      this.customEvaluators.set(key, conditionDefOrFn);
    } else if (typeof conditionDefOrFn === 'object') {
      this.presets.set(key, conditionDefOrFn);
    }
  }

  /**
   * Returns all predefined condition presets.
   * @returns {Map<string, Object>}
   */
  getConditionPresets() {
    return new Map(this.presets);
  }

  /**
   * Validates if a condition object is well-formed.
   * 
   * @param {Object} condition - Condition object
   * @returns {{ valid: boolean, errors: Array<string> }}
   */
  validateCondition(condition) {
    const errors = [];

    if (!condition || typeof condition !== 'object') {
      return { valid: false, errors: ['Condition must be a non-null object'] };
    }

    if (condition.AND) {
      if (!Array.isArray(condition.AND)) {
        errors.push('AND operator must contain an array of conditions');
      } else {
        condition.AND.forEach((c, i) => {
          const sub = this.validateCondition(c);
          if (!sub.valid) errors.push(`AND[${i}]: ${sub.errors.join(', ')}`);
        });
      }
    } else if (condition.OR) {
      if (!Array.isArray(condition.OR)) {
        errors.push('OR operator must contain an array of conditions');
      } else {
        condition.OR.forEach((c, i) => {
          const sub = this.validateCondition(c);
          if (!sub.valid) errors.push(`OR[${i}]: ${sub.errors.join(', ')}`);
        });
      }
    } else if (condition.NOT) {
      if (typeof condition.NOT !== 'object') {
        errors.push('NOT operator must contain a condition object');
      } else {
        const sub = this.validateCondition(condition.NOT);
        if (!sub.valid) errors.push(`NOT: ${sub.errors.join(', ')}`);
      }
    } else {
      if (!condition.type) {
        errors.push('Leaf condition must specify a "type" property');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Unit tests/evaluates a condition against an arbitrary mock state object.
   * 
   * @param {Object} condition - Condition object
   * @param {Object} mockState - State mock
   * @returns {boolean}
   */
  testCondition(condition, mockState) {
    return this.evaluate(condition, mockState);
  }

  /**
   * Deconstructs conditions into structured requirement items.
   * @private
   */
  _extractRequirementItems(condition, state = null) {
    const s = state || this.gameState;
    const items = [];

    if (Array.isArray(condition.AND)) {
      condition.AND.forEach(sub => {
        items.push(...this._extractRequirementItems(sub, s));
      });
      return items;
    }

    if (Array.isArray(condition.OR)) {
      condition.OR.forEach(sub => {
        items.push(...this._extractRequirementItems(sub, s));
      });
      return items;
    }

    switch (condition.type) {
      case 'zonesVisited': {
        const visited = (s?.zonesVisited || []).filter(z => z !== 'summit').length;
        const needed = condition.minCount || 1;
        items.push({
          name: 'Explore Zones',
          current: visited,
          needed,
          met: visited >= needed
        });
        break;
      }
      case 'allZonesVisited': {
        const base = ['foundation', 'webdev', 'aiml', 'mobile'];
        const visited = (s?.zonesVisited || []).filter(z => base.includes(z)).length;
        items.push({
          name: 'Explore All Main Zones',
          current: visited,
          needed: 4,
          met: visited >= 4
        });
        break;
      }
      case 'npcsMetCount': {
        const current = this._getNpcsMetCount(s);
        const needed = condition.minCount || 1;
        items.push({
          name: 'Meet Mentors',
          current,
          needed,
          met: current >= needed
        });
        break;
      }
      case 'npcTier3Count': {
        const current = this._getTier3NpcCount(s);
        const needed = condition.minCount || 1;
        items.push({
          name: 'Deepen Bonds (Tier 3)',
          current,
          needed,
          met: current >= needed
        });
        break;
      }
      case 'summitReached': {
        const visited = s?.zonesVisited || [];
        const current = s?.currentZone;
        const reached = visited.includes('summit') || current === 'summit' || Boolean(s?.unlocks?.summitAccessible);
        items.push({
          name: 'Reach The Summit',
          current: reached ? 1 : 0,
          needed: 1,
          met: reached
        });
        break;
      }
      case 'projectsClicked': {
        const current = (s?.projectsClicked || []).length;
        const needed = condition.minCount || 1;
        items.push({
          name: 'Inspect Projects',
          current,
          needed,
          met: current >= needed
        });
        break;
      }
      case 'achievementsUnlocked': {
        if (Array.isArray(condition.achievementIds)) {
          const unlocked = s?.achievementsUnlocked || [];
          const current = condition.achievementIds.filter(id => unlocked.includes(id)).length;
          const needed = condition.achievementIds.length;
          items.push({
            name: 'Unlock Key Achievements',
            current,
            needed,
            met: current >= needed
          });
        }
        break;
      }
      case 'easterEggFound': {
        const eggs = s?.easterEggsFound || [];
        const has = eggs.includes(condition.eggId) || (condition.eggId === 'nightmode' && s?.unlocks?.nightModeUnlocked);
        items.push({
          name: `Find ${condition.eggId} Easter Egg`,
          current: has ? 1 : 0,
          needed: 1,
          met: Boolean(has)
        });
        break;
      }
      default:
        items.push({
          name: condition.type,
          current: this.evaluateSimple(condition, s) ? 1 : 0,
          needed: 1,
          met: this.evaluateSimple(condition, s)
        });
    }

    return items;
  }

  /**
   * Helper to count NPCs met.
   * @private
   */
  _getNpcsMetCount(state) {
    if (this.conversationTracker?.getMetCount) {
      return this.conversationTracker.getMetCount();
    }
    const interacted = state?.npcsInteracted;
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
  _getTier3NpcCount(state) {
    const interacted = state?.npcsInteracted;
    if (!interacted || typeof interacted !== 'object') return 0;
    return Object.values(interacted).filter(tier => Number(tier) >= 3).length;
  }

  /**
   * Helper to format human-readable target name.
   * @private
   */
  _formatTargetName(targetId) {
    return targetId
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

// Export singleton instance
export const unlockConditionEvaluator = new UnlockConditionEvaluator();
export default unlockConditionEvaluator;
