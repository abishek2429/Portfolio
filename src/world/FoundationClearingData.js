/**
 * FoundationClearingData - Starting Biome Configuration & Data Model
 * 
 * Dark Forest Portfolio Game
 * Defines geometry, campfire landmark, Mentor NPC spawn, audio/lighting atmosphere,
 * stone paths, and easter egg alcoves for the Foundation Clearing starting zone.
 */

export const FOUNDATION_CLEARING_DATA = {
  // --- ZONE BASICS ---
  zone: {
    id: 'foundation',
    name: 'Foundation Clearing',
    displayName: 'Foundation Clearing',
    description: "Your journey begins here. A small campfire flickers in the darkness.",
    center: { x: 600, y: 700 },
    radius: 150,
    displayRadius: 120,
    glowColor: 0x4A90FF, // Theme blue glow
    glowColorHex: '#4A90FF',
    campfireGlowColor: 0xFF8800, // Warm orange landmark glow
    bgMusic: 'ambient-forest',
    isStartingZone: true,
    discoverable: true,
    unlockCondition: null
  },

  // --- VISUALS & TERRAIN ---
  visuals: {
    landmark: 'campfire',
    landmarkPosition: { x: 600, y: 720 },
    landmarkSize: { width: 64, height: 64 },
    tileset: 'forest-tiles',
    terrainType: 'grass',
    surroundings: 'Dense pine trees forming a protective natural circular perimeter',
    lighting: 'Campfire provides warm radiant illumination slicing through midnight fog',
    atmosphere: 'Safe, welcoming, mysterious'
  },

  // --- RESIDENT NPCS ---
  npcs: {
    residents: ['mentor'],
    npcSpawnPoints: {
      mentor: {
        id: 'mentor',
        name: 'The Mentor',
        x: 600,
        y: 650,
        facing: 'up',
        sprite: 'npc-mentor',
        interactRadius: 80
      }
    },
    interactRadius: 80
  },

  // --- PROJECTS (Learning Zone) ---
  projects: {
    visibleProjects: [],
    projects: [],
    hiddenProjects: []
  },

  // --- FEATURES & EXPLORATION ---
  features: {
    hasPathsTo: ['webdev', 'aiml', 'mobile'],
    discoverable: true,
    isStartingZone: true,
    unlockCondition: null,
    completionFlag: 'foundation_visited'
  },

  // --- PATH CONNECTIONS ---
  paths: {
    webdev: {
      targetZone: 'webdev',
      name: 'Web Dev Outpost',
      direction: 'left',
      vector: { x: -300, y: -300 },
      distance: 300,
      unreachable: false,
      hint: 'A cobble trail winding west towards distant flickering workstation cabin lights.'
    },
    aiml: {
      targetZone: 'aiml',
      name: 'AI & ML Woods',
      direction: 'top-left',
      vector: { x: -400, y: -500 },
      distance: 400,
      unreachable: false,
      hint: 'A mystical mossy path ascending northwest towards the ancient neural shrine.'
    },
    mobile: {
      targetZone: 'mobile',
      name: 'Mobile Valley',
      direction: 'right',
      vector: { x: 300, y: -300 },
      distance: 300,
      unreachable: false,
      hint: 'A smooth canyon footpath heading east toward the neon responsive monument.'
    },
    summit: {
      targetZone: 'summit',
      name: 'The Summit',
      direction: 'top',
      vector: { x: 0, y: -600 },
      distance: 600,
      unreachable: true,
      unlockRequirement: 3,
      hint: 'A steep mountain trail ascending north into high clouds. Impassable until 3 clearings are mastered.'
    }
  },

  // Direct alias path properties
  pathToWebdev: { direction: 'left', distance: 300 },
  pathToAiml: { direction: 'top-left', distance: 400 },
  pathToMobile: { direction: 'right', distance: 300 },
  pathToSummit: { direction: 'top', distance: 600, unreachable: true },

  // --- TILEMAP DATA ---
  tilemap: {
    size: {
      width: 480,
      height: 320,
      cols: 15,
      rows: 10,
      tileSize: 32
    },
    bounds: {
      minX: 360,
      maxX: 840,
      minY: 540,
      maxY: 860
    },
    terrain: 'mostly grass (tile 0: grass, tile 1: dark grass)',
    boundary: 'trees (tile 2) forming natural circle',
    centerClearing: 'wide open circular meadow centered at (600, 700)',
    campfireLocation: { x: 600, y: 720 },
    paths: 'subtle stone path connectors branching west, northwest, and east'
  },

  // --- LANDMARK: CAMPFIRE ---
  landmark: {
    id: 'campfire',
    type: 'campfire',
    name: 'Clearing Campfire',
    position: { x: 600, y: 720 },
    size: { width: 64, height: 64 },
    sprite: 'campfire',
    animation: {
      key: 'campfire-flicker',
      frames: 3,
      frameRate: 6,
      repeat: -1
    },
    glow: {
      radius: 200,
      intensity: 1.0,
      color: 0xFF8800, // warm orange
      hex: '#FF8800',
      flickers: true,
      flickerRange: { min: 0.85, max: 1.15 }
    },
    particleEffect: {
      type: 'smoke_sparks',
      particleId: 'campfire-embers',
      color: 0xFF7700,
      lifespan: 1200,
      speed: 20,
      rate: 100,
      maxParticles: 12
    },
    audio: {
      key: 'campfire-crackle',
      volume: 0.25,
      loop: true
    }
  },

  // --- ATMOSPHERE & AUDIO ---
  atmosphere: {
    music: 'ambient-forest',
    ambience: ['wind', 'creatures', 'distant-leaves'],
    darknessLevel: 0.3, // 70% dark, 30% ambient visibility
    lighting: {
      primarySource: 'campfire',
      campfireRadius: 200,
      campfireIntensity: 1.0,
      campfireColor: 0xFF8800,
      campfireFlicker: true
    }
  },

  // --- ENTRY & EXIT BEHAVIOR ---
  behavior: {
    onEntryHUD: 'Foundation Clearing',
    onEntryDuration: 3000,
    onEntryMentorFacing: 'player',
    onExitEffect: 'brief-fade',
    barrier: false,
    canLeaveAnytime: true
  },

  // --- HIDDEN ELEMENTS (Easter Eggs) ---
  easterEggs: [
    {
      id: 'ancient_rock',
      name: 'Mossy Inscription',
      x: 530,
      y: 680,
      radius: 24,
      hint: "The clearing remembers every step.",
      discoveryMessage: "You discover ancient runes carved into the moss: 'Every great architect was once a beginner.'",
      lore: 'Origins of the forest traveler'
    },
    {
      id: 'resting_log',
      name: 'Resting Log',
      x: 670,
      y: 730,
      radius: 28,
      hint: "A smooth log worn by travelers pausing to think.",
      discoveryMessage: "You take a quiet breath by the hearth. Your journey has only just started.",
      lore: 'Mindful reflection spot'
    }
  ],

  // --- DIALOGUE CONTEXT ---
  dialogueContext: {
    residentNpc: 'mentor',
    mentorRole: 'Guide and wise sage',
    zoneTheme: 'Foundation of your learning',
    firstMeetingTheme: 'Welcome, journey begins',
    mentorFirstWords: "Welcome, developer. I see you've arrived in this dark forest.",
    tierThemes: {
      tier1: "Introduction, fundamentals, hints at three distinct paths (Web, Data/AI, Mobile)",
      tier2: "Recognition of early exploration, connecting foundational concepts to specialized domains",
      tier3: "Celebration of mastery, reflection on versatile polymath architecture before the summit"
    }
  },

  // --- PROGRESSION & MILESTONES ---
  progression: {
    isStartingZone: true,
    canLeaveAnytime: true,
    requiredBeforeSummit: false,
    revisitable: true,
    completionFlag: 'foundation_visited'
  }
};

