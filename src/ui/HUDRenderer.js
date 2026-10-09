/**
 * HUDRenderer - Heads-Up Display & Real-Time Exploration Telemetry System
 * 
 * Dark Forest Portfolio Game
 * Provides a clean, non-intrusive HUD overlay displaying:
 * - Dynamic Zone Entry Marquee (top-center, serif font, themed color)
 * - Gradient Progress Bar (top-right, smooth fill, blue -> cyan -> gold)
 * - Progress Percentage & Developer Stage Tier (below progress bar)
 * - Tactical Minimap Integration (top-right corner, 100x75)
 * - Contextual NPC Interaction Prompt (floating, animated bobbing "[E] Talk")
 * - Exploration Zone Hints (bottom-left, 5s duration)
 * - Next Progression Milestone Goal (bottom-center)
 * - Faint Control Guidance (bottom-right, WASD / E / ESC)
 * - Diagnostic FPS & State Counter (top-left, debug mode only)
 * - Photo Mode / Cutscene Global HUD Toggle (press H)
 */

import eventBus, {
  GAME_EVENTS,
  NPC_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS
} from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import defaultProgressTracker from '../state/ProgressTracker.js';
import defaultMilestoneRewardManager from '../state/MilestoneRewardManager.js';
import { minimapGenerator } from './MinimapGenerator.js';

export const HUD_CONFIG = {
  zoneName: {
    x: 600,
    y: 60,
    fontSize: 24,
    fontFamily: 'Cinzel, Georgia, serif',
    fadeInDuration: 300,
    stayDuration: 3000,
    fadeOutDuration: 300
  },
  progressBar: {
    x: 980,
    y: 105,
    width: 200,
    height: 8,
    bgColor: 0x000000,
    bgAlpha: 0.4,
    cornerRadius: 4
  },
  progressText: {
    x: 1180,
    y: 122,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#ffffff'
  },
  progressStage: {
    x: 1180,
    y: 138,
    fontSize: 11,
    fontFamily: 'sans-serif',
    color: '#a0b0c0'
  },
  interactionPrompt: {
    yOffset: -40,
    bobDistance: 4,
    bobDuration: 1500,
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    bgColor: 0x141a2e,
    bgAlpha: 0.88,
    borderColor: 0x4a90ff
  },
  zoneHint: {
    x: 20,
    y: 760,
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#b0c0d8',
    duration: 5000
  },
  nextMilestone: {
    x: 600,
    y: 720,
    fontSize: 11,
    fontFamily: 'sans-serif',
    color: '#c8d4e4'
  },
  controlHints: {
    x: 1180,
    y: 780,
    fontSize: 10,
    fontFamily: 'sans-serif',
    color: 'rgba(255, 255, 255, 0.35)',
    autoHideDelay: 30000
  },
  fpsCounter: {
    x: 20,
    y: 20,
    fontSize: 10,
    fontFamily: 'monospace'
  },
  statusLog: {
    x: 20,
    y: 400,
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    duration: 5000
  }
};

export const ZONE_DISPLAY_CONFIG = {
  foundation: { name: 'Foundation Clearing', color: 0x4A90FF },
  webdev: { name: 'Web Dev Outpost', color: 0x00D9FF },
  aiml: { name: 'AI & ML Woods', color: 0xB300FF },
  mobile: { name: 'Mobile Valley', color: 0x00FF66 },
  summit: { name: 'The Summit', color: 0xFFD700 }
};

export const ZONE_HINTS = {
  foundation: 'Your journey begins here. Speak with The Mentor to learn the path forward.',
  webdev: 'Explore the Web Dev Outpost to discover full-stack web applications and architectures.',
  aiml: 'Venture into the AI & ML Woods to inspect algorithms, neural networks, and data science.',
  mobile: 'Explore Mobile Valley to see responsive cross-platform apps and modern UI engineering.',
  summit: 'Ascend to the mountain peak to reflect upon your completed journey and download your resume.'
};

/**
 * Calculates smooth gradient color across progression phases:
 * 0-50%: Blue (0x4A90FF) -> Cyan (0x00D9FF)
 * 50-100%: Cyan (0x00D9FF) -> Gold (0xFFD700)
 * 
 * @param {number} progress - Percentage 0-100
 * @returns {number} 24-bit hex color
 */
