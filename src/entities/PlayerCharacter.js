/**
 * PlayerCharacter - Visual Representation & Physics Controller
 * 
 * Dark Forest Portfolio Game
 * Manages the player's 8-frame 4-directional sprite, animation state machine,
 * circular Arcade Physics body, and movement velocity bindings.
 */

import { Player } from './Player.js';
import CONFIG from '../config/GameConfig.js';
import { spawnPointManager } from '../world/SpawnPointManager.js';

export const PLAYER_ANIMATIONS = {
  IDLE_UP: 'idle-up',
  IDLE_DOWN: 'idle-down',
  IDLE_LEFT: 'idle-left',
  IDLE_RIGHT: 'idle-right',
  WALK_UP: 'walk-up',
  WALK_DOWN: 'walk-down',
  WALK_LEFT: 'walk-left',
  WALK_RIGHT: 'walk-right'
};

export class PlayerCharacter {
  constructor(dataModel = null) {
    this.scene = null;
    this.sprite = null;
    this.direction = 'down';
    this.animState = 'idle';
    this.dataModel = dataModel || new Player();
    this.radius = 16;
  }

  /**
   * Spawns the player sprite with circular Arcade Physics body and initializes animations.
   * 
   * @param {Phaser.Scene} scene
   * @param {number} [x] - Initial X coordinate
   * @param {number} [y] - Initial Y coordinate
   * @returns {Phaser.Physics.Arcade.Sprite} The instantiated player sprite
   */
  create(scene, x, y) {
    this.scene = scene;

    const spawn = spawnPointManager.getPlayerSpawn();
    const spawnX = typeof x === 'number' ? x : spawn.x;
    const spawnY = typeof y === 'number' ? y : spawn.y;

    // Ensure spritesheet or procedural fallback exists
    this._ensurePlayerTexture(scene);

    // Create animations
    this._initAnimations(scene);

    // Instantiate Arcade Physics Sprite
    this.sprite = scene.physics.add.sprite(spawnX, spawnY, 'player-sprite', 1);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(20); // Above ground tiles, landmarks, and shadows

    // Configure circular physics body
    if (this.sprite.body) {
      this.sprite.body.setCircle(this.radius);
      this.sprite.body.setCollideWorldBounds(true);
      this.sprite.body.setBounce(0);
      this.sprite.body.setMass(1);
      this.sprite.body.setDrag(0, 0);
      this.sprite.body.setFriction(1, 1);
    }

    // Connect with pure data model (Prompt 3)
    this.dataModel.setPosition(spawnX, spawnY);
    this.dataModel.attachSprite(this.sprite);

    this.setDirection(spawn.facing || 'down');
    this.setAnimationState('idle');

    return this.sprite;
  }

  /**
   * Updates facing direction ('up', 'down', 'left', 'right').
   * @param {string} direction
   */
  setDirection(direction) {
    const valid = ['up', 'down', 'left', 'right'];
    if (!valid.includes(direction)) return;

    this.direction = direction;
    this.dataModel.setDirection(direction);

    // Update active animation to match facing direction
    this._syncAnimation();
  }

  /**
   * Updates movement animation state ('idle' | 'walk').
   * @param {string} state
   */
  setAnimationState(state) {
    if (state !== 'idle' && state !== 'walk') return;

    this.animState = state;
    this.dataModel.setAnimationState(state);
    this._syncAnimation();
  }

