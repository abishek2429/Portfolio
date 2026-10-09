/**
 * GlowEffectManager - Zone Atmospheric Glow Aura & Pulsing Light System
 * 
 * Dark Forest Portfolio Game
 * Manages ethereal radial glow halos around zone clearings, continuous
 * sinusoidal pulsing, player proximity modulation, fog-of-war culling,
 * and night-mode luminescence scaling.
 */

import eventBus, { GAME_EVENTS, PROGRESS_EVENTS } from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import { zoneLayoutPlanner as defaultZonePlanner } from '../world/ZoneLayoutPlanner.js';

export const ZONE_GLOW_CONFIGS = {
  foundation: {
    zoneId: 'foundation',
    color: 0x4A90FF, // Ethereal Blue
    radius: 120,
    intensity: 0.6,
    pulse: true,
    center: { x: 600, y: 700 },
    depth: -1
  },
  webdev: {
    zoneId: 'webdev',
    color: 0x00D9FF, // Technical Cyan
    radius: 120,
    intensity: 0.6,
    pulse: true,
    center: { x: 300, y: 400 },
    depth: -1
  },
  aiml: {
    zoneId: 'aiml',
    color: 0xB300FF, // Mystical Purple
    radius: 120,
    intensity: 0.6,
    pulse: true,
    center: { x: 200, y: 200 },
    depth: -1
  },
  mobile: {
    zoneId: 'mobile',
    color: 0x00FF66, // Neon Emerald
    radius: 120,
    intensity: 0.6,
    pulse: true,
    center: { x: 900, y: 400 },
    depth: -1
  },
  summit: {
    zoneId: 'summit',
    color: 0xFFD700, // Radiant Celestial Gold
    radius: 150,
    intensity: 0.8, // Brighter, grander
    pulse: true,
    center: { x: 600, y: 100 },
    depth: -1
  }
};

export class GlowEffectManager {
  constructor(gameState = null, planner = null) {
    this.gameState = gameState || defaultGameState;
    this.planner = planner || defaultZonePlanner;
    this.scene = null;
    this.assetLoader = null;

    // Core data structures
    this.glows = new Map(); // zoneId -> glow sprite/graphic
    this.glowConfigs = new Map(); // zoneId -> config
    this.pulseAnimations = new Map(); // zoneId -> tween or GSAP animation
    this.proximityMap = new Map(); // zoneId -> current distance from player
    this.activeTweens = new Map(); // zoneId -> temporary highlight/fade tween
    this.baseIntensities = new Map(); // zoneId -> current base intensity

    // State modes
    this.fogOfWarEnabled = false;
    this.nightModeEnabled = false;

    // Event bus unsubscribers
    this._unsubscribers = [];

    // Pre-populate configs
    Object.entries(ZONE_GLOW_CONFIGS).forEach(([id, cfg]) => {
      this.glowConfigs.set(id, { ...cfg });
      this.baseIntensities.set(id, cfg.intensity);
    });
  }

  /**
   * Initializes the manager, builds glow sprites across all zones, and starts pulses.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [zoneLayoutPlanner] - Zone layout planner
   * @param {Object} [assetLoader] - Asset loader
   * @returns {GlowEffectManager}
   */
  create(scene, zoneLayoutPlanner = null, assetLoader = null) {
    this.scene = scene;
    if (zoneLayoutPlanner) this.planner = zoneLayoutPlanner;
    if (assetLoader) this.assetLoader = assetLoader;

    this.destroy(); // Clear any existing graphics/animations

    // Create glow for every zone defined in planner or defaults
    const zonesToCreate = this.planner?.getAllZones?.() || Object.values(ZONE_GLOW_CONFIGS);

    zonesToCreate.forEach(zone => {
      const zoneId = zone.id;
      const baseCfg = this.glowConfigs.get(zoneId) || {
        zoneId,
        color: zone.glowColor || 0xffffff,
        radius: zone.displayRadius || zone.radius || 120,
        intensity: zoneId === 'summit' ? 0.8 : 0.6,
        pulse: true,
        center: zone.center || { x: 0, y: 0 }
      };

      // Keep center synchronized with planner
      if (zone.center) {
        baseCfg.center = { ...zone.center };
      }

      this.createGlowForZone(zoneId, baseCfg);
    });

    this._attachEventListeners();

    // Sync initial fog of war if enabled
    if (this.fogOfWarEnabled) {
      this.updateFogOfWar(this.gameState?.zonesVisited || ['foundation']);
    }

    return this;
  }

