import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';
import { getBoard, getCurrentPlayer, getGameOver, getGameStatus, BOARD_SIZE, initializeGameLogic, addPieceLogic } from './lib/gameLogic.js';

// Game state variables (now imported from gameLogic.js)
// Three.js variables
let scene, camera, renderer;
let raycaster;
let mouse;
let controls;
let claw; // 3D object for the claw
let heldPiece; // 3D object for the piece held by the claw
export let clawPosition = new THREE.Vector3(); // Current position of the claw
// Getter for clawPosition for testing purposes
export function getClawPosition() {
    return clawPosition;
}

// Function to update clawPosition based on movement input
export function updateClawPosition(key) {
    const moveAmount = 1;
    switch (key) {
        case 'ArrowLeft':
            clawPosition.x = Math.max(0, clawPosition.x - moveAmount);
            break;
        case 'ArrowRight':
            clawPosition.x = Math.min(BOARD_SIZE - 1, clawPosition.x + moveAmount);
            break;
        case 'ArrowUp':
            clawPosition.z = Math.max(0, clawPosition.z - moveAmount);
            break;
        case 'ArrowDown':
            clawPosition.z = Math.min(BOARD_SIZE - 1, clawPosition.z + moveAmount);
            break;
    }
}
let isDropping = false; // Flag to indicate if a piece is dropping
let dropTargetY = 0; // The target Y position for the dropping piece
let dropSpeed = 0.1; // Speed of the dropping animation

// Constants (some moved to gameLogic.js)
const PIECE_RADIUS = 0.49;
const PIECE_HEIGHT = 0.98;
const BOARD_COLOR = 0x0000ff; // Blue
const PLAYER1_COLOR = 0xff0000; // Red
const PLAYER2_COLOR = 0xffff00; // Yellow

const pieces = []; // To keep track of 3D pieces

function init() {
    console.log("init() called.");
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    console.log("Scene created.");

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(BOARD_SIZE / 2, BOARD_SIZE * 1.5, BOARD_SIZE * 2); // Position camera above and in front
    camera.lookAt(BOARD_SIZE / 2, BOARD_SIZE / 2, BOARD_SIZE / 2); // Look at the center of the board
    console.log("Camera created and positioned.");

    // Renderer setup
    console.log("Attempting to get canvas element. document.body:", document.body);
    const canvas = document.querySelector('#game-canvas'); // Try querySelector
    console.log("Canvas element:", canvas);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8); // Adjust size as needed
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log("Renderer created and sized.");

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
    document.getElementById('reset-button').addEventListener('click', initializeGame);
    window.addEventListener('keydown', onKeyDown);

    // Initialize game
    initializeGame();
    createClawAndHeldPiece(); // Create the claw and held piece after game initialization
    animate();
}

function initializeGame() {
    initializeGameLogic(); // Initialize game logic state
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
    console.log("Board base added to scene.");

    // Create the grid of rectangular tubes (holes)
    const tubeWidth = 0.99;
    const tubeHeight = BOARD_SIZE * 1.1;
    const tubeDepth = 0.99;
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
    console.log("Board tubes added to scene.");

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
    document.getElementById('status-display').textContent = getGameStatus();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
}



function onKeyDown(event) {
    if (isDropping || getGameOver()) return; // Don't move claw if piece is dropping or game is over

    // Update clawPosition based on key press
    updateClawPosition(event.key);

    switch (event.key) {
        case ' ': // Spacebar to drop the piece
            event.preventDefault(); // Prevent page scrolling
            if (heldPiece) { // Only drop if there's a piece to drop
                dropPiece();
            } else {
                console.warn("No piece to drop. Waiting for next piece to be created.");
            }
            break;
    }
    // Update claw's 3D position immediately
    claw.position.x = clawPosition.x + 0.5; // Center claw over grid cell
    claw.position.z = clawPosition.z + 0.5; // Center claw over grid cell
}

