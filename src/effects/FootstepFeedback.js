/**
 * FootstepFeedback - Procedural Audio & Particle Walking Feedback System
 * 
 * Dark Forest Portfolio Game
 * Generates throttled dust debris particles and pitch-modulated footstep SFX,
 * dynamically responding to terrain types (grass, stone paths, water) and player direction.
 */

import eventBus, { GAME_EVENTS } from '../events/EventBus.js';
import { collisionLayer } from '../physics/CollisionLayer.js';
import { TILES } from '../world/TilemapGenerator.js';
import { particleEffectManager } from './ParticleEffectManager.js';
import { assetLoader } from '../loaders/AssetLoader.js';

export const FOOTSTEP_CONFIG = {
  AUDIO_INTERVAL: 400,     // ms between step sounds
  PARTICLE_INTERVAL: 100,  // ms between dust puffs
  VOLUME: 0.3,             // subtle non-intrusive level
  PITCH_MIN: 0.9,          // pitch variation min
  PITCH_MAX: 1.1,          // pitch variation max
  PARTICLE: {
    COLOR: 0x888888,
    START_SCALE: 0.3,
    END_SCALE: 0,
    SPEED_MIN: 0,
    SPEED_MAX: 20,
    ANGLE_MIN: 200,
    ANGLE_MAX: 340,
    LIFESPAN: 500,
    START_ALPHA: 0.6,
    END_ALPHA: 0,
    MAX_PARTICLES: 8
  }
};

export const TERRAIN_TYPES = {
  GRASS: 'grass',
  STONE: 'stone',
  WATER: 'water',
  DEFAULT: 'default'
};

export class FootstepFeedback {
  constructor() {
    this.scene = null;
    this.assetLoader = null;
    this.particleManager = null;

    // Core Data Structure
    this.lastParticleTime = 0;
    this.lastAudioTime = 0;
    this.footstepInterval = FOOTSTEP_CONFIG.AUDIO_INTERVAL;
    this.particleInterval = FOOTSTEP_CONFIG.PARTICLE_INTERVAL;
    this.enabled = true;
    this.volume = FOOTSTEP_CONFIG.VOLUME;

    // State Tracking
    this.currentFoot = 'left'; // Alternates 'left' | 'right' for stereo panning
    this.isMoving = false;
    this.lastDirection = 'down';
    this.emitter = null;
    this._unsubscribers = [];
  }

  /**
   * Initializes the footstep feedback system and binds EventBus listeners.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [loader=assetLoader] - AssetLoader instance
   * @param {Object} [particleMgr=particleEffectManager] - ParticleEffectManager instance
   * @returns {FootstepFeedback}
   */
  create(scene, loader = assetLoader, particleMgr = particleEffectManager) {
    this.scene = scene;
    this.assetLoader = loader;
    this.particleManager = particleMgr;

    // Ensure particle textures exist
    this._ensureDustTexture(scene);

    // Subscribe to EventBus movement events
    this._subscribeEvents();

    return this;
  }

  /**
   * Called whenever the player position updates.
   * Triggers throttled visual particles and rhythmic audio feedback.
   * 
   * @param {number} x - Player world X
   * @param {number} y - Player world Y
   * @param {string} [direction='down'] - Facing orientation ('up' | 'down' | 'left' | 'right')
   * @param {boolean} [isMoving=true] - Movement activity state
   */
  onPlayerMoved(x, y, direction = 'down', isMoving = true) {
    if (!this.enabled || !isMoving) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;
    this.lastDirection = direction;
    const now = Date.now();

    // 1. Throttled Visual Dust Particle Feedback (every ~100ms)
    if (now - this.lastParticleTime >= this.particleInterval) {
      this.lastParticleTime = now;
      this.emitFootstepParticles(x, y, direction);
    }

    // 2. Throttled Footstep Sound Feedback (every ~400ms)
    if (now - this.lastAudioTime >= this.footstepInterval) {
      this.lastAudioTime = now;
      const terrain = this.getTerrainAtPosition(x, y);
      this.playFootstepSound(terrain);
    }
  }

  /**
   * Emits dust/debris particles at player feet with directional spray.
   * 
   * @param {number} x - Foot world X
   * @param {number} y - Foot world Y
   * @param {string} [direction='down'] - Facing direction
   */
  emitFootstepParticles(x, y, direction = 'down') {
    if (!this.enabled) return;

    // Offset slightly to render behind/under feet (sprite center is y, feet at y + 12)
    const footY = y + 12;

    // Use ParticleEffectManager if available
    if (this.particleManager && typeof this.particleManager.emitFootsteps === 'function') {
      this.particleManager.emitFootsteps(x, footY);
      return;
    }

    if (!this.scene?.add?.particles) return;

    // Calculate directional cone angle
    const angleRange = this._getDirectionalSprayAngle(direction);

    // Direct Phaser particle emission
    this.scene.add.particles(x, footY, 'particle-dust', {
      speed: { min: FOOTSTEP_CONFIG.PARTICLE.SPEED_MIN, max: FOOTSTEP_CONFIG.PARTICLE.SPEED_MAX },
      angle: angleRange,
      scale: { start: FOOTSTEP_CONFIG.PARTICLE.START_SCALE, end: FOOTSTEP_CONFIG.PARTICLE.END_SCALE },
      alpha: { start: FOOTSTEP_CONFIG.PARTICLE.START_ALPHA, end: FOOTSTEP_CONFIG.PARTICLE.END_ALPHA },
      lifespan: FOOTSTEP_CONFIG.PARTICLE.LIFESPAN,
      tint: FOOTSTEP_CONFIG.PARTICLE.COLOR,
      quantity: 2,
      stopAfter: FOOTSTEP_CONFIG.PARTICLE.MAX_PARTICLES
    });
  }

