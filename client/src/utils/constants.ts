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

// Orbit camera settings
export const CAMERA_DEFAULT_DISTANCE = 12;
export const CAMERA_DEFAULT_HEIGHT = 8;
export const CAMERA_MIN_DISTANCE = 8;
export const CAMERA_MAX_DISTANCE = 20;
export const CAMERA_SENSITIVITY = 0.003; // Radians per pixel
export const CAMERA_MIN_PITCH = -0.5; // Radians (looking up limit)
export const CAMERA_MAX_PITCH = 1.2; // Radians (looking down limit)
export const CAMERA_SMOOTHNESS = 8; // Interpolation factor

// Target lock settings
export const TARGET_LOCK_RANGE = 15; // Units
export const TARGET_LOCK_ANGLE = Math.PI / 3; // 60 degrees cone in front of player
export const TARGET_LOCK_BREAK_RANGE = 20; // Distance at which lock breaks

// Quick shield settings
export const QUICK_SHIELD_STAMINA_COST = 0.5; // Per second
export const QUICK_SHIELD_SPEED_MULTIPLIER = 0.7; // 30% speed reduction

// Default Rolling Hills terrain configuration
export const ROLLING_HILLS_CONFIG: import('@/types').HeightmapConfig = {
  resolution: 256,
  baseFrequency: 0.015,
  octaves: 5,
  persistence: 0.45,
  maxHeight: 28,
  minHeight: -10,
  smoothness: 0.85,
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

// ============================================
// OCCLUSION TRANSPARENCY
// ============================================

// How transparent occluding objects become (0 = invisible, 1 = fully opaque)
export const OCCLUSION_TRANSPARENCY = 0.3;

// Speed of fade in/out transition (higher = faster)
export const OCCLUSION_FADE_SPEED = 5;

// Y offset from player position for raycast target (aim at chest level)
export const OCCLUSION_RAY_OFFSET = 1.0;

// ============================================
// FLYBY CAMERA
// ============================================

export const FLYBY_ORBIT_DURATION = 4500; // 4.5 seconds for circular orbit (50% slower than original)
export const FLYBY_TRANSITION_DURATION = 1500; // 1.5 seconds to transition to player camera

// Circular flyby path configuration
export const FLYBY_ORBIT_RADIUS = 55; // Distance from arena center
export const FLYBY_ORBIT_HEIGHT = 35; // Camera height during flyby
export const FLYBY_LOOK_AT_HEIGHT = 5; // Height of the point camera looks at (arena center)
// Note: Start/end angles are calculated dynamically based on each player's spawn position
