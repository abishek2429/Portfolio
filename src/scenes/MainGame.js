/**
 * MainGame Scene - Dark Forest Portfolio
 * 
 * Foundation scene for the Dark Forest portfolio game.
 * Designed to be expanded with tilemap layers, player movement,
 * interactive project zones, NPCs, and immersive HUD/UI.
 */
import Phaser from 'phaser';
import { assetLoader } from '../loaders/AssetLoader.js';
import { particleEffectManager } from '../effects/ParticleEffectManager.js';
import { lightingManager } from '../lighting/LightingManager.js';
import { minimapGenerator } from '../ui/MinimapGenerator.js';
import { playerCharacter } from '../entities/PlayerCharacter.js';
import { movementController } from '../controllers/MovementController.js';
import { cameraFollower } from '../camera/CameraFollower.js';
import { animationStateMachine } from '../animation/AnimationStateMachine.js';
import { inputHandler } from '../input/InputHandler.js';
import { footstepFeedback } from '../effects/FootstepFeedback.js';
import { spawnPointManager } from '../world/SpawnPointManager.js';
import { npcSpawner } from '../entities/NPCSpawner.js';
import { dialogueManager } from '../ui/DialogueManager.js';
import gameState from '../state/GameState.js';
import { conversationStateTracker } from '../state/ConversationStateTracker.js';
import { npcInteractionSystem } from '../controllers/NPCInteractionSystem.js';
import { zoneVisualizer } from '../world/ZoneVisualizer.js';
import { zoneLayoutPlanner } from '../world/ZoneLayoutPlanner.js';
import { modalSystem } from '../ui/ModalSystem.js';
import { hudRenderer } from '../ui/HUDRenderer.js';
import { progressTracker } from '../state/ProgressTracker.js';
import eventBus from '../events/EventBus.js';






export class MainGame extends Phaser.Scene {
  constructor() {
    super({
      key: 'MainGame',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { y: 0 }
        }
      }
    });
  }

  init(data) {
    // Scene initialization data (player spawn point, active zone, etc.)
    this.gameData = data || {};
  }

  preload() {
    // Queue all Dark Forest game assets
    assetLoader.load(this);
  }

  create() {
    // Set background color fallback (#1a1a2e dark forest tone)
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Initialize central animation state machine and register player/NPC animations
    this.animationStateMachine = animationStateMachine;
    animationStateMachine.createAnimations(this, assetLoader);

    // Initialize centralized keyboard and mouse input handler
    this.inputHandler = inputHandler;
    inputHandler.create(this);

    // Initialize visual atmosphere, glowing clearings, and event-driven particles
    particleEffectManager.init(this);

    // Initialize 2D dynamic lighting, fog-of-war apertures, and campfire flicker
    lightingManager.initialize(this);

    // Initialize tactical top-right radar minimap and zone progression dots
    minimapGenerator.create(this);

    // Spawn player avatar with circular physics body & 4-directional animations
    this.player = playerCharacter.create(this);

    // Initialize analog WASD movement controller with obstacle sliding
    movementController.create(this, playerCharacter);

    // Initialize third-person isometric camera follower smoothly tracking player
    cameraFollower.create(this, playerCharacter);

    // Initialize procedural footstep audio and dust particle feedback
    footstepFeedback.create(this, assetLoader, particleEffectManager);

    // Spawn resident NPCs across all forest clearings
    this.npcSpawner = npcSpawner;
    npcSpawner.create(this, spawnPointManager, assetLoader);
    npcSpawner.spawnAllNpcs();

    // Initialize dialogue display & progression HUD manager
    this.dialogueManager = dialogueManager;
    dialogueManager.create(this, inputHandler);

    // Initialize conversation state tracker
    this.conversationStateTracker = conversationStateTracker;
    conversationStateTracker.create(gameState);

    // Initialize NPC proximity interaction and floating [E] prompt system
    this.npcInteractionSystem = npcInteractionSystem;
    npcInteractionSystem.create(
      this,
      this.player,
      npcSpawner,
      inputHandler,
      dialogueManager,
      conversationStateTracker,
      eventBus
    );

    // Initialize zone detection, atmospheric clearing glows, and HUD marquee
    this.zoneVisualizer = zoneVisualizer;
    zoneVisualizer.create(this, zoneLayoutPlanner);

    // Initialize centered project details modal overlay system
    this.modalSystem = modalSystem;
    modalSystem.create(this, inputHandler, eventBus);

    // Initialize heads-up display telemetry, progress bar, and banners
    this.hudRenderer = hudRenderer;
    hudRenderer.create(this, gameState, progressTracker);

    // Pointer / mouse interaction setup
    this.input.on('pointerdown', (pointer) => {
      // Prepared for click-to-move or project interact events
    });
  }

  update(time, delta) {
    // Process input, collision sliding, and player physics movement
    movementController.update(delta);

    // Update smooth camera follow, clamping, and active effects
    cameraFollower.update(time, delta);

    // Update NPC proximity detection and interaction prompts
    npcInteractionSystem.update(time, delta);

    // Update active zone boundary detection and HUD marquee
    zoneVisualizer.update(this.player);

    // Update heads-up display animations, lerping, and diagnostics
    hudRenderer.update(time, delta);

    // Reset single-frame input state flags
    inputHandler.update();
  }

}

export default MainGame;
