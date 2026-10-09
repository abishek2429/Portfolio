/**
 * ThemeManager - Comprehensive Dark/Light Mode Theme System
 * 
 * Dark Forest Portfolio Game
 * Manages full-game visual themes:
 * - Dark Mode (Default): Immersive midnight forest aesthetic with vibrant zone glows
 * - Light Mode (Accessibility): Soft, high-contrast daytime palette with muted tones
 * - Dynamic color mappings for UI panels, buttons, modals, input fields, shadows & glows
 * - WCAG AA contrast ratio compliance calculator (4.5:1 normal, 3:1 large text)
 * - OS system preference auto-detection (`prefers-color-scheme`)
 * - Theme variant creation & live preview mode with rollback
 * - Coordination with NightModeManager (night atmosphere only active in dark theme)
 * - LocalStorage persistence and GameState synchronization
 * - Headless / Node unit test safe architecture
 */

import eventBus, { GAME_EVENTS, STATE_EVENTS } from '../events/EventBus.js';
import defaultGameState from '../state/GameState.js';
import defaultNightModeManager from '../effects/NightModeManager.js';
import defaultVisualEffectsManager from '../effects/VisualEffectsManager.js';

// ==========================================
// CONSTANTS & PALETTE DEFINITIONS
// ==========================================

export const STORAGE_KEY_THEME = 'dark_forest_theme_preference';
export const STORAGE_KEY_USE_SYSTEM = 'dark_forest_theme_use_system';

export const THEME_NAMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const THEME_COLORS = {
  dark: {
    background: '#1a1a2e',
    surface: '#16213e',
    border: '#0f3460',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textDisabled: '#666666',
    accentBlue: '#4A90FF',
    accentCyan: '#00D9FF',
    accentPurple: '#B300FF',
    accentGreen: '#00FF66',
    accentGold: '#FFD700',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    buttonHoverBg: 'rgba(255, 255, 255, 0.2)',
    buttonText: '#ffffff',
    inputBg: '#0f3460',
    inputBorder: '#4A90FF',
    shadow: 'rgba(0, 0, 0, 0.6)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    links: '#00D9FF'
  },
  light: {
    background: '#f5f5f7',
    surface: '#ffffff',
    border: '#d0d0d0',
    text: '#1a1a2e',
    textSecondary: '#666666',
    textDisabled: '#999999',
    accentBlue: '#3366cc',
    accentCyan: '#0099cc',
    accentPurple: '#9933cc',
    accentGreen: '#33aa33',
    accentGold: '#cc9900',
    buttonBg: 'rgba(0, 0, 0, 0.05)',
    buttonHoverBg: 'rgba(0, 0, 0, 0.1)',
    buttonText: '#1a1a2e',
    inputBg: '#ffffff',
    inputBorder: '#d0d0d0',
    shadow: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.1)',
    links: '#3366cc'
  }
};

export const ZONE_THEME_COLORS = {
  dark: {
    foundation: '#4A90FF',
    webdev: '#00D9FF',
    aiml: '#B300FF',
    mobile: '#00FF66',
    summit: '#FFD700'
  },
  light: {
    foundation: '#3366cc',
    webdev: '#0099cc',
    aiml: '#9933cc',
    mobile: '#33aa33',
    summit: '#cc9900'
  }
};

export const THEME_CONFIG = {
  glowIntensity: {
    dark: 0.8,
    light: 0.4
  },
  shadowIntensity: {
    dark: 0.6,
    light: 0.2
  },
  transitionDurationMs: 300
};

// ==========================================
// COLOR UTILITIES & WCAG CALCULATORS
// ==========================================

/**
 * Parses any hex or rgb color string into normalized RGB components [0..255].
 * 
 * @param {string} colorStr
 * @returns {{ r: number, g: number, b: number }|null}
 */
export function parseColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const str = colorStr.trim();

  // Hex: #fff, #ffffff, #ffffff80
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }

  // RGB/RGBA: rgba(26, 26, 46, 0.95)
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3])
    };
  }

  return null;
}