  /**
   * Creates a radial glow aura sprite/graphic for a single zone.
   * 
   * @param {string} zoneId - Zone ID
   * @param {Object} [config] - Optional custom config overrides
   * @returns {Object} Glow sprite or graphics object
   */
  createGlowForZone(zoneId, config = null) {
    const cfg = {
      ...(this.glowConfigs.get(zoneId) || ZONE_GLOW_CONFIGS[zoneId] || {}),
      ...(config || {})
    };
    this.glowConfigs.set(zoneId, cfg);
    this.baseIntensities.set(zoneId, cfg.intensity || 0.6);

    const x = cfg.center?.x ?? 0;
    const y = cfg.center?.y ?? 0;
    const radius = cfg.radius || 120;
    const color = this.getZoneGlowColor(zoneId);

    let glowObj = null;

    if (this.scene?.add?.graphics) {
      const graphics = this.scene.add.graphics({ x, y });
      
      // Render below tilemap layers (depth -1 or 0)
      const depth = cfg.depth !== undefined ? cfg.depth : -1;
      graphics.setDepth(depth);

      // Draw multi-layered radial gradient approximation
      this._renderGlowGraphics(graphics, color, radius);

      // Blend mode: SCREEN or ADD
      if (typeof graphics.setBlendMode === 'function') {
        const blendMode = this.scene.blendModes?.SCREEN ?? 
                          (typeof Phaser !== 'undefined' ? Phaser.BlendModes.SCREEN : 2);
        try {
          graphics.setBlendMode(blendMode);
        } catch (_) {}
      }

      graphics.setAlpha(cfg.intensity);
      glowObj = graphics;
    } else {
      // Mock / headless object
      glowObj = {
        x,
        y,
        radius,
        color,
        alpha: cfg.intensity,
        visible: true,
        scaleX: 1,
        scaleY: 1,
        setAlpha: function(val) { this.alpha = val; return this; },
        setVisible: function(val) { this.visible = val; return this; },
        setScale: function(sx, sy) { this.scaleX = sx; this.scaleY = sy ?? sx; return this; },
        destroy: function() { this.destroyed = true; }
      };
    }

    this.glows.set(zoneId, glowObj);

    // Start sinusoidal pulse if enabled
    if (cfg.pulse !== false) {
      this._startPulseAnimation(zoneId, glowObj, cfg.intensity);
    }

    return glowObj;
  }

  /**
   * Renders concentric soft gradient discs on a Phaser Graphics object.
   * @private
   */
  _renderGlowGraphics(graphics, color, radius) {
    if (!graphics?.fillCircle) return;

    graphics.clear();
    const steps = 6;
    for (let i = steps; i >= 1; i--) {
      const r = (radius / steps) * i;
      // Exponential falloff for soft celestial aura
      const layerAlpha = Math.pow(1 - (i / (steps + 1)), 1.5) * 0.45;
      graphics.fillStyle(color, layerAlpha);
      graphics.fillCircle(0, 0, r);
    }
  }

