/**
 * CollisionLayer - High-Performance Spatial Collision & Pathfinding System
 * 
 * Dark Forest Portfolio Game
 * Caches walkability matrices from the tilemap, provides circular perimeter
 * collision tests, map bounds monitoring, and lightweight A* pathfinding.
 */

import { tilemapGenerator, TILES, WALKABLE_TILES, MAP_CONFIG } from '../world/TilemapGenerator.js';
import { zoneLayoutPlanner } from '../world/ZoneLayoutPlanner.js';
import CONFIG from '../config/GameConfig.js';

export const COLLISION_DEFAULTS = {
  BOUNDS: {
    minX: 0,
    maxX: 1200,
    minY: 0,
    maxY: 800
  },
  PLAYER_RADIUS: 16,
  TILE_SIZE: 32,
  SOLID_TILE_INDICES: [TILES.TREE, TILES.WATER, TILES.MOSS_ROCK]
};

export class CollisionLayer {
  /**
   * @param {Object} [options={}]
   */
  constructor(options = {}) {
    this.tileSize = options.tileSize || COLLISION_DEFAULTS.TILE_SIZE;
    this.playerRadius = options.playerRadius || COLLISION_DEFAULTS.PLAYER_RADIUS;
    this.bounds = { ...COLLISION_DEFAULTS.BOUNDS, ...(options.bounds || {}) };
    this.cols = options.cols || MAP_CONFIG.COLS;
    this.rows = options.rows || MAP_CONFIG.ROWS;

    this.walkabilityMap = [];
    this.tileData = [];

    this.initFromTilemap(options.tilemapData);
  }

  /**
   * Initializes or refreshes the cached boolean walkability matrix.
   * @param {number[][]} [tilemapData] - Optional 2D array. Defaults to TilemapGenerator.
   */
  initFromTilemap(tilemapData) {
    const rawMap = tilemapData || tilemapGenerator.generate().data;
    this.tileData = rawMap;
    this.rows = rawMap.length;
    this.cols = rawMap[0]?.length || this.cols;

    // Build fast boolean lookup matrix (row -> col -> isWalkable)
    this.walkabilityMap = Array.from({ length: this.rows }, (r, y) =>
      Array.from({ length: this.cols }, (c, x) => {
        const tile = rawMap[y][x];
        return WALKABLE_TILES.has(tile);
      })
    );
  }

  /**
   * Checks if world pixel coordinates are on a walkable tile and inside map boundaries.
   * 
   * @param {number} pixelX - World pixel X coordinate
   * @param {number} pixelY - World pixel Y coordinate
   * @returns {boolean}
   */
  isWalkable(pixelX, pixelY) {
    if (this.checkBoundsCollision(pixelX, pixelY)) {
      return false;
    }

    const gridX = Math.floor(pixelX / this.tileSize);
    const gridY = Math.floor(pixelY / this.tileSize);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return false;
    }

