let _board;
let _currentPlayer;
let _gameOver;
let _gameStatus;

export const BOARD_SIZE = 5;

export function getBoard() { return _board; }
export function setBoard(newBoard) { _board = newBoard; }

export function getCurrentPlayer() { return _currentPlayer; }
export function setCurrentPlayer(player) { _currentPlayer = player; }

export function getGameOver() { return _gameOver; }
export function setGameOver(status) { _gameOver = status; }

export function getGameStatus() { return _gameStatus; }
export function setGameStatus(status) { _gameStatus = status; }


export function initializeGameLogic() {
    _board = new Array(BOARD_SIZE).fill(0).map(() =>
        new Array(BOARD_SIZE).fill(0).map(() =>
            new Array(BOARD_SIZE).fill(0)
        )
    );
    _currentPlayer = 1;
    _gameOver = false;
    _gameStatus = "Player 1's Turn";
}

export function addPieceLogic(x, y, z) {
    _board[x][y][z] = _currentPlayer;

    if (checkWin(x, y, z)) {
        _gameOver = true;
        _gameStatus = `Player ${_currentPlayer} Wins!`;
    } else if (checkDraw()) {
        _gameOver = true;
        _gameStatus = "It's a Draw!";
    } else {
        _currentPlayer = _currentPlayer === 1 ? 2 : 1;
        _gameStatus = `Player ${_currentPlayer}'s Turn`;
    }
}

export function checkWin(x, y, z) {
    const player = _board[x][y][z];

    const directions = [
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
        [1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1], [0, 1, 1], [0, 1, -1],
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]
    ];

    for (const [dx, dy, dz] of directions) {
        if (checkLine(x, y, z, dx, dy, dz, player)) {
            return true;
        }
    }
    return false;
}

export function checkLine(x, y, z, dx, dy, dz, player) {
    let count = 0;
    for (let i = 0; i < 4; i++) {
        const curX = x + i * dx;
        const curY = y + i * dy;
        const curZ = z + i * dz;

        if (curX >= 0 && curX < BOARD_SIZE &&
            curY >= 0 && curY < BOARD_SIZE &&
            curZ >= 0 && curZ < BOARD_SIZE &&
            _board[curX][curY][curZ] === player) {
            count++;
        } else {
            break;
        }
    }

    for (let i = 1; i < 4; i++) {
        const curX = x - i * dx;
        const curY = y - i * dy;
        const curZ = z - i * dz;

        if (curX >= 0 && curX < BOARD_SIZE &&
            curY >= 0 && curY < BOARD_SIZE &&
            curZ >= 0 && curZ < BOARD_SIZE &&
            _board[curX][curY][curZ] === player) {
            count++;
        } else {
            break;
        }
    }
    return count >= 4;
}

export function checkDraw() {
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let z = 0; z < BOARD_SIZE; z++) {
                if (_board[x][y][z] === 0) {
                    return false;
                }
            }
        }
    }
    return true;
}