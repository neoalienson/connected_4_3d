import { getGameOver } from './gameLogic.js';

export class InputHandler {
  constructor(game) {
    this.game = game;
    this.eventListeners = [];
    
    // Touch handling variables
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchThreshold = 30; // Minimum distance for swipe detection
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
    
    // Mobile touch controls
    this._addEventListener(window, 'touchstart', (e) => this._onTouchStart(e));
    this._addEventListener(window, 'touchmove', (e) => this._onTouchMove(e));
    this._addEventListener(window, 'touchend', (e) => this._onTouchEnd(e));
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

  /**
   * Handle touch start event
   */
  _onTouchStart(e) {
    // Prevent default to avoid scrolling
    e.preventDefault();
    
    // Get the first touch point
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  /**
   * Handle touch move event
   */
  _onTouchMove(e) {
    // Prevent default to avoid scrolling
    e.preventDefault();
  }

  /**
   * Handle touch end event
   */
  _onTouchEnd(e) {
    // Prevent default to avoid scrolling
    e.preventDefault();
    
    // Check if we have a valid touch end event
    if (e.changedTouches.length === 0) return;
    
    // Get the first touch point
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    // Calculate the distance moved
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    
    // Check if this is a tap (no significant movement)
    if (Math.abs(deltaX) < this.touchThreshold && Math.abs(deltaY) < this.touchThreshold) {
      this._handleTap();
      return;
    }
    
    // Check if this is a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.touchThreshold) {
      if (deltaX > 0) {
        this._handleSwipeRight();
      } else {
        this._handleSwipeLeft();
      }
    }
  }

  /**
   * Handle tap gesture (drop piece)
   */
  _handleTap() {
    console.log("InputHandler._handleTap: Handling tap gesture");
    
    if (this.game.isDropping || getGameOver()) {
      console.log("InputHandler._handleTap: isDropping or getGameOver is true, returning.");
      return;
    }
    
    // Drop the piece (equivalent to spacebar)
    if (this.game.pieceManager.heldPiece) {
      this.game.dropPiece();
    } else {
      console.warn("No piece to drop. Waiting for next piece to be created.");
    }
  }

  /**
   * Handle swipe right gesture (move claw right)
   */
  _handleSwipeRight() {
    console.log("InputHandler._handleSwipeRight: Handling swipe right gesture");
    
    if (this.game.isDropping || getGameOver()) {
      console.log("InputHandler._handleSwipeRight: isDropping or getGameOver is true, returning.");
      return;
    }
    
    // Move claw right (equivalent to right arrow key)
    this.game.pieceManager.updateClawPosition('ArrowRight');
  }

  /**
   * Handle swipe left gesture (move claw left)
   */
  _handleSwipeLeft() {
    console.log("InputHandler._handleSwipeLeft: Handling swipe left gesture");
    
    if (this.game.isDropping || getGameOver()) {
      console.log("InputHandler._handleSwipeLeft: isDropping or getGameOver is true, returning.");
      return;
    }
    
    // Move claw left (equivalent to left arrow key)
    this.game.pieceManager.updateClawPosition('ArrowLeft');
  }
}
