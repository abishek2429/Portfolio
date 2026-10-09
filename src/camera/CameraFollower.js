/**
 * CameraFollower - Third-Person Isometric Camera Following System
 * 
 * Dark Forest Portfolio Game
 * Smooth lerp player tracking, world bounds clamping, screenshake feedback,
 * and high-efficiency viewport culling calculations for off-screen entities.
 */

import eventBus, { GAME_EVENTS, PROGRESS_EVENTS } from '../events/EventBus.js';
import CONFIG from '../config/GameConfig.js';

export const CAMERA_CONFIG = {
  VIEWPORT_WIDTH: 1200,
  VIEWPORT_HEIGHT: 800,
  FOLLOW_DISTANCE: 0,
  SMOOTHING: 0.1,
  ZOOM_LEVEL: 1.0,
  ALLOW_ZOOM: false,
  OFFSET_X: 0,
  OFFSET_Y: -50,
  WORLD_BOUNDS: {
    minX: 0,
    maxX: 1200,
    minY: 0,
    maxY: 800
  },
  EDGE_PADDING: 0
};

export class CameraFollower {
  /**
   * @param {Object} [options={}] - Custom configuration overrides
   */
  constructor(options = {}) {
    this.scene = null;
    this.camera = null; // Phaser.Cameras.Scene2D.Camera
    this.target = null; // PlayerCharacter, Sprite, or { x, y }

    // Core Camera Properties
    this.viewportWidth = options.viewportWidth ?? CAMERA_CONFIG.VIEWPORT_WIDTH;
    this.viewportHeight = options.viewportHeight ?? CAMERA_CONFIG.VIEWPORT_HEIGHT;
    this.followDistance = options.followDistance ?? CAMERA_CONFIG.FOLLOW_DISTANCE;
    this.smoothingFactor = options.smoothing ?? options.smoothingFactor ?? CAMERA_CONFIG.SMOOTHING;
    this.zoomLevel = options.zoomLevel ?? CAMERA_CONFIG.ZOOM_LEVEL;
    this.allowZoom = options.allowZoom ?? CAMERA_CONFIG.ALLOW_ZOOM;

    // Positioning & Offsets
    this.offsetX = options.offsetX ?? CAMERA_CONFIG.OFFSET_X;
    this.offsetY = options.offsetY ?? CAMERA_CONFIG.OFFSET_Y;
    this.edgePadding = options.edgePadding ?? CAMERA_CONFIG.EDGE_PADDING;

    // Data Structure
    this.currentPos = {
      x: (CAMERA_CONFIG.WORLD_BOUNDS.minX + CAMERA_CONFIG.WORLD_BOUNDS.maxX) / 2,
      y: (CAMERA_CONFIG.WORLD_BOUNDS.minY + CAMERA_CONFIG.WORLD_BOUNDS.maxY) / 2
    };
    this.targetPos = { ...this.currentPos };

    this.worldBounds = {
      minX: options.minX ?? CAMERA_CONFIG.WORLD_BOUNDS.minX,
      maxX: options.maxX ?? CAMERA_CONFIG.WORLD_BOUNDS.maxX,
      minY: options.minY ?? CAMERA_CONFIG.WORLD_BOUNDS.minY,
      maxY: options.maxY ?? CAMERA_CONFIG.WORLD_BOUNDS.maxY
    };

    this.activeShake = {
      intensity: 0,
      timeRemaining: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0
    };

    this.isPanning = false;
    this._eventBusBound = false;
  }