/**
 * FoundationClearingData Class
 * Provides dedicated query and configuration accessors for game systems.
 */
export class FoundationClearingData {
  constructor(customOverrides = {}) {
    this.data = { ...FOUNDATION_CLEARING_DATA, ...customOverrides };
    // Expose root properties for direct property access
    Object.assign(this, this.data);
  }

  /**
   * Retrieves the full core zone layout configuration packet.
   * @returns {Object}
   */
  getZoneConfig() {
    return {
      ...this.data.zone,
      landmark: this.data.visuals.landmark,
      landmarkPosition: this.data.visuals.landmarkPosition,
      NPCs: [...this.data.npcs.residents],
      projects: [...this.data.projects.projects]
    };
  }

  /**
   * Retrieves NPC spawn points for resident NPCs.
   * @returns {Object}
   */
  getNpcSpawns() {
    return { ...this.data.npcs.npcSpawnPoints };
  }

  /**
   * Retrieves tilemap geometry and clearing dimensions.
   * @returns {Object}
   */
  getTilemapData() {
    return { ...this.data.tilemap };
  }

  /**
   * Retrieves campfire landmark configuration, animation, and particle data.
   * @returns {Object}
   */
  getLandmarkData() {
    return { ...this.data.landmark };
  }

  /**
   * Retrieves audio, music, and lighting atmospheric settings.
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
   * Retrieves dialogue context, themes, and narrative hints for The Mentor.
   * @returns {Object}
   */
  getDialogueContext() {
    return { ...this.data.dialogueContext };
  }

  /**
   * Retrieves hidden easter egg and secret interactive locations in this clearing.
   * @returns {Array<Object>}
   */
  getEasterEggLocations() {
    return [...this.data.easterEggs];
  }
}

// Export singleton instance and default module
export const foundationClearingData = new FoundationClearingData();
export default foundationClearingData;
