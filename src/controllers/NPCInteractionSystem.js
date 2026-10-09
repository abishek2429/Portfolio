/**
 * NPCInteractionSystem - Proximity Detection & Dialogue Triggering System
 * 
 * Dark Forest Portfolio Game
 * Manages player-to-NPC proximity detection (80px radius), floating "[E]" prompt
 * HUD elements, interaction state machine ('idle', 'inRange', 'interacting', 'cooldown'),
 * dialogue tier resolution (Tiers 1-3), and input locking.
 */

import eventBus, { NPC_EVENTS } from '../events/EventBus.js';
import { npcSpawner as defaultNpcSpawner } from '../entities/NPCSpawner.js';
import { inputHandler as defaultInputHandler } from '../input/InputHandler.js';
import { dialogueManager as defaultDialogueManager } from '../ui/DialogueManager.js';
import { conversationStateTracker as defaultConversationTracker } from '../state/ConversationStateTracker.js';
import { Tier1Dialogues } from '../dialogue/Tier1Dialogues.js';
import { Tier2Dialogues } from '../dialogue/Tier2Dialogues.js';
import { Tier3Dialogues } from '../dialogue/Tier3Dialogues.js';
import { dialogueAnimations } from '../animation/DialogueAnimations.js';

export const INTERACTION_STATES = {
  IDLE: 'idle',
  IN_RANGE: 'inRange',
  INTERACTING: 'interacting',
  COOLDOWN: 'cooldown'
};

export const INTERACTION_CONFIG = {
  DEFAULT_RADIUS: 80,
  COOLDOWN_MS: 500,
  PROMPT_OFFSET_Y: -42,
  DEPTH: 450
};

export class NPCInteractionSystem {
  constructor() {
    this.scene = null;
    this.player = null;
    this.npcSpawner = defaultNpcSpawner;
    this.inputHandler = defaultInputHandler;
    this.dialogueManager = defaultDialogueManager;
    this.conversationTracker = defaultConversationTracker;
    this.eventBus = eventBus;

    // Interaction State
    this.state = INTERACTION_STATES.IDLE;
    this.currentNpc = null;
    this.interactingNpcId = null;
    this.interactionRadius = INTERACTION_CONFIG.DEFAULT_RADIUS;
    this.cooldownTimer = 0;
    this.interactionStartTime = 0;

    // UI Prompt Elements
    this.promptContainer = null;
    this.promptBg = null;
    this.promptText = null;
    this.promptTween = null;

    this._unsubscribers = [];
  }

  /**
   * Initializes the interaction detection system.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} player - PlayerCharacter instance or physics sprite
   * @param {Object} [npcMgr=defaultNpcSpawner] - NPCSpawner instance
   * @param {Object} [inputMgr=defaultInputHandler] - InputHandler instance
   * @param {Object} [dialogueMgr=defaultDialogueManager] - DialogueManager instance
   * @param {Object} [tracker=defaultConversationTracker] - ConversationStateTracker instance
   * @param {Object} [bus=eventBus] - EventBus instance
   * @returns {NPCInteractionSystem}
   */
  create(
    scene,
    player,
    npcMgr = defaultNpcSpawner,
    inputMgr = defaultInputHandler,
    dialogueMgr = defaultDialogueManager,
    tracker = defaultConversationTracker,
    bus = eventBus
  ) {
    this.scene = scene;
    this.player = player;
    this.npcSpawner = npcMgr;
    this.inputHandler = inputMgr;
    this.dialogueManager = dialogueMgr;
    this.conversationTracker = tracker;
    this.eventBus = bus;

    this.state = INTERACTION_STATES.IDLE;
    this.currentNpc = null;
    this.interactingNpcId = null;
    this.cooldownTimer = 0;

    // Build the floating proximity prompt HUD
    this._buildPromptUI();

    // Listen for interaction trigger key (E, Space, Enter)
    this._bindInputs();

    // Auto cleanup on scene shutdown
    if (this.scene?.events?.once) {
      this.scene.events.once('shutdown', () => this.dispose());
      this.scene.events.once('destroy', () => this.dispose());
    }

    return this;
  }

