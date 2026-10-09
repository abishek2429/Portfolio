/**
 * DialogueAnimations - UI Transitions & NPC Reactions System
 * 
 * Dark Forest Portfolio Game
 * Provides declarative animation configurations and playback controllers
 * for dialogue box entry/exit, text transitions, prompt pulses,
 * NPC head nods/reactions, and modal cross-fades.
 * Supports GSAP tweening with seamless Phaser tweens & headless fallbacks.
 */

// Helper to retrieve active GSAP instance if available
function getGSAP() {
  if (typeof gsap !== 'undefined') return gsap;
  if (typeof window !== 'undefined' && window.gsap) return window.gsap;
  return null;
}

export const DIALOGUE_ANIMATION_CONFIGS = Object.freeze({
  FADE_IN: Object.freeze({
    duration: 300,
    easing: 'power2.out',
    properties: { opacity: [0, 1], y: [-20, 0] },
    trigger: 'when dialogue starts'
  }),

  FADE_OUT: Object.freeze({
    duration: 300,
    easing: 'power2.in',
    properties: { opacity: [1, 0], y: [0, 20] },
    trigger: 'when dialogue ends'
  }),

  PULSE: Object.freeze({
    duration: 2000,
    easing: 'sine.inOut',
    properties: { glow: [0.4, 0.8, 0.4] },
    trigger: 'continuous while dialogue box open'
  }),

  TEXT_FADE_IN: Object.freeze({
    duration: 200,
    easing: 'linear',
    properties: { opacity: [0, 1] },
    trigger: 'when new dialogue block appears'
  }),

  TEXT_FADE_OUT: Object.freeze({
    duration: 150,
    easing: 'linear',
    properties: { opacity: [1, 0] },
    trigger: 'before showing next block'
  }),

  NPC_NAME_HIGHLIGHT: Object.freeze({
    duration: 1000,
    easing: 'sine.inOut',
    properties: { textShadow: ['0px', '10px', '0px'] },
    trigger: 'when dialogue starts'
  }),

  NPC_TALK_NOD: Object.freeze({
    duration: 600,
    easing: 'sine.inOut',
    properties: { scaleY: [1, 1.05, 1], rotation: [0, 2, -2, 0] },
    repeat: 3,
    trigger: 'when NPC starts speaking'
  }),

  NPC_BLINK: Object.freeze({
    duration: 100,
    easing: 'linear',
    properties: { frame: [0, 1] },
    repeatDelay: 3000,
    trigger: 'continuous during dialogue'
  }),

  NPC_HIGHLIGHT: Object.freeze({
    duration: 1000,
    easing: 'sine.inOut',
    properties: { brightness: [1.0, 1.2, 1.0] },
    repeat: -1,
    trigger: 'when dialogue starts'
  }),

  CONTINUE_PULSE: Object.freeze({
    duration: 800,
    easing: 'sine.inOut',
    properties: { opacity: [0.3, 1.0, 0.3] },
    repeat: -1,
    delay: 500,
    trigger: 'show after dialogue block displayed'
  }),

  CONTINUE_BOUNCE: Object.freeze({
    duration: 400,
    easing: 'back.out',
    properties: { y: [5, 0] },
    trigger: 'on first appearance'
  }),

  CROSS_FADE: Object.freeze({
    duration: 300,
    easing: 'power2.inOut',
    properties: { dialogueOpacity: [1, 0], modalOpacity: [0, 1] },
    trigger: 'when closing dialogue to open project modal'
  }),

  SCALE_IN: Object.freeze({
    duration: 250,
    easing: 'back.out',
    properties: { scale: [0.8, 1.0], opacity: [0, 1] },
    trigger: 'when modal first appears'
  }),

  REACTION_BOUNCE: Object.freeze({
    duration: 400,
    easing: 'bounce.out',
    properties: { y: [0, -20, 0], scaleX: [1, 1.1, 1] },
    trigger: 'on achievement unlock related to NPC'
  })
});

export class DialogueAnimations {
  constructor() {
    this.activeTweens = new Set();
    this.CONFIGS = DIALOGUE_ANIMATION_CONFIGS;
  }

