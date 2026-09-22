/**
 * SaveManager - Client-Side Persistence System
 * 
 * Dark Forest Portfolio Game
 * Manages game state and player data serialization to/from browser localStorage.
 * Handles validation, versioning, data sanitization, import/export, and quota errors.
 */

export const STORAGE_KEY = 'darkForestSave';
export const CURRENT_SAVE_VERSION = '1.0';

export class SaveManager {
  /**
   * Singleton pattern
   */
  constructor(storageKey = STORAGE_KEY) {
    if (SaveManager._instance) {
      return SaveManager._instance;
    }

    this.storageKey = storageKey;
    this.version = CURRENT_SAVE_VERSION;
    SaveManager._instance = this;
  }

  /**
   * Checks whether localStorage is supported and accessible in the current environment.
   * @returns {boolean}
   */
  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__dark_forest_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Serializes and writes gameState and playerData to localStorage.
   * 
   * @param {Object} gameState - GameState instance or plain state object
   * @param {Object} playerData - Player instance or plain player object
   * @returns {boolean} Success status
   */
  save(gameState, playerData) {
    if (!this.isStorageAvailable()) {
      console.warn('[SaveManager] localStorage is not available in this environment.');
      return false;
    }

    try {
      // Normalize state data
      const rawGameState = typeof gameState?.getCurrentState === 'function'
        ? gameState.getCurrentState()
        : (gameState || {});

      // Normalize player data
      const rawPlayerData = typeof playerData?.serialize === 'function'
        ? playerData.serialize(false)
        : (playerData || {});

      const sanitizedGameState = this._sanitizeGameState(rawGameState);
      const sanitizedPlayerData = this._sanitizePlayerData(rawPlayerData);

      const savePayload = {
        version: this.version,
        timestamp: new Date().toISOString(),
        gameState: sanitizedGameState,
        playerData: sanitizedPlayerData
      };

      const serialized = JSON.stringify(savePayload);
      window.localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      this._handleStorageError('save', error);
      return false;
    }
  }

  /**
   * Loads and deserializes save data from localStorage.
   * 
   * @returns {{ gameState: Object, playerData: Object, timestamp: string, version: string }|null}
   */
  load() {
    if (!this.isStorageAvailable()) return null;

    try {
      const rawData = window.localStorage.getItem(this.storageKey);
      if (!rawData) return null;

      const parsed = JSON.parse(rawData);

      // Validate integrity and version
      if (!this._validateSaveData(parsed)) {
        console.warn('[SaveManager] Save data failed integrity validation.');
        return null;
      }

      return {
        version: parsed.version,
        timestamp: parsed.timestamp,
        gameState: this._sanitizeGameState(parsed.gameState),
        playerData: this._sanitizePlayerData(parsed.playerData)
      };
    } catch (error) {
      this._handleStorageError('load', error);
      return null;
    }
  }