export function getProgressBarColor(progress) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  if (clamped <= 50) {
    const t = clamped / 50;
    const r = Math.round(0x4a + (0x00 - 0x4a) * t);
    const g = Math.round(0x90 + (0xd9 - 0x90) * t);
    const b = Math.round(0xff + (0xff - 0xff) * t);
    return (r << 16) | (g << 8) | b;
  } else {
    const t = (clamped - 50) / 50;
    const r = Math.round(0x00 + (0xff - 0x00) * t);
    const g = Math.round(0xd9 + (0xd7 - 0xd9) * t);
    const b = Math.round(0xff + (0x00 - 0xff) * t);
    return (r << 16) | (g << 8) | b;
  }
}

export class HUDRenderer {
  /**
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [eventBusRef] - EventBus instance
   * @param {Object} [progressTracker] - ProgressTracker instance
   * @param {Object} [milestoneManager] - MilestoneRewardManager instance
   */
  constructor(
    gameState = null,
    eventBusRef = null,
    progressTracker = null,
    milestoneManager = null
  ) {
    this.gameState = gameState || defaultGameState;
    this.eventBus = eventBusRef || eventBus;
    this.progressTracker = progressTracker || defaultProgressTracker;
    this.milestoneManager = milestoneManager || defaultMilestoneRewardManager;
    this.minimap = minimapGenerator;

    this.scene = null;
    this.hudContainer = null;
    this.hudVisible = true;
    this.debugMode = false;

    // Tracked sub-elements map: elementId -> element reference / mock
    this.elements = new Map();

    // Progress State Cache
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.currentStage = 'Early Explorer';

    // Animation & Bobbing State
    this.bobTime = 0;
    this.promptState = {
      visible: false,
      npcName: null,
      key: 'E',
      worldX: null,
      worldY: null
    };

    // Zone name marquee animation state
    this.zoneNameState = {
      visible: false,
      currentZone: null,
      fadeTimer: null
    };

    // Next milestone display state
    this.milestoneState = {
      visible: true,
      text: ''
    };

    // FPS diagnostics
    this.fpsCounterState = {
      fps: 60,
      frameCount: 0,
      lastFpsCheck: 0
    };

    // Status log state
    this.statusLogTimer = null;
    this.controlHintsTimer = null;
    this.controlHintsVisible = true;

    // Event bus handlers
    this._unsubscribers = [];
  }

  /**
   * Initializes all HUD elements and binds reactive event bus listeners.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [gameState] - GameState instance
   * @param {Object} [progressTracker] - ProgressTracker instance
   * @param {Object} [options={}] - Additional settings
   * @returns {HUDRenderer}
   */
  create(scene = null, gameState = null, progressTracker = null, options = {}) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;
    if (progressTracker) this.progressTracker = progressTracker;
    if (options.milestoneManager) this.milestoneManager = options.milestoneManager;
    if (options.debugMode !== undefined) this.debugMode = Boolean(options.debugMode);

    this._detachEventListeners();
    this._createHUDElements();
    this._attachEventListeners();

    // Auto-hide control hints timer (30s)
    if (HUD_CONFIG.controlHints.autoHideDelay > 0) {
      this.controlHintsTimer = setTimeout(() => {
        this.updateControlHints(false);
      }, HUD_CONFIG.controlHints.autoHideDelay);
    }

    // Initial sync
    const initialProg = this.progressTracker?.getOverallProgress?.() ?? 
                        (this.gameState?.gameProgress || 0);
    this.updateProgressBar(initialProg);
    this._refreshNextMilestone();

