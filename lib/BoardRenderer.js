import * as THREE from './three.module.js';
import { BOARD_SIZE, getBoard } from './gameLogic.js';

export class BoardRenderer {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.indicatorBall = null;
    this.boardParts = [];
  }

  /**
   * Create the 3D board visualization
   */
  createBoardVisual() {
    // Clear existing board visuals
    this._clearBoardVisuals();

    // Create bars at the 4 corners of each tube position
    this._createCornerBars();

    // Create the base of the board
    this._createBoardBase();

    // Create invisible planes for raycasting
    this._createClickablePlanes();

    // Create the indicator ball
    this._createIndicatorBall();
  }

  /**
   * Hide the indicator ball
   */
  hideIndicator() {
    if (this.indicatorBall) {
      this.indicatorBall.visible = false;
    }
  }

  /**
   * Update the indicator ball position and appearance
   */
  updateIndicator(clawPosition, currentPlayer) {
    if (!this.indicatorBall) return;

    // Calculate targetY for indicator ball
    let targetY = -1;
    const board = this._getBoardState();
    
    for (let i = 0; i < this.config.board.size; i++) {
      if (board[Math.floor(clawPosition.x)][i][Math.floor(clawPosition.z)] === 0) {
        targetY = i;
        break;
      }
    }

    if (targetY !== -1) {
      this.indicatorBall.position.set(
        clawPosition.x + 0.5, 
        targetY + 0.5, 
        clawPosition.z + 0.5
      );
      this.indicatorBall.visible = true;
      
      // Update color based on current player
      const color = currentPlayer === 1 ? 
        this.config.pieces.player1Color : 
        this.config.pieces.player2Color;
      this.indicatorBall.material.color.set(color);
    } else {
      // Column is full, hide indicator
      this.indicatorBall.visible = false;
    }

    // Flashing effect for indicator ball
    if (this.indicatorBall.visible) {
      const flashInterval = 500; // milliseconds
      const time = Date.now();
      const isBright = (Math.floor(time / flashInterval) % 2 === 0);
      this.indicatorBall.material.opacity = isBright ? 0.8 : 0.2;
    }
  }

  // Private methods
  _clearBoardVisuals() {
    // Remove existing board parts
    this.boardParts.forEach(part => {
      if (part.geometry) part.geometry.dispose();
      if (part.material) part.material.dispose();
      this.scene.remove(part);
    });
    this.boardParts = [];

    // Remove existing indicator ball
    if (this.indicatorBall) {
      if (this.indicatorBall.geometry) this.indicatorBall.geometry.dispose();
      if (this.indicatorBall.material) this.indicatorBall.material.dispose();
      this.scene.remove(this.indicatorBall);
      this.indicatorBall = null;
    }
  }

  _createCornerBars() {
    const barMaterial = new THREE.MeshPhongMaterial({ 
      color: this.config.colors.bar, 
      transparent: true, 
      opacity: 0.3, 
      depthWrite: false 
    });

    for (let x = 0; x <= this.config.board.size; x++) {
      for (let z = 0; z <= this.config.board.size; z++) {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(
            this.config.board.barWidth, 
            this.config.board.size, 
            this.config.board.barWidth
          ), 
          barMaterial
        );
        bar.position.set(x, this.config.board.size / 2, z);
        bar.userData.isBoardPart = true;
        bar.receiveShadow = true;
        this.scene.add(bar);
        this.boardParts.push(bar);
      }
    }
  }

  _createBoardBase() {
    const boardBaseGeometry = new THREE.BoxGeometry(
      this.config.board.size * 1.1, 
      this.config.board.baseHeight, 
      this.config.board.size * 1.1
    );
    const boardBaseMaterial = new THREE.MeshPhongMaterial({ 
      color: this.config.colors.boardBase 
    });
    const boardBase = new THREE.Mesh(boardBaseGeometry, boardBaseMaterial);
    boardBase.position.set(
      this.config.board.size / 2, 
      -this.config.board.baseHeight / 2, 
      this.config.board.size / 2
    );
    boardBase.userData.isBoardPart = true;
    boardBase.receiveShadow = true;
    this.scene.add(boardBase);
    this.boardParts.push(boardBase);
    console.log("Board base added to scene.");
  }

  _createClickablePlanes() {
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });

    for (let x = 0; x < this.config.board.size; x++) {
      for (let z = 0; z < this.config.board.size; z++) {
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(x + 0.5, this.config.board.size, z + 0.5);
        plane.userData.isClickablePlane = true;
        plane.userData.gridX = x;
        plane.userData.gridZ = z;
        this.scene.add(plane);
        this.boardParts.push(plane);
      }
    }
  }

  _createIndicatorBall() {
    const indicatorGeometry = new THREE.SphereGeometry(
      this.config.pieces.radius, 
      32, 
      32
    );
    const indicatorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      transparent: true 
    });
    
    this.indicatorBall = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicatorBall.visible = false;
    this.indicatorBall.castShadow = true;
    this.scene.add(this.indicatorBall);
  }

  _getBoardState() {
    return getBoard();
  }
}