    return Boolean(this.walkabilityMap[gridY]?.[gridX]);
  }

  /**
   * Tests whether an entity with a circular collision radius can move to (x, y)
   * without clipping corners, obstacles, or out-of-bounds walls.
   * 
   * @param {number} x - Target center pixel X
   * @param {number} y - Target center pixel Y
   * @param {number} [radius=16] - Collision radius
   * @returns {boolean}
   */
  canMoveTo(x, y, radius = this.playerRadius) {
    // 1. Center test
    if (!this.isWalkable(x, y)) return false;

    // 2. 8-Point perimeter test around circle
    const numPoints = 8;
    const angleStep = (Math.PI * 2) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (!this.isWalkable(px, py)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves tile index at a given pixel position.
   * @param {number} pixelX
   * @param {number} pixelY
   * @returns {number} Tile ID or -1 if out of bounds
   */
  getCollisionTileAt(pixelX, pixelY) {
    const gridX = Math.floor(pixelX / this.tileSize);
    const gridY = Math.floor(pixelY / this.tileSize);

    if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
      return this.tileData[gridY]?.[gridX] ?? -1;
    }
    return -1;
  }

  /**
   * Determines whether coordinates lie outside the world boundary.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} True if out of bounds
   */
  checkBoundsCollision(x, y) {
    return (
      x < this.bounds.minX ||
      x > this.bounds.maxX ||
      y < this.bounds.minY ||
      y > this.bounds.maxY
    );
  }

  /**
   * Generates a collection of all walkable world pixel coordinates inside a zone.
   * @param {string} zoneId
   * @param {number} [samplingStep=16] - Pixel interval between sampled points
   * @returns {Array<{ x: number, y: number }>}
   */
  getWalkableAreaInZone(zoneId, samplingStep = 16) {
    const zone = zoneLayoutPlanner.getZoneLayout(zoneId);
    if (!zone) return [];

    const walkablePoints = [];
    const minX = Math.max(this.bounds.minX, zone.center.x - zone.radius);
    const maxX = Math.min(this.bounds.maxX, zone.center.x + zone.radius);
    const minY = Math.max(this.bounds.minY, zone.center.y - zone.radius);
    const maxY = Math.min(this.bounds.maxY, zone.center.y + zone.radius);

    for (let py = minY; py <= maxY; py += samplingStep) {
      for (let px = minX; px <= maxX; px += samplingStep) {
        if (Math.hypot(px - zone.center.x, py - zone.center.y) <= zone.radius) {
          if (this.isWalkable(px, py)) {
            walkablePoints.push({ x: px, y: py });
          }
        }
      }
    }

    return walkablePoints;
  }

  /**
   * Computes an A* pathfinding route between two world positions.
   * 
   * @param {number} fromX - Start pixel X
   * @param {number} fromY - Start pixel Y
   * @param {number} toX - Target pixel X
   * @param {number} toY - Target pixel Y
   * @returns {Array<{ x: number, y: number }>|null} Waypoint array or null if unreachable
   */
  getPathBetween(fromX, fromY, toX, toY) {
    const startGrid = {
      x: Math.floor(fromX / this.tileSize),
      y: Math.floor(fromY / this.tileSize)
    };
    const targetGrid = {
      x: Math.floor(toX / this.tileSize),
      y: Math.floor(toY / this.tileSize)
    };

    if (
      !this._isValidGrid(startGrid.x, startGrid.y) ||
      !this._isValidGrid(targetGrid.x, targetGrid.y)
    ) {
      return null;
    }

    // Direct line optimization
    if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) {
      return [{ x: toX, y: toY }];
    }

    // A* Priority Queue / Open and Closed Sets
    const openSet = new Set();
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const posKey = (gx, gy) => `${gx},${gy}`;
    const startKey = posKey(startGrid.x, startGrid.y);
    const targetKey = posKey(targetGrid.x, targetGrid.y);

    openSet.add(startKey);
    gScore.set(startKey, 0);
    fScore.set(startKey, this._heuristic(startGrid, targetGrid));

    const coordsFromKey = (key) => {
      const [gx, gy] = key.split(',').map(Number);
      return { x: gx, y: gy };
    };

    while (openSet.size > 0) {
      // Find lowest fScore in openSet
      let currentKey = null;
      let lowestF = Infinity;

      for (const key of openSet) {
        const score = fScore.get(key) ?? Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentKey = key;
        }
      }

      if (currentKey === targetKey) {
        // Reconstruct waypoint path
        return this._reconstructPath(cameFrom, currentKey, toX, toY);
      }

      openSet.delete(currentKey);
      closedSet.add(currentKey);

      const current = coordsFromKey(currentKey);
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        if (!this._isValidGrid(neighbor.x, neighbor.y)) continue;
        if (!this.walkabilityMap[neighbor.y][neighbor.x]) continue;

        const neighborKey = posKey(neighbor.x, neighbor.y);
        if (closedSet.has(neighborKey)) continue;

        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey);
        } else if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + this._heuristic(neighbor, targetGrid));
      }
    }

    return null; // No available path found
  }

  /**
   * Binds collision rules and Arcade Physics circle bodies to a Phaser Scene.
   * 
   * @param {Phaser.Scene} scene
   * @param {Phaser.Tilemaps.TilemapLayer} groundLayer
   * @param {Phaser.Physics.Arcade.Sprite} [playerSprite]
   */
  setupPhaserCollision(scene, groundLayer, playerSprite) {
    if (groundLayer && typeof groundLayer.setCollision === 'function') {
      groundLayer.setCollision(COLLISION_DEFAULTS.SOLID_TILE_INDICES);
    }

    if (scene?.physics && playerSprite && groundLayer) {
      // Circular body for smooth sliding around trees/corners
      if (playerSprite.body && typeof playerSprite.body.setCircle === 'function') {
        playerSprite.body.setCircle(this.playerRadius);
      }
      scene.physics.add.collider(playerSprite, groundLayer);
    }
  }

  // --- Internal Helpers ---

  _isValidGrid(gx, gy) {
    return gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows;
  }

  _heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  _reconstructPath(cameFrom, currentKey, finalTargetX, finalTargetY) {
    const waypoints = [];
    let curr = currentKey;

    while (cameFrom.has(curr)) {
      const [gx, gy] = curr.split(',').map(Number);
      waypoints.unshift({
        x: gx * this.tileSize + this.tileSize / 2,
        y: gy * this.tileSize + this.tileSize / 2
      });
      curr = cameFrom.get(curr);
    }

    // Replace final waypoint with exact pixel target
    if (waypoints.length > 0) {
      waypoints[waypoints.length - 1] = { x: finalTargetX, y: finalTargetY };
    }

    return waypoints;
  }
}

// Export singleton instance
export const collisionLayer = new CollisionLayer();
export default collisionLayer;
