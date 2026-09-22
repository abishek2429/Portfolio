/**
 * LightingManager - Dynamic 2D Lighting, Fog of War, & Night Mode System
 * 
 * Dark Forest Portfolio Game
 * Renders atmospheric ambient darkness, radial cutout light masks,
 * flickering campfire/temple beacons, player laptop glow, and discovery fog-of-war.
 */

import eventBus, {
  GAME_EVENTS,
  PROGRESS_EVENTS
} from '../events/EventBus.js';
import gameState from '../state/GameState.js';
import CONFIG from '../config/GameConfig.js';

export const LIGHT_CONFIGS = {
  campfire: {
    id: 'campfire',
    zone: 'foundation',
    x: 600,
    y: 720,
    radius: 200,
    baseIntensity: 1.0,
    color: 0xff8800,
    flickers: true
  },
  'cabin-windows': {
    id: 'cabin-windows',
    zone: 'webdev',
    x: 300,
    y: 380,
    radius: 180,
    baseIntensity: 0.8,
    color: 0xffff99,
    flickers: false
  },
  'temple-glow': {
    id: 'temple-glow',
    zone: 'aiml',
    x: 200,
    y: 180,
    radius: 200,
    baseIntensity: 0.9,
    color: 0xb300ff,
    flickers: true
  },
  'monument-glow': {
    id: 'monument-glow',
    zone: 'mobile',
    x: 900,
    y: 380,
    radius: 180,
    baseIntensity: 0.8,
    color: 0x00ff66,
    flickers: false
  },
  'peak-radiance': {
    id: 'peak-radiance',
    zone: 'summit',
    x: 600,
    y: 80,
    radius: 250,
    baseIntensity: 1.0,
    color: 0xffd700,
    flickers: false
  },
  'player-laptop': {
    id: 'player-laptop',
    zone: null,
    x: 600,
    y: 700,
    radius: 110,
    baseIntensity: 0.45,
    color: 0x4a90ff,
    flickers: false
  }
};

export class LightingManager {
  constructor() {
    this.scene = null;
    this.lights = new Map();
    this.ambientLevel = 0.7; // 70% darkness, 30% visibility
    this.discoveredZones = new Set();
    this.nightModeActive = false;

    this.darknessTexture = null;
    this.darknessImage = null;
    this.lightStamp = null;
    this.flickerTweens = new Map();
    this._unsubscribers = [];
  }

  /**
   * Initializes lighting layers, textures, and hooks into GameState and EventBus.
   * @param {Phaser.Scene} scene - Active Phaser scene
   */
  initialize(scene) {
    this.scene = scene;
    this.discoveredZones = new Set(gameState.zonesVisited || ['foundation']);

    this._createSoftRadialTexture();
    this._setupDarknessCanvas();
    this._registerDefaultLights();
    this._subscribeToEvents();

    this.renderLighting();
  }

