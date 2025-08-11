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
    
    // Mobile control buttons
    const leftBtn = document.getElementById('control-left');
    const rightBtn = document.getElementById('control-right');
    const upBtn = document.getElementById('control-up');
    const downBtn = document.getElementById('control-down');
    const spaceBtn = document.getElementById('control-space');
    
    if (leftBtn) this._addEventListener(leftBtn, 'click', () => this._handleControlClick('ArrowLeft'));
    if (rightBtn) this._addEventListener(rightBtn, 'click', () => this._handleControlClick('ArrowRight'));
    if (upBtn) this._addEventListener(upBtn, 'click', () => this._handleControlClick('ArrowUp'));
    if (downBtn) this._addEventListener(downBtn, 'click', () => this._handleControlClick('ArrowDown'));
    if (spaceBtn) this._addEventListener(spaceBtn, 'click', () => this._handleControlClick(' '));
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

  /**
   * Handle mobile control button clicks
   */
  _handleControlClick(key) {
    console.log("InputHandler._handleControlClick: Handling control click for key:", key);
    
    if (this.game.isDropping || getGameOver()) {
      console.log("InputHandler._handleControlClick: isDropping or getGameOver is true, returning.");
      return;
    }

    // Handle movement keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      this.game.pieceManager.updateClawPosition(key);
      return;
    }

    // Handle spacebar for dropping piece
    if (key === ' ') {
      if (this.game.pieceManager.heldPiece) {
        this.game.dropPiece();
      } else {
        console.warn("No piece to drop. Waiting for next piece to be created.");
      }
    }
  }
}
