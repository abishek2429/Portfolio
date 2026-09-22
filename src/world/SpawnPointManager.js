/**
 * SpawnPointManager - World Entity Spawn & Respawn Management System
 * 
 * Dark Forest Portfolio Game
 * Governs spawn positions, facing orientations, and respawn logic for
 * the player, resident NPCs, and hidden easter egg secrets. Validates
 * coordinates against tilemap walkable collision layers.
 */

import CONFIG from '../config/GameConfig.js';
import { tilemapGenerator } from './TilemapGenerator.js';
import { zoneLayoutPlanner } from './ZoneLayoutPlanner.js';

export const DEFAULT_SPAWNS = {
  player: {
    x: 600,
    y: 700,
    zoneId: 'foundation',
    facing: 'down',
    canRespawn: true,
    respawnDelay: 1000
  },

  npcs: {
    mentor: {
      id: 'mentor',
      name: 'The Mentor',
      x: 600,
      y: 650,
      zone: 'foundation',
      sprite: 'npc-mentor',
      facing: 'up'
    },
    fullstack: {
      id: 'fullstack',
      name: 'Full-Stack Dev',
      x: 300,
      y: 350,
      zone: 'webdev',
      sprite: 'npc-dev',
      facing: 'left'
    },
    ada: {
      id: 'ada',
      name: 'Ada',
      x: 200,
      y: 150,
      zone: 'aiml',
      sprite: 'npc-ada',
      facing: 'down'
    },
    mobilearch: {
      id: 'mobilearch',
      name: 'Mobile Architect',
      x: 900,
      y: 350,
      zone: 'mobile',
      sprite: 'npc-mobilearch',
      facing: 'right'
    },
    futureyou: {
      id: 'futureyou',
      name: 'Future You',
      x: 600,
      y: 50,
      zone: 'summit',
      sprite: 'npc-futureyou',
      facing: 'down'
    }
  },

  easterEggs: {
    competitive: {
      id: 'competitive',
      name: 'Competitive Programming Cave',
      x: 100,
      y: 500,
      zone: 'offmap-left'
    },
    football: {
      id: 'football',
      name: 'Football Field',
      x: 1100,
      y: 600,
      zone: 'offmap-right'
    },
    gym: {
      id: 'gym',
      name: 'Gym Location',
      x: 1000,
      y: 200,
      zone: 'offmap-right'
    },
    research: {
      id: 'research',
      name: 'Secret Research Lab',
      x: 150,
      y: 100,
      zone: 'offmap-left'
    },
    nightmode: {
      id: 'nightmode',
      name: 'Night Mode Portal',
      x: 550,
      y: 120,
      zone: 'summit-area'
    }
  }
};

export class SpawnPointManager {
  /**
   * @param {Object} [customSpawns={}] - Optional spawn overrides
   */
  constructor(customSpawns = {}) {
    this.playerSpawn = { ...DEFAULT_SPAWNS.player, ...(customSpawns.player || {}) };
    this.npcSpawns = { ...DEFAULT_SPAWNS.npcs, ...(customSpawns.npcs || {}) };
    this.easterEggSpawns = { ...DEFAULT_SPAWNS.easterEggs, ...(customSpawns.easterEggs || {}) };
    this.customOverrides = new Map();

    this._validateAllSpawns();
  }

  /**
   * Retrieves player spawn point, accounting for custom dev overrides.
   * @returns {{ x: number, y: number, zoneId: string, facing: string, canRespawn: boolean, respawnDelay: number }}
   */
  getPlayerSpawn() {
    if (this.customOverrides.has('player')) {
      const override = this.customOverrides.get('player');
      return { ...this.playerSpawn, x: override.x, y: override.y };
    }
    return { ...this.playerSpawn };
  }

  /**
   * Retrieves spawn configuration for a specific NPC.
   * @param {string} npcId
   * @returns {Object|null}
   */
  getNpcSpawn(npcId) {
    const base = this.npcSpawns[npcId];
    if (!base) return null;

    if (this.customOverrides.has(npcId)) {
      const override = this.customOverrides.get(npcId);
      return { ...base, x: override.x, y: override.y };
    }

    return { ...base };
  }

