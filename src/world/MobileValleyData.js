/**
 * MobileValleyData - Mobile Architecture Biome Configuration & Data Model
 * 
 * Dark Forest Portfolio Game
 * Defines geometry, sleek obelisk monument landmark, Mobile Architect resident NPC,
 * orbiting holographic UI elements, showcased projects (GMMX Gym Management),
 * digital synth audio, and developer lifestyle easter eggs.
 */

export const MOBILE_VALLEY_DATA = {
  // --- ZONE BASICS ---
  zone: {
    id: 'mobile',
    name: 'Mobile Valley',
    displayName: 'Mobile Valley',
    description: "A sleek monument stands in a clearing. Holographic UI elements float around it. Tech meets nature.",
    center: { x: 900, y: 400 },
    radius: 150,
    displayRadius: 120,
    glowColor: 0x00FF66, // Neon Green
    glowColorHex: '#00FF66',
    bgMusic: 'ambient-forest-tech',
    isStartingZone: false,
    discoverable: true,
    unlockCondition: null
  },

  // --- VISUALS & MONUMENT LANDMARK ---
  visuals: {
    landmark: 'monument',
    landmarkPosition: { x: 900, y: 380 },
    landmarkSize: { width: 96, height: 96 },
    tileset: 'forest-tiles',
    terrainType: 'grassy clearing with geometric stone pathways',
    surroundings: 'Sparse forest perimeter opening into an expansive, polished meadow with radiating trails',
    buildings: 'Minimalist metallic obelisk pulsing with green conduits and hovering holographic interfaces',
    lighting: 'Crisp neon green lighting with glowing orbital UI particles illuminating the clearing floor',
    atmosphere: 'Modern, sleek, polished, forward-facing'
  },

  // --- MONUMENT SPECIFIC DETAILS ---
  monumentDetails: {
    hasHolographicElements: true,
    hasLighting: true,
    hasParticles: true,
    interactable: false, // Backdrop landmark
    architecturalStyle: 'Sleek geometric tech obelisk engineered from dark alloy and illuminated acrylic',
    inspectHint: "You tap the obelisk: holographic wireframes for GMMX and Flutter widget trees shimmer into view."
  },

  // --- HOLOGRAPHIC UI ELEMENTS ---
  holographicElements: [
    { type: 'app-icon', icon: 'gmmx', label: 'App Grid', orbitRadius: 48, orbitHeight: 18 },
    { type: 'phone-frame', position: 'left', label: 'Device Viewport', orbitRadius: 62, orbitHeight: 0 },
    { type: 'sync-indicator', label: 'Firebase Sync', orbitRadius: 54, orbitHeight: -22 },
    { type: 'flutter-logo', label: 'Flutter Engine', orbitRadius: 70, orbitHeight: 28 }
  ],

  // --- SYNC PULSE PARTICLES ---
  syncParticles: {
    type: 'pulsing_circles',
    meaning: 'Real-time Firebase data synchronization and cross-platform events',
    color: '#00FF66',
    pulseCycle: '1-2s smooth breathing oscillation',
    frequency: 'continuous telemetry heartbeat around obelisk base'
  },

  // --- RESIDENT NPCS ---
  npcs: {
    residents: ['mobilearch'],
    npcSpawnPoints: {
      mobilearch: {
        id: 'mobilearch',
        name: 'Mobile Architect',
        x: 900,
        y: 350,
        facing: 'right',
        sprite: 'npc-mobilearch',
        interactRadius: 80
      }
    },
    interactRadius: 80
  },

  // --- SHOWCASED PROJECTS ---
  projects: {
    visibleProjects: ['gmmx'],
    projectList: [
      {
        id: 'gmmx',
        name: 'GMMX',
        zone: 'mobile',
        subtitle: 'Cross-Platform Fitness & Gym Management System',
        description: "Flutter-based gym management app for fitness tracking",
        fullDescription: "GMMX is a cross-platform mobile application engineered with Flutter and Dart, backed by Firebase for real-time member telemetry, schedule syncing, workout tracking, and attendance analytics.",
        tech: ['Flutter', 'Dart', 'Firebase', 'Mobile Development'],
        duration: 'Group project (Semester)',
        collaborators: ['Group members'],
        keyFeatures: [
          'Cross-platform mobile app (iOS & Android via Flutter)',
          'Firebase backend for real-time data',
          'Gym membership and workout tracking',
          'User-friendly fitness management interface'
        ],
        links: {
          github: 'https://github.com/abishek2429/gmmx'
        },
        status: 'completed',
        glowColor: '#00FF66'
      }
    ]
  },

  // --- FEATURES & EXPLORATION ---
  features: {
    hasPathsTo: ['foundation', 'webdev', 'aiml', 'summit'],
    discoverable: true,
    isStartingZone: false,
    unlockCondition: null,
    completionFlag: 'mobile_visited'
  },

  // --- PATH CONNECTIONS ---
  paths: {
    foundation: {
      targetZone: 'foundation',
      name: 'Foundation Clearing',
      direction: 'left',
      vector: { x: -300, y: 300 },
      distance: 300,
      unreachable: false,
      hint: 'A clean stone walkway leading west back to the warm campfire in Foundation Clearing.'
    },
    webdev: {
      targetZone: 'webdev',
      name: 'Web Dev Outpost',
      direction: 'top-left',
      vector: { x: -600, y: 0 },
      distance: 600,
      unreachable: false,
      hint: 'A broad cross-forest trail heading west towards the cyan lights of the Web Dev cabin.'
    },
    aiml: {
      targetZone: 'aiml',
      name: 'AI & ML Woods',
      direction: 'top-left',
      vector: { x: -700, y: -200 },
      distance: 650,
      unreachable: false,
      hint: 'A long diagonal trail heading northwest into the deep shadows of AI & ML Woods.'
    },
    summit: {
      targetZone: 'summit',
      name: 'The Summit',
      direction: 'top',
      vector: { x: -300, y: -300 },
      distance: 500,
      unreachable: true,
      unlockRequirement: 3,
      hint: 'A steep winding mountain path climbing northward to the Summit. Impassable until 3 clearings are mastered.'
    }
  },

  // Direct alias path properties
  pathToFoundation: { direction: 'left', distance: 300 },
  pathToWebdev: { direction: 'top-left', distance: 600 },
  pathToAiml: { direction: 'top-left', distance: 650 },
  pathToSummit: { direction: 'top', distance: 500, unreachable: true },

  // --- TILEMAP DATA ---
  tilemap: {
    size: {
      width: 640,
      height: 480,
      cols: 20,
      rows: 15,
      tileSize: 32
    },
    bounds: {
      minX: 700,
      maxX: 1100,
      minY: 200,
      maxY: 600
    },
    terrain: 'grassy clearing with geometric stone paths (tile 4)',
    monumentCenter: 'completely cleared circular plaza centered at (900, 380)',
    stonePaths: 'radiate outward geometrically from obelisk to zone perimeters',
    boundary: 'sparse open pine forest creating a sleek, breathable technical campus feel'
  },

  // --- LANDMARK: TECH MONUMENT ---
  landmark: {
    id: 'monument',
    type: 'monument',
    name: 'Mobile Tech Obelisk',
    position: { x: 900, y: 380 },
    size: { width: 96, height: 96 },
    sprite: 'monument',
    style: 'sleek obelisk structure with geometric channels',
    glowColor: 0x00FF66,
    glowHex: '#00FF66',
    glow: {
      radius: 180,
      intensity: 0.8,
      color: 0x00FF66,
      flicker: false
    },
    particleEffect: {
      type: 'holographic_orbit',
      particleId: 'obelisk-holograms',
      colors: [0x00FF66, 0x00E5FF],
      orbitSpeed: 9000, // 9 seconds per orbit
      count: 6
    },
    audio: {
      key: 'digital-beeps',
      volume: 0.12,
      loop: true
    }
  },

  // --- ATMOSPHERE & AUDIO ---
  atmosphere: {
    music: 'ambient-forest-tech',
    ambience: ['forest', 'digital-beeps', 'subtle-synth-pulse'],
    darknessLevel: 0.3,
    lighting: {
      primarySource: 'monument-glow',
      radius: 180,
      intensity: 0.8,
      color: 0x00FF66,
      flicker: false
    }
  },

  // --- ENTRY & EXIT BEHAVIOR ---
  behavior: {
    onEntryHUD: 'Mobile Valley',
    onEntryDuration: 3000,
    onEntryNPCFacing: 'player',
    onEntryLightingEffect: 'monument-brighten',
    onExitEffect: 'lights-fade-normal',
    barrier: false,
    canLeaveAnytime: true
  },

  // --- HIDDEN ELEMENTS (Easter Eggs) ---
  easterEggs: [
    {
      id: 'charging_station',
      name: 'Device Charging Station',
      x: 860,
      y: 430,
      radius: 22,
      hint: "A perfectly maintained solar-powered tech charging hub.",
      discoveryMessage: "Multi-port USB-C cables coiled neatly beside battery bricks. Ready for long field tests.",
      lore: 'Mobile readiness'
    },
    {
      id: 'smartphone_bench',
      name: 'Smartphone Left on Bench',
      x: 940,
      y: 390,
      radius: 20,
      hint: "A bezel-less test smartphone displaying real-time GMMX member telemetry.",
      discoveryMessage: "The screen lights up with a Flutter hot reload toast notification. Instant feedback.",
      lore: 'Rapid developer iteration'
    },
    {
      id: 'bluetooth_speaker',
      name: 'Minimalist Bluetooth Speaker',
      x: 910,
      y: 440,
      radius: 20,
      hint: "Music for focused mobile coding sessions.",
      discoveryMessage: "A tiny cylindrical speaker humming lo-fi synth beats into the mountain breeze.",
      lore: 'Focused build ambiance'
    }
  ],

  // --- DIALOGUE CONTEXT ---
  dialogueContext: {
    residentNpc: 'mobilearch',
    mobilearchRole: 'Mobile architect, modern tech advocate',
    zoneTheme: 'Building apps for the real world, cross-platform thinking',
    firstMeetingTheme: 'Welcome to modern mobile development',
    firstWords: "Welcome to Mobile Valley. Where apps meet the real world.",
    tierThemes: {
      tier1: "Introduction to GMMX, cross-platform Flutter architecture, and mobile hardware constraints",
      tier2: "Acknowledgment of exploration and how mobile client architectures integrate cloud backends",
      tier3: "Recognition of polymath developer versatility across web, data, and native platforms"
    }
  },

  // --- PROGRESSION & MILESTONES ---
  progression: {
    isStartingZone: false,
    canLeaveAnytime: true,
    requiredBeforeSummit: false,
    revisitable: true,
    completionFlag: 'mobile_visited'
  }
};

