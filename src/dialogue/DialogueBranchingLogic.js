/**
 * DialogueBranchingLogic - Conditional Dialogue & Contextual Reaction System
 * 
 * Dark Forest Portfolio Game
 * Evaluates game progression, exploration depth, unlocked achievements,
 * and custom flags to seamlessly select contextual dialogue variants.
 * Transforms branching dialogue objects into coherent dialogue strings.
 */

import defaultGameState from '../state/GameState.js';
import { conversationStateTracker as defaultTracker } from '../state/ConversationStateTracker.js';

export const CONDITION_TYPES = {
  ZONES_VISITED: 'zonesVisited',
  PROJECTS_CLICKED: 'projectsClicked',
  NPCS_MET_COUNT: 'npcsMetCount',
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  DIALOGUE_TIER: 'dialogueTier',
  TIME_SINCE_START: 'timeSinceStart',
  CUSTOM_FLAG: 'customFlag'
};

export const OPERATORS = {
  EQUALS: '==',
  STRICT_EQUALS: '===',
  NOT_EQUALS: '!=',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_OR_EQUAL: '>=',
  LESS_OR_EQUAL: '<=',
  IN: 'in'
};

export class DialogueBranchingLogic {
  constructor() {
    this.customFlags = new Map();
    this.decisionsHistory = [];
    this.startTime = Date.now();
  }

  /**
   * Processes a dialogue block and selects the first matching variant,
   * falling back to the default text if no conditions are satisfied.
   * 
   * @param {string|Object} dialogueBlock - Dialogue string or branching object
   * @param {Object} [gameState=defaultGameState] - Active GameState instance
   * @param {Object} [playerData=null] - Optional player stats object
   * @returns {string} Evaluated dialogue text
   */
  evaluateDialogue(dialogueBlock, gameState = defaultGameState, playerData = null) {
    if (!dialogueBlock) return '';
    if (typeof dialogueBlock === 'string') return dialogueBlock;

    const defaultText = typeof dialogueBlock.default === 'string'
      ? dialogueBlock.default
      : '';

    const variants = dialogueBlock.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      return defaultText;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant) continue;

