/**
 * DialogueManager - NPC Conversation & Narrative Text Box UI System
 * 
 * Dark Forest Portfolio Game
 * Renders fixed-screen bottom dialogue panels with zone-colored NPC name badges,
 * line-wrapped serif text, avatar portraits, animated prompt indicators,
 * linear block queues, and InputHandler context switching.
 */

import eventBus, { NPC_EVENTS } from '../events/EventBus.js';
import CONFIG from '../config/GameConfig.js';
import { inputHandler } from '../input/InputHandler.js';
import { npcSpawner } from '../entities/NPCSpawner.js';
import { dialogueAnimations } from '../animation/DialogueAnimations.js';
import { dialogueBranchingLogic } from '../dialogue/DialogueBranchingLogic.js';

export const DIALOGUE_CONFIG = {
  WIDTH: 960,               // 80% of 1200 canvas width
  HEIGHT: 150,
  X: 120,                   // (1200 - 960) / 2
  Y: 625,                   // 25px margin from bottom (800 - 150 - 25)
  PADDING: 20,
  DEPTH: 500,               // Above game scene, below full-screen modals
  BG_COLOR: 0x1a1a2e,
  BG_ALPHA: 0.95,
  BORDER_COLOR: 0xffffff,
  BORDER_ALPHA: 0.3,
  BORDER_WIDTH: 2,
  CORNER_RADIUS: 8,
  ZONE_COLORS: {
    foundation: '#4A90FF',
    webdev: '#00D9FF',
    aiml: '#B300FF',
    mobile: '#00FF66',
    summit: '#FFD700',
    default: '#4A90FF'
  }
};

export class DialogueManager {
  constructor() {
    this.scene = null;
    this.inputHandler = inputHandler;

    // Core Data Structure
    this.dialogueBox = null;         // Container root
    this.currentDialogue = null;     // { npcId, npcName, zone, blocks }
    this.queue = [];                 // Array of remaining dialogue strings
    this.currentBlockIndex = 0;
    this.totalBlocks = 0;
    this.isActive = false;
    this.npcPortrait = null;         // Sprite reference
    this.onCompleteCallback = null;
    this.textSpeed = 1.0;

    // UI Element References
    this.panelBg = null;
    this.nameText = null;
    this.bodyText = null;
    this.promptText = null;
    this.promptTween = null;

    this._unsubscribers = [];
  }

  /**
   * Initializes the dialogue HUD panel and registers advance input listeners.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [inputMgr=inputHandler] - InputHandler instance
   * @returns {DialogueManager}
   */
  create(scene, inputMgr = inputHandler) {
    this.scene = scene;
    this.inputHandler = inputMgr;

    // Build the visual dialogue container
    this._buildUI();

    // Listen for advance inputs (E key, Space, Enter, or mouse click)
    this._bindInputs();

    // Auto cleanup on scene shutdown or destroy
    if (this.scene?.events?.once) {
      this.scene.events.once('shutdown', () => this.destroy());
      this.scene.events.once('destroy', () => this.destroy());
    }

    return this;
  }

