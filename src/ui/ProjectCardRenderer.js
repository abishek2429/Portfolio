/**
 * ProjectCardRenderer - Individual Project Presentation Component
 * 
 * Dark Forest Portfolio Game
 * Renders rich, interactive project cards showcasing tech stacks, live demos,
 * key architectural features, and expandable deep-dives.
 * Pure presentation component designed for embedding in Modals (Prompt 32).
 */

// Canonical status definitions
export const PROJECT_STATUS = {
  COMPLETED: {
    label: 'COMPLETED',
    color: '#00E676', // Emerald Green
    bg: 'rgba(0, 230, 118, 0.15)',
    icon: '✓'
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    color: '#29B6F6', // Cerulean Blue
    bg: 'rgba(41, 182, 246, 0.15)',
    icon: '⚡'
  },
  PUBLISHED: {
    label: 'PUBLISHED',
    color: '#FFD700', // Gold
    bg: 'rgba(255, 215, 0, 0.15)',
    icon: '★'
  }
};

// Mock ClassList supporting DOMTokenList APIs in headless environments
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

// Fallback mock element for headless / Node test runner environments
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
  }

  get textContent() {
    if (this._textContent !== undefined) {
      return this._textContent;
    }
    if (this.children.length > 0) {
      return this.children.map(c => c.textContent).join(' ').trim();
    }
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
    if (selector.startsWith('[')) {
      const attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)(?:="([^"]+)")?\]/);
      if (attrMatch) {
        const [, attr, val] = attrMatch;
        return this._findChild(c => val ? c.getAttribute(attr) === val : c.getAttribute(attr) !== null);
      }
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
 * Ensures a safe DOM factory in both Browser and Node.js environments.
 */
function getDocument() {
  if (typeof document !== 'undefined') {
    return document;
  }
  return {
    createElement(tag) {
      return new NodeMockElement(tag);
    },
    createElementNS(ns, tag) {
      return new NodeMockElement(tag);
    },
    createTextNode(text) {
      const node = new NodeMockElement('#text');
      node.textContent = text;
      return node;
    },
    head: new NodeMockElement('head'),
    getElementById() {
      return null;
    }
  };
}

export class ProjectCardRenderer {
  constructor() {
    this.defaultZoneColor = '#4A90FF';
    this.stylesInjected = false;
  }