  /**
   * Checks if a valid saved game currently exists.
   * @returns {boolean}
   */
  hasSavedGame() {
    if (!this.isStorageAvailable()) return false;
    try {
      return Boolean(window.localStorage.getItem(this.storageKey));
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves high-level metadata without parsing the entire deep state.
   * @returns {{ timestamp: string, progress: number, playerName: string, currentZone: string, version: string }|null}
   */
  getSaveInfo() {
    const save = this.load();
    if (!save) return null;

    return {
      version: save.version,
      timestamp: save.timestamp,
      progress: save.gameState?.gameProgress ?? 0,
      playerName: save.playerData?.name || 'Developer',
      currentZone: save.gameState?.currentZone || 'foundation'
    };
  }

  /**
   * Clears the current save file from localStorage.
   * @returns {boolean} Success status
   */
  deleteSave() {
    if (!this.isStorageAvailable()) return false;
    try {
      window.localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      this._handleStorageError('deleteSave', error);
      return false;
    }
  }

  /**
   * Generates a downloadable JSON string of the current save data.
   * Optionally triggers a browser file download if requested.
   * 
   * @param {boolean} [triggerDownload=false]
   * @returns {string|null}
   */
  exportSave(triggerDownload = false) {
    if (!this.isStorageAvailable()) return null;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;

      if (triggerDownload && typeof document !== 'undefined') {
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dark-forest-save-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return raw;
    } catch (error) {
      this._handleStorageError('exportSave', error);
      return null;
    }
  }

  /**
   * Imports a save from a JSON string, validates it, and writes to localStorage.
   * 
   * @param {string} jsonString - The serialized save JSON string
   * @returns {boolean} Success status
   */
  importSave(jsonString) {
    if (!this.isStorageAvailable() || !jsonString) return false;

    try {
      const parsed = JSON.parse(jsonString);

      if (!this._validateSaveData(parsed)) {
        console.error('[SaveManager] Imported file contains invalid or corrupted save data.');
        return false;
      }

      const sanitized = {
        version: parsed.version || this.version,
        timestamp: parsed.timestamp || new Date().toISOString(),
        gameState: this._sanitizeGameState(parsed.gameState),
        playerData: this._sanitizePlayerData(parsed.playerData)
      };

      window.localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
      return true;
    } catch (error) {
      this._handleStorageError('importSave', error);
      return false;
    }
  }

  // --- Internal Validation & Sanitization Helpers ---

  /**
   * Validates the structure and version compatibility of the save payload.
   * @private
   */
  _validateSaveData(data) {
    if (!data || typeof data !== 'object') return false;

    // Check version
    if (!data.version || typeof data.version !== 'string') return false;
    const majorVersion = data.version.split('.')[0];
    const currentMajor = this.version.split('.')[0];
    if (majorVersion !== currentMajor) {
      console.warn(`[SaveManager] Incompatible save version: ${data.version} (Expected ${this.version})`);
      return false;
    }

    // Check presence of core objects
    if (!data.gameState || typeof data.gameState !== 'object') return false;
    if (!data.playerData || typeof data.playerData !== 'object') return false;

    return true;
  }

  /**
   * Sanitizes GameState fields, enforcing expected types and discarding unexpected keys.
   * @private
   */
  _sanitizeGameState(state = {}) {
    return {
      zonesVisited: Array.isArray(state.zonesVisited) ? [...state.zonesVisited] : ['foundation'],
      npcsInteracted: state.npcsInteracted && typeof state.npcsInteracted === 'object'
        ? { ...state.npcsInteracted }
        : {},
      projectsClicked: Array.isArray(state.projectsClicked) ? [...state.projectsClicked] : [],
      achievementsUnlocked: Array.isArray(state.achievementsUnlocked) ? [...state.achievementsUnlocked] : [],
      playerPosition: {
        x: typeof state.playerPosition?.x === 'number' ? state.playerPosition.x : 600,
        y: typeof state.playerPosition?.y === 'number' ? state.playerPosition.y : 400
      },
      currentZone: typeof state.currentZone === 'string' ? state.currentZone : 'foundation',
      gameProgress: typeof state.gameProgress === 'number' ? Math.min(100, Math.max(0, state.gameProgress)) : 0,
      unlocks: {
        summitAccessible: Boolean(state.unlocks?.summitAccessible),
        nightModeUnlocked: Boolean(state.unlocks?.nightModeUnlocked),
        secretShrineUnlocked: Boolean(state.unlocks?.secretShrineUnlocked)
      }
    };
  }

  /**
   * Sanitizes PlayerData fields, removing non-serializable properties or arbitrary inputs.
   * @private
   */
  _sanitizePlayerData(player = {}) {
    return {
      id: typeof player.id === 'string' ? player.id : `player_${Date.now()}`,
      name: typeof player.name === 'string' ? player.name : 'Developer',
      position: {
        x: typeof player.position?.x === 'number' ? player.position.x : 600,
        y: typeof player.position?.y === 'number' ? player.position.y : 400
      },
      velocity: {
        x: typeof player.velocity?.x === 'number' ? player.velocity.x : 0,
        y: typeof player.velocity?.y === 'number' ? player.velocity.y : 0
      },
      direction: typeof player.direction === 'string' ? player.direction : 'down',
      speed: typeof player.speed === 'number' ? player.speed : 150,
      isMoving: Boolean(player.isMoving),
      animationState: typeof player.animationState === 'string' ? player.animationState : 'idle',
      currentZone: typeof player.currentZone === 'string' ? player.currentZone : null,
      inventory: Array.isArray(player.inventory) ? [...player.inventory] : [],
      stats: {
        projectsDiscovered: Number(player.stats?.projectsDiscovered) || 0,
        npcsMetCount: Number(player.stats?.npcsMetCount) || 0,
        zonesExplored: Number(player.stats?.zonesExplored) || 0
      }
    };
  }

  /**
   * Graceful error handler for localStorage operations.
   * @private
   */
  _handleStorageError(action, error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('[SaveManager] Quota exceeded: localStorage is full.');
    } else {
      console.error(`[SaveManager] Error during ${action}:`, error);
    }
  }
}

// Export singleton instance
export const saveManager = new SaveManager();
export default saveManager;