  /**
   * Begins a new conversation sequence for an NPC.
   * Supports either:
   *   startDialogue(npcId, dialogueBlocks, onComplete)
   * or:
   *   startDialogue({ npcId, npcName, zone, blocks }, onComplete)
   * 
   * @param {string|Object} npcIdOrConfig - NPC identifier or full dialogue config
   * @param {Array<string>|string|Function} [dialogueBlocks] - Lines of dialogue or callback
   * @param {Function} [onComplete] - Callback executed when conversation finishes
   */
  startDialogue(npcIdOrConfig, dialogueBlocks, onComplete = null) {
    let npcId = npcIdOrConfig;
    let blocks = dialogueBlocks;
    let callback = onComplete;

    if (typeof npcIdOrConfig === 'object' && npcIdOrConfig !== null) {
      npcId = npcIdOrConfig.npcId;
      blocks = npcIdOrConfig.blocks || [];
      callback = typeof dialogueBlocks === 'function' ? dialogueBlocks : onComplete;
    }

    const blocksArray = Array.isArray(blocks)
      ? [...blocks]
      : (typeof blocks === 'string' ? [blocks] : []);

    if (blocksArray.length === 0) {
      if (typeof callback === 'function') callback();
      return;
    }

    const npcData = (typeof npcIdOrConfig === 'object' && npcIdOrConfig.npcName)
      ? { id: npcId, name: npcIdOrConfig.npcName, zone: npcIdOrConfig.zone }
      : (npcSpawner?.getNpc?.(npcId) || CONFIG.getNpc(npcId) || { id: npcId, name: npcId, zone: 'foundation' });

    const npcName = npcData.name || npcId;
    const zoneId = npcData.zone || 'foundation';

    this.currentDialogue = {
      npcId,
      npcName,
      zone: zoneId,
      blocks: [...blocksArray]
    };

    this.queue = [...blocksArray];
    this.totalBlocks = blocksArray.length;
    this.currentBlockIndex = 0;
    this.onCompleteCallback = callback;
    this.isActive = true;

    // Switch input context to lock movement and enable dialogue navigation
    if (this.inputHandler && typeof this.inputHandler.setInputContext === 'function') {
      this.inputHandler.setInputContext('dialogue');
    }

    // Set NPC avatar portrait
    this.setNpcPortrait(npcId);

    // Show panel with smooth 300ms fade-in
    this._showPanel();

    // Emit EventBus dialogue start event prior to displaying first block
    eventBus.emit('dialogueStarted', {
      npcId,
      npcName,
      zone: zoneId
    });

    // Display first dialogue block
    this.showNextBlock();
  }

  /**
   * Displays the next dialogue line from the queue.
   * Closes conversation when queue is exhausted.
   */
  showNextBlock() {
    if (!this.isActive) return;

    if (this.queue.length === 0) {
      this.closeDialogue();
      return;
    }

    const rawLine = this.queue.shift();
    this.currentBlockIndex += 1;

    const currentLine = (typeof rawLine === 'object' && rawLine !== null)
      ? dialogueBranchingLogic.evaluateDialogue(rawLine)
      : String(rawLine || '');

    const isLastBlock = this.queue.length === 0;
    const npcName = this.currentDialogue?.npcName || 'NPC';
    const zone = this.currentDialogue?.zone || 'foundation';

    // Update text contents
    this.setText(currentLine, npcName, zone);

    // Update prompt text ("Press E to continue" vs "Press E to finish")
    if (this.promptText) {
      this.promptText.setText(isLastBlock ? 'Press E to finish' : 'Press E to continue');
    }

    // Fade-in text animation (200ms)
    if (this.bodyText) {
      dialogueAnimations.playTextIn(this.bodyText);
    }

    // Emit EventBus progress event
    eventBus.emit('dialogueBlockShown', {
      blockIndex: this.currentBlockIndex,
      totalBlocks: this.totalBlocks,
      text: currentLine
    });
  }

  /**
   * Checks whether the dialogue HUD is currently active.
   * @returns {boolean}
   */
  isDialogueActive() {
    return this.isActive;
  }

  /**
   * Immediately closes the dialogue box, restores movement context, and fires callback.
   */
  closeDialogue() {
    if (!this.isActive && !this.dialogueBox?.visible) return;

    this.isActive = false;
    const finishedNpcId = this.currentDialogue?.npcId || null;
    const callback = this.onCompleteCallback;

    // Clear queue
    this.queue = [];
    this.onCompleteCallback = null;

    // Restore gameplay input context
    if (this.inputHandler && typeof this.inputHandler.setInputContext === 'function') {
      this.inputHandler.setInputContext('gameplay');
    }

    // Call onComplete callback immediately
    if (typeof callback === 'function') {
      callback();
    }

    // Emit EventBus dialogueEnded event
    if (finishedNpcId) {
      eventBus.emit('dialogueEnded', { npcId: finishedNpcId });
    }

    // Smooth 300ms fade-out of UI panel
    this._hidePanel();
  }

  /**
   * Sets the text and header name with zone-appropriate styling.
   * 
   * @param {string} text - Main body dialogue text
   * @param {string} npcName - NPC speaker name
   * @param {string} [npcZone='foundation'] - Zone ID for title coloring
   */
  setText(text, npcName, npcZone = 'foundation') {
    if (this.nameText) {
      const color = DIALOGUE_CONFIG.ZONE_COLORS[npcZone] || DIALOGUE_CONFIG.ZONE_COLORS.default;
      this.nameText.setText(npcName);
      this.nameText.setColor(color);
    }

    if (this.bodyText) {
      this.bodyText.setText(text);
    }
  }

