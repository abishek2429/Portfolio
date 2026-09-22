/**
 * MinimapGenerator - Top-Right Tactical Radar & Exploration HUD
 * 
 * Dark Forest Portfolio Game
 * Displays an always-visible, scaled 100x75 minimap radar in the top-right
 * corner. Tracks player coordinates, reveals discovered biomes with glow pulses,
 * and displays interactive zone completion tooltips.
 */

import eventBus, {
  GAME_EVENTS,
  PROJECT_EVENTS
} from '../events/EventBus.js';
import gameState from '../state/GameState.js';
import CONFIG from '../config/GameConfig.js';
import { zoneLayoutPlanner } from '../world/ZoneLayoutPlanner.js';

export const MINIMAP_CONFIG = {
  x: 1080,
  y: 20,
  width: 100,
  height: 75,
  scaleX: 100 / 1200, // 1/12 scale
  scaleY: 75 / 800,
  borderColor: 0xffffff,
  borderAlpha: 0.4,
  borderWidth: 2,
  bgColor: 0x1a1a2e,
  bgAlpha: 0.85,
  depth: 1000,
  zoneColors: {
    foundation: 0x4a90ff,
    webdev: 0x00d9ff,
    aiml: 0xb300ff,
    mobile: 0x00ff66,
    summit: 0xffd700
  }
};

export class MinimapGenerator {
  constructor() {
    this.scene = null;
    this.container = null;
    this.bgGraphic = null;
    this.connectionsGraphic = null;
    this.zoneDots = new Map();
    this.zoneTooltips = new Map();
    this.playerMarker = null;
    this.tooltipContainer = null;
    this.tooltipText = null;
    this.tooltipBg = null;
    this.discoveredZones = new Set();
    this._unsubscribers = [];
  }

  /**
   * Initializes and renders the minimap UI onto the top-right screen space.
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @returns {Phaser.GameObjects.Container} Minimap container
   */
  create(scene) {
    this.scene = scene;
    this.discoveredZones = new Set(gameState.zonesVisited || ['foundation']);

    // Root UI container locked to screen space (scrollFactor = 0)
    this.container = scene.add.container(MINIMAP_CONFIG.x, MINIMAP_CONFIG.y);
    this.container.setScrollFactor(0);
    this.container.setDepth(MINIMAP_CONFIG.depth);

    this._drawBackground();
    this._drawConnections();
    this._createZoneDots();
    this._createPlayerMarker();
    this._createTooltip();
    this._subscribeToEvents();

    return this.container;
  }

  /**
   * Translates world pixel coordinates to local minimap coordinates.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{ minimapX: number, minimapY: number }}
   */
  getMinimapPos(worldX, worldY) {
    return {
      minimapX: Math.max(2, Math.min(MINIMAP_CONFIG.width - 2, worldX * MINIMAP_CONFIG.scaleX)),
      minimapY: Math.max(2, Math.min(MINIMAP_CONFIG.height - 2, worldY * MINIMAP_CONFIG.scaleY))
    };
  }

  /**
   * Moves the white player marker smoothly to current world coordinates.
   * @param {number} worldX
   * @param {number} worldY
   */
  updatePlayerPosition(worldX, worldY) {
    if (!this.playerMarker) return;
    const { minimapX, minimapY } = this.getMinimapPos(worldX, worldY);
    this.playerMarker.setPosition(minimapX, minimapY);
  }

  /**
   * Reveals a newly discovered zone on the radar with a luminous fade-in.
   * @param {string} zoneId
   */
  revealZone(zoneId) {
    if (!zoneId || this.discoveredZones.has(zoneId)) return;
    this.discoveredZones.add(zoneId);

    const dot = this.zoneDots.get(zoneId);
    if (dot) {
      dot.setVisible(true);
      dot.setAlpha(0);
      dot.setScale(0.5);

      if (this.scene?.tweens) {
        this.scene.tweens.add({
          targets: dot,
          alpha: 1,
          scale: 1,
          duration: 600,
          ease: 'Back.easeOut'
        });
      } else {
        dot.setAlpha(1);
        dot.setScale(1);
      }
    }

    this._refreshConnections();
    this.showZoneHighlight(zoneId);
  }

