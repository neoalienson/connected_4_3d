import { getGameOver } from './gameLogic.js';

export class InputHandler {
  constructor(game) {
    this.game = game;
    this.eventListeners = [];
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    this._removeEventListeners(); // Clean up any existing listeners
    
    // Window resize
    this._addEventListener(window, 'resize', () => this.game.onWindowResize());
    
    // Reset button
    if (this.game.resetButton) {
      this._addEventListener(this.game.resetButton, 'click', () => this.game.initializeGame());
    }
    
    // Keyboard input
    this._addEventListener(window, 'keydown', (event) => this._onKeyDown(event));
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    this._removeEventListeners();
  }

  // Private methods
  _addEventListener(element, event, handler) {
    if (element && element.addEventListener) {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    }
  }

  _removeEventListeners() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];
  }

  _onKeyDown(event) {
    console.log("InputHandler._onKeyDown: event.key:", event.key);
    console.log("InputHandler._onKeyDown: this.game.isDropping:", this.game.isDropping);
    console.log("InputHandler._onKeyDown: getGameOver():", getGameOver());

    if (this.game.isDropping || getGameOver()) {
      console.log("InputHandler._onKeyDown: isDropping or getGameOver is true, returning.");
      return;
    }

    // Handle movement keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      this.game.pieceManager.updateClawPosition(event.key);
      return;
    }

    // Handle spacebar for dropping piece
    if (event.key === ' ') {
      event.preventDefault(); // Prevent page scrolling
      if (this.game.pieceManager.heldPiece) {
        this.game.dropPiece();
      } else {
        console.warn("No piece to drop. Waiting for next piece to be created.");
      }
    }
  }
}