/**
 * Calculates standard W3C relative luminance from normalized RGB components.
 * 
 * @param {string} colorStr
 * @returns {number} Relative luminance [0..1]
 */
export function getRelativeLuminance(colorStr) {
  const rgb = parseColor(colorStr);
  if (!rgb) return 0;

  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG contrast ratio between two colors.
 * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is lighter.
 * 
 * @param {string} color1
 * @param {string} color2
 * @returns {number} Contrast ratio (e.g. 15.3 for 15.3:1)
 */
export function calculateContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Determines whether a color combination meets WCAG AA standards.
 * 
 * @param {string} foreground - Text / Icon color
 * @param {string} background - Background color
 * @param {boolean} [isLargeText=false] - True if text is >= 18px or >= 14px bold
 * @returns {boolean}
 */
export function checkWcagCompliance(foreground, background, isLargeText = false) {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = isLargeText ? 3.0 : 4.5;
  return ratio >= threshold;
}

// ==========================================
// THEME MANAGER CLASS
// ==========================================

export class ThemeManager {
  /**
   * @param {Object} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.scene = null;
    this.gameState = options.gameState || defaultGameState;
    this.nightModeManager = options.nightModeManager || defaultNightModeManager;
    this.visualEffectsManager = options.visualEffectsManager || defaultVisualEffectsManager;
    this.eventBus = options.eventBus || eventBus;

    // Theme state
    this.currentTheme = THEME_NAMES.DARK;
    this.useSystemPreference = true;
    this.colors = JSON.parse(JSON.stringify(THEME_COLORS));
    this.zoneColors = JSON.parse(JSON.stringify(ZONE_THEME_COLORS));
    this.glowIntensity = { ...THEME_CONFIG.glowIntensity };
    this.shadowIntensity = { ...THEME_CONFIG.shadowIntensity };

    // Preview state
    this._isPreviewing = false;
    this._previewPreviousTheme = null;

    // Tracked styled UI elements for bulk refresh
    this.trackedElements = new Map(); // element -> { type, colorKey, options }

    // Media query listener
    this._systemMediaMatcher = null;
    this._boundOnSystemThemeChange = this._handleSystemThemeChange.bind(this);
  }

  // ==========================================
  // INITIALIZATION & LIFECYCLE
  // ==========================================

  /**
   * Initializes the theme manager, checks system preferences and persistent storage.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [gameState=null] - GameState instance
   * @returns {ThemeManager}
   */
  create(scene = null, gameState = null) {
    if (scene) this.scene = scene;
    if (gameState) this.gameState = gameState;

    // Load saved preferences
    this._loadSavedPreferences();

    // Attach system preference observer
    this._setupSystemPreferenceListener();

    // Apply the resolved theme
    const resolvedTheme = this.useSystemPreference
      ? (this.getSystemPreference() === 'light' ? THEME_NAMES.LIGHT : THEME_NAMES.DARK)
      : this.currentTheme;

    this.setTheme(resolvedTheme, false);

    // Initial event emission
    this.eventBus.emit('theme:initialized', this.getThemeConfig());

    return this;
  }

  /**
   * Disposes of listeners and cleans up tracked DOM/Phaser elements.
   */
  destroy() {
    if (this._systemMediaMatcher?.removeEventListener) {
      this._systemMediaMatcher.removeEventListener('change', this._boundOnSystemThemeChange);
    } else if (this._systemMediaMatcher?.removeListener) {
      this._systemMediaMatcher.removeListener(this._boundOnSystemThemeChange);
    }
    this._systemMediaMatcher = null;
    this.trackedElements.clear();
  }

  // ==========================================
  // THEME SWITCHING & STATE
  // ==========================================

  /**
   * Switches the active theme.
   * 
   * @param {'dark'|'light'|string} themeName - Theme identifier
   * @param {boolean} [animate=true] - Smooth CSS / tween transition
   * @returns {Object} Updated theme configuration
   */
  setTheme(themeName, animate = true) {
    const targetTheme = this.colors[themeName] ? themeName : THEME_NAMES.DARK;
    this.currentTheme = targetTheme;

    // Update root document CSS variables if DOM available
    this._applyRootThemeVariables(targetTheme, animate);

    // Refresh all registered UI elements
    this.updateThemeForAllElements();

    // Coordinate with NightModeManager
    // In light mode, night mode darkness cannot override the bright daytime aesthetic
    if (this.isLightMode()) {
      if (this.nightModeManager?.isNightModeActive?.()) {
        this.nightModeManager.setNightMode(false);
      }
    }

    // Coordinate glow intensity with VFX
    const glow = this.updateGlowIntensity();
    const shadow = this.updateShadowIntensity();

    // Persist preference if not in preview mode
    if (!this._isPreviewing) {
      this._persistPreferences();
    }

    const config = this.getThemeConfig();
    this.eventBus.emit('theme:changed', {
      theme: targetTheme,
      animate,
      config
    });

    return config;
  }

  /**
   * Checks whether Dark Mode is currently active.
   * @returns {boolean}
   */
  isDarkMode() {
    return this.currentTheme === THEME_NAMES.DARK;
  }

  /**
   * Checks whether Light Mode is currently active.
   * @returns {boolean}
   */
  isLightMode() {
    return this.currentTheme === THEME_NAMES.LIGHT;
  }

  /**
   * Toggles between Dark and Light mode.
   * 
   * @param {boolean} [animate=true]
   * @returns {'dark'|'light'} New theme name
   */
  toggleTheme(animate = true) {
    const nextTheme = this.isDarkMode() ? THEME_NAMES.LIGHT : THEME_NAMES.DARK;
    // Manual toggle overrides system preference
    this.useSystemPreference = false;
    this.setTheme(nextTheme, animate);
    return nextTheme;
  }

  /**
   * Returns list of all available theme names (built-in and variants).
   * @returns {string[]}
   */
  getAvailableThemes() {
    return Object.keys(this.colors);
  }

  /**
   * Returns a snapshot of the current theme configuration.
   * @returns {Object}
   */
  getThemeConfig() {
    return {
      currentTheme: this.currentTheme,
      useSystemPreference: this.useSystemPreference,
      colors: { ...this.colors[this.currentTheme] },
      zoneColors: { ...this.zoneColors[this.currentTheme] },
      glowIntensity: this.glowIntensity[this.currentTheme] ?? 0.8,
      shadowIntensity: this.shadowIntensity[this.currentTheme] ?? 0.6,
      isDark: this.isDarkMode(),
      isLight: this.isLightMode(),
      availableThemes: this.getAvailableThemes()
    };
  }

  // ==========================================
  // COLOR LOOKUPS & ZONE RETRIEVAL
  // ==========================================

  /**
   * Gets a specific color value for the active theme.
   * 
   * @param {string} colorKey - Key ('background', 'text', 'accentBlue', etc.)
   * @param {string} [fallback='#ffffff']
   * @returns {string} Hex or RGBA color
   */
  getThemeColor(colorKey, fallback = '#ffffff') {
    const activePalette = this.colors[this.currentTheme] || this.colors.dark;
    return activePalette[colorKey] ?? fallback;
  }

  /**
   * Gets theme-adjusted zone color.
   * Dark mode: bright & saturated. Light mode: soft & muted.
   * 
   * @param {string} zoneId - Zone identifier ('foundation', 'webdev', etc.)
   * @returns {string} Hex color
   */
  getZoneColor(zoneId) {
    const normalized = String(zoneId).toLowerCase();
    const activeZones = this.zoneColors[this.currentTheme] || this.zoneColors.dark;

    // Direct key match
    if (activeZones[normalized]) return activeZones[normalized];

    // Substring lookup
    if (normalized.includes('found')) return activeZones.foundation;
    if (normalized.includes('web')) return activeZones.webdev;
    if (normalized.includes('ai') || normalized.includes('ml')) return activeZones.aiml;
    if (normalized.includes('mobile')) return activeZones.mobile;
    if (normalized.includes('summit')) return activeZones.summit;

    return activeZones.foundation;
  }

  // ==========================================
  // ELEMENT STYLING HELPERS
  // ==========================================

  /**
   * Styles a generic element (DOM or Phaser) with a theme color.
   * 
   * @param {Object} element - Target element
   * @param {string} colorKey - Color property key in theme palette
   * @param {string} [property='background'] - CSS property ('background', 'color', 'borderColor')
   * @returns {Object} element
   */
  applyThemeToElement(element, colorKey, property = 'background') {
    if (!element) return element;
    const color = this.getThemeColor(colorKey);

    if (element.style) {
      if (property === 'background' || property === 'backgroundColor') {
        element.style.backgroundColor = color;
      } else if (property === 'color' || property === 'textColor') {
        element.style.color = color;
      } else if (property === 'borderColor' || property === 'border') {
        element.style.borderColor = color;
      }
    } else if (typeof element.setColor === 'function' && (property === 'color' || property === 'textColor')) {
      element.setColor(color);
    } else if (typeof element.setFillStyle === 'function' && property === 'background') {
      const parsed = parseColor(color);
      if (parsed) {
        const hexNum = (parsed.r << 16) | (parsed.g << 8) | parsed.b;
        element.setFillStyle(hexNum, 1);
      }
    }

    // Register for automatic refresh on theme changes
    this.trackedElements.set(element, { type: 'element', colorKey, property });

    return element;
  }

  /**
   * Styles a modal dialog or menu card panel for the active theme.
   * 
   * @param {Object} panel - Panel DOM or mock element
   * @returns {Object} panel
   */
  applyThemeToPanel(panel) {
    if (!panel) return panel;

    const bg = this.getThemeColor('surface');
    const border = this.getThemeColor('border');
    const text = this.getThemeColor('text');
    const shadowColor = this.getThemeColor('shadow');

    if (panel.style) {
      panel.style.backgroundColor = bg;
      panel.style.borderColor = border;
      panel.style.color = text;
      panel.style.boxShadow = `0 8px 32px ${shadowColor}`;
    }

    this.trackedElements.set(panel, { type: 'panel' });
    return panel;
  }

  /**
   * Styles a button with appropriate background, text, and hover transitions.
   * 
   * @param {Object} button - Button DOM or mock element
   * @returns {Object} button
   */
  applyThemeToButton(button) {
    if (!button) return button;

    const bg = this.getThemeColor('buttonBg');
    const hoverBg = this.getThemeColor('buttonHoverBg');
    const border = this.getThemeColor('border');
    const text = this.getThemeColor('buttonText');

    if (button.style) {
      button.style.backgroundColor = bg;
      button.style.borderColor = border;
      button.style.color = text;
      button.style.transition = 'background-color 150ms ease, transform 100ms ease, box-shadow 150ms ease';

      // Attach hover listeners if supported and not already bound
      if (!button._themeHoverBound && typeof button.addEventListener === 'function') {
        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = this.getThemeColor('buttonHoverBg');
        });
        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = this.getThemeColor('buttonBg');
        });
        button._themeHoverBound = true;
      }
    }

    this.trackedElements.set(button, { type: 'button' });
    return button;
  }

  /**
   * Re-evaluates and applies active theme colors across all registered elements.
   */
  updateThemeForAllElements() {
    for (const [el, descriptor] of this.trackedElements.entries()) {
      if (descriptor.type === 'panel') {
        this.applyThemeToPanel(el);
      } else if (descriptor.type === 'button') {
        this.applyThemeToButton(el);
      } else if (descriptor.type === 'element') {
        this.applyThemeToElement(el, descriptor.colorKey, descriptor.property);
      }
    }
  }

  // ==========================================
  // GLOW & SHADOW INTENSITY
  // ==========================================

  /**
   * Adjusts glow brightness based on theme or explicit override.
   * Dark Mode: 0.8 - 1.0 (bright glows). Light Mode: 0.3 - 0.5 (subtle).
   * 
   * @param {number} [intensity=null] - Optional override (0..1)
   * @returns {number} Active glow intensity
   */
  updateGlowIntensity(intensity = null) {
    if (intensity !== null) {
      const clamped = Math.max(0, Math.min(1, Number(intensity) || 0));
      this.glowIntensity[this.currentTheme] = clamped;
    }

    const currentGlow = this.glowIntensity[this.currentTheme] ?? (this.isDarkMode() ? 0.8 : 0.4);

    if (this.visualEffectsManager?.setGlowIntensity) {
      this.visualEffectsManager.setGlowIntensity(currentGlow);
    }

    this.eventBus.emit('theme:glowUpdated', {
      theme: this.currentTheme,
      intensity: currentGlow
    });

    return currentGlow;
  }

  /**
   * Adjusts shadow strength.
   * Dark Mode: heavier shadows (0.6). Light Mode: subtle shadows (0.2).
   * 
   * @param {number} [intensity=null]
   * @returns {number} Active shadow intensity
   */
  updateShadowIntensity(intensity = null) {
    if (intensity !== null) {
      const clamped = Math.max(0, Math.min(1, Number(intensity) || 0));
      this.shadowIntensity[this.currentTheme] = clamped;
    }

    const currentShadow = this.shadowIntensity[this.currentTheme] ?? (this.isDarkMode() ? 0.6 : 0.2);

    this.eventBus.emit('theme:shadowUpdated', {
      theme: this.currentTheme,
      intensity: currentShadow
    });

    return currentShadow;
  }

  // ==========================================
  // NIGHT MODE COORDINATION
  // ==========================================

  /**
   * Handles Night Mode requests in relation to Dark/Light theme.
   * Night mode is only permitted during Dark Theme.
   * 
   * @param {boolean} enabled - Desired night mode state
   * @returns {boolean} True if night mode was successfully applied
   */
  applyNightMode(enabled) {
    if (this.isLightMode()) {
      // In light mode, night mode is blocked to preserve daylight readability
      if (this.nightModeManager?.setNightMode) {
        this.nightModeManager.setNightMode(false);
      }
      return false;
    }

    if (this.nightModeManager?.setNightMode) {
      return this.nightModeManager.setNightMode(enabled);
    }
    return Boolean(enabled);
  }

  // ==========================================
  // SYSTEM PREFERENCES & AUTO-THEME
  // ==========================================

  /**
   * Detects operating system dark/light preference.
   * 
   * @returns {'dark'|'light'|'no-preference'}
   */
  getSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark'; // Dark forest default
  }

  /**
   * Sets whether the game should follow the OS color scheme preference.
   * 
   * @param {boolean} enabled
   * @returns {ThemeManager}
   */
  respectSystemPreference(enabled) {
    this.useSystemPreference = Boolean(enabled);

    if (this.useSystemPreference) {
      this.setAutoTheme();
    } else {
      this._persistPreferences();
    }

    return this;
  }

  /**
   * Automatically switches to the detected operating system theme.
   * 
   * @returns {'dark'|'light'}
   */
  setAutoTheme() {
    this.useSystemPreference = true;
    const sys = this.getSystemPreference();
    const target = sys === 'light' ? THEME_NAMES.LIGHT : THEME_NAMES.DARK;
    this.setTheme(target, true);
    this._persistPreferences();
    return target;
  }

  /**
   * Sets a manual theme override, disabling auto-system sync.
   * 
   * @param {'dark'|'light'|string} [themeName=null]
   * @returns {'dark'|'light'|string}
   */
  setManualTheme(themeName = null) {
    this.useSystemPreference = false;
    const target = themeName || this.currentTheme;
    this.setTheme(target, true);
    this._persistPreferences();
    return target;
  }

  // ==========================================
  // PREVIEW MODE (ROLLBACK SUPPORT)
  // ==========================================

  /**
   * Previews a theme temporarily without saving it to persistent storage.
   * 
   * @param {string} themeName
   * @param {boolean} [animate=true]
   */
  previewTheme(themeName, animate = true) {
    if (!this._isPreviewing) {
      this._previewPreviousTheme = this.currentTheme;
      this._isPreviewing = true;
    }
    this.setTheme(themeName, animate);
  }

  /**
   * Cancels a theme preview and reverts back to the previously active theme.
   * 
   * @param {boolean} [animate=true]
   */
  cancelPreview(animate = true) {
    if (this._isPreviewing && this._previewPreviousTheme) {
      const prev = this._previewPreviousTheme;
      this._isPreviewing = false;
      this._previewPreviousTheme = null;
      this.setTheme(prev, animate);
    }
  }

  // ==========================================
  // CUSTOM THEME VARIANTS
  // ==========================================

  /**
   * Creates and registers a new custom theme variant based on an existing palette.
   * 
   * @param {string} baseName - Base theme name ('dark' or 'light')
   * @param {Object} overrides - Object containing color overrides
   * @param {string} [variantName=null] - Identifier for the new theme
   * @returns {string} Registered variant name
   */
  createThemeVariant(baseName, overrides = {}, variantName = null) {
    const basePalette = this.colors[baseName] || this.colors.dark;
    const name = variantName || `${baseName}-variant-${Object.keys(this.colors).length}`;

    this.colors[name] = {
      ...basePalette,
      ...overrides
    };

    // Clone zone colors if provided or inherit from base
    this.zoneColors[name] = {
      ...(this.zoneColors[baseName] || this.zoneColors.dark),
      ...(overrides.zoneColors || {})
    };

    this.glowIntensity[name] = overrides.glowIntensity ?? this.glowIntensity[baseName] ?? 0.8;
    this.shadowIntensity[name] = overrides.shadowIntensity ?? this.shadowIntensity[baseName] ?? 0.6;

    this.eventBus.emit('theme:variantCreated', { name, baseName });
    return name;
  }

  // ==========================================
  // ACCESSIBILITY & CONTRAST
  // ==========================================

  /**
   * Calculates WCAG contrast ratio between two colors.
   * 
   * @param {string} color1
   * @param {string} color2
   * @returns {number} Ratio (e.g. 15.3)
   */
  getContrast(color1, color2) {
    return calculateContrastRatio(color1, color2);
  }

  /**
   * Verifies if two colors meet WCAG AA standards.
   * 
   * @param {string} foreground
   * @param {string} background
   * @param {boolean} [isLargeText=false]
   * @returns {boolean}
   */
  isAccessible(foreground, background, isLargeText = false) {
    return checkWcagCompliance(foreground, background, isLargeText);
  }

  // ==========================================
  // SERIALIZATION & DEBUGGING
  // ==========================================

  /**
   * Serializes current theme settings for save files.
   * 
   * @returns {Object}
   */
  serialize() {
    return {
      theme: this.currentTheme,
      useSystemPreference: this.useSystemPreference,
      glowIntensity: this.glowIntensity,
      shadowIntensity: this.shadowIntensity,
      timestamp: Date.now()
    };
  }

  /**
   * Restores theme settings from serialized data.
   * 
   * @param {Object} data
   */
  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    if (data.useSystemPreference !== undefined) {
      this.useSystemPreference = Boolean(data.useSystemPreference);
    }
    if (data.theme && this.colors[data.theme]) {
      this.currentTheme = data.theme;
      this.setTheme(data.theme, false);
    }
    if (data.glowIntensity) {
      this.glowIntensity = { ...this.glowIntensity, ...data.glowIntensity };
    }
    if (data.shadowIntensity) {
      this.shadowIntensity = { ...this.shadowIntensity, ...data.shadowIntensity };
    }
  }

  /**
   * Logs current theme snapshot and contrast metrics to console.
   */
  logThemeState() {
    const config = this.getThemeConfig();
    const bg = this.getThemeColor('background');
    const text = this.getThemeColor('text');
    const contrast = this.getContrast(text, bg);

    console.log('[ThemeManager] State Snapshot:', {
      theme: config.currentTheme,
      useSystemPreference: config.useSystemPreference,
      contrast: `${contrast}:1 (WCAG AA: ${this.isAccessible(text, bg) ? 'PASS' : 'FAIL'})`,
      glow: config.glowIntensity,
      shadow: config.shadowIntensity
    });
  }

  // ==========================================
  // INTERNAL HELPERS
  // ==========================================

  /**
   * Updates CSS custom properties on document.documentElement.
   * @private
   */
  _applyRootThemeVariables(themeName, animate = true) {
    if (typeof document === 'undefined' || !document.documentElement) return;

    const root = document.documentElement;
    const palette = this.colors[themeName];
    if (!palette) return;

    // Apply data-theme attribute
    root.setAttribute('data-theme', themeName);

    // Apply smooth CSS transitions
    if (animate) {
      root.style.transition = `background-color ${THEME_CONFIG.transitionDurationMs}ms ease, color ${THEME_CONFIG.transitionDurationMs}ms ease`;
    }

    // Set CSS custom properties
    root.style.setProperty('--theme-background', palette.background);
    root.style.setProperty('--theme-surface', palette.surface);
    root.style.setProperty('--theme-border', palette.border);
    root.style.setProperty('--theme-text', palette.text);
    root.style.setProperty('--theme-text-secondary', palette.textSecondary);
    root.style.setProperty('--theme-accent-blue', palette.accentBlue);
    root.style.setProperty('--theme-accent-cyan', palette.accentCyan);
    root.style.setProperty('--theme-accent-purple', palette.accentPurple);
    root.style.setProperty('--theme-accent-green', palette.accentGreen);
    root.style.setProperty('--theme-accent-gold', palette.accentGold);
    root.style.setProperty('--theme-button-bg', palette.buttonBg);
    root.style.setProperty('--theme-button-text', palette.buttonText);
    root.style.setProperty('--theme-shadow', palette.shadow);
    root.style.setProperty('--theme-overlay', palette.overlay);
    root.style.setProperty('--theme-glow-intensity', String(this.glowIntensity[themeName] ?? 0.8));
  }

  /**
   * Sets up matchMedia listener for OS preference changes.
   * @private
   */
  _setupSystemPreferenceListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    try {
      this._systemMediaMatcher = window.matchMedia('(prefers-color-scheme: dark)');
      if (this._systemMediaMatcher.addEventListener) {
        this._systemMediaMatcher.addEventListener('change', this._boundOnSystemThemeChange);
      } else if (this._systemMediaMatcher.addListener) {
        this._systemMediaMatcher.addListener(this._boundOnSystemThemeChange);
      }
    } catch (e) {}
  }

  /**
   * Handles OS color scheme change event.
   * @private
   */
  _handleSystemThemeChange(e) {
    if (!this.useSystemPreference) return;
    const nextTheme = e.matches ? THEME_NAMES.DARK : THEME_NAMES.LIGHT;
    this.setTheme(nextTheme, true);
  }

  /**
   * Loads saved theme preference from localStorage.
   * @private
   */
  _loadSavedPreferences() {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme && this.colors[savedTheme]) {
        this.currentTheme = savedTheme;
      }

      const savedSystemPref = localStorage.getItem(STORAGE_KEY_USE_SYSTEM);
      if (savedSystemPref !== null) {
        this.useSystemPreference = savedSystemPref === 'true';
      }
    } catch (e) {}
  }

  /**
   * Persists theme settings to localStorage.
   * @private
   */
  _persistPreferences() {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY_THEME, this.currentTheme);
      localStorage.setItem(STORAGE_KEY_USE_SYSTEM, String(this.useSystemPreference));
    } catch (e) {}
  }
}

// Global Singleton Instance
export const themeManager = new ThemeManager();
export default themeManager;
