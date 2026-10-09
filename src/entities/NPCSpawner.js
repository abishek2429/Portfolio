/**
 * NPCSpawner - Resident NPC Spawning, Physics & Lifecycle Management System
 * 
 * Dark Forest Portfolio Game
 * Instantiates the 5 thematic portfolio NPCs across all forest clearings,
 * manages dialogue tiers (1-3), interaction proximity detection (80px radius),
 * static circular physics bodies, and animation state machine transitions.
 */

import CONFIG from '../config/GameConfig.js';
import { spawnPointManager } from '../world/SpawnPointManager.js';
import { assetLoader } from '../loaders/AssetLoader.js';
import { animationStateMachine } from '../animation/AnimationStateMachine.js';
import eventBus, { NPC_EVENTS } from '../events/EventBus.js';

export const NPC_DEFINITIONS = {
  mentor: {
    id: 'mentor',
    name: 'The Mentor',
    zone: 'foundation',
    x: 600,
    y: 650,
    sprite: 'npc-mentor',
    facing: 'up',
    color: 0x4a90ff
  },
  fullstack: {
    id: 'fullstack',
    name: 'Full-Stack Dev',
    zone: 'webdev',
    x: 300,
    y: 350,
    sprite: 'npc-dev',
    facing: 'left',
    color: 0x00d9ff
  },
  ada: {
    id: 'ada',
    name: 'Ada',
    zone: 'aiml',
    x: 200,
    y: 150,
    sprite: 'npc-ada',
    facing: 'down',
    color: 0xb300ff
  },
  mobilearch: {
    id: 'mobilearch',
    name: 'Mobile Architect',
    zone: 'mobile',
    x: 900,
    y: 350,
    sprite: 'npc-mobilearch',
    facing: 'right',
    color: 0x00ff66
  },
  futureyou: {
    id: 'futureyou',
    name: 'Future You',
    zone: 'summit',
    x: 600,
    y: 50,
    sprite: 'npc-futureyou',
    facing: 'down',
    color: 0xffd700
  }
};

export class NPCSpawner {
  constructor() {
    this.scene = null;
    this.spawnPoints = spawnPointManager;
    this.assetLoader = assetLoader;

    // Core Data Structure
    this.npcs = new Map();           // Map of NPC objects by ID
    this.npcConfig = NPC_DEFINITIONS; // Reference to definitions
    this.spawned = false;
  }

  /**
   * Initializes the NPC spawner system with scene and managers.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [spawnMgr=spawnPointManager] - SpawnPointManager instance
   * @param {Object} [loader=assetLoader] - AssetLoader instance
   * @returns {NPCSpawner}
   */
  create(scene, spawnMgr = spawnPointManager, loader = assetLoader) {
    this.scene = scene;
    this.spawnPoints = spawnMgr;
    this.assetLoader = loader;

    // Ensure fallback procedural textures exist if PNGs not yet loaded
    this._ensureNpcTextures(scene);

    return this;
  }

  /**
   * Spawns all 5 canonical portfolio NPCs at game start.
   * 
   * @returns {Map<string, Object>} Map of spawned NPC objects by ID
   */
  spawnAllNpcs() {
    Object.keys(this.npcConfig).forEach((npcId) => {
      this.spawnNpc(npcId);
    });

    this.spawned = true;
    return this.npcs;
  }

  /**
   * Spawns a single NPC with static physics body and idle animation.
   * 
   * @param {string} npcId - NPC ID ('mentor', 'fullstack', 'ada', etc.)
   * @returns {Object|null} The instantiated NPC data object
   */
  spawnNpc(npcId) {
    // Return existing instance if already spawned
    if (this.npcs.has(npcId)) {
      return this.npcs.get(npcId);
    }

    const config = this.npcConfig[npcId] || CONFIG.getNpc(npcId);
    if (!config) {
      console.warn(`[NPCSpawner] Unknown NPC ID: ${npcId}`);
      return null;
    }

    // Resolve spawn position from SpawnPointManager
    const spawnData = this.spawnPoints?.getNpcSpawn?.(npcId) || config;
    const x = spawnData.x ?? config.x;
    const y = spawnData.y ?? config.y;
    const facing = spawnData.facing || config.facing || 'down';
    const textureKey = config.sprite || `npc-${npcId}`;

    let sprite = null;

    // Create Arcade Physics Sprite in Phaser scene
    if (this.scene?.physics?.add?.sprite) {
      sprite = this.scene.physics.add.sprite(x, y, textureKey, 0);
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(15); // Above ground tiles/paths, below flying particles

      // Configure static circular physics body (doesn't block player)
      if (sprite.body) {
        sprite.body.setCircle(16);
        sprite.body.setImmovable(true);
        sprite.body.moves = false; // Static proximity body
      }

      // Flip sprite horizontally if facing left
      if (facing === 'left') {
        sprite.setFlipX(true);
      }

      // Initial idle animation
      if (animationStateMachine && typeof animationStateMachine.playNpcAnimation === 'function') {
        animationStateMachine.playNpcAnimation(sprite, npcId, 'idle');
      }

      // Optional subtle breathing/swaying tween
      this._addBreathingTween(sprite, y);
    }

    // Build NPC object structure
    const npcObject = {
      id: config.id || npcId,
      name: config.name || npcId,
      zone: config.zone || 'foundation',
      sprite,
      position: { x, y },
      facingDirection: facing,
      dialogueTier: 1,
      hasBeenTalkedTo: false,
      isInteractable: true,
      interactionRadius: 80
    };

    this.npcs.set(npcId, npcObject);

    // Broadcast spawn event
    eventBus.emit('npcSpawned', {
      npcId: npcObject.id,
      npcName: npcObject.name
    });

    return npcObject;
  }

