/**
 * ZoneVisualizer - Zone Detection & Dynamic Visual Feedback System
 * 
 * Dark Forest Portfolio Game
 * Detects player zone presence, renders pulsing ambient glow auras,
 * manages the HUD zone entry marquee, and broadcasts boundary transitions.
 */

import eventBus, { GAME_EVENTS } from '../events/EventBus.js';
import gameState from '../state/GameState.js';
import CONFIG from '../config/GameConfig.js';
import { zoneLayoutPlanner as defaultZonePlanner } from './ZoneLayoutPlanner.js';

// Thematic glow colors for individual zone landmarks & clearings
export const ZONE_ELEMENT_COLORS = {
  foundation: 0xff8800, // warm orange campfire glow
  webdev: 0x00d9ff,     // cool white / cyan cabin lights
  aiml: 0xb300ff,       // purple mystical temple radiance
  mobile: 0x00ff66,     // neon green monument glow
  summit: 0xffd700      // bright gold mountain peak radiance
};

export class ZoneVisualizer {
  constructor() {
    this.scene = null;
    this.planner = defaultZonePlanner;
    this.layerPlanner = null;

    // State tracking
    this.currentZone = null;
    this.previousZone = null;
    this.zoneGlows = new Map();
    this.glowTweens = new Map();
    this.zoneNameDisplay = null;
    this.zoneNameContainer = null;
    this.zoneNameTimer = null;
    this.zoneNameTween = null;

    // Debugging
    this.debugGraphics = null;
    this.debugMode = false;
  }

  /**
   * Initializes zone glows, HUD banner display, and registers loop hooks.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [zoneLayoutPlanner] - Zone layout planner instance
   * @param {Object} [layerPlanner] - Optional layer planner / layer manager
   * @returns {ZoneVisualizer}
   */
  create(scene, zoneLayoutPlanner = null, layerPlanner = null) {
    this.scene = scene;
    this.planner = zoneLayoutPlanner || defaultZonePlanner;
    this.layerPlanner = layerPlanner;
    this.debugMode = Boolean(scene?.physics?.config?.debug || false);

    this.zoneGlows.clear();
    this.glowTweens.clear();

    // 1. Build circular visual glow auras for every zone
    this._createZoneGlowAuras();

    // 2. Build top-center HUD zone banner
    this._createZoneNameHUD();

    // 3. Optional debug ring overlay
    if (this.debugMode) {
      this.debugDrawZoneRadii();
    }

    return this;
  }

  /**
   * Evaluates player position each frame, detects zone transitions, and emits events.
   * 
   * @param {Object|number} playerPos - Player instance, { x, y } object, or x coordinate
   * @param {number} [playerY] - World Y if playerPos is numeric X
   */
  update(playerPos, playerY) {
    if (!this.planner) return;

    let px = 0;
    let py = 0;

    if (typeof playerPos === 'number' && typeof playerY === 'number') {
      px = playerPos;
      py = playerY;
    } else if (playerPos) {
      px = playerPos.position?.x ?? playerPos.x ?? 0;
      py = playerPos.position?.y ?? playerPos.y ?? 0;
    }

    // Determine which zone encompasses the coordinates
    const detectedZone = this.getZoneAtPosition(px, py);

    // Detect zone boundary transition
    const prevId = this.currentZone ? this.currentZone.id : null;
    const nextId = detectedZone ? detectedZone.id : null;

    if (prevId !== nextId) {
      // 1. Player exited previous zone
      if (this.currentZone) {
        const exitPayload = {
          zoneId: this.currentZone.id,
          zoneName: this.currentZone.name
        };
        eventBus.emit(GAME_EVENTS.ZONE_EXITED, exitPayload);
      }

      // 2. Player entered a new zone
      if (detectedZone) {
        const enterPayload = {
          zoneId: detectedZone.id,
          zoneName: detectedZone.name,
          npcCount: (detectedZone.NPCs || []).length,
          projectCount: (detectedZone.projects || []).length
        };

        // Update centralized GameState
        if (gameState) {
          gameState.currentZone = detectedZone.id;
          if (typeof gameState.visitZone === 'function') {
            gameState.visitZone(detectedZone.id);
          }
        }

        // Emit zone entry event
        eventBus.emit(GAME_EVENTS.ZONE_ENTERED, enterPayload);

        // Display zone marquee banner
        const glowColor = this.getZoneGlowColor(detectedZone.id);
        this.displayZoneName(detectedZone.name, glowColor, 3000);
      } else {
        // Player is between zones in wild forest
        if (gameState) {
          gameState.currentZone = null;
        }
      }

      // Update local pointers
      this.previousZone = this.currentZone;
      this.currentZone = detectedZone;
    }
  }

