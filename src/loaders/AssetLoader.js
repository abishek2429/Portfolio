/**
 * AssetLoader - Centralized Game Asset Management System
 * 
 * Dark Forest Portfolio Game
 * Registers, manifests, and loads all spritesheets, tilesets, images,
 * audio tracks, and fonts into Phaser scenes.
 */

export const ASSET_MANIFEST = {
  spritesheets: {
    'player-sprite': {
      path: '/assets/sprites/player.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'Player 4-directional sheet (2 frames per direction, 8 frames total)'
    },
    'npc-mentor': {
      path: '/assets/sprites/npc-mentor.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'Foundation clearing NPC - Career Mentor'
    },
    'npc-dev': {
      path: '/assets/sprites/npc-dev.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'Web Dev Outpost NPC - Senior Engineer'
    },
    'npc-ada': {
      path: '/assets/sprites/npc-ada.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'AI & ML Woods NPC - Ada the Researcher'
    },
    'npc-mobilearch': {
      path: '/assets/sprites/npc-mobilearch.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'Mobile Valley NPC - Systems Architect'
    },
    'npc-futureyou': {
      path: '/assets/sprites/npc-futureyou.png',
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      description: 'Summit Peak NPC - Future Vision'
    }
  },

  tilesets: {
    'forest-tiles': {
      path: '/assets/tilesets/forest-tiles.png',
      tileWidth: 32,
      tileHeight: 32,
      description: 'Forest terrain tileset (trees, paths, water, grass, clearings)'
    }
  },

  images: {
    'campfire': {
      path: '/assets/images/campfire.png',
      width: 64,
      height: 64,
      zone: 'foundation',
      description: 'Foundation clearing animated campfire'
    },
    'cabin': {
      path: '/assets/images/cabin.png',
      width: 128,
      height: 128,
      zone: 'webdev',
      description: 'Web Dev Outpost landmark'
    },
    'temple': {
      path: '/assets/images/temple.png',
      width: 128,
      height: 128,
      zone: 'aiml',
      description: 'AI & ML Woods ancient temple'
    },
    'monument': {
      path: '/assets/images/monument.png',
      width: 128,
      height: 128,
      zone: 'mobile',
      description: 'Mobile Valley monolithic monument'
    },
    'mountain-peak': {
      path: '/assets/images/mountain-peak.png',
      width: 256,
      height: 256,
      zone: 'summit',
      description: 'Dark Forest Summit landmark'
    },
    'ui-modal-bg': {
      path: '/assets/images/ui-modal-bg.png',
      width: 800,
      height: 600,
      description: 'Project details and dialogue HUD modal background'
    }
  },

  audio: {
    'ambient-forest': {
      path: '/assets/audio/ambient-forest.mp3',
      loop: true,
      description: 'Atmospheric dark forest background ambient music'
    },
    'zone-discovery': {
      path: '/assets/audio/zone-discovery.mp3',
      loop: false,
      description: 'Jingle played upon entering a new forest biome'
    },
    'npc-dialogue': {
      path: '/assets/audio/npc-dialogue.mp3',
      loop: false,
      description: 'Subtle chime when dialogue prompts open'
    },
    'footstep': {
      path: '/assets/audio/footstep.mp3',
      loop: false,
      description: 'Rhythmic footstep SFX on forest terrain'
    }
  },

  fonts: {
    'pixel-font': {
      path: '/assets/fonts/pixel-font.png',
      data: '/assets/fonts/pixel-font.xml',
      type: 'bitmapFont',
      description: '8-bit retro pixel font for HUD labels and stats'
    },
    'serif-font': {
      path: '/assets/fonts/serif-font.woff2',
      type: 'webfont',
      family: 'Cinzel, Georgia, serif',
      description: 'Atmospheric serif font for storytelling and lore dialogues'
    }
  }
};

export class AssetLoader {
  /**
   * @param {Object} [customManifest] - Optional manifest overrides
   */
  constructor(customManifest = {}) {
    this.manifest = {
      spritesheets: { ...ASSET_MANIFEST.spritesheets, ...(customManifest.spritesheets || {}) },
      tilesets: { ...ASSET_MANIFEST.tilesets, ...(customManifest.tilesets || {}) },
      images: { ...ASSET_MANIFEST.images, ...(customManifest.images || {}) },
      audio: { ...ASSET_MANIFEST.audio, ...(customManifest.audio || {}) },
      fonts: { ...ASSET_MANIFEST.fonts, ...(customManifest.fonts || {}) }
    };

    this.loaded = false;
    this.progress = 0;
    this.loadErrors = [];
  }

