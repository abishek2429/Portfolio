/**
 * AudioManager - Comprehensive Dynamic Audio Management System
 * 
 * Dark Forest Portfolio Game
 * Manages background music, environmental ambience, contextual SFX, and UI audio.
 * Features:
 * - Dynamic zone music switching with smooth crossfades
 * - Audio ducking for dialogue, achievements, and milestones
 * - Night mode audio transformations and creature soundscapes
 * - Channel mixing (Master, Music, SFX, Ambience, UI, Voice)
 * - SFX pooling (max 8 concurrent instances) and Ambience pooling (max 2 concurrent loops)
 * - Procedural pitch variation for footsteps and UI responses
 * - EventBus subscription for zero-friction reactive game audio
 * - Full serialization for game save/load states
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS
} from '../events/EventBus.js';

export const AUDIO_CHANNELS = {
  MASTER: 'master',
  MUSIC: 'music',
  SFX: 'sfx',
  AMBIENCE: 'ambience',
  UI: 'ui',
  VOICE: 'voice'
};

export const DEFAULT_CHANNEL_VOLUMES = {
  master: 1.0,
  music: 0.6,
  sfx: 0.8,
  ambience: 0.5,
  ui: 0.7,
  voice: 0.8
};

export const AUDIO_MANIFEST = {
  music: {
    'ambient-forest-day': {
      path: '/assets/audio/ambient-forest-day.mp3',
      tempo: 60,
      instruments: ['strings', 'soft piano', 'wind'],
      mood: 'peaceful, inviting',
      loop: true,
      duration: 0,
      description: 'Calm, welcoming forest ambience for Foundation Clearing'
    },
    'ambient-forest-tech': {
      path: '/assets/audio/ambient-forest-tech.mp3',
      tempo: 80,
      instruments: ['strings', 'synth pads', 'data beeps'],
      mood: 'mysterious, technical',
      loop: true,
      duration: 0,
      description: 'Tech-themed forest music for Web Dev Outpost and Mobile Valley'
    },
    'ambient-forest-mystical': {
      path: '/assets/audio/ambient-forest-mystical.mp3',
      tempo: 70,
      instruments: ['strings', 'choir pad', 'ambient sounds'],
      mood: 'transcendent, powerful',
      loop: true,
      duration: 0,
      description: 'Ethereal soundscape for AI & ML Woods and Research Lab'
    },
    'ambient-forest-night': {
      path: '/assets/audio/ambient-forest-night.mp3',
      tempo: 65,
      instruments: ['orchestra', 'strings', 'ethereal synth'],
      mood: 'dreamlike, spiritual',
      loop: true,
      duration: 0,
      description: 'Orchestral night mode variant for all zones'
    },
    'summit-triumph': {
      path: '/assets/audio/summit-triumph.mp3',
      tempo: 120,
      instruments: ['full orchestra', 'brass', 'timpani'],
      mood: 'triumphant, celebratory',
      loop: false,
      duration: 90000,
      description: 'Triumphant orchestral crescendo for Summit Nexus'
    },
    'menu-ambient': {
      path: '/assets/audio/menu-ambient.mp3',
      tempo: 75,
      instruments: ['strings', 'piano', 'wind'],
      mood: 'inviting, mysterious',
      loop: true,
      duration: 0,
      description: 'Title screen and main menu background music'
    }
  },
  sfx: {
    // UI Sounds
    'ui-click': { path: '/assets/audio/ui-click.mp3', duration: 100, volume: 0.6, channel: 'ui' },
    'ui-hover': { path: '/assets/audio/ui-hover.mp3', duration: 80, volume: 0.4, channel: 'ui' },
    'ui-confirm': { path: '/assets/audio/ui-confirm.mp3', duration: 150, volume: 0.7, channel: 'ui' },
    'ui-back': { path: '/assets/audio/ui-back.mp3', duration: 120, volume: 0.5, channel: 'ui' },
    'ui-achievement': { path: '/assets/audio/ui-achievement.mp3', duration: 500, volume: 0.8, channel: 'ui' },
    'ui-milestone': { path: '/assets/audio/ui-milestone.mp3', duration: 800, volume: 0.9, channel: 'ui' },

    // Player Footsteps
    'footstep-grass-1': { path: '/assets/audio/footstep-grass-1.mp3', duration: 200, volume: 0.5, pitchRange: 0.20, channel: 'sfx' },
    'footstep-grass-2': { path: '/assets/audio/footstep-grass-2.mp3', duration: 200, volume: 0.5, pitchRange: 0.20, channel: 'sfx' },
    'footstep-grass-3': { path: '/assets/audio/footstep-grass-3.mp3', duration: 200, volume: 0.5, pitchRange: 0.20, channel: 'sfx' },
    'footstep-stone-1': { path: '/assets/audio/footstep-stone-1.mp3', duration: 200, volume: 0.6, pitchRange: 0.15, channel: 'sfx' },
    'footstep-stone-2': { path: '/assets/audio/footstep-stone-2.mp3', duration: 200, volume: 0.6, pitchRange: 0.15, channel: 'sfx' },
    'footstep-stone-3': { path: '/assets/audio/footstep-stone-3.mp3', duration: 200, volume: 0.6, pitchRange: 0.15, channel: 'sfx' },

    // Contextual Gameplay
    'npc-talk-start': { path: '/assets/audio/npc-talk-start.mp3', duration: 200, volume: 0.7, channel: 'sfx' },
    'npc-talk-end': { path: '/assets/audio/npc-talk-end.mp3', duration: 150, volume: 0.6, channel: 'sfx' },
    'zone-discover': { path: '/assets/audio/zone-discover.mp3', duration: 300, volume: 0.8, channel: 'sfx' },
    'project-click': { path: '/assets/audio/project-click.mp3', duration: 250, volume: 0.7, channel: 'sfx' },
    'easter-egg-found': { path: '/assets/audio/easter-egg-found.mp3', duration: 400, volume: 0.9, channel: 'sfx' }
  },
  ambience: {
    'ambience-fireflies': { path: '/assets/audio/ambience-fireflies.mp3', loop: true, volume: 0.3, channel: 'ambience' },
    'ambience-night-creatures': { path: '/assets/audio/ambience-night-creatures.mp3', loop: true, volume: 0.2, channel: 'ambience' }
  }
};

export const ZONE_MUSIC_MAP = {
  'foundation-clearing': 'ambient-forest-day',
  'foundation': 'ambient-forest-day',
  'webdev-outpost': 'ambient-forest-tech',
  'webdev': 'ambient-forest-tech',
  'aiml-woods': 'ambient-forest-mystical',
  'aiml': 'ambient-forest-mystical',
  'mobile-valley': 'ambient-forest-tech',
  'mobile': 'ambient-forest-tech',
  'summit-nexus': 'summit-triumph',
  'summit': 'summit-triumph',
  'secret-lab': 'ambient-forest-mystical',
  'research-lab': 'ambient-forest-mystical',
  'menu': 'menu-ambient',
  'main-menu': 'menu-ambient'
};

export const DUCKING_FACTORS = {
  NPC_DIALOGUE: 0.7, // -30%
  ACHIEVEMENT: 0.8,  // -20%
  MILESTONE: 0.9,    // -10%
  PROJECT: 0.85,     // -15%
  EASTER_EGG: 0.8    // -20%
};

/**
 * Lightweight simulated audio instance for robust headless test
 * and browser Web Audio / HTML5 Audio execution.
 */