  /**
   * Starts a continuous natural sinusoidal pulse animation (0.4 -> 0.8 -> 0.4 over 2000ms).
   * Supports GSAP or Phaser Tweens or fallback loop.
   * @private
   */
  _startPulseAnimation(zoneId, glowObj, targetBaseIntensity = 0.6) {
    this._stopPulseAnimation(zoneId);

    const minAlpha = Math.max(0.1, targetBaseIntensity - 0.2);
    const maxAlpha = Math.min(1.0, targetBaseIntensity + 0.2);

    // 1. Try GSAP if available in environment
    const gsapInstance = (typeof globalThis !== 'undefined' && globalThis.gsap) ||
                         (typeof window !== 'undefined' && window.gsap);

    if (gsapInstance && typeof gsapInstance.to === 'function') {
      const tween = gsapInstance.to(glowObj, {
        alpha: maxAlpha,
        duration: 1.0, // 1s up, 1s down = 2000ms full cycle
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        onUpdate: () => {
          if (glowObj.setAlpha && typeof glowObj.alpha === 'number') {
            glowObj.setAlpha(glowObj.alpha);
          }
        }
      });
      this.pulseAnimations.set(zoneId, tween);
      return;
    }

    // 2. Try Phaser Scene Tweens
    if (this.scene?.tweens?.add) {
      const tween = this.scene.tweens.add({
        targets: glowObj,
        alpha: { from: minAlpha, to: maxAlpha },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.pulseAnimations.set(zoneId, tween);
      return;
    }

    // 3. Headless/Mock pulse record
    this.pulseAnimations.set(zoneId, {
      active: true,
      minAlpha,
      maxAlpha,
      duration: 2000,
      stop: () => {}
    });
  }

  /**
   * Stops an active pulse animation for a specific zone.
   * @private
   */
  _stopPulseAnimation(zoneId) {
    const existing = this.pulseAnimations.get(zoneId);
    if (!existing) return;

    if (typeof existing.kill === 'function') {
      existing.kill(); // GSAP
    } else if (typeof existing.stop === 'function') {
      existing.stop(); // Phaser
    } else if (this.scene?.tweens?.remove) {
      this.scene.tweens.remove(existing);
    }
    this.pulseAnimations.delete(zoneId);
  }

  /**
   * Directly sets the base intensity for a zone and updates current alpha.
   * 
   * @param {string} zoneId - Zone ID
   * @param {number} intensity - Target intensity (0 to 1)
   */
  updateGlowIntensity(zoneId, intensity) {
    const clamped = Math.max(0, Math.min(1, intensity));
    this.baseIntensities.set(zoneId, clamped);
    this._applyGlowAlpha(zoneId, clamped);
  }

  /**
   * Applies alpha to the glow sprite/graphic without overwriting base intensity.
   * @private
   */
  _applyGlowAlpha(zoneId, alpha) {
    const glow = this.glows.get(zoneId);
    if (!glow) return;

    const clamped = Math.max(0, Math.min(1, alpha));
    if (typeof glow.setAlpha === 'function') {
      glow.setAlpha(clamped);
    } else {
      glow.alpha = clamped;
    }
  }

  /**
   * Custom one-shot or looping pulse animation on a zone.
   * 
   * @param {string} zoneId - Zone ID
   * @param {number} [duration=2000] - Duration in ms
   * @param {number} [minIntensity=0.4] - Minimum alpha
   * @param {number} [maxIntensity=0.8] - Maximum alpha
   * @returns {Promise<void>} Resolves when animation cycle completes
   */
  pulseGlow(zoneId, duration = 2000, minIntensity = 0.4, maxIntensity = 0.8) {
    const glow = this.glows.get(zoneId);
    if (!glow) return Promise.resolve();

    return new Promise((resolve) => {
      this._stopPulseAnimation(zoneId);
      const base = this.baseIntensities.get(zoneId) || 0.6;

      // GSAP path
      const gsapInstance = (typeof globalThis !== 'undefined' && globalThis.gsap) ||
                           (typeof window !== 'undefined' && window.gsap);

      if (gsapInstance && typeof gsapInstance.to === 'function') {
        const halfTime = (duration / 1000) / 2;
        gsapInstance.to(glow, {
          alpha: maxIntensity,
          duration: halfTime,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
          onComplete: () => {
            this._applyGlowAlpha(zoneId, base);
            resolve();
          }
        });
        return;
      }

      // Phaser tween path
      if (this.scene?.tweens?.add) {
        this.scene.tweens.add({
          targets: glow,
          alpha: { from: minIntensity, to: maxIntensity },
          duration: duration / 2,
          yoyo: true,
          repeat: 0,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this._applyGlowAlpha(zoneId, base);
            resolve();
          }
        });
        return;
      }

      // Headless / timer fallback
      this._applyGlowAlpha(zoneId, maxIntensity);
      setTimeout(() => {
        this._applyGlowAlpha(zoneId, base);
        resolve();
      }, 50);
    });
  }

  /**
   * Modifies the color of a zone's glow.
   * 
   * @param {string} zoneId - Zone ID
   * @param {number} color - Hex color code (e.g. 0x4A90FF)
   */
  setGlowColor(zoneId, color) {
    const cfg = this.glowConfigs.get(zoneId);
    if (cfg) {
      cfg.baseColor = color;
      cfg.color = color;
    }

    const glow = this.glows.get(zoneId);
    if (!glow) return;

    const displayColor = this.nightModeEnabled ? this._shiftColorForNight(color) : color;

    if (this.scene?.add?.graphics && typeof glow.clear === 'function') {
      const radius = cfg?.radius || 120;
      this._renderGlowGraphics(glow, displayColor, radius);
    } else {
      glow.color = displayColor;
    }
  }

  /**
   * Modulates glow intensity based on player distance.
   * - Proximity (<200px): up to +0.2 boost (max 0.8 / 1.0 for summit)
   * - Far (>300px): -0.2 dim (min 0.4 / 0.3)
   * 
   * @param {Object} playerPos - { x, y } coordinates
   */
  modifyGlowByProximity(playerPos) {
    if (!playerPos) return;

    const px = playerPos.x ?? playerPos.position?.x ?? 0;
    const py = playerPos.y ?? playerPos.position?.y ?? 0;

    this.glowConfigs.forEach((cfg, zoneId) => {
      const center = cfg.center || { x: 0, y: 0 };
      const dist = Math.hypot(px - center.x, py - center.y);
      this.proximityMap.set(zoneId, dist);

      // Do not alter alpha if hidden by fog of war
      const glow = this.glows.get(zoneId);
      if (glow && glow.visible === false) return;

      let base = this.baseIntensities.get(zoneId) || cfg.intensity || (zoneId === 'summit' ? 0.8 : 0.6);

      // Night mode +20% boost
      if (this.nightModeEnabled) {
        base = Math.min(1.0, base * 1.2);
      }

      let delta = 0;
      if (dist <= 50) {
        delta = 0.2;
      } else if (dist <= 200) {
        // Linear interpolation from +0.2 at 50px to 0 at 200px
        delta = 0.2 * (1 - ((dist - 50) / 150));
      } else if (dist >= 300) {
        delta = -0.2;
      } else {
        // Between 200px and 300px: linear interpolation from 0 to -0.2
        delta = -0.2 * ((dist - 200) / 100);
      }

      const targetIntensity = Math.max(0.3, Math.min(1.0, base + delta));
      this._applyGlowAlpha(zoneId, targetIntensity);
    });
  }

  /**
   * Temporarily spikes a zone's glow intensity (e.g. upon discovery or achievement).
   * Spikes to 0.9.
   * 
   * @param {string} zoneId - Zone ID
   * @param {number} [duration=1500] - Duration in ms
   */
  highlightZone(zoneId, duration = 1500) {
    const glow = this.glows.get(zoneId);
    if (!glow) return;

    const currentBase = this.baseIntensities.get(zoneId) || 0.6;
    const spikeAlpha = 0.9;

    if (this.scene?.tweens?.add) {
      this.scene.tweens.add({
        targets: glow,
        alpha: spikeAlpha,
        duration: 300,
        yoyo: true,
        hold: duration - 600,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this._applyGlowAlpha(zoneId, currentBase);
        }
      });
    } else {
      this._applyGlowAlpha(zoneId, spikeAlpha);
      setTimeout(() => {
        this._applyGlowAlpha(zoneId, currentBase);
      }, duration);
    }
  }

