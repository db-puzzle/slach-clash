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

export const ARENA_WIDTH = 60;
export const ARENA_DEPTH = 60;
export const SPAWN_DISTANCE = 25; // Distance from center for team spawns