  /**
   * Evaluates proximity, transitions states, and updates prompt position every frame.
   * 
   * @param {number} [time=0] - Game time in ms
   * @param {number} [delta=16.6] - Delta time since last frame in ms
   */
  update(time = 0, delta = 16.6) {
    // 1. Handle cooldown recovery
    if (this.state === INTERACTION_STATES.COOLDOWN) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = 0;
        this.state = INTERACTION_STATES.IDLE;
      } else {
        return;
      }
    }

    // 2. If actively conversing, keep prompt hidden and ignore proximity polling
    if (this.state === INTERACTION_STATES.INTERACTING) {
      return;
    }

    // 3. Find closest NPC within interaction radius
    const closestNpc = this.getClosestNpc();

    if (closestNpc) {
      const isNewNpc = !this.currentNpc || this.currentNpc.id !== closestNpc.id;

      if (this.state !== INTERACTION_STATES.IN_RANGE || isNewNpc) {
        this.state = INTERACTION_STATES.IN_RANGE;
        this.currentNpc = closestNpc;

        this.eventBus.emit(NPC_EVENTS.NPC_IN_RANGE || 'npcInRange', {
          npcId: closestNpc.id,
          npcName: closestNpc.name
        });
      }

      this.showProximityPrompt(closestNpc);
    } else {
      if (this.state === INTERACTION_STATES.IN_RANGE && this.currentNpc) {
        const exitedNpcId = this.currentNpc.id;
        this.eventBus.emit(NPC_EVENTS.NPC_OUT_OF_RANGE || 'npcOutOfRange', {
          npcId: exitedNpcId
        });
      }

      this.state = INTERACTION_STATES.IDLE;
      this.currentNpc = null;
      this.hideProximityPrompt();
    }
  }

  /**
   * Returns all spawned NPCs currently within the player's interaction radius.
   * 
   * @returns {Array<Object>}
   */
  getNpcsInRange() {
    if (!this.player || !this.npcSpawner) return [];

    const playerPos = this._getPlayerPosition();
    const allNpcs = typeof this.npcSpawner.getAllNpcs === 'function'
      ? this.npcSpawner.getAllNpcs()
      : [];

    const inRange = [];
    for (const npc of allNpcs) {
      const npcPos = this._getNpcPosition(npc);
      const distance = this._calculateDistance(playerPos, npcPos);
      if (distance <= this.interactionRadius) {
        inRange.push({ npc, distance });
      }
    }

    inRange.sort((a, b) => a.distance - b.distance);
    return inRange.map(item => item.npc);
  }

  /**
   * Returns the nearest NPC within interaction radius, or null if none in range.
   * 
   * @returns {Object|null}
   */
  getClosestNpc() {
    const npcsInRange = this.getNpcsInRange();
    return npcsInRange.length > 0 ? npcsInRange[0] : null;
  }

  /**
   * Begins dialogue interaction with an NPC.
   * Locks exploration movement, loads active dialogue tier, and opens DialogueManager.
   * 
   * @param {string} [npcId] - Target NPC ID (defaults to closest NPC)
   * @returns {boolean} True if interaction started successfully
   */
  startInteraction(npcId = null) {
    if (this.state === INTERACTION_STATES.INTERACTING) return false;
    if (this.state === INTERACTION_STATES.COOLDOWN) return false;

    const targetNpc = npcId
      ? (this.npcSpawner?.getNpc?.(npcId) || this.currentNpc)
      : (this.currentNpc || this.getClosestNpc());

    if (!targetNpc) return false;

    const activeId = targetNpc.id || npcId;
    this.interactingNpcId = activeId;
    this.currentNpc = targetNpc;
    this.state = INTERACTION_STATES.INTERACTING;
    this.interactionStartTime = Date.now();

    // Hide proximity prompt while reading dialogue
    this.hideProximityPrompt();

    // Lock player exploration movement
    if (this.inputHandler) {
      if (typeof this.inputHandler.lockMovement === 'function') {
        this.inputHandler.lockMovement(true);
      } else if (typeof this.inputHandler.setInputContext === 'function') {
        this.inputHandler.setInputContext('dialogue');
      }
    }

    // Query active dialogue tier (1, 2, or 3) from ConversationStateTracker
    const tier = this.conversationTracker
      ? this.conversationTracker.getCurrentTier(activeId)
      : 1;

    // Load dialogue script lines for this tier
    const dialogueBlocks = this._getDialogueForTier(activeId, tier);

    // Emit interaction start event
    this.eventBus.emit(NPC_EVENTS.INTERACTION_START || 'npcInteractionStart', {
      npcId: activeId,
      npcName: targetNpc.name,
      tier
    });

    // Play subtle NPC head nod reaction
    if (targetNpc.sprite) {
      dialogueAnimations.playNpcTalk(targetNpc.sprite);
    }

    // Begin dialogue playback
    if (this.dialogueManager && typeof this.dialogueManager.startDialogue === 'function') {
      this.dialogueManager.startDialogue(activeId, dialogueBlocks, () => {
        this.endInteraction();
      });
    }

    return true;
  }

  /**
   * Concludes interaction, logs conversation history, unlocks player movement,
   * and starts a 500ms debounce cooldown.
   */
  endInteraction() {
    if (this.state !== INTERACTION_STATES.INTERACTING && !this.interactingNpcId) {
      return;
    }

    const finishedId = this.interactingNpcId || this.currentNpc?.id;
    const timeElapsed = Date.now() - (this.interactionStartTime || Date.now());

    this.state = INTERACTION_STATES.COOLDOWN;
    this.cooldownTimer = INTERACTION_CONFIG.COOLDOWN_MS;
    this.interactingNpcId = null;

    // Hide proximity prompt
    this.hideProximityPrompt();

    // Restore player movement context
    if (this.inputHandler) {
      if (typeof this.inputHandler.lockMovement === 'function') {
        this.inputHandler.lockMovement(false);
      } else if (typeof this.inputHandler.setInputContext === 'function') {
        this.inputHandler.setInputContext('gameplay');
      }
    }

    // Record conversation in tracker
    if (finishedId && this.conversationTracker && typeof this.conversationTracker.recordConversation === 'function') {
      this.conversationTracker.recordConversation(finishedId);
    }

    // Emit interaction end event
    if (finishedId) {
      this.eventBus.emit(NPC_EVENTS.INTERACTION_END || 'npcInteractionEnd', {
        npcId: finishedId,
        timeElapsed
      });
    }
  }

  /**
   * Displays the "[E] Talk" floating prompt above the target NPC.
   * 
   * @param {Object} npc - Target NPC object
   */
  showProximityPrompt(npc) {
    if (!this.promptContainer || !npc) return;

    const npcPos = this._getNpcPosition(npc);
    const targetX = npcPos.x;
    const targetY = npcPos.y + INTERACTION_CONFIG.PROMPT_OFFSET_Y;

    this.promptContainer.setPosition(targetX, targetY);

    if (!this.promptContainer.visible) {
      this.promptContainer.setVisible(true);
      this.promptContainer.setAlpha(1);

      // Start gentle bobbing animation
      if (this.scene?.tweens) {
        if (this.promptTween) this.promptTween.stop();
        this.promptTween = this.scene.tweens.add({
          targets: this.promptContainer,
          y: targetY - 4,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  /**
   * Hides the proximity prompt element and stops bobbing tween.
   */
  hideProximityPrompt() {
    if (!this.promptContainer) return;

    if (this.promptTween) {
      this.promptTween.stop();
      this.promptTween = null;
    }

    this.promptContainer.setVisible(false);
  }

  /**
   * Adjusts proximity interaction radius.
   * @param {number} radius - Detection radius in pixels
   */
  setInteractionRadius(radius) {
    if (typeof radius === 'number' && radius > 0) {
      this.interactionRadius = radius;
    }
  }

  /**
   * Returns current interaction state.
   * @returns {'idle'|'inRange'|'interacting'|'cooldown'}
   */
  getInteractionState() {
    return this.state;
  }

  /**
   * Checks whether dialogue interaction is currently active.
   * @returns {boolean}
   */
  isInteractionActive() {
    return this.state === INTERACTION_STATES.INTERACTING || Boolean(this.dialogueManager?.isDialogueActive?.());
  }

  /**
   * Force cancels any active interaction (e.g. cutscene interruption).
   */
  cancelInteraction() {
    if (this.isInteractionActive()) {
      if (this.dialogueManager?.closeDialogue) {
        this.dialogueManager.closeDialogue();
      }
      this.endInteraction();
    }
  }

  /**
   * Cleans up all UI elements, tweens, and input handlers on shutdown.
   */
  dispose() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];

    this.hideProximityPrompt();

    if (this.promptContainer && typeof this.promptContainer.destroy === 'function') {
      this.promptContainer.destroy();
      this.promptContainer = null;
    }

    this.state = INTERACTION_STATES.IDLE;
    this.currentNpc = null;
    this.interactingNpcId = null;
  }

  // --- Internal Helpers ---

  _buildPromptUI() {
    if (!this.scene?.add?.container) return;

    this.promptContainer = this.scene.add.container(0, 0);
    this.promptContainer.setDepth(INTERACTION_CONFIG.DEPTH);
    this.promptContainer.setVisible(false);

    // Dark pill background with border
    const width = 64;
    const height = 24;
    const bgGraphics = this.scene.add.graphics();
    bgGraphics.fillStyle(0x1a1a2e, 0.85);
    bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bgGraphics.lineStyle(1.5, 0xffffff, 0.6);
    bgGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    this.promptBg = bgGraphics;
    this.promptContainer.add(bgGraphics);

    // Prompt text label "[E] Talk"
    this.promptText = this.scene.add.text(0, 0, '[E] Talk', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    });
    this.promptText.setOrigin(0.5, 0.5);
    this.promptContainer.add(this.promptText);
  }

  _bindInputs() {
    if (!this.inputHandler) return;

    const onTrigger = () => {
      if (this.state === INTERACTION_STATES.IN_RANGE && this.currentNpc) {
        this.startInteraction();
      }
    };

    const unsubE = this.inputHandler.onKeyDown('e', onTrigger);
    const unsubSpace = this.inputHandler.onKeyDown('space', onTrigger);
    const unsubEnter = this.inputHandler.onKeyDown('enter', onTrigger);

    this._unsubscribers.push(unsubE, unsubSpace, unsubEnter);

    // Pointer click on NPC
    if (this.scene?.input) {
      const onPointerDown = pointer => {
        if (this.state === INTERACTION_STATES.IN_RANGE && this.currentNpc) {
          const npcPos = this._getNpcPosition(this.currentNpc);
          const worldPoint = pointer.positionToCamera
            ? pointer.positionToCamera(this.scene.cameras?.main)
            : { x: pointer.worldX ?? pointer.x, y: pointer.worldY ?? pointer.y };

          const distToNpc = this._calculateDistance(worldPoint, npcPos);
          if (distToNpc <= 32) {
            this.startInteraction();
          }
        }
      };
      this.scene.input.on('pointerdown', onPointerDown);
      this._unsubscribers.push(() => this.scene?.input?.off('pointerdown', onPointerDown));
    }
  }

  _getPlayerPosition() {
    if (typeof this.player?.getPosition === 'function') {
      return this.player.getPosition();
    }
    return {
      x: this.player?.x ?? this.player?.sprite?.x ?? 0,
      y: this.player?.y ?? this.player?.sprite?.y ?? 0
    };
  }

  _getNpcPosition(npc) {
    if (!npc) return { x: 0, y: 0 };
    return {
      x: npc.sprite?.x ?? npc.x ?? 0,
      y: npc.sprite?.y ?? npc.y ?? 0
    };
  }

  _calculateDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _getDialogueForTier(npcId, tier) {
    if (tier === 3) {
      return Tier3Dialogues[npcId] || Tier2Dialogues[npcId] || Tier1Dialogues[npcId] || ["..."];
    }
    if (tier === 2) {
      return Tier2Dialogues[npcId] || Tier1Dialogues[npcId] || ["..."];
    }
    return Tier1Dialogues[npcId] || ["..."];
  }
}

// Global Singleton Export
export const npcInteractionSystem = new NPCInteractionSystem();
export default npcInteractionSystem;