  /**
   * Displays the avatar portrait sprite for the speaking NPC.
   * 
   * @param {string} npcId - NPC identifier
   */
  setNpcPortrait(npcId) {
    if (!this.npcPortrait || !this.scene) return;

    const textureKey = `npc-${npcId}`;
    const altKey = npcId === 'fullstack' ? 'npc-dev' : textureKey;

    if (this.scene.textures?.exists(altKey)) {
      this.npcPortrait.setTexture(altKey, 0);
      this.npcPortrait.setVisible(true);
    } else if (this.scene.textures?.exists(textureKey)) {
      this.npcPortrait.setTexture(textureKey, 0);
      this.npcPortrait.setVisible(true);
    } else {
      this.npcPortrait.setVisible(false);
    }
  }

  /**
   * Adjusts text display factor for future typewriter expansions.
   * @param {number} speed
   */
  setDialogueSpeed(speed) {
    if (typeof speed === 'number' && speed > 0) {
      this.textSpeed = speed;
    }
  }

  /**
   * Appends additional dialogue strings to the active queue.
   * @param {Array<string>} dialogueBlocks
   */
  queueDialogue(dialogueBlocks) {
    const blocks = Array.isArray(dialogueBlocks) ? dialogueBlocks : [dialogueBlocks];
    this.queue.push(...blocks);
    this.totalBlocks += blocks.length;
  }

  /**
   * Returns remaining dialogue blocks in the queue.
   * @returns {Array<string>}
   */
  getDialogueQueue() {
    return [...this.queue];
  }

  /**
   * Serializes dialogue state for game saves.
   * @returns {{ currentBlock: number, queue: Array<string>, npcId: string|null }}
   */
  serialize() {
    return {
      currentBlock: this.currentBlockIndex,
      queue: [...this.queue],
      npcId: this.currentDialogue?.npcId || null
    };
  }

  /**
   * Cleans up all UI containers, tweens, and event listeners on shutdown.
   */
  destroy() {
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];

    if (this.promptTween) {
      if (typeof this.promptTween.kill === 'function') this.promptTween.kill();
      else if (typeof this.promptTween.stop === 'function') this.promptTween.stop();
      this.promptTween = null;
    }

    if (this.fadeTween) {
      if (typeof this.fadeTween.kill === 'function') this.fadeTween.kill();
      else if (typeof this.fadeTween.stop === 'function') this.fadeTween.stop();
      this.fadeTween = null;
    }

    dialogueAnimations.stopAllAnimations();

    if (this.dialogueBox && typeof this.dialogueBox.destroy === 'function') {
      this.dialogueBox.destroy();
    }
    this.dialogueBox = null;
    this.panelBg = null;
    this.nameText = null;
    this.bodyText = null;
    this.promptText = null;
    this.npcPortrait = null;