    return this;
  }

  /**
   * Constructs all HUD visuals in Phaser or creates headless/DOM mocks.
   * @private
   */
  _createHUDElements() {
    this.elements.clear();

    const width = this.scene?.cameras?.main?.width || 1200;
    const height = this.scene?.cameras?.main?.height || 800;

    // 1. Phaser Container Setup
    if (this.scene?.add?.container) {
      this.hudContainer = this.scene.add.container(0, 0);
      this.hudContainer.setScrollFactor(0);
      this.hudContainer.setDepth(2000); // Overlay above all world objects & lighting

      // Zone Name Marquee (Top-Center)
      const zoneNameText = this.scene.add.text(width / 2, HUD_CONFIG.zoneName.y, '', {
        fontSize: `${HUD_CONFIG.zoneName.fontSize}px`,
        fontFamily: HUD_CONFIG.zoneName.fontFamily,
        color: '#4A90FF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5, 0.5).setAlpha(0);
      this.hudContainer.add(zoneNameText);
      this.elements.set('zoneName', zoneNameText);

      // Progress Bar Background & Fill Graphics (Top-Right)
      const progressBg = this.scene.add.graphics();
      progressBg.fillStyle(HUD_CONFIG.progressBar.bgColor, HUD_CONFIG.progressBar.bgAlpha);
      progressBg.fillRoundedRect(
        HUD_CONFIG.progressBar.x,
        HUD_CONFIG.progressBar.y,
        HUD_CONFIG.progressBar.width,
        HUD_CONFIG.progressBar.height,
        HUD_CONFIG.progressBar.cornerRadius
      );
      this.hudContainer.add(progressBg);
      this.elements.set('progressBarBg', progressBg);

      const progressFill = this.scene.add.graphics();
      this.hudContainer.add(progressFill);
      this.elements.set('progressBar', progressFill);

      // Progress Percentage Text
      const progressPctText = this.scene.add.text(HUD_CONFIG.progressText.x, HUD_CONFIG.progressText.y, '0%', {
        fontSize: `${HUD_CONFIG.progressText.fontSize}px`,
        fontFamily: HUD_CONFIG.progressText.fontFamily,
        color: HUD_CONFIG.progressText.color
      }).setOrigin(1, 0.5);
      this.hudContainer.add(progressPctText);
      this.elements.set('progressText', progressPctText);

      // Progress Stage Text
      const progressStageText = this.scene.add.text(HUD_CONFIG.progressStage.x, HUD_CONFIG.progressStage.y, this.currentStage, {
        fontSize: `${HUD_CONFIG.progressStage.fontSize}px`,
        fontFamily: HUD_CONFIG.progressStage.fontFamily,
        color: HUD_CONFIG.progressStage.color
      }).setOrigin(1, 0.5);
      this.hudContainer.add(progressStageText);
      this.elements.set('progressStage', progressStageText);

      // Interaction Prompt Container (Dynamic above NPC)
      const promptContainer = this.scene.add.container(0, 0).setAlpha(0);
      const promptBg = this.scene.add.graphics();
      const promptText = this.scene.add.text(0, 0, '[E] Talk', {
        fontSize: `${HUD_CONFIG.interactionPrompt.fontSize}px`,
        fontFamily: HUD_CONFIG.interactionPrompt.fontFamily,
        color: HUD_CONFIG.interactionPrompt.color
      }).setOrigin(0.5, 0.5);
      promptContainer.add([promptBg, promptText]);
      this.hudContainer.add(promptContainer);
      this.elements.set('interactionPrompt', promptContainer);
      this.elements.set('interactionPromptBg', promptBg);
      this.elements.set('interactionPromptText', promptText);

      // Zone Hint (Bottom-Left)
      const zoneHintText = this.scene.add.text(HUD_CONFIG.zoneHint.x, height - 40, '', {
        fontSize: `${HUD_CONFIG.zoneHint.fontSize}px`,
        fontFamily: HUD_CONFIG.zoneHint.fontFamily,
        fontStyle: 'italic',
        color: HUD_CONFIG.zoneHint.color,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 1).setAlpha(0);
      this.hudContainer.add(zoneHintText);
      this.elements.set('zoneHint', zoneHintText);

      // Next Milestone (Bottom-Center)
      const milestoneText = this.scene.add.text(width / 2, height - 70, '', {
        fontSize: `${HUD_CONFIG.nextMilestone.fontSize}px`,
        fontFamily: HUD_CONFIG.nextMilestone.fontFamily,
        color: HUD_CONFIG.nextMilestone.color,
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5, 0.5);
      this.hudContainer.add(milestoneText);
      this.elements.set('nextMilestone', milestoneText);

      // Control Hints (Bottom-Right)
      const controlText = this.scene.add.text(width - 20, height - 20, 'WASD to move | E to interact | ESC for menu', {
        fontSize: `${HUD_CONFIG.controlHints.fontSize}px`,
        fontFamily: HUD_CONFIG.controlHints.fontFamily,
        color: HUD_CONFIG.controlHints.color
      }).setOrigin(1, 1);
      this.hudContainer.add(controlText);
      this.elements.set('controlHints', controlText);

      // FPS Diagnostics (Top-Left)
      const fpsText = this.scene.add.text(HUD_CONFIG.fpsCounter.x, HUD_CONFIG.fpsCounter.y, '60 FPS', {
        fontSize: `${HUD_CONFIG.fpsCounter.fontSize}px`,
        fontFamily: HUD_CONFIG.fpsCounter.fontFamily,
        color: '#00ff66'
      }).setOrigin(0, 0).setVisible(this.debugMode);
      this.hudContainer.add(fpsText);
      this.elements.set('fpsCounter', fpsText);

      // Status Log (Left-Center)
      const statusText = this.scene.add.text(HUD_CONFIG.statusLog.x, height / 2, '', {
        fontSize: `${HUD_CONFIG.statusLog.fontSize}px`,
        fontFamily: HUD_CONFIG.statusLog.fontFamily,
        color: HUD_CONFIG.statusLog.color,
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5).setAlpha(0);
      this.hudContainer.add(statusText);
      this.elements.set('statusLog', statusText);

      return;
    }

    // 2. Headless/Mock DOM Objects for non-Phaser environments
    const mockFactory = (id, defaultVal = '') => ({
      id,
      text: defaultVal,
      alpha: 1,
      visible: true,
      x: 0,
      y: 0,
      color: '#ffffff',
      setText(val) { this.text = String(val); return this; },
      setAlpha(val) { this.alpha = Number(val); return this; },
      setVisible(val) { this.visible = Boolean(val); return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setColor(col) { this.color = col; return this; }
    });

    this.elements.set('zoneName', mockFactory('zoneName'));
    this.elements.set('progressBar', mockFactory('progressBar'));
    this.elements.set('progressText', mockFactory('progressText', '0%'));
    this.elements.set('progressStage', mockFactory('progressStage', 'Early Explorer'));
    this.elements.set('interactionPrompt', mockFactory('interactionPrompt'));
    this.elements.set('zoneHint', mockFactory('zoneHint'));
    this.elements.set('nextMilestone', mockFactory('nextMilestone'));
    this.elements.set('controlHints', mockFactory('controlHints', 'WASD to move | E to interact | ESC for menu'));
    this.elements.set('fpsCounter', mockFactory('fpsCounter', '60 FPS'));
    this.elements.set('statusLog', mockFactory('statusLog'));
  }

  /**
   * Subscribes to runtime game events.
   * @private
   */
  _attachEventListeners() {
    // 1. Zone entered
    const unsubZone = this.eventBus.on(GAME_EVENTS.ZONE_ENTERED, (payload) => {
      const zoneId = payload?.zoneId || payload?.zone;
      const zoneConfig = ZONE_DISPLAY_CONFIG[zoneId] || { name: payload?.zoneName || zoneId, color: 0x4A90FF };
      this.showZoneName(zoneConfig.name, zoneConfig.color);

      // Show zone hint
      const hint = ZONE_HINTS[zoneId];
      if (hint) {
        this.showZoneHint(hint);
      }
    });

    // 2. Progress updates
    const unsubProgress = this.eventBus.on(PROGRESS_EVENTS.PROGRESS_CHANGED, (payload) => {
      if (typeof payload?.newProgress === 'number') {
        this.updateProgressBar(payload.newProgress);
      }
      this._refreshNextMilestone();
    });

    const unsubStage = this.eventBus.on(PROGRESS_EVENTS.STAGE_CHANGED, (payload) => {
      if (payload?.newStage) {
        this.currentStage = payload.newStage;
        const el = this.elements.get('progressStage');
        if (el?.setText) el.setText(this.currentStage);
      }
    });

    // 3. NPC interaction prompts
    const unsubNpcIn = this.eventBus.on(NPC_EVENTS.NPC_IN_RANGE, (payload) => {
      const npcName = payload?.npcName || payload?.name || payload?.npcId || 'NPC';
      this.showInteractionPrompt(npcName, 'E');
    });

    const unsubNpcOut = this.eventBus.on(NPC_EVENTS.NPC_OUT_OF_RANGE, () => {
      this.hideInteractionPrompt();
    });

    const unsubDiagStart = this.eventBus.on(NPC_EVENTS.DIALOGUE_STARTED, () => {
      this.hideInteractionPrompt();
    });

    // 4. Milestone reached
    const unsubMilestone = this.eventBus.on(PROGRESS_EVENTS.MILESTONE_REACHED, (payload) => {
      this._refreshNextMilestone();
      if (payload?.milestoneName) {
        this.showMilestoneNotification(payload.milestoneName, payload.icon || '🌱');
      }
    });

    // 5. Achievement unlocked
    const unsubAch = this.eventBus.on(PROGRESS_EVENTS.ACHIEVEMENT_UNLOCKED, (payload) => {
      if (payload?.achievementName) {
        this.showAchievementNotification(payload.achievementName, payload.icon || '🏆');
      }
    });

    // 6. Global State Reset
    const unsubState = this.eventBus.on(STATE_EVENTS.GAME_STATE_CHANGED, () => {
      const prog = this.progressTracker?.getOverallProgress?.() ?? (this.gameState?.gameProgress || 0);
      this.updateProgressBar(prog);
      this._refreshNextMilestone();
    });

    this._unsubscribers = [
      unsubZone,
      unsubProgress,
      unsubStage,
      unsubNpcIn,
      unsubNpcOut,
      unsubDiagStart,
      unsubMilestone,
      unsubAch,
      unsubState
    ];
  }

  /**
   * Detaches registered event listeners.
   * @private
   */
  _detachEventListeners() {
    this._unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._unsubscribers = [];
  }

  /**
   * Called every frame from the active game loop.
   * 
   * @param {number} [time=0] - Total elapsed game time in ms
   * @param {number} [delta=16.6] - Delta time since last frame in ms
   */
  update(time = 0, delta = 16.6) {
    if (!this.hudVisible) return;

    // 1. Update Bobbing Animation for Interaction Prompt
    if (this.promptState.visible) {
      this.bobTime += delta;
      const bobOffset = Math.sin(this.bobTime / 240) * HUD_CONFIG.interactionPrompt.bobDistance;
      const promptEl = this.elements.get('interactionPrompt');

      if (promptEl) {
        // Track target world position projected to screen or player anchor
        if (this.promptState.worldX !== null && this.promptState.worldY !== null && this.scene?.cameras?.main) {
          const cam = this.scene.cameras.main;
          const screenX = this.promptState.worldX - cam.scrollX;
          const screenY = this.promptState.worldY - cam.scrollY + HUD_CONFIG.interactionPrompt.yOffset + bobOffset;
          promptEl.setPosition(screenX, screenY);
        } else {
          // Centered above player
          const width = this.scene?.cameras?.main?.width || 1200;
          const height = this.scene?.cameras?.main?.height || 800;
          promptEl.setPosition(width / 2, (height / 2) - 60 + bobOffset);
        }
      }
    }

    // 2. Smooth Lerp Progress Bar Fill
    if (Math.abs(this.currentProgress - this.targetProgress) > 0.1) {
      this.currentProgress += (this.targetProgress - this.currentProgress) * 0.15;
      this._renderProgressBarFill(this.currentProgress);
    }

    // 3. Update Diagnostics (Debug Mode)
    if (this.debugMode) {
      this.fpsCounterState.frameCount++;
      if (time - this.fpsCounterState.lastFpsCheck >= 500) {
        const fps = Math.round(1000 / Math.max(1, delta));
        this.fpsCounterState.fps = fps;
        this.fpsCounterState.lastFpsCheck = time;

        const fpsEl = this.elements.get('fpsCounter');
        if (fpsEl?.setText) {
          fpsEl.setText(`${fps} FPS`);
          if (fpsEl.setColor) {
            const color = fps >= 55 ? '#00ff66' : (fps >= 30 ? '#ffd700' : '#ff4444');
            fpsEl.setColor(color);
          }
        }
      }
    }
  }

  /**
   * Displays the zone title marquee banner with smooth fade in/stay/out.
   * 
   * @param {string} zoneName - Name to display
   * @param {number} [colorHex=0x4A90FF] - Highlight color
   * @param {number} [duration=3000] - Duration to stay on screen in ms
   */
  showZoneName(zoneName, colorHex = 0x4A90FF, duration = 3000) {
    if (!zoneName) return;

    this.zoneNameState.visible = true;
    this.zoneNameState.currentZone = zoneName;

    const el = this.elements.get('zoneName');
    if (!el) return;

    if (this.zoneNameState.fadeTimer) {
      clearTimeout(this.zoneNameState.fadeTimer);
      this.zoneNameState.fadeTimer = null;
    }

    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
    if (typeof el.setColor === 'function') el.setColor(hexStr);
    if (typeof el.setText === 'function') el.setText(zoneName);

    // Fade in
    if (this.scene?.tweens?.add) {
      this.scene.tweens.killTweensOf(el);
      this.scene.tweens.add({
        targets: el,
        alpha: 1,
        duration: HUD_CONFIG.zoneName.fadeInDuration,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.zoneNameState.fadeTimer = setTimeout(() => {
            this.hideZoneName();
          }, duration);
        }
      });
    } else {
      el.setAlpha?.(1);
      this.zoneNameState.fadeTimer = setTimeout(() => {
        this.hideZoneName();
      }, duration);
    }
  }

  /**
   * Dismisses and fades out the current zone marquee.
   */
  hideZoneName() {
    const el = this.elements.get('zoneName');
    if (!el) return;

    if (this.zoneNameState.fadeTimer) {
      clearTimeout(this.zoneNameState.fadeTimer);
      this.zoneNameState.fadeTimer = null;
    }

    if (this.scene?.tweens?.add) {
      this.scene.tweens.killTweensOf(el);
      this.scene.tweens.add({
        targets: el,
        alpha: 0,
        duration: HUD_CONFIG.zoneName.fadeOutDuration,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.zoneNameState.visible = false;
        }
      });
    } else {
      el.setAlpha?.(0);
      this.zoneNameState.visible = false;
    }
  }

  /**
   * Updates overall progress bar, percentage label, and developer tier.
   * 
   * @param {number} progress - Completion percentage (0-100)
   */
  updateProgressBar(progress) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
    this.targetProgress = clamped;

    // Direct render if headless or no tweening
    if (!this.scene) {
      this.currentProgress = clamped;
      this._renderProgressBarFill(clamped);
    }

    // Update Percentage Text
    const pctEl = this.elements.get('progressText');
    if (pctEl?.setText) {
      pctEl.setText(`${clamped}%`);
    }

    // Update Stage Text
    const stage = this._getStageName(clamped);
    this.currentStage = stage;
    const stageEl = this.elements.get('progressStage');
    if (stageEl?.setText) {
      stageEl.setText(stage);
    }
  }

  /**
   * Internal render pass for the progress bar graphics.
   * @private
   */
  _renderProgressBarFill(progress) {
    const fillGraphic = this.elements.get('progressBar');
    if (!fillGraphic) return;

    if (fillGraphic.clear && fillGraphic.fillStyle && fillGraphic.fillRoundedRect) {
      fillGraphic.clear();
      const fillWidth = Math.max(0, (HUD_CONFIG.progressBar.width * (progress / 100)));
      if (fillWidth > 0) {
        const color = getProgressBarColor(progress);
        fillGraphic.fillStyle(color, 1.0);
        fillGraphic.fillRoundedRect(
          HUD_CONFIG.progressBar.x,
          HUD_CONFIG.progressBar.y,
          fillWidth,
          HUD_CONFIG.progressBar.height,
          HUD_CONFIG.progressBar.cornerRadius
        );
      }
    }
  }

  /**
   * Displays the floating contextual "[E] Talk to [NPC Name]" prompt.
   * 
   * @param {string} npcName - Target NPC display name
   * @param {string} [key='E'] - Interaction key
   * @param {number} [worldX=null] - Optional world X coordinate
   * @param {number} [worldY=null] - Optional world Y coordinate
   */
  showInteractionPrompt(npcName, key = 'E', worldX = null, worldY = null) {
    this.promptState.visible = true;
    this.promptState.npcName = npcName;
    this.promptState.key = key;
    this.promptState.worldX = worldX;
    this.promptState.worldY = worldY;

    const promptContainer = this.elements.get('interactionPrompt');
    const promptText = this.elements.get('interactionPromptText');
    const promptBg = this.elements.get('interactionPromptBg');

    if (promptText?.setText) {
      promptText.setText(`[${key}] Talk to ${npcName}`);
    }

    if (promptBg?.clear && promptText?.width) {
      promptBg.clear();
      const padX = 12;
      const padY = 6;
      const w = promptText.width + (padX * 2);
      const h = promptText.height + (padY * 2);
      promptBg.fillStyle(HUD_CONFIG.interactionPrompt.bgColor, HUD_CONFIG.interactionPrompt.bgAlpha);
      promptBg.lineStyle(1, HUD_CONFIG.interactionPrompt.borderColor, 0.8);
      promptBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
      promptBg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    }

    if (promptContainer) {
      if (this.scene?.tweens?.add) {
        this.scene.tweens.killTweensOf(promptContainer);
        this.scene.tweens.add({
          targets: promptContainer,
          alpha: 1,
          duration: 200,
          ease: 'Cubic.easeOut'
        });
      } else {
        promptContainer.setAlpha?.(1);
      }
    }
  }

  /**
   * Dismisses and fades out the floating interaction prompt.
   */
  hideInteractionPrompt() {
    this.promptState.visible = false;
    const promptContainer = this.elements.get('interactionPrompt');
    if (!promptContainer) return;

    if (this.scene?.tweens?.add) {
      this.scene.tweens.killTweensOf(promptContainer);
      this.scene.tweens.add({
        targets: promptContainer,
        alpha: 0,
        duration: 200,
        ease: 'Cubic.easeIn'
      });
    } else {
      promptContainer.setAlpha?.(0);
    }
  }

  /**
   * Displays an atmospheric exploration hint banner at the bottom-left.
   * 
   * @param {string} hintText - Hint content
   * @param {number} [duration=5000] - Duration in ms
   */
  showZoneHint(hintText, duration = 5000) {
    const el = this.elements.get('zoneHint');
    if (!el || !hintText) return;

    if (el.setText) el.setText(hintText);

    if (this.scene?.tweens?.add) {
      this.scene.tweens.killTweensOf(el);
      this.scene.tweens.add({
        targets: el,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          setTimeout(() => {
            if (this.scene?.tweens?.add) {
              this.scene.tweens.add({
                targets: el,
                alpha: 0,
                duration: 300
              });
            } else {
              el.setAlpha?.(0);
            }
          }, duration);
        }
      });
    } else {
      el.setAlpha?.(1);
      setTimeout(() => el.setAlpha?.(0), duration);
    }
  }

  /**
   * Updates next milestone progress readout.
   * 
   * @param {string} milestoneName
   * @param {number} progress
   */
  updateNextMilestone(milestoneName, progress) {
    const el = this.elements.get('nextMilestone');
    if (!el) return;

    if (progress >= 100 || milestoneName === 'All Milestones Completed') {
      this.hideNextMilestone();
      return;
    }

    const displayText = `Next milestone: ${milestoneName} (${Math.round(progress)}% complete)`;
    this.milestoneState.text = displayText;
    this.milestoneState.visible = true;

    if (el.setText) el.setText(displayText);
    if (el.setVisible) el.setVisible(true);
    if (el.setAlpha) el.setAlpha(1);
  }

  /**
   * Hides the next milestone goal text (e.g. upon reaching 100%).
   */
  hideNextMilestone() {
    this.milestoneState.visible = false;
    const el = this.elements.get('nextMilestone');
    if (el) {
      if (el.setText) el.setText('');
      if (el.setVisible) el.setVisible(false);
      if (el.setAlpha) el.setAlpha(0);
    }
  }

  /**
   * Synchronizes next milestone goal from ProgressTracker or MilestoneManager.
   * @private
   */
  _refreshNextMilestone() {
    if (this.milestoneManager?.getProgressToNextMilestone) {
      const data = this.milestoneManager.getProgressToNextMilestone();
      this.updateNextMilestone(data.milestoneName, data.progress);
      return;
    }

    if (this.progressTracker?.getMilestoneProgress) {
      const data = this.progressTracker.getMilestoneProgress();
      this.updateNextMilestone(data.nextMilestone, data.current);
      return;
    }

    this.updateNextMilestone('25% Completion', this.currentProgress);
  }

  /**
   * Toggles developer diagnostics overlay (FPS, coordinates).
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debugMode = Boolean(enabled);
    const fpsEl = this.elements.get('fpsCounter');
    if (fpsEl?.setVisible) {
      fpsEl.setVisible(this.debugMode);
    }
  }

  /**
   * Retrieves reference to an internal HUD element.
   * 
   * @param {string} elementId - ('progressBar', 'zoneName', 'fpsCounter', etc.)
   * @returns {Object|null}
   */
  getHUDElement(elementId) {
    return this.elements.get(elementId) || null;
  }

  /**
   * Shows or hides the bottom-right control scheme hints.
   * @param {boolean} visible
   */
  updateControlHints(visible) {
    this.controlHintsVisible = Boolean(visible);
    const el = this.elements.get('controlHints');
    if (el?.setVisible) {
      el.setVisible(this.controlHintsVisible);
    }
    if (el?.setAlpha) {
      el.setAlpha(this.controlHintsVisible ? 1 : 0);
    }
  }

  /**
   * Displays temporary narrative/status log line at left-center.
   * 
   * @param {string} status - Message text
   * @param {number} [duration=5000]
   */
  updateStatusLog(status, duration = 5000) {
    const el = this.elements.get('statusLog');
    if (!el || !status) return;

    if (this.statusLogTimer) {
      clearTimeout(this.statusLogTimer);
      this.statusLogTimer = null;
    }

    if (el.setText) el.setText(status);

    if (this.scene?.tweens?.add) {
      this.scene.tweens.killTweensOf(el);
      this.scene.tweens.add({
        targets: el,
        alpha: 1,
        duration: 200,
        onComplete: () => {
          this.statusLogTimer = setTimeout(() => {
            if (this.scene?.tweens?.add) {
              this.scene.tweens.add({
                targets: el,
                alpha: 0,
                duration: 300
              });
            } else {
              el.setAlpha?.(0);
            }
          }, duration);
        }
      });
    } else {
      el.setAlpha?.(1);
      this.statusLogTimer = setTimeout(() => el.setAlpha?.(0), duration);
    }
  }

  /**
   * Delegates achievement toast notification display.
   * @param {string} achievementName
   * @param {string} [icon='🏆']
   */
  showAchievementNotification(achievementName, icon = '🏆') {
    this.updateStatusLog(`Achievement Unlocked: ${icon} ${achievementName}`);
  }

  /**
   * Delegates milestone toast notification display.
   * @param {string} milestoneName
   * @param {string} [icon='🌱']
   */
  showMilestoneNotification(milestoneName, icon = '🌱') {
    this.updateStatusLog(`Milestone Reached: ${icon} ${milestoneName}`);
  }

  /**
   * Toggles visibility of the top-right minimap radar.
   * @param {boolean} visible
   */
  updateMinimapVisibility(visible) {
    if (this.minimap?.container?.setVisible) {
      this.minimap.container.setVisible(Boolean(visible));
    }
  }

  /**
   * Globally toggles entire HUD visibility (for cinematic cutscenes or photo mode).
   * 
   * @param {boolean} [visible] - Target visibility (flips state if omitted)
   * @returns {boolean} New HUD visibility state
   */
  toggleHUDVisibility(visible) {
    if (typeof visible === 'boolean') {
      this.hudVisible = visible;
    } else {
      this.hudVisible = !this.hudVisible;
    }

    if (this.hudContainer?.setVisible) {
      this.hudContainer.setVisible(this.hudVisible);
    }

    this.updateMinimapVisibility(this.hudVisible);

    return this.hudVisible;
  }

  /**
   * Checks whether the HUD is currently visible.
   * @returns {boolean}
   */
  isHUDVisible() {
    return this.hudVisible;
  }

  /**
   * Helper mapping completion percentage to canonical stage tier.
   * @private
   */
  _getStageName(progress) {
    if (progress >= 100) return 'Complete Journey';
    if (progress >= 90) return 'Legendary Developer';
    if (progress >= 75) return 'Polymath Developer';
    if (progress >= 50) return 'Experienced Developer';
    if (progress >= 25) return 'Growing Explorer';
    return 'Early Explorer';
  }

  /**
   * Tears down listeners and timers.
   */
  destroy() {
    this._detachEventListeners();
    if (this.zoneNameState.fadeTimer) {
      clearTimeout(this.zoneNameState.fadeTimer);
      this.zoneNameState.fadeTimer = null;
    }
    if (this.statusLogTimer) {
      clearTimeout(this.statusLogTimer);
      this.statusLogTimer = null;
    }
    if (this.controlHintsTimer) {
      clearTimeout(this.controlHintsTimer);
      this.controlHintsTimer = null;
    }
    this.elements.clear();
  }
}

// Export singleton instance
export const hudRenderer = new HUDRenderer();
export default hudRenderer;
