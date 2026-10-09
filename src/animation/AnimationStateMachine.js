/**
 * AnimationStateMachine - Centralized Player & NPC Animation System
 * 
 * Dark Forest Portfolio Game
 * Manages 4-directional player animation states, NPC idle/talk/walk cycles,
 * emote bubble overlays, cross-fade state transitions, and frame caching.
 */

import CONFIG from '../config/GameConfig.js';
import { assetLoader } from '../loaders/AssetLoader.js';

export const PLAYER_ANIM_CONFIGS = {
  'idle-up': { key: 'idle-up', frames: [0], frameRate: 0, speed: 0, repeat: 0, texture: 'player-sprite' },
  'idle-down': { key: 'idle-down', frames: [1], frameRate: 0, speed: 0, repeat: 0, texture: 'player-sprite' },
  'idle-left': { key: 'idle-left', frames: [2], frameRate: 0, speed: 0, repeat: 0, texture: 'player-sprite' },
  'idle-right': { key: 'idle-right', frames: [3], frameRate: 0, speed: 0, repeat: 0, texture: 'player-sprite' },
  'walk-up': { key: 'walk-up', frames: [4], frameRate: 10, speed: 10, repeat: -1, texture: 'player-sprite' },
  'walk-down': { key: 'walk-down', frames: [5], frameRate: 10, speed: 10, repeat: -1, texture: 'player-sprite' },
  'walk-left': { key: 'walk-left', frames: [6], frameRate: 10, speed: 10, repeat: -1, texture: 'player-sprite' },
  'walk-right': { key: 'walk-right', frames: [7], frameRate: 10, speed: 10, repeat: -1, texture: 'player-sprite' }
};

export const NPC_ANIM_TYPES = {
  IDLE: 'idle',
  TALK: 'talk',
  WALK: 'walk'
};

export const EMOTE_TYPES = {
  SURPRISE: 'surprise',
  QUESTION: 'question',
  EXCLAMATION: 'exclamation'
};

export class AnimationStateMachine {
  constructor() {
    this.scene = null;
    this.assetLoader = null;

    // Core Data Structure
    this.animations = new Map();       // Map of animation configs by key
    this.spriteStates = new Map();     // Map of current animation state per sprite ID
    this.activeAnimations = new Set(); // Set of currently playing animation keys

    this._nextSpriteId = 0;
  }

  /**
   * Registers all player and NPC animations with Phaser's animation manager.
   * Called once at game start.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [loader] - AssetLoader instance
   */
  createAnimations(scene, loader = assetLoader) {
    this.scene = scene;
    this.assetLoader = loader;

    // 1. Register Player Animations
    Object.values(PLAYER_ANIM_CONFIGS).forEach((config) => {
      this.registerCustomAnimation({
        key: config.key,
        frames: config.frames,
        speed: config.speed,
        frameRate: config.frameRate,
        repeat: config.repeat,
        textureKey: config.texture
      });
    });

    // 2. Register NPC Animations (mentor, fullstack, ada, mobilearch, futureyou)
    const npcs = CONFIG?.NPCS ? Object.keys(CONFIG.NPCS) : ['mentor', 'fullstack', 'ada', 'mobilearch', 'futureyou'];
    npcs.forEach((npcId) => {
      this._registerNpcAnimations(npcId);
    });

    return this;
  }

