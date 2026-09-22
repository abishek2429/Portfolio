/**
 * MovementController - Analog Player Movement & Obstacle Sliding System
 * 
 * Dark Forest Portfolio Game
 * Governs continuous WASD & arrow-key movement, diagonal vector normalization,
 * obstacle sliding around trees and rocks, input locking during dialogue/modals,
 * and high-frequency EventBus spatial emissions.
 */

import eventBus, { GAME_EVENTS } from '../events/EventBus.js';
import CONFIG from '../config/GameConfig.js';
import { collisionLayer } from '../physics/CollisionLayer.js';
import { zoneLayoutPlanner } from '../world/ZoneLayoutPlanner.js';

export class MovementController {
  constructor() {
    this.scene = null;
    this.player = null; // PlayerCharacter instance
    this.speed = CONFIG.GAME.PLAYER_SPEED || 150;
    this.locked = false;

    this.keys = null;
    this.lastDirection = 'down';
    this.wasMoving = false;
    this.lastPosition = { x: 0, y: 0 };
    this.lastZone = 'foundation';
  }

  /**
   * Initializes the movement controller and binds keyboard listeners.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} player - PlayerCharacter instance
   */
  create(scene, player) {
    this.scene = scene;
    this.player = player;

    if (scene?.input?.keyboard) {
      this.keys = {
        cursors: scene.input.keyboard.createCursorKeys(),
        wasd: scene.input.keyboard.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          right: Phaser.Input.Keyboard.KeyCodes.D
        })
      };
    }

    const pos = this.player.getPosition();
    this.lastPosition = { ...pos };
    this.lastDirection = this.player.getDirection() || 'down';
    this.lastZone = zoneLayoutPlanner.getZoneByPosition(pos.x, pos.y) || 'foundation';

    return this;
  }

  /**
   * Evaluates input, executes collision/sliding checks, and applies velocity.
   * Called every frame in the scene's update() loop.
   * 
   * @param {number} delta - Frame delta time in milliseconds
   */
  update(delta = 16.67) {
    if (!this.player || !this.player.sprite?.body) return;

    // If movement is locked (modals, dialogue, cutscenes), halt immediately
    if (this.locked) {
      if (this.wasMoving) {
        this.player.setVelocity(0, 0);
        this.player.setAnimationState('idle');
        this.wasMoving = false;
        this._emitStopEvent();
      }
      return;
    }

    // 1. Calculate raw directional intent from keyboard input
    const { vx, vy, direction } = this.handleInput();

    const isMoving = Math.abs(vx) > 0 || Math.abs(vy) > 0;
    const currentPos = this.player.getPosition();
    const dtSeconds = Math.min(delta / 1000, 0.1); // Clamp against huge lag spikes

    if (isMoving) {
      // 2. Predictive collision testing with obstacle sliding
      const targetX = currentPos.x + vx * dtSeconds;
      const targetY = currentPos.y + vy * dtSeconds;

      const canMoveBoth = collisionLayer.canMoveTo(targetX, targetY);

      if (canMoveBoth) {
        this.player.setVelocity(vx, vy);
      } else {
        // Try sliding along perpendicular axes
        const canMoveX = collisionLayer.canMoveTo(targetX, currentPos.y);
        const canMoveY = collisionLayer.canMoveTo(currentPos.x, targetY);

        if (canMoveX && !canMoveY) {
          this.player.setVelocity(vx, 0);
        } else if (canMoveY && !canMoveX) {
          this.player.setVelocity(0, vy);
        } else {
          // Blocked on both axes
          this.player.setVelocity(0, 0);
        }
      }

      // Update direction and animation
      if (direction && direction !== this.lastDirection) {
        this.lastDirection = direction;
        this.player.setDirection(direction);
        eventBus.emit('playerDirectionChanged', { direction });
      }

      this.player.setAnimationState('walk');
      this.wasMoving = true;

      // 3. Emit real-time spatial movement event
      const updatedPos = this.player.getPosition();
      const currentZone = zoneLayoutPlanner.getZoneByPosition(updatedPos.x, updatedPos.y) || 'wilderness';

      eventBus.emit(GAME_EVENTS.PLAYER_MOVED, {
        x: updatedPos.x,
        y: updatedPos.y,
        direction: this.lastDirection,
        zone: currentZone
      });

      this.lastPosition = { ...updatedPos };
      this.lastZone = currentZone;
    } else {
      // Stopped moving
      if (this.wasMoving) {
        this.player.setVelocity(0, 0);
        this.player.setAnimationState('idle');
        this.wasMoving = false;
        this._emitStopEvent();
      }
    }
  }

  /**
   * Processes active keys and returns a normalized velocity vector.
   * @returns {{ vx: number, vy: number, direction: string|null }}
   */
  handleInput() {
    if (!this.keys) return { vx: 0, vy: 0, direction: null };

    const { cursors, wasd } = this.keys;

    const up = cursors.up.isDown || wasd.up.isDown;
    const down = cursors.down.isDown || wasd.down.isDown;
    const left = cursors.left.isDown || wasd.left.isDown;
    const right = cursors.right.isDown || wasd.right.isDown;

    let dirX = 0;
    let dirY = 0;

    // Opposite inputs cancel out
    if (left && !right) dirX = -1;
    else if (right && !left) dirX = 1;

    if (up && !down) dirY = -1;
    else if (down && !up) dirY = 1;

    if (dirX === 0 && dirY === 0) {
      return { vx: 0, vy: 0, direction: null };
    }

    // Determine primary facing direction
    let direction = this.lastDirection;
    if (dirY === -1) direction = 'up';
    else if (dirY === 1) direction = 'down';
    else if (dirX === -1) direction = 'left';
    else if (dirX === 1) direction = 'right';

    // Normalize diagonal velocity so diagonal movement is not faster
    if (dirX !== 0 && dirY !== 0) {
      const invSqrt = Math.SQRT1_2; // ~0.7071
      dirX *= invSqrt;
      dirY *= invSqrt;
    }

    const vx = Math.round(dirX * this.speed);
    const vy = Math.round(dirY * this.speed);

    return { vx, vy, direction };
  }

  /**
   * Sets player base movement speed in pixels per second.
   * @param {number} speed
   */
  setPlayerSpeed(speed) {
    if (typeof speed === 'number' && speed > 0) {
      this.speed = speed;
    }
  }

  /**
   * Checks whether the player is currently in motion.
   * @returns {boolean}
   */
  isPlayerMoving() {
    return this.wasMoving;
  }

  /**
   * Returns active or last facing direction.
   * @returns {string} 'up' | 'down' | 'left' | 'right'
   */
  getMovementDirection() {
    return this.lastDirection;
  }

  /**
   * Locks or unlocks player movement input.
   * @param {boolean} locked
   */
  lockMovement(locked) {
    this.locked = Boolean(locked);
    if (this.locked && this.player) {
      this.player.setVelocity(0, 0);
      this.player.setAnimationState('idle');
      this.wasMoving = false;
      this._emitStopEvent();
    }
  }

  /**
   * Returns current input lock state.
   * @returns {boolean}
   */
  isMovementLocked() {
    return this.locked;
  }

  _emitStopEvent() {
    eventBus.emit('playerStopped', {
      x: this.lastPosition.x,
      y: this.lastPosition.y,
      lastDirection: this.lastDirection
    });
  }
}

export const movementController = new MovementController();
export default movementController;
