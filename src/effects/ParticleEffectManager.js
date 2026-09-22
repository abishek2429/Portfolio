/**
 * ParticleEffectManager - Ambient Atmosphere & Interactive Visual FX System
 * 
 * Dark Forest Portfolio Game
 * Handles ambient fireflies, pulsing biome glow auras, movement dust trails,
 * golden achievement bursts, and project interaction shimmers.
 * Automatically hooks into the centralized EventBus.
 */

import eventBus, {
  PROGRESS_EVENTS,
  PROJECT_EVENTS,
  GAME_EVENTS
} from '../events/EventBus.js';
import { zoneLayoutPlanner } from '../world/ZoneLayoutPlanner.js';
import CONFIG from '../config/GameConfig.js';

export const PARTICLE_CONFIGS = {
  firefly: {
    speed: { min: -30, max: 30 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0.2 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 3000,
    frequency: 50,
    maxParticles: 100,
    colors: [0xffff00, 0x00ff99],
    texture: 'particle-firefly',
    zones: ['foundation', 'aiml', 'summit']
  },

  zoneGlow: {
    foundation: { color: 0x4a90ff, radius: 120, intensity: 0.6, pulse: true },
    webdev: { color: 0x00d9ff, radius: 120, intensity: 0.6, pulse: true },
    aiml: { color: 0xb300ff, radius: 120, intensity: 0.6, pulse: true },
    mobile: { color: 0x00ff66, radius: 120, intensity: 0.6, pulse: true },
    summit: { color: 0xffd700, radius: 150, intensity: 0.8, pulse: true }
  },

  footstep: {
    speed: { min: 0, max: 20 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 500,
    maxParticles: 8,
    color: 0x888888,
    texture: 'particle-dust'
  },

  achievement: {
    speed: { min: -150, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0.3 },
    alpha: { start: 1, end: 0 },
    lifespan: 1000,
    maxParticles: 30,
    color: 0xffd700,
    texture: 'particle-star'
  },

  shimmer: {
    speed: 0,
    scale: { start: 0.5, end: 1.5 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 800,
    maxParticles: 15,
    color: 0x00d9ff,
    texture: 'particle-sparkle'
  }
};

export class ParticleEffectManager {
  constructor() {
    this.scene = null;
    this.emitters = new Map();
    this.glows = new Map();
    this.glowTweens = new Map();
    this.lastFootstepTime = 0;
    this.footstepThrottleMs = 150;
    this._eventUnsubscribers = [];
  }

  /**
   * Initializes particle textures, pools, and hooks into EventBus.
   * @param {Phaser.Scene} scene - Active Phaser scene
   */
  init(scene) {
    this.scene = scene;
    this._generateProceduralTextures();
    this._subscribeToEvents();
    this._initZoneGlows();
  }

  /**
   * Creates ambient floating fireflies in a specified biome.
   * @param {string} zoneId - Biome identifier ('foundation', 'aiml', 'summit')
   */
  createFireflies(zoneId) {
    if (!this.scene?.add?.particles) return null;

    const zone = zoneLayoutPlanner.getZoneLayout(zoneId);
    if (!zone) return null;

    const emitterKey = `firefly_${zoneId}`;
    if (this.emitters.has(emitterKey)) {
      return this.emitters.get(emitterKey);
    }

    const config = PARTICLE_CONFIGS.firefly;
    const color = zoneId === 'aiml' ? config.colors[1] : config.colors[0];

    const emitter = this.scene.add.particles(zone.center.x, zone.center.y, config.texture, {
      speed: config.speed,
      angle: config.angle,
      scale: config.scale,
      alpha: config.alpha,
      lifespan: config.lifespan,
      frequency: config.frequency,
      maxParticles: config.maxParticles,
      tint: color,
      blendMode: 'ADD',
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, zone.displayRadius || 120)
      }
    });

    this.emitters.set(emitterKey, emitter);
    return emitter;
  }

  /**
   * Creates a pulsing radial glow aura around a zone clearing.
   * @param {string} zoneId
   */
  createZoneGlow(zoneId) {
    if (!this.scene?.add?.graphics) return null;

    const zone = zoneLayoutPlanner.getZoneLayout(zoneId);
    const glowConfig = PARTICLE_CONFIGS.zoneGlow[zoneId];
    if (!zone || !glowConfig) return null;

    if (this.glows.has(zoneId)) {
      return this.glows.get(zoneId);
    }

    // Draw multi-layered atmospheric radial aura
    const glowGraphics = this.scene.add.graphics();
    glowGraphics.setPosition(zone.center.x, zone.center.y);

    const radius = glowConfig.radius || 120;
    const color = glowConfig.color || 0x4a90ff;

    glowGraphics.fillStyle(color, 0.15);
    glowGraphics.fillCircle(0, 0, radius);
    glowGraphics.fillStyle(color, 0.25);
    glowGraphics.fillCircle(0, 0, radius * 0.7);
    glowGraphics.fillStyle(color, 0.4);
    glowGraphics.fillCircle(0, 0, radius * 0.4);

    glowGraphics.setAlpha(glowConfig.intensity || 0.6);
    glowGraphics.setDepth(1); // Above ground tiles, below characters

    this.glows.set(zoneId, glowGraphics);

    if (glowConfig.pulse && this.scene.tweens) {
      this.pulseGlow(zoneId, 2000);
    }

    return glowGraphics;
  }

  /**
   * Emits walking dust particles behind the player.
   * @param {number} x
   * @param {number} y
   */
  emitFootsteps(x, y) {
    if (!this.scene?.add?.particles) return;

    const now = Date.now();
    if (now - this.lastFootstepTime < this.footstepThrottleMs) return;
    this.lastFootstepTime = now;

    const config = PARTICLE_CONFIGS.footstep;
    this.scene.add.particles(x, y + 12, config.texture, {
      speed: config.speed,
      angle: config.angle,
      scale: config.scale,
      alpha: config.alpha,
      lifespan: config.lifespan,
      tint: config.color,
      quantity: 2,
      stopAfter: 4
    });
  }

  /**
   * Emits a celebratory radial golden burst upon achievement unlock.
   * @param {number} x
   * @param {number} y
   */
  emitAchievementBurst(x = 600, y = 400) {
    if (!this.scene?.add?.particles) return;

    const config = PARTICLE_CONFIGS.achievement;
    this.scene.add.particles(x, y, config.texture, {
      speed: config.speed,
      angle: config.angle,
      scale: config.scale,
      alpha: config.alpha,
      lifespan: config.lifespan,
      tint: config.color,
      blendMode: 'ADD',
      quantity: config.maxParticles,
      stopAfter: config.maxParticles
    });
  }

  /**
   * Emits a cyan discovery shimmer effect at an interacted project landmark.
   * @param {number} x
   * @param {number} y
   */
  emitProjectShimmer(x, y) {
    if (!this.scene?.add?.particles) return;

    const config = PARTICLE_CONFIGS.shimmer;
    this.scene.add.particles(x, y, config.texture, {
      speed: config.speed,
      scale: config.scale,
      alpha: config.alpha,
      lifespan: config.lifespan,
      tint: config.color,
      blendMode: 'ADD',
      quantity: 8,
      stopAfter: 12
    });
  }

  /**
   * Dynamically adjusts glow alpha intensity for a zone.
   * @param {string} zoneId
   * @param {number} intensity - 0.0 to 1.0
   */
  setGlowIntensity(zoneId, intensity) {
    const glow = this.glows.get(zoneId);
    if (glow) {
      glow.setAlpha(Math.max(0, Math.min(1, intensity)));
    }
  }

  /**
   * Animates a smooth 2-second breathing pulse for a zone aura.
   * @param {string} zoneId
   * @param {number} [duration=2000]
   */
  pulseGlow(zoneId, duration = 2000) {
    const glow = this.glows.get(zoneId);
    if (!glow || !this.scene?.tweens) return;

    if (this.glowTweens.has(zoneId)) {
      this.glowTweens.get(zoneId).stop();
    }

    const tween = this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.8 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.glowTweens.set(zoneId, tween);
  }

  /**
   * Destroys all active emitters and cleans up glow auras.
   */
  cleanupParticles() {
    this.emitters.forEach(emitter => {
      try { emitter.destroy(); } catch (e) {}
    });
    this.emitters.clear();

    this.glowTweens.forEach(tween => {
      try { tween.stop(); } catch (e) {}
    });
    this.glowTweens.clear();

    this.glows.forEach(glow => {
      try { glow.destroy(); } catch (e) {}
    });
    this.glows.clear();

    this._eventUnsubscribers.forEach(unsub => unsub());
    this._eventUnsubscribers = [];
  }

  // --- Internal Initializers ---

  _initZoneGlows() {
    Object.keys(PARTICLE_CONFIGS.zoneGlow).forEach(zoneId => {
      this.createZoneGlow(zoneId);
    });

    PARTICLE_CONFIGS.firefly.zones.forEach(zoneId => {
      this.createFireflies(zoneId);
    });
  }

  _subscribeToEvents() {
    // Achievement burst trigger
    const unsubAch = eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, () => {
      const playerPos = CONFIG.GAME.PLAYER_START_X;
      this.emitAchievementBurst(playerPos, 400);
    });
    this._eventUnsubscribers.push(unsubAch);

    // Project discovery shimmer trigger
    const unsubProj = eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, ({ projectId }) => {
      const proj = CONFIG.getProject(projectId);
      if (proj) {
        this.emitProjectShimmer(proj.x, proj.y);
      }
    });
    this._eventUnsubscribers.push(unsubProj);

    // Movement dust trigger
    const unsubMove = eventBus.on(GAME_EVENTS.PLAYER_MOVED, ({ x, y }) => {
      this.emitFootsteps(x, y);
    });
    this._eventUnsubscribers.push(unsubMove);
  }

  _generateProceduralTextures() {
    if (!this.scene?.make?.graphics) return;

    // 1. Firefly (4x4 soft circle)
    if (!this.scene.textures.exists('particle-firefly')) {
      const g = this.scene.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(2, 2, 2);
      g.generateTexture('particle-firefly', 4, 4);
      g.destroy();
    }

    // 2. Dust (2x2 square)
    if (!this.scene.textures.exists('particle-dust')) {
      const g = this.scene.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle-dust', 2, 2);
      g.destroy();
    }

    // 3. Star (8x8 4-point star)
    if (!this.scene.textures.exists('particle-star')) {
      const g = this.scene.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(4, 0, 0, 4, 8, 4);
      g.fillTriangle(4, 8, 0, 4, 8, 4);
      g.generateTexture('particle-star', 8, 8);
      g.destroy();
    }

    // 4. Sparkle (6x6 cross)
    if (!this.scene.textures.exists('particle-sparkle')) {
      const g = this.scene.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 0, 2, 6);
      g.fillRect(0, 2, 6, 2);
      g.generateTexture('particle-sparkle', 6, 6);
      g.destroy();
    }
  }
}

export const particleEffectManager = new ParticleEffectManager();
export default particleEffectManager;
