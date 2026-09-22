import { initGame, createGameConfig, mainGameSceneConfig } from './gameConfig.js';
import MainGame from './scenes/MainGame.js';
import { GameState, gameState, ZONES } from './state/GameState.js';
import { Player, VALID_DIRECTIONS, VALID_ANIMATION_STATES } from './entities/Player.js';
import { AssetLoader, assetLoader, ASSET_MANIFEST } from './loaders/AssetLoader.js';
import {
  EventBus,
  eventBus,
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS,
  ALL_EVENTS
} from './events/EventBus.js';
import {
  SaveManager,
  saveManager,
  STORAGE_KEY,
  CURRENT_SAVE_VERSION
} from './storage/SaveManager.js';
import CONFIG, {
  getZone,
  getNpc,
  getProject,
  getEasterEgg,
  getAllProjects
} from './config/GameConfig.js';
import {
  TilemapGenerator,
  tilemapGenerator,
  generateTilemap,
  TILES,
  WALKABLE_TILES,
  MAP_CONFIG
} from './world/TilemapGenerator.js';
import {
  ZoneLayoutPlanner,
  zoneLayoutPlanner,
  ZONE_LAYOUTS
} from './world/ZoneLayoutPlanner.js';
import {
  SpawnPointManager,
  spawnPointManager,
  DEFAULT_SPAWNS
} from './world/SpawnPointManager.js';
import {
  CollisionLayer,
  collisionLayer,
  COLLISION_DEFAULTS
} from './physics/CollisionLayer.js';
import {
  ParticleEffectManager,
  particleEffectManager,
  PARTICLE_CONFIGS
} from './effects/ParticleEffectManager.js';
import {
  LightingManager,
  lightingManager,
  LIGHT_CONFIGS
} from './lighting/LightingManager.js';
import {
  MinimapGenerator,
  minimapGenerator,
  MINIMAP_CONFIG
} from './ui/MinimapGenerator.js';
import {
  PlayerCharacter,
  playerCharacter,
  PLAYER_ANIMATIONS
} from './entities/PlayerCharacter.js';
import {
  MovementController,
  movementController
} from './controllers/MovementController.js';









export {
  initGame,
  createGameConfig,
  mainGameSceneConfig,
  MainGame,
  GameState,
  gameState,
  ZONES,
  Player,
  VALID_DIRECTIONS,
  VALID_ANIMATION_STATES,
  AssetLoader,
  assetLoader,
  ASSET_MANIFEST,
  EventBus,
  eventBus,
  GAME_EVENTS,
  NPC_EVENTS,
  PROJECT_EVENTS,
  PROGRESS_EVENTS,
  STATE_EVENTS,
  ALL_EVENTS,
  SaveManager,
  saveManager,
  STORAGE_KEY,
  CURRENT_SAVE_VERSION,
  CONFIG,
  getZone,
  getNpc,
  getProject,
  getEasterEgg,
  getAllProjects,
  TilemapGenerator,
  tilemapGenerator,
  generateTilemap,
  TILES,
  WALKABLE_TILES,
  MAP_CONFIG,
  ZoneLayoutPlanner,
  zoneLayoutPlanner,
  ZONE_LAYOUTS,
  SpawnPointManager,
  spawnPointManager,
  DEFAULT_SPAWNS,
  CollisionLayer,
  collisionLayer,
  COLLISION_DEFAULTS,
  ParticleEffectManager,
  particleEffectManager,
  PARTICLE_CONFIGS,
  LightingManager,
  lightingManager,
  LIGHT_CONFIGS,
  MinimapGenerator,
  minimapGenerator,
  MINIMAP_CONFIG,
  PlayerCharacter,
  playerCharacter,
  PLAYER_ANIMATIONS,
  MovementController,
  movementController
};

export default initGame;















