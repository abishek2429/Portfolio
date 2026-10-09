/**
 * SummitNexusData - Mountain Peak & Synthesis Biome Configuration & Data Model
 * 
 * Dark Forest Portfolio Game
 * Defines geometry, celestial mountain peak landmark, Future You NPC spawn,
 * 4-zone light beam convergence, star field, synthesis portfolio view,
 * triumphant orchestral audio, and unlock gating requirements.
 */

import { FOUNDATION_CLEARING_DATA } from './FoundationClearingData.js';
import { WEB_DEV_OUTPOST_DATA } from './WebDevOutpostData.js';
import { AI_ML_WOODS_DATA } from './AiMlWoodsData.js';
import { MOBILE_VALLEY_DATA } from './MobileValleyData.js';

export const SUMMIT_NEXUS_DATA = {
  // --- ZONE BASICS ---
  zone: {
    id: 'summit',
    name: 'The Summit',
    displayName: 'The Summit',
    description: "A mountain peak at night, stars overhead. A massive glowing nexus where all zone lights converge. Your journey's full picture.",
    center: { x: 600, y: 100 },
    radius: 200, // Grand detection boundary
    displayRadius: 150, // Grand glowing aura
    glowColor: 0xFFD700, // Brilliant Radiant Gold
    glowColorHex: '#FFD700',
    bgMusic: 'ambient-forest-triumphant',
    isStartingZone: false,
    isFinalZone: true,
    discoverable: false // Conditional unlock
  },

  // --- UNLOCK CONDITIONS ---
  unlockConditions: {
    zonesVisited: 3,
    npcsMetCount: 2,
    hint: "Master at least 3 distinct clearings and speak to 2 resident mentors to open the stairway to the Summit."
  },

  // --- VISUALS & MOUNTAIN PEAK LANDMARK ---
  visuals: {
    landmark: 'mountain-peak',
    landmarkPosition: { x: 600, y: 80 },
    landmarkSize: { width: 256, height: 256 },
    tileset: 'mountain-peak-tiles',
    terrainType: 'elevated alpine stone plateau with celestial aura',
    surroundings: 'Sparse alpine windswept trees at distant perimeter, open starry night sky canopy',
    buildings: 'Monumental golden nexus obelisk where radiant light beams from lower clearings converge',
    lighting: 'Brilliant gold radiant illumination merging blue, cyan, purple, and green beams into white-gold light',
    atmosphere: 'Triumphant, reflective, culmination, golden, celestial'
  },

  // --- PEAK SPECIFIC DETAILS ---
  peakDetails: {
    hasNexus: true,
    hasStars: true,
    hasLighting: true,
    hasParticles: true,
    interactable: false, // Destination landmark
    architecturalStyle: 'Celestial mountain summit crowned with an ancient geometric energy nexus',
    inspectHint: "You gaze into the nexus: every line of code, published finding, and mobile interface you created resonates in harmony."
  },

  // --- LIGHT BEAMS CONVERGENCE ---
  lightBeams: [
    { source: 'foundation', zoneName: 'Foundation Clearing', color: 0x4A90FF, colorHex: '#4A90FF', direction: 'bottom', angleDeg: 90 },
    { source: 'webdev', zoneName: 'Web Dev Outpost', color: 0x00D9FF, colorHex: '#00D9FF', direction: 'bottom-left', angleDeg: 135 },
    { source: 'aiml', zoneName: 'AI & ML Woods', color: 0xB300FF, colorHex: '#B300FF', direction: 'bottom-left-far', angleDeg: 160 },
    { source: 'mobile', zoneName: 'Mobile Valley', color: 0x00FF66, colorHex: '#00FF66', direction: 'bottom-right', angleDeg: 45 }
  ],

  // Convergence Animation Configuration
  beamAnimation: {
    rotationPeriodMs: 8000,
    intensityMin: 0.6,
    intensityMax: 1.0,
    pulseSpeedMs: 2000,
    convergenceFocalPoint: { x: 600, y: 80 }
  },

  // --- STAR FIELD CELESTIAL BACKDROP ---
  starField: {
    displayStars: true,
    starCount: 75,
    colors: ['#FFFFFF', '#FFF9D2', '#FFE484', '#E0F7FA'],
    minAlpha: 0.4,
    maxAlpha: 1.0,
    twinkleDurationRange: { min: 1200, max: 2800 }
  },

  // --- RESIDENT NPCS ---
  npcs: {
    residents: ['futureyou'],
    npcSpawnPoints: {
      futureyou: {
        id: 'futureyou',
        name: 'Future You',
        x: 600,
        y: 50,
        facing: 'down',
        sprite: 'npc-futureyou',
        interactRadius: 100 // Welcoming aura
      }
    },
    interactRadius: 100
  },

  // --- PROJECTS (SYNTHESIS VIEW - ALL 6 PROJECTS) ---
  projects: {
    displayMode: 'synthesis',
    visibleProjects: ['eduvault', 'codexcape', 'sentiment', 'ijprems', 'tensorflow', 'gmmx'],
    projectList: [
      ...(WEB_DEV_OUTPOST_DATA?.projects?.projectList || []),
      ...(AI_ML_WOODS_DATA?.projects?.projectList || []),
      ...(MOBILE_VALLEY_DATA?.projects?.projectList || [])
    ]
  },

  // --- RESUME & PROFESSIONAL PROFILE ---
  profile: {
    candidateName: 'Abishek S',
    title: 'Full-Stack Developer | Data Scientist | Mobile Developer',
    headline: 'Polymath software engineer bridging web ecosystems, machine learning models, and native mobile interfaces.',
    skillsSummary: [
      'Java', 'React', 'Node.js', 'Python', 'Flutter',
      'Dart', 'Firebase', 'TensorFlow', 'REST APIs', 'WebGL',
      'NLP', 'Scikit-Learn', 'Socket.io', 'Git', 'Docker'
    ],
    links: {
      github: 'https://github.com/abishek2429',
      portfolio: 'https://portfolio-dark-forest.vercel.app',
      resumeUrl: '/resume/Abishek_S_Resume.pdf'
    }
  },

  // --- FEATURES & EXPLORATION ---
  features: {
    hasPathsTo: ['foundation', 'webdev', 'aiml', 'mobile'],
    discoverable: false,
    isStartingZone: false,
    isFinalZone: true,
    completionFlag: 'summit_reached'
  },

  // --- PATH CONNECTIONS (RETURNING PATHWAYS) ---
  paths: {
    foundation: {
      targetZone: 'foundation',
      name: 'Foundation Clearing',
      direction: 'bottom',
      vector: { x: 0, y: 600 },
      distance: 600,
      unreachable: false,
      hint: 'A grand stone flight of steps descending directly south back to the starting campfire.'
    },
    webdev: {
      targetZone: 'webdev',
      name: 'Web Dev Outpost',
      direction: 'bottom-left',
      vector: { x: -300, y: 300 },
      distance: 500,
      unreachable: false,
      hint: 'A mountain trail leading southwest towards the glowing cabin workstation.'
    },
    aiml: {
      targetZone: 'aiml',
      name: 'AI & ML Woods',
      direction: 'bottom-left',
      vector: { x: -400, y: 100 },
      distance: 600,
      unreachable: false,
      hint: 'A mossy mountain staircase heading west into the mystical ancient AI temple.'
    },
    mobile: {
      targetZone: 'mobile',
      name: 'Mobile Valley',
      direction: 'bottom-right',
      vector: { x: 300, y: 300 },
      distance: 500,
      unreachable: false,
      hint: 'A smooth canyon descent heading southeast towards the neon mobile obelisk.'
    }
  },

  // Direct alias path properties
  pathToFoundation: { direction: 'bottom', distance: 600 },
  pathToWebdev: { direction: 'bottom-left', distance: 500 },
  pathToAiml: { direction: 'bottom-left', distance: 600 },
  pathToMobile: { direction: 'bottom-right', distance: 500 },

  // --- TILEMAP DATA ---
  tilemap: {
    size: {
      width: 576,
      height: 448,
      cols: 18,
      rows: 14,
      tileSize: 32
    },
    bounds: {
      minX: 350,
      maxX: 850,
      minY: 0,
      maxY: 300
    },
    terrain: 'alpine stone plateau with luminous nexus paving',
    peakCenter: 'open elevated celestial nexus centered at (600, 80)',
    sparseTrees: 'only along distant cliffs, creating immense altitude feeling',
    stonePaths: 'golden engraved stone stairs fanning outwards to all 4 lower clearings'
  },

  // --- LANDMARK: MOUNTAIN PEAK NEXUS ---
  landmark: {
    id: 'mountain-peak',
    type: 'mountain-peak-nexus',
    name: 'Summit Celestial Nexus',
    position: { x: 600, y: 80 },
    size: { width: 256, height: 256 },
    sprite: 'mountain-peak',
    hasLightBeams: true,
    hasStars: true,
    glowColor: 0xFFD700,
    glowHex: '#FFD700',
    glow: {
      radius: 250,
      intensity: 1.0,
      color: 0xFFD700,
      flicker: false,
      pulseRange: { min: 0.9, max: 1.1 }
    },
    audio: {
      key: 'celestial-chimes',
      volume: 0.2,
      loop: true
    }
  },

  // --- ATMOSPHERE & AUDIO ---
  atmosphere: {
    music: 'ambient-forest-triumphant',
    ambience: ['celestial-wind', 'chimes', 'distant-echoes'],
    darknessLevel: 0.2, // Lightest zone, radiant golden illumination
    hasStarField: true,
    lighting: {
      primarySource: 'peak-radiance',
      radius: 250,
      intensity: 1.0,
      color: 0xFFD700,
      flicker: false
    }
  },

  // --- ENTRY & EXIT BEHAVIOR ---
  behavior: {
    onEntryHUD: 'The Summit',
    onEntryDuration: 3500,
    onEntryNPCFacing: 'player',
    onEntryLightingEffect: 'nexus-convergence-flare',
    onExitEffect: 'lights-fade-normal',
    barrier: false,
    canLeaveAnytime: true
  },

  // --- HIDDEN ELEMENTS (Easter Eggs) ---
  easterEggs: [
    {
      id: 'reflection_pool',
      name: 'Pool of Reflection',
      x: 540,
      y: 110,
      radius: 26,
      hint: "A crystal-clear alpine water basin mirroring the starry cosmos.",
      discoveryMessage: "You lean over the still water. The person looking back is capable, multifaceted, and ready for what lies ahead.",
      lore: 'Self-realization'
    },
    {
      id: 'hidden_journal',
      name: 'Summit Journal Inscription',
      x: 660,
      y: 90,
      radius: 24,
      hint: "A bound leather volume left on a stone dais at the peak.",
      discoveryMessage: "A passage reads: 'True mastery is not knowing one tool, but harmonizing many into a cohesive vision.'",
      lore: 'The Polymath Manifesto'
    },
    {
      id: 'time_capsule_shrine',
      name: 'Fellowship Time Capsule',
      x: 600,
      y: 140,
      radius: 28,
      hint: "A metallic shrine containing echoes from the Mentor, Full-Stack Dev, Ada, and Mobile Architect.",
      discoveryMessage: "Warm notes of encouragement from every friend you made along the dark forest trails.",
      lore: 'Community and mentorship'
    }
  ],

  // --- DIALOGUE CONTEXT ---
  dialogueContext: {
    residentNpc: 'futureyou',
    futureYouRole: 'Reflection of your future self, affirmer of growth',
    zoneTheme: 'Synthesis of all learning, looking forward',
    firstMeetingTheme: 'Recognition of full journey',
    firstWords: "You've made it. Do you recognize this face?",
    tierThemes: {
      tier1: "Recognition of the full journey across Web, AI/ML, and Mobile development",
      tier2: "Deeper reflection on the polymath generalist identity and unifying diverse toolsets",
      tier3: "Most personal celebration of growth, affirming future potential and readiness for challenges"
    }
  },

  // --- PROGRESSION & MILESTONES ---
  progression: {
    isStartingZone: false,
    isFinalZone: true,
    canLeaveAnytime: true,
    revisitable: true,
    completionFlag: 'summit_reached',
    trueEndingTrigger: true
  }
};

