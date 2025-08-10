import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';

// Game state variables
let board;
let currentPlayer;
let gameOver;
let gameStatus;

// Three.js variables
let scene, camera, renderer;
let raycaster;
let mouse;
let controls; // Declare controls variable

// Constants
const BOARD_SIZE = 5;
const PIECE_RADIUS = 0.4;
const PIECE_HEIGHT = 0.8;
const BOARD_COLOR = 0x0000ff; // Blue
const PLAYER1_COLOR = 0xff0000; // Red
const PLAYER2_COLOR = 0xffff00; // Yellow

const pieces = []; // To keep track of 3D pieces

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(BOARD_SIZE / 2, BOARD_SIZE * 1.5, BOARD_SIZE * 2); // Position camera above and in front
    camera.lookAt(BOARD_SIZE / 2, BOARD_SIZE / 2, BOARD_SIZE / 2); // Look at the center of the board

    // Renderer setup
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8); // Adjust size as needed
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // OrbitControls for camera interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when damping is enabled
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the board

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    canvas.addEventListener('click', onClick);
    document.getElementById('reset-button').addEventListener('click', initializeGame);

    // Initialize game
    initializeGame();
    animate();
}

function initializeGame() {
    // Reset board
    board = new Array(BOARD_SIZE).fill(0).map(() =>
        new Array(BOARD_SIZE).fill(0).map(() =>
            new Array(BOARD_SIZE).fill(0)
        )
    );

    currentPlayer = 1;
    gameOver = false;
    gameStatus = "Player 1's Turn";
    updateStatusDisplay();

    // Clear 3D pieces
    pieces.forEach(piece => scene.remove(piece));
    pieces.length = 0; // Clear the array

    // Create 3D board (placeholder for now, will be more detailed later)
    createBoardVisual();
}

function createBoardVisual() {
    // Clear existing board visuals if any
    scene.children = scene.children.filter(obj => !obj.userData.isBoardPart && !obj.userData.isPiece);

    // Create the base of the board
    const boardBaseGeometry = new THREE.BoxGeometry(BOARD_SIZE * 1.1, 0.5, BOARD_SIZE * 1.1);
    const boardBaseMaterial = new THREE.MeshPhongMaterial({ color: BOARD_COLOR });
    const boardBase = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
    boardBase.position.set(BOARD_SIZE / 2 - 0.5, -0.25, BOARD_SIZE / 2 - 0.5); // Position below the grid
    boardBase.userData.isBoardPart = true;
    scene.add(boardBase);

    // Create the grid of rectangular tubes (holes)
    const tubeWidth = PIECE_RADIUS * 2 * 1.1; // Slightly larger than piece diameter
    const tubeHeight = BOARD_SIZE * 1.1;
    const tubeDepth = PIECE_RADIUS * 2 * 1.1;
    const tubeGeometry = new THREE.BoxGeometry(tubeWidth, tubeHeight, tubeDepth);
    const tubeMaterial = new THREE.MeshPhongMaterial({ color: BOARD_COLOR, transparent: true, opacity: 0.3 });

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let z = 0; z < BOARD_SIZE; z++) {
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.position.set(x + 0.5, tubeHeight / 2 - 0.25, z + 0.5); // Position tubes to form holes
            tube.userData.isBoardPart = true;
            scene.add(tube);
        }
    }

    // Create invisible planes for raycasting to detect clicks on the top of columns
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let z = 0; z < BOARD_SIZE; z++) {
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            plane.position.set(x + 0.5, BOARD_SIZE, z + 0.5); // Position at the top of the grid
            plane.userData.isClickablePlane = true; // Custom property to identify for raycasting
            plane.userData.gridX = x;
            plane.userData.gridZ = z;
            scene.add(plane);
        }
    }
}

function updateStatusDisplay() {
    document.getElementById('status-display').textContent = gameStatus;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
}

function onClick(event) {
    if (gameOver) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children);

    // Find the first clickable plane intersected
    const clickablePlaneIntersection = intersects.find(intersect => intersect.object.userData.isClickablePlane);

    if (clickablePlaneIntersection) {
        const x = clickablePlaneIntersection.object.userData.gridX;
        const z = clickablePlaneIntersection.object.userData.gridZ;
        console.log(`Clicked on grid cell: (${x}, ${z})`);
        addPiece(x, z);
    } else {
        console.log("No clickable plane intersected.");
    }
}

function addPiece(x, z) {
    // Find lowest available y
    let y = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[x][i][z] === 0) {
            y = i;
            break;
        }
    }

    if (y === -1) {
        gameStatus = "Column is full!";
        updateStatusDisplay();
        return; // Column is full
    }

    board[x][y][z] = currentPlayer;

    // Add 3D piece visual
    const pieceGeometry = new THREE.SphereGeometry(PIECE_RADIUS, 32, 32);
    const pieceMaterial = new THREE.MeshPhongMaterial({ color: currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR });
    const piece = new THREE.Mesh(pieceGeometry, pieceMaterial);

    // Position the piece correctly in 3D space
    // Adjust position based on board coordinates (0-4) to Three.js coordinates
    piece.position.set(x + 0.5, y + 0.5, z + 0.5); // Center piece in cell
    scene.add(piece);
    pieces.push(piece);

    // Check win/draw conditions (placeholder calls)
    if (checkWin(x, y, z)) {
        gameOver = true;
        gameStatus = `Player ${currentPlayer} Wins!`;
    } else if (checkDraw()) {
        gameOver = true;
        gameStatus = "It's a Draw!";
    } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        gameStatus = `Player ${currentPlayer}'s Turn`;
    }
    updateStatusDisplay();
}

// Placeholder for win/draw checks (will implement fully later)
function checkWin(x, y, z) {
    const player = board[x][y][z];

    // Define all 13 possible 3D directions
    const directions = [
        // Axial directions
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
        // Planar diagonal directions
        [1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1], [0, 1, 1], [0, 1, -1],
        // Space diagonal directions
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]
    ];

    for (const [dx, dy, dz] of directions) {
        if (checkLine(x, y, z, dx, dy, dz, player)) {
            return true;
        }
    }
    return false;
}

function checkLine(x, y, z, dx, dy, dz, player) {
    let count = 0;
    // Check in positive direction
    for (let i = 0; i < 4; i++) {
        const curX = x + i * dx;
        const curY = y + i * dy;
        const curZ = z + i * dz;

        if (curX >= 0 && curX < BOARD_SIZE &&
            curY >= 0 && curY < BOARD_SIZE &&
            curZ >= 0 && curZ < BOARD_SIZE &&
            board[curX][curY][curZ] === player) {
            count++;
        } else {
            break;
        }
    }

    // Check in negative direction (excluding the starting piece, as it's already counted)
    for (let i = 1; i < 4; i++) {
        const curX = x - i * dx;
        const curY = y - i * dy;
        const curZ = z - i * dz;

        if (curX >= 0 && curX < BOARD_SIZE &&
            curY >= 0 && curY < BOARD_SIZE &&
            curZ >= 0 && curZ < BOARD_SIZE &&
            board[curX][curY][curZ] === player) {
            count++;
        } else {
            break;
        }
    }
    return count >= 4;
}

function checkDraw() {
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let z = 0; z < BOARD_SIZE; z++) {
                if (board[x][y][z] === 0) {
                    return false; // Found an empty cell, not a draw
                }
            }
        }
    }
    return true; // All cells are filled, it's a draw
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}

// Start the game when the window loads
window.addEventListener('load', init);
