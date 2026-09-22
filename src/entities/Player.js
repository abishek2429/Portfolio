/**
 * Player - Pure Data & Logic Entity
 * 
 * Dark Forest Portfolio Game
 * Represents the player state, movement attributes, stats, and inventory.
 * Pure data/logic container ready to be attached to a Phaser sprite in the game loop.
 */

export const VALID_DIRECTIONS = ['up', 'down', 'left', 'right', 'idle'];
export const VALID_ANIMATION_STATES = ['idle', 'walk', 'interact'];

export class Player {
  /**
   * @param {Object} [config={}] - Initial player configuration
   */
  constructor(config = {}) {
    this.id = config.id || `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = config.name || 'Developer';

    this.position = {
      x: config.position?.x ?? 600,
      y: config.position?.y ?? 400
    };

    this.velocity = {
      x: config.velocity?.x ?? 0,
      y: config.velocity?.y ?? 0
    };

    this.direction = VALID_DIRECTIONS.includes(config.direction) ? config.direction : 'down';
    this.speed = typeof config.speed === 'number' ? config.speed : 150;
    this.isMoving = Boolean(config.isMoving);

    // Phaser Sprite reference (null initially, attached in Prompt 15)
    this.sprite = null;

    this.animationState = VALID_ANIMATION_STATES.includes(config.animationState)
      ? config.animationState
      : 'idle';

    this.currentZone = config.currentZone || null;
    this.inventory = Array.isArray(config.inventory) ? [...config.inventory] : [];

    this.stats = {
      projectsDiscovered: config.stats?.projectsDiscovered ?? 0,
      npcsMetCount: config.stats?.npcsMetCount ?? 0,
      zonesExplored: config.stats?.zonesExplored ?? 0
    };
  }

  /**
   * Updates player position coordinates and syncs with Phaser sprite if attached.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    if (typeof x === 'number') this.position.x = x;
    if (typeof y === 'number') this.position.y = y;

    // Synchronize sprite position if attached
    if (this.sprite && typeof this.sprite.setPosition === 'function') {
      this.sprite.setPosition(this.position.x, this.position.y);
    }
  }

  /**
   * Sets the direction the player is facing.
   * @param {string} dir - 'up' | 'down' | 'left' | 'right' | 'idle'
   */
  setDirection(dir) {
    if (VALID_DIRECTIONS.includes(dir)) {
      this.direction = dir;
      this.isMoving = dir !== 'idle';
    }
  }

  /**
   * Updates the current animation state.
   * @param {string} state - 'idle' | 'walk' | 'interact'
   */
  setAnimationState(state) {
    if (VALID_ANIMATION_STATES.includes(state)) {
      this.animationState = state;
    }
  }

  /**
   * Increments a specified stat by a given value.
   * @param {string} stat - Name of the stat ('projectsDiscovered', 'npcsMetCount', 'zonesExplored')
   * @param {number} [value=1] - Amount to increment
   * @returns {number} Updated stat value
   */
  addToStats(stat, value = 1) {
    if (typeof this.stats[stat] === 'number') {
      this.stats[stat] += value;
    } else {
      this.stats[stat] = value;
    }
    return this.stats[stat];
  }

  /**
   * Returns a clean copy of the player stats.
   * @returns {{ projectsDiscovered: number, npcsMetCount: number, zonesExplored: number }}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Helper to bind a Phaser Arcade Sprite to this player instance.
   * @param {Object} sprite - Phaser.Physics.Arcade.Sprite
   */
  attachSprite(sprite) {
    this.sprite = sprite;
    if (this.sprite && typeof this.sprite.setPosition === 'function') {
      this.sprite.setPosition(this.position.x, this.position.y);
    }
  }

  /**
   * Serializes player data into a clean JSON-compatible object or string.
   * Excludes non-serializable references (such as the Phaser sprite).
   * @param {boolean} [asString=false] - Whether to return JSON string instead of object
   * @returns {Object|string}
   */
  serialize(asString = false) {
    const data = {
      id: this.id,
      name: this.name,
      position: { ...this.position },
      velocity: { ...this.velocity },
      direction: this.direction,
      speed: this.speed,
      isMoving: this.isMoving,
      animationState: this.animationState,
      currentZone: this.currentZone,
      inventory: [...this.inventory],
      stats: { ...this.stats }
    };

    return asString ? JSON.stringify(data) : data;
  }

  /**
   * Restores player state from a JSON string or serialized object.
   * @param {Object|string} data - Serialized player data
   */
  deserialize(data) {
    if (!data) return;

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (parsed.id) this.id = parsed.id;
    if (parsed.name) this.name = parsed.name;

    if (parsed.position) {
      this.setPosition(parsed.position.x, parsed.position.y);
    }

    if (parsed.velocity) {
      this.velocity.x = parsed.velocity.x ?? 0;
      this.velocity.y = parsed.velocity.y ?? 0;
    }

    if (parsed.direction && VALID_DIRECTIONS.includes(parsed.direction)) {
      this.direction = parsed.direction;
    }

    if (typeof parsed.speed === 'number') {
      this.speed = parsed.speed;
    }

    if (typeof parsed.isMoving === 'boolean') {
      this.isMoving = parsed.isMoving;
    }

    if (parsed.animationState && VALID_ANIMATION_STATES.includes(parsed.animationState)) {
      this.animationState = parsed.animationState;
    }

    this.currentZone = parsed.currentZone || null;

    if (Array.isArray(parsed.inventory)) {
      this.inventory = [...parsed.inventory];
    }

    if (parsed.stats) {
      this.stats = {
        projectsDiscovered: parsed.stats.projectsDiscovered ?? 0,
        npcsMetCount: parsed.stats.npcsMetCount ?? 0,
        zonesExplored: parsed.stats.zonesExplored ?? 0
      };
    }
  }
}

export default Player;
