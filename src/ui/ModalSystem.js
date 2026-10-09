/**
 * ModalSystem - Project Showcase & Detail Modal Overlay System
 * 
 * Dark Forest Portfolio Game
 * Displays centered, responsive project modals with smooth spring animations,
 * movement locking, ESC/overlay dismissal, and seamless ProjectCardRenderer integration.
 */

import eventBus, { PROJECT_EVENTS } from '../events/EventBus.js';
import { inputHandler as defaultInputHandler, INPUT_CONTEXTS } from '../input/InputHandler.js';
import { projectCardRenderer as defaultCardRenderer } from './ProjectCardRenderer.js';

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...tokens) { tokens.forEach(t => this._classes.add(t)); }
  remove(...tokens) { tokens.forEach(t => this._classes.delete(t)); }
  contains(token) { return this._classes.has(token); }
  has(token) { return this._classes.has(token); }
  toggle(token, force) {
    if (force !== undefined) {
      if (force) this.add(token);
      else this.remove(token);
      return force;
    }
    if (this.contains(token)) {
      this.remove(token);
      return false;
    }
    this.add(token);
    return true;
  }
  toString() { return Array.from(this._classes).join(' '); }
}

// Fallback mock element for headless / Node test environments
class NodeMockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.classList = new MockClassList();
    this.listeners = {};
    this._innerHTML = '';
    this._textContent = undefined;
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    if (!val) {
      this.children = [];
      this._textContent = undefined;
    }
  }

  get textContent() {
    if (this._textContent !== undefined) return this._textContent;
    if (this.children.length > 0) return this.children.map(c => c.textContent).join(' ').trim();
    return this._innerHTML ? this._innerHTML.replace(/<[^>]*>/g, ' ').trim() : '';
  }

  set textContent(val) {
    this._textContent = String(val);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }

  getAttribute(k) {
    return this.attributes[k] || null;
  }

  removeAttribute(k) {
    delete this.attributes[k];
  }

  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this._findChild(c => c.classList.has(cls));
    }
    return this._findChild(c => c.tagName.toLowerCase() === selector.toLowerCase());
  }

  querySelectorAll(selector) {
    const results = [];
    this._findAllChildren(selector, results);
    return results;
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event?.type || event] || [];
    handlers.forEach(h => h(event));
  }

  _findChild(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child._findChild(predicate);
      if (found) return found;
    }
    return null;
  }

  _findAllChildren(selector, out) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.classList.has(selector.slice(1))) {
        out.push(child);
      } else if (child.tagName.toLowerCase() === selector.toLowerCase()) {
        out.push(child);
      }
      child._findAllChildren(selector, out);
    }
  }
}

/**
 * Returns document object or headless mock factory.
 */
function getDocument() {
  if (typeof document !== 'undefined') {
    return document;
  }
  return {
    createElement(tag) {
      return new NodeMockElement(tag);
    },
    body: new NodeMockElement('body'),
    head: new NodeMockElement('head'),
    getElementById() {
      return null;
    }
  };
}

export class ModalSystem {
  constructor() {
    this.scene = null;
    this.inputHandler = null;
    this.eventBus = null;
    this.cardRenderer = defaultCardRenderer;

    // DOM references
    this.overlay = null;
    this.container = null;
    this.header = null;
    this.titleElement = null;
    this.closeBtn = null;
    this.contentElement = null;
    this.footerElement = null;
    this.loadingSpinner = null;

    // State management
    this.isOpen = false;
    this.isEnabled = true;
    this.currentProject = null;
    this.onCloseCallback = null;
    this.autoCloseOnLink = false;
    this.stylesInjected = false;

    // Bound listeners for cleanup
    this._boundOnKeyDown = this._handleKeyDown.bind(this);
    this._boundOnOverlayClick = this._handleOverlayClick.bind(this);
    this._boundOnCloseBtnClick = this._handleCloseBtnClick.bind(this);
  }

  /**
   * Initializes the modal overlay, container structure, and event bindings.
   * 
   * @param {Phaser.Scene} scene - Active Phaser scene
   * @param {Object} [inputHandler] - InputHandler instance
   * @param {Object} [bus] - EventBus instance
   * @param {Object} [cardRenderer] - Optional custom ProjectCardRenderer instance
   * @returns {ModalSystem}
   */
  create(scene, inputHandler = null, bus = null, cardRenderer = null) {
    this.scene = scene;
    this.inputHandler = inputHandler || defaultInputHandler;
    this.eventBus = bus || eventBus;
    if (cardRenderer) {
      this.cardRenderer = cardRenderer;
    }

    this._injectStyles();
    this._buildModalDOM();
    this._bindEventListeners();

    return this;
  }

