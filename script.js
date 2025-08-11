import { Connect4Game } from './lib/Connect4Game.js';

// Global game instance
let game;

/**
 * Initialize the game when the DOM is fully loaded
 */
function init() {
    console.log("Main init() called.");
    
    try {
        // Create game instance
        game = new Connect4Game();
        
        // Initialize game
        game.init();
        
        console.log("Game initialized successfully.");
    } catch (error) {
        console.error("Error initializing game:", error);
        const statusDisplay = document.getElementById('status-display');
        if (statusDisplay) {
            statusDisplay.textContent = "Error initializing game. Please check console for details.";
        }
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Using a small timeout to ensure canvas is rendered
    setTimeout(init, 100);
});

// Export game instance for testing purposes
export { game };