  /**
   * Fades a zone's glow intensity to dim (0.3).
   * 
   * @param {string} zoneId - Zone ID
   * @param {number} [duration=1000] - Duration in ms
   */
  dimZone(zoneId, duration = 1000) {
    const glow = this.glows.get(zoneId);
    if (!glow) return;

    if (this.scene?.tweens?.add) {
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.3,
        duration,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this._applyGlowAlpha(zoneId, 0.3);
        }
      });
    } else {
      this._applyGlowAlpha(zoneId, 0.3);
    }
  }

  /**
   * Enables or disables fog-of-war gating for zone glows.
   * When enabled, undiscovered zones have their glows hidden.
   * 
   * @param {boolean} enabled
   */
  enableFogOfWar(enabled) {
    this.fogOfWarEnabled = Boolean(enabled);
    const discovered = this.gameState?.zonesVisited || ['foundation'];
    this.updateFogOfWar(discovered);
  }

  /**
   * Synchronizes zone glow visibility with discovered zones list.
   * 
   * @param {Array<string>} discoveredZones - Array of discovered zone IDs
   */
  updateFogOfWar(discoveredZones = []) {
    const discoveredSet = new Set(discoveredZones || []);

    this.glows.forEach((glow, zoneId) => {
      const isDiscovered = discoveredSet.has(zoneId);

      if (!this.fogOfWarEnabled || isDiscovered) {
        if (glow.visible === false) {
          // Fade in newly discovered glow
          if (this.scene?.tweens?.add) {
            glow.setVisible(true);
            glow.setAlpha(0);
            this.scene.tweens.add({
              targets: glow,
              alpha: this.baseIntensities.get(zoneId) || 0.6,
              duration: 500,
              ease: 'Linear'
            });
          } else {
            if (typeof glow.setVisible === 'function') glow.setVisible(true);
            if (typeof glow.setAlpha === 'function') {
              glow.setAlpha(this.baseIntensities.get(zoneId) || 0.6);
            }
          }
        } else {
          if (typeof glow.setVisible === 'function') glow.setVisible(true);
        }
      } else {
        // Undiscovered in Fog of War -> hidden
        if (typeof glow.setVisible === 'function') glow.setVisible(false);
      }
    });
  }

  /**
   * Returns celestial gold glow color code for the Summit.
   * @returns {number} 0xFFD700
   */
  getSummitGlowColor() {
    return 0xFFD700;
  }

  /**
   * Resolves the current glow color for a zone, accounting for night mode.
   * 
   * @param {string} zoneId - Zone ID
   * @returns {number} Hex color code
   */
  getZoneGlowColor(zoneId) {
    const cfg = this.glowConfigs.get(zoneId);
    const rawColor = cfg?.baseColor ||
                     cfg?.color ||
                     ZONE_GLOW_CONFIGS[zoneId]?.color ||
                     this.planner?.getZoneGlowColor?.(zoneId) ||
                     0xffffff;

    if (this.nightModeEnabled) {
      return this._shiftColorForNight(rawColor);
    }

    return rawColor;
  }

  /**
   * Shifts color with subtle cool blue midnight tint during night mode.
   * @private
   */
  _shiftColorForNight(hexColor) {
    const r = (hexColor >> 16) & 0xff;
    const g = (hexColor >> 8) & 0xff;
    const b = hexColor & 0xff;

    const nr = Math.min(255, Math.round(r * 0.75 + 0x22 * 0.25));
    const ng = Math.min(255, Math.round(g * 0.85 + 0x44 * 0.15));
    const nb = Math.min(255, Math.round(b * 0.95 + 0xaa * 0.25));

    return (nr << 16) | (ng << 8) | nb;
  }

  /**
   * Toggles Easter Egg Night Mode atmospheric lighting.
   * When enabled, increases glow brightness by 20% and shifts hues.
   * 
   * @param {boolean} enabled
   */
  setNightMode(enabled) {
    this.nightModeEnabled = Boolean(enabled);

    // Refresh colors and pulse parameters
    this.glowConfigs.forEach((cfg, zoneId) => {
      const color = this.getZoneGlowColor(zoneId);
      const glow = this.glows.get(zoneId);

      if (glow) {
        if (this.scene?.add?.graphics && typeof glow.clear === 'function') {
          const radius = cfg?.radius || 120;
          this._renderGlowGraphics(glow, color, radius);
        } else {
          glow.color = color;
        }
      }

      let targetBase = cfg.intensity || (zoneId === 'summit' ? 0.8 : 0.6);
      if (this.nightModeEnabled) {
        targetBase = Math.min(1.0, targetBase * 1.2);
      }
      this.baseIntensities.set(zoneId, targetBase);

      if (glow && cfg.pulse !== false) {
        this._startPulseAnimation(zoneId, glow, targetBase);
      }
    });
  }

  /**
   * Returns the Phaser sprite or graphics object for direct manipulation.
   * 
   * @param {string} zoneId - Zone ID
   * @returns {Object|null}
   */
  getGlowSprite(zoneId) {
    return this.glows.get(zoneId) || null;
  }

  /**
   * Per-frame update hook.
   * Modulates proximity intensities and maintains fog of war.
   * 
   * @param {Object} [playerPos] - Optional player coordinates { x, y }
   */
  update(playerPos = null) {
    const pos = playerPos || this.gameState?.playerPosition;
    if (pos) {
      this.modifyGlowByProximity(pos);
    }
  }

  /**
   * Hooks into EventBus for dynamic gameplay highlights.
   * @private
   */
  _attachEventListeners() {
    // 1. Highlight newly discovered zone
    const unsubDiscover = eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, (payload) => {
      if (payload?.zoneId) {
        this.highlightZone(payload.zoneId, 2000);
        if (this.fogOfWarEnabled) {
          this.updateFogOfWar(this.gameState?.zonesVisited || []);
        }
      }
    });

    // 2. Highlight on zone entry
    const unsubEnter = eventBus.on(GAME_EVENTS.ZONE_ENTERED, (payload) => {
      if (payload?.zoneId) {
        this.highlightZone(payload.zoneId, 1200);
      }
    });

    // 3. Highlight on zone name marquee
    const unsubMarquee = eventBus.on(GAME_EVENTS.ZONE_NAME_DISPLAYED, () => {
      const current = this.gameState?.currentZone;
      if (current) {
        this.highlightZone(current, 1000);
      }
    });

    // 4. Night mode unlock reaction
    const unsubNight = eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, () => {
      this.setNightMode(true);
    });

    this._unsubscribers = [
      unsubDiscover,
      unsubEnter,
      unsubMarquee,
      unsubNight
    ];
  }

  /**
   * Clean up all animations and graphics.
   */
  destroy() {
    // Stop all pulse animations
    this.pulseAnimations.forEach((tween, zoneId) => {
      this._stopPulseAnimation(zoneId);
    });
    this.pulseAnimations.clear();

    // Destroy graphics / sprites
    this.glows.forEach((glow) => {
      if (typeof glow.destroy === 'function') {
        glow.destroy();
      }
    });
    this.glows.clear();

    // Detach event listeners
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }
}

// Export singleton instance
export const glowEffectManager = new GlowEffectManager();
export default glowEffectManager;