  /**
   * Sets and plays an animation on a sprite based on state and direction.
   * 
   * @param {Phaser.Physics.Arcade.Sprite|Object} sprite - Target character sprite
   * @param {string} state - Animation state ('idle' | 'walk' | 'interact' | full key)
   * @param {string} [direction] - Facing direction ('up' | 'down' | 'left' | 'right')
   * @returns {string} The active animation key
   */
  setAnimationState(sprite, state, direction) {
    if (!sprite) return '';

    const spriteId = this._getSpriteId(sprite);
    const prevState = this.getCurrentState(sprite);

    // Parse state and direction
    let resolvedState = state || 'idle';
    let resolvedDirection = direction || prevState.direction || 'down';

    if (resolvedState.includes('-')) {
      const parts = resolvedState.split('-');
      resolvedState = parts[0];
      resolvedDirection = parts[1] || resolvedDirection;
    }

    // State transition rule: walk -> interact (freeze current frame, no animation)
    if (resolvedState === 'interact') {
      if (sprite.anims && typeof sprite.anims.pause === 'function') {
        sprite.anims.pause();
      }
      this.spriteStates.set(spriteId, {
        state: 'interact',
        direction: resolvedDirection,
        key: `${resolvedState}-${resolvedDirection}`
      });
      return `${resolvedState}-${resolvedDirection}`;
    }

    // State transition rule: interact -> walk/idle (resume animation)
    if (prevState.state === 'interact') {
      if (sprite.anims && typeof sprite.anims.resume === 'function') {
        sprite.anims.resume();
      }
    }

    // Compose animation key: {state}-{direction}
    const animKey = `${resolvedState}-${resolvedDirection}`;

    // Check if already playing that animation (no restart)
    if (sprite.anims?.currentAnim?.key === animKey && sprite.anims?.isPlaying) {
      this.spriteStates.set(spriteId, {
        state: resolvedState,
        direction: resolvedDirection,
        key: animKey
      });
      return animKey;
    }

    // Play animation on sprite
    if (typeof sprite.play === 'function') {
      sprite.play(animKey);
    } else if (typeof sprite.anims?.play === 'function') {
      sprite.anims.play(animKey);
    } else if (typeof sprite.playAnimation === 'function') {
      sprite.playAnimation(animKey);
    } else if (typeof sprite.setFrame === 'function') {
      const config = this.animations.get(animKey);
      if (config) {
        sprite.setFrame(config.frames[0]);
      }
    }

    // Update internal state tracking
    this.spriteStates.set(spriteId, {
      state: resolvedState,
      direction: resolvedDirection,
      key: animKey
    });
    this.activeAnimations.add(animKey);

    return animKey;
  }

  /**
   * Returns current animation state descriptor for a sprite.
   * 
   * @param {Object} sprite - Target character sprite
   * @returns {{ state: string, direction: string, key: string }}
   */
  getCurrentState(sprite) {
    if (!sprite) {
      return { state: 'idle', direction: 'down', key: 'idle-down' };
    }
    const spriteId = this._getSpriteId(sprite);
    return this.spriteStates.get(spriteId) || { state: 'idle', direction: 'down', key: 'idle-down' };
  }

  /**
   * Checks if a specific animation (or any animation) is currently active on the sprite.
   * 
   * @param {Object} sprite - Target sprite
   * @param {string} [animKey] - Optional animation key to verify
   * @returns {boolean}
   */
  isAnimationPlaying(sprite, animKey) {
    if (!sprite) return false;
    const isPlaying = Boolean(sprite.anims?.isPlaying);
    if (!animKey) return isPlaying;
    return isPlaying && sprite.anims?.currentAnim?.key === animKey;
  }

  /**
   * Stops current animation and sets sprite to the first frame.
   * Used when player is locked during dialogue or cutscenes.
   * 
   * @param {Object} sprite - Target sprite
   */
  stopAnimation(sprite) {
    if (!sprite) return;

    if (sprite.anims) {
      if (typeof sprite.anims.stop === 'function') {
        sprite.anims.stop();
      }
      if (typeof sprite.setFrame === 'function') {
        const state = this.getCurrentState(sprite);
        const config = this.animations.get(state.key);
        sprite.setFrame(config?.frames?.[0] ?? 0);
      }
    }

    const spriteId = this._getSpriteId(sprite);
    const curr = this.getCurrentState(sprite);
    this.spriteStates.set(spriteId, {
      state: 'stopped',
      direction: curr.direction,
      key: curr.key
    });
    this.activeAnimations.delete(curr.key);
  }