    this.isActive = false;
  }

  // --- Internal Helpers ---

  _buildUI() {
    if (!this.scene?.add?.container) return;

    const { WIDTH, HEIGHT, X, Y, BG_COLOR, BG_ALPHA, BORDER_COLOR, BORDER_ALPHA, BORDER_WIDTH, CORNER_RADIUS, DEPTH } = DIALOGUE_CONFIG;

    // Root screen-locked container
    this.dialogueBox = this.scene.add.container(X, Y);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(DEPTH);
    this.dialogueBox.setVisible(false);
    this.dialogueBox.setAlpha(0);

    // 1. Semi-transparent background panel with border
    const bgGraphics = this.scene.add.graphics();
    bgGraphics.fillStyle(BG_COLOR, BG_ALPHA);
    bgGraphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, CORNER_RADIUS);
    bgGraphics.lineStyle(BORDER_WIDTH, BORDER_COLOR, BORDER_ALPHA);
    bgGraphics.strokeRoundedRect(0, 0, WIDTH, HEIGHT, CORNER_RADIUS);
    this.panelBg = bgGraphics;
    this.dialogueBox.add(bgGraphics);

    // 2. NPC Avatar Portrait (32x32, positioned at x: 25, y: 35)
    if (this.scene.add.sprite) {
      this.npcPortrait = this.scene.add.sprite(36, 45, 'npc-mentor', 0);
      this.npcPortrait.setDisplaySize(32, 32);
      this.npcPortrait.setVisible(false);
      this.dialogueBox.add(this.npcPortrait);
    }

    const textOffsetX = 70; // Offset to give space for avatar

    // 3. NPC Name Header (Top-left, bold, zone colored)
    this.nameText = this.scene.add.text(textOffsetX, 18, 'NPC Name', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#4A90FF'
    });
    this.dialogueBox.add(this.nameText);

    // 4. Main Dialogue Text Area (Readable serif font, max 4 lines with word-wrap)
    this.bodyText = this.scene.add.text(textOffsetX, 44, 'Dialogue text content...', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '16px',
      color: '#FFFFFF',
      lineSpacing: 6,
      wordWrap: { width: WIDTH - textOffsetX - 35, useAdvancedWrap: true }
    });
    this.dialogueBox.add(this.bodyText);

    // 5. Prompt indicator ("Press E to continue")
    this.promptText = this.scene.add.text(WIDTH - 25, HEIGHT - 18, 'Press E to continue', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)'
    });
    this.promptText.setOrigin(1, 1);
    this.dialogueBox.add(this.promptText);

    // Pulsing prompt animation
    this.promptTween = dialogueAnimations.playContinuePulse(this.promptText);

    // Make dialogue box interactive so clicks advance dialogue
    const hasGeom = typeof Phaser !== 'undefined' && Phaser?.Geom?.Rectangle;
    if (hasGeom) {
      bgGraphics.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT),
        Phaser.Geom.Rectangle.Contains
      );
    } else if (typeof bgGraphics.setInteractive === 'function') {
      bgGraphics.setInteractive();
    }
    if (typeof bgGraphics.on === 'function') {
      bgGraphics.on('pointerdown', () => {
        if (this.isActive) {
          this.showNextBlock();
        }
      });
    }
  }

  _bindInputs() {
    // 1. Advance via InputHandler E, Enter, or Space
    if (this.inputHandler) {
      const unsubE = this.inputHandler.onKeyDown('e', () => {
        if (this.isActive) this.showNextBlock();
      });
      const unsubEnter = this.inputHandler.onKeyDown('enter', () => {
        if (this.isActive) this.showNextBlock();
      });
      const unsubSpace = this.inputHandler.onKeyDown('space', () => {
        if (this.isActive) this.showNextBlock();
      });
      const unsubEsc = this.inputHandler.onKeyDown('escape', () => {
        if (this.isActive) this.closeDialogue();
      });

      this._unsubscribers.push(unsubE, unsubEnter, unsubSpace, unsubEsc);
    }

    // 2. Scene-level click advance fallback
    if (this.scene?.input) {
      const onScenePointer = () => {
        if (this.isActive) {
          this.showNextBlock();
        }
      };
      this.scene.input.on('pointerdown', onScenePointer);
      this._unsubscribers.push(() => this.scene?.input?.off('pointerdown', onScenePointer));
    }
  }

  _showPanel() {
    if (!this.dialogueBox) return;

    this.dialogueBox.setVisible(true);

    if (this.fadeTween) {
      if (typeof this.fadeTween.kill === 'function') this.fadeTween.kill();
      else if (typeof this.fadeTween.stop === 'function') this.fadeTween.stop();
      this.fadeTween = null;
    }

    this.fadeTween = dialogueAnimations.playDialogueIn(this.dialogueBox);
  }

  _hidePanel(onComplete) {
    if (!this.dialogueBox) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    if (this.fadeTween) {
      if (typeof this.fadeTween.kill === 'function') this.fadeTween.kill();
      else if (typeof this.fadeTween.stop === 'function') this.fadeTween.stop();
      this.fadeTween = null;
    }

    this.fadeTween = dialogueAnimations.playDialogueOut(this.dialogueBox, () => {
      if (this.dialogueBox) {
        this.dialogueBox.setVisible(false);
      }
      if (typeof onComplete === 'function') onComplete();
    });
  }
}

// Export singleton instance
export const dialogueManager = new DialogueManager();
export default dialogueManager;