  /**
   * Displays a project card within the centered modal dialog.
   * 
   * @param {Object} projectData - Full project metadata packet
   * @param {Function} [onClose] - Optional callback fired upon modal dismissal
   */
  openProjectModal(projectData, onClose = null) {
    if (!this.container || !projectData) return;

    this.currentProject = projectData;
    this.onCloseCallback = onClose;

    // Set Title
    if (this.titleElement) {
      this.titleElement.textContent = projectData.name || 'Project Overview';
    }

    // Set Thematic Zone Accent Color
    const zoneColor = projectData.glowColor || '#00D9FF';
    this.setZoneColor(zoneColor);

    // Render ProjectCard into Content Area
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
      const card = this.cardRenderer.create(projectData);
      this.contentElement.appendChild(card);

      // Optional auto-close on external link click
      if (this.autoCloseOnLink) {
        const links = card.querySelectorAll ? card.querySelectorAll('.df-action-link') : [];
        links.forEach(l => {
          l.addEventListener('click', () => {
            this.closeModal();
          });
        });
      }
    }

    // Lock player locomotion
    if (this.inputHandler) {
      if (typeof this.inputHandler.lockMovement === 'function') {
        this.inputHandler.lockMovement(true);
      }
      if (typeof this.inputHandler.setInputContext === 'function') {
        this.inputHandler.setInputContext(INPUT_CONTEXTS?.MODAL || 'modal');
      }
    }

    // Prevent background scrolling
    const doc = getDocument();
    if (doc.body?.style) {
      doc.body.style.overflow = 'hidden';
    }

    // Animate In
    this.overlay.style.display = 'block';
    this.container.style.display = 'flex';
    this.overlay.classList.add('active');
    this.container.classList.add('active');

    this.isOpen = true;

