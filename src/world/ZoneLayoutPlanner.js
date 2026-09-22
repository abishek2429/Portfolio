/**
 * ZoneLayoutPlanner - Zone Architecture & Spatial Detection System
 * 
 * Dark Forest Portfolio Game
 * Defines exact geometry, detection radii, visual glow boundaries,
 * landmarks, resident NPCs, projects, and audio themes for all 5 world zones.
 */

import CONFIG from '../config/GameConfig.js';

export const ZONE_LAYOUTS = {
  foundation: {
    id: 'foundation',
    name: 'Foundation Clearing',
    center: { x: 600, y: 700 },
    radius: 150,
    displayRadius: 120,
    NPCs: ['mentor'],
    projects: [],
    landmark: 'campfire',
    landmarkPosition: { x: 600, y: 720 },
    description: 'Your journey begins here',
    glowColor: 0x4A90FF,
    bgMusic: 'ambient-forest',
    unlockCondition: null
  },

  webdev: {
    id: 'webdev',
    name: 'Web Dev Outpost',
    center: { x: 300, y: 400 },
    radius: 150,
    displayRadius: 120,
    NPCs: ['fullstack'],
    projects: ['eduvault', 'codexcape'],
    landmark: 'cabin',
    landmarkPosition: { x: 300, y: 380 },
    description: 'Where you build for the world',
    glowColor: 0x00D9FF,
    bgMusic: 'ambient-forest-tech',
    unlockCondition: null
  },

  aiml: {
    id: 'aiml',
    name: 'AI & ML Woods',
    center: { x: 200, y: 200 },
    radius: 150,
    displayRadius: 120,
    NPCs: ['ada'],
    projects: ['sentiment', 'ijprems', 'tensorflow'],
    landmark: 'temple',
    landmarkPosition: { x: 200, y: 180 },
    description: 'Where patterns reveal themselves',
    glowColor: 0xB300FF,
    bgMusic: 'ambient-forest-mystery',
    unlockCondition: null
  },

  mobile: {
    id: 'mobile',
    name: 'Mobile Valley',
    center: { x: 900, y: 400 },
    radius: 150,
    displayRadius: 120,
    NPCs: ['mobilearch'],
    projects: ['gmmx'],
    landmark: 'monument',
    landmarkPosition: { x: 900, y: 380 },
    description: 'Modern apps for modern times',
    glowColor: 0x00FF66,
    bgMusic: 'ambient-forest-tech',
    unlockCondition: null
  },

  summit: {
    id: 'summit',
    name: 'The Summit',
    center: { x: 600, y: 100 },
    radius: 200,
    displayRadius: 150,
    NPCs: ['futureyou'],
    projects: ['eduvault', 'codexcape', 'sentiment', 'ijprems', 'tensorflow', 'gmmx'],
    landmark: 'mountain-peak',
    landmarkPosition: { x: 600, y: 80 },
    description: 'Your full journey revealed',
    glowColor: 0xFFD700,
    bgMusic: 'ambient-forest-triumphant',
    unlockCondition: (visitedZonesCount = 0) => visitedZonesCount >= 3
  }
};

export class ZoneLayoutPlanner {
  constructor(customLayouts = {}) {
    this.zones = { ...ZONE_LAYOUTS, ...customLayouts };
  }

  /**
   * Retrieves full layout definition for a zone.
   * @param {string} zoneId
   * @returns {Object|null}
   */
  getZoneLayout(zoneId) {
    return this.zones[zoneId] || null;
  }

  /**
   * Returns an array of all zone layout definitions.
   * @returns {Array<Object>}
   */
  getAllZones() {
    return Object.values(this.zones);
  }

  /**
   * Identifies which zone coordinates fall into based on detection radius.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @returns {string|null} Zone ID or null if in wild forest
   */
  getZoneByPosition(x, y) {
    for (const zone of Object.values(this.zones)) {
      const dist = Math.hypot(x - zone.center.x, y - zone.center.y);
      if (dist <= zone.radius) {
        return zone.id;
      }
    }
    return null;
  }

  /**
   * Calculates Euclidean distance from an entity/position to a zone center.
   * Accepts Player instance, {x, y} object, or separate coordinates.
   * 
   * @param {Object|number} target - Player, {x, y} coordinate, or x number
   * @param {string|number} zoneIdOrY - Zone ID if target is object, or y number
   * @param {string} [zoneId] - Zone ID if coordinates were passed as (x, y, zoneId)
   * @returns {number} Distance in pixels
   */
  getZoneDistance(target, zoneIdOrY, zoneId) {
    let x, y, targetZoneId;

    if (typeof target === 'number' && typeof zoneIdOrY === 'number') {
      x = target;
      y = zoneIdOrY;
      targetZoneId = zoneId;
    } else {
      x = target?.position?.x ?? target?.x ?? 0;
      y = target?.position?.y ?? target?.y ?? 0;
      targetZoneId = zoneIdOrY;
    }

    const zone = this.getZoneLayout(targetZoneId);
    if (!zone) return Infinity;

    return Math.hypot(x - zone.center.x, y - zone.center.y);
  }

  /**
   * Checks if an entity or position is within a specific zone.
   * @param {Object|number} target - Player, {x, y}, or X coord
   * @param {string|number} zoneIdOrY - Zone ID or Y coord
   * @param {string} [zoneId] - Zone ID if X, Y passed
   * @returns {boolean}
   */
  isInZone(target, zoneIdOrY, zoneId) {
    const targetZoneId = typeof target === 'number' ? zoneId : zoneIdOrY;
    const zone = this.getZoneLayout(targetZoneId);
    if (!zone) return false;

    const distance = this.getZoneDistance(target, zoneIdOrY, zoneId);
    return distance <= zone.radius;
  }

  /**
   * Returns array of NPC IDs associated with a zone.
   * @param {string} zoneId
   * @returns {Array<string>}
   */
  getNpcsInZone(zoneId) {
    return this.getZoneLayout(zoneId)?.NPCs || [];
  }

  /**
   * Returns array of project IDs exhibited in a zone.
   * @param {string} zoneId
   * @returns {Array<string>}
   */
  getProjectsInZone(zoneId) {
    return this.getZoneLayout(zoneId)?.projects || [];
  }

  /**
   * Returns coordinates of the primary landmark in a zone.
   * @param {string} zoneId
   * @returns {{ x: number, y: number }|null}
   */
  getLandmarkPosition(zoneId) {
    return this.getZoneLayout(zoneId)?.landmarkPosition || null;
  }

  /**
   * Returns the ambient hex color for a zone's glow effect.
   * @param {string} zoneId
   * @returns {number} Hex color (e.g. 0x4A90FF)
   */
  getZoneGlowColor(zoneId) {
    return this.getZoneLayout(zoneId)?.glowColor ?? 0xffffff;
  }
}

// Export singleton instance
export const zoneLayoutPlanner = new ZoneLayoutPlanner();
export default zoneLayoutPlanner;
