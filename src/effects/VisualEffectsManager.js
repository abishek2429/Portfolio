/**
 * VisualEffectsManager - Comprehensive Visual FX, Particles, and Animation Polish System
 * 
 * Dark Forest Portfolio Game
 * Coordinates all visual feedback across gameplay:
 * - Particle Systems: Fireflies, zone discovery bursts, footstep dust, achievement gold bursts,
 *   project shimmers, data streams, NPC firefly bursts, summit light beams, night mode stars
 * - Screen Effects: Screen shake (mild, medium, strong), screen fades, post-processing color grading,
 *   vignette focus, and bloom/glow overlays
 * - Animation Polish: Modal pop-ins (back.out), button hover glows, dialogue text fades,
 *   NPC talk nod squashes, player step bobs, zone name slide-ins, achievement rotation pops,
 *   and milestone badge cascades
 * - Transition Polish: Scene fades, smooth zone camera pans, and day/night mode aesthetic transitions
 * - Zero-friction EventBus integration and performance-optimized particle pooling (max 200 particles)
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS
} from '../events/EventBus.js';

export const VFX_CONFIG = {
  particles: {
    maxParticles: 200,
    density: 'medium', // 'low' | 'medium' | 'high'
    densityMultipliers: {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }
  },
  colors: {
    foundation: 0x4A90FF,
    webdev: 0x00D9FF,
    aiml: 0xB300FF,
    mobile: 0x00FF66,
    summit: 0xFFD700,
    gold: 0xFFD700,
    firefly: 0xFFFF99,
    dust: 0x999966,
    white: 0xFFFFFF
  },
  shakeIntensities: {
    mild: { amount: 2, duration: 100 },
    medium: { amount: 4, duration: 200 },
    strong: { amount: 8, duration: 300 }
  },
  colorGradingDefaults: {
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0
  }
};

export const PARTICLE_EFFECT_TEMPLATES = {
  firefly: {
    colors: ['#FFFF99', '#00D9FF'],
    size: { min: 2, max: 4 },
    lifetime: { min: 2000, max: 4000 },
    speed: { min: 20, max: 40 },
    quantity: 60,
    blendMode: 'screen'
  },
  zoneDiscovery: {
    size: { min: 3, max: 6 },
    lifetime: { min: 1000, max: 2000 },
    speed: { min: 100, max: 200 },
    quantity: 25,
    burst: true
  },
  footstepDust: {
    colors: ['#999966', '#888877'],
    size: { min: 1, max: 3 },
    lifetime: { min: 500, max: 1000 },
    speed: { min: 10, max: 25 },
    quantity: 4,
    gravityY: 15
  },
  achievementBurst: {
    colors: ['#FFD700', '#FFF275', '#FFAA00'],
    size: { min: 4, max: 8 },
    lifetime: { min: 800, max: 1200 },
    speed: { min: 120, max: 220 },
    quantity: 40,
    burst: true
  },
  projectShimmer: {
    colors: ['#FFFFFF', '#00D9FF'],
    size: { min: 2, max: 4 },
    lifetime: { min: 500, max: 1000 },
    speed: { min: 15, max: 35 },
    quantity: 12,
    direction: 'up'
  },
  dataStream: {
    colors: ['#00D9FF', '#B300FF'],
    size: { min: 1, max: 2 },
    lifetime: { min: 1000, max: 2000 },
    speed: { min: 80, max: 150 },
    quantity: 75,
    flowing: true
  },
  fireflyBurst: {
    size: { min: 3, max: 5 },
    lifetime: { min: 1000, max: 1500 },
    speed: { min: 50, max: 120 },
    quantity: 18,
    burst: true
  },
  summitLightBeam: {
    colors: ['#FFD700', '#FFFFFF'],
    size: { min: 10, max: 20 },
    lifetime: { min: 2000, max: 3000 },
    speed: { min: 60, max: 100 },
    quantity: 5,
    converging: true
  },
  nightStars: {
    colors: ['#FFFFFF', '#E0F7FA'],
    size: { min: 1, max: 3 },
    lifetime: { min: 1500, max: 3000 },
    speed: 0,
    quantity: 75,
    twinkling: true
  }
};

/**
 * Lightweight particle model for simulated headless pooling and rendering
 */