  /**
   * Resumes a paused or stopped animation on the sprite.
   * 
   * @param {Object} sprite - Target sprite
   */
  resumeAnimation(sprite) {
    if (!sprite) return;

    if (sprite.anims?.isPaused && typeof sprite.anims.resume === 'function') {
      sprite.anims.resume();
    } else {
      const state = this.getCurrentState(sprite);
      const targetState = state.state === 'stopped' ? 'idle' : state.state;
      this.setAnimationState(sprite, targetState, state.direction);
    }
  }

  /**
   * Plays an NPC animation cycle.
   * Key: npc-{animType}-{npcId}
   * 
   * @param {Object} npcSprite - Target NPC sprite
   * @param {string} npcId - NPC identifier ('mentor', 'fullstack', 'ada', etc.)
   * @param {string} [animType='idle'] - Animation type ('idle', 'talk', 'walk')
   * @returns {string} Animation key played
   */
  playNpcAnimation(npcSprite, npcId, animType = NPC_ANIM_TYPES.IDLE) {
    const key = `npc-${animType}-${npcId}`;

    // Auto-create on demand if not yet registered
    if (!this.animations.has(key)) {
      this._registerNpcAnimations(npcId);
    }

    if (typeof npcSprite.play === 'function') {
      if (npcSprite.anims?.currentAnim?.key !== key) {
        npcSprite.play(key);
      }
    } else if (typeof npcSprite.anims?.play === 'function') {
      if (npcSprite.anims.currentAnim?.key !== key) {
        npcSprite.anims.play(key);
      }
    } else if (typeof npcSprite.setFrame === 'function') {
      const config = this.animations.get(key);
      if (config) {
        npcSprite.setFrame(config.frames[0]);
      }
    }

    const spriteId = this._getSpriteId(npcSprite);
    this.spriteStates.set(spriteId, { state: animType, direction: 'down', key });
    this.activeAnimations.add(key);

    return key;
  }

  /**
   * Plays an optional visual emote icon above a character's head.
   * 
   * @param {Object} sprite - Character sprite
   * @param {string} emote - Emote type ('surprise' | 'question' | 'exclamation')
   * @returns {Object|null} The created emote game object or tween
   */
  playEmoteAnimation(sprite, emote = EMOTE_TYPES.EXCLAMATION) {
    if (!sprite || !this.scene) return null;

    const x = sprite.x || 0;
    const y = (sprite.y || 0) - (sprite.height || 32) / 2 - 14;

    const emoteSymbols = {
      [EMOTE_TYPES.EXCLAMATION]: '!',
      [EMOTE_TYPES.QUESTION]: '?',
      [EMOTE_TYPES.SURPRISE]: '!!'
    };

    const symbol = emoteSymbols[emote] || '!';

    // Create lightweight floating badge
    let emoteObj = null;
    if (this.scene.add && typeof this.scene.add.text === 'function') {
      emoteObj = this.scene.add.text(x, y, symbol, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#00ffff',
        backgroundColor: '#111625',
        padding: { x: 4, y: 2 }
      });
      emoteObj.setOrigin(0.5, 1);
      emoteObj.setDepth((sprite.depth || 20) + 10);

      // Bounce and float up then fade out
      if (this.scene.tweens) {
        return this.scene.tweens.add({
          targets: emoteObj,
          y: y - 18,
          alpha: { from: 1, to: 0 },
          scaleX: { from: 0.5, to: 1.1 },
          scaleY: { from: 0.5, to: 1.1 },
          duration: 900,
          ease: 'Back.easeOut',
          onComplete: () => {
            emoteObj.destroy();
          }
        });
      }
    }

