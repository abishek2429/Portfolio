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
import {
  CameraFollower,
  cameraFollower,
  CAMERA_CONFIG
} from './camera/CameraFollower.js';
import {
  AnimationStateMachine,
  animationStateMachine,
  PLAYER_ANIM_CONFIGS,
  NPC_ANIM_TYPES,
  EMOTE_TYPES
} from './animation/AnimationStateMachine.js';
import {
  InputHandler,
  inputHandler,
  INPUT_CONTEXTS,
  DEFAULT_KEY_BINDINGS
} from './input/InputHandler.js';
import {
  FootstepFeedback,
  footstepFeedback,
  FOOTSTEP_CONFIG,
  TERRAIN_TYPES
} from './effects/FootstepFeedback.js';
import {
  NPCSpawner,
  npcSpawner,
  NPC_DEFINITIONS
} from './entities/NPCSpawner.js';
import {
  DialogueManager,
  dialogueManager,
  DIALOGUE_CONFIG
} from './ui/DialogueManager.js';
import {
  ConversationStateTracker,
  conversationStateTracker,
  DEFAULT_NPC_IDS,
  TIER_UNLOCK_RULES
} from './state/ConversationStateTracker.js';
import { Tier1Dialogues } from './dialogue/Tier1Dialogues.js';
import { Tier2Dialogues } from './dialogue/Tier2Dialogues.js';
import { Tier3Dialogues } from './dialogue/Tier3Dialogues.js';
import {
  DialogueAnimations,
  dialogueAnimations,
  DIALOGUE_ANIMATION_CONFIGS
} from './animation/DialogueAnimations.js';
import {
  NPCInteractionSystem,
  npcInteractionSystem,
  INTERACTION_STATES,
  INTERACTION_CONFIG
} from './controllers/NPCInteractionSystem.js';
import {
  DialogueBranchingLogic,
  dialogueBranchingLogic,
  CONDITION_TYPES,
  OPERATORS
} from './dialogue/DialogueBranchingLogic.js';
import {
  ZoneVisualizer,
  zoneVisualizer,
  ZONE_ELEMENT_COLORS
} from './world/ZoneVisualizer.js';
import {
  ProjectCardRenderer,
  projectCardRenderer,
  PROJECT_STATUS
} from './ui/ProjectCardRenderer.js';
import {
  ModalSystem,
  modalSystem
} from './ui/ModalSystem.js';
import {
  FoundationClearingData,
  foundationClearingData,
  FOUNDATION_CLEARING_DATA
} from './world/FoundationClearingData.js';
import {
  WebDevOutpostData,
  webDevOutpostData,
  WEB_DEV_OUTPOST_DATA
} from './world/WebDevOutpostData.js';
import {
  AiMlWoodsData,
  aiMlWoodsData,
  AI_ML_WOODS_DATA
} from './world/AiMlWoodsData.js';
import {
  MobileValleyData,
  mobileValleyData,
  MOBILE_VALLEY_DATA
} from './world/MobileValleyData.js';
import {
  SummitNexusData,
  summitNexusData,
  SUMMIT_NEXUS_DATA
} from './world/SummitNexusData.js';
import {
  ZoneUnlockTracker,
  zoneUnlockTracker,
  ZONE_DISCOVERY_STATES,
  ZONE_NAMES,
  ZONE_PATH_NETWORK,
  DEFAULT_UNLOCK_REQUIREMENTS
} from './world/ZoneUnlockTracker.js';
import {
  GlowEffectManager,
  glowEffectManager,
  ZONE_GLOW_CONFIGS
} from './effects/GlowEffectManager.js';
import {
  ProgressTracker,
  progressTracker,
  PROGRESS_WEIGHTS,
  CANONICAL_PROGRESS_ENTITIES,
  PROGRESS_STAGES,
  MILESTONES
} from './state/ProgressTracker.js';
import {
  AchievementSystem,
  achievementSystem,
  ACHIEVEMENT_DEFINITIONS,
  RARITY_LEVELS,
  RARITY_CONFIG
} from './state/AchievementSystem.js';
import {
  EasterEggManager,
  easterEggManager,
  EASTER_EGG_DEFINITIONS
} from './world/EasterEggManager.js';
import {
  UnlockConditionEvaluator,
  unlockConditionEvaluator,
  CONDITION_OPERATORS,
  DEFAULT_UNLOCK_PRESETS
} from './world/UnlockConditionEvaluator.js';
import {
  MilestoneRewardManager,
  milestoneRewardManager,
  MILESTONE_DEFINITIONS,
  REWARD_TYPES
} from './state/MilestoneRewardManager.js';
import {
  NightModeManager,
  nightModeManager,
  NIGHT_MODE_THEMES,
  COLOR_LOOKUP_TABLE,
  shiftColorToNight,
  shiftColorToDay
} from './effects/NightModeManager.js';
import {
  HUDRenderer,
  hudRenderer,
  HUD_CONFIG,
  ZONE_DISPLAY_CONFIG,
  ZONE_HINTS,
  getProgressBarColor
} from './ui/HUDRenderer.js';
import {
  MenuSystem,
  menuSystem,
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS
} from './ui/MenuSystem.js';
import {
  PauseScreenManager,
  pauseScreenManager,
  PAUSE_CONFIG
} from './ui/PauseScreenManager.js';
import {
  AudioManager,
  audioManager,
  AUDIO_CHANNELS,
  DEFAULT_CHANNEL_VOLUMES,
  AUDIO_MANIFEST,
  ZONE_MUSIC_MAP,
  DUCKING_FACTORS
} from './audio/AudioManager.js';
import {
  VisualEffectsManager,
  visualEffectsManager,
  VFX_CONFIG,
  PARTICLE_EFFECT_TEMPLATES
} from './effects/VisualEffectsManager.js';
import {
  TransitionManager,
  transitionManager,
  TRANSITION_TYPES,
  TRANSITION_CONFIG
} from './scenes/TransitionManager.js';
import {
  ResponsiveUIManager,
  responsiveUIManager,
  BREAKPOINTS,
  SCALES,
  CANVAS_SIZES,
  FONT_SIZES,
  MIN_FONT_SIZE,
  HUD_RESPONSIVE_CONFIG
} from './ui/ResponsiveUIManager.js';
import {
  ThemeManager,
  themeManager,
  THEME_NAMES,
  THEME_COLORS,
  ZONE_THEME_COLORS,
  THEME_CONFIG,
  STORAGE_KEY_THEME,
  calculateContrastRatio,
  checkWcagCompliance
} from './ui/ThemeManager.js';
import {
  AccessibilityManager,
  accessibilityManager,
  TEXT_SIZES,
  TEXT_SIZE_SCALES,
  COLOR_BLIND_MODES,
  FOCUS_INDICATOR_STYLES,
  HINT_FREQUENCIES,
  COLOR_BLIND_ZONE_PALETTES,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  STORAGE_KEY_ACCESSIBILITY
} from './ui/AccessibilityManager.js';

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
  movementController,
  CameraFollower,
  cameraFollower,
  CAMERA_CONFIG,
  AnimationStateMachine,
  animationStateMachine,
  PLAYER_ANIM_CONFIGS,
  NPC_ANIM_TYPES,
  EMOTE_TYPES,
  InputHandler,
  inputHandler,
  INPUT_CONTEXTS,
  DEFAULT_KEY_BINDINGS,
  FootstepFeedback,
  footstepFeedback,
  FOOTSTEP_CONFIG,
  TERRAIN_TYPES,
  NPCSpawner,
  npcSpawner,
  NPC_DEFINITIONS,
  DialogueManager,
  dialogueManager,
  DIALOGUE_CONFIG,
  ConversationStateTracker,
  conversationStateTracker,
  DEFAULT_NPC_IDS,
  TIER_UNLOCK_RULES,
  Tier1Dialogues,
  Tier2Dialogues,
  Tier3Dialogues,
  DialogueAnimations,
  dialogueAnimations,
  DIALOGUE_ANIMATION_CONFIGS,
  NPCInteractionSystem,
  npcInteractionSystem,
  INTERACTION_STATES,
  INTERACTION_CONFIG,
  DialogueBranchingLogic,
  dialogueBranchingLogic,
  CONDITION_TYPES,
  OPERATORS,
  ZoneVisualizer,
  zoneVisualizer,
  ZONE_ELEMENT_COLORS,
  ProjectCardRenderer,
  projectCardRenderer,
  PROJECT_STATUS,
  ModalSystem,
  modalSystem,
  FoundationClearingData,
  foundationClearingData,
  FOUNDATION_CLEARING_DATA,
  WebDevOutpostData,
  webDevOutpostData,
  WEB_DEV_OUTPOST_DATA,
  AiMlWoodsData,
  aiMlWoodsData,
  AI_ML_WOODS_DATA,
  MobileValleyData,
  mobileValleyData,
  MOBILE_VALLEY_DATA,
  SummitNexusData,
  summitNexusData,
  SUMMIT_NEXUS_DATA,
  ZoneUnlockTracker,
  zoneUnlockTracker,
  ZONE_DISCOVERY_STATES,
  ZONE_NAMES,
  ZONE_PATH_NETWORK,
  DEFAULT_UNLOCK_REQUIREMENTS,
  GlowEffectManager,
  glowEffectManager,
  ZONE_GLOW_CONFIGS,
  ProgressTracker,
  progressTracker,
  PROGRESS_WEIGHTS,
  CANONICAL_PROGRESS_ENTITIES,
  PROGRESS_STAGES,
  MILESTONES,
  AchievementSystem,
  achievementSystem,
  ACHIEVEMENT_DEFINITIONS,
  RARITY_LEVELS,
  RARITY_CONFIG,
  EasterEggManager,
  easterEggManager,
  EASTER_EGG_DEFINITIONS,
  UnlockConditionEvaluator,
  unlockConditionEvaluator,
  CONDITION_OPERATORS,
  DEFAULT_UNLOCK_PRESETS,
  MilestoneRewardManager,
  milestoneRewardManager,
  MILESTONE_DEFINITIONS,
  REWARD_TYPES,
  NightModeManager,
  nightModeManager,
  NIGHT_MODE_THEMES,
  COLOR_LOOKUP_TABLE,
  shiftColorToNight,
  shiftColorToDay,
  HUDRenderer,
  hudRenderer,
  HUD_CONFIG,
  ZONE_DISPLAY_CONFIG,
  ZONE_HINTS,
  getProgressBarColor,
  MenuSystem,
  menuSystem,
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  PauseScreenManager,
  pauseScreenManager,
  PAUSE_CONFIG,
  AudioManager,
  audioManager,
  AUDIO_CHANNELS,
  DEFAULT_CHANNEL_VOLUMES,
  AUDIO_MANIFEST,
  ZONE_MUSIC_MAP,
  DUCKING_FACTORS,
  VisualEffectsManager,
  visualEffectsManager,
  VFX_CONFIG,
  PARTICLE_EFFECT_TEMPLATES,
  TransitionManager,
  transitionManager,
  TRANSITION_TYPES,
  TRANSITION_CONFIG,
  ResponsiveUIManager,
  responsiveUIManager,
  BREAKPOINTS,
  SCALES,
  CANVAS_SIZES,
  FONT_SIZES,
  MIN_FONT_SIZE,
  HUD_RESPONSIVE_CONFIG,
  ThemeManager,
  themeManager,
  THEME_NAMES,
  THEME_COLORS,
  ZONE_THEME_COLORS,
  THEME_CONFIG,
  STORAGE_KEY_THEME,
  calculateContrastRatio,
  checkWcagCompliance,
  AccessibilityManager,
  accessibilityManager,
  TEXT_SIZES,
  TEXT_SIZE_SCALES,
  COLOR_BLIND_MODES,
  FOCUS_INDICATOR_STYLES,
  HINT_FREQUENCIES,
  COLOR_BLIND_ZONE_PALETTES,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  STORAGE_KEY_ACCESSIBILITY
};

export default initGame;















