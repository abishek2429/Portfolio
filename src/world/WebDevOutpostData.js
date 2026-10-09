/**
 * WebDevOutpostData - Web Development Biome Configuration & Data Model
 * 
 * Dark Forest Portfolio Game
 * Defines geometry, cabin workstation landmark, Full-Stack Dev resident NPC,
 * showcased projects (EduVault, CodeXcape), ambient tech audio, and easter eggs.
 */

export const WEB_DEV_OUTPOST_DATA = {
  // --- ZONE BASICS ---
  zone: {
    id: 'webdev',
    name: 'Web Dev Outpost',
    displayName: 'Web Dev Outpost',
    description: "A glowing cabin with screens visible through windows. Code flows like electricity.",
    center: { x: 300, y: 400 },
    radius: 150,
    displayRadius: 120,
    glowColor: 0x00D9FF, // Bright Cyan
    glowColorHex: '#00D9FF',
    bgMusic: 'ambient-forest-tech',
    isStartingZone: false,
    discoverable: true,
    unlockCondition: null
  },

  // --- VISUALS & CABIN LANDMARK ---
  visuals: {
    landmark: 'cabin',
    landmarkPosition: { x: 300, y: 380 },
    landmarkSize: { width: 128, height: 128 },
    tileset: 'forest-tiles',
    terrainType: 'grass with stone paths',
    surroundings: 'Trees cleared away into a spacious open glade with stone paths leading to the workstation',
    buildings: 'Log cabin structure with 4 glowing terminal windows illuminating the clearing',
    lighting: 'Windows cast pulsing cyan and blue screen glow over the surrounding clearing floor',
    atmosphere: 'Busy, productive, welcoming to builders'
  },

  // --- CABIN SPECIFIC DETAILS ---
  cabinDetails: {
    hasWindows: true,
    windowCount: 4,
    hasLights: true,
    lightFlickerCycle: '2-3s gentle asynchronous oscillation',
    hasPathway: true,
    pathwayType: 'cobblestone path to front door',
    interactable: false, // Backdrop landmark
    windowInspectHint: "You peer through the glass: diagrams for EduVault LMS and real-time websockets for CodeXcape fill the terminal monitors."
  },

  // --- RESIDENT NPCS ---
  npcs: {
    residents: ['fullstack'],
    npcSpawnPoints: {
      fullstack: {
        id: 'fullstack',
        name: 'Full-Stack Dev',
        x: 300,
        y: 350,
        facing: 'left',
        sprite: 'npc-dev',
        interactRadius: 80
      }
    },
    interactRadius: 80
  },

  // --- SHOWCASED PROJECTS ---
  projects: {
    visibleProjects: ['eduvault', 'codexcape'],
    projectList: [
      {
        id: 'eduvault',
        name: 'EduVault',
        zone: 'webdev',
        subtitle: 'Collaborative Learning & Assessment Platform',
        description: "A department-level LMS with AI-powered assignment grading",
        fullDescription: "EduVault is a full-featured collaborative educational platform engineered to manage student submissions, streamline grading, and evaluate open-ended subjective assessments using semantic similarity pipelines.",
        tech: ['Java', 'Firebase', 'REST API', 'ASAG'],
        duration: 'Semester 3 (ongoing)',
        collaborators: ['Hari Anand B'],
        keyFeatures: [
          'Role-based access control (admin, instructor, student)',
          'Automated descriptive answer grading using semantic similarity',
          'Real-time notifications for assignment updates',
          'Discussion threads and submission tracking'
        ],
        links: {
          github: 'https://github.com/abishek2429/eduvault',
          docs: '/projects/eduvault/SRS.pdf'
        },
        status: 'in-progress',
        glowColor: '#00D9FF'
      },
      {
        id: 'codexcape',
        name: 'CodeXcape',
        zone: 'webdev',
        subtitle: 'Two-Player Cooperative Technical Escape Room',
        description: "Gamified multiplayer coding escape room with real-time problem solving and telemetry.",
        fullDescription: "CodeXcape immerses developer pairs into a timed collaborative challenge where solving algorithmic puzzles and debugging sandbox code reveals hidden clues to unlock subsequent chambers.",
        tech: ['React', 'WebGL', 'Real-time Sync', 'Node.js', 'Socket.io'],
        duration: 'Semester 3 (completed)',
        collaborators: ['Dev Team'],
        keyFeatures: [
          'Puzzle-based gameplay requiring coding knowledge',
          'Real-time multiplayer synchronization',
          'Interactive web-based interface',
          'Educational game design'
        ],
        links: {
          github: 'https://github.com/abishek2429/codexcape',
          demo: 'https://codexcape-demo.netlify.app'
        },
        status: 'completed',
        glowColor: '#00D9FF'
      }
    ]
  },

  // --- FEATURES & EXPLORATION ---
  features: {
    hasPathsTo: ['foundation', 'aiml', 'mobile', 'summit'],
    discoverable: true,
    isStartingZone: false,
    unlockCondition: null,
    completionFlag: 'webdev_visited'
  },

  // --- PATH CONNECTIONS ---
  paths: {
    foundation: {
      targetZone: 'foundation',
      name: 'Foundation Clearing',
      direction: 'right',
      vector: { x: 300, y: 300 },
      distance: 300,
      unreachable: false,
      hint: 'A cobbled stone trail winding east back to the campfire clearing where you began.'
    },
    aiml: {
      targetZone: 'aiml',
      name: 'AI & ML Woods',
      direction: 'left',
      vector: { x: -100, y: -200 },
      distance: 450,
      unreachable: false,
      hint: 'A dense northwestern footpath leading deeper into the mystical neural pattern temple.'
    },
    mobile: {
      targetZone: 'mobile',
      name: 'Mobile Valley',
      direction: 'bottom-right',
      vector: { x: 600, y: 0 },
      distance: 600,
      unreachable: false,
      hint: 'A wide cross-forest path traveling east towards the neon-lit responsive mobile monolith.'
    },
    summit: {
      targetZone: 'summit',
      name: 'The Summit',
      direction: 'top',
      vector: { x: 300, y: -300 },
      distance: 500,
      unreachable: true,
      unlockRequirement: 3,
      hint: 'A steep mountain path climbing towards the mountain peak. Blocked until 3 clearings are mastered.'
    }
  },

  // Direct alias path properties
  pathToFoundation: { direction: 'right', distance: 300 },
  pathToAiml: { direction: 'left', distance: 450 },
  pathToMobile: { direction: 'bottom-right', distance: 600 },
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
      minX: 100,
      maxX: 500,
      minY: 200,
      maxY: 600
    },
    terrain: 'grass clearing with stone path (tile 4)',
    pathEntrance: 'leads into cabin workstation door',
    cabinCenter: 'cleared footprint centered at (300, 380)',
    boundary: 'moderate tree density opening towards southeast and northwest',
    stonePaths: 'visible direction toward Foundation Clearing, AI Woods, and Mobile Valley'
  },

  // --- LANDMARK: CABIN ---
  landmark: {
    id: 'cabin',
    type: 'cabin',
    name: 'Dev Cabin Workstation',
    position: { x: 300, y: 380 },
    size: { width: 128, height: 128 },
    sprite: 'cabin',
    windows: 4,
    glowColor: 0x00D9FF,
    glowHex: '#00D9FF',
    windowGlows: [
      { id: 'win_1', relX: -36, relY: -16, radius: 45, intensity: 0.85 },
      { id: 'win_2', relX: -12, relY: -16, radius: 45, intensity: 0.90 },
      { id: 'win_3', relX: 12, relY: -16, radius: 45, intensity: 0.80 },
      { id: 'win_4', relX: 36, relY: -16, radius: 45, intensity: 0.95 }
    ],
    particleEffect: null, // No smoke, well-maintained tech cabin
    audio: {
      key: 'keyboard-typing',
      volume: 0.15,
      loop: true
    }
  },

  // --- ATMOSPHERE & AUDIO ---
  atmosphere: {
    music: 'ambient-forest-tech',
    ambience: ['wind', 'keyboard-typing', 'subtle-terminal-hum'],
    darknessLevel: 0.3,
    lighting: {
      primarySource: 'cabin-windows',
      radius: 180,
      intensity: 0.8,
      color: 0x00D9FF, // Cyan glow
      flicker: false
    }
  },

  // --- ENTRY & EXIT BEHAVIOR ---
  behavior: {
    onEntryHUD: 'Web Dev Outpost',
    onEntryDuration: 3000,
    onEntryNPCFacing: 'player',
    onEntryLightingEffect: 'cabin-brighten',
    onExitEffect: 'lights-fade-normal',
    barrier: false,
    canLeaveAnytime: true
  },

  // --- HIDDEN ELEMENTS (Easter Eggs) ---
  easterEggs: [
    {
      id: 'circuit_board',
      name: 'Discarded Circuit Board',
      x: 260,
      y: 440,
      radius: 24,
      hint: "Technology found: A custom microcontroller prototype with burned test leads.",
      discoveryMessage: "You inspect the tiny board. Someone spent long nights soldering breadboards before moving to the browser.",
      lore: 'Hardware origins'
    },
    {
      id: 'energy_drink',
      name: 'Crushed Energy Drink Can',
      x: 340,
      y: 390,
      radius: 20,
      hint: "Fuel for 3 AM deployment sprints.",
      discoveryMessage: "A crumpled aluminum can with citrus flavor residue. Classic developer fuel.",
      lore: 'Late-night hackathons'
    },
    {
      id: 'code_snippet',
      name: 'Monitor Reflection',
      x: 290,
      y: 370,
      radius: 26,
      hint: "A glowing shader script reflecting on the glass pane.",
      discoveryMessage: "Through the glass you catch a glimpse of clean modular React hooks and asynchronous fetch wrappers.",
      lore: 'Clean code architecture'
    }
  ],

  // --- DIALOGUE CONTEXT ---
  dialogueContext: {
    residentNpc: 'fullstack',
    fullstackRole: 'Experienced full-stack developer, mentor',
    zoneTheme: 'Building complete systems, full-stack thinking',
    firstMeetingTheme: "Welcome builder, here's what's possible",
    firstWords: "Ah, a fellow builder. Welcome to the Web Dev Outpost.",
    tierThemes: {
      tier1: "Introduction to EduVault (backend LMS architecture) and CodeXcape (real-time multiplayer web app)",
      tier2: "Acknowledgment of other exploration, discussing how full-stack work bridges UI and backend logic",
      tier3: "Celebration of versatile web foundations before ascending to the summit"
    }
  },

  // --- PROGRESSION & MILESTONES ---
  progression: {
    isStartingZone: false,
    canLeaveAnytime: true,
    requiredBeforeSummit: false,
    revisitable: true,
    completionFlag: 'webdev_visited'
  }
};

/**
 * WebDevOutpostData Class
 * Provides dedicated query and configuration accessors for game systems.
 */
export class WebDevOutpostData {
  constructor(customOverrides = {}) {
    this.data = { ...WEB_DEV_OUTPOST_DATA, ...customOverrides };
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
   * Alias method supporting casing from prompt.
   * @param {string} id
   * @returns {Object|null}
   */
  getProjectByid(id) {
    return this.getProjectById(id);
  }

  /**
   * Retrieves tilemap layout and clearing dimensions.
   * @returns {Object}
   */
  getTilemapData() {
    return { ...this.data.tilemap };
  }

  /**
   * Retrieves cabin landmark configuration, windows, and glow lighting.
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
   * Retrieves Full-Stack Dev interaction themes and dialogue hints.
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
export const webDevOutpostData = new WebDevOutpostData();
export default webDevOutpostData;
