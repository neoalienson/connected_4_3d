import { getBoard, setBoard as setGameLogicBoard, getCurrentPlayer, setCurrentPlayer, getGameOver, setGameOver, getGameStatus, setGameStatus, BOARD_SIZE, initializeGameLogic, addPieceLogic, checkWin, checkDraw } from '../lib/gameLogic.js';

// Simple Test Runner
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(error);
    }
}

// Helper to set board state for tests
function setBoard(newBoard) {
    // Create a fresh board array to set
    const tempBoard = new Array(BOARD_SIZE).fill(0).map(() =>
        new Array(BOARD_SIZE).fill(0).map(() =>
            new Array(BOARD_SIZE).fill(0)
        )
    );

    // Populate the tempBoard with provided values
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let z = 0; z < BOARD_SIZE; z++) {
                if (newBoard[x] && newBoard[x][y] && newBoard[x][y][z] !== undefined) {
                    tempBoard[x][y][z] = newBoard[x][y][z];
                }
            }
        }
    }
    setGameLogicBoard(tempBoard); // Set the game logic's board
}

// Unit Tests for Game Logic
test('initializeGameLogic resets board and game state', () => {
    initializeGameLogic();
    if (getBoard().some(dim1 => dim1.some(dim2 => dim2.some(cell => cell !== 0)))) {
        throw new Error('Board not empty after initialization');
    }
    if (getCurrentPlayer() !== 1) {
        throw new Error('currentPlayer not reset to 1');
    }
    if (getGameOver() !== false) {
        throw new Error('gameOver not reset to false');
    }
    if (getGameStatus() !== "Player 1's Turn") {
        throw new Error('gameStatus not reset');
    }
});

test('addPieceLogic places piece and switches player', () => {
    initializeGameLogic();
    addPieceLogic(0, 0, 0); // Player 1 places
    if (getBoard()[0][0][0] !== 1) {
        throw new Error('Piece not placed correctly by Player 1');
    }
    if (getCurrentPlayer() !== 2) {
        throw new Error('Player not switched to 2');
    }
    addPieceLogic(0, 1, 0); // Player 2 places
    if (getBoard()[0][1][0] !== 2) {
        throw new Error('Piece not placed correctly by Player 2');
    }
    if (getCurrentPlayer() !== 1) {
        throw new Error('Player not switched to 1');
    }
});

test('checkWin detects win in X-axis', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[1][0][0] = 1;
    getBoard()[2][0][0] = 1;
    getBoard()[3][0][0] = 1;
    setCurrentPlayer(1); // Set current player to 1 for win check
    if (!checkWin(3, 0, 0)) { // Check from the last placed piece
        throw new Error('Did not detect X-axis win');
    }
});

test('checkWin detects win in Y-axis', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[0][1][0] = 1;
    getBoard()[0][2][0] = 1;
    getBoard()[0][3][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(0, 3, 0)) {
        throw new Error('Did not detect Y-axis win');
    }
});

test('checkWin detects win in Z-axis', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[0][0][1] = 1;
    getBoard()[0][0][2] = 1;
    getBoard()[0][0][3] = 1;
    setCurrentPlayer(1);
    if (!checkWin(0, 0, 3)) {
        throw new Error('Did not detect Z-axis win');
    }
});

test('checkWin detects win in XY-plane diagonal (positive)', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[1][1][0] = 1;
    getBoard()[2][2][0] = 1;
    getBoard()[3][3][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 3, 0)) {
        throw new Error('Did not detect XY-plane diagonal win (positive)');
    }
});

test('checkWin detects win in XY-plane diagonal (negative)', () => {
    initializeGameLogic();
    getBoard()[0][3][0] = 1;
    getBoard()[1][2][0] = 1;
    getBoard()[2][1][0] = 1;
    getBoard()[3][0][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 0, 0)) {
        throw new Error('Did not detect XY-plane diagonal win (negative)');
    }
});

