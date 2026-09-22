/**
 * Phaser 3 Game Engine Bootstrap Configuration
 * 
 * Dark Forest Portfolio Game
 * Canvas: 1200x800 | Arcade Physics (no gravity) | Dark Forest (#1a1a2e)
 */
import Phaser from 'phaser';
import MainGame from './scenes/MainGame.js';
import CONFIG from './config/GameConfig.js';

/**
 * Scene Configuration Object
 * Meets exact scene-level specifications for Phaser 3
 */
export const mainGameSceneConfig = {
  type: Phaser.Scene,
  key: 'MainGame',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  render: {
    pixelArt: true,
    antialias: false
  },
  canvas: {
    width: CONFIG.GAME.CANVAS_WIDTH,
    height: CONFIG.GAME.CANVAS_HEIGHT
  },
  input: {
    keyboard: true,
    mouse: true
  }
};


/**
 * Creates and returns the complete Phaser 3 Game configuration object.
 *
 * @param {Object} [overrides={}] - Optional configuration overrides
 * @returns {Phaser.Types.Core.GameConfig} Full Phaser game configuration
 */
export function createGameConfig(overrides = {}) {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1200,
    height: 800,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: false,
      gamepad: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1200,
      height: 800
    },
    scene: [MainGame],
    ...overrides
  };
}

/**
 * Initializes and starts the Phaser 3 game instance.
 *
 * @param {Object} [overrides={}] - Optional configuration overrides
 * @returns {Phaser.Game} The instantiated Phaser game
 */
export function initGame(overrides = {}) {
  const config = createGameConfig(overrides);
  return new Phaser.Game(config);
}

// Export default scene configuration ready for Phaser.Game instances
export default mainGameSceneConfig;