  /**
   * Directly triggers a specific animation key.
   * @param {string} animKey
   */
  playAnimation(animKey) {
    if (!this.sprite || !this.scene?.anims?.exists(animKey)) return;

    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
    }
  }

  /**
   * Sets velocity vector on the player's Arcade Physics body.
   * @param {number} vx - Horizontal velocity in px/sec
   * @param {number} vy - Vertical velocity in px/sec
   */
  setVelocity(vx, vy) {
    if (!this.sprite?.body) return;

    this.sprite.setVelocity(vx, vy);
    this.dataModel.velocity = { x: vx, y: vy };

    // Automatically update movement state based on velocity
    const moving = Math.abs(vx) > 1 || Math.abs(vy) > 1;
    this.setAnimationState(moving ? 'walk' : 'idle');
  }

  /**
   * Returns current world pixel coordinates.
   * @returns {{ x: number, y: number }}
   */
  getPosition() {
    if (this.sprite) {
      return { x: this.sprite.x, y: this.sprite.y };
    }
    return { ...this.dataModel.position };
  }

  /**
   * Teleports player sprite and synchronizes data model.
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    if (this.sprite) {
      this.sprite.setPosition(x, y);
    }
    this.dataModel.setPosition(x, y);
  }

  /**
   * Returns current direction string ('up', 'down', 'left', 'right').
   * @returns {string}
   */
  getDirection() {
    return this.direction;
  }

  /**
   * Checks whether the character is currently moving.
   * @returns {boolean}
   */
  isMoving() {
    if (!this.sprite?.body) return false;
    return (
      Math.abs(this.sprite.body.velocity.x) > 1 ||
      Math.abs(this.sprite.body.velocity.y) > 1
    );
  }

  /**
   * Returns player serialization data for save/load persistence.
   * @returns {{ x: number, y: number, direction: string, animState: string }}
   */
  serialize() {
    const pos = this.getPosition();
    return {
      x: pos.x,
      y: pos.y,
      direction: this.direction,
      animState: this.animState
    };
  }

  // --- Internal Helpers ---

  _syncAnimation() {
    const animKey = `${this.animState}-${this.direction}`;
    this.playAnimation(animKey);
  }

  _initAnimations(scene) {
    if (scene.anims.exists(PLAYER_ANIMATIONS.IDLE_DOWN)) return;

    // Row 1: Idle (frames 0 to 3)
    scene.anims.create({
      key: PLAYER_ANIMATIONS.IDLE_UP,
      frames: [{ key: 'player-sprite', frame: 0 }],
      frameRate: 0
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.IDLE_DOWN,
      frames: [{ key: 'player-sprite', frame: 1 }],
      frameRate: 0
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.IDLE_LEFT,
      frames: [{ key: 'player-sprite', frame: 2 }],
      frameRate: 0
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.IDLE_RIGHT,
      frames: [{ key: 'player-sprite', frame: 3 }],
      frameRate: 0
    });

    // Row 2: Walk cycles (cycles between idle and walk frame for fluid step animation)
    scene.anims.create({
      key: PLAYER_ANIMATIONS.WALK_UP,
      frames: [
        { key: 'player-sprite', frame: 0 },
        { key: 'player-sprite', frame: 4 }
      ],
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.WALK_DOWN,
      frames: [
        { key: 'player-sprite', frame: 1 },
        { key: 'player-sprite', frame: 5 }
      ],
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.WALK_LEFT,
      frames: [
        { key: 'player-sprite', frame: 2 },
        { key: 'player-sprite', frame: 6 }
      ],
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: PLAYER_ANIMATIONS.WALK_RIGHT,
      frames: [
        { key: 'player-sprite', frame: 3 },
        { key: 'player-sprite', frame: 7 }
      ],
      frameRate: 10,
      repeat: -1
    });
  }

  _ensurePlayerTexture(scene) {
    if (scene.textures.exists('player-sprite')) return;

    // Procedural 8-frame 32x32 developer spritesheet fallback (4 idle + 4 walk)
    const canvas = scene.textures.createCanvas('player-sprite', 128, 64);
    const ctx = canvas.getContext();

    // Row 1: Idle (Up:0, Down:1, Left:2, Right:3)
    // Row 2: Walk (Up:4, Down:5, Left:6, Right:7)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const ox = col * 32;
        const oy = row * 32;

        // Dark developer hoodie / shirt
        ctx.fillStyle = '#1e2433';
        ctx.fillRect(ox + 8, oy + 12, 16, 14);

        // Character face / head
        ctx.fillStyle = '#f6d8b8';
        ctx.beginPath();
        ctx.arc(ox + 16, oy + 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Hair / hoodie rim
        ctx.fillStyle = '#111625';
        ctx.beginPath();
        ctx.arc(ox + 16, oy + 6, 6, Math.PI, Math.PI * 2);
        ctx.fill();

        // Cyan tech laptop bag accent
        ctx.fillStyle = '#00d9ff';
        ctx.fillRect(ox + 10, oy + 16, 4, 6);

        // Walking leg step displacement
        if (row === 1) {
          ctx.fillStyle = '#0d111a';
          ctx.fillRect(ox + 9, oy + 26, 5, 5);
          ctx.fillRect(ox + 18, oy + 25, 5, 6);
        } else {
          ctx.fillStyle = '#0d111a';
          ctx.fillRect(ox + 10, oy + 26, 4, 5);
          ctx.fillRect(ox + 18, oy + 26, 4, 5);
        }
      }
    }

    canvas.refresh();
  }
}

export const playerCharacter = new PlayerCharacter();
export default playerCharacter;