  /**
   * Registers all assets into the active Phaser scene loader.
   * Attaches progress and completion hooks.
   * 
   * @param {Phaser.Scene} scene - Active Phaser Scene (during preload)
   * @param {Object} [options={}] - Options e.g. { generateFallbacks: true }
   */
  load(scene, options = { generateFallbacks: true }) {
    if (!scene || !scene.load) {
      console.warn('[AssetLoader] Invalid scene passed to load(). Missing scene.load loader.');
      return;
    }

    this.loaded = false;
    this.progress = 0;
    this.loadErrors = [];

    // Track load events
    scene.load.on('progress', (value) => {
      this.progress = Math.round(value * 100);
    });

    scene.load.on('filecomplete', (key, type) => {
      // Individual file loaded successfully
    });

    scene.load.on('loaderror', (fileObj) => {
      console.warn(`[AssetLoader] Asset failed to load: ${fileObj.key} (${fileObj.src})`);
      this.loadErrors.push({ key: fileObj.key, src: fileObj.src });

      // If placeholder fallback enabled, create procedural placeholder texture
      if (options.generateFallbacks && scene.textures && !scene.textures.exists(fileObj.key)) {
        this._generateFallbackTexture(scene, fileObj.key);
      }
    });

    scene.load.on('complete', () => {
      this.loaded = true;
      this.progress = 100;
    });

    // 1. Queue Spritesheets
    Object.entries(this.manifest.spritesheets).forEach(([key, asset]) => {
      scene.load.spritesheet(key, asset.path, asset.frameConfig);
    });

    // 2. Queue Tileset Images
    Object.entries(this.manifest.tilesets).forEach(([key, asset]) => {
      scene.load.image(key, asset.path);
    });

    // 3. Queue Static Landmark & UI Images
    Object.entries(this.manifest.images).forEach(([key, asset]) => {
      scene.load.image(key, asset.path);
    });

    // 4. Queue Audio
    Object.entries(this.manifest.audio).forEach(([key, asset]) => {
      scene.load.audio(key, asset.path);
    });

    // 5. Queue Fonts
    Object.entries(this.manifest.fonts).forEach(([key, asset]) => {
      if (asset.type === 'bitmapFont' && asset.data) {
        scene.load.bitmapFont(key, asset.path, asset.data);
      }
    });
  }

  /**
   * Retrieves asset metadata by name across all categories.
   * @param {string} name - Asset key
   * @returns {Object|null} Asset descriptor or null if not found
   */
  getAsset(name) {
    if (!name) return null;

    for (const category of Object.keys(this.manifest)) {
      if (this.manifest[category][name]) {
        return {
          key: name,
          category,
          ...this.manifest[category][name]
        };
      }
    }

    return null;
  }

  /**
   * Checks whether all queued assets have finished loading.
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Returns current loading progress percentage (0 - 100).
   * @returns {number}
   */
  getLoadProgress() {
    return this.progress;
  }

  /**
   * Returns the entire asset structure object.
   * @returns {Object}
   */
  getManifest() {
    return {
      spritesheets: { ...this.manifest.spritesheets },
      tilesets: { ...this.manifest.tilesets },
      images: { ...this.manifest.images },
      audio: { ...this.manifest.audio },
      fonts: { ...this.manifest.fonts }
    };
  }

  /**
   * Procedural fallback generator so game boots cleanly even before art PNGs exist.
   * @private
   */
  _generateFallbackTexture(scene, key) {
    try {
      const asset = this.getAsset(key);
      const width = asset?.width || asset?.frameConfig?.frameWidth || 32;
      const height = asset?.height || asset?.frameConfig?.frameHeight || 32;

      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0x3a3a5a, 0.8);
      graphics.fillRect(0, 0, width, height);
      graphics.lineStyle(1, 0x64ffda, 0.8);
      graphics.strokeRect(0, 0, width, height);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    } catch (e) {
      // Texture generation silent catch
    }
  }
}

// Export default singleton instance
export const assetLoader = new AssetLoader();
export default assetLoader;
