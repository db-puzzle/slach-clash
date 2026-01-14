import type { Vector3 as ThreeVector3 } from 'three';

// Re-export for convenience
export type Vector3 = ThreeVector3;

// ============================================
// PLAYER TYPES
// ============================================

export interface PlayerState {
    id: string;
    name: string;
    teamId: number;
    position: { x: number; y: number; z: number };
    rotation: number;
    velocity: { x: number; y: number; z: number };
    health: number;
    stamina: number;
    currentWeaponSlot: WeaponSlot;
    weapons: WeaponInventory;
    arrows: number;
    bombs: number;
    isBlocking: boolean;
    isSprinting: boolean;
    isEliminated: boolean;
    lastAttackTime: number;
    staggerEndTime: number;
}

// ============================================
// WEAPON TYPES
// ============================================

export type WeaponSlot = 'sword' | 'spear' | 'club' | 'bow' | 'shield' | 'bomb';

export interface WeaponState {
    type: WeaponSlot;
    durability: number;
    maxDurability: number;
    isBroken: boolean;
}

export type WeaponInventory = {
    [K in WeaponSlot]: WeaponState | null;
};

export interface WeaponStats {
    type: WeaponSlot;
    damage: number;
    staminaCost: number;
    attackSpeed: number;
    range: number;
    durability: number;
    canBlock: boolean;
    blockEffectiveness: Partial<Record<WeaponSlot, 'full' | 'partial' | 'none'>>;
}

// ============================================
// COMBAT TYPES
// ============================================

export interface AttackEvent {
    attackerId: string;
    weaponType: WeaponSlot;
    position: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    timestamp: number;
}

export interface DamageEvent {
    targetId: string;
    attackerId: string;
    damage: number;
    wasBlocked: boolean;
    wasPartialBlock: boolean;
    causedStagger: boolean;
}

// ============================================
// GAME STATE TYPES
// ============================================

export type GamePhase = 'menu' | 'lobby' | 'playing' | 'spectating' | 'ended';

export interface Projectile {
    id: string;
    type: 'arrow' | 'bomb';
    ownerId: string;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    createdAt: number;
    detonated?: boolean;
}

export interface DroppedItem {
    id: string;
    type: 'weapon' | 'arrows' | 'bombs';
    weaponType?: WeaponSlot;
    durability?: number;
    quantity?: number;
    position: { x: number; y: number; z: number };
}

export interface GameState {
    phase: GamePhase;
    players: Map<string, PlayerState>;
    localPlayerId: string | null;
    projectiles: Projectile[];
    droppedItems: DroppedItem[];
    matchStartTime: number;
    winningTeam: number | null;
}

// ============================================
// LOBBY TYPES
// ============================================

export interface LobbyPlayer {
    id: string;
    name: string;
    teamId: number;
    isReady: boolean;
    isHost: boolean;
    isBot: boolean;
}

export interface LobbyState {
    id: string;
    hostId: string;
    squadSize: number;
    teams: LobbyPlayer[][];
    allReady: boolean;
}

// ============================================
// INPUT TYPES
// ============================================

export interface InputState {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    sprint: boolean;
    attack: boolean;
    block: boolean;
    weaponSlot: WeaponSlot | null;
    cycleWeaponNext: boolean;
    cycleWeaponPrev: boolean;
}

// ============================================
// TERRAIN TYPES
// ============================================

export interface HeightmapConfig {
    resolution: number;
    baseFrequency: number;
    octaves: number;
    persistence: number;
    maxHeight: number;
    minHeight: number;
    smoothness: number;
    seed: number;
}

export interface TerrainData {
    heightmap: Float32Array;
    normalmap: Float32Array;
    width: number;
    depth: number;
    resolution: number;
    config: HeightmapConfig;
}

export interface TerrainMap {
    id: string;
    name: string;
    style: 'smooth' | 'jagged' | 'mixed';
    heightmapConfig: HeightmapConfig;
    obstacles: ObstacleConfig[];
    spawnPoints: SpawnPoint[];
}

export interface ObstacleConfig {
    type: 'rock' | 'wall' | 'tree';
    position: { x: number; z: number };
    size?: number;
    treeType?: 'pine' | 'oak' | 'dead';
}

export interface SpawnPoint {
    position: { x: number; z: number };
    teamId: number;
}

export interface TreeConfig {
    type: 'pine' | 'oak' | 'dead';
    trunkRadius: number;
    trunkHeight: number;
    canopyRadius: number;
    maxPlacementSlope: number;
}