test('checkWin detects win in XZ-plane diagonal (positive)', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[1][0][1] = 1;
    getBoard()[2][0][2] = 1;
    getBoard()[3][0][3] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 0, 3)) {
        throw new Error('Did not detect XZ-plane diagonal win (positive)');
    }
});

test('checkWin detects win in XZ-plane diagonal (negative)', () => {
    initializeGameLogic();
    getBoard()[0][0][3] = 1;
    getBoard()[1][0][2] = 1;
    getBoard()[2][0][1] = 1;
    getBoard()[3][0][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 0, 0)) {
        throw new Error('Did not detect XZ-plane diagonal win (negative)');
    }
});

test('checkWin detects win in YZ-plane diagonal (positive)', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[0][1][1] = 1;
    getBoard()[0][2][2] = 1;
    getBoard()[0][3][3] = 1;
    setCurrentPlayer(1);
    if (!checkWin(0, 3, 3)) {
        throw new Error('Did not detect YZ-plane diagonal win (positive)');
    }
});

test('checkWin detects win in YZ-plane diagonal (negative)', () => {
    initializeGameLogic();
    getBoard()[0][0][3] = 1;
    getBoard()[0][1][2] = 1;
    getBoard()[0][2][1] = 1;
    getBoard()[0][3][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(0, 3, 0)) {
        throw new Error('Did not detect YZ-plane diagonal win (negative)');
    }
});

test('checkWin detects win in Space diagonal (1,1,1)', () => {
    initializeGameLogic();
    getBoard()[0][0][0] = 1;
    getBoard()[1][1][1] = 1;
    getBoard()[2][2][2] = 1;
    getBoard()[3][3][3] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 3, 3)) {
        throw new Error('Did not detect Space diagonal win (1,1,1)');
    }
});

test('checkWin detects win in Space diagonal (1,1,-1)', () => {
    initializeGameLogic();
    getBoard()[0][0][3] = 1;
    getBoard()[1][1][2] = 1;
    getBoard()[2][2][1] = 1;
    getBoard()[3][3][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 3, 0)) {
        throw new Error('Did not detect Space diagonal win (1,1,-1)');
    }
});

test('checkWin detects win in Space diagonal (1,-1,1)', () => {
    initializeGameLogic();
    getBoard()[0][3][0] = 1;
    getBoard()[1][2][1] = 1;
    getBoard()[2][1][2] = 1;
    getBoard()[3][0][3] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 0, 3)) {
        throw new Error('Did not detect Space diagonal win (1,-1,1)');
    }
});

test('checkWin detects win in Space diagonal (1,-1,-1)', () => {
    initializeGameLogic();
    getBoard()[0][3][3] = 1;
    getBoard()[1][2][2] = 1;
    getBoard()[2][1][1] = 1;
    getBoard()[3][0][0] = 1;
    setCurrentPlayer(1);
    if (!checkWin(3, 0, 0)) {
        throw new Error('Did not detect Space diagonal win (1,-1,-1)');
    }
});

test('checkDraw detects draw when board is full', () => {
    initializeGameLogic();
    // Fill the board with alternating pieces
    const currentBoard = getBoard(); // Get the current board reference
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let z = 0; z < BOARD_SIZE; z++) {
                currentBoard[x][y][z] = (x + y + z) % 2 === 0 ? 1 : 2;
            }
        }
    }
    if (!checkDraw()) {
        throw new Error('Did not detect draw when board is full');
    }
});

test('checkDraw does not detect draw when board is not full', () => {
    initializeGameLogic();
    // Fill most of the board, leave one cell empty
    const currentBoard = getBoard(); // Get the current board reference
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let z = 0; z < BOARD_SIZE; z++) {
                currentBoard[x][y][z] = (x + y + z) % 2 === 0 ? 1 : 2;
            }
        }
    }
    currentBoard[0][0][0] = 0; // Empty one cell
    if (checkDraw()) {
        throw new Error('Detected draw when board is not full');
    }
});
