/**
 * NightModeManager - Dynamic Night Mode Visual Theme System
 * 
 * Dark Forest Portfolio Game
 * Transforms the visual aesthetics of the world into a midnight ethereal landscape:
 * - Increases atmospheric darkness (0.3 -> 0.6)
 * - Boosts zone luminescence and point light intensities
 * - Shifts palette cooler (R -20%, G -10%, B +10%)
 * - Crossfades background ambience to an ethereal orchestral arrangement
 * - Persists player theme preferences across sessions
 * 
 * Unlocked by discovering the "Night Mode Portal" easter egg (Prompt 42).
 */

import eventBus, {
  GAME_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS
} from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import defaultLightingManager from '../lighting/LightingManager.js';
import defaultGlowManager from './GlowEffectManager.js';
import defaultParticleManager from './ParticleEffectManager.js';

export const STORAGE_KEY_NIGHT_MODE = 'dark_forest_night_mode_enabled';

export const NIGHT_MODE_THEMES = {
  DAY: {
    id: 'day',
    name: 'Twilight Dusk (Day Mode)',
    ambientDarkness: 0.3,
    glowIntensity: 0.6,
    glowPulseRange: { min: 0.4, max: 0.8 },
    glowBlur: 0.0,
    pointLightMultiplier: 1.0,
    fireflyBrightness: 1.0,
    dataStreamBrightness: 1.0,
    music: 'ambient-forest',
    musicVolume: 0.7,
    orchestralVolume: 0.0,
    fogVisibility: 1.0,
    uiBackground: 'rgba(20, 26, 46, 0.95)',
    description: 'Mysterious, safe forest at twilight'
  },
  NIGHT: {
    id: 'night',
    name: 'Midnight Ethereal (Night Mode)',
    ambientDarkness: 0.6,
    glowIntensity: 0.9,
    glowPulseRange: { min: 0.6, max: 1.0 },
    glowBlur: 0.1, // +10% softer edges
    pointLightMultiplier: 1.2, // +20%
    fireflyBrightness: 1.3, // +30%
    dataStreamBrightness: 1.15, // +15%
    music: 'ambient-forest-night',
    musicVolume: 0.63, // -10% base
    orchestralVolume: 0.3, // +30%
    fogVisibility: 1.1, // +10%
    uiBackground: 'rgba(10, 10, 20, 0.98)',
    description: 'Transcendent, ethereal, spiritual night'
  }
};

export const COLOR_LOOKUP_TABLE = {
  day: {
    0x4A90FF: 0x2E7FFF, // Foundation blue -> Darker ethereal blue
    0x00D9FF: 0x00B8FF, // Web Dev cyan -> Deeper cyan
    0xB300FF: 0x9D00FF, // AI & ML purple -> Richer purple
    0x00FF66: 0x00DD44, // Mobile green -> Darker green
    0xFFD700: 0xFFD700  // Summit gold -> Stays bright to pop
  },
  night: {
    0x2E7FFF: 0x4A90FF,
    0x00B8FF: 0x00D9FF,
    0x9D00FF: 0xB300FF,
    0x00DD44: 0x00FF66,
    0xFFD700: 0xFFD700
  }
};

/**
 * Converts a hex color into its cooler night-mode counterpart.
 * @param {number} hexColor
 * @returns {number}
 */
