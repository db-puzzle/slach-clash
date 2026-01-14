import type { WeaponStats } from '@/types';

// ============================================
// HEALTH & STAMINA
// ============================================

export const MAX_HEALTH = 10;
export const MAX_STAMINA = 20;
export const STAMINA_RECOVERY_RATE = 0.1; // Per second (1 per 10 seconds)
export const STAMINA_RECOVERY_DELAY = 2000; // Ms after last stamina-consuming action

// ============================================
// MOVEMENT
// ============================================

export const WALK_SPEED = 5; // Units per second
export const SPRINT_SPEED = 8;
export const SPRINT_STAMINA_COST = 2; // Per second

// ============================================
// COMBAT
// ============================================

export const STAGGER_DURATION = 500; // Ms
export const BOMB_FUSE_TIME = 5000; // Ms until auto-detonate
export const BOMB_BLAST_RADIUS = 3; // Units
export const ARROW_SPEED = 20; // Units per second

// ============================================
// STARTING RESOURCES
// ============================================

export const STARTING_ARROWS = 20;
export const STARTING_BOMBS = 6;

// ============================================
// WEAPON STATS
// ============================================

export const WEAPON_STATS: Record<string, WeaponStats> = {
  sword: {
    type: 'sword',
    damage: 2,
    staminaCost: 1,
    attackSpeed: 2, // Attacks per second
    range: 2,
    durability: 15,
    canBlock: true,
    blockEffectiveness: {
      sword: 'full',
      spear: 'partial',
      club: 'none',
      bow: 'none',
      bomb: 'none',
    },
  },
  spear: {
    type: 'spear',
    damage: 2,
    staminaCost: 2,
    attackSpeed: 1.5,
    range: 3.5,
    durability: 15,
    canBlock: true,
    blockEffectiveness: {
      sword: 'partial',
      spear: 'none',
      club: 'none',
      bow: 'none',
      bomb: 'none',
    },
  },
  club: {
    type: 'club',
    damage: 4,
    staminaCost: 4,
    attackSpeed: 0.8,
    range: 2,
    durability: 8,
    canBlock: false,
    blockEffectiveness: {},
  },
  bow: {
    type: 'bow',
    damage: 1.5,
    staminaCost: 1,
    attackSpeed: 1,
    range: 20,
    durability: Infinity, // Bow doesn't break, uses arrows
    canBlock: false,
    blockEffectiveness: {},
  },
  shield: {
    type: 'shield',
    damage: 0.5, // Shield bash
    staminaCost: 0.5, // Per second while blocking
    attackSpeed: 1,
    range: 1.5,
    durability: 30,
    canBlock: true,
    blockEffectiveness: {
      sword: 'full',
      spear: 'full',
      club: 'full',
      bow: 'full',
      bomb: 'partial', // Knockback only
    },
  },
  bomb: {
    type: 'bomb',
    damage: 3,
    staminaCost: 0,
    attackSpeed: 0.5,
    range: 10, // Throw distance
    durability: Infinity, // Uses bomb count instead
    canBlock: false,
    blockEffectiveness: {},
  },
};

// ============================================
// ARENA
// ============================================

export const ARENA_WIDTH = 120;
export const ARENA_DEPTH = 120;
export const SPAWN_DISTANCE = 50; // Distance from center for team spawns

// ============================================
// TERRAIN
// ============================================

export const MAX_TRAVERSABLE_SLOPE = 45; // degrees
export const SLIDE_THRESHOLD_SLOPE = 50; // degrees
export const SLIDE_SPEED = 4; // units per second

export const FALL_DAMAGE_THRESHOLD = 3; // units - falls below this are safe
export const FALL_DAMAGE_PER_TIER = 1; // damage per tier

export const TERRAIN_SPEED_UPHILL_MIN = 0.5;
export const TERRAIN_SPEED_DOWNHILL_MAX = 1.4;

export const CAMERA_TILT_INFLUENCE = 0.6;
export const CAMERA_TILT_SMOOTHNESS = 8;
export const CAMERA_MAX_TILT_ANGLE = 18; // degrees

// Default Rolling Hills terrain configuration
export const ROLLING_HILLS_CONFIG: import('@/types').HeightmapConfig = {
  resolution: 256,
  baseFrequency: 0.015,
  octaves: 5,
  persistence: 0.55,
  maxHeight: 28,
  minHeight: -10,
  smoothness: 0.5,
  seed: 0, // 0 = random seed per match
};

// Tree configurations
export const TREE_TYPES: Record<string, import('@/types').TreeConfig> = {
  pine: {
    type: 'pine',
    trunkRadius: 0.4,
    trunkHeight: 8,
    canopyRadius: 2,
    maxPlacementSlope: 30,
  },
  oak: {
    type: 'oak',
    trunkRadius: 0.6,
    trunkHeight: 5,
    canopyRadius: 4,
    maxPlacementSlope: 20,
  },
  dead: {
    type: 'dead',
    trunkRadius: 0.3,
    trunkHeight: 4,
    canopyRadius: 1.5,
    maxPlacementSlope: 35,
  },
};

// Obstacle placement rules
export const OBSTACLE_PLACEMENT = {
  maxSlopeForPlacement: 10,
  minDistanceFromEdge: 10,
  minDistanceBetween: 12,
  flatAreaBias: 0.7,
};