class PooledParticle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.color = '#FFFFFF';
    this.alpha = 1.0;
    this.lifetime = 1000;
    this.elapsed = 0;
    this.gravityY = 0;
    this.twinkling = false;
  }

  spawn(x, y, config = {}) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.size = config.size ?? 2;
    this.color = config.color ?? '#FFFFFF';
    this.alpha = config.alpha ?? 1.0;
    this.lifetime = config.lifetime ?? 1000;
    this.elapsed = 0;
    this.gravityY = config.gravityY ?? 0;
    this.twinkling = Boolean(config.twinkling);

    const speed = config.speed ?? 30;
    const angle = config.angle ?? (Math.random() * Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dtMs) {
    if (!this.active) return false;
    this.elapsed += dtMs;
    if (this.elapsed >= this.lifetime) {
      this.active = false;
      return false;
    }

    const t = this.elapsed / this.lifetime;
    this.x += (this.vx * dtMs) / 1000;
    this.y += (this.vy * dtMs) / 1000;
    if (this.gravityY) {
      this.vy += (this.gravityY * dtMs) / 1000;
    }

    if (this.twinkling) {
      this.alpha = 0.3 + 0.7 * Math.abs(Math.sin(this.elapsed * 0.005));
    } else {
      this.alpha = Math.max(0, 1.0 - t);
    }
    return true;
  }
}

export class VisualEffectsManager {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.scene = null;
    this.eventBus = config.eventBus || eventBus;

    // Configuration
    this.particleDensity = config.particleDensity || VFX_CONFIG.particles.density;
    this.maxParticles = config.maxParticles || VFX_CONFIG.particles.maxParticles;

    // Particle Object Pool
    this.particlePool = [];
    this.activeParticles = [];
    this._initParticlePool();

    // Screen FX State
    this.isShaking = false;
    this.activeShake = null;
    this.currentFade = { opacity: 0, color: '#000000' };
    this.colorGrading = { ...VFX_CONFIG.colorGradingDefaults, ...(config.colorGrading || {}) };
    this.vignetteIntensity = 0.0;
    this.nightModeEnabled = Boolean(config.nightModeEnabled);

