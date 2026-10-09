/**
 * Dark Forest Portfolio Game - Browser Entry Point
 */

import { initGame } from './main.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) {
    console.error('Target #game-container element not found');
    return;
  }

  try {
    const game = initGame();
    window.game = game;

    // Remove preloader once Phaser canvas is mounted
    game.events.once('ready', () => {
      const preloader = document.getElementById('initial-preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 500);
      }
    });
  } catch (err) {
    console.error('Failed to initialize game engine:', err);
    const preloader = document.getElementById('initial-preloader');
    if (preloader) {
      preloader.innerHTML = `
        <div style="color: #ff6b6b; text-align: center; font-family: sans-serif; padding: 24px;">
          <h2>Unable to launch Dark Forest</h2>
          <p style="color: #a0aec0; margin-top: 8px;">${err.message || 'Unknown initialization error'}</p>
        </div>
      `;
    }
  }
});