  /**
   * Creates an interactive, styled project card DOM element.
   * 
   * @param {Object} projectData - Full project metadata object
   * @returns {HTMLElement} Styled card DOM element
   */
  create(projectData) {
    this._injectStyles();

    const doc = getDocument();
    const data = this._sanitizeProjectData(projectData);
    const zoneColor = data.glowColor || this.defaultZoneColor;

    // Root Card Container
    const card = doc.createElement('div');
    card.classList.add('df-project-card');
    card.setAttribute('data-project-id', data.id);
    card.style.borderColor = zoneColor;
    card.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${this._hexToRgba(zoneColor, 0.25)}`;

    // Store raw reference for parent retrieval
    card._projectData = data;
    card.dataset.project = JSON.stringify(data);

    // 1. Zone Top Color Bar (4px accent)
    const colorBar = doc.createElement('div');
    colorBar.classList.add('df-card-zone-bar');
    colorBar.style.backgroundColor = zoneColor;
    card.appendChild(colorBar);

    // 2. Header (Title + Status Badge)
    const header = doc.createElement('div');
    header.classList.add('df-card-header');

    const titleContainer = doc.createElement('div');
    titleContainer.classList.add('df-card-title-group');

    const title = doc.createElement('h3');
    title.classList.add('df-card-title');
    title.textContent = data.name;
    titleContainer.appendChild(title);

    if (data.subtitle) {
      const subtitle = doc.createElement('p');
      subtitle.classList.add('df-card-subtitle');
      subtitle.textContent = data.subtitle;
      titleContainer.appendChild(subtitle);
    }

    header.appendChild(titleContainer);

    // Status Badge
    const statusCfg = this._getStatusConfig(data.status);
    const badge = doc.createElement('span');
    badge.classList.add('df-card-status-badge');
    badge.style.color = statusCfg.color;
    badge.style.backgroundColor = statusCfg.bg;
    badge.style.borderColor = this._hexToRgba(statusCfg.color, 0.4);
    badge.innerHTML = `<span class="df-badge-icon">${statusCfg.icon}</span> ${statusCfg.label}`;
    header.appendChild(badge);

    card.appendChild(header);

    // 3. Short Description (Italics with zone glow tint)
    if (data.description) {
      const desc = doc.createElement('p');
      desc.classList.add('df-card-description');
      desc.style.color = zoneColor;
      desc.textContent = `"${data.description}"`;
      card.appendChild(desc);
    }

    // Optional Preview Image/Thumbnail
    if (data.image) {
      const imgContainer = doc.createElement('div');
      imgContainer.classList.add('df-card-image-wrap');
      const img = doc.createElement('img');
      img.classList.add('df-card-image');
      img.setAttribute('src', data.image);
      img.setAttribute('alt', `${data.name} preview`);
      imgContainer.appendChild(img);
      card.appendChild(imgContainer);
    }

    // 4. Tech Tags Pill Grid
    if (data.tech && data.tech.length > 0) {
      const techWrap = this.renderTechTags(data.tech, zoneColor);
      card.appendChild(techWrap);
    }

    // 5. Metadata Row (Duration & Collaborators)
    const metaWrap = doc.createElement('div');
    metaWrap.classList.add('df-card-metadata');

    if (data.duration) {
      const durItem = doc.createElement('div');
      durItem.classList.add('df-meta-item');
      durItem.innerHTML = `<span class="df-meta-label">Duration:</span> <span class="df-meta-value">${data.duration}</span>`;
      metaWrap.appendChild(durItem);
    }

    if (data.collaborators && data.collaborators.length > 0) {
      const collabItem = doc.createElement('div');
      collabItem.classList.add('df-meta-item');
      collabItem.innerHTML = `<span class="df-meta-label">Collaborators:</span> <span class="df-meta-value">${data.collaborators.join(', ')}</span>`;
      metaWrap.appendChild(collabItem);
    }

    if (metaWrap.children.length > 0) {
      card.appendChild(metaWrap);
    }

    // 6. Key Features Bullet List
    if (data.keyFeatures && data.keyFeatures.length > 0) {
      const featuresWrap = this.renderKeyFeatures(data.keyFeatures, zoneColor);
      card.appendChild(featuresWrap);
    }

    // 7. Action Links (GitHub, Docs, Live Demo, Paper)
    if (data.links && Object.keys(data.links).length > 0) {
      const linksWrap = this.renderActionLinks(data.links, zoneColor);
      card.appendChild(linksWrap);
    }

    // 8. Expandable Full Description Section & Toggle Button
    if (data.fullDescription) {
      const expandWrap = doc.createElement('div');
      expandWrap.classList.add('df-card-expand-section');
      expandWrap.style.display = 'none';

      const fullDescTitle = doc.createElement('h4');
      fullDescTitle.classList.add('df-expand-title');
      fullDescTitle.textContent = 'Architecture & Implementation Details';
      fullDescTitle.style.color = zoneColor;
      expandWrap.appendChild(fullDescTitle);

      const fullDescText = doc.createElement('p');
      fullDescText.classList.add('df-expand-text');
      fullDescText.textContent = data.fullDescription;
      expandWrap.appendChild(fullDescText);

      card.appendChild(expandWrap);

      // Learn More Button
      const expandBtn = doc.createElement('button');
      expandBtn.classList.add('df-card-expand-btn');
      expandBtn.setAttribute('type', 'button');
      expandBtn.innerHTML = `Learn More <span class="df-btn-arrow">▼</span>`;
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleExpanded(card);
      });
      card.appendChild(expandBtn);
    }

    return card;
  }

  /**
   * Alias for create().
   * @param {Object} projectData
   * @returns {HTMLElement}
   */
  render(projectData) {
    return this.create(projectData);
  }

  /**
   * Renders styled technology pills/tags.
   * 
   * @param {Array<string>} techArray
   * @param {string} [zoneColor]
   * @returns {HTMLElement}
   */
  renderTechTags(techArray = [], zoneColor = this.defaultZoneColor) {
    const doc = getDocument();
    const wrap = doc.createElement('div');
    wrap.classList.add('df-card-tech-group');

    const label = doc.createElement('span');
    label.classList.add('df-tech-label');
    label.textContent = 'Tech:';
    wrap.appendChild(label);

    const pillsWrap = doc.createElement('div');
    pillsWrap.classList.add('df-tech-pills');

    techArray.forEach(tech => {
      const pill = doc.createElement('span');
      pill.classList.add('df-tech-pill');
      pill.textContent = tech;
      pill.style.backgroundColor = this._hexToRgba(zoneColor, 0.18);
      pill.style.borderColor = this._hexToRgba(zoneColor, 0.45);
      pillsWrap.appendChild(pill);
    });

    wrap.appendChild(pillsWrap);
    return wrap;
  }

  /**
   * Renders styled bullet list of key project features.
   * 
   * @param {Array<string>} featuresArray
   * @param {string} [zoneColor]
   * @returns {HTMLElement}
   */
  renderKeyFeatures(featuresArray = [], zoneColor = this.defaultZoneColor) {
    const doc = getDocument();
    const wrap = doc.createElement('div');
    wrap.classList.add('df-card-features-group');

    const heading = doc.createElement('h4');
    heading.classList.add('df-features-heading');
    heading.textContent = 'Key Features:';
    wrap.appendChild(heading);

    const list = doc.createElement('ul');
    list.classList.add('df-features-list');

    featuresArray.forEach(feature => {
      const li = doc.createElement('li');
      li.classList.add('df-feature-item');
      li.style.setProperty?.('--bullet-color', zoneColor);
      li.innerHTML = `<span class="df-feature-bullet" style="color:${zoneColor}">•</span> <span>${feature}</span>`;
      li.textContent = `• ${feature}`;
      list.appendChild(li);
    });

    wrap.appendChild(list);
    return wrap;
  }

  /**
   * Renders external resource action buttons (GitHub, Docs, Live Demo, Paper).
   * 
   * @param {Object} linksObject - { github, docs, demo, paper }
   * @param {string} [zoneColor]
   * @returns {HTMLElement}
   */
  renderActionLinks(linksObject = {}, zoneColor = this.defaultZoneColor) {
    const doc = getDocument();
    const wrap = doc.createElement('div');
    wrap.classList.add('df-card-links-group');

    const linkConfigs = [
      { key: 'docs', label: 'View Docs', icon: '📄' },
      { key: 'github', label: 'GitHub', icon: '💻' },
      { key: 'demo', label: 'Live Demo', icon: '🚀' },
      { key: 'paper', label: 'Read Paper', icon: '📜' }
    ];

    linkConfigs.forEach(({ key, label, icon }) => {
      const url = linksObject[key];
      if (url && url !== '#') {
        const btn = doc.createElement('a');
        btn.classList.add('df-action-link');
        btn.setAttribute('href', url);
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
        btn.style.color = zoneColor;
        btn.style.borderColor = this._hexToRgba(zoneColor, 0.5);
        btn.style.backgroundColor = this._hexToRgba(zoneColor, 0.1);
        btn.innerHTML = `<span class="df-link-icon">${icon}</span> ${label}`;

        // Stop propagation so clicking link doesn't trigger card interaction
        btn.addEventListener('click', (e) => {
          e.stopPropagation?.();
        });

        wrap.appendChild(btn);
      }
    });

    return wrap;
  }

  /**
   * Toggles expansion state between collapsed overview and detailed description.
   * 
   * @param {HTMLElement} cardElement
   * @returns {boolean} New expansion state (true = expanded)
   */
  toggleExpanded(cardElement) {
    if (!cardElement) return false;

    const expandSection = cardElement.querySelector('.df-card-expand-section');
    const expandBtn = cardElement.querySelector('.df-card-expand-btn');
    if (!expandSection) return false;

    const isCurrentlyExpanded = cardElement.classList.contains('expanded');
    const nextState = !isCurrentlyExpanded;

    if (nextState) {
      cardElement.classList.add('expanded');
      expandSection.style.display = 'block';
      expandSection.style.opacity = '1';
      if (expandBtn) {
        expandBtn.innerHTML = `Show Less <span class="df-btn-arrow">▲</span>`;
      }
    } else {
      cardElement.classList.remove('expanded');
      expandSection.style.display = 'none';
      expandSection.style.opacity = '0';
      if (expandBtn) {
        expandBtn.innerHTML = `Learn More <span class="df-btn-arrow">▼</span>`;
      }
    }

    return nextState;
  }

  /**
   * Dynamically updates the zone accent color on an existing card or sets default.
   * 
   * @param {HTMLElement|string} cardOrColor - Card element or color hex
   * @param {string} [maybeColor] - Hex color if first arg is element
   */
  setZoneColor(cardOrColor, maybeColor) {
    let cardElement = null;
    let color = this.defaultZoneColor;

    if (typeof cardOrColor === 'string') {
      this.defaultZoneColor = cardOrColor;
      return;
    } else {
      cardElement = cardOrColor;
      color = maybeColor || this.defaultZoneColor;
    }

    if (!cardElement) return;

    cardElement.style.borderColor = color;
    cardElement.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${this._hexToRgba(color, 0.25)}`;

    const bar = cardElement.querySelector('.df-card-zone-bar');
    if (bar) bar.style.backgroundColor = color;

    const desc = cardElement.querySelector('.df-card-description');
    if (desc) desc.style.color = color;

    const bullets = cardElement.querySelectorAll('.df-feature-bullet');
    bullets.forEach(b => b.style.color = color);

    const pills = cardElement.querySelectorAll('.df-tech-pill');
    pills.forEach(p => {
      p.style.backgroundColor = this._hexToRgba(color, 0.18);
      p.style.borderColor = this._hexToRgba(color, 0.45);
    });

    const links = cardElement.querySelectorAll('.df-action-link');
    links.forEach(l => {
      l.style.color = color;
      l.style.borderColor = this._hexToRgba(color, 0.5);
      l.style.backgroundColor = this._hexToRgba(color, 0.1);
    });

    const expandTitle = cardElement.querySelector('.df-expand-title');
    if (expandTitle) expandTitle.style.color = color;
  }