  /**
   * Initializes the camera follower and binds to Phaser's main camera.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} player - PlayerCharacter or target entity
   * @returns {CameraFollower}
   */
  create(scene, player) {
    this.scene = scene;
    this.camera = scene?.cameras?.main || null;
    this.target = player || null;

    if (this.camera) {
      if (typeof this.camera.setSize === 'function') {
        this.camera.setSize(this.viewportWidth, this.viewportHeight);
      }
      if (typeof this.camera.setZoom === 'function') {
        this.camera.setZoom(this.zoomLevel);
      }
    }

    // Set initial position immediately to player
    const entityPos = this._getEntityPosition(this.target);
    if (entityPos) {
      const targetX = this._clampX(entityPos.x + this.offsetX);
      const targetY = this._clampY(entityPos.y + this.offsetY);
      this.currentPos = { x: targetX, y: targetY };
      this.targetPos = { x: targetX, y: targetY };
    } else {
      this.currentPos = {
        x: (this.worldBounds.minX + this.worldBounds.maxX) / 2,
        y: (this.worldBounds.minY + this.worldBounds.maxY) / 2
      };
      this.targetPos = { ...this.currentPos };
    }

    this._syncPhaserCamera();
    this._bindEventBus();

    return this;
  }

  /**
   * Frame-by-frame camera update loop.
   * Smoothly eases camera toward target, clamps to world bounds, and applies effects.
   * 
   * @param {number} [arg1] - Delta time (ms) or Phaser Scene time
   * @param {number} [arg2] - Phaser Scene delta time (ms)
   */
  update(arg1, arg2) {
    let delta = 16.67;
    if (typeof arg2 === 'number') {
      delta = arg2;
    } else if (typeof arg1 === 'number') {
      delta = arg1;
    }

    // 1. If currently in an animated pan tween, let tween govern currentPos
    if (!this.isPanning && this.target) {
      const entityPos = this._getEntityPosition(this.target);
      if (entityPos) {
        this.targetPos.x = this._clampX(entityPos.x + this.offsetX);
        this.targetPos.y = this._clampY(entityPos.y + this.offsetY);

        // Smooth follow using lerp: cameraX = lerp(currentX, targetX, smoothingFactor)
        const dx = this.targetPos.x - this.currentPos.x;
        const dy = this.targetPos.y - this.currentPos.y;

        // Prevent camera jitter at low speeds / sub-pixel distances
        if (Math.abs(dx) < 0.5) {
          this.currentPos.x = this.targetPos.x;
        } else {
          this.currentPos.x = this.lerp(this.currentPos.x, this.targetPos.x, this.smoothingFactor);
        }

        if (Math.abs(dy) < 0.5) {
          this.currentPos.y = this.targetPos.y;
        } else {
          this.currentPos.y = this.lerp(this.currentPos.y, this.targetPos.y, this.smoothingFactor);
        }
      }
    }

    // 2. Ensure current position is clamped to bounds
    this.currentPos.x = this._clampX(this.currentPos.x);
    this.currentPos.y = this._clampY(this.currentPos.y);

    // 3. Process active screen shake effect
    this._updateShake(delta);

    // 4. Synchronize with Phaser Camera
    this._syncPhaserCamera();
  }

