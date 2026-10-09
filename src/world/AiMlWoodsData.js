/**
 * AiMlWoodsData - AI & ML Biome Configuration & Data Model
 * 
 * Dark Forest Portfolio Game
 * Defines geometry, overgrown temple ruins landmark, Ada resident researcher NPC,
 * floating mathematical runes, showcased projects (Sentiment Analysis, IJPREMS paper,
 * TensorFlow learning), ethereal audio, and secret research lab alcoves.
 */

export const AI_ML_WOODS_DATA = {
  // --- ZONE BASICS ---
  zone: {
    id: 'aiml',
    name: 'AI & ML Woods',
    displayName: 'AI & ML Woods',
    description: "Ancient temple ruins overgrown with moss. Mystical glowing runes hover in the air. Data streams shimmer between trees.",
    center: { x: 200, y: 200 },
    radius: 150,
    displayRadius: 120,
    glowColor: 0xB300FF, // Mystical Purple
    glowColorHex: '#B300FF',
    bgMusic: 'ambient-forest-mystery',
    isStartingZone: false,
    discoverable: true,
    unlockCondition: null
  },

  // --- VISUALS & TEMPLE LANDMARK ---
  visuals: {
    landmark: 'temple',
    landmarkPosition: { x: 200, y: 180 },
    landmarkSize: { width: 128, height: 128 },
    tileset: 'forest-tiles',
    terrainType: 'ancient mossy clearing with ruin fragments',
    surroundings: 'Dense pine canopy filtering twilight with glowing particles drifting between trunks',
    buildings: 'Ancient stone temple structure half-buried in creeping ivy and glowing moss',
    lighting: 'Mystical purple radial aura accented by hovering mathematical runes and shimmering cyan data streams',
    atmosphere: 'Intellectual, mysterious, deep, research-focused'
  },

  // --- TEMPLE SPECIFIC DETAILS ---
  templeDetails: {
    hasRunes: true,
    hasVegetation: true,
    hasParticles: true,
    interactable: false, // Backdrop landmark
    architecturalStyle: 'Ancient Asian-inspired shrine overgrown with mystical flora',
    runeInspectHint: "You study the hovering glyphs: gradient descent vectors and Bayes theorem equations pulse in rhythm."
  },

  // --- FLOATING MATHEMATICAL RUNES ---
  floatingRunes: [
    { formula: '∑ xi²', label: 'Sum of Squares', concept: 'Loss functions and variance', yOffset: -30 },
    { formula: 'P(A|B)', label: 'Bayes Theorem', concept: 'Conditional probability and inference', yOffset: -50 },
    { formula: '∇f(x)', label: 'Gradient Vector', concept: 'Optimization and backpropagation', yOffset: -20 },
    { formula: 'σ', label: 'Sigmoid / Standard Deviation', concept: 'Activation functions and distribution', yOffset: -40 }
  ],

  // --- DATA STREAM PARTICLES ---
  dataStreams: {
    type: 'flowing_lines',
    colors: ['#00FF99', '#00D9FF', '#B300FF'],
    emissionRate: 80,
    lifetime: 4000,
    flowDirection: 'outward from temple to forest'
  },

  // --- RESIDENT NPCS ---
  npcs: {
    residents: ['ada'],
    npcSpawnPoints: {
      ada: {
        id: 'ada',
        name: 'Ada',
        x: 200,
        y: 150,
        facing: 'down',
        sprite: 'npc-ada',
        interactRadius: 80
      }
    },
    interactRadius: 80
  },

  // --- SHOWCASED PROJECTS ---
  projects: {
    visibleProjects: ['sentiment', 'ijprems', 'tensorflow'],
    projectList: [
      {
        id: 'sentiment',
        name: 'Twitter Sentiment Analysis',
        zone: 'aiml',
        subtitle: 'Real-Time NLP Sentiment Pipeline',
        description: "Solo project analyzing sentiment in Twitter data using NLP",
        fullDescription: "A machine learning pipeline that extracts, tokenizes, and classifies live Twitter streams into positive, negative, and neutral sentiment categories using custom NLP feature extraction and supervised models.",
        tech: ['Python', 'Scikit-learn', 'NLTK', 'Data Analysis', 'Flask'],
        duration: 'Solo project',
        collaborators: [],
        keyFeatures: [
          'Real Twitter data sentiment classification',
          'NLP preprocessing and feature extraction',
          'Machine learning model training and evaluation',
          'Insights into public sentiment patterns'
        ],
        links: {
          github: 'https://github.com/abishek2429/twitter-sentiment-analysis'
        },
        status: 'completed',
        glowColor: '#B300FF'
      },
      {
        id: 'ijprems',
        name: 'IJPREMS Paper - Employee Well-being via NLP',
        zone: 'aiml',
        subtitle: 'Published Peer-Reviewed Academic Research',
        description: "Published research on sentiment analysis for employee well-being",
        fullDescription: "A formal peer-reviewed academic publication investigating automated emotional polarity analysis within enterprise workforce feedback, demonstrating quantifiable improvements in organizational satisfaction tracking.",
        tech: ['Python', 'NLP', 'Sentiment Analysis', 'Research Methodology', 'Latex'],
        duration: 'Published research',
        collaborators: ['Research team'],
        keyFeatures: [
          'Peer-reviewed publication in IJPREMS journal',
          'Novel approach to employee well-being measurement',
          'Sentiment analysis on employee feedback data',
          'Practical implications for HR and organizational development'
        ],
        links: {
          paper: '/research/ijprems-employee-wellbeing.pdf'
        },
        status: 'published',
        glowColor: '#B300FF'
      },
      {
        id: 'tensorflow',
        name: 'TensorFlow Learning',
        zone: 'aiml',
        subtitle: 'Deep Learning & Neural Network Experiments',
        description: "Ongoing exploration of neural networks and deep learning",
        fullDescription: "An expansive portfolio repository documenting deep learning implementations, convolutional vision classifiers, recurrent sequential models, and custom training loops implemented in TensorFlow and Keras.",
        tech: ['TensorFlow', 'Python', 'Neural Networks', 'Deep Learning', 'Keras'],
        duration: 'In progress (learning)',
        collaborators: [],
        keyFeatures: [
          'Learning neural network architectures',
          'Building deep learning models and convolutional classifiers',
          'Exploring TensorFlow framework capabilities and tensor manipulation',
          'Preparing for advanced generative and multi-modal ML work'
        ],
        links: {
          github: 'https://github.com/abishek2429/tensorflow-learning'
        },
        status: 'in-progress',
        glowColor: '#B300FF'
      }
    ]
  },

  // --- FEATURES & EXPLORATION ---
  features: {
    hasPathsTo: ['foundation', 'webdev', 'mobile', 'summit'],
    discoverable: true,
    isStartingZone: false,
    unlockCondition: null,
    completionFlag: 'aiml_visited'
  },

  // --- PATH CONNECTIONS ---
  paths: {
    foundation: {
      targetZone: 'foundation',
      name: 'Foundation Clearing',
      direction: 'bottom-right',
      vector: { x: 400, y: 500 },
      distance: 450,
      unreachable: false,
      hint: 'A mossy southeast trail leading back down to the campfire in Foundation Clearing.'
    },
    webdev: {
      targetZone: 'webdev',
      name: 'Web Dev Outpost',
      direction: 'right',
      vector: { x: 100, y: 200 },
      distance: 450,
      unreachable: false,
      hint: 'A winding trail heading east towards the flickering terminal windows of the Web Dev cabin.'
    },
    mobile: {
      targetZone: 'mobile',
      name: 'Mobile Valley',
      direction: 'bottom-right',
      vector: { x: 700, y: 200 },
      distance: 650,
      unreachable: false,
      hint: 'A long forest traverse cutting southeast towards the canyon of Mobile Valley.'
    },
    summit: {
      targetZone: 'summit',
      name: 'The Summit',
      direction: 'top',
      vector: { x: 400, y: -100 },
      distance: 600,
      unreachable: true,
      unlockRequirement: 3,
      hint: 'An overgrown stone stairway leading upwards to the misty mountain summit. Barred until 3 clearings are mastered.'
    }
  },

  // Direct alias path properties
  pathToFoundation: { direction: 'bottom-right', distance: 450 },
  pathToWebdev: { direction: 'right', distance: 450 },
  pathToMobile: { direction: 'bottom-right', distance: 650 },
  pathToSummit: { direction: 'top', distance: 600, unreachable: true },

  // --- TILEMAP DATA ---
  tilemap: {
    size: {
      width: 704,
      height: 576,
      cols: 22,
      rows: 18,
      tileSize: 32
    },
    bounds: {
      minX: 50,
      maxX: 400,
      minY: 50,
      maxY: 380
    },
    terrain: 'dense mystical forest with ancient mossy stones and ruin slabs',
    templeCenter: 'cleared sacred clearing centered at (200, 180)',
    boundary: 'dense ancient tree ring providing an insulated, scholarly sanctuary',
    stonePaths: 'subtle moss-overgrown paths branching east towards Web Dev and southeast towards Foundation'
  },

  // --- LANDMARK: TEMPLE RUINS ---
  landmark: {
    id: 'temple',
    type: 'temple',
    name: 'Neural Temple Ruins',
    position: { x: 200, y: 180 },
    size: { width: 128, height: 128 },
    sprite: 'temple',
    hasRunes: true,
    hasVegetation: true,
    glowColor: 0xB300FF,
    glowHex: '#B300FF',
    glow: {
      radius: 200,
      intensity: 0.9,
      color: 0xB300FF,
      flickers: true,
      pulseSpeed: 2000
    },
    particleEffect: {
      type: 'data_streams',
      particleId: 'temple-runes',
      colors: [0x00FF99, 0x00D9FF, 0xB300FF],
      speed: 15,
      rate: 120,
      lifespan: 3500
    },
    audio: {
      key: 'mystical-drone',
      volume: 0.15,
      loop: true
    }
  },

  // --- ATMOSPHERE & AUDIO ---
  atmosphere: {
    music: 'ambient-forest-mystery',
    ambience: ['forest', 'digital-tones', 'mystical-resonance'],
    darknessLevel: 0.4, // Slightly darker, deep intellectual atmosphere
    lighting: {
      primarySource: 'temple-glow',
      radius: 200,
      intensity: 0.9,
      color: 0xB300FF,
      flicker: true
    }
  },

  // --- ENTRY & EXIT BEHAVIOR ---
  behavior: {
    onEntryHUD: 'AI & ML Woods',
    onEntryDuration: 3000,
    onEntryNPCFacing: 'player',
    onEntryLightingEffect: 'temple-brighten',
    onExitEffect: 'lights-fade-baseline',
    barrier: false,
    canLeaveAnytime: true
  },

  // --- HIDDEN ELEMENTS (Easter Eggs) ---
  easterEggs: [
    {
      id: 'ancient_tome',
      name: 'Weathered Research Tome',
      x: 160,
      y: 240,
      radius: 24,
      hint: "Dusty research journal, barely legible: 'The architecture learns what the data provides.'",
      discoveryMessage: "You carefully open the bound volume. Inside are handwritten derivations of gradient descent and neural backpropagation.",
      lore: 'Scholarly heritage'
    },
    {
      id: 'research_notes',
      name: 'Scattered Formula Drafts',
      x: 240,
      y: 220,
      radius: 22,
      hint: "Loose parchment sheets scattered by the breeze, covered in empirical training curves.",
      discoveryMessage: "You collect the notes: validation loss curves plateauing gracefully as hyperparameter tuning converges.",
      lore: 'Empirical model experimentation'
    },
    {
      id: 'secret_research_lab',
      name: 'Hidden Archive Alcove',
      x: 140,
      y: 160,
      radius: 30,
      hint: "A concealed archway behind temple vines. Sealed until all forest clearings are unlocked.",
      discoveryMessage: "The vine curtain recedes, revealing an ancient stone repository of groundbreaking machine learning models.",
      lore: 'Secret research sanctuary'
    }
  ],

  // --- DIALOGUE CONTEXT ---
  dialogueContext: {
    residentNpc: 'ada',
    adaRole: 'Data scientist, researcher, intellectual guide',
    zoneTheme: 'Understanding patterns, research, data science',
    firstMeetingTheme: 'Welcome to the forest of data and patterns',
    firstWords: "The forest grows thicker here. You've found the AI & ML Woods.",
    tierThemes: {
      tier1: "Introduction to sentiment analysis NLP pipelines and published peer-reviewed research in IJPREMS",
      tier2: "Acknowledgment of broader exploration, discussing how mathematics uncovers truth beneath interface pixels",
      tier3: "Celebration of balancing academic rigor with practical application before the summit ascent"
    }
  },

  // --- PROGRESSION & MILESTONES ---
  progression: {
    isStartingZone: false,
    canLeaveAnytime: true,
    requiredBeforeSummit: false,
    revisitable: true,
    completionFlag: 'aiml_visited',
    secretLabUnlocked: false
  }
};

/**
 * AiMlWoodsData Class
 * Provides dedicated query and configuration accessors for game systems.
 */
export class AiMlWoodsData {
  constructor(customOverrides = {}) {
    this.data = { ...AI_ML_WOODS_DATA, ...customOverrides };
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
   * Retrieves array of hovering mathematical formulas and glyphs.
   * @returns {Array<string|Object>}
   */
  getFloatingRunes() {
    return this.data.floatingRunes.map(r => r.formula || r);
  }

  /**
   * Retrieves tilemap layout and clearing dimensions.
   * @returns {Object}
   */
  getTilemapData() {
    return { ...this.data.tilemap };
  }

  /**
   * Retrieves temple landmark configuration, runes, and lighting.
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
   * Retrieves Ada researcher interaction themes and dialogue hints.
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
export const aiMlWoodsData = new AiMlWoodsData();
export default aiMlWoodsData;