  /**
   * Returns an array of all NPC spawn point configurations.
   * @returns {Array<Object>}
   */
  getAllNpcSpawns() {
    return Object.keys(this.npcSpawns).map(id => this.getNpcSpawn(id));
  }

  /**
   * Retrieves spawn configuration for an easter egg secret.
   * @param {string} eggId
   * @returns {Object|null}
   */
  getEasterEggSpawn(eggId) {
    return this.easterEggSpawns[eggId] ? { ...this.easterEggSpawns[eggId] } : null;
  }

  /**
   * Returns an array of all easter egg secret spawn configurations.
   * @returns {Array<Object>}
   */
  getAllEasterEggSpawns() {
    return Object.values(this.easterEggSpawns);
  }

  /**
   * Verifies if a given pixel coordinate is walkable and not blocked by trees/water/rocks.
   * @param {number} x - Pixel X
   * @param {number} y - Pixel Y
   * @returns {boolean}
   */
  isValidSpawnPoint(x, y) {
    return tilemapGenerator.isWalkable(x, y);
  }

  /**
   * Finds a random walkable coordinate within a specified zone boundary.
   * @param {string} zoneId
   * @param {number} [maxAttempts=30]
   * @returns {{ x: number, y: number }} Valid coordinates, or zone center fallback
   */
  getRandomSpawnInZone(zoneId, maxAttempts = 30) {
    const zone = zoneLayoutPlanner.getZoneLayout(zoneId);
    if (!zone) return { x: 600, y: 700 };

    for (let i = 0; i < maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (zone.radius * 0.7); // Stay comfortably within clearing
      const randX = Math.round(zone.center.x + Math.cos(angle) * radius);
      const randY = Math.round(zone.center.y + Math.sin(angle) * radius);

      if (this.isValidSpawnPoint(randX, randY)) {
        return { x: randX, y: randY };
      }
    }

    // Safe fallback to zone center
    return { x: zone.center.x, y: zone.center.y };
  }

  /**
   * Sets a runtime custom spawn coordinate for testing or story checkpoints.
   * @param {string} entityId - 'player' or NPC ID
   * @param {number} x
   * @param {number} y
   */
  setCustomSpawn(entityId, x, y) {
    if (!this.isValidSpawnPoint(x, y)) {
      console.warn(`[SpawnPointManager] Custom spawn (${x}, ${y}) for "${entityId}" is on non-walkable tile.`);
    }
    this.customOverrides.set(entityId, { x, y });
  }

  /**
   * Clears a custom spawn override.
   * @param {string} entityId
   */
  clearCustomSpawn(entityId) {
    this.customOverrides.delete(entityId);
  }

  /**
   * Returns all spawn groups in a structured object.
   * @returns {{ player: Object, npcs: Object, easterEggs: Object }}
   */
  getSpawnsData() {
    return {
      player: this.getPlayerSpawn(),
      npcs: { ...this.npcSpawns },
      easterEggs: { ...this.easterEggSpawns }
    };
  }

  /**
   * Validates all initial entity coordinates against tile collisions on startup.
   * @private
   */
  _validateAllSpawns() {
    // Validate player spawn
    if (!this.isValidSpawnPoint(this.playerSpawn.x, this.playerSpawn.y)) {
      console.warn(`[SpawnPointManager] Player spawn (${this.playerSpawn.x}, ${this.playerSpawn.y}) is blocked. Finding nearest walkable tile.`);
      const fallback = this.getRandomSpawnInZone(this.playerSpawn.zoneId);
      this.playerSpawn.x = fallback.x;
      this.playerSpawn.y = fallback.y;
    }

    // Validate NPC spawns
    Object.values(this.npcSpawns).forEach(npc => {
      if (!this.isValidSpawnPoint(npc.x, npc.y)) {
        console.warn(`[SpawnPointManager] NPC "${npc.name}" spawn (${npc.x}, ${npc.y}) is blocked. Repositioning.`);
        const fallback = this.getRandomSpawnInZone(npc.zone);
        npc.x = fallback.x;
        npc.y = fallback.y;
      }
    });
  }
}

// Export singleton instance
export const spawnPointManager = new SpawnPointManager();
export default spawnPointManager;