class SoundInstance {
  constructor(key, category = 'sfx', config = {}) {
    this.key = key;
    this.category = category;
    this.baseVolume = config.volume ?? 1.0;
    this.channelVolume = 1.0;
    this.masterVolume = 1.0;
    this.duckMultiplier = 1.0;
    this.pitch = config.pitch ?? 1.0;
    this.loop = Boolean(config.loop);
    this.duration = config.duration ?? 0;

    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedAt = 0;
    this.fadeTween = null;
    this.onComplete = null;
    this._timer = null;
  }

  get effectiveVolume() {
    return Math.max(0, Math.min(1, this.baseVolume * this.channelVolume * this.masterVolume * this.duckMultiplier));
  }

  play(effectiveVol = this.effectiveVolume) {
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedAt = 0;

    if (!this.loop && this.duration > 0) {
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        this.stop();
        if (typeof this.onComplete === 'function') {
          this.onComplete(this);
        }
      }, this.duration);
    }
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.isPlaying = false;
    this.pausedAt = Date.now() - this.startTime;
    if (this._timer) clearTimeout(this._timer);
  }

  resume() {
    if (!this.isPaused) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = Date.now() - this.pausedAt;
    if (!this.loop && this.duration > 0) {
      const remaining = Math.max(10, this.duration - this.pausedAt);
      this._timer = setTimeout(() => {
        this.stop();
        if (typeof this.onComplete === 'function') {
          this.onComplete(this);
        }
      }, remaining);
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.pausedAt = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this.fadeTween) {
      clearInterval(this.fadeTween);
      this.fadeTween = null;
    }
  }

  getPosition() {
    if (this.isPaused) return this.pausedAt;
    if (this.isPlaying) return Date.now() - this.startTime;
    return 0;
  }
}