/**
 * MobileValleyData Class
 * Provides dedicated query and configuration accessors for game systems.
 */
export class MobileValleyData {
  constructor(customOverrides = {}) {
    this.data = { ...MOBILE_VALLEY_DATA, ...customOverrides };
    // Expose root properties for direct property access
    Object.assign(this, this.data);
  }

  /**
   * Retrieves full core zone layout configuration.
   * @returns {Object}
   */
  getZoneConfig() {
    return {
      ...this.data.zone,
      landmark: this.data.visuals.landmark,
      landmarkPosition: this.data.visuals.landmarkPosition,
      NPCs: [...this.data.npcs.residents],
      projects: [...this.data.projects.visibleProjects]
    };
  }

  /**
   * Retrieves resident NPC spawn configurations.
   * @returns {Object}
   */
  getNpcSpawns() {
    return { ...this.data.npcs.npcSpawnPoints };
  }

  /**
   * Returns full array of projects housed in this zone.
   * @returns {Array<Object>}
   */
  getProjects() {
    return [...this.data.projects.projectList];
  }

  /**
   * Retrieves a specific project by unique ID (case-insensitive).
   * @param {string} id
   * @returns {Object|null}
   */
  getProjectById(id) {
    if (!id) return null;
    const cleanId = String(id).toLowerCase().trim();
    return this.data.projects.projectList.find(p => p.id.toLowerCase() === cleanId) || null;
  }