  /**
   * Pulses a zone dot when the player enters its boundary.
   * @param {string} zoneId
   * @param {number} [duration=800]
   */
  showZoneHighlight(zoneId, duration = 800) {
    const dot = this.zoneDots.get(zoneId);
    if (!dot || !this.scene?.tweens) return;

    this.scene.tweens.add({
      targets: dot,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: duration / 2,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Updates tooltip status metadata for a zone.
   * @param {string} zoneId
   * @param {Object} status - { visitedCount, totalProjects }
   */
  updateZoneStatus(zoneId, status = {}) {
    const zone = zoneLayoutPlanner.getZoneLayout(zoneId);
    if (!zone) return;

    const totalProjects = zone.projects.length;
    const clickedCount = zone.projects.filter(p => gameState.projectsClicked.includes(p)).length;
    const statusText = totalProjects > 0
      ? `${clickedCount}/${totalProjects} projects viewed`
      : 'Origins & Lore';

    this.setZoneTooltip(zoneId, `${zone.name} | ${statusText}`);
  }

  /**
   * Sets custom hover tooltip text for a zone dot.
   * @param {string} zoneId
   * @param {string} text
   */
  setZoneTooltip(zoneId, text) {
    this.zoneTooltips.set(zoneId, text);
  }

  /**
   * Toggles radar visibility on/off.
   * @param {boolean} visible
   */
  toggleVisibility(visible) {
    if (this.container) {
      this.container.setVisible(Boolean(visible));
    }
  }

  /**
   * Cleans up tweens and event bindings.
   */
  destroy() {
    this._unsubscribers.forEach(u => u());
    this._unsubscribers = [];
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  // --- Internal Initializers ---

  _drawBackground() {
    this.bgGraphic = this.scene.add.graphics();
    // Dark semi-transparent radar backing
    this.bgGraphic.fillStyle(MINIMAP_CONFIG.bgColor, MINIMAP_CONFIG.bgAlpha);
    this.bgGraphic.fillRoundedRect(0, 0, MINIMAP_CONFIG.width, MINIMAP_CONFIG.height, 4);

    // Subtle border outline
    this.bgGraphic.lineStyle(MINIMAP_CONFIG.borderWidth, MINIMAP_CONFIG.borderColor, MINIMAP_CONFIG.borderAlpha);
    this.bgGraphic.strokeRoundedRect(0, 0, MINIMAP_CONFIG.width, MINIMAP_CONFIG.height, 4);

    this.container.add(this.bgGraphic);
  }

  _drawConnections() {
    this.connectionsGraphic = this.scene.add.graphics();
    this.container.add(this.connectionsGraphic);
    this._refreshConnections();
  }

  _refreshConnections() {
    if (!this.connectionsGraphic) return;
    this.connectionsGraphic.clear();
    this.connectionsGraphic.lineStyle(1, 0xffffff, 0.15);

    const zones = zoneLayoutPlanner.getAllZones();
    const foundation = zoneLayoutPlanner.getZoneLayout('foundation');
    if (!foundation) return;

    const fPos = this.getMinimapPos(foundation.center.x, foundation.center.y);

    // Draw connecting paths between foundation and other discovered zones
    zones.forEach(z => {
      if (z.id !== 'foundation' && this.discoveredZones.has(z.id)) {
        const zPos = this.getMinimapPos(z.center.x, z.center.y);
        this.connectionsGraphic.beginPath();
        this.connectionsGraphic.moveTo(fPos.minimapX, fPos.minimapY);
        this.connectionsGraphic.lineTo(zPos.minimapX, zPos.minimapY);
        this.connectionsGraphic.strokePath();
      }
    });
  }

  _createZoneDots() {
    const zones = zoneLayoutPlanner.getAllZones();

    zones.forEach(zone => {
      const { minimapX, minimapY } = this.getMinimapPos(zone.center.x, zone.center.y);
      const color = MINIMAP_CONFIG.zoneColors[zone.id] || 0xffffff;

      const dot = this.scene.add.circle(minimapX, minimapY, 4, color, 0.95);
      dot.setStrokeStyle(1, 0xffffff, 0.8);
      dot.setInteractive({ useHandCursor: true });

      // Only foundation visible at boot; others fade in upon exploration
      const isVisible = this.discoveredZones.has(zone.id);
      dot.setVisible(isVisible);

      // Default tooltip text
      this.updateZoneStatus(zone.id);

      // Hover interaction for tooltip
      dot.on('pointerover', () => {
        const text = this.zoneTooltips.get(zone.id) || zone.name;
        this._showTooltip(minimapX, minimapY, text);
      });

      dot.on('pointerout', () => {
        this._hideTooltip();
      });

      this.zoneDots.set(zone.id, dot);
      this.container.add(dot);
    });
  }

  _createPlayerMarker() {
    const startX = CONFIG.GAME.PLAYER_START_X || 600;
    const startY = CONFIG.GAME.PLAYER_START_Y || 700;
    const { minimapX, minimapY } = this.getMinimapPos(startX, startY);

    // Sharp white player dot with high contrast drop shadow
    this.playerMarker = this.scene.add.circle(minimapX, minimapY, 3.2, 0xffffff, 1.0);
    this.playerMarker.setStrokeStyle(1.2, 0x111111, 0.9);
    this.container.add(this.playerMarker);
  }

  _createTooltip() {
    this.tooltipContainer = this.scene.add.container(-10, -20);
    this.tooltipContainer.setVisible(false);

    this.tooltipBg = this.scene.add.graphics();
    this.tooltipText = this.scene.add.text(0, 0, '', {
      fontSize: '10px',
      fontFamily: 'Inter, sans-serif',
      color: '#ffffff',
      align: 'center'
    });
    this.tooltipText.setOrigin(0.5, 1);

    this.tooltipContainer.add([this.tooltipBg, this.tooltipText]);
    this.container.add(this.tooltipContainer);
  }

  _showTooltip(dotX, dotY, message) {
    if (!this.tooltipContainer || !this.tooltipText) return;

    this.tooltipText.setText(message);
    const bounds = this.tooltipText.getBounds();
    const padX = 8;
    const padY = 4;

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x0e0e1a, 0.9);
    this.tooltipBg.lineStyle(1, 0x4a90ff, 0.7);
    this.tooltipBg.fillRoundedRect(
      -bounds.width / 2 - padX,
      -bounds.height - padY * 2,
      bounds.width + padX * 2,
      bounds.height + padY * 2,
      3
    );
    this.tooltipBg.strokeRoundedRect(
      -bounds.width / 2 - padX,
      -bounds.height - padY * 2,
      bounds.width + padX * 2,
      bounds.height + padY * 2,
      3
    );

    this.tooltipContainer.setPosition(dotX, dotY - 6);
    this.tooltipContainer.setVisible(true);
  }

  _hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.setVisible(false);
    }
  }

  _subscribeToEvents() {
    // Sync with real-time movement
    const unsubMove = eventBus.on(GAME_EVENTS.PLAYER_MOVED, ({ x, y }) => {
      this.updatePlayerPosition(x, y);
    });
    this._unsubscribers.push(unsubMove);

    // Zone entered -> reveal & pulse
    const unsubZone = eventBus.on(GAME_EVENTS.ZONE_ENTERED, ({ zoneId }) => {
      this.revealZone(zoneId);
      this.updateZoneStatus(zoneId);
    });
    this._unsubscribers.push(unsubZone);

    // Project clicked -> update tooltip completion stats
    const unsubProj = eventBus.on(PROJECT_EVENTS.PROJECT_CLICKED, ({ projectId }) => {
      const proj = CONFIG.getProject(projectId);
      if (proj) {
        this.updateZoneStatus(proj.zone);
      }
    });
    this._unsubscribers.push(unsubProj);
  }
}

export const minimapGenerator = new MinimapGenerator();
export default minimapGenerator;