    return emoteObj;
  }

  /**
   * Smoothly cross-fades or transitions a sprite between two animation states.
   * 
   * @param {Object} sprite - Target character sprite
   * @param {string} fromState - Origin animation state
   * @param {string} toState - Destination animation state
   * @param {number} [duration=200] - Transition duration in ms
   * @returns {Object|null} Tween object if tweening
   */
  transitionState(sprite, fromState, toState, duration = 200) {
    if (!sprite) return null;

    if (duration > 0 && this.scene?.tweens) {
      return this.scene.tweens.add({
        targets: sprite,
        alpha: 0.7,
        duration: duration / 2,
        yoyo: true,
        onYoyo: () => {
          this.setAnimationState(sprite, toState);
        },
        onComplete: () => {
          sprite.alpha = 1;
        }
      });
    }

    this.setAnimationState(sprite, toState);
    return null;
  }

  /**
   * Returns calculated animation length in milliseconds.
   * 
   * @param {string} animKey - Animation key
   * @returns {number} Duration in milliseconds
   */
  getAnimationDuration(animKey) {
    const config = this.animations.get(animKey);
    if (!config) {
      // Check Phaser anims manager directly if available
      const phaserAnim = this.scene?.anims?.get(animKey);
      if (phaserAnim) {
        const frameCount = phaserAnim.frames?.length || 1;
        const rate = phaserAnim.frameRate || 1;
        return (frameCount / rate) * 1000;
      }
      return 0;
    }

    const frameCount = Array.isArray(config.frames) ? config.frames.length : 1;
    const rate = config.frameRate || config.speed || 0;

    if (rate <= 0) return 0; // Static frame
    return Math.round((frameCount / rate) * 1000);
  }

  /**
   * Dynamically registers a custom animation config.
   * 
   * @param {Object} config - { key, frames, speed, frameRate, repeat, textureKey }
   * @returns {Object} Stored animation configuration
   */
  registerCustomAnimation(config) {
    if (!config || !config.key) return null;

    const frameRate = config.frameRate ?? config.speed ?? 10;
    const speed = config.speed ?? frameRate;
    const repeat = config.repeat ?? -1;
    const frames = Array.isArray(config.frames) ? config.frames : [0];
    const textureKey = config.textureKey || config.texture || 'player-sprite';

    const normalizedConfig = {
      key: config.key,
      frames,
      frameRate,
      speed,
      repeat,
      textureKey
    };

    // Cache in map
    this.animations.set(config.key, normalizedConfig);

    // Register with Phaser animation system if available
    if (this.scene?.anims && typeof this.scene.anims.create === 'function') {
      if (!this.scene.anims.exists(config.key)) {
        this.scene.anims.create({
          key: config.key,
          frames: frames.map((frameNum) => ({ key: textureKey, frame: frameNum })),
          frameRate,
          repeat
        });
      }
    }

    return normalizedConfig;
  }

  // --- Internal Helpers ---

  _registerNpcAnimations(npcId) {
    const npcTexture = this._resolveNpcTexture(npcId);

    // 1. NPC Idle: static 0 frame
    this.registerCustomAnimation({
      key: `npc-idle-${npcId}`,
      frames: [0],
      speed: 0,
      frameRate: 0,
      repeat: 0,
      textureKey: npcTexture
    });

    // 2. NPC Talk: frames [0, 1] at 8 fps (head nod / talking)
    this.registerCustomAnimation({
      key: `npc-talk-${npcId}`,
      frames: [0, 1],
      speed: 8,
      frameRate: 8,
      repeat: -1,
      textureKey: npcTexture
    });

    // 3. NPC Walk: frames [0, 1] at 6 fps (sway)
    this.registerCustomAnimation({
      key: `npc-walk-${npcId}`,
      frames: [0, 1],
      speed: 6,
      frameRate: 6,
      repeat: -1,
      textureKey: npcTexture
    });
  }

  _resolveNpcTexture(npcId) {
    const npcConfig = CONFIG?.NPCS?.[npcId];
    if (npcConfig?.sprite) {
      return npcConfig.sprite;
    }
    return `npc-${npcId}`;
  }

  _getSpriteId(sprite) {
    if (!sprite) return 'null_sprite';
    if (!sprite.__animStateId) {
      this._nextSpriteId += 1;
      sprite.__animStateId = `sprite_${this._nextSpriteId}`;
    }
    return sprite.__animStateId;
  }
}

// Export singleton instance
export const animationStateMachine = new AnimationStateMachine();
export default animationStateMachine;