function dropPiece() {
    // Find lowest available y for the current claw position
    let targetY = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (getBoard()[Math.floor(clawPosition.x)][i][Math.floor(clawPosition.z)] === 0) {
            targetY = i;
            break;
        }
    }

    if (targetY === -1) {
        // gameStatus is set by addPieceLogic, but here we need to set it directly for column full
        // This is a UI-specific message, so it remains here.
        document.getElementById('status-display').textContent = "Column is full!";
        return; // Column is full
    }

    dropTargetY = targetY + 0.5; // Target Y in Three.js coordinates (center of cell)
    isDropping = true;

    // Detach heldPiece from claw for dropping animation
    claw.remove(heldPiece);
    // Create a clone of heldPiece to ensure it's a fresh object for the scene
    const clonedPiece = heldPiece.clone();
    // Copy position and material from original heldPiece
    clonedPiece.position.copy(heldPiece.position);
    clonedPiece.material = heldPiece.material.clone(); // Clone material to avoid shared state issues
    scene.add(clonedPiece); // Add the cloned piece to the scene
    heldPiece = clonedPiece; // Update heldPiece to refer to the cloned piece for dropping animation
    heldPiece.position.copy(claw.position); // Start piece at claw's position
    heldPiece.material.color.set(getCurrentPlayer() === 1 ? PLAYER1_COLOR : PLAYER2_COLOR); // Ensure correct color
}

function addPieceToBoard(x, y, z) {
    addPieceLogic(x, y, z); // Update game logic state
    updateStatusDisplay();

    // Prepare for next turn (handled in animate() now)
}

function addPiece(x, z) { // This function is now deprecated, replaced by dropPiece and addPieceToBoard
    console.warn("addPiece(x, z) is deprecated. Use dropPiece() and addPieceToBoard() instead.");
}

function createClawAndHeldPiece() {
    // Remove existing claw and held piece if they exist
    if (claw) {
        scene.remove(claw);
        claw = null;
    }
    // The previous heldPiece is now a permanent piece on the board, managed by the 'pieces' array.
    // No need to remove it here.

    // Create claw (simple box for now)
    // Create claw (simple box for now)
    const clawGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // A small box for the claw
    const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 }); // Grey color
    claw = new THREE.Mesh(clawGeometry, clawMaterial);
    // Initialize clawPosition to the center grid cell (e.g., 2, 2 for a 5x5 board)
    clawPosition.set(Math.floor(BOARD_SIZE / 2), 0, Math.floor(BOARD_SIZE / 2));
    // Position claw in 3D space, centered over the grid cell
    claw.position.set(clawPosition.x + 0.5, BOARD_SIZE + 1, clawPosition.z + 0.5);
    scene.add(claw);
    console.log("Claw added to scene.");

    // Create held piece
    heldPiece = null; // Ensure heldPiece is null before creating a new one
    const pieceGeometry = new THREE.SphereGeometry(PIECE_RADIUS, 32, 32);
    const pieceMaterial = new THREE.MeshPhongMaterial({ color: getCurrentPlayer() === 1 ? PLAYER1_COLOR : PLAYER2_COLOR });
    heldPiece = new THREE.Mesh(pieceGeometry, pieceMaterial);
    heldPiece.position.set(0, -0.5, 0); // Position relative to the claw (below it)
    heldPiece.material.color.set(getCurrentPlayer() === 1 ? PLAYER1_COLOR : PLAYER2_COLOR); // Set initial color
    claw.add(heldPiece); // Add heldPiece as a child of claw
    console.log("Held piece added to claw.");
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required if controls.enableDamping or controls.autoRotate are set to true
    // console.log("animate() running."); // Uncomment for debugging animation loop

    if (isDropping && heldPiece) { // Only animate if dropping and heldPiece exists
        heldPiece.position.y -= dropSpeed;
        if (heldPiece.position.y <= dropTargetY) {
            heldPiece.position.y = dropTargetY;
            isDropping = false;
            // Add the piece to the board logic and check win/draw
            addPieceToBoard(Math.floor(clawPosition.x), Math.round(dropTargetY - 0.5), Math.floor(clawPosition.z));
            pieces.push(heldPiece); // Add the dropped piece to the tracking array
            // Create the next heldPiece immediately after the current one lands
            if (!getGameOver()) { // Only create if game is not over
                createClawAndHeldPiece();
            }
        }
    }

    renderer.render(scene, camera);
}

// Start the game when the DOM is fully loaded
// Using a small timeout to ensure canvas is rendered, as DOMContentLoaded seems insufficient here.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100);
});