  /**
   * Retrieves array of orbiting holographic UI elements.
   * @returns {Array<Object>}
   */
  getHolographicElements() {
    return [...this.data.holographicElements];
  }

  /**
   * Retrieves tilemap layout and clearing dimensions.
   * @returns {Object}
   */
  getTilemapData() {
    return { ...this.data.tilemap };
  }

  /**
   * Retrieves tech monument landmark configuration and lighting.
   * @returns {Object}
   */
  getLandmarkData() {
    return { ...this.data.landmark };
  }

  /**
   * Retrieves ambient audio, music, and lighting parameters.
   * @returns {Object}
   */
  getAtmosphereData() {
    return { ...this.data.atmosphere };
  }

  /**
   * Retrieves outbound pathways and relative directions to other biomes.
   * @returns {Object}
   */
  getPathData() {
    return { ...this.data.paths };
  }

  /**
   * Retrieves Mobile Architect interaction themes and dialogue hints.
   * @returns {Object}
   */
  getDialogueContext() {
    return { ...this.data.dialogueContext };
  }

  /**
   * Retrieves hidden easter egg and lore discovery locations in this clearing.
   * @returns {Array<Object>}
   */
  getEasterEggLocations() {
    return [...this.data.easterEggs];
  }
}

// Export singleton instance and default module
export const mobileValleyData = new MobileValleyData();
export default mobileValleyData;
