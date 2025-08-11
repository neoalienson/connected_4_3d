import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { 
  getBoard, 
  getCurrentPlayer, 
  getGameOver, 
  getGameStatus, 
  BOARD_SIZE, 
  initializeGameLogic, 
  addPieceLogic 
} from './gameLogic.js';
import { BoardRenderer } from './BoardRenderer.js';
import { PieceManager } from './PieceManager.js';
import { InputHandler } from './InputHandler.js';

export class Connect4Game {
  constructor() {
    // Configuration
    this.config = {
      board: {
        size: BOARD_SIZE,
        color: 0x0000ff,
        barWidth: 0.1,
        baseHeight: 0.5
      },
      pieces: {
        radius: 0.49,
        height: 0.98,
        player1Color: 0xff0000,
        player2Color: 0xffff00,
        dropSpeed: 0.1
      },
      renderer: {
        shadowMapSize: 1024,
        initialCameraHeight: 1.5,
        initialCameraDistance: 2
      },
      colors: {
        background: 0x87ceeb,
        ambientLight: 0x404040,
        directionalLight: 0xffffff,
        hemisphereLight: 0xb1e1ff,
        boardBase: 0xffffff,
        bar: 0x808080
      }
    };

    // Game state
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = null;
    this.mouse = null;
    
    // Game components
    this.boardRenderer = null;
    this.pieceManager = null;
    this.inputHandler = null;
    
    // Animation state
    this.isDropping = false;
    this.dropTargetY = 0;
    
    // DOM elements
    this.canvas = null;
    this.statusDisplay = null;
    this.resetButton = null;
  }

  /**
   * Initialize the game
   */
  init() {
    console.log("Connect4Game.init() called.");
    
    try {
      this._setupDOMElements();
      this._setupScene();
      this._setupCamera();
      this._setupRenderer();
      this._setupLighting();
      this._setupRaycaster();
      this._setupControls();
      this._setupComponents();
      this._setupEventListeners();
      
      this.initializeGame();
      this.animate();
      
      console.log("Game initialized successfully.");
    } catch (error) {
      console.error("Error initializing game:", error);
      this._handleInitializationError(error);
    }
  }

