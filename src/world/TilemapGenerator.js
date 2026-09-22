/**
 * TilemapGenerator - Dark Forest World Layout Generator
 * 
 * Generates a 38x25 handcrafted tilemap (1216x800 px at 32px tiles)
 * featuring 5 thematic biomes, organic connecting stone paths,
 * natural tree boundaries, and easter egg alcoves.
 */

import CONFIG from '../config/GameConfig.js';

export const MAP_CONFIG = {
  COLS: 38,
  ROWS: 25,
  TILE_SIZE: 32
};

export const TILES = {
  GRASS: 0,        // Walkable primary clearing terrain
  DARK_GRASS: 1,   // Walkable shaded forest floor
  TREE: 2,         // Non-walkable dense pine/oak boundaries
  WATER: 3,        // Non-walkable river and brook tiles
  STONE_PATH: 4,   // Walkable cobbled connector trails
  MOSS_ROCK: 5,    // Non-walkable ancient boulders
  MUSHROOM: 6,     // Walkable mystical glowing fungi decoration
  EMPTY: 7         // Walkable clearing interior / building footprint
};

// Set of all tiles the player can traverse
export const WALKABLE_TILES = new Set([
  TILES.GRASS,
  TILES.DARK_GRASS,
  TILES.STONE_PATH,
  TILES.MUSHROOM,
  TILES.EMPTY
]);

export class TilemapGenerator {
  /**
   * @param {Object} [options={}] - Custom dimensions or overrides
   */
  constructor(options = {}) {
    this.cols = options.cols || MAP_CONFIG.COLS;
    this.rows = options.rows || MAP_CONFIG.ROWS;
    this.tileSize = options.tileSize || MAP_CONFIG.TILE_SIZE;
    this.grid = [];
  }

  /**
   * Generates the handcrafted 38x25 tilemap 2D array.
   * 
   * @returns {{ data: number[][], width: number, height: number, tileWidth: number, tileHeight: number }}
   */
  generate() {
    // 1. Initialize grid with deep forest (mix of trees and dark grass)
    this.grid = Array.from({ length: this.rows }, (r, y) =>
      Array.from({ length: this.cols }, (c, x) => {
        // Outer perimeter is always dense protective trees
        if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
          return TILES.TREE;
        }
        // General background forest fill
        return (x + y * 3) % 7 === 0 ? TILES.TREE : TILES.DARK_GRASS;
      })
    );

    // 2. Carve Zone Clearings (using circular organic brush)
    this._carveClearings();

    // 3. Carve Easter Egg Hidden Clearings
    this._carveEasterEggAlcoves();

    // 4. Carve Interconnecting Stone Paths
    this._carveConnectingPaths();

    // 5. Scatter Nature Details (Moss rocks, mystical mushrooms, and stream)
    this._addWorldDecorations();

