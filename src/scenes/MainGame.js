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

    // Pointer / mouse interaction setup
    this.input.on('pointerdown', (pointer) => {
      // Prepared for click-to-move or project interact events
    });
  }

  update(time, delta) {
    // Process input, collision sliding, and player physics movement
    movementController.update(delta);
  }

}

export default MainGame;