  /**
   * Reset the game to initial state
   */
  initializeGame() {
    console.log("Connect4Game.initializeGame() called.");
    
    try {
      // Reset game logic
      initializeGameLogic();
      this.updateStatusDisplay();
      
      // Reset components
      this.pieceManager.clearPieces();
      this.boardRenderer.hideIndicator();
      
      // Create board visualization
      this.boardRenderer.createBoardVisual();
      
      // Create claw and held piece
      this.pieceManager.createClawAndHeldPiece();
      
      // Position indicator ball
      this._positionIndicatorBall();
      
      console.log("Game initialized successfully.");
    } catch (error) {
      console.error("Error initializing game:", error);
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Handle piece dropping animation
    if (this.isDropping && this.pieceManager.heldPiece) {
      this._handlePieceDrop();
    }
    
    // Update indicator ball
    this.boardRenderer.updateIndicator(this.pieceManager.clawPosition, getCurrentPlayer());
    
    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update the status display element
   */
  updateStatusDisplay() {
    if (this.statusDisplay) {
      this.statusDisplay.textContent = getGameStatus();
    }
  }

  /**
   * Handle window resize events
   */
  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    
    const size = Math.min(window.innerWidth * 0.6, 600);
    this.renderer.setSize(size, size);
  }

  /**
   * Handle piece dropping
   */
  dropPiece() {
    const clawPos = this.pieceManager.clawPosition;
    
    // Find lowest available y for the current claw position
    let targetY = -1;
    const board = getBoard();
    
    for (let i = 0; i < this.config.board.size; i++) {
      if (board[Math.floor(clawPos.x)][i][Math.floor(clawPos.z)] === 0) {
        targetY = i;
        break;
      }
    }

    if (targetY === -1) {
      // Column is full
      if (this.statusDisplay) {
        this.statusDisplay.textContent = "Column is full!";
      }
      return;
    }

    this.dropTargetY = targetY + 0.5;
    this.isDropping = true;

    // Detach heldPiece from claw for dropping animation
    this.pieceManager.preparePieceForDrop();
  }

  /**
   * Add a piece to the board at specified position
   */
  addPieceToBoard(x, y, z) {
    addPieceLogic(x, y, z);
    this.updateStatusDisplay();
  }

  // Private methods
  _setupDOMElements() {
    this.canvas = document.querySelector('#game-canvas');
    this.statusDisplay = document.getElementById('status-display');
    this.resetButton = document.getElementById('reset-button');
    
    if (!this.canvas) {
      throw new Error("Game canvas element not found");
    }
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.colors.background);
    console.log("Scene created.");
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(
      this.config.board.size / 2,
      this.config.board.size * this.config.renderer.initialCameraHeight,
      this.config.board.size * this.config.renderer.initialCameraDistance
    );
    this.camera.lookAt(
      this.config.board.size / 2,
      this.config.board.size / 2,
      this.config.board.size / 2
    );
    console.log("Camera created and positioned.");
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true 
    });
    
    const size = Math.min(window.innerWidth * 0.6, 600);
    this.renderer.setSize(size, size);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    console.log("Renderer created and sized.");
  }

  _setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(this.config.colors.ambientLight);
    this.scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(
      this.config.colors.directionalLight, 
      0.8
    );
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = this.config.renderer.shadowMapSize;
    directionalLight.shadow.mapSize.height = this.config.renderer.shadowMapSize;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
    
    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(
      this.config.colors.hemisphereLight, 
      0xb97a20, 
      0.5
    );
    this.scene.add(hemisphereLight);
  }

  _setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  _setupComponents() {
    this.boardRenderer = new BoardRenderer(this.scene, this.config);
    this.pieceManager = new PieceManager(this.scene, this.config);
    this.inputHandler = new InputHandler(this);
  }

  _setupEventListeners() {
    this.inputHandler.setupEventListeners();
  }

  _handlePieceDrop() {
    this.pieceManager.heldPiece.position.y -= this.config.pieces.dropSpeed;
    
    if (this.pieceManager.heldPiece.position.y <= this.dropTargetY) {
      this.pieceManager.heldPiece.position.y = this.dropTargetY;
      this.isDropping = false;
      
      // Add the piece to the board logic and check win/draw
      this.addPieceToBoard(
        Math.floor(this.pieceManager.clawPosition.x),
        Math.round(this.dropTargetY - 0.5),
        Math.floor(this.pieceManager.clawPosition.z)
      );
      
      // Add the dropped piece to the tracking array
      this.pieceManager.addPiece(this.pieceManager.heldPiece);
      
      // Create the next heldPiece immediately after the current one lands
      if (!getGameOver()) {
        this.pieceManager.createClawAndHeldPiece();
      }
    }
  }

  _positionIndicatorBall() {
    // Position indicator ball for the new turn
    const clawPos = this.pieceManager.clawPosition;
    let targetY = -1;
    const board = getBoard();
    
    for (let i = 0; i < this.config.board.size; i++) {
      if (board[Math.floor(clawPos.x)][i][Math.floor(clawPos.z)] === 0) {
        targetY = i;
        break;
      }
    }
    
    console.log("After piece lands, targetY for indicator:", targetY);
    console.log("After piece lands, getGameOver():", getGameOver());
    
    if (targetY !== -1) {
      this.boardRenderer.indicatorBall.position.set(
        clawPos.x + 0.5, 
        targetY + 0.5, 
        clawPos.z + 0.5
      );
      this.boardRenderer.indicatorBall.visible = true;
    } else {
      this.boardRenderer.indicatorBall.visible = false;
    }
    
    console.log("After piece lands, indicatorBall.visible:", this.boardRenderer.indicatorBall.visible);
  }

  _handleInitializationError(error) {
    if (this.statusDisplay) {
      this.statusDisplay.textContent = "Error initializing game. Please check console for details.";
    }
  }
}