  /**
   * Retrieves an NPC instance by ID.
   * 
   * @param {string} npcId
   * @returns {Object|null}
   */
  getNpc(npcId) {
    return this.npcs.get(npcId) || null;
  }

  /**
   * Returns all active NPC objects.
   * 
   * @returns {Array<Object>} Array of all spawned NPCs
   */
  getAllNpcs() {
    return Array.from(this.npcs.values());
  }

  /**
   * Updates an NPC's facing orientation.
   * 
   * @param {string} npcId
   * @param {string} direction - 'up' | 'down' | 'left' | 'right'
   */
  setNpcDirection(npcId, direction) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    npc.facingDirection = direction;
    if (npc.sprite) {
      if (direction === 'left') {
        npc.sprite.setFlipX(true);
      } else if (direction === 'right') {
        npc.sprite.setFlipX(false);
      }
    }
  }

  /**
   * Updates dialogue tier (1, 2, or 3) for an NPC.
   * 
   * @param {string} npcId
   * @param {number} tier
   */
  setNpcDialogueTier(npcId, tier) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    npc.dialogueTier = Math.max(1, Math.min(3, Math.round(tier)));
  }

  /**
   * Returns current dialogue conversation level (1, 2, or 3).
   * 
   * @param {string} npcId
   * @returns {number}
   */
  getNpcDialogueTier(npcId) {
    const npc = this.getNpc(npcId);
    return npc ? npc.dialogueTier : 1;
  }

  /**
   * Flags an NPC as talked to and emits EventBus interaction event.
   * 
   * @param {string} npcId
   */
  markNpcInteracted(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    npc.hasBeenTalkedTo = true;

    eventBus.emit('npcInteracted', {
      npcId: npc.id,
      tier: npc.dialogueTier,
      npcName: npc.name
    });

    eventBus.emit(NPC_EVENTS.INTERACTION_START, {
      npcId: npc.id,
      npcName: npc.name
    });
  }

  /**
   * Checks if an NPC has already been spoken to.
   * 
   * @param {string} npcId
   * @returns {boolean}
   */
  hasNpcBeenTalkedTo(npcId) {
    const npc = this.getNpc(npcId);
    return Boolean(npc?.hasBeenTalkedTo);
  }

  /**
   * Enables or disables interaction with an NPC (cutscenes, dialogue).
   * 
   * @param {string} npcId
   * @param {boolean} interactable
   */
  setNpcInteractable(npcId, interactable) {
    const npc = this.getNpc(npcId);
    if (npc) {
      npc.isInteractable = Boolean(interactable);
    }
  }

  /**
   * Returns all NPCs located within a specific biome.
   * 
   * @param {string} zoneId
   * @returns {Array<Object>}
   */
  getNpcsInZone(zoneId) {
    return Array.from(this.npcs.values()).filter(npc => npc.zone === zoneId);
  }

  /**
   * Finds all NPCs within a specified interaction radius.
   * 
   * @param {number} x - Target world X
   * @param {number} y - Target world Y
   * @param {number} [radius=80] - Search radius in pixels
   * @returns {Array<Object>}
   */
  getNpcsInRange(x, y, radius = 80) {
    const inRange = [];
    for (const npc of this.npcs.values()) {
      if (!npc.isInteractable) continue;

      const checkRadius = radius || npc.interactionRadius || 80;
      const dist = Math.hypot(npc.position.x - x, npc.position.y - y);

      if (dist <= checkRadius) {
        inRange.push(npc);
      }
    }
    return inRange;
  }

  /**
   * Plays an animation on an NPC via AnimationStateMachine.
   * 
   * @param {string} npcId
   * @param {string} animType - 'idle' | 'talk' | 'walk'
   */
  playNpcAnimation(npcId, animType = 'idle') {
    const npc = this.getNpc(npcId);
    if (!npc || !npc.sprite) return;

    if (animationStateMachine && typeof animationStateMachine.playNpcAnimation === 'function') {
      animationStateMachine.playNpcAnimation(npc.sprite, npcId, animType);
    }
  }

  /**
   * Repositions an NPC sprite and coordinates.
   * 
   * @param {string} npcId
   * @param {number} x
   * @param {number} y
   */
  setNpcPosition(npcId, x, y) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    npc.position = { x, y };
    if (npc.sprite) {
      npc.sprite.setPosition(x, y);
    }
  }

  /**
   * Despawns and cleans up an NPC instance.
   * 
   * @param {string} npcId
   */
  removeNpc(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    if (npc.sprite && typeof npc.sprite.destroy === 'function') {
      npc.sprite.destroy();
    }

    this.npcs.delete(npcId);
  }

  /**
   * Serializes all NPC dialogue tiers and interaction progress for the save system.
   * 
   * @returns {Array<Object>}
   */
  serialize() {
    return Array.from(this.npcs.values()).map(npc => ({
      id: npc.id,
      dialogueTier: npc.dialogueTier,
      hasBeenTalkedTo: npc.hasBeenTalkedTo,
      facingDirection: npc.facingDirection,
      isInteractable: npc.isInteractable,
      position: { ...npc.position }
    }));
  }

  /**
   * Restores NPC state from saved data.
   * 
   * @param {Array<Object>} data
   */
  deserialize(data) {
    if (!Array.isArray(data)) return;

    data.forEach(item => {
      const npc = this.getNpc(item.id);
      if (npc) {
        if (item.dialogueTier !== undefined) npc.dialogueTier = item.dialogueTier;
        if (item.hasBeenTalkedTo !== undefined) npc.hasBeenTalkedTo = item.hasBeenTalkedTo;
        if (item.facingDirection) this.setNpcDirection(item.id, item.facingDirection);
        if (item.isInteractable !== undefined) npc.isInteractable = item.isInteractable;
        if (item.position) this.setNpcPosition(item.id, item.position.x, item.position.y);
      }
    });
  }

  // --- Internal Helpers ---

  _addBreathingTween(sprite, baseY) {
    if (!this.scene?.tweens) return;

    this.scene.tweens.add({
      targets: sprite,
      scaleY: { from: 1, to: 1.04 },
      y: { from: baseY, to: baseY - 1 },
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _ensureNpcTextures(scene) {
    if (!scene?.textures) return;

    Object.entries(this.npcConfig).forEach(([npcId, config]) => {
      const textureKey = config.sprite || `npc-${npcId}`;
      if (scene.textures.exists(textureKey)) return;

      // Create procedural fallback 64x32 spritesheet (Frame 0: idle, Frame 1: talk)
      const canvas = scene.textures.createCanvas(textureKey, 64, 32);
      if (!canvas) return;

      const ctx = canvas.getContext();
      const color = config.color ? `#${config.color.toString(16).padStart(6, '0')}` : '#4a90ff';

      // Draw Frame 0 (idle) & Frame 1 (talk)
      for (let f = 0; f < 2; f++) {
        const ox = f * 32;

        // Robe / Body
        ctx.fillStyle = color;
        ctx.fillRect(ox + 8, 14, 16, 14);

        // Head
        ctx.fillStyle = '#f6d8b8';
        ctx.beginPath();
        ctx.arc(ox + 16, f === 1 ? 8 : 9, 6, 0, Math.PI * 2);
        ctx.fill();

        // Hat / Hood
        ctx.fillStyle = '#111625';
        ctx.beginPath();
        ctx.arc(ox + 16, f === 1 ? 7 : 8, 6, Math.PI, Math.PI * 2);
        ctx.fill();

        // Talking mouth accent on frame 1
        if (f === 1) {
          ctx.fillStyle = '#aa4444';
          ctx.fillRect(ox + 15, 11, 2, 2);
        }
      }

      canvas.refresh();
    });
  }
}

// Export singleton instance
export const npcSpawner = new NPCSpawner();
export default npcSpawner;