  /**
   * Plays a pitch-modulated, stereo-panned footstep SFX for the given terrain.
   * 
   * @param {string} [terrainType='default'] - Surface type ('grass', 'stone', 'water')
   */
  playFootstepSound(terrainType = TERRAIN_TYPES.DEFAULT) {
    if (!this.enabled || !this.scene?.sound) return;

    // Pitch variation: 0.9x to 1.1x to avoid acoustic repetition
    const pitch = FOOTSTEP_CONFIG.PITCH_MIN + Math.random() * (FOOTSTEP_CONFIG.PITCH_MAX - FOOTSTEP_CONFIG.PITCH_MIN);

    // Stereo panning based on alternating left/right foot
    const pan = this.currentFoot === 'left' ? -0.15 : 0.15;
    this.currentFoot = this.currentFoot === 'left' ? 'right' : 'left';

    // Resolve audio asset key
    const soundKey = this._resolveSoundKey(terrainType);

    try {
      if (this.scene.cache?.audio?.exists(soundKey)) {
        this.scene.sound.play(soundKey, {
          volume: this.volume,
          rate: pitch,
          pan
        });
      }
    } catch (e) {
      // Audio playback silent catch (browser autoplay policies)
    }
  }

  /**
   * Sets footstep playback volume.
   * 
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setFootstepVolume(volume) {
    if (typeof volume === 'number') {
      this.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Sets the interval between audio steps.
   * 
   * @param {number} msPerStep - Milliseconds per footstep (default: 400)
   */
  setFootstepFrequency(msPerStep) {
    if (typeof msPerStep === 'number' && msPerStep > 0) {
      this.footstepInterval = msPerStep;
    }
  }

  /**
   * Halts all active feedback (e.g. during cutscenes or dialogue).
   */
  stop() {
    this.isMoving = false;
  }

  /**
   * Toggles footstep feedback system on or off (settings menu).
   * 
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.stop();
    }
  }

  /**
   * Determines the terrain surface type at a given world position.
   * Inspects tilemap data via CollisionLayer.
   * 
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {string} Terrain type ('grass' | 'stone' | 'water')
   */
  getTerrainAtPosition(x, y) {
    if (!collisionLayer) return TERRAIN_TYPES.GRASS;

    const tileId = collisionLayer.getCollisionTileAt(x, y);

    if (tileId === TILES.STONE_PATH) {
      return TERRAIN_TYPES.STONE;
    }
    if (tileId === TILES.WATER) {
      return TERRAIN_TYPES.WATER;
    }
    return TERRAIN_TYPES.GRASS;
  }

  /**
   * Cleans up event listeners on scene shutdown.
   */
  destroy() {
    this._unsubscribers.forEach((unsub) => unsub());
    this._unsubscribers = [];
    this.stop();
  }

  // --- Internal Helpers ---

  _subscribeEvents() {
    // Unsubscribe any previous listeners
    this._unsubscribers.forEach((unsub) => unsub());
    this._unsubscribers = [];

    // Listen for movement spatial broadcasts
    const unsubMove = eventBus.on(GAME_EVENTS.PLAYER_MOVED, (data) => {
      if (!data) return;
      this.onPlayerMoved(data.x, data.y, data.direction || this.lastDirection, true);
    });
    this._unsubscribers.push(unsubMove);

    // Listen for halt broadcasts to stop footsteps immediately
    const unsubStop = eventBus.on('playerStopped', () => {
      this.stop();
    });
    this._unsubscribers.push(unsubStop);
  }

  _resolveSoundKey(terrainType) {
    const variants = {
      [TERRAIN_TYPES.STONE]: 'footstep-stone',
      [TERRAIN_TYPES.WATER]: 'footstep-wet',
      [TERRAIN_TYPES.GRASS]: 'footstep-grass'
    };

    const preferred = variants[terrainType];
    if (preferred && this.scene?.cache?.audio?.exists(preferred)) {
      return preferred;
    }

    if (this.scene?.cache?.audio?.exists('sfx-footstep')) {
      return 'sfx-footstep';
    }

    return 'footstep';
  }

  _getDirectionalSprayAngle(direction) {
    switch (direction) {
      case 'up':
        // Moving up: dust puffs downward
        return { min: 70, max: 110 };
      case 'down':
        // Moving down: dust puffs upward
        return { min: 250, max: 290 };
      case 'left':
        // Moving left: dust puffs rightward
        return { min: 340, max: 20 };
      case 'right':
        // Moving right: dust puffs leftward
        return { min: 160, max: 200 };
      default:
        // Default upward cone
        return { min: FOOTSTEP_CONFIG.PARTICLE.ANGLE_MIN, max: FOOTSTEP_CONFIG.PARTICLE.ANGLE_MAX };
    }
  }

  _ensureDustTexture(scene) {
    if (!scene?.textures || scene.textures.exists('particle-dust')) return;

    if (scene.make?.graphics) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle-dust', 2, 2);
      g.destroy();
    }
  }
}

// Export singleton instance
export const footstepFeedback = new FootstepFeedback();
export default footstepFeedback;
