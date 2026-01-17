import { create } from 'zustand';

interface ColliderInfo {
  type: string;
  position: { x: number; y: number; z: number };
  distance: number;
}

interface DebugState {
  // Toggle
  isEnabled: boolean;

  // Player physics state
  playerPosition: { x: number; y: number; z: number };
  playerVelocity: { x: number; y: number; z: number };
  inputDirection: { x: number; z: number };
  actualMovement: { x: number; z: number };

  // Terrain info
  terrainHeight: number;
  slopeAngle: number;
  terrainNormal: { x: number; y: number; z: number };
  canTraverse: boolean;
  isSliding: boolean;

  // Grounding
  isGrounded: boolean;
  distanceToGround: number;

  // Collision info
  nearbyColliders: ColliderInfo[];
  lastCollisionPoint: { x: number; y: number; z: number } | null;
  isBlocked: boolean;
  blockReason: string;

  // Frame timing
  lastFrameDelta: number;
  physicsStepsPerSecond: number;

  // Actions
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  updatePlayerPhysics: (data: {
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    inputDirection: { x: number; z: number };
    actualMovement: { x: number; z: number };
  }) => void;
  updateTerrainInfo: (data: {
    terrainHeight: number;
    slopeAngle: number;
    terrainNormal: { x: number; y: number; z: number };
    canTraverse: boolean;
    isSliding: boolean;
  }) => void;
  updateGrounding: (data: {
    isGrounded: boolean;
    distanceToGround: number;
  }) => void;
  updateCollisionInfo: (data: {
    nearbyColliders: ColliderInfo[];
    lastCollisionPoint?: { x: number; y: number; z: number } | null;
    isBlocked: boolean;
    blockReason: string;
  }) => void;
  updateFrameTiming: (data: {
    lastFrameDelta: number;
    physicsStepsPerSecond: number;
  }) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  // Toggle - disabled by default, press 'b' to enable
  isEnabled: false,

  // Player physics state
  playerPosition: { x: 0, y: 0, z: 0 },
  playerVelocity: { x: 0, y: 0, z: 0 },
  inputDirection: { x: 0, z: 0 },
  actualMovement: { x: 0, z: 0 },

  // Terrain info
  terrainHeight: 0,
  slopeAngle: 0,
  terrainNormal: { x: 0, y: 1, z: 0 },
  canTraverse: true,
  isSliding: false,

  // Grounding
  isGrounded: false,
  distanceToGround: 0,

  // Collision info
  nearbyColliders: [],
  lastCollisionPoint: null,
  isBlocked: false,
  blockReason: '',

  // Frame timing
  lastFrameDelta: 0,
  physicsStepsPerSecond: 0,

  // Actions
  setEnabled: (enabled): void => {
    set({ isEnabled: enabled });
  },

  toggleEnabled: (): void => {
    set((state) => ({ isEnabled: !state.isEnabled }));
  },

  updatePlayerPhysics: (data): void => {
    set({
      playerPosition: data.position,
      playerVelocity: data.velocity,
      inputDirection: data.inputDirection,
      actualMovement: data.actualMovement,
    });
  },

  updateTerrainInfo: (data): void => {
    set({
      terrainHeight: data.terrainHeight,
      slopeAngle: data.slopeAngle,
      terrainNormal: data.terrainNormal,
      canTraverse: data.canTraverse,
      isSliding: data.isSliding,
    });
  },

  updateGrounding: (data): void => {
    set({
      isGrounded: data.isGrounded,
      distanceToGround: data.distanceToGround,
    });
  },

  updateCollisionInfo: (data): void => {
    set({
      nearbyColliders: data.nearbyColliders,
      lastCollisionPoint: data.lastCollisionPoint ?? null,
      isBlocked: data.isBlocked,
      blockReason: data.blockReason,
    });
  },

  updateFrameTiming: (data): void => {
    set({
      lastFrameDelta: data.lastFrameDelta,
      physicsStepsPerSecond: data.physicsStepsPerSecond,
    });
  },
}));