/**
 * SummitNexusData Class
 * Provides dedicated query, synthesis, and unlock verification methods.
 */
export class SummitNexusData {
  constructor(customOverrides = {}) {
    this.data = { ...SUMMIT_NEXUS_DATA, ...customOverrides };
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
   * Returns all 6 portfolio projects across the entire game (Synthesis View).
   * @returns {Array<Object>}
   */
  getProjects() {
    return [...this.data.projects.projectList];
  }

  /**
   * Retrieves tilemap layout and clearing dimensions.
   * @returns {Object}
   */
  getTilemapData() {
    return { ...this.data.tilemap };
  }

  /**
   * Retrieves mountain peak nexus landmark configuration and lighting.
   * @returns {Object}
   */
  getLandmarkData() {
    return { ...this.data.landmark };
  }

  /**
   * Retrieves light beam convergence configuration and animation parameters.
   * @returns {Object}
   */
  getLightBeamData() {
    return {
      beams: [...this.data.lightBeams],
      animation: { ...this.data.beamAnimation }
    };
  }

  /**
   * Retrieves ambient audio, celestial star field, and radiant lighting parameters.
   * @returns {Object}
   */
  getAtmosphereData() {
    return { ...this.data.atmosphere, starField: { ...this.data.starField } };
  }

  /**
   * Retrieves outbound pathways returning to all lower biomes.
   * @returns {Object}
   */
  getPathData() {
    return { ...this.data.paths };
  }

  /**
   * Retrieves Future You interaction themes and dialogue hints.
   * @returns {Object}
   */
  getDialogueContext() {
    return { ...this.data.dialogueContext };
  }

  /**
   * Returns the exact unlock conditions required to access the summit.
   * @returns {Object}
   */
  getUnlockConditions() {
    return { ...this.data.unlockConditions };
  }

  /**
   * Checks whether the summit is unlocked given active GameState.
   * Requires 3+ visited zones and 2+ NPCs spoken to.
   * 
   * @param {Object} gameState - GameState instance or snapshot
   * @returns {boolean} True if accessible
   */
  isUnlocked(gameState) {
    if (!gameState) return false;

    // Check zones visited count (must visit at least 3 distinct clearings)
    const zonesVisited = Array.isArray(gameState.zonesVisited)
      ? gameState.zonesVisited
      : (gameState.zonesVisited ? Array.from(gameState.zonesVisited) : []);
    const visitedCount = zonesVisited.length;

    // Check NPCs interacted count (must converse with at least 2 mentors)
    let npcsMetCount = 0;
    if (gameState.npcsInteracted && typeof gameState.npcsInteracted === 'object') {
      npcsMetCount = Object.keys(gameState.npcsInteracted).length;
    } else if (Array.isArray(gameState.npcsMet)) {
      npcsMetCount = gameState.npcsMet.length;
    }

    const req = this.data.unlockConditions;
    return visitedCount >= req.zonesVisited && npcsMetCount >= req.npcsMetCount;
  }

  /**
   * Retrieves hidden easter egg and lore discovery locations in this clearing.
   * @returns {Array<Object>}
   */
  getEasterEggLocations() {
    return [...this.data.easterEggs];
  }

  /**
   * Retrieves candidate resume and summary portfolio metadata.
   * @returns {Object}
   */
  getProfileData() {
    return { ...this.data.profile };
  }
}

// Export singleton instance and default module
export const summitNexusData = new SummitNexusData();
export default summitNexusData;
