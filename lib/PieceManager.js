import * as THREE from './three.module.js';
import { getCurrentPlayer } from './gameLogic.js';

export class PieceManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    
    // Game objects
    this.pieces = []; // To keep track of 3D pieces
    this.claw = null;
    this.heldPiece = null;
    this.clawPosition = new THREE.Vector3();
  }

  /**
   * Create the claw and held piece
   */
  createClawAndHeldPiece() {
    // Remove existing claw and held piece if they exist
    this._cleanupClawAndHeldPiece();

    // Create claw
    this._createClaw();

    // Create held piece
    this._createHeldPiece();
  }

  /**
   * Prepare piece for dropping animation
   */
  preparePieceForDrop() {
    if (!this.claw || !this.heldPiece) return;

    // Detach heldPiece from claw for dropping animation
    this.claw.remove(this.heldPiece);
    
    // Create a clone of heldPiece to ensure it's a fresh object for the scene
    const clonedPiece = this.heldPiece.clone();
    
    // Copy position and material from original heldPiece
    clonedPiece.position.copy(this.heldPiece.position);
    clonedPiece.material = this.heldPiece.material.clone();
    clonedPiece.castShadow = true;
    
    this.scene.add(clonedPiece);
    this.heldPiece = clonedPiece;
    
    // Start piece at claw's position
    this.heldPiece.position.copy(this.claw.position);
    
    // Ensure correct color
    const color = getCurrentPlayer() === 1 ? 
      this.config.pieces.player1Color : 
      this.config.pieces.player2Color;
    this.heldPiece.material.color.set(color);
  }

  /**
   * Update claw position based on movement input
   */
  updateClawPosition(key) {
    const moveAmount = 1;
    switch (key) {
      case 'ArrowLeft':
        this.clawPosition.x = Math.max(0, this.clawPosition.x - moveAmount);
        break;
      case 'ArrowRight':
        this.clawPosition.x = Math.min(this.config.board.size - 1, this.clawPosition.x + moveAmount);
        break;
      case 'ArrowUp':
        this.clawPosition.z = Math.max(0, this.clawPosition.z - moveAmount);
        break;
      case 'ArrowDown':
        this.clawPosition.z = Math.min(this.config.board.size - 1, this.clawPosition.z + moveAmount);
        break;
    }
    
    // Update claw's 3D position immediately
    if (this.claw) {
      this.claw.position.x = this.clawPosition.x + 0.5;
      this.claw.position.z = this.clawPosition.z + 0.5;
    }
  }

  /**
   * Clear all pieces from the board
   */
  clearPieces() {
    this.pieces.forEach(piece => {
      if (piece.geometry) piece.geometry.dispose();
      if (piece.material) piece.material.dispose();
      this.scene.remove(piece);
    });
    this.pieces.length = 0;
  }

  /**
   * Add a piece to the tracking array
   */
  addPiece(piece) {
    this.pieces.push(piece);
  }

  // Private methods
  _cleanupClawAndHeldPiece() {
    // Remove existing claw
    if (this.claw) {
      if (this.claw.geometry) this.claw.geometry.dispose();
      if (this.claw.material) this.claw.material.dispose();
      this.scene.remove(this.claw);
      this.claw = null;
    }
    
    // The previous heldPiece is now a permanent piece on the board,
    // managed by the 'pieces' array. No need to remove it here.
  }

  _createClaw() {
    const clawGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.claw = new THREE.Mesh(clawGeometry, clawMaterial);
    
    // Initialize clawPosition to the center grid cell
    this.clawPosition.set(
      Math.floor(this.config.board.size / 2), 
      0, 
      Math.floor(this.config.board.size / 2)
    );
    
    // Position claw in 3D space, centered over the grid cell
    this.claw.position.set(
      this.clawPosition.x + 0.5, 
      this.config.board.size + 1, 
      this.clawPosition.z + 0.5
    );
    
    this.scene.add(this.claw);
    console.log("Claw added to scene.");
  }

  _createHeldPiece() {
    this.heldPiece = null; // Ensure heldPiece is null before creating a new one
    
    const pieceGeometry = new THREE.SphereGeometry(
      this.config.pieces.radius, 
      32, 
      32
    );
    
    const color = getCurrentPlayer() === 1 ? 
      this.config.pieces.player1Color : 
      this.config.pieces.player2Color;
      
    const pieceMaterial = new THREE.MeshPhongMaterial({ color: color });
    this.heldPiece = new THREE.Mesh(pieceGeometry, pieceMaterial);
    
    this.heldPiece.position.set(0, -0.5, 0); // Position relative to the claw (below it)
    this.heldPiece.material.color.set(color); // Set initial color
    this.heldPiece.castShadow = true; // Enable shadow casting
    
    this.claw.add(this.heldPiece); // Add heldPiece as a child of claw
    console.log("Held piece added to claw.");
  }
}
