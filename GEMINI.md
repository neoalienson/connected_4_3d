# Connected 4 in 3D: Technical Approach and Game Logic

This document outlines the conceptual approach for building a 3D Connected 4 game for web browsers, focusing on a pure web-only implementation using JavaScript and Three.js for rendering.

## Part 1: Technical Approach (Web-Only with Three.js)

The game will be a single-page web application built with HTML, CSS, and JavaScript. Three.js will be used for all 3D rendering.

**Proposed Architecture:**

1.  **HTML Structure (`index.html`):**
    *   Will contain the canvas element for Three.js rendering.
    *   Will include basic UI elements for game status and controls (e.g., a reset button).

2.  **Styling (`style.css`):**
    *   Will provide basic styling for the HTML elements and the canvas.

3.  **Game Logic and 3D Rendering (`script.js`):**
    *   This single JavaScript file will encapsulate both the core game logic and the Three.js rendering.
    *   **Three.js Setup:** Initialize the 3D scene, camera, and WebGL renderer.
    *   **3D Board and Pieces:** Create the 5x5x5 grid visually using Three.js geometries (e.g., cylinders for the board holes, spheres for the pieces).
    *   **User Interaction:** Implement mouse event listeners and Three.js raycasting to detect user clicks on the 3D board, translating screen coordinates to 3D grid positions.
    *   **Game State Visualization:** Update the 3D scene to reflect the current game state (e.g., adding a new piece, clearing the board).

**Workflow Example:**

1.  **Web Page Loads:** `index.html` loads, `style.css` applies styling, and `script.js` executes.
2.  **Three.js Scene Initialization:** `script.js` sets up the Three.js scene, renders the empty 3D grid, and sets up event listeners.
3.  **User Clicks on 3D Board:** A mouse click event is detected.
4.  **Raycasting:** Three.js performs a raycast from the click position into the 3D scene to determine which grid cell (x, z) was targeted.
5.  **Game Logic Processing:** The JavaScript game logic receives the (x, z) coordinates, determines the `y` (vertical) position for the piece, updates its internal board state, and checks for win/draw conditions.
6.  **3D Scene Update:** The JavaScript code instructs Three.js to add a new 3D piece at the calculated (x, y, z) coordinates with the current player's color.
7.  **Game Status Update:** The HTML UI is updated to reflect the current game status (e.g., next player's turn, win/draw message).

## Part 2: Core Game Logic (JavaScript)

The core game logic for Connected 4 in 3D will be implemented in JavaScript. This logic manages the game state, player turns, piece placement rules, and win/draw conditions.

The following outlines the current implementation of the core game logic:

### 1. Game Board Representation

The 3D game board is represented as a 3-dimensional array of integers:

```javascript
let board; // Will be initialized as new Array(5).fill(0).map(() => new Array(5).fill(0).map(() => new Array(5).fill(0)));
```

*   `board[x][y][z]` represents a cell in the 5x5x5 cube.
*   `x`, `y`, `z` range from 0 to 4.
*   `0`: Represents an empty cell.
*   `1`: Represents a piece placed by Player 1 (e.g., Red).
*   `2`: Represents a piece placed by Player 2 (e.g., Yellow).

### 2. Game State Management

The game state is managed by several variables:

*   `let currentPlayer = 1;`: Tracks whose turn it is (1 or 2).
*   `let gameOver = false;`: Indicates if the game has ended (win or draw).
*   `let gameStatus = "Player 1's Turn";`: A string to display the current game status (e.g., "Player 1's Turn", "Player 2 Wins!", "It's a Draw!").

### 3. Game Initialization (`initializeGame()`)

This method sets up a new game:

*   Resets the `board` to all zeros (empty).
*   Sets `currentPlayer` back to 1.
*   Sets `gameOver` to `false`.
*   Updates `gameStatus` to "Player 1's Turn".
*   Clears the 3D scene of all existing pieces.

### 4. Piece Placement Logic (`addPiece(x, z)`))

This method handles placing a piece in the game:

*   **Input:** Takes `x` (column) and `z` (depth) coordinates from user input.
*   **Game Over Check:** If `gameOver` is true, the method returns immediately.
*   **Find Lowest Available `y`:** It iterates from the bottom (`y=0`) upwards to find the first empty cell (`board[x][i][z] == 0`) in the selected column (`x`, `z`). This simulates gravity.
*   **Place Piece:** If an empty `y` position is found:
    *   The `board` is updated with the `currentPlayer`'s value at `board[x][y][z]`.
    *   A new 3D piece is added to the Three.js scene at the calculated `(x, y, z)` coordinates with the current player's color.
*   **Check Win/Draw Conditions:** After placing a piece, it calls `checkWin()` and `checkDraw()` to determine the next game state.
*   **Update Game Status:** Updates `gameStatus` based on the outcome (win, draw, or next player's turn).
*   **Switch Player:** If the game is not over, `currentPlayer` is switched to the other player.

### 5. Win Condition Check (`checkWin(x, y, z)`) 

This is the most complex part of the game logic. It checks for 4 consecutive pieces of the `currentPlayer`'s color in any of the 13 possible 3D directions, starting from the newly placed piece at `(x, y, z)`.

The 13 directions are:

*   **3 Axial Directions:**
    *   X-axis: `(1, 0, 0)`
    *   Y-axis: `(0, 1, 0)`
    *   Z-axis: `(0, 0, 1)`
*   **6 Planar Diagonal Directions:**
    *   XY-plane: `(1, 1, 0)`, `(1, -1, 0)`
    *   XZ-plane: `(1, 0, 1)`, `(1, 0, -1)`
    *   YZ-plane: `(0, 1, 1)`, `(0, 1, -1)`
*   **4 Space Diagonal Directions:**
    *   ` (1, 1, 1)`
    *   ` (1, 1, -1)`
    *   ` (1, -1, 1)`
    *   ` (1, -1, -1)`

The `checkWin` method calls `checkLine` for each of these directions.

### 6. Line Check (`checkLine(x, y, z, dx, dy, dz)`) 

This helper method checks for a win in a specific direction (`dx`, `dy`, `dz`) starting from a given `(x, y, z)` coordinate:

*   It iterates along the line defined by the starting point and direction, checking up to 4 positions in both positive and negative directions from the starting point.
*   It counts consecutive pieces of the `currentPlayer`'s color.
*   If 4 or more consecutive pieces are found, it returns `true` (win).
*   It handles boundary conditions (ensuring `curX`, `curY`, `curZ` stay within the 0-4 range).

### 7. Draw Condition Check (`checkDraw()`) 

This method determines if the game is a draw:

*   It iterates through every cell on the `board`.
*   If it finds any empty cell (`0`), it means the board is not full, and thus it's not a draw, returning `false`.
*   If all cells are filled (no `0` found), it returns `true` (draw).

This detailed outline provides a clear understanding of the game's structure and logic, which will be implemented using JavaScript and Three.js.