  /**
   * Immediately moves or smoothly pans camera to world coordinates.
   * 
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @param {number} [duration=0] - Optional pan duration in milliseconds
   */
  setTarget(x, y, duration = 0) {
    const clampedX = this._clampX(x);
    const clampedY = this._clampY(y);

    this.targetPos.x = clampedX;
    this.targetPos.y = clampedY;

    if (duration > 0 && this.scene?.tweens) {
      this.isPanning = true;
      this.scene.tweens.add({
        targets: this.currentPos,
        x: clampedX,
        y: clampedY,
        duration,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          this._syncPhaserCamera();
        },
        onComplete: () => {
          this.isPanning = false;
        }
      });
    } else {
      this.isPanning = false;
      this.currentPos.x = clampedX;
      this.currentPos.y = clampedY;
      this._syncPhaserCamera();
    }
  }

  /**
   * Changes the camera follow target.
   * 
   * @param {Object} entity - PlayerCharacter, Sprite, or position object
   */
  follow(entity) {
    this.target = entity;
    this.isPanning = false;
  }

  /**
   * Adjusts the camera follow lag/easing factor.
   * 
   * @param {number} factor - Value between 0 (max lag) and 1 (instant snap)
   */
  setSmoothing(factor) {
    if (typeof factor === 'number' && !isNaN(factor)) {
      this.smoothingFactor = Math.max(0, Math.min(1, factor));
    }
  }

  /**
   * Triggers a screen shake effect with decaying pixel offsets.
   * 
   * @param {number} [intensity=5] - Pixel offset magnitude (0 - 10)
   * @param {number} [duration=300] - Duration in milliseconds
   */
  shake(intensity = 5, duration = 300) {
    const clampedIntensity = Math.max(0, Math.min(10, intensity));
    const safeDuration = Math.max(0, duration);

    this.activeShake.intensity = clampedIntensity;
    this.activeShake.duration = safeDuration;
    this.activeShake.timeRemaining = safeDuration;
    this.activeShake.offsetX = 0;
    this.activeShake.offsetY = 0;
  }

  /**
   * Zooms camera in or out between 0.5x and 2.0x scale.
   * Respects allowZoom flag (fixed zoom by default).
   * 
   * @param {number} level - Zoom level (0.5 - 2.0)
   * @param {number} [duration=0] - Optional zoom tween duration in ms
   */
  zoom(level, duration = 0) {
    if (!this.allowZoom) {
      return;
    }

    const clampedZoom = Math.max(0.5, Math.min(2.0, level));
    this.zoomLevel = clampedZoom;

    if (this.camera) {
      if (duration > 0 && typeof this.camera.zoomTo === 'function') {
        this.camera.zoomTo(clampedZoom, duration);
      } else if (typeof this.camera.setZoom === 'function') {
        this.camera.setZoom(clampedZoom);
      }
    }
  }

  /**
   * Enables or disables dynamic camera zoom.
   * @param {boolean} allow
   */
  setAllowZoom(allow) {
    this.allowZoom = Boolean(allow);
  }

  /**
   * Sets world boundary coordinates for camera clamping.
   * 
   * @param {number} minX - Minimum world X
   * @param {number} maxX - Maximum world X
   * @param {number} minY - Minimum world Y
   * @param {number} maxY - Maximum world Y
   */
  setBounds(minX, maxX, minY, maxY) {
    this.worldBounds = {
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minY: Math.min(minY, maxY),
      maxY: Math.max(minY, maxY)
    };
  }

  /**
   * Returns current camera center world coordinates.
   * @returns {{ x: number, y: number }}
   */
  getViewportCenter() {
    return {
      x: this.currentPos.x,
      y: this.currentPos.y
    };
  }

  /**
   * Returns the visible rectangular area in world coordinates.
   * 
   * @returns {{ x: number, y: number, width: number, height: number, left: number, right: number, top: number, bottom: number }}
   */
  getViewportBounds() {
    const width = this.viewportWidth / this.zoomLevel;
    const height = this.viewportHeight / this.zoomLevel;
    const x = this.currentPos.x - width / 2;
    const y = this.currentPos.y - height / 2;

    return {
      x,
      y,
      width,
      height,
      left: x,
      right: x + width,
      top: y,
      bottom: y + height
    };
  }

  /**
   * Checks whether a world coordinate is currently inside the visible camera viewport.
   * Used by rendering systems to cull off-screen objects.
   * 
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {boolean}
   */
  isPointInViewport(x, y) {
    const bounds = this.getViewportBounds();
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  /**
   * Checks whether a game object or bounding box intersects the visible camera viewport.
   * 
   * @param {Object} object - Object with x, y, width, height or getPosition()
   * @param {number} [padding=0] - Buffer margin in pixels
   * @returns {boolean}
   */
  isObjectInViewport(object, padding = 0) {
    if (!object) return false;
    const bounds = this.getViewportBounds();
    const objX = object.x ?? object.getPosition?.().x ?? 0;
    const objY = object.y ?? object.getPosition?.().y ?? 0;
    const objW = object.width ?? object.displayWidth ?? 0;
    const objH = object.height ?? object.displayHeight ?? 0;

    return (
      objX + objW / 2 >= bounds.x - padding &&
      objX - objW / 2 <= bounds.x + bounds.width + padding &&
      objY + objH / 2 >= bounds.y - padding &&
      objY - objH / 2 <= bounds.y + bounds.height + padding
    );
  }

  /**
   * Standard Linear Interpolation helper.
   * 
   * @param {number} start
   * @param {number} end
   * @param {number} factor
   * @returns {number}
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // --- Internal Helpers ---

  _clampX(x) {
    const halfW = (this.viewportWidth / this.zoomLevel) / 2;
    const boundsWidth = this.worldBounds.maxX - this.worldBounds.minX;

    if (boundsWidth > this.viewportWidth / this.zoomLevel) {
      return Math.max(
        this.worldBounds.minX + halfW + this.edgePadding,
        Math.min(this.worldBounds.maxX - halfW - this.edgePadding, x)
      );
    }

    return Math.max(
      this.worldBounds.minX + this.edgePadding,
      Math.min(this.worldBounds.maxX - this.edgePadding, x)
    );
  }

  _clampY(y) {
    const halfH = (this.viewportHeight / this.zoomLevel) / 2;
    const boundsHeight = this.worldBounds.maxY - this.worldBounds.minY;

    if (boundsHeight > this.viewportHeight / this.zoomLevel) {
      return Math.max(
        this.worldBounds.minY + halfH + this.edgePadding,
        Math.min(this.worldBounds.maxY - halfH - this.edgePadding, y)
      );
    }

    return Math.max(
      this.worldBounds.minY + this.edgePadding,
      Math.min(this.worldBounds.maxY - this.edgePadding, y)
    );
  }

  _updateShake(delta) {
    if (this.activeShake.timeRemaining > 0) {
      this.activeShake.timeRemaining = Math.max(0, this.activeShake.timeRemaining - delta);

      if (this.activeShake.timeRemaining > 0 && this.activeShake.duration > 0) {
        const decay = this.activeShake.timeRemaining / this.activeShake.duration;
        const currentIntensity = this.activeShake.intensity * decay;
        this.activeShake.offsetX = (Math.random() * 2 - 1) * currentIntensity;
        this.activeShake.offsetY = (Math.random() * 2 - 1) * currentIntensity;
      } else {
        this.activeShake.offsetX = 0;
        this.activeShake.offsetY = 0;
        this.activeShake.intensity = 0;
        this.activeShake.timeRemaining = 0;
      }
    } else {
      this.activeShake.offsetX = 0;
      this.activeShake.offsetY = 0;
    }
  }

  _syncPhaserCamera() {
    if (!this.camera) return;
    const finalX = this.currentPos.x + (this.activeShake.offsetX || 0);
    const finalY = this.currentPos.y + (this.activeShake.offsetY || 0);

    if (typeof this.camera.centerOn === 'function') {
      this.camera.centerOn(finalX, finalY);
    } else {
      this.camera.scrollX = finalX - this.viewportWidth / 2;
      this.camera.scrollY = finalY - this.viewportHeight / 2;
    }
  }

  _getEntityPosition(entity) {
    if (!entity) return null;
    if (typeof entity.getPosition === 'function') {
      return entity.getPosition();
    }
    if (entity.sprite && typeof entity.sprite.x === 'number' && typeof entity.sprite.y === 'number') {
      return { x: entity.sprite.x, y: entity.sprite.y };
    }
    if (typeof entity.x === 'number' && typeof entity.y === 'number') {
      return { x: entity.x, y: entity.y };
    }
    return null;
  }

  _bindEventBus() {
    if (!eventBus || this._eventBusBound) return;
    this._eventBusBound = true;

    // Screenshake feedback on achievement unlocks
    eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, () => {
      this.shake(4, 300);
    });

    // Subtle screenshake feedback on entering new clearings
    eventBus.on(GAME_EVENTS.ZONE_ENTERED, () => {
      this.shake(2, 200);
    });
  }
}

// Export singleton instance
export const cameraFollower = new CameraFollower();
export default cameraFollower;