  /**
   * Registers a point light source.
   * 
   * @param {Object} config - { id, x, y, radius, intensity, color, flickers, zone }
   * @returns {string} Light ID
   */
  createPointLight(config) {
    const lightId = config.id || `light_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const light = {
      id: lightId,
      x: config.x ?? 0,
      y: config.y ?? 0,
      radius: config.radius ?? 150,
      intensity: config.intensity ?? 0.8,
      baseIntensity: config.intensity ?? 0.8,
      color: config.color ?? 0xffffff,
      flickers: Boolean(config.flickers),
      zone: config.zone || null
    };

    this.lights.set(lightId, light);

    if (light.flickers && this.scene) {
      this.flickerLight(lightId);
    }

    return lightId;
  }

  /**
   * Adjusts global ambient darkness level.
   * @param {number} level - 0 (full daylight) to 1 (pitch black)
   */
  setAmbientDarkness(level) {
    this.ambientLevel = Math.max(0, Math.min(1, level));
    this.renderLighting();
  }

  /**
   * Updates brightness for a specific light source.
   * @param {string} lightId
   * @param {number} intensity - 0.0 to 1.0+
   */
  updateLightIntensity(lightId, intensity) {
    const light = this.lights.get(lightId);
    if (light) {
      light.intensity = Math.max(0, intensity);
      this.renderLighting();
    }
  }

  /**
   * Animates a soft organic flicker for fire or ethereal light sources.
   * @param {string} lightId
   * @param {number} [duration=120]
   */
  flickerLight(lightId, duration = 120) {
    const light = this.lights.get(lightId);
    if (!light || !this.scene?.tweens) return;

    if (this.flickerTweens.has(lightId)) {
      this.flickerTweens.get(lightId).stop();
    }

    const tween = this.scene.tweens.add({
      targets: light,
      intensity: {
        from: light.baseIntensity * 0.85,
        to: light.baseIntensity * 1.15
      },
      radius: {
        from: light.radius * 0.95,
        to: light.radius * 1.05
      },
      duration: duration + Math.floor(Math.random() * 80),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.flickerTweens.set(lightId, tween);
  }

  /**
   * Permanently illuminates a discovered zone clearing.
   * @param {string} zoneId
   */
  revealZone(zoneId) {
    if (!zoneId) return;
    this.discoveredZones.add(zoneId);

    // Boost point lights located in this zone
    for (const light of this.lights.values()) {
      if (light.zone === zoneId) {
        light.intensity = light.baseIntensity * (this.nightModeActive ? 1.2 : 1.0);
      }
    }

    this.renderLighting();
  }

  /**
   * Toggles the mysterious Night Mode easter egg aesthetic.
   * @param {boolean} enabled
   */
  setNightMode(enabled) {
    this.nightModeActive = Boolean(enabled);
    this.ambientLevel = this.nightModeActive ? 0.82 : 0.7;

    // Enhance point lights to cut through the darker midnight ambience
    for (const light of this.lights.values()) {
      const multiplier = this.nightModeActive ? 1.25 : 1.0;
      light.intensity = light.baseIntensity * multiplier;
    }

    this.renderLighting();
  }

  /**
   * Computes lighting brightness value (0-1) at any world pixel location.
   * @param {number} x
   * @param {number} y
   * @returns {number} Brightness factor between 0.0 and 1.0
   */
  getLightingAtPosition(x, y) {
    let totalIllumination = 1.0 - this.ambientLevel;

    for (const light of this.lights.values()) {
      const dist = Math.hypot(x - light.x, y - light.y);
      if (dist < light.radius) {
        const falloff = 1 - (dist / light.radius);
        totalIllumination += falloff * light.intensity * 0.8;
      }
    }

    return Math.min(1.0, Math.max(0.0, totalIllumination));
  }

  /**
   * Repositions the player's personal laptop screen glow.
   * @param {number} x
   * @param {number} y
   */
  updatePlayerLight(x, y) {
    const playerLight = this.lights.get('player-laptop');
    if (playerLight) {
      playerLight.x = x;
      playerLight.y = y;
      this.renderLighting();
    }
  }

  /**
   * Re-renders darkness canvas and cuts out radial light apertures.
   */
  renderLighting() {
    if (!this.darknessTexture || !this.lightStamp) return;

    // 1. Fill base darkness
    const baseColor = this.nightModeActive ? 0x070716 : 0x0c0d1e;
    this.darknessTexture.clear();
    this.darknessTexture.fill(baseColor, this.ambientLevel);

    // 2. Carve light apertures with ERASE blend mode
    for (const light of this.lights.values()) {
      // Check fog of war: undiscovered zones emit only faint glow
      let currentIntensity = light.intensity;
      if (light.zone && !this.discoveredZones.has(light.zone)) {
        currentIntensity *= 0.25;
      }

      if (currentIntensity <= 0) continue;

      const scale = (light.radius * 2) / 128; // 128 is procedural texture diameter
      this.lightStamp.setScale(scale);
      this.lightStamp.setAlpha(Math.min(1, currentIntensity));

      this.darknessTexture.draw(
        this.lightStamp,
        light.x,
        light.y
      );
    }
  }

  /**
   * Cleans up textures and tweens on scene restart.
   */
  cleanup() {
    this.flickerTweens.forEach(t => t.stop());
    this.flickerTweens.clear();
    this.lights.clear();

    this._unsubscribers.forEach(u => u());
    this._unsubscribers = [];

    if (this.darknessTexture) {
      this.darknessTexture.destroy();
      this.darknessTexture = null;
    }
    if (this.lightStamp) {
      this.lightStamp.destroy();
      this.lightStamp = null;
    }
  }

  // --- Internal Initializers ---

  _setupDarknessCanvas() {
    const width = CONFIG.GAME.CANVAS_WIDTH || 1200;
    const height = CONFIG.GAME.CANVAS_HEIGHT || 800;

    // High performance Phaser RenderTexture
    this.darknessTexture = this.scene.add.renderTexture(0, 0, width, height);
    this.darknessTexture.setOrigin(0, 0);
    this.darknessTexture.setDepth(10); // Placed above ground, landmarks, and sprites

    // Reusable stamp configured with ERASE blend mode
    this.lightStamp = this.scene.make.image({
      key: 'light-gradient',
      add: false
    });
    this.lightStamp.setBlendMode(Phaser.BlendModes.ERASE);
  }

  _registerDefaultLights() {
    Object.values(LIGHT_CONFIGS).forEach(cfg => {
      this.createPointLight(cfg);
    });
  }

  _subscribeToEvents() {
    // Zone entered -> reveal fog of war permanently
    const unsubZone = eventBus.on(GAME_EVENTS.ZONE_ENTERED, ({ zoneId }) => {
      this.revealZone(zoneId);
    });
    this._unsubscribers.push(unsubZone);

    // Player moved -> follow laptop light
    const unsubMove = eventBus.on(GAME_EVENTS.PLAYER_MOVED, ({ x, y }) => {
      this.updatePlayerLight(x, y);
    });
    this._unsubscribers.push(unsubMove);

    // Night Mode unlocked event
    const unsubNight = eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, () => {
      this.setNightMode(true);
    });
    this._unsubscribers.push(unsubNight);
  }

  _createSoftRadialTexture() {
    if (!this.scene?.textures || this.scene.textures.exists('light-gradient')) return;

    // Generate 128x128 circular feather mask for light stamps
    const canvas = this.scene.textures.createCanvas('light-gradient', 128, 128);
    const ctx = canvas.getContext();

    const radGrad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    radGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    radGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 128, 128);
    canvas.refresh();
  }
}

export const lightingManager = new LightingManager();
export default lightingManager;
