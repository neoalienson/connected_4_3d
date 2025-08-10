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
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio is 1 for square canvas
    camera.position.set(BOARD_SIZE / 2, BOARD_SIZE * 1.5, BOARD_SIZE * 2); // Position camera above and in front
    camera.lookAt(BOARD_SIZE / 2, BOARD_SIZE / 2, BOARD_SIZE / 2); // Look at the center of the board
    console.log("Camera created and positioned.");

    // Renderer setup
    console.log("Attempting to get canvas element. document.body:", document.body);
    const canvas = document.querySelector('#game-canvas'); // Try querySelector
    console.log("Canvas element:", canvas);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    const size = Math.min(window.innerWidth * 0.6, 600);
    renderer.setSize(size, size); // Adjust size as needed
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadows
    console.log("Renderer created and sized.");

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced intensity
    directionalLight.position.set(10, 20, 10); // Positioned higher and further back
    directionalLight.castShadow = true; // Enable shadow casting for the light

    // Configure shadow properties for the directional light
    directionalLight.shadow.mapSize.width = 1024; // default is 512
    directionalLight.shadow.mapSize.height = 1024; // default is 512
    directionalLight.shadow.camera.near = 0.5; // default
    directionalLight.shadow.camera.far = 50; // default
    directionalLight.shadow.camera.left = -10; // default
    directionalLight.shadow.camera.right = 10; // default
    directionalLight.shadow.camera.top = 10; // default
    directionalLight.shadow.camera.bottom = -10; // default
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.5); // Reduced intensity
    scene.add(hemisphereLight);

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
    animate();
}

function initializeGame() {
    initializeGameLogic(); // Initialize game logic state
    updateStatusDisplay();

    // Clear 3D pieces
    pieces.forEach(piece => scene.remove(piece));
    pieces.length = 0; // Clear the array

    // Hide indicator ball on reset
    if (indicatorBall) {
        indicatorBall.visible = false;
    }

    // Create 3D board (placeholder for now, will be more detailed later)
    createBoardVisual();

    createClawAndHeldPiece(); // Create the claw and held piece here

    // Set initial position and visibility of indicator ball
    let targetY = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (getBoard()[Math.floor(clawPosition.x)][i][Math.floor(clawPosition.z)] === 0) {
            targetY = i;
            break;
        }
    }
    if (targetY !== -1) {
        indicatorBall.position.set(clawPosition.x + 0.5, targetY + 0.5, clawPosition.z + 0.5);
        indicatorBall.visible = true;
    } else {
        indicatorBall.visible = false; // Hide if column is full from start
    }
}

function createBoardVisual() {
    // Clear existing board visuals if any
    scene.children = scene.children.filter(obj => !obj.userData.isBoardPart && !obj.userData.isPiece);

    // Create bars at the 4 corners of each tube position
    const barWidth = 0.1; // Thin bars
    const barHeight = BOARD_SIZE; // Height of the board
    const barMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, transparent: true, opacity: 0.3, depthWrite: false });

    for (let x = 0; x <= BOARD_SIZE; x++) { // Iterate one more time for the outer edges
        for (let z = 0; z <= BOARD_SIZE; z++) { // Iterate one more time for the outer edges
            const bar = new THREE.Mesh(new THREE.BoxGeometry(barWidth, barHeight, barWidth), barMaterial);
            bar.position.set(x, barHeight / 2, z); // Position at the grid intersection
            bar.userData.isBoardPart = true;
            bar.receiveShadow = true; // Enable shadow receiving for the bars
            scene.add(bar);
        }
    }

    // Create the base of the board
    const boardBaseGeometry = new THREE.BoxGeometry(BOARD_SIZE * 1.1, 0.5, BOARD_SIZE * 1.1);
    const boardBaseMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // White color
    const boardBase = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
    boardBase.position.set(BOARD_SIZE / 2, -0.25, BOARD_SIZE / 2); // Position below the grid
    boardBase.userData.isBoardPart = true;
    boardBase.receiveShadow = true; // Enable shadow receiving for the base
    scene.add(boardBase);
    console.log("Board base added to scene.");

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

    // Create the indicator ball (initially hidden)
    const indicatorGeometry = new THREE.SphereGeometry(PIECE_RADIUS, 32, 32);
    const indicatorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true }); // Removed metallic properties
    indicatorBall = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicatorBall.visible = false; // Start hidden
    indicatorBall.castShadow = true; // Enable shadow casting for the indicator ball
    scene.add(indicatorBall);
}