  /**
   * Returns the zone the player is currently inside, or null if between zones.
   * @returns {Object|null}
   */
  getCurrentZone() {
    return this.currentZone;
  }

  /**
   * Checks whether the player is currently inside a specific zone.
   * @param {string} zoneId
   * @returns {boolean}
   */
  isInZone(zoneId) {
    if (!zoneId) return false;
    return this.currentZone?.id === zoneId;
  }

  /**
   * Identifies the zone located at specific world coordinates.
   * @param {number} x
   * @param {number} y
   * @returns {Object|null} Matching zone object or null
   */
  getZoneAtPosition(x, y) {
    if (!this.planner) return null;

    const allZones = this.planner.getAllZones();
    let bestZone = null;
    let closestDist = Infinity;

    for (const zone of allZones) {
      const dist = Math.hypot(x - zone.center.x, y - zone.center.y);
      if (dist <= zone.radius) {
        // If clearings slightly touch, pick the closest center
        if (dist < closestDist) {
          closestDist = dist;
          bestZone = zone;
        }
      }
    }

    return bestZone;
  }

  /**
   * Displays the zone title in the top-center HUD with smooth fade animations.
   * 
   * @param {string} zoneName - Name of the zone
   * @param {number|string} [color] - Hex color or string
   * @param {number} [duration=3000] - Duration in ms to stay visible
   */
  displayZoneName(zoneName, color = 0xffffff, duration = 3000) {
    if (!this.zoneNameDisplay || !this.scene) return;

    // Clear any pending fade or timer
    this._clearZoneNameTimers();

    // Format color into CSS hex string for Phaser Text
    let colorHexStr = '#ffffff';
    if (typeof color === 'number') {
      colorHexStr = '#' + color.toString(16).padStart(6, '0');
    } else if (typeof color === 'string') {
      colorHexStr = color.startsWith('#') ? color : '#' + color;
    }

    this.zoneNameDisplay.setText(zoneName);
    this.zoneNameDisplay.setColor(colorHexStr);

    if (this.zoneNameContainer) {
      this.zoneNameContainer.setVisible(true);
      this.zoneNameContainer.setAlpha(0);
    } else {
      this.zoneNameDisplay.setVisible(true);
      this.zoneNameDisplay.setAlpha(0);
    }

    const target = this.zoneNameContainer || this.zoneNameDisplay;

    // Fade-in (300ms)
    if (this.scene.tweens) {
      this.zoneNameTween = this.scene.tweens.add({
        targets: target,
        alpha: 1,
        y: target.y, // Maintain anchored HUD position
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Schedule fade-out after duration
          this.zoneNameTimer = this._scheduleTimer(duration, () => {
            this.zoneNameTween = this.scene.tweens.add({
              targets: target,
              alpha: 0,
              duration: 300,
              ease: 'Power2.easeIn',
              onComplete: () => {
                target.setVisible(false);
              }
            });
          });
        }
      });
    } else {
      // Headless / fallback
      target.setAlpha(1);
      target.setVisible(true);
      this.zoneNameTimer = this._scheduleTimer(duration, () => {
        target.setAlpha(0);
        target.setVisible(false);
      });
    }

    // Emit event notification
    eventBus.emit(GAME_EVENTS.ZONE_NAME_DISPLAYED, { zoneName, duration });
  }

  /**
   * Immediately hides the HUD zone name banner and cancels active tweens.
   */
  hideZoneName() {
    this._clearZoneNameTimers();
    if (this.zoneNameContainer) {
      this.zoneNameContainer.setAlpha(0);
      this.zoneNameContainer.setVisible(false);
    }
    if (this.zoneNameDisplay) {
      this.zoneNameDisplay.setAlpha(0);
      this.zoneNameDisplay.setVisible(false);
    }
  }

  /**
   * Pulses a zone's glow aura to draw player visual attention.
   * 
   * @param {string} zoneId
   * @param {number} [duration=1000]
   */
  highlightZone(zoneId, duration = 1000) {
    const glow = this.zoneGlows.get(zoneId);
    if (!glow || !this.scene?.tweens) return;

    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 1.0,
      duration: duration / 2,
      yoyo: true,
      repeat: 0,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Shows or hides a zone's glow aura (e.g. for fog of war / progressive discovery).
   * 
   * @param {string} zoneId
   * @param {boolean} visible
   */
  setZoneVisibility(zoneId, visible) {
    const glow = this.zoneGlows.get(zoneId);
    if (glow) {
      glow.setVisible(Boolean(visible));
    }
  }

  /**
   * Retrieves the thematic hex color code for a zone.
   * 
   * @param {string} zoneId
   * @returns {number} Hex color (e.g. 0xff8800)
   */
  getZoneGlowColor(zoneId) {
    if (ZONE_ELEMENT_COLORS[zoneId] !== undefined) {
      return ZONE_ELEMENT_COLORS[zoneId];
    }
    const layout = this.planner?.getZoneLayout?.(zoneId);
    if (layout?.glowColor !== undefined) {
      return layout.glowColor;
    }
    const configZone = CONFIG.ZONES?.[zoneId];
    if (configZone?.glowColor !== undefined) {
      return configZone.glowColor;
    }
    return 0xffffff;
  }

  /**
   * Retrieves comprehensive metadata for a specific zone.
   * 
   * @param {string} zoneId
   * @returns {Object|null} Zone info packet
   */
  getZoneInfo(zoneId) {
    const layout = this.planner?.getZoneLayout?.(zoneId);
    if (!layout) return null;

    return {
      id: layout.id,
      name: layout.name,
      center: { ...layout.center },
      radius: layout.radius,
      displayRadius: layout.displayRadius || layout.radius,
      projects: [...(layout.projects || [])],
      npcs: [...(layout.NPCs || [])],
      color: this.getZoneGlowColor(layout.id),
      landmark: layout.landmark || null,
      description: layout.description || ''
    };
  }

  /**
   * Finds the closest zone to a given world position.
   * 
   * @param {Object} position - { x, y }
   * @returns {Object|null} Nearest zone object
   */
  getNearestZone(position) {
    if (!this.planner) return null;

    const px = position?.x ?? position?.position?.x ?? 0;
    const py = position?.y ?? position?.position?.y ?? 0;

    let nearest = null;
    let minDistance = Infinity;

    for (const zone of this.planner.getAllZones()) {
      const dist = Math.hypot(px - zone.center.x, py - zone.center.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = zone;
      }
    }

    return nearest;
  }

  /**
   * Measures Euclidean distance from a world position to a zone's center.
   * 
   * @param {Object} position - { x, y }
   * @param {string} zoneId - Target zone ID
   * @returns {number} Distance in pixels
   */
  getDistanceToZone(position, zoneId) {
    const layout = this.planner?.getZoneLayout?.(zoneId);
    if (!layout) return Infinity;

    const px = position?.x ?? position?.position?.x ?? 0;
    const py = position?.y ?? position?.position?.y ?? 0;

    return Math.hypot(px - layout.center.x, py - layout.center.y);
  }

  /**
   * Visualizes zone detection and display radii with debug outline rings.
   * Active only when debug mode is enabled.
   */
  debugDrawZoneRadii() {
    if (!this.scene?.add?.graphics) return;

    if (!this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics();
      this.debugGraphics.setDepth(999);
    }

    this.debugGraphics.clear();

    if (!this.planner) return;

    for (const zone of this.planner.getAllZones()) {
      const color = this.getZoneGlowColor(zone.id);

      // Outer detection boundary (red / orange ring)
      this.debugGraphics.lineStyle(2, 0xff5555, 0.85);
      this.debugGraphics.strokeCircle(zone.center.x, zone.center.y, zone.radius);

      // Inner display glow boundary (theme colored ring)
      this.debugGraphics.lineStyle(2, color, 0.9);
      this.debugGraphics.strokeCircle(zone.center.x, zone.center.y, zone.displayRadius || zone.radius * 0.8);

      // Center point anchor dot
      this.debugGraphics.fillStyle(0xffffff, 1.0);
      this.debugGraphics.fillCircle(zone.center.x, zone.center.y, 4);
    }
  }

  /**
   * Destroys visual elements and clears event timers.
   */
  destroy() {
    this._clearZoneNameTimers();

    this.glowTweens.forEach(t => t?.stop?.());
    this.glowTweens.clear();

    this.zoneGlows.forEach(g => g?.destroy?.());
    this.zoneGlows.clear();

    if (this.zoneNameContainer) {
      this.zoneNameContainer.destroy();
      this.zoneNameContainer = null;
    } else if (this.zoneNameDisplay) {
      this.zoneNameDisplay.destroy();
      this.zoneNameDisplay = null;
    }

    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
  }

  // --- Private Helpers ---

  /**
   * Creates large, soft radial glow aura sprites/graphics at zone centers.
   * Rendered below tilemap / above background (depth -1 or 0).
   * @private
   */
  _createZoneGlowAuras() {
    if (!this.scene?.add) return;

    const zones = this.planner.getAllZones();

    zones.forEach(zone => {
      const color = this.getZoneGlowColor(zone.id);
      const radius = zone.displayRadius || zone.radius || 120;

      // Create graphics object at zone center
      const glowGraphic = this.scene.add.graphics({ x: zone.center.x, y: zone.center.y });
      
      // Render below tilemap layers (depth 0 or -1)
      const glowDepth = this.layerPlanner?.getLayerDepth?.('background') ?? -1;
      glowGraphic.setDepth(glowDepth);

      // Draw soft concentric gradient discs (outer fade to inner glow)
      glowGraphic.fillStyle(color, 0.12);
      glowGraphic.fillCircle(0, 0, radius);

      glowGraphic.fillStyle(color, 0.22);
      glowGraphic.fillCircle(0, 0, radius * 0.75);

      glowGraphic.fillStyle(color, 0.35);
      glowGraphic.fillCircle(0, 0, radius * 0.5);

      glowGraphic.fillStyle(color, 0.55);
      glowGraphic.fillCircle(0, 0, radius * 0.25);

      // Subtle atmospheric oscillation (intensity oscillates between 0.4 and 0.8 over 2 seconds)
      glowGraphic.setAlpha(0.6);

      if (this.scene.tweens) {
        const tween = this.scene.tweens.add({
          targets: glowGraphic,
          alpha: { from: 0.4, to: 0.8 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.glowTweens.set(zone.id, tween);
      }

      this.zoneGlows.set(zone.id, glowGraphic);
    });
  }

  /**
   * Constructs the top-center HUD zone banner text with serif styling.
   * @private
   */
  _createZoneNameHUD() {
    if (!this.scene?.add) return;

    const screenWidth = CONFIG.GAME.CANVAS_WIDTH || 1200;
    const posX = screenWidth / 2;
    const posY = 50;

    // Use container to lock to screen space (scrollFactor 0)
    if (this.scene.add.container) {
      this.zoneNameContainer = this.scene.add.container(posX, posY);
      this.zoneNameContainer.setScrollFactor(0);
      this.zoneNameContainer.setDepth(600); // HUD depth
      this.zoneNameContainer.setVisible(false);
      this.zoneNameContainer.setAlpha(0);

      this.zoneNameDisplay = this.scene.add.text(0, 0, '', {
        fontSize: '26px',
        fontFamily: 'Georgia, "Cinzel", serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#0e0e1a',
        strokeThickness: 4,
        align: 'center',
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#000000',
          blur: 8,
          fill: true
        }
      });
      this.zoneNameDisplay.setOrigin(0.5, 0.5);
      this.zoneNameContainer.add(this.zoneNameDisplay);
    } else {
      this.zoneNameDisplay = this.scene.add.text(posX, posY, '', {
        fontSize: '26px',
        fontFamily: 'Georgia, "Cinzel", serif',
        color: '#ffffff'
      });
      this.zoneNameDisplay.setOrigin(0.5, 0.5);
      this.zoneNameDisplay.setScrollFactor?.(0);
      this.zoneNameDisplay.setVisible(false);
      this.zoneNameDisplay.setAlpha(0);
    }
  }

  /**
   * Helper to schedule timed callbacks safely in both Phaser and Node mock environments.
   * @private
   */
  _scheduleTimer(ms, callback) {
    if (this.scene?.time?.delayedCall) {
      return this.scene.time.delayedCall(ms, callback);
    }
    return setTimeout(callback, ms);
  }

  /**
   * Clears active timers and tweens on the zone name HUD.
   * @private
   */
  _clearZoneNameTimers() {
    if (this.zoneNameTimer) {
      if (typeof this.zoneNameTimer.remove === 'function') {
        this.zoneNameTimer.remove(false);
      } else {
        clearTimeout(this.zoneNameTimer);
      }
      this.zoneNameTimer = null;
    }

    if (this.zoneNameTween) {
      if (typeof this.zoneNameTween.stop === 'function') {
        this.zoneNameTween.stop();
      }
      this.zoneNameTween = null;
    }
  }
}

// Export singleton instance and class
export const zoneVisualizer = new ZoneVisualizer();
export default zoneVisualizer;