    return {
      data: this.grid,
      width: this.cols,
      height: this.rows,
      tileWidth: this.tileSize,
      tileHeight: this.tileSize
    };
  }

  /**
   * Retrieves tile index at grid position (col x, row y).
   * @param {number} x - Grid column (0 - 37)
   * @param {number} y - Grid row (0 - 24)
   * @returns {number} Tile index or -1 if out of bounds
   */
  getTileAt(x, y) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      return this.grid[y][x];
    }
    return -1;
  }

  /**
   * Modifies a tile index at grid coordinates.
   * @param {number} x - Grid column
   * @param {number} y - Grid row
   * @param {number} tileIndex - Target tile ID
   */
  setTile(x, y, tileIndex) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[y][x] = tileIndex;
    }
  }

  /**
   * Checks whether a coordinate is walkable.
   * Supports both grid coordinates (x < 40) and pixel coordinates (x >= 40).
   * 
   * @param {number} x - Grid or pixel X
   * @param {number} y - Grid or pixel Y
   * @returns {boolean}
   */
  isWalkable(x, y) {
    const gridX = x >= this.cols ? Math.floor(x / this.tileSize) : Math.floor(x);
    const gridY = y >= this.rows ? Math.floor(y / this.tileSize) : Math.floor(y);

    const tile = this.getTileAt(gridX, gridY);
    if (tile === -1) return false;

    return WALKABLE_TILES.has(tile);
  }

  /**
   * Determines active zone ID based on pixel coordinates.
   * Checks proximity against zone radii defined in CONFIG.ZONES.
   * 
   * @param {number} pixelX - World pixel X coordinate
   * @param {number} pixelY - World pixel Y coordinate
   * @returns {string} Zone ID or 'wilderness'
   */
  getZoneAtPosition(pixelX, pixelY) {
    for (const [zoneKey, zone] of Object.entries(CONFIG.ZONES)) {
      const distance = Math.hypot(pixelX - zone.x, pixelY - zone.y);
      if (distance <= zone.radius) {
        return zone.id;
      }
    }
    return 'wilderness';
  }

  /**
   * Exports the tilemap into standard Tiled JSON format.
   * @returns {Object} Tiled-compatible JSON structure
   */
  toJSON() {
    const flatData = this.grid.flat().map(val => val + 1); // Tiled uses 1-indexed tile IDs (0 is empty)

    return {
      compressionlevel: -1,
      height: this.rows,
      width: this.cols,
      infinite: false,
      layers: [
        {
          data: flatData,
          height: this.rows,
          id: 1,
          name: 'GroundLayer',
          opacity: 1,
          type: 'tilelayer',
          visible: true,
          width: this.cols,
          x: 0,
          y: 0
        }
      ],
      nextlayerid: 2,
      nextobjectid: 1,
      orientation: 'orthogonal',
      renderorder: 'right-down',
      tileheight: this.tileSize,
      tilesets: [
        {
          columns: 8,
          firstgid: 1,
          image: '/assets/tilesets/forest-tiles.png',
          imageheight: 32,
          imagewidth: 256,
          margin: 0,
          name: 'forest-tiles',
          spacing: 0,
          tilecount: 8,
          tileheight: this.tileSize,
          tilewidth: this.tileSize
        }
      ],
      tilewidth: this.tileSize,
      type: 'map',
      version: '1.9'
    };
  }

  // --- Handcrafted Geometry & Layout Helpers ---

  /**
   * Carves the primary circular clearings for each zone
   * @private
   */
  _carveClearings() {
    const clearings = [
      // Foundation Clearing (Center Bottom)
      { cx: 19, cy: 21, radius: 4.5, fill: TILES.GRASS },
      // Web Dev Outpost (Left Center)
      { cx: 9, cy: 12, radius: 4.2, fill: TILES.GRASS },
      // AI & ML Woods (Top Left)
      { cx: 6, cy: 6, radius: 4.0, fill: TILES.GRASS },
      // Mobile Valley (Right Center)
      { cx: 28, cy: 12, radius: 4.5, fill: TILES.GRASS },
      // The Summit (Top Center Plateau)
      { cx: 19, cy: 3, radius: 5.0, fill: TILES.GRASS }
    ];

    clearings.forEach(({ cx, cy, radius, fill }) => {
      this._carveCircle(cx, cy, radius, fill);
    });
  }

  /**
   * Carves hidden alcoves for easter egg exploration
   * @private
   */
  _carveEasterEggAlcoves() {
    const eggs = [
      { cx: 3, cy: 15, r: 2.2 },  // Competitive Programming Cave
      { cx: 34, cy: 18, r: 2.8 }, // Football Field
      { cx: 31, cy: 6, r: 2.5 },  // Gym Location
      { cx: 5, cy: 3, r: 2.2 },   // Secret Research Lab
      { cx: 17, cy: 4, r: 2.0 }   // Night Mode Portal
    ];

    eggs.forEach(({ cx, cy, r }) => {
      this._carveCircle(cx, cy, r, TILES.GRASS);
    });
  }

  /**
   * Connects all major zones with winding stone path corridors
   * @private
   */
  _carveConnectingPaths() {
    // 1. Foundation (19, 21) -> Central Trunk (19, 12) -> Summit (19, 3)
    this._carvePath(19, 21, 19, 3, 1.2);

    // 2. Foundation (19, 21) -> Web Dev Outpost (9, 12)
    this._carvePath(19, 20, 9, 12, 1.2);

    // 3. Web Dev Outpost (9, 12) -> AI & ML Woods (6, 6)
    this._carvePath(9, 12, 6, 6, 1.2);

    // 4. Foundation (19, 21) -> Mobile Valley (28, 12)
    this._carvePath(19, 20, 28, 12, 1.2);

    // 5. Mobile Valley (28, 12) -> The Summit (19, 3)
    this._carvePath(28, 12, 19, 4, 1.2);

    // 6. AI & ML Woods (6, 6) -> The Summit (19, 3)
    this._carvePath(6, 6, 18, 4, 1.2);

    // Secret paths to easter eggs
    this._carvePath(9, 13, 3, 15, 0.8);   // Webdev -> Competitive Cave
    this._carvePath(28, 14, 34, 18, 0.8); // Mobile -> Football Field
    this._carvePath(28, 11, 31, 6, 0.8);  // Mobile -> Gym
    this._carvePath(6, 5, 5, 3, 0.8);     // AIML -> Research Lab
  }

  /**
   * Adds decorative boulders, mushrooms, and water stream
   * @private
   */
  _addWorldDecorations() {
    // Mobile Valley water stream on eastern rim
    for (let y = 8; y <= 16; y++) {
      const x = 32 + Math.floor(Math.sin(y * 0.8) * 1.5);
      if (x < this.cols - 1) {
        this.setTile(x, y, TILES.WATER);
        if (x + 1 < this.cols - 1) this.setTile(x + 1, y, TILES.WATER);
      }
    }

    // Ancient boulders around Summit and AI Woods
    const rocks = [
      [16, 2], [22, 2], [15, 5], [23, 5], // Summit perimeter
      [4, 7], [8, 5], [5, 8],             // AI Woods temple ruins
      [8, 10], [10, 14],                  // Web Dev Outpost
      [26, 10], [30, 14],                 // Mobile Valley
      [17, 22], [21, 22]                  // Foundation campfire circle
    ];
    rocks.forEach(([rx, ry]) => {
      if (this.getTileAt(rx, ry) === TILES.GRASS) {
        this.setTile(rx, ry, TILES.MOSS_ROCK);
      }
    });

    // Magical mushrooms on clearing fringes
    const mushrooms = [
      [18, 20], [20, 20], [19, 22], // Foundation
      [8, 11], [10, 13],            // Webdev
      [7, 6], [5, 7],               // AIML
      [27, 13], [29, 11],           // Mobile
      [18, 4], [20, 4]              // Summit
    ];
    mushrooms.forEach(([mx, my]) => {
      if (this.getTileAt(mx, my) === TILES.GRASS) {
        this.setTile(mx, my, TILES.MUSHROOM);
      }
    });
  }

  /**
   * Fills an organic circular region
   * @private
   */
  _carveCircle(cx, cy, radius, tile) {
    const rCeil = Math.ceil(radius);
    for (let y = Math.max(1, cy - rCeil); y <= Math.min(this.rows - 2, cy + rCeil); y++) {
      for (let x = Math.max(1, cx - rCeil); x <= Math.min(this.cols - 2, cx + rCeil); x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= radius) {
          this.setTile(x, y, tile);
        } else if (dist <= radius + 0.8 && this.getTileAt(x, y) === TILES.TREE) {
          // Soften border with dark grass
          this.setTile(x, y, TILES.DARK_GRASS);
        }
      }
    }
  }

  /**
   * Carves a winding stone path between two grid coordinates
   * @private
   */
  _carvePath(x1, y1, x2, y2, width = 1) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curX = Math.round(x1 + (x2 - x1) * t);
      const curY = Math.round(y1 + (y2 - y1) * t);

      for (let dy = -Math.floor(width); dy <= Math.floor(width); dy++) {
        for (let dx = -Math.floor(width); dx <= Math.floor(width); dx++) {
          const px = curX + dx;
          const py = curY + dy;
          if (px > 0 && px < this.cols - 1 && py > 0 && py < this.rows - 1) {
            if (Math.hypot(dx, dy) <= width) {
              this.setTile(px, py, TILES.STONE_PATH);
            }
          }
        }
      }
    }
  }
}

// Export singleton helper
export const tilemapGenerator = new TilemapGenerator();
export const generateTilemap = (options) => new TilemapGenerator(options).generate();

export default tilemapGenerator;