    // Broadcast Event
    if (this.eventBus) {
      this.eventBus.emit(PROJECT_EVENTS.PROJECT_MODAL_OPENED, {
        projectId: projectData.id,
        projectName: projectData.name
      });
    }
  }

  /**
   * Closes the active modal with smooth exit transitions and unlocks movement.
   */
  closeModal() {
    if (!this.isOpen || !this.isEnabled) return;

    const closingProject = this.currentProject;

    // Start exit transitions
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.container) {
      this.container.classList.remove('active');
    }

    // Delay display:none to permit CSS exit transition (200ms)
    const cleanupDisplay = () => {
      if (this.overlay) this.overlay.style.display = 'none';
      if (this.container) this.container.style.display = 'none';
    };

    if (typeof setTimeout !== 'undefined') {
      setTimeout(cleanupDisplay, 200);
    } else {
      cleanupDisplay();
    }

    // Re-enable player locomotion
    if (this.inputHandler) {
      if (typeof this.inputHandler.lockMovement === 'function') {
        this.inputHandler.lockMovement(false);
      }
      if (typeof this.inputHandler.setInputContext === 'function') {
        this.inputHandler.setInputContext(INPUT_CONTEXTS?.GAMEPLAY || 'gameplay');
      }
    }

    // Restore background scrolling
    const doc = getDocument();
    if (doc.body?.style) {
      doc.body.style.overflow = '';
    }

    this.isOpen = false;
    this.currentProject = null;

    // Invoke registered callback
    if (typeof this.onCloseCallback === 'function') {
      this.onCloseCallback(closingProject);
      this.onCloseCallback = null;
    }

    // Broadcast Event
    if (this.eventBus) {
      this.eventBus.emit(PROJECT_EVENTS.PROJECT_MODAL_CLOSED, {
        projectId: closingProject?.id
      });
    }
  }

  /**
   * Returns whether a modal is currently open and visible.
   * @returns {boolean}
   */
  isModalOpen() {
    return this.isOpen;
  }

  /**
   * Returns the currently displayed project metadata object, or null.
   * @returns {Object|null}
   */
  getCurrentModalProject() {
    return this.currentProject;
  }

  /**
   * Updates the modal's border, shadow, and header divider accents.
   * 
   * @param {string} color - Hex color code (e.g. '#00D9FF')
   */
  setZoneColor(color) {
    if (!this.container) return;

    this.container.style.borderColor = color;
    this.container.style.boxShadow = `0 15px 50px rgba(0, 0, 0, 0.7), 0 0 30px ${this._hexToRgba(color, 0.3)}`;

    if (this.header) {
      this.header.style.borderBottomColor = this._hexToRgba(color, 0.4);
    }
  }

  /**
   * Dynamically swaps the active project card content without reopening.
   * 
   * @param {Object} projectData
   */
  updateContent(projectData) {
    if (!this.isOpen || !projectData) return;

    this.currentProject = projectData;

    if (this.titleElement) {
      this.titleElement.textContent = projectData.name || 'Project Details';
    }

    const zoneColor = projectData.glowColor || '#00D9FF';
    this.setZoneColor(zoneColor);

    if (this.contentElement) {
      this.contentElement.innerHTML = '';
      const card = this.cardRenderer.create(projectData);
      this.contentElement.appendChild(card);
    }
  }

  /**
   * Configures whether external links automatically dismiss the modal.
   * @param {boolean} enabled
   */
  setAutoClose(enabled) {
    this.autoCloseOnLink = Boolean(enabled);
  }

  /**
   * Displays an animated loading spinner within the content container.
   */
  showLoadingState() {
    if (!this.contentElement) return;

    if (!this.loadingSpinner) {
      const doc = getDocument();
      this.loadingSpinner = doc.createElement('div');
      this.loadingSpinner.classList.add('df-modal-loading');
      this.loadingSpinner.innerHTML = `
        <div class="df-spinner-ring"></div>
        <p class="df-spinner-text">Retrieving project artifacts...</p>
      `;
    }

    this.contentElement.innerHTML = '';
    this.contentElement.appendChild(this.loadingSpinner);
  }

  /**
   * Removes the loading spinner from the content container.
   */
  hideLoadingState() {
    if (this.loadingSpinner && this.loadingSpinner.parentNode) {
      this.loadingSpinner.parentNode.removeChild(this.loadingSpinner);
    }
  }

  /**
   * Sets maximum scrollable height for the modal container.
   * @param {number|string} pixels
   */
  setMaxHeight(pixels) {
    if (!this.container) return;
    this.container.style.maxHeight = typeof pixels === 'number' ? `${pixels}px` : String(pixels);
  }

  /**
   * Disables interaction (clicks and ESC keys). Useful during transitions.
   */
  disable() {
    this.isEnabled = false;
    if (this.container) {
      this.container.style.pointerEvents = 'none';
    }
  }

  /**
   * Restores user interaction.
   */
  enable() {
    this.isEnabled = true;
    if (this.container) {
      this.container.style.pointerEvents = 'auto';
    }
  }

  /**
   * Dismantles modal DOM elements and clears event listeners.
   */
  destroy() {
    if (this.isOpen) {
      this.closeModal();
    }

    this._unbindEventListeners();

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.overlay = null;
    this.container = null;
  }

  // --- Private Helpers ---

  /**
   * Constructs modal DOM elements once for continuous reuse.
   * @private
   */
  _buildModalDOM() {
    const doc = getDocument();

    // 1. Modal Overlay (fixed, backdrop)
    this.overlay = doc.createElement('div');
    this.overlay.classList.add('modal-overlay');
    this.overlay.style.zIndex = '999';
    this.overlay.style.display = 'none';

    // 2. Modal Container (fixed, centered)
    this.container = doc.createElement('div');
    this.container.classList.add('modal-container');
    this.container.style.zIndex = '1000';
    this.container.style.display = 'none';

    // 3. Modal Header
    this.header = doc.createElement('div');
    this.header.classList.add('modal-header');

    this.titleElement = doc.createElement('h2');
    this.titleElement.classList.add('modal-title');
    this.titleElement.textContent = 'Project Overview';
    this.header.appendChild(this.titleElement);

    this.closeBtn = doc.createElement('button');
    this.closeBtn.classList.add('close-btn');
    this.closeBtn.setAttribute('type', 'button');
    this.closeBtn.setAttribute('aria-label', 'Close modal');
    this.closeBtn.innerHTML = '✕';
    this.header.appendChild(this.closeBtn);

    this.container.appendChild(this.header);

    // 4. Modal Content Area (hosts ProjectCardRenderer)
    this.contentElement = doc.createElement('div');
    this.contentElement.classList.add('modal-content');
    this.container.appendChild(this.contentElement);

    // 5. Optional Modal Footer
    this.footerElement = doc.createElement('div');
    this.footerElement.classList.add('modal-footer');
    this.container.appendChild(this.footerElement);

    // Append to document body
    if (doc.body) {
      doc.body.appendChild(this.overlay);
      doc.body.appendChild(this.container);
    }
  }

  /**
   * Binds user interaction listeners (Click outside, Close X, ESC key).
   * @private
   */
  _bindEventListeners() {
    if (this.overlay) {
      this.overlay.addEventListener('click', this._boundOnOverlayClick);
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this._boundOnCloseBtnClick);
    }
    if (this.container) {
      // Prevent clicks inside modal from closing
      this.container.addEventListener('click', (e) => {
        e.stopPropagation?.();
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._boundOnKeyDown);
    }
  }

  /**
   * Unbinds user interaction listeners.
   * @private
   */
  _unbindEventListeners() {
    if (this.overlay) {
      this.overlay.removeEventListener?.('click', this._boundOnOverlayClick);
    }
    if (this.closeBtn) {
      this.closeBtn.removeEventListener?.('click', this._boundOnCloseBtnClick);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._boundOnKeyDown);
    }
  }

  _handleOverlayClick(e) {
    if (this.isEnabled && this.isOpen) {
      e?.stopPropagation?.();
      this.closeModal();
    }
  }

  _handleCloseBtnClick(e) {
    if (this.isEnabled && this.isOpen) {
      e?.stopPropagation?.();
      this.closeModal();
    }
  }

  _handleKeyDown(e) {
    if (this.isEnabled && this.isOpen && (e.key === 'Escape' || e.keyCode === 27)) {
      e?.preventDefault?.();
      this.closeModal();
    }
  }

  /**
   * Converts HEX to RGBA string.
   * @private
   */
  _hexToRgba(hex, alpha = 1.0) {
    if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${alpha})`;
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Injects modal CSS into browser document head once.
   * @private
   */
  _injectStyles() {
    if (this.stylesInjected || typeof document === 'undefined') return;

    if (document.getElementById('df-modal-styles')) {
      this.stylesInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'df-modal-styles';
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.2s ease-out;
      }

      .modal-overlay.active {
        opacity: 1;
      }

      .modal-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.82);
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        background: rgba(26, 26, 46, 0.98);
        border: 2px solid #00D9FF;
        border-radius: 8px;
        box-sizing: border-box;
        padding: 28px 32px 32px 32px;
        color: #ffffff;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.25s ease-out, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .modal-container.active {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.0);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 14px;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      }

      .modal-title {
        font-family: 'Georgia', 'Cinzel', serif;
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        color: #ffffff;
        letter-spacing: 0.5px;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 22px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 4px;
        opacity: 0.65;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.12);
        transform: scale(1.1);
      }

      .modal-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 6px;
      }

      /* Custom modal scrollbar */
      .modal-content::-webkit-scrollbar {
        width: 6px;
      }

      .modal-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }

      .modal-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.25);
        border-radius: 4px;
      }

      .modal-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.45);
      }

      .modal-footer {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .df-modal-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }

      .df-spinner-ring {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #00D9FF;
        border-radius: 50%;
        animation: dfSpin 0.8s linear infinite;
      }

      .df-spinner-text {
        margin-top: 14px;
        font-size: 13px;
        color: #a0a0c0;
      }

      @keyframes dfSpin {
        to { transform: rotate(360deg); }
      }

      /* Responsive Breakpoints */
      @media (min-width: 769px) {
        .modal-container {
          width: 600px;
        }
      }

      @media (max-width: 768px) and (min-width: 481px) {
        .modal-container {
          width: 80vw;
          padding: 24px;
        }
      }

      @media (max-width: 480px) {
        .modal-container {
          width: 90vw;
          padding: 18px 20px;
        }
        .modal-title {
          font-size: 19px;
        }
      }
    `;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }
}

// Export singleton instance and class
export const modalSystem = new ModalSystem();
export default modalSystem;