export class AudioManager {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.scene = null;
    this.eventBus = config.eventBus || eventBus;

    // Mixing Channels
    this.channels = { ...DEFAULT_CHANNEL_VOLUMES, ...(config.channels || {}) };
    this.previousVolumes = { ...this.channels };
    this.muted = false;

    // State Tracking
    this.currentMusicKey = null;
    this.currentMusicInstance = null;
    this.previousMusicInstance = null;
    this.nightModeEnabled = Boolean(config.nightModeEnabled);

    // Active Instances & Object Pools
    this.activeSfxInstances = [];
    this.activeAmbienceInstances = new Map(); // key -> SoundInstance
    this.maxConcurrentSfx = config.maxConcurrentSfx || 8;
    this.maxConcurrentAmbience = config.maxConcurrentAmbience || 2;

    // Ducking Management
    this.activeDuckingModifiers = new Map(); // reason -> multiplier
    this.baseMusicVolume = this.channels.music;

    // Event Subscriptions
    this._eventUnsubscribers = [];
  }

  /**
   * Initializes the AudioManager with scene context and event listeners.
   * 
   * @param {Phaser.Scene} [scene]
   * @param {Object} [config]
   * @returns {AudioManager}
   */
  create(scene = null, config = {}) {
    if (scene) this.scene = scene;
    if (config.channels) {
      this.channels = { ...this.channels, ...config.channels };
    }

    this._setupEventListeners();
    return this;
  }

  /**
   * Wires automatic reactivity to game events.
   * @private
   */
  _setupEventListeners() {
    this._cleanupEventListeners();

    if (!this.eventBus) return;

    // Zone entered: switch background music
    const subZone = this.eventBus.on(GAME_EVENTS.ZONE_ENTERED, (data) => {
      if (data?.zoneId) this.onZoneEnter(data.zoneId);
    });

    // Zone discovered fanfare
    const subZoneDisc = this.eventBus.on(GAME_EVENTS.ZONE_DISCOVERED, () => {
      this.playSfx('zone-discover');
    });

    // NPC Dialogue Start: duck music & play dialogue chime
    const subNpcStart = this.eventBus.on(NPC_EVENTS.DIALOGUE_STARTED, (data) => {
      this.onNpcInteract(data?.npcId);
    });

    // NPC Dialogue End: restore music & play exit sound
    const subNpcEnd = this.eventBus.on(NPC_EVENTS.DIALOGUE_ENDED, (data) => {
      this.onNpcInteractEnd(data?.npcId);
    });

    // Project clicked
    const subProj = this.eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, (data) => {
      this.onProjectClick(data?.projectId);
    });

    // Achievements unlocked
    const subAch = this.eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, (data) => {
      this.onAchievementUnlock(data?.achievementName || data?.achievementId);
    });

    // Milestones reached
    const subMilestone = this.eventBus.on(PROGRESS_EVENTS.MILESTONE_REACHED, (data) => {
      this.onMilestoneReached(data?.milestoneName || data?.milestoneId);
    });

    // Easter eggs discovered
    const subEgg = this.eventBus.on(PROGRESS_EVENTS.EASTER_EGG_FOUND, (data) => {
      this.onEasterEggFound(data?.eggName || data?.eggId);
    });

    // Night mode toggles
    const subNightToggle = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_TOGGLED, (data) => {
      this.setNightMode(Boolean(data?.enabled));
    });

    // Night mode unlock discovery
    const subNightUnlock = this.eventBus.on(PROGRESS_EVENTS.NIGHT_MODE_UNLOCKED, () => {
      this.onNightModeUnlock();
    });

    this._eventUnsubscribers = [
      subZone,
      subZoneDisc,
      subNpcStart,
      subNpcEnd,
      subProj,
      subAch,
      subMilestone,
      subEgg,
      subNightToggle,
      subNightUnlock
    ];
  }

  /**
   * Cleans up event listeners.
   * @private
   */
  _cleanupEventListeners() {
    this._eventUnsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._eventUnsubscribers = [];
  }

  // =========================================================================
  // MUSIC PLAYBACK & CROSSFADES
  // =========================================================================

  /**
   * Plays a background music track with an optional crossfade duration.
   * 
   * @param {string} trackName - Key in AUDIO_MANIFEST.music
   * @param {number} [duration=500] - Crossfade duration in ms
   */
  playMusic(trackName, duration = 500) {
    if (!trackName) return;

    // In night mode, map daylight forest tracks to night orchestral variant
    const effectiveTrack = (this.nightModeEnabled && trackName !== 'summit-triumph' && trackName !== 'menu-ambient')
      ? 'ambient-forest-night'
      : trackName;

    if (this.currentMusicKey === effectiveTrack && this.currentMusicInstance?.isPlaying) {
      return; // Already playing desired track
    }

    this.crossfadeMusic(effectiveTrack, duration);
  }

  /**
   * Smoothly crossfades between the current music and a new track.
   * 
   * @param {string} newTrackName
   * @param {number} [duration=500]
   */
  crossfadeMusic(newTrackName, duration = 500) {
    const musicMeta = AUDIO_MANIFEST.music[newTrackName] || { loop: true };
    const oldInstance = this.currentMusicInstance;

    // Create new music instance
    const newInstance = new SoundInstance(newTrackName, 'music', {
      volume: 1.0,
      loop: musicMeta.loop !== false,
      duration: musicMeta.duration || 0
    });

    newInstance.channelVolume = this.channels.music;
    newInstance.masterVolume = this.muted ? 0 : this.channels.master;
    newInstance.duckMultiplier = this._calculateCurrentDucking();

    this.previousMusicInstance = oldInstance;
    this.currentMusicInstance = newInstance;
    this.currentMusicKey = newTrackName;

    // If duration is 0, instant switch
    if (duration <= 0 || !oldInstance) {
      if (oldInstance) oldInstance.stop();
      newInstance.play();
      return;
    }

    // Step-based crossfade
    newInstance.play();
    const startTime = Date.now();
    const intervalMs = 25;
    const steps = Math.max(1, duration / intervalMs);
    let stepCount = 0;

    const fadeTimer = setInterval(() => {
      stepCount++;
      const progress = Math.min(1, stepCount / steps);

      if (oldInstance) {
        oldInstance.baseVolume = Math.max(0, 1 - progress);
      }
      newInstance.baseVolume = progress;

      if (progress >= 1 || Date.now() - startTime >= duration) {
        clearInterval(fadeTimer);
        if (oldInstance) oldInstance.stop();
        newInstance.baseVolume = 1.0;
        this.previousMusicInstance = null;
      }
    }, intervalMs);

    newInstance.fadeTween = fadeTimer;
  }

  /**
   * Stops current background music with optional fade-out.
   * 
   * @param {number} [duration=500]
   */
  stopMusic(duration = 500) {
    if (!this.currentMusicInstance) return;

    const instance = this.currentMusicInstance;
    this.currentMusicKey = null;

    if (duration <= 0) {
      instance.stop();
      this.currentMusicInstance = null;
      return;
    }

    const startVol = instance.baseVolume;
    const intervalMs = 25;
    const steps = Math.max(1, duration / intervalMs);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      instance.baseVolume = Math.max(0, startVol * (1 - progress));

      if (progress >= 1) {
        clearInterval(timer);
        instance.stop();
        if (this.currentMusicInstance === instance) {
          this.currentMusicInstance = null;
        }
      }
    }, intervalMs);
  }

  /**
   * Pauses currently playing music, preserving position.
   */
  pauseMusic() {
    if (this.currentMusicInstance) {
      this.currentMusicInstance.pause();
    }
  }

  /**
   * Resumes paused music from previous position.
   */
  resumeMusic() {
    if (this.currentMusicInstance) {
      this.currentMusicInstance.resume();
    }
  }

  /**
   * Returns key of current playing music track.
   * @returns {string|null}
   */
  getCurrentMusic() {
    return this.currentMusicKey;
  }

  /**
   * Returns current playback position in milliseconds.
   * @returns {number}
   */
  getMusicPosition() {
    return this.currentMusicInstance ? this.currentMusicInstance.getPosition() : 0;
  }

  // =========================================================================
  // SOUND EFFECTS & UI SOUNDS
  // =========================================================================

  /**
   * Plays a one-shot sound effect with concurrency limiting and pooling.
   * 
   * @param {string} sfxName
   * @param {number} [volume] - Optional 0.0 - 1.0
   * @param {number} [pitch=1.0] - Optional pitch 0.5 - 2.0
   * @returns {SoundInstance|null}
   */
  playSfx(sfxName, volume = null, pitch = 1.0) {
    const meta = AUDIO_MANIFEST.sfx[sfxName] || {};
    const defaultVol = meta.volume ?? 0.8;
    const targetVol = volume !== null && volume !== undefined ? volume : defaultVol;

    // Concurrency limiter: keep active SFX <= maxConcurrentSfx
    this._pruneFinishedSfx();
    if (this.activeSfxInstances.length >= this.maxConcurrentSfx) {
      const oldest = this.activeSfxInstances.shift();
      oldest?.stop();
    }

    const instance = new SoundInstance(sfxName, meta.channel || 'sfx', {
      volume: targetVol,
      pitch: Math.max(0.5, Math.min(2.0, pitch)),
      duration: meta.duration || 200,
      loop: false
    });

    const channelName = meta.channel || 'sfx';
    instance.channelVolume = this.channels[channelName] ?? this.channels.sfx;
    instance.masterVolume = this.muted ? 0 : this.channels.master;

    instance.onComplete = () => {
      this._removeActiveSfx(instance);
    };

    this.activeSfxInstances.push(instance);
    instance.play();

    // Trigger phaser sound if available
    try {
      if (this.scene?.sound?.play) {
        this.scene.sound.play(sfxName, {
          volume: instance.effectiveVolume,
          rate: instance.pitch
        });
      }
    } catch (e) {
      // Browser audio restriction guard
    }

    return instance;
  }

  /**
   * Plays a UI button or feedback sound.
   * 
   * @param {string} uiSoundName
   * @returns {SoundInstance|null}
   */
  playUiSound(uiSoundName) {
    const meta = AUDIO_MANIFEST.sfx[uiSoundName] || { volume: 0.6, duration: 120 };
    return this.playSfx(uiSoundName, meta.volume, 1.0);
  }

  /**
   * Contextual footstep player with terrain variation and ±20% pitch jitter.
   * 
   * @param {'grass'|'stone'|'water'} terrain
   * @param {number} [volume]
   * @param {number} [pitch]
   * @returns {SoundInstance|null}
   */
  playFootstep(terrain = 'grass', volume = null, pitch = null) {
    const type = terrain === 'stone' ? 'stone' : 'grass';
    const variant = Math.floor(Math.random() * 3) + 1;
    const soundKey = `footstep-${type}-${variant}`;

    const pitchRange = type === 'stone' ? 0.15 : 0.20;
    const jitter = (Math.random() * 2 - 1) * pitchRange;
    const resolvedPitch = pitch !== null ? pitch : 1.0 + jitter;

    const baseVol = volume !== null ? volume : (type === 'stone' ? 0.6 : 0.5);
    return this.playSfx(soundKey, baseVol, resolvedPitch);
  }

  _pruneFinishedSfx() {
    this.activeSfxInstances = this.activeSfxInstances.filter(inst => inst.isPlaying);
  }

  _removeActiveSfx(instance) {
    const idx = this.activeSfxInstances.indexOf(instance);
    if (idx !== -1) {
      this.activeSfxInstances.splice(idx, 1);
    }
  }

  // =========================================================================
  // AMBIENCE LOOPS
  // =========================================================================

  /**
   * Plays a looping environmental ambience sound (e.g. fireflies or night creatures).
   * 
   * @param {string} ambienceName
   * @param {number} [volume]
   * @returns {SoundInstance}
   */
  playAmbience(ambienceName, volume = null) {
    if (this.activeAmbienceInstances.has(ambienceName)) {
      const existing = this.activeAmbienceInstances.get(ambienceName);
      if (!existing.isPlaying) existing.play();
      return existing;
    }

    if (this.activeAmbienceInstances.size >= this.maxConcurrentAmbience) {
      // Stop the oldest ambience loop
      const firstKey = this.activeAmbienceInstances.keys().next().value;
      this.stopAmbienceTrack(firstKey, 300);
    }

    const meta = AUDIO_MANIFEST.ambience[ambienceName] || { volume: 0.3 };
    const targetVol = volume !== null ? volume : meta.volume;

    const instance = new SoundInstance(ambienceName, 'ambience', {
      volume: targetVol,
      loop: true
    });

    instance.channelVolume = this.channels.ambience;
    instance.masterVolume = this.muted ? 0 : this.channels.master;

    this.activeAmbienceInstances.set(ambienceName, instance);
    instance.play();

    return instance;
  }

  /**
   * Stops a specific ambience loop with fade-out.
   * 
   * @param {string} ambienceName
   * @param {number} [duration=500]
   */
  stopAmbienceTrack(ambienceName, duration = 500) {
    const instance = this.activeAmbienceInstances.get(ambienceName);
    if (!instance) return;

    this.activeAmbienceInstances.delete(ambienceName);
    if (duration <= 0) {
      instance.stop();
      return;
    }

    const startVol = instance.baseVolume;
    const intervalMs = 25;
    const steps = Math.max(1, duration / intervalMs);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      instance.baseVolume = Math.max(0, startVol * (1 - progress));

      if (progress >= 1) {
        clearInterval(timer);
        instance.stop();
      }
    }, intervalMs);
  }

  /**
   * Stops all active ambience loops.
   * 
   * @param {number} [duration=500]
   */
  stopAmbience(duration = 500) {
    for (const key of Array.from(this.activeAmbienceInstances.keys())) {
      this.stopAmbienceTrack(key, duration);
    }
  }

  // =========================================================================
  // VOLUME CONTROL & MIXING
  // =========================================================================

  /**
   * Sets channel volume and recalculates active instances.
   * 
   * @param {'master'|'music'|'sfx'|'ambience'|'ui'|'voice'} channel
   * @param {number} volume - 0.0 to 1.0
   */
  setVolume(channel, volume) {
    const normalized = Math.max(0, Math.min(1, volume));
    this.channels[channel] = normalized;

    // Apply to current music
    if (channel === 'music' || channel === 'master') {
      if (this.currentMusicInstance) {
        this.currentMusicInstance.channelVolume = this.channels.music;
        this.currentMusicInstance.masterVolume = this.muted ? 0 : this.channels.master;
      }
    }

    // Apply to active SFX
    if (channel === 'sfx' || channel === 'ui' || channel === 'master') {
      this.activeSfxInstances.forEach(sfx => {
        if (sfx.category === channel || channel === 'master') {
          sfx.channelVolume = this.channels[sfx.category] ?? this.channels.sfx;
          sfx.masterVolume = this.muted ? 0 : this.channels.master;
        }
      });
    }

    // Apply to active ambience
    if (channel === 'ambience' || channel === 'master') {
      this.activeAmbienceInstances.forEach(amb => {
        amb.channelVolume = this.channels.ambience;
        amb.masterVolume = this.muted ? 0 : this.channels.master;
      });
    }

    // Sync Phaser global volume if scene provided
    if (channel === 'master' && this.scene?.sound?.setVolume) {
      this.scene.sound.setVolume(this.muted ? 0 : this.channels.master);
    }
  }

  getVolume(channel) {
    return this.channels[channel] ?? 1.0;
  }

  setMasterVolume(volume) { this.setVolume('master', volume); }
  setMusicVolume(volume) { this.setVolume('music', volume); }
  setSfxVolume(volume) { this.setVolume('sfx', volume); }
  setAmbienceVolume(volume) { this.setVolume('ambience', volume); }

  muteChannel(channel) {
    if (this.channels[channel] > 0) {
      this.previousVolumes[channel] = this.channels[channel];
      this.setVolume(channel, 0);
    }
  }

  unmuteChannel(channel) {
    const restored = this.previousVolumes[channel] ?? DEFAULT_CHANNEL_VOLUMES[channel] ?? 0.8;
    this.setVolume(channel, restored > 0 ? restored : 0.8);
  }

  muteAll() {
    this.muted = true;
    this.previousVolumes.master = this.channels.master;
    this.setVolume('master', 0);
  }

  unmuteAll() {
    this.muted = false;
    const restored = this.previousVolumes.master > 0 ? this.previousVolumes.master : 1.0;
    this.setVolume('master', restored);
  }

  isMuted() {
    return this.muted;
  }

  // =========================================================================
  // DUCKING & DYNAMIC AUDIO EVENTS
  // =========================================================================

  _applyDucking(reason, multiplier, durationMs = null) {
    if (this._duckingTimers?.has(reason)) {
      clearTimeout(this._duckingTimers.get(reason));
      this._duckingTimers.delete(reason);
    }
    this.activeDuckingModifiers.set(reason, multiplier);
    this._updateMusicDucking();

    if (durationMs && durationMs > 0) {
      if (!this._duckingTimers) this._duckingTimers = new Map();
      const timer = setTimeout(() => {
        this._removeDucking(reason);
      }, durationMs);
      this._duckingTimers.set(reason, timer);
    }
  }

  _removeDucking(reason) {
    if (this._duckingTimers?.has(reason)) {
      clearTimeout(this._duckingTimers.get(reason));
      this._duckingTimers.delete(reason);
    }
    this.activeDuckingModifiers.delete(reason);
    this._updateMusicDucking();
  }

  clearDucking() {
    if (this._duckingTimers) {
      this._duckingTimers.forEach(t => clearTimeout(t));
      this._duckingTimers.clear();
    }
    this.activeDuckingModifiers.clear();
    this._updateMusicDucking();
  }

  _calculateCurrentDucking() {
    if (this.activeDuckingModifiers.size === 0) return 1.0;
    let minMultiplier = 1.0;
    for (const val of this.activeDuckingModifiers.values()) {
      if (val < minMultiplier) minMultiplier = val;
    }
    return minMultiplier;
  }

  _updateMusicDucking() {
    if (this.currentMusicInstance) {
      this.currentMusicInstance.duckMultiplier = this._calculateCurrentDucking();
    }
  }

  onZoneEnter(zoneId) {
    const targetTrack = ZONE_MUSIC_MAP[zoneId] || 'ambient-forest-day';
    this.playMusic(targetTrack, 600);
  }

  onNpcInteract(npcId) {
    this.playSfx('npc-talk-start', 0.7);
    this._applyDucking('npcDialogue', DUCKING_FACTORS.NPC_DIALOGUE);
  }

  onNpcInteractEnd(npcId) {
    this.playSfx('npc-talk-end', 0.6);
    this._removeDucking('npcDialogue');
  }

  onProjectClick(projectId) {
    this.playSfx('project-click', 0.7);
    this._applyDucking('project', DUCKING_FACTORS.PROJECT, 400);
  }

  onAchievementUnlock(achievementName) {
    this.playUiSound('ui-achievement');
    this._applyDucking('achievement', DUCKING_FACTORS.ACHIEVEMENT, 600);
  }

  onMilestoneReached(milestoneName) {
    this.playUiSound('ui-milestone');
    this._applyDucking('milestone', DUCKING_FACTORS.MILESTONE, 900);
  }

  onEasterEggFound(eggName) {
    this.playSfx('easter-egg-found', 0.9);
    this._applyDucking('easterEgg', DUCKING_FACTORS.EASTER_EGG, 600);
  }

  onNightModeUnlock() {
    this.playSfx('easter-egg-found', 1.0);
    this.setNightMode(true);
  }

  setNightMode(enabled) {
    this.nightModeEnabled = Boolean(enabled);

    if (this.nightModeEnabled) {
      // Transition to night orchestral music and creature sounds
      if (this.currentMusicKey !== 'summit-triumph' && this.currentMusicKey !== 'menu-ambient') {
        this.crossfadeMusic('ambient-forest-night', 800);
      }
      this.playAmbience('ambience-night-creatures', 0.25);
    } else {
      // Restore standard daylight ambience
      this.stopAmbienceTrack('ambience-night-creatures', 500);
      this.playAmbience('ambience-fireflies', 0.3);
      if (this.currentMusicKey === 'ambient-forest-night') {
        this.crossfadeMusic('ambient-forest-day', 800);
      }
    }
  }

  // =========================================================================
  // DEBUGGING, STATE & SERIALIZATION
  // =========================================================================

  getAudioState() {
    return {
      currentMusic: this.currentMusicKey,
      channels: { ...this.channels },
      muted: this.muted,
      nightModeEnabled: this.nightModeEnabled,
      musicPosition: this.getMusicPosition(),
      activeSfxCount: this.activeSfxInstances.length,
      activeAmbienceTracks: Array.from(this.activeAmbienceInstances.keys()),
      duckingFactor: this._calculateCurrentDucking()
    };
  }

  serialize() {
    return {
      volumes: { ...this.channels },
      muteState: {
        muted: this.muted,
        previousVolumes: { ...this.previousVolumes }
      },
      nightModeEnabled: this.nightModeEnabled
    };
  }

  deserialize(data) {
    if (!data) return;

    if (data.volumes) {
      for (const [ch, vol] of Object.entries(data.volumes)) {
        if (typeof vol === 'number') {
          this.setVolume(ch, vol);
        }
      }
    }

    if (data.muteState) {
      this.muted = Boolean(data.muteState.muted);
      if (data.muteState.previousVolumes) {
        this.previousVolumes = { ...data.muteState.previousVolumes };
      }
      if (this.muted) {
        this.setVolume('master', 0);
      }
    }

    if (data.nightModeEnabled !== undefined) {
      this.setNightMode(data.nightModeEnabled);
    }
  }

  dispose() {
    this._cleanupEventListeners();
    this.stopMusic(0);
    this.stopAmbience(0);
    this.activeSfxInstances.forEach(inst => inst.stop());
    this.activeSfxInstances = [];
    this.activeDuckingModifiers.clear();
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
export default audioManager;