  /**
   * Triggers a brief highlight/pulse glow on the card.
   * 
   * @param {HTMLElement} cardElement
   * @param {number} [duration=800]
   */
  highlightCard(cardElement, duration = 800) {
    if (!cardElement) return;

    cardElement.classList.add('highlighted');
    const origBoxShadow = cardElement.style.boxShadow;
    const zoneColor = cardElement._projectData?.glowColor || this.defaultZoneColor;

    cardElement.style.boxShadow = `0 0 35px ${this._hexToRgba(zoneColor, 0.85)}, 0 10px 30px rgba(0, 0, 0, 0.8)`;
    cardElement.style.transform = 'scale(1.02)';
    cardElement.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease';

    setTimeout(() => {
      cardElement.classList.remove('highlighted');
      cardElement.style.boxShadow = origBoxShadow;
      cardElement.style.transform = 'scale(1.0)';
    }, duration);
  }

  /**
   * Retrieves the project metadata object bound to a card element.
   * 
   * @param {HTMLElement} cardElement
   * @returns {Object|null}
   */
  getProjectData(cardElement) {
    if (!cardElement) return null;
    if (cardElement._projectData) {
      return cardElement._projectData;
    }
    if (cardElement.dataset?.project) {
      try {
        return JSON.parse(cardElement.dataset.project);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // --- Internal Sanitization & Helpers ---

  /**
   * Sanitizes input data and applies robust defaults for missing fields.
   * @private
   */
  _sanitizeProjectData(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        id: 'unknown',
        name: 'Untitled Project',
        zone: 'foundation',
        subtitle: '',
        description: 'No overview available.',
        fullDescription: '',
        tech: [],
        duration: '',
        collaborators: [],
        keyFeatures: [],
        links: {},
        status: 'in-progress',
        image: null,
        glowColor: this.defaultZoneColor
      };
    }

    // Format glowColor if numeric
    let glowColor = raw.glowColor || this.defaultZoneColor;
    if (typeof glowColor === 'number') {
      glowColor = '#' + glowColor.toString(16).padStart(6, '0');
    }

    return {
      id: raw.id || 'project_' + Date.now(),
      name: raw.name || 'Untitled Project',
      zone: raw.zone || 'foundation',
      subtitle: raw.subtitle || raw.category || '',
      description: raw.description || raw.summary || '',
      fullDescription: raw.fullDescription || raw.description || raw.summary || '',
      tech: Array.isArray(raw.tech) ? [...raw.tech] : [],
      duration: raw.duration || '',
      collaborators: Array.isArray(raw.collaborators) ? [...raw.collaborators] : [],
      keyFeatures: Array.isArray(raw.keyFeatures) ? [...raw.keyFeatures] : [],
      links: {
        github: raw.links?.github || raw.githubUrl || null,
        docs: raw.links?.docs || raw.docsUrl || null,
        demo: raw.links?.demo || raw.demoUrl || null,
        paper: raw.links?.paper || raw.paperUrl || null
      },
      status: this._normalizeStatus(raw.status),
      image: raw.image || null,
      glowColor
    };
  }

  /**
   * Normalizes status string to match canonical keys.
   * @private
   */
  _normalizeStatus(statusStr) {
    if (!statusStr) return 'in-progress';
    const s = String(statusStr).toLowerCase().replace(/[\s_]/g, '-');
    if (s.includes('complete') || s === 'done') return 'completed';
    if (s.includes('publish')) return 'published';
    return 'in-progress';
  }

  /**
   * Resolves badge color, background, and icon for project status.
   * @private
   */
  _getStatusConfig(statusKey) {
    const key = this._normalizeStatus(statusKey);
    if (key === 'completed') return PROJECT_STATUS.COMPLETED;
    if (key === 'published') return PROJECT_STATUS.PUBLISHED;
    return PROJECT_STATUS.IN_PROGRESS;
  }

  /**
   * Converts HEX color (#RRGGBB or #RGB) to RGBA CSS string.
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
   * Injects CSS stylesheet once into browser head for card presentation.
   * @private
   */
  _injectStyles() {
    if (this.stylesInjected || typeof document === 'undefined') return;

    if (document.getElementById('df-project-card-styles')) {
      this.stylesInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'df-project-card-styles';
    style.textContent = `
      .df-project-card {
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid #4a90ff;
        border-radius: 8px;
        width: 100%;
        max-width: 500px;
        box-sizing: border-box;
        padding: 24px;
        color: #ffffff;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        position: relative;
        overflow: hidden;
        animation: dfCardFadeIn 0.25s ease-out;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      @keyframes dfCardFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .df-card-zone-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
      }

      .df-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;
      }

      .df-card-title-group {
        flex: 1;
      }

      .df-card-title {
        font-family: 'Georgia', 'Cinzel', serif;
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 4px 0;
        color: #ffffff;
        line-height: 1.25;
      }

      .df-card-subtitle {
        font-size: 13px;
        color: #a0a0c0;
        margin: 0;
      }

      .df-card-status-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 12px;
        border: 1px solid;
        letter-spacing: 0.5px;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .df-card-description {
        font-style: italic;
        font-size: 14px;
        line-height: 1.45;
        margin: 10px 0 14px 0;
      }

      .df-card-image-wrap {
        margin: 12px 0;
        border-radius: 6px;
        overflow: hidden;
        max-height: 180px;
      }

      .df-card-image {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }

      .df-card-tech-group {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 12px 0;
        font-size: 13px;
      }

      .df-tech-label {
        font-weight: 600;
        color: #bbbbdd;
        white-space: nowrap;
      }

      .df-tech-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .df-tech-pill {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid;
        font-size: 12px;
        color: #ffffff;
        transition: transform 0.15s ease, filter 0.15s ease;
      }

      .df-tech-pill:hover {
        transform: translateY(-1px);
        filter: brightness(1.25);
      }

      .df-card-metadata {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #cccccc;
        margin: 10px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 0;
      }

      .df-meta-label {
        color: #8888aa;
        font-weight: 500;
      }

      .df-card-features-group {
        margin: 12px 0;
      }

      .df-features-heading {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 6px 0;
        color: #e0e0ff;
      }

      .df-features-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .df-feature-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        color: #dddddd;
        line-height: 1.4;
      }

      .df-card-links-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 16px 0 8px 0;
      }

      .df-action-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 4px;
        border: 1px solid;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .df-action-link:hover {
        filter: brightness(1.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .df-card-expand-section {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px dashed rgba(255, 255, 255, 0.15);
        animation: dfExpandIn 0.3s ease-out;
      }

      @keyframes dfExpandIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .df-expand-title {
        font-size: 14px;
        margin: 0 0 6px 0;
        font-weight: 600;
      }

      .df-expand-text {
        font-size: 13px;
        color: #cccccc;
        line-height: 1.55;
        margin: 0;
      }

      .df-card-expand-btn {
        width: 100%;
        margin-top: 12px;
        padding: 8px;
        background: transparent;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #bbbbdd;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }

      .df-card-expand-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.4);
      }

      /* Responsive adjustments */
      @media (max-width: 600px) {
        .df-project-card {
          width: 90%;
          padding: 16px;
        }
        .df-card-header {
          flex-direction: column;
        }
        .df-card-title {
          font-size: 19px;
        }
        .df-action-link {
          width: 100%;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }
}

// Export singleton instance and class
export const projectCardRenderer = new ProjectCardRenderer();
export default projectCardRenderer;