      if (this.evaluateCondition(variant.condition, gameState, playerData)) {
        this.logBranchingDecision(variant.npcId || 'npc', i, variant.text);
        return variant.text || defaultText;
      }
    }

    return defaultText;
  }

  /**
   * Tests a single condition against current world state and player data.
   * 
   * @param {Object|Function} condition - Condition rule object
   * @param {Object} [gameState=defaultGameState] - GameState instance
   * @param {Object} [playerData=null] - Player stats
   * @returns {boolean} True if condition is met
   */
  evaluateCondition(condition, gameState = defaultGameState, playerData = null) {
    if (!condition) return true;

    // Support functional condition predicates for future expansion
    if (typeof condition === 'function') {
      try {
        return Boolean(condition(gameState, playerData));
      } catch (err) {
        console.warn('[DialogueBranchingLogic] Condition predicate error:', err);
        return false;
      }
    }

    const { type, value, operator, flag, npcId } = condition;
    const op = operator || '==';

    switch (type) {
      case CONDITION_TYPES.ZONES_VISITED: {
        const count = gameState?.zonesVisited?.length ?? 1;
        return this._compare(count, op, value);
      }

      case CONDITION_TYPES.PROJECTS_CLICKED: {
        const count = gameState?.projectsClicked?.length ?? 0;
        return this._compare(count, op, value);
      }

      case CONDITION_TYPES.NPCS_MET_COUNT: {
        const count = typeof defaultTracker?.getNpcsTalkedToCount === 'function'
          ? defaultTracker.getNpcsTalkedToCount()
          : Object.keys(gameState?.npcsInteracted || {}).length;
        return this._compare(count, op, value);
      }

      case CONDITION_TYPES.ACHIEVEMENT_UNLOCKED: {
        const list = gameState?.achievementsUnlocked || [];
        if (op === 'in' || op === '==' || !operator) {
          return Array.isArray(list) && list.includes(value);
        }
        return this._compare(list, op, value);
      }

      case CONDITION_TYPES.DIALOGUE_TIER: {
        const targetId = npcId || condition.npc;
        const tier = targetId && typeof defaultTracker?.getCurrentTier === 'function'
          ? defaultTracker.getCurrentTier(targetId)
          : (condition.tier ?? 1);
        return this._compare(tier, op, value);
      }

      case CONDITION_TYPES.TIME_SINCE_START: {
        const elapsed = Date.now() - (gameState?.startTime || this.startTime);
        return this._compare(elapsed, op, value);
      }

      case CONDITION_TYPES.CUSTOM_FLAG: {
        const targetFlag = flag || value;
        const actualFlag = this.evaluateCustomFlag(targetFlag);
        return Boolean(actualFlag);
      }

      default:
        console.warn(`[DialogueBranchingLogic] Unknown condition type: ${type}`);
        return false;
    }
  }

  /**
   * Constructs a variant definition object.
   * 
   * @param {string} text - Variant dialogue text
   * @param {Object} condition - Condition object
   * @returns {{ text: string, condition: Object }}
   */
  createVariant(text, condition) {
    return {
      text: String(text || ''),
      condition: condition || {}
    };
  }

  /**
   * Registers a game-specific custom boolean flag for conditional branching.
   * 
   * @param {string} flagName - Unique flag identifier
   * @param {boolean} [value=true] - Flag value
   */
  addCustomFlag(flagName, value = true) {
    if (flagName) {
      this.customFlags.set(flagName, Boolean(value));
    }
  }

  /**
   * Checks the status of a custom flag.
   * 
   * @param {string} flagName - Flag identifier
   * @returns {boolean}
   */
  evaluateCustomFlag(flagName) {
    return Boolean(this.customFlags.get(flagName));
  }

  /**
   * Applies conditional branching across an array of dialogue blocks.
   * 
   * @param {Array<string|Object>} dialogueArray - Array of dialogue blocks
   * @param {Object} [gameState=defaultGameState] - GameState instance
   * @param {Object} [playerData=null] - Player stats
   * @returns {Array<string>} Evaluated dialogue lines
   */
  processBranchingDialogue(dialogueArray, gameState = defaultGameState, playerData = null) {
    if (!Array.isArray(dialogueArray)) {
      return [this.evaluateDialogue(dialogueArray, gameState, playerData)];
    }

    return dialogueArray.map(block => {
      return this.evaluateDialogue(block, gameState, playerData);
    });
  }

  /**
   * Records branching evaluation decisions for debugging and analytics.
   * 
   * @param {string} npcId - NPC ID
   * @param {number} blockIndex - Block index
   * @param {string} chosenText - Selected text
   */
  logBranchingDecision(npcId, blockIndex, chosenText) {
    this.decisionsHistory.push({
      timestamp: Date.now(),
      npcId,
      blockIndex,
      chosenText
    });
  }

  /**
   * Clears custom flags and decision history.
   */
  reset() {
    this.customFlags.clear();
    this.decisionsHistory = [];
    this.startTime = Date.now();
  }

  // --- Internal Comparison Helper ---

  _compare(actual, operator, expected) {
    switch (operator) {
      case '==':
        return actual == expected;
      case '===':
        return actual === expected;
      case '!=':
        return actual != expected;
      case '!==':
        return actual !== expected;
      case '>':
        return Number(actual) > Number(expected);
      case '<':
        return Number(actual) < Number(expected);
      case '>=':
        return Number(actual) >= Number(expected);
      case '<=':
        return Number(actual) <= Number(expected);
      case 'in':
        if (Array.isArray(actual)) return actual.includes(expected);
        if (Array.isArray(expected)) return expected.includes(actual);
        return false;
      default:
        return actual == expected;
    }
  }
}

// Global Singleton Export
export const dialogueBranchingLogic = new DialogueBranchingLogic();
export default dialogueBranchingLogic;