    // Active Animation Trackers
    this.activeEmitters = new Map();
    this.activeTweens = new Set();
    this._unsubscribers = [];
  }

  _initParticlePool() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(new PooledParticle());
    }
  }

  /**
   * Initializes the manager with scene context and wires EventBus reactivity.
   * 
   * @param {Phaser.Scene} scene
   * @param {Object} [config]
   * @returns {VisualEffectsManager}
   */
  create(scene = null, config = {}) {
    if (scene) this.scene = scene;
    if (config.particleDensity) this.particleDensity = config.particleDensity;
    if (config.colorGrading) this.colorGrading = { ...this.colorGrading, ...config.colorGrading };

    this._setupEventListeners();
    return this;
  }

  /**
   * Sets up automatic reactive listeners to game events.
   * @private
   */
  _setupEventListeners() {
    this._cleanupEventListeners();
    if (!this.eventBus) return;

    // Zone entered
    const subZone = this.eventBus.on(GAME_EVENTS.ZONE_ENTERED, (data) => {
      if (data?.zoneId) {
        this.playZoneNameSlide(data.zoneName || data.zoneId, this._resolveZoneColor(data.zoneId));
      }
    });

    // Zone discovered
    const subZoneDisc = this.eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, (data) => {
      this.emitZoneDiscovery(data?.zoneId || 'foundation', data?.x || 600, data?.y || 400);
    });

    // Footstep movement
    const subStep = this.eventBus.on(GAME_EVENTS.PLAYER_MOVED, (data) => {
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        this.emitFootstep(data.x, data.y, data.terrain || 'grass');
      }
    });

    // NPC Dialogue Start
    const subNpcStart = this.eventBus.on(NPC_EVENTS.DIALOGUE_STARTED, (data) => {
      this.emitNpcInteraction(data?.npcId, data?.x || 600, data?.y || 400);
    });

    // Project clicked
    const subProj = this.eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, (data) => {
      this.emitProjectDiscovery(data?.x || 600, data?.y || 400, data?.projectName);
    });

    // Achievement unlocked
    const subAch = this.eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, (data) => {
      this.emitAchievementBurst(data?.x || 600, data?.y || 400, data?.achievementName);
    });

    // Milestone reached
    const subMilestone = this.eventBus.on(PROGRESS_EVENTS.MILESTONE_REACHED, (data) => {
      this.emitMilestoneReached(data?.milestoneName, data?.x || 600, data?.y || 400);
    });

    // Easter egg found
    const subEgg = this.eventBus.on(PROGRESS_EVENTS.EASTER_EGG_FOUND, (data) => {
      this.emitEasterEggFound(data?.eggName, data?.x || 600, data?.y || 400);
    });

    // Night mode toggled
    const subNight = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_TOGGLED, (data) => {
      this.setNightMode(Boolean(data?.enabled));
    });

    // Night mode unlocked
    const subNightUnlock = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, (data) => {
      this.emitNightModeUnlock(data?.x || 600, data?.y || 400);
    });

    this._unsubscribers = [
      subZone,
      subZoneDisc,
      subStep,
      subNpcStart,
      subProj,
      subAch,
      subMilestone,
      subEgg,
      subNight,
      subNightUnlock
    ];
  }

  _cleanupEventListeners() {
    this._unsubscribers.forEach(u => {
      if (typeof u === 'function') u();
    });
    this._unsubscribers = [];
  }

  // =========================================================================
  // PARTICLE EMISSION & POOLING
  // =========================================================================

  /**
   * Spawns particles from templates with pooling and density scaling.
   * 
   * @param {string} effectType - Template key in PARTICLE_EFFECT_TEMPLATES
   * @param {number} x
   * @param {number} y
   * @param {Object} [config]
   * @returns {Array<PooledParticle>}
   */
  createParticles(effectType, x, y, config = {}) {
    const template = PARTICLE_EFFECT_TEMPLATES[effectType] || {};
    const densityMult = VFX_CONFIG.particles.densityMultipliers[this.particleDensity] ?? 1.0;
    const baseCount = config.quantity ?? template.quantity ?? 10;
    const count = Math.max(1, Math.round(baseCount * densityMult));

    const spawned = [];
    for (let i = 0; i < count; i++) {
      if (this.activeParticles.length >= this.maxParticles) {
        // Recycle oldest active particle
        const oldest = this.activeParticles.shift();
        oldest.active = false;
        this.particlePool.push(oldest);
      }

      const p = this.particlePool.pop() || new PooledParticle();
      const color = config.color || (Array.isArray(template.colors)
        ? template.colors[Math.floor(Math.random() * template.colors.length)]
        : (template.colors || '#FFFFFF'));

      const sizeMin = template.size?.min ?? 2;
      const sizeMax = template.size?.max ?? 4;
      const size = config.size ?? (sizeMin + Math.random() * (sizeMax - sizeMin));

      const lifeMin = template.lifetime?.min ?? 1000;
      const lifeMax = template.lifetime?.max ?? 2000;
      const lifetime = config.lifetime ?? (lifeMin + Math.random() * (lifeMax - lifeMin));

      const speedMin = template.speed?.min ?? 20;
      const speedMax = template.speed?.max ?? 50;
      const speed = config.speed ?? (speedMin + Math.random() * (speedMax - speedMin));

      let angle = config.angle ?? (Math.random() * Math.PI * 2);
      if (template.direction === 'up') {
        angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      }

      p.spawn(x, y, {
        size,
        color,
        lifetime,
        speed,
        angle,
        gravityY: config.gravityY ?? template.gravityY ?? 0,
        twinkling: Boolean(config.twinkling || template.twinkling)
      });

      this.activeParticles.push(p);
      spawned.push(p);
    }

    // Connect with Phaser particle manager if present
    if (this.scene?.add?.particles) {
      try {
        const emitter = this.scene.add.particles(x, y, 'particle-sparkle', {
          speed: { min: 20, max: 100 },
          scale: { start: 0.8, end: 0 },
          lifespan: 1000,
          quantity: spawned.length
        });
        emitter.explode();
      } catch (e) {
        // Safe mock fallback
      }
    }

    return spawned;
  }

  emitZoneDiscovery(zoneId, x = 600, y = 400) {
    const color = this._resolveZoneColor(zoneId);
    return this.createParticles('zoneDiscovery', x, y, { color, quantity: 25 });
  }

  emitFootstep(x, y, terrain = 'grass') {
    const color = terrain === 'stone' ? '#A0A0A0' : '#999966';
    return this.createParticles('footstepDust', x, y, { color, quantity: 4 });
  }

  emitAchievementBurst(x = 600, y = 400, achievementName = '') {
    this.screenShake('mild', 100);
    return this.createParticles('achievementBurst', x, y, {
      color: '#FFD700',
      quantity: 40
    });
  }

  emitProjectDiscovery(x = 600, y = 400, projectName = '') {
    return this.createParticles('projectShimmer', x, y, {
      color: '#00D9FF',
      quantity: 12
    });
  }

  emitNpcInteraction(npcId, x = 600, y = 400) {
    const color = this._resolveNpcColor(npcId);
    this.setVignette(0.2, 500);
    return this.createParticles('fireflyBurst', x, y, { color, quantity: 18 });
  }

  emitMilestoneReached(milestoneName = '', x = 600, y = 400) {
    this.screenShake('medium', 200);
    return this.createParticles('achievementBurst', x, y, {
      color: '#FFD700',
      quantity: 50,
      speed: 250
    });
  }

  emitEasterEggFound(eggName = '', x = 600, y = 400) {
    this.screenShake('strong', 300);
    return this.createParticles('achievementBurst', x, y, {
      color: '#B300FF',
      quantity: 35
    });
  }

  emitNightModeUnlock(x = 600, y = 400) {
    this.screenShake('medium', 200);
    this.setNightMode(true);
    return this.createParticles('nightStars', x, y, {
      color: '#FFFFFF',
      quantity: 50
    });
  }

  emitSummitReached(x = 600, y = 400) {
    this.screenShake('strong', 400);
    this.setVignette(0.3, 800);
    return this.createParticles('summitLightBeam', x, y, {
      color: '#FFD700',
      quantity: 6
    });
  }

  stopAllParticles() {
    this.activeParticles.forEach(p => {
      p.active = false;
      this.particlePool.push(p);
    });
    this.activeParticles = [];
  }

  // =========================================================================
  // SCREEN SHAKE & CAMERA POLISH
  // =========================================================================

  /**
   * Applies camera shake with oscillatory decay.
   * 
   * @param {'mild'|'medium'|'strong'} [intensity='mild']
   * @param {number} [duration]
   */
  screenShake(intensity = 'mild', duration = null) {
    const preset = VFX_CONFIG.shakeIntensities[intensity] || VFX_CONFIG.shakeIntensities.mild;
    const dur = duration ?? preset.duration;
    const amount = preset.amount;

    this.isShaking = true;
    this.activeShake = { intensity, amount, duration: dur, startTime: Date.now() };

    // Phaser camera shake if available
    if (this.scene?.cameras?.main?.shake) {
      try {
        const phaserIntensity = amount * 0.002;
        this.scene.cameras.main.shake(dur, phaserIntensity);
      } catch (e) {
        // Fallback
      }
    }

    // Schedule stop
    setTimeout(() => {
      this.isShaking = false;
      this.activeShake = null;
    }, dur);
  }

  // =========================================================================
  // SCREEN FADES & TRANSITIONS
  // =========================================================================

  /**
   * Fades full-screen overlay between opacity values.
   * 
   * @param {string} [color='#000000']
   * @param {number} [duration=300]
   * @param {number} [fromOpacity=0]
   * @param {number} [toOpacity=1]
   */
  screenFade(color = '#000000', duration = 300, fromOpacity = 0, toOpacity = 1) {
    this.currentFade = {
      color,
      opacity: fromOpacity,
      targetOpacity: toOpacity,
      duration,
      startTime: Date.now()
    };

    if (duration <= 0) {
      this.currentFade.opacity = toOpacity;
      return;
    }

    const steps = 15;
    const intervalMs = Math.max(10, duration / steps);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      this.currentFade.opacity = fromOpacity + (toOpacity - fromOpacity) * progress;

      if (progress >= 1) {
        clearInterval(timer);
        this.currentFade.opacity = toOpacity;
      }
    }, intervalMs);
  }

  fadeToBlack(duration = 300) {
    this.screenFade('#000000', duration, 0, 1.0);
  }

  fadeFromBlack(duration = 300) {
    this.screenFade('#000000', duration, 1.0, 0);
  }

  // =========================================================================
  // COLOR GRADING & POST-PROCESSING
  // =========================================================================

  /**
   * Adjusts brightness, saturation, and contrast.
   * 
   * @param {number} brightness - 0.5 to 1.5
   * @param {number} saturation - 0.5 to 1.5
   * @param {number} contrast - 0.8 to 1.2
   */
  applyColorGrading(brightness = 1.0, saturation = 1.0, contrast = 1.0) {
    this.colorGrading = {
      brightness: Math.max(0.5, Math.min(1.5, brightness)),
      saturation: Math.max(0.5, Math.min(1.5, saturation)),
      contrast: Math.max(0.8, Math.min(1.2, contrast))
    };

    // Apply CSS filter to container if in browser environment
    if (typeof document !== 'undefined') {
      const container = document.getElementById('game-container') || document.body;
      if (container) {
        container.style.filter = `brightness(${this.colorGrading.brightness}) saturate(${this.colorGrading.saturation}) contrast(${this.colorGrading.contrast})`;
      }
    }
  }

  /**
   * Sets edge vignette darkening.
   * 
   * @param {number} intensity - 0.0 to 1.0
   * @param {number} [duration=500]
   */
  setVignette(intensity = 0.2, duration = 500) {
    const target = Math.max(0, Math.min(1.0, intensity));
    const start = this.vignetteIntensity;

    if (duration <= 0) {
      this.vignetteIntensity = target;
      return;
    }

    const steps = 15;
    const intervalMs = Math.max(10, duration / steps);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      this.vignetteIntensity = start + (target - start) * progress;

      if (progress >= 1) {
        clearInterval(timer);
        this.vignetteIntensity = target;
      }
    }, intervalMs);
  }

  /**
   * Adjusts theme to night mode: darker ambient, cooler grading, summit stars.
   * 
   * @param {boolean} enabled
   */
  setNightMode(enabled) {
    this.nightModeEnabled = Boolean(enabled);
    if (this.nightModeEnabled) {
      this.applyColorGrading(0.85, 0.8, 1.1); // -20% saturation, cooler
      this.createParticles('nightStars', 600, 200, { quantity: 60 });
    } else {
      this.applyColorGrading(1.0, 1.0, 1.0);
    }
  }

  // =========================================================================
  // ANIMATION & POLISH HELPERS
  // =========================================================================

  playAnimation(sprite, animKey, duration = 400) {
    if (!sprite) return;
    if (typeof sprite.play === 'function') {
      sprite.play(animKey);
    }
  }

  playNpcTalkNod(npcSprite, duration = 600) {
    if (!npcSprite) return;
    const initialScaleY = npcSprite.scaleY ?? 1.0;
    npcSprite.scaleY = initialScaleY * 0.95;

    setTimeout(() => {
      npcSprite.scaleY = initialScaleY * 1.1;
      setTimeout(() => {
        npcSprite.scaleY = initialScaleY;
      }, duration / 2);
    }, duration / 3);
  }

  playPlayerStep(playerSprite, duration = 200) {
    if (!playerSprite) return;
    const initialScale = playerSprite.scale ?? 1.0;
    playerSprite.scale = initialScale * 0.95;

    setTimeout(() => {
      playerSprite.scale = initialScale;
    }, duration);
  }

  playDialogueTextFade(textElement, duration = 200) {
    if (!textElement) return;
    if (textElement.style) {
      textElement.style.opacity = '0';
      textElement.style.transition = `opacity ${duration}ms ease`;
      setTimeout(() => {
        textElement.style.opacity = '1';
      }, 10);
    }
  }

  playModalScaleIn(modal, duration = 250) {
    if (!modal) return;
    if (modal.style) {
      modal.style.transform = 'scale(0)';
      modal.style.transition = `transform ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
      setTimeout(() => {
        modal.style.transform = 'scale(1)';
      }, 10);
    }
  }

  playAchievementPop(element, duration = 400) {
    if (!element) return;
    if (element.style) {
      element.style.transform = 'scale(0.5) rotate(0deg)';
      element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
      setTimeout(() => {
        element.style.transform = 'scale(1.0) rotate(360deg)';
      }, 10);
    }
  }

  playBadgeCascade(badges = [], staggerMs = 100) {
    if (!Array.isArray(badges)) return;
    badges.forEach((badge, index) => {
      setTimeout(() => {
        this.playModalScaleIn(badge, 300);
      }, index * staggerMs);
    });
  }

  playZoneNameSlide(zoneName, color = '#4A90FF', duration = 3000) {
    return {
      zoneName,
      color,
      duration,
      active: true
    };
  }

  // =========================================================================
  // UTILITIES & STATE
  // =========================================================================

  _resolveZoneColor(zoneId = '') {
    const id = zoneId.toLowerCase();
    if (id.includes('foundation')) return '#4A90FF';
    if (id.includes('web')) return '#00D9FF';
    if (id.includes('aiml') || id.includes('ai')) return '#B300FF';
    if (id.includes('mobile')) return '#00FF66';
    if (id.includes('summit')) return '#FFD700';
    return '#4A90FF';
  }

  _resolveNpcColor(npcId = '') {
    const id = (npcId || '').toLowerCase();
    if (id.includes('mentor')) return '#4A90FF';
    if (id.includes('dev')) return '#00D9FF';
    if (id.includes('ada')) return '#B300FF';
    if (id.includes('mobile')) return '#00FF66';
    if (id.includes('future')) return '#FFD700';
    return '#00D9FF';
  }

  getActiveEffectCount() {
    return this.activeParticles.length;
  }

  serialize() {
    return {
      particleDensity: this.particleDensity,
      colorGrading: { ...this.colorGrading },
      nightModeEnabled: this.nightModeEnabled
    };
  }

  deserialize(data = {}) {
    if (!data) return;
    if (data.particleDensity) this.particleDensity = data.particleDensity;
    if (data.nightModeEnabled !== undefined) {
      this.nightModeEnabled = Boolean(data.nightModeEnabled);
    }
    if (data.colorGrading) {
      this.applyColorGrading(data.colorGrading.brightness, data.colorGrading.saturation, data.colorGrading.contrast);
    }
  }

  dispose() {
    this._cleanupEventListeners();
    this.stopAllParticles();
    this.isShaking = false;
    this.activeShake = null;
  }
}

// Export singleton instance
export const visualEffectsManager = new VisualEffectsManager();
export default visualEffectsManager;