export function shiftColorToNight(hexColor) {
  if (COLOR_LOOKUP_TABLE.day[hexColor] !== undefined) {
    return COLOR_LOOKUP_TABLE.day[hexColor];
  }
  const r = (hexColor >> 16) & 0xFF;
  const g = (hexColor >> 8) & 0xFF;
  const b = hexColor & 0xFF;
  // Red -20%, Green -10%, Blue +10%
  const newR = Math.max(0, Math.min(255, Math.round(r * 0.8)));
  const newG = Math.max(0, Math.min(255, Math.round(g * 0.9)));
  const newB = Math.max(0, Math.min(255, Math.round(b * 1.1)));
  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Converts a night-mode hex color back to default day tone.
 * @param {number} hexColor
 * @returns {number}
 */
export function shiftColorToDay(hexColor) {
  if (COLOR_LOOKUP_TABLE.night[hexColor] !== undefined) {
    return COLOR_LOOKUP_TABLE.night[hexColor];
  }
  const r = (hexColor >> 16) & 0xFF;
  const g = (hexColor >> 8) & 0xFF;
  const b = hexColor & 0xFF;
  const newR = Math.max(0, Math.min(255, Math.round(r / 0.8)));
  const newG = Math.max(0, Math.min(255, Math.round(g / 0.9)));
  const newB = Math.max(0, Math.min(255, Math.round(b / 1.1)));
  return (newR << 16) | (newG << 8) | newB;
}

export class NightModeManager {
  /**
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [lightingManager] - LightingManager instance
   * @param {Object} [glowManager] - GlowEffectManager instance
   * @param {Object} [particleManager] - ParticleEffectManager instance
   */
  constructor(
    gameState = null,
    eventBusRef = null,
    lightingManager = null,
    glowManager = null,
    particleManager = null
  ) {
    this.gameState = gameState || defaultGameState;
    this.eventBus = eventBusRef || eventBus;
    this.lightingManager = lightingManager || defaultLightingManager;
    this.glowManager = glowManager || defaultGlowManager;
    this.particleManager = particleManager || defaultParticleManager;
    this.scene = null;
    this.audioManager = null;

    // Core state
    this.nightModeEnabled = false;
    this.isTransitioning = false;
    this.currentTransitionTween = null;

    // Track active registered elements to recolor
    this.registeredColorElements = new Set(); // Set of { target, prop, dayColor, nightColor }

    // Event bus subscriptions
    this._unsubscribers = [];

    // Attempt to restore persistent preference from localStorage
    this._loadSavedPreference();
  }

  /**
   * Initializes or connects manager with runtime game systems.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [dependencies={}] - Optional subsystem references
   * @returns {NightModeManager}
   */
  create(scene = null, gameState = null, dependencies = {}) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;
    if (dependencies.eventBus) this.eventBus = dependencies.eventBus;
    if (dependencies.lightingManager) this.lightingManager = dependencies.lightingManager;
    if (dependencies.glowManager) this.glowManager = dependencies.glowManager;
    if (dependencies.particleManager) this.particleManager = dependencies.particleManager;
    if (dependencies.audioManager) this.audioManager = dependencies.audioManager;

    this._detachEventListeners();
    this._attachEventListeners();

    // Check saved state vs unlock status
    this._loadSavedPreference();

    // If night mode is enabled in state, apply visual configuration immediately
    if (this.nightModeEnabled && this.isNightModeUnlocked()) {
      this.setNightMode(true, 0);
    } else {
      this.setNightMode(false, 0);
    }

    return this;
  }

  /**
   * Subscribes to event bus for reactive easter egg and state tracking.
   * @private
   */
  _attachEventListeners() {
    // 1. Easter Egg discovered event (night mode portal)
    const unsubEgg = this.eventBus.on(PROGRESS_EVENTS.EASTER_EGG_FOUND, (payload) => {
      if (payload?.eggId === 'nightmode' && !this.gameState?.unlocks?.nightModeUnlocked) {
        if (this.gameState?.unlocks) {
          this.gameState.unlocks.nightModeUnlocked = true;
        }
        this.eventBus.emit(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, {});
      }
    });

    // 2. Global state change
    const unsubState = this.eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      if (!this.isNightModeUnlocked() && this.nightModeEnabled) {
        this.disableNightMode();
      }
    });

    this._unsubscribers = [unsubEgg, unsubState];
  }

  /**
   * Unsubscribes from all event bus listeners.
   * @private
   */
  _detachEventListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Checks whether Night Mode has been unlocked via the hidden portal easter egg.
   * @returns {boolean}
   */
  isNightModeUnlocked() {
    if (!this.gameState) return false;
    const easterEggs = this.gameState.easterEggsFound || [];
    const isEggFound = easterEggs.includes('nightmode');
    const isUnlockFlagged = Boolean(this.gameState.unlocks?.nightModeUnlocked);
    return isEggFound || isUnlockFlagged;
  }

  /**
   * Checks whether Night Mode is currently active.
   * @returns {boolean}
   */
  isNightModeEnabled() {
    return this.nightModeEnabled;
  }

  /**
   * Sets Night Mode active state with smooth transition.
   * 
   * @param {boolean} enabled - Target state
   * @param {number} [duration=300] - Transition duration in ms
   * @returns {boolean} True if successfully toggled
   */
  setNightMode(enabled, duration = 300) {
    const target = Boolean(enabled);

    // If trying to enable while locked, prevent unless bypass is flagged
    if (target && !this.isNightModeUnlocked()) {
      return false;
    }

    const previous = this.nightModeEnabled;
    this.nightModeEnabled = target;

    // Update GameState unlock mirror
    if (this.gameState?.unlocks) {
      this.gameState.unlocks.nightModeActive = target;
    }

    // Persist preference
    this._savePreference(target);

    // Animate visual, lighting, particle, and audio transitions
    this.animate(duration);

    // Emit event if changed or explicit
    if (previous !== target || duration === 0) {
      this.eventBus.emit(PROGRESS_EVENTS.NIGHT_MODE_TOGGLED, {
        enabled: target,
        theme: this.getTheme()
      });
    }

    return true;
  }

  /**
   * Shorthand to enable Night Mode.
   * @param {number} [duration=300]
   * @returns {boolean}
   */
  enableNightMode(duration = 300) {
    return this.setNightMode(true, duration);
  }

  /**
   * Shorthand to disable Night Mode.
   * @param {number} [duration=300]
   * @returns {boolean}
   */
  disableNightMode(duration = 300) {
    return this.setNightMode(false, duration);
  }

  /**
   * Flips current Night Mode state.
   * @param {number} [duration=300]
   * @returns {boolean}
   */
  toggleNightMode(duration = 300) {
    return this.setNightMode(!this.nightModeEnabled, duration);
  }

  /**
   * Updates lighting system ambient darkness and point light intensities.
   * 
   * @param {number} [duration=300]
   */
  updateLighting(duration = 300) {
    const theme = this.nightModeEnabled ? NIGHT_MODE_THEMES.NIGHT : NIGHT_MODE_THEMES.DAY;

    // 1. Direct LightingManager integration
    if (this.lightingManager) {
      if (typeof this.lightingManager.setNightMode === 'function') {
        this.lightingManager.setNightMode(this.nightModeEnabled);
      } else if (typeof this.lightingManager.setAmbientDarkness === 'function') {
        this.lightingManager.setAmbientDarkness(theme.ambientDarkness);
      }

      // Boost point lights if lightingManager has lights map
      if (this.lightingManager.lights instanceof Map) {
        for (const light of this.lightingManager.lights.values()) {
          const base = light.baseIntensity ?? light.intensity ?? 0.8;
          light.intensity = base * theme.pointLightMultiplier;
        }
        if (typeof this.lightingManager.renderLighting === 'function') {
          this.lightingManager.renderLighting();
        }
      }
    }

    // 2. Scene-level ambient darkness overlay if present
    if (this.scene?.ambientOverlay?.setAlpha) {
      if (duration > 0 && this.scene.tweens?.add) {
        this.scene.tweens.add({
          targets: this.scene.ambientOverlay,
          alpha: theme.ambientDarkness,
          duration,
          ease: 'Sine.easeInOut'
        });
      } else {
        this.scene.ambientOverlay.setAlpha(theme.ambientDarkness);
      }
    }
  }

  /**
   * Recolor registered elements (zone glows, landmarks, accents).
   * 
   * @param {number} [duration=300]
   */
  updateColors(duration = 300) {
    // 1. GlowEffectManager integration
    if (this.glowManager) {
      const targetGlow = this.nightModeEnabled ? NIGHT_MODE_THEMES.NIGHT : NIGHT_MODE_THEMES.DAY;
      
      // Update zone glow configs
      if (this.glowManager.glowObjects instanceof Map) {
        for (const [zoneId, glowObj] of this.glowManager.glowObjects.entries()) {
          const cfg = this.glowManager.zoneConfigs?.get?.(zoneId);
          if (cfg) {
            const dayCol = cfg.color;
            const targetColor = this.nightModeEnabled
              ? this.getNightModeColor(dayCol)
              : dayCol;

            if (typeof this.glowManager.setZoneGlowColor === 'function') {
              this.glowManager.setZoneGlowColor(zoneId, targetColor);
            }
            if (typeof this.glowManager.setZoneGlowIntensity === 'function') {
              this.glowManager.setZoneGlowIntensity(zoneId, targetGlow.glowIntensity);
            }
          }
        }
      }
    }

    // 2. Custom registered game objects
    this.registeredColorElements.forEach(item => {
      const { target, prop, dayColor, nightColor } = item;
      const targetColor = this.nightModeEnabled ? nightColor : dayColor;

      if (!target) return;

      if (typeof target.setTint === 'function') {
        target.setTint(targetColor);
      } else if (prop && typeof target[prop] !== 'undefined') {
        target[prop] = targetColor;
      }
    });
  }

  /**
   * Adjusts particle luminescence and visibility for fireflies and data streams.
   */
  updateParticles() {
    const theme = this.nightModeEnabled ? NIGHT_MODE_THEMES.NIGHT : NIGHT_MODE_THEMES.DAY;

    if (this.particleManager) {
      // 1. Firefly emitters
      if (this.particleManager.emitters instanceof Map) {
        const fireflyEmitter = this.particleManager.emitters.get('firefly');
        if (fireflyEmitter?.setAlpha) {
          fireflyEmitter.setAlpha(this.nightModeEnabled ? 1.0 : 0.8);
        }
      }

      // 2. Direct property hooks if supported
      if (typeof this.particleManager.setFireflyBrightness === 'function') {
        this.particleManager.setFireflyBrightness(theme.fireflyBrightness);
      }
    }
  }

  /**
   * Crossfades audio between standard ambient forest and midnight orchestral variant.
   * 
   * @param {number} [crossfadeDuration=500]
   */
  updateAudio(crossfadeDuration = 500) {
    const theme = this.nightModeEnabled ? NIGHT_MODE_THEMES.NIGHT : NIGHT_MODE_THEMES.DAY;

    // 1. Dedicated audio manager
    if (this.audioManager) {
      if (typeof this.audioManager.crossfadeMusic === 'function') {
        this.audioManager.crossfadeMusic(theme.music, crossfadeDuration);
        return;
      }
    }

    // 2. Phaser Scene Sound Manager
    if (this.scene?.sound) {
      const soundMgr = this.scene.sound;
      const dayTrack = soundMgr.get('ambient-forest');
      const nightTrack = soundMgr.get('ambient-forest-night');

      if (this.nightModeEnabled) {
        if (dayTrack?.isPlaying) {
          this._crossfadePhaserSound(dayTrack, nightTrack, crossfadeDuration, theme.orchestralVolume);
        } else if (nightTrack && !nightTrack.isPlaying) {
          nightTrack.play({ loop: true, volume: theme.orchestralVolume || 0.6 });
        }
      } else {
        if (nightTrack?.isPlaying) {
          this._crossfadePhaserSound(nightTrack, dayTrack, crossfadeDuration, theme.musicVolume);
        } else if (dayTrack && !dayTrack.isPlaying) {
          dayTrack.play({ loop: true, volume: theme.musicVolume || 0.7 });
        }
      }
    }
  }

  /**
   * Internal helper for crossfading Phaser sound instances.
   * @private
   */
  _crossfadePhaserSound(fromSound, toSound, duration, targetVolume = 0.7) {
    if (!this.scene?.tweens?.add) return;

    if (fromSound) {
      this.scene.tweens.add({
        targets: fromSound,
        volume: 0,
        duration,
        onComplete: () => fromSound.stop()
      });
    }

    if (toSound) {
      toSound.volume = 0;
      if (!toSound.isPlaying) toSound.play({ loop: true });
      this.scene.tweens.add({
        targets: toSound,
        volume: targetVolume,
        duration
      });
    }
  }

  /**
   * Adjusts UI containers, borders, and DOM theme classes.
   */
  updateUI() {
    // 1. Browser DOM document styling
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (body) {
        if (this.nightModeEnabled) {
          body.classList.add('dark-forest-night-mode');
          document.documentElement.style.setProperty('--df-bg-primary', 'rgba(10, 10, 20, 0.98)');
          document.documentElement.style.setProperty('--df-text-contrast', '#FFFFFF');
          document.documentElement.style.setProperty('--df-border-accent', '#2E7FFF');
        } else {
          body.classList.remove('dark-forest-night-mode');
          document.documentElement.style.setProperty('--df-bg-primary', 'rgba(20, 26, 46, 0.95)');
          document.documentElement.style.setProperty('--df-text-contrast', '#F0F4F8');
          document.documentElement.style.setProperty('--df-border-accent', '#4A90FF');
        }
      }
    }
  }

  /**
   * Converts any Day hex color into its Night Mode variant.
   * Uses cached lookup table with algorithmic fallback.
   * 
   * @param {number} dayColor - 24-bit RGB hex color
   * @returns {number} Night Mode variant
   */
  getNightModeColor(dayColor) {
    return shiftColorToNight(dayColor);
  }

  /**
   * Converts any Night Mode hex color into its Day variant.
   * 
   * @param {number} nightColor - 24-bit RGB hex color
   * @returns {number} Day variant
   */
  getDayColor(nightColor) {
    return shiftColorToDay(nightColor);
  }

  /**
   * Registers a game object to receive automatic color updates during mode shifts.
   * 
   * @param {Object} target - Target GameObject
   * @param {string} [prop='tint'] - Property name or setter
   * @param {number} dayColor - Base color
   * @param {number} [nightColor] - Custom night color override
   */
  registerColorElement(target, prop = 'tint', dayColor = 0xffffff, nightColor = null) {
    const computedNightColor = nightColor !== null ? nightColor : this.getNightModeColor(dayColor);
    this.registeredColorElements.add({
      target,
      prop,
      dayColor,
      nightColor: computedNightColor
    });
  }

  /**
   * Unregisters a game object.
   * @param {Object} target
   */
  unregisterColorElement(target) {
    for (const item of this.registeredColorElements) {
      if (item.target === target) {
        this.registeredColorElements.delete(item);
        break;
      }
    }
  }

  /**
   * Executes smooth animation of all theme properties over specified duration.
   * 
   * @param {number} [duration=300] - Duration in ms
   */
  animate(duration = 300) {
    this.isTransitioning = true;

    this.updateLighting(duration);
    this.updateColors(duration);
    this.updateParticles();
    this.updateAudio(Math.max(duration, 500));
    this.updateUI();

    if (duration > 0) {
      setTimeout(() => {
        this.isTransitioning = false;
      }, duration);
    } else {
      this.isTransitioning = false;
    }
  }

  /**
   * Returns complete current theme data snapshot.
   * 
   * @returns {Object}
   */
  getTheme() {
    return {
      nightMode: this.nightModeEnabled,
      nightModeUnlocked: this.isNightModeUnlocked(),
      theme: this.nightModeEnabled ? NIGHT_MODE_THEMES.NIGHT : NIGHT_MODE_THEMES.DAY,
      colors: {
        current: this.nightModeEnabled ? COLOR_LOOKUP_TABLE.day : COLOR_LOOKUP_TABLE.night,
        day: { ...COLOR_LOOKUP_TABLE.day },
        night: { ...COLOR_LOOKUP_TABLE.night }
      },
      lighting: {
        ambientDarkness: this.nightModeEnabled
          ? NIGHT_MODE_THEMES.NIGHT.ambientDarkness
          : NIGHT_MODE_THEMES.DAY.ambientDarkness,
        glowIntensity: this.nightModeEnabled
          ? NIGHT_MODE_THEMES.NIGHT.glowIntensity
          : NIGHT_MODE_THEMES.DAY.glowIntensity
      },
      audio: this.nightModeEnabled
        ? NIGHT_MODE_THEMES.NIGHT.music
        : NIGHT_MODE_THEMES.DAY.music
    };
  }

  /**
   * Serializes night mode preference for persistent game saves.
   * @returns {{ nightModeEnabled: boolean, nightModeUnlocked: boolean }}
   */
  serialize() {
    return {
      nightModeEnabled: this.nightModeEnabled,
      nightModeUnlocked: this.isNightModeUnlocked()
    };
  }

  /**
   * Restores state from saved data.
   * @param {Object} data
   */
  deserialize(data) {
    if (!data) return;

    if (typeof data.nightModeEnabled === 'boolean') {
      this.setNightMode(data.nightModeEnabled, 0);
    }
  }

  /**
   * Reverts night mode to default day mode.
   * @param {boolean} [clearUnlock=false]
   */
  reset(clearUnlock = false) {
    this.setNightMode(false, 0);

    if (clearUnlock && this.gameState?.unlocks) {
      this.gameState.unlocks.nightModeUnlocked = false;
    }

    this._savePreference(false);
  }

  /**
   * Reads persistent preference from localStorage.
   * @private
   */
  _loadSavedPreference() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY_NIGHT_MODE);
        if (saved !== null) {
          this.nightModeEnabled = saved === 'true';
        }
      }
    } catch (e) {
      // Storage unavailable in private browsing or headless environment
    }
  }

  /**
   * Writes persistent preference to localStorage.
   * @private
   */
  _savePreference(enabled) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_NIGHT_MODE, String(enabled));
      }
    } catch (e) {
      // Storage unavailable
    }
  }

  /**
   * Cleans up listeners and animations.
   */
  destroy() {
    this._detachEventListeners();
    this.registeredColorElements.clear();
  }
}

// Export singleton instance
export const nightModeManager = new NightModeManager();
export default nightModeManager;