  /**
   * Helper to safely track active animations and handle synchronous or asynchronous callbacks.
   * @private
   */
  _trackTween(tweenFactory, onComplete) {
    let tweenRef = null;
    let finished = false;

    const wrappedOnComplete = () => {
      finished = true;
      if (tweenRef) {
        this.activeTweens.delete(tweenRef);
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    tweenRef = tweenFactory(wrappedOnComplete);
    if (tweenRef && !finished) {
      this.activeTweens.add(tweenRef);
    }
    return tweenRef;
  }

  /**
   * Fades in dialogue box with a slight upward pan (300ms, power2.out).
   * 
   * @param {Object} element - Phaser Container or DOM Element
   * @param {Function} [onComplete] - Callback on animation end
   * @returns {Object} Active animation reference
   */
  playDialogueIn(element, onComplete = null) {
    if (!element) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.FADE_IN;
    const gsapInstance = getGSAP();

    // 1. DOM Element
    if (element instanceof (typeof HTMLElement !== 'undefined' ? HTMLElement : Object)) {
      if (element.style) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
      }
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            opacity: 1,
            y: 0,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      }
    }

    // 2. Phaser GameObject (Container, Graphics, etc.)
    if (typeof element.setAlpha === 'function') {
      element.setAlpha(0);
      const targetY = element.y;
      element.y += 20;

      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            alpha: 1,
            y: targetY,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else if (element.scene?.tweens?.add) {
        return this._trackTween(
          done => element.scene.tweens.add({
            targets: element,
            alpha: 1,
            y: targetY,
            duration: cfg.duration,
            ease: 'Sine.easeOut',
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.setAlpha(1);
        element.y = targetY;
        if (typeof onComplete === 'function') onComplete();
        return null;
      }
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Fades out dialogue box with a slight downward pan (300ms, power2.in).
   * 
   * @param {Object} element - Phaser Container or DOM Element
   * @param {Function} [onComplete] - Callback on animation end
   * @returns {Object} Active animation reference
   */
  playDialogueOut(element, onComplete = null) {
    if (!element) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.FADE_OUT;
    const gsapInstance = getGSAP();

    // 1. DOM Element
    if (element instanceof (typeof HTMLElement !== 'undefined' ? HTMLElement : Object)) {
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            opacity: 0,
            y: 20,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      }
    }

    // 2. Phaser GameObject
    if (typeof element.setAlpha === 'function') {
      const targetY = element.y + 20;

      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            alpha: 0,
            y: targetY,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else if (element.scene?.tweens?.add) {
        return this._trackTween(
          done => element.scene.tweens.add({
            targets: element,
            alpha: 0,
            y: targetY,
            duration: cfg.duration,
            ease: 'Sine.easeIn',
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.setAlpha(0);
        element.y = targetY;
        if (typeof onComplete === 'function') onComplete();
        return null;
      }
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Fades in text block (200ms, linear).
   * 
   * @param {Object} element - Text element (Phaser or DOM)
   * @param {Function} [onComplete] - Callback on animation end
   * @returns {Object} Active animation reference
   */
  playTextIn(element, onComplete = null) {
    if (!element) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.TEXT_FADE_IN;
    const gsapInstance = getGSAP();

    if (typeof element.setAlpha === 'function') {
      element.setAlpha(0);
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            alpha: 1,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else if (element.scene?.tweens?.add) {
        return this._trackTween(
          done => element.scene.tweens.add({
            targets: element,
            alpha: 1,
            duration: cfg.duration,
            ease: 'Linear',
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.setAlpha(1);
      }
    } else if (element.style) {
      element.style.opacity = '0';
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            opacity: 1,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.style.opacity = '1';
      }
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Fades out text block (150ms, linear).
   * 
   * @param {Object} element - Text element (Phaser or DOM)
   * @param {Function} [onComplete] - Callback on animation end
   * @returns {Object} Active animation reference
   */
  playTextOut(element, onComplete = null) {
    if (!element) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.TEXT_FADE_OUT;
    const gsapInstance = getGSAP();

    if (typeof element.setAlpha === 'function') {
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            alpha: 0,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else if (element.scene?.tweens?.add) {
        return this._trackTween(
          done => element.scene.tweens.add({
            targets: element,
            alpha: 0,
            duration: cfg.duration,
            ease: 'Linear',
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.setAlpha(0);
      }
    } else if (element.style) {
      if (gsapInstance) {
        return this._trackTween(
          done => gsapInstance.to(element, {
            opacity: 0,
            duration: cfg.duration / 1000,
            ease: cfg.easing,
            onComplete: done
          }),
          onComplete
        );
      } else {
        element.style.opacity = '0';
      }
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Performs subtle NPC head nod and tilt animation when speaking (600ms, repeats 3x).
   * 
   * @param {Object} sprite - NPC Sprite
   * @param {Function} [onComplete] - Callback on animation end
   * @returns {Object} Active animation reference
   */
  playNpcTalk(sprite, onComplete = null) {
    if (!sprite) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.NPC_TALK_NOD;
    const gsapInstance = getGSAP();

    if (gsapInstance) {
      return this._trackTween(
        done => {
          const tl = gsapInstance.timeline({
            repeat: cfg.repeat - 1,
            onComplete: done
          });
          tl.to(sprite, {
            scaleY: 1.05,
            rotation: 0.035, // ~2 degrees
            duration: (cfg.duration / 1000) / 2,
            ease: cfg.easing
          }).to(sprite, {
            scaleY: 1.0,
            rotation: 0,
            duration: (cfg.duration / 1000) / 2,
            ease: cfg.easing
          });
          return tl;
        },
        onComplete
      );
    } else if (sprite.scene?.tweens?.add) {
      return this._trackTween(
        done => sprite.scene.tweens.add({
          targets: sprite,
          scaleY: 1.05,
          angle: 2,
          duration: cfg.duration / 2,
          yoyo: true,
          repeat: cfg.repeat - 1,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (typeof sprite.setScale === 'function') sprite.setScale(1);
            if (typeof sprite.setAngle === 'function') sprite.setAngle(0);
            done();
          }
        }),
        onComplete
      );
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Continuously pulses the "Press E to continue" indicator (800ms, sine.inOut, infinite).
   * 
   * @param {Object} element - Prompt text element
   * @returns {Object} Active looping animation reference
   */
  playContinuePulse(element) {
    if (!element) return null;

    const cfg = DIALOGUE_ANIMATION_CONFIGS.CONTINUE_PULSE;
    const gsapInstance = getGSAP();

    if (gsapInstance) {
      const tween = gsapInstance.to(element, {
        opacity: 1.0,
        duration: cfg.duration / 1000,
        ease: cfg.easing,
        repeat: -1,
        yoyo: true,
        delay: cfg.delay / 1000
      });
      this.activeTweens.add(tween);
      return tween;
    } else if (element.scene?.tweens?.add) {
      if (typeof element.setAlpha === 'function') {
        element.setAlpha(0.3);
      }
      const tween = element.scene.tweens.add({
        targets: element,
        alpha: 1.0,
        duration: cfg.duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: cfg.delay
      });
      this.activeTweens.add(tween);
      return tween;
    }

    return null;
  }

  /**
   * Cross-fades dialogue panel out while fading project modal in simultaneously (300ms).
   * 
   * @param {Object} dialogueEl - Dialogue panel
   * @param {Object} modalEl - Project modal container
   * @param {Function} [onComplete] - Callback on transition end
   * @returns {Object} Active animation reference
   */
  playModalTransition(dialogueEl, modalEl, onComplete = null) {
    const cfg = DIALOGUE_ANIMATION_CONFIGS.CROSS_FADE;
    const gsapInstance = getGSAP();

    if (gsapInstance) {
      return this._trackTween(
        done => {
          const tl = gsapInstance.timeline({ onComplete: done });
          if (dialogueEl) {
            tl.to(dialogueEl, { opacity: 0, duration: cfg.duration / 1000, ease: cfg.easing }, 0);
          }
          if (modalEl) {
            tl.fromTo(modalEl, { opacity: 0 }, { opacity: 1, duration: cfg.duration / 1000, ease: cfg.easing }, 0);
          }
          return tl;
        },
        onComplete
      );
    } else {
      if (dialogueEl) {
        if (typeof dialogueEl.setAlpha === 'function') dialogueEl.setAlpha(0);
        else if (dialogueEl.style) dialogueEl.style.opacity = '0';
      }
      if (modalEl) {
        if (typeof modalEl.setAlpha === 'function') modalEl.setAlpha(1);
        else if (modalEl.style) modalEl.style.opacity = '1';
      }
      if (typeof onComplete === 'function') onComplete();
      return null;
    }
  }

  /**
   * Plays a celebratory bounce reaction on NPC (400ms, bounce.out).
   * 
   * @param {Object} sprite - NPC sprite
   * @param {Function} [onComplete] - Callback on reaction end
   * @returns {Object} Active animation reference
   */
  playReactionBounce(sprite, onComplete = null) {
    if (!sprite) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const cfg = DIALOGUE_ANIMATION_CONFIGS.REACTION_BOUNCE;
    const gsapInstance = getGSAP();
    const originalY = sprite.y || 0;

    if (gsapInstance) {
      return this._trackTween(
        done => {
          const tl = gsapInstance.timeline({ onComplete: done });
          tl.to(sprite, {
            y: originalY - 20,
            scaleX: 1.1,
            duration: (cfg.duration / 1000) / 2,
            ease: 'power1.out'
          }).to(sprite, {
            y: originalY,
            scaleX: 1.0,
            duration: (cfg.duration / 1000) / 2,
            ease: cfg.easing
          });
          return tl;
        },
        onComplete
      );
    } else if (sprite.scene?.tweens?.add) {
      return this._trackTween(
        done => sprite.scene.tweens.add({
          targets: sprite,
          y: originalY - 20,
          scaleX: 1.1,
          duration: cfg.duration / 2,
          yoyo: true,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            sprite.y = originalY;
            if (typeof sprite.setScale === 'function') sprite.setScale(1);
            done();
          }
        }),
        onComplete
      );
    }

    if (typeof onComplete === 'function') onComplete();
    return null;
  }

  /**
   * Cancels and cleans up all running animations.
   */
  stopAllAnimations() {
    const gsapInstance = getGSAP();

    for (const tween of this.activeTweens) {
      if (gsapInstance && typeof tween.kill === 'function') {
        tween.kill();
      } else if (typeof tween.stop === 'function') {
        tween.stop();
      }
    }

    this.activeTweens.clear();
  }
}

// Global Singleton Export
export const dialogueAnimations = new DialogueAnimations();
export default dialogueAnimations;