function updateStatusDisplay() {
    document.getElementById('status-display').textContent = getGameStatus();
}

function onWindowResize() {
    camera.aspect = 1; // Aspect ratio is 1 for square canvas
    camera.updateProjectionMatrix();
    const size = Math.min(window.innerWidth * 0.6, 600);
    renderer.setSize(size, size);
}



let indicatorBall; // Declare indicatorBall globally

function onKeyDown(event) {
    console.log("onKeyDown: event.key:", event.key);
    console.log("onKeyDown: isDropping:", isDropping);
    console.log("onKeyDown: getGameOver():", getGameOver());
    if (isDropping || getGameOver()) {
        console.log("onKeyDown: isDropping or getGameOver is true, returning.");
        return;
    }

    // Update clawPosition based on key press
    updateClawPosition(event.key);

    // Calculate targetY for indicator ball
    let targetY = -1;
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (getBoard()[Math.floor(clawPosition.x)][i][Math.floor(clawPosition.z)] === 0) {
            targetY = i;
            break;
        }
    }

    console.log("onKeyDown: targetY for indicator:", targetY);
    if (targetY !== -1) {
        indicatorBall.position.set(clawPosition.x + 0.5, targetY + 0.5, clawPosition.z + 0.5);
        indicatorBall.visible = true;
    } else {
        // Column is full, indicator should not be visible
        indicatorBall.visible = false; // Explicitly hide if column is full
    }
    console.log("onKeyDown: indicatorBall.visible:", indicatorBall.visible);
    console.log("onKeyDown: indicatorBall.material.opacity:", indicatorBall.material.opacity);

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
    clonedPiece.castShadow = true; // Enable shadow casting for the cloned piece
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
    const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // Bright green color for debugging
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
    heldPiece.castShadow = true; // Enable shadow casting for the held piece
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
                // Update indicator ball position and visibility for the new turn
                let targetY = -1;
                for (let i = 0; i < BOARD_SIZE; i++) {
                    if (getBoard()[Math.floor(clawPosition.x)][i][Math.floor(clawPosition.z)] === 0) {
                        targetY = i;
                        break;
                    }
                }
                console.log("Animate: After piece lands, targetY for indicator:", targetY);
                console.log("Animate: After piece lands, getGameOver():", getGameOver());
                if (targetY !== -1) {
                    indicatorBall.position.set(clawPosition.x + 0.5, targetY + 0.5, clawPosition.z + 0.5);
                    indicatorBall.visible = true;
                } else {
                    indicatorBall.visible = false; // Hide if column is full
                }
                console.log("Animate: After piece lands, indicatorBall.visible:", indicatorBall.visible);
                console.log("Animate: After piece lands, indicatorBall.material.opacity:", indicatorBall.material.opacity);
            }
        }
    }

    // Flashing effect for indicator ball
    if (indicatorBall.visible) {
        const flashInterval = 500; // milliseconds
        const time = Date.now();
        const isBright = (Math.floor(time / flashInterval) % 2 === 0);
        indicatorBall.material.opacity = isBright ? 0.8 : 0.2; // Flash between 0.8 (bright) and 0.2 (dim)

        // Update indicator color based on current player
        const currentPlayerColor = getCurrentPlayer() === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
        indicatorBall.material.color.set(currentPlayerColor);
    }

    renderer.render(scene, camera);
}

// Start the game when the DOM is fully loaded
// Using a small timeout to ensure canvas is rendered, as DOMContentLoaded seems insufficient here.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100);
});