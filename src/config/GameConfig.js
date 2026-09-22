/**
 * GameConfig - Centralized Configuration & Single Source of Truth
 * 
 * Dark Forest Portfolio Game
 * Contains all core game dimensions, zone anchors, NPC coordinates,
 * project metadata, UI metrics, audio volumes, and easter egg locations.
 * Fully immutable via deepFreeze().
 */

/**
 * Deep freezes an object and all nested children to guarantee immutability.
 * @param {Object} obj 
 * @returns {Object} Frozen object
 */
function deepFreeze(obj) {
  Object.keys(obj).forEach(prop => {
    if (
      typeof obj[prop] === 'object' &&
      obj[prop] !== null &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

const rawConfig = {
  // --- GAME SETTINGS ---
  GAME: {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    TILE_SIZE: 32,
    PLAYER_SPEED: 150,
    PLAYER_START_X: 600,
    PLAYER_START_Y: 700
  },

  // --- ZONE SETTINGS ---
  ZONES: {
    foundation: {
      id: 'foundation',
      name: 'Foundation Clearing',
      x: 600,
      y: 700,
      radius: 150,
      glowColor: 0x4A90FF,
      landmark: 'campfire',
      description: 'The starting clearing in the Dark Forest. Warm fire, developer origin story, and core fundamentals.'
    },
    webdev: {
      id: 'webdev',
      name: 'Web Dev Outpost',
      x: 300,
      y: 400,
      radius: 150,
      glowColor: 0x00D9FF,
      landmark: 'cabin',
      description: 'A cozy log cabin workstation filled with modern web stacks, interactive UI apps, and cloud tools.'
    },
    aiml: {
      id: 'aiml',
      name: 'AI & ML Woods',
      x: 200,
      y: 200,
      radius: 150,
      glowColor: 0xB300FF,
      landmark: 'temple',
      description: 'Mystical ancient woods resonating with neural nets, data models, and published research papers.'
    },
    mobile: {
      id: 'mobile',
      name: 'Mobile Valley',
      x: 900,
      y: 400,
      radius: 150,
      glowColor: 0x00FF66,
      landmark: 'monument',
      description: 'A lush canyon honoring mobile architecture, responsive applications, and native performance.'
    },
    summit: {
      id: 'summit',
      name: 'The Summit',
      x: 600,
      y: 100,
      radius: 200,
      glowColor: 0xFFD700,
      landmark: 'mountain-peak',
      description: 'The highest peak of the Dark Forest. Unlocked after mastering lower zones. Future aspirations.'
    }
  },

  // --- NPC SETTINGS ---
  NPCS: {
    mentor: {
      id: 'mentor',
      name: 'The Mentor',
      x: 600,
      y: 650,
      sprite: 'npc-mentor',
      zone: 'foundation',
      role: 'Career Guide & Origins'
    },
    fullstack: {
      id: 'fullstack',
      name: 'Full-Stack Dev',
      x: 300,
      y: 350,
      sprite: 'npc-dev',
      zone: 'webdev',
      role: 'Frontend & Architecture Specialist'
    },
    ada: {
      id: 'ada',
      name: 'Ada',
      x: 200,
      y: 150,
      sprite: 'npc-ada',
      zone: 'aiml',
      role: 'AI Researcher & Data Scientist'
    },
    mobilearch: {
      id: 'mobilearch',
      name: 'Mobile Architect',
      x: 900,
      y: 350,
      sprite: 'npc-mobilearch',
      zone: 'mobile',
      role: 'Native Ecosystems Lead'
    },
    futureyou: {
      id: 'futureyou',
      name: 'Future You',
      x: 600,
      y: 50,
      sprite: 'npc-futureyou',
      zone: 'summit',
      role: 'Visionary & Climax Guide'
    }
  },

  // --- PROJECT SETTINGS ---
  PROJECTS: {
    eduvault: {
      id: 'eduvault',
      name: 'EduVault',
      zone: 'webdev',
      x: 270,
      y: 420,
      tech: ['Java', 'Firebase', 'REST API', 'Android'],
      category: 'Full-Stack Platform',
      summary: 'Secure educational assessment and document vault management system.',
      githubUrl: 'https://github.com/abishek2429/EduVault',
      demoUrl: '#'
    },
    codexcape: {
      id: 'codexcape',
      name: 'CodeXcape',
      zone: 'webdev',
      x: 350,
      y: 390,
      tech: ['React', 'Node.js', 'Socket.io', 'TailwindCSS'],
      category: 'Web Application',
      summary: 'Gamified multiplayer coding escape room with real-time problem solving and telemetry.',
      githubUrl: 'https://github.com/abishek2429/CodeXcape',
      demoUrl: '#'
    },
    sentiment: {
      id: 'sentiment',
      name: 'Twitter Sentiment Analysis',
      zone: 'aiml',
      x: 180,
      y: 220,
      tech: ['Python', 'NLP', 'Scikit-Learn', 'Flask'],
      category: 'Machine Learning',
      summary: 'Real-time NLP sentiment pipeline classifying live tweet streams into emotional polarities.',
      githubUrl: 'https://github.com/abishek2429/Twitter-Sentiment-Analysis',
      demoUrl: '#'
    },
    ijprems: {
      id: 'ijprems',
      name: 'IJPREMS Paper',
      zone: 'aiml',
      x: 230,
      y: 170,
      tech: ['Machine Learning', 'Research', 'Python', 'Latex'],
      category: 'Academic Publication',
      summary: 'Peer-reviewed research paper published in IJPREMS journal covering modern predictive models.',
      githubUrl: '#',
      demoUrl: '#'
    },
    tensorflow: {
      id: 'tensorflow',
      name: 'TensorFlow Learning',
      zone: 'aiml',
      x: 250,
      y: 240,
      tech: ['TensorFlow', 'Deep Learning', 'Keras', 'Computer Vision'],
      category: 'Deep Learning',
      summary: 'Deep neural networks and computer vision experiments with custom convolutional architectures.',
      githubUrl: 'https://github.com/abishek2429/TensorFlow-Deep-Learning',
      demoUrl: '#'
    },
    gmmx: {
      id: 'gmmx',
      name: 'GMMX',
      zone: 'mobile',
      x: 920,
      y: 420,
      tech: ['Android', 'Kotlin', 'Jetpack Compose', 'MVVM'],
      category: 'Mobile System',
      summary: 'Feature-rich Android utility application engineered for fluid touch gestures and offline resilience.',
      githubUrl: 'https://github.com/abishek2429/GMMX',
      demoUrl: '#'
    }
  },

  // --- UI SETTINGS ---
  UI: {
    HUD_PADDING: 20,
    MODAL_WIDTH: 700,
    MODAL_HEIGHT: 500,
    GLOW_INTENSITY: 0.8,
    PARTICLE_COUNT: 50
  },

  // --- AUDIO SETTINGS ---
  AUDIO: {
    MASTER_VOLUME: 0.7,
    AMBIENT_VOLUME: 0.5,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.6
  },

  // --- GAME BALANCE ---
  BALANCE: {
    ZONES_TO_UNLOCK_SUMMIT: 3,
    NPCS_FOR_SECRET: 5,
    EASTER_EGGS_TOTAL: 5,
    ACHIEVEMENT_COUNT: 8
  },

  // --- EASTER EGG LOCATIONS ---
  EASTER_EGGS: {
    competitive: {
      id: 'competitive',
      name: 'Competitive Programming Cave',
      x: 100,
      y: 500,
      description: 'A hidden cavern adorned with algorithm runes, LeetCode trophies, and fast I/O scrolls.'
    },
    football: {
      id: 'football',
      name: 'Football Field',
      x: 1100,
      y: 600,
      description: 'A secret grassy glade marking personal passion for football matches and team strategy.'
    },
    gym: {
      id: 'gym',
      name: 'Gym Location',
      x: 1000,
      y: 200,
      description: 'Heavy iron weights tucked behind ancient pines — discipline outside of programming.'
    },
    research: {
      id: 'research',
      name: 'Secret Research Lab',
      x: 150,
      y: 100,
      description: 'Underground chamber with experimental prototypes, early drafts, and whiteboard equations.'
    },
    nightmode: {
      id: 'nightmode',
      name: 'Night Mode Portal',
      x: 550,
      y: 120,
      description: 'A celestial rift near the mountain base that plunges the Dark Forest into neon starlight.'
    }
  },

  // --- ACCESSOR METHODS ---

  /**
   * Retrieves zone configuration by ID.
   * @param {string} zoneId
   * @returns {Object|null}
   */
  getZone(zoneId) {
    return rawConfig.ZONES[zoneId] || null;
  },

  /**
   * Retrieves NPC configuration by ID.
   * @param {string} npcId
   * @returns {Object|null}
   */
  getNpc(npcId) {
    return rawConfig.NPCS[npcId] || null;
  },

  /**
   * Retrieves project configuration by ID.
   * @param {string} projectId
   * @returns {Object|null}
   */
  getProject(projectId) {
    return rawConfig.PROJECTS[projectId] || null;
  },

  /**
   * Retrieves easter egg configuration by ID.
   * @param {string} eggId
   * @returns {Object|null}
   */
  getEasterEgg(eggId) {
    return rawConfig.EASTER_EGGS[eggId] || null;
  },

  /**
   * Returns an array of all project configurations.
   * @returns {Array<Object>}
   */
  getAllProjects() {
    return Object.values(rawConfig.PROJECTS);
  }
};

// Freeze the entire tree to guarantee immutability
export const CONFIG = deepFreeze(rawConfig);

// Standalone accessor exports for convenience
export const getZone = (id) => CONFIG.getZone(id);
export const getNpc = (id) => CONFIG.getNpc(id);
export const getProject = (id) => CONFIG.getProject(id);
export const getEasterEgg = (id) => CONFIG.getEasterEgg(id);
export const getAllProjects = () => CONFIG.getAllProjects();

export default CONFIG;
