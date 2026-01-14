# Phase 5: AI Bots

## Overview

Implement simple chase-and-attack AI behavior for bot-controlled players with terrain-aware movement and pathfinding.

**Estimated Time:** 5-6 hours  
**Prerequisites:** Phase 4 complete

---

## Task 5.1: AI State Machine

### Objective
Create a simple state machine for bot behavior.

### File: `client/src/game/ai/AIState.ts`
```typescript
export type AIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat';

export interface AIContext {
  playerId: string;
  currentState: AIState;
  targetId: string | null;
  lastStateChange: number;
  lastAttackTime: number;
  patrolTarget: { x: number; z: number } | null;
}

export function createAIContext(playerId: string): AIContext {
  return {
    playerId,
    currentState: 'idle',
    targetId: null,
    lastStateChange: Date.now(),
    lastAttackTime: 0,
    patrolTarget: null,
  };
}

// State transition durations
export const AI_TIMINGS = {
  idleDuration: 2000,      // Time before starting to patrol
  patrolDuration: 5000,    // Time spent patrolling before re-evaluating
  chaseTimeout: 10000,     // Give up chase after this time
  attackCooldown: 1500,    // Time between attacks
  retreatDuration: 3000,   // Time spent retreating
};

// Detection ranges
export const AI_RANGES = {
  detection: 15,           // Range to detect enemies
  attack: 2.5,             // Range to start attacking (melee)
  rangedAttack: 12,        // Range for bow attacks
  tooClose: 1,             // Too close, might need to retreat
};
```

### Acceptance Criteria
- [ ] State types defined
- [ ] AI context tracks current state
- [ ] Timing constants configured
- [ ] Range constants configured

---

## Task 5.2: AI Decision System

### Objective
Implement decision-making logic for state transitions.

### File: `client/src/game/ai/AIDecision.ts`
```typescript
import type { PlayerState } from '@/types';
import type { AIContext, AIState } from './AIState';
import { AI_TIMINGS, AI_RANGES } from './AIState';
import { useGameStore } from '@/stores/gameStore';

export function updateAIState(context: AIContext): AIState {
  const { players } = useGameStore.getState();
  const bot = players.get(context.playerId);
  
  if (!bot || bot.isEliminated) return 'idle';

  const enemies = findEnemies(bot, players);
  const nearestEnemy = findNearestEnemy(bot, enemies);
  
  // Update target
  context.targetId = nearestEnemy?.id ?? null;

  // State transitions based on current state
  switch (context.currentState) {
    case 'idle':
      return decideFromIdle(context, nearestEnemy);
    case 'patrol':
      return decideFromPatrol(context, nearestEnemy);
    case 'chase':
      return decideFromChase(context, bot, nearestEnemy);
    case 'attack':
      return decideFromAttack(context, bot, nearestEnemy);
    case 'retreat':
      return decideFromRetreat(context);
    default:
      return 'idle';
  }
}

function findEnemies(bot: PlayerState, players: Map<string, PlayerState>): PlayerState[] {
  return Array.from(players.values()).filter(
    (p) => p.teamId !== bot.teamId && !p.isEliminated
  );
}

function findNearestEnemy(
  bot: PlayerState, 
  enemies: PlayerState[]
): PlayerState | null {
  let nearest: PlayerState | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    const dx = enemy.position.x - bot.position.x;
    const dz = enemy.position.z - bot.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < nearestDist && dist < AI_RANGES.detection) {
      nearest = enemy;
      nearestDist = dist;
    }
  }

  return nearest;
}

function decideFromIdle(context: AIContext, enemy: PlayerState | null): AIState {
  if (enemy) return 'chase';
  
  const timeSinceChange = Date.now() - context.lastStateChange;
  if (timeSinceChange > AI_TIMINGS.idleDuration) {
    context.lastStateChange = Date.now();
    return 'patrol';
  }
  
  return 'idle';
}

function decideFromPatrol(context: AIContext, enemy: PlayerState | null): AIState {
  if (enemy) return 'chase';
  
  const timeSinceChange = Date.now() - context.lastStateChange;
  if (timeSinceChange > AI_TIMINGS.patrolDuration) {
    context.lastStateChange = Date.now();
    context.patrolTarget = null; // Pick new patrol target
  }
  
  return 'patrol';
}

function decideFromChase(
  context: AIContext, 
  bot: PlayerState, 
  enemy: PlayerState | null
): AIState {
  if (!enemy) {
    context.lastStateChange = Date.now();
    return 'patrol';
  }

  const dx = enemy.position.x - bot.position.x;
  const dz = enemy.position.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Switch to attack when in range
  if (distance < AI_RANGES.attack) {
    context.lastStateChange = Date.now();
    return 'attack';
  }

  // Retreat if low health
  if (bot.health <= 2 && bot.stamina > 5) {
    context.lastStateChange = Date.now();
    return 'retreat';
  }

  return 'chase';
}

function decideFromAttack(
  context: AIContext, 
  bot: PlayerState, 
  enemy: PlayerState | null
): AIState {
  if (!enemy) {
    context.lastStateChange = Date.now();
    return 'patrol';
  }

  const dx = enemy.position.x - bot.position.x;
  const dz = enemy.position.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Chase if enemy moved away
  if (distance > AI_RANGES.attack * 1.5) {
    context.lastStateChange = Date.now();
    return 'chase';
  }

  // Retreat if low health
  if (bot.health <= 2) {
    context.lastStateChange = Date.now();
    return 'retreat';
  }

  return 'attack';
}

function decideFromRetreat(context: AIContext): AIState {
  const timeSinceChange = Date.now() - context.lastStateChange;
  if (timeSinceChange > AI_TIMINGS.retreatDuration) {
    context.lastStateChange = Date.now();
    return 'patrol';
  }
  return 'retreat';
}
```

### Acceptance Criteria
- [ ] State transitions work correctly
- [ ] Enemy detection based on range
- [ ] Chase when enemy spotted
- [ ] Attack when in melee range
- [ ] Retreat when low health

---

## Task 5.3: Terrain-Aware AI Movement System

### Objective
Implement movement behaviors for each AI state with terrain awareness - avoiding steep slopes and considering elevation.

### File: `client/src/game/ai/AIMovement.ts`
```typescript
import type { PlayerState, TerrainData } from '@/types';
import type { AIContext } from './AIState';
import { useGameStore } from '@/stores/gameStore';
import { getSlopeAngle, getHeightAt, getNormalAt } from '@/game/terrain';
import { 
  ARENA_WIDTH, 
  ARENA_DEPTH, 
  WALK_SPEED, 
  MAX_TRAVERSABLE_SLOPE,
  TERRAIN_SPEED_UPHILL_MIN,
  TERRAIN_SPEED_DOWNHILL_MAX,
} from '@/utils/constants';

interface MovementResult {
  direction: { x: number; z: number };
  shouldSprint: boolean;
  speedModifier: number;
}

export function getAIMovement(context: AIContext, terrain: TerrainData | null): MovementResult {
  const { players } = useGameStore.getState();
  const bot = players.get(context.playerId);
  
  if (!bot || bot.isEliminated) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  let result: MovementResult;

  switch (context.currentState) {
    case 'idle':
      result = { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
      break;
    
    case 'patrol':
      result = getPatrolMovement(context, bot, terrain);
      break;
    
    case 'chase':
      result = getChaseMovement(context, bot, players, terrain);
      break;
    
    case 'attack':
      result = getAttackMovement(context, bot, players);
      break;
    
    case 'retreat':
      result = getRetreatMovement(context, bot, players, terrain);
      break;
    
    default:
      result = { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  // Apply terrain-based speed modifier
  if (terrain && (result.direction.x !== 0 || result.direction.z !== 0)) {
    result.speedModifier = calculateTerrainSpeedModifier(bot.position, result.direction, terrain);
    
    // Check for steep slope and adjust direction
    result.direction = avoidSteepSlopes(bot.position, result.direction, terrain);
  }

  return result;
}

// Calculate speed modifier based on terrain slope
function calculateTerrainSpeedModifier(
  position: { x: number; y: number; z: number },
  direction: { x: number; z: number },
  terrain: TerrainData
): number {
  const normal = getNormalAt(terrain, position.x, position.z);
  const slopeAngle = getSlopeAngle(terrain, position.x, position.z);
  
  // Calculate if moving uphill or downhill
  const slopeFactor = normal.x * direction.x + normal.z * direction.z;
  
  if (slopeFactor > 0) {
    // Moving uphill
    return Math.max(TERRAIN_SPEED_UPHILL_MIN, 1 - (slopeAngle / 90) * 0.5);
  } else {
    // Moving downhill
    return Math.min(TERRAIN_SPEED_DOWNHILL_MAX, 1 + (slopeAngle / 90) * 0.4);
  }
}

// Adjust movement direction to avoid steep slopes
function avoidSteepSlopes(
  position: { x: number; y: number; z: number },
  direction: { x: number; z: number },
  terrain: TerrainData
): { x: number; z: number } {
  // Check slope in the intended direction
  const lookAhead = 2; // Units to look ahead
  const targetX = position.x + direction.x * lookAhead;
  const targetZ = position.z + direction.z * lookAhead;
  
  const targetSlope = getSlopeAngle(terrain, targetX, targetZ);
  const targetHeight = getHeightAt(terrain, targetX, targetZ);
  const currentHeight = getHeightAt(terrain, position.x, position.z);
  const heightDiff = targetHeight - currentHeight;
  
  // If slope is too steep and going uphill, try to go around
  if (targetSlope > MAX_TRAVERSABLE_SLOPE && heightDiff > 0) {
    // Try rotating left and right to find a passable path
    const angles = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    
    for (const angle of angles) {
      const rotatedX = direction.x * Math.cos(angle) - direction.z * Math.sin(angle);
      const rotatedZ = direction.x * Math.sin(angle) + direction.z * Math.cos(angle);
      
      const altTargetX = position.x + rotatedX * lookAhead;
      const altTargetZ = position.z + rotatedZ * lookAhead;
      const altSlope = getSlopeAngle(terrain, altTargetX, altTargetZ);
      const altHeight = getHeightAt(terrain, altTargetX, altTargetZ);
      
      if (altSlope < MAX_TRAVERSABLE_SLOPE || altHeight <= currentHeight) {
        return { x: rotatedX, z: rotatedZ };
      }
    }
    
    // No passable path found, stop movement
    return { x: 0, z: 0 };
  }
  
  return direction;
}

function getPatrolMovement(context: AIContext, bot: PlayerState, terrain: TerrainData | null): MovementResult {
  // Generate patrol target if needed, preferring flat areas
  if (!context.patrolTarget) {
    context.patrolTarget = generateValidPatrolTarget(bot.position, terrain);
  }

  const dx = context.patrolTarget.x - bot.position.x;
  const dz = context.patrolTarget.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Pick new target if reached current one or stuck
  if (distance < 2) {
    context.patrolTarget = null;
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  return {
    direction: { x: dx / distance, z: dz / distance },
    shouldSprint: false,
    speedModifier: 1,
  };
}

// Generate a patrol target that avoids steep terrain
function generateValidPatrolTarget(
  currentPos: { x: number; y: number; z: number },
  terrain: TerrainData | null
): { x: number; z: number } {
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = (Math.random() - 0.5) * ARENA_WIDTH * 0.8;
    const z = (Math.random() - 0.5) * ARENA_DEPTH * 0.8;
    
    if (terrain) {
      const slope = getSlopeAngle(terrain, x, z);
      if (slope < MAX_TRAVERSABLE_SLOPE * 0.8) {
        return { x, z };
      }
    } else {
      return { x, z };
    }
  }
  
  // Fallback to random position
  return {
    x: (Math.random() - 0.5) * ARENA_WIDTH * 0.8,
    z: (Math.random() - 0.5) * ARENA_DEPTH * 0.8,
  };
}

function getChaseMovement(
  context: AIContext, 
  bot: PlayerState, 
  players: Map<string, PlayerState>,
  terrain: TerrainData | null
): MovementResult {
  if (!context.targetId) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  const target = players.get(context.targetId);
  if (!target) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  const dx = target.position.x - bot.position.x;
  const dz = target.position.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < 0.1) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  return {
    direction: { x: dx / distance, z: dz / distance },
    shouldSprint: bot.stamina > 5, // Sprint if has stamina
    speedModifier: 1,
  };
}

function getAttackMovement(
  context: AIContext, 
  bot: PlayerState, 
  players: Map<string, PlayerState>
): MovementResult {
  if (!context.targetId) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  const target = players.get(context.targetId);
  if (!target) {
    return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
  }

  const dx = target.position.x - bot.position.x;
  const dz = target.position.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Slight movement toward target to stay in range
  if (distance > 1.5) {
    return {
      direction: { x: dx / distance * 0.3, z: dz / distance * 0.3 },
      shouldSprint: false,
      speedModifier: 1,
    };
  }

  return { direction: { x: 0, z: 0 }, shouldSprint: false, speedModifier: 1 };
}

function getRetreatMovement(
  context: AIContext, 
  bot: PlayerState, 
  players: Map<string, PlayerState>,
  terrain: TerrainData | null
): MovementResult {
  if (!context.targetId) {
    // Retreat to center if no target
    const dx = -bot.position.x;
    const dz = -bot.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.1) {
      return { direction: { x: 0, z: 0 }, shouldSprint: true, speedModifier: 1 };
    }
    
    return {
      direction: { x: dx / distance, z: dz / distance },
      shouldSprint: true,
      speedModifier: 1,
    };
  }

  const target = players.get(context.targetId);
  if (!target) {
    return { direction: { x: 0, z: 0 }, shouldSprint: true, speedModifier: 1 };
  }

  // Move away from target, preferring downhill for speed
  const dx = bot.position.x - target.position.x;
  const dz = bot.position.z - target.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < 0.1) {
    return { direction: { x: 0, z: 0 }, shouldSprint: true, speedModifier: 1 };
  }

  return {
    direction: { x: dx / distance, z: dz / distance },
    shouldSprint: true,
    speedModifier: 1,
  };
}

export function calculateRotation(direction: { x: number; z: number }): number {
  if (direction.x === 0 && direction.z === 0) return 0;
  return Math.atan2(direction.x, direction.z);
}
```

### Acceptance Criteria
- [ ] Idle: no movement
- [ ] Patrol: moves to random traversable points
- [ ] Patrol targets avoid steep terrain
- [ ] Chase: moves toward target
- [ ] Chase adjusts path around steep slopes
- [ ] Attack: slight adjustment to stay in range
- [ ] Retreat: moves away from target
- [ ] AI movement speed affected by terrain slope
- [ ] AI avoids untraversable slopes

---

## Task 5.4: AI Combat System

### Objective
Implement attack decisions and weapon usage.

### File: `client/src/game/ai/AICombat.ts`
```typescript
import type { PlayerState, WeaponSlot } from '@/types';
import type { AIContext } from './AIState';
import { AI_TIMINGS, AI_RANGES } from './AIState';
import { useGameStore } from '@/stores/gameStore';
import { WEAPON_STATS } from '@/utils/constants';

interface CombatAction {
  shouldAttack: boolean;
  shouldBlock: boolean;
  weaponToUse: WeaponSlot;
}

export function getAICombatAction(context: AIContext): CombatAction {
  const { players } = useGameStore.getState();
  const bot = players.get(context.playerId);
  
  const defaultAction: CombatAction = {
    shouldAttack: false,
    shouldBlock: false,
    weaponToUse: 'sword',
  };

  if (!bot || bot.isEliminated) return defaultAction;
  if (context.currentState !== 'attack') return defaultAction;
  if (!context.targetId) return defaultAction;

  const target = players.get(context.targetId);
  if (!target) return defaultAction;

  const dx = target.position.x - bot.position.x;
  const dz = target.position.z - bot.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Choose weapon based on distance
  const weapon = selectWeapon(bot, distance);

  // Check attack cooldown
  const timeSinceAttack = Date.now() - context.lastAttackTime;
  const canAttack = timeSinceAttack > AI_TIMINGS.attackCooldown;

  // Check if should block (random chance when being attacked)
  const shouldBlock = shouldBotBlock(bot, target);

  if (canAttack && isInAttackRange(distance, weapon)) {
    context.lastAttackTime = Date.now();
    return {
      shouldAttack: true,
      shouldBlock: false,
      weaponToUse: weapon,
    };
  }

  return {
    shouldAttack: false,
    shouldBlock,
    weaponToUse: weapon,
  };
}

function selectWeapon(bot: PlayerState, distanceToTarget: number): WeaponSlot {
  // Prefer ranged at distance
  if (distanceToTarget > AI_RANGES.attack * 2) {
    if (bot.arrows > 0 && bot.weapons.bow && !bot.weapons.bow.isBroken) {
      return 'bow';
    }
  }

  // Use bombs occasionally at medium range
  if (distanceToTarget > AI_RANGES.attack && distanceToTarget < AI_RANGES.rangedAttack) {
    if (bot.bombs > 0 && Math.random() < 0.2) {
      return 'bomb';
    }
  }

  // Melee weapon selection
  const meleeOptions: WeaponSlot[] = ['sword', 'spear', 'club'];
  const availableMelee = meleeOptions.filter((slot) => {
    const weapon = bot.weapons[slot];
    return weapon && !weapon.isBroken;
  });

  if (availableMelee.length > 0) {
    // Prefer spear for range, sword for speed, club for damage
    if (distanceToTarget > 2.5 && availableMelee.includes('spear')) return 'spear';
    if (bot.stamina > 10 && availableMelee.includes('club')) return 'club';
    if (availableMelee.includes('sword')) return 'sword';
    return availableMelee[0] ?? 'sword';
  }

  return 'sword';
}

function isInAttackRange(distance: number, weapon: WeaponSlot): boolean {
  const stats = WEAPON_STATS[weapon];
  if (!stats) return false;
  return distance <= stats.range;
}

function shouldBotBlock(bot: PlayerState, target: PlayerState): boolean {
  // Block if target is attacking and facing us
  const dx = bot.position.x - target.position.x;
  const dz = bot.position.z - target.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance > 3) return false;

  // Check if target is facing bot
  const targetDir = { x: Math.sin(target.rotation), z: Math.cos(target.rotation) };
  const toBot = { x: dx / distance, z: dz / distance };
  const dot = targetDir.x * toBot.x + targetDir.z * toBot.z;

  // Target facing us and has shield or blocking weapon
  if (dot > 0.5) {
    const blockWeapon = bot.weapons.shield ?? bot.weapons.sword;
    if (blockWeapon && !blockWeapon.isBroken) {
      return Math.random() < 0.3; // 30% chance to block
    }
  }

  return false;
}

export function executeAIAttack(context: AIContext, weapon: WeaponSlot): void {
  // This would trigger the actual attack through the combat system
  // Implementation depends on how attacks are processed
}
```

### Acceptance Criteria
- [ ] Bots select appropriate weapons
- [ ] Bots attack when in range
- [ ] Bots occasionally block
- [ ] Weapon selection based on distance
- [ ] Respects attack cooldowns

---

## Task 5.5: AI Controller Component

### Objective
Create the main AI controller that runs bot behavior.

### File: `client/src/game/ai/AIController.tsx`
```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/stores/gameStore';
import { useTerrainData } from '@/game/world';
import { getHeightAt } from '@/game/terrain';
import { updateFallTracking } from '@/game/systems/FallDamageSystem';
import type { AIContext } from './AIState';
import { createAIContext, updateAIState } from './AIState';
import { getAIMovement, calculateRotation } from './AIMovement';
import { getAICombatAction } from './AICombat';
import { WALK_SPEED, SPRINT_SPEED } from '@/utils/constants';

interface AIControllerProps {
  playerId: string;
}

export function AIController({ playerId }: AIControllerProps): null {
  const context = useRef<AIContext>(createAIContext(playerId));
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const terrain = useTerrainData();

  useFrame((_, delta) => {
    const players = useGameStore.getState().players;
    const bot = players.get(playerId);
    
    if (!bot || bot.isEliminated) return;

    // Update AI state
    const newState = updateAIState(context.current);
    if (newState !== context.current.currentState) {
      context.current.currentState = newState;
      context.current.lastStateChange = Date.now();
    }

    // Get movement with terrain awareness
    const movement = getAIMovement(context.current, terrain);
    
    // Calculate velocity with terrain speed modifier
    const baseSpeed = movement.shouldSprint ? SPRINT_SPEED : WALK_SPEED;
    const speed = baseSpeed * movement.speedModifier;
    const velocity = {
      x: movement.direction.x * speed,
      y: 0,
      z: movement.direction.z * speed,
    };

    // Calculate new position
    let newX = bot.position.x + velocity.x * delta;
    let newZ = bot.position.z + velocity.z * delta;
    
    // Get terrain height at new position
    let newY = bot.position.y;
    if (terrain) {
      const terrainHeight = getHeightAt(terrain, newX, newZ);
      newY = terrainHeight + 0.8; // Bot capsule offset
      
      // Check if on ground for fall tracking
      const groundThreshold = 0.5;
      const isOnGround = bot.position.y - terrainHeight < groundThreshold;
      updateFallTracking(playerId, bot.position.y, isOnGround);
    }

    const newPosition = { x: newX, y: newY, z: newZ };

    // Calculate rotation
    let rotation = bot.rotation;
    if (movement.direction.x !== 0 || movement.direction.z !== 0) {
      rotation = calculateRotation(movement.direction);
    }

    // Get combat actions
    const combat = getAICombatAction(context.current);

    // Update stamina (not affected by terrain)
    let stamina = bot.stamina;
    if (movement.shouldSprint) {
      stamina = Math.max(0, stamina - 2 * delta);
    } else {
      stamina = Math.min(20, stamina + 0.1 * delta);
    }

    // Apply updates
    updatePlayer(playerId, {
      position: newPosition,
      rotation,
      velocity,
      stamina,
      isSprinting: movement.shouldSprint,
      isBlocking: combat.shouldBlock,
      currentWeaponSlot: combat.weaponToUse,
    });

    // Handle attacks (simplified - would need combat system integration)
    if (combat.shouldAttack) {
      // Trigger attack through combat system
    }
  });

  return null;
}
```

### File: `client/src/game/ai/index.ts`
```typescript
export { AIController } from './AIController';
export { createAIContext, type AIContext, type AIState } from './AIState';
export { updateAIState } from './AIDecision';
export { getAIMovement } from './AIMovement';
export { getAICombatAction } from './AICombat';
```

### Acceptance Criteria
- [ ] AI controller updates each frame
- [ ] State machine transitions correctly
- [ ] Movement applied to bot position
- [ ] Combat actions triggered
- [ ] Stamina managed for bots

---

## Task 5.6: Bot Spawning

### Objective
Create bots at match start.

### File: `client/src/game/entities/Bot.tsx`
```typescript
import { useEffect } from 'react';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Euler } from 'three';
import { PlayerModel } from './PlayerModel';
import { AIController } from '@/game/ai';
import { useGameStore } from '@/stores/gameStore';
import { MAX_STAMINA } from '@/utils/constants';

interface BotProps {
  botId: string;
  startPosition: [number, number, number];
  teamId: number;
  color: string;
}

export function Bot({ botId, startPosition, teamId, color }: BotProps): JSX.Element {
  const player = useGameStore((state) => state.players.get(botId));

  // Initialize bot in store
  useEffect(() => {
    useGameStore.getState().addPlayer({
      id: botId,
      name: `Bot ${botId.slice(-2)}`,
      teamId,
      position: { x: startPosition[0], y: startPosition[1], z: startPosition[2] },
      rotation: teamId === 0 ? 0 : Math.PI, // Face opposite team
      velocity: { x: 0, y: 0, z: 0 },
      health: 10,
      stamina: MAX_STAMINA,
      currentWeaponSlot: 'sword',
      weapons: {
        sword: { type: 'sword', durability: 15, maxDurability: 15, isBroken: false },
        spear: { type: 'spear', durability: 15, maxDurability: 15, isBroken: false },
        club: { type: 'club', durability: 8, maxDurability: 8, isBroken: false },
        bow: { type: 'bow', durability: Infinity, maxDurability: Infinity, isBroken: false },
        shield: { type: 'shield', durability: 30, maxDurability: 30, isBroken: false },
        bomb: { type: 'bomb', durability: Infinity, maxDurability: Infinity, isBroken: false },
      },
      arrows: 20,
      bombs: 6,
      isBlocking: false,
      isSprinting: false,
      isEliminated: false,
      lastAttackTime: 0,
      staggerEndTime: 0,
    });
  }, [botId, startPosition, teamId]);

  if (!player || player.isEliminated) return <></>;

  return (
    <>
      <AIController playerId={botId} />
      <RigidBody
        position={[player.position.x, player.position.y, player.position.z]}
        enabledRotations={[false, false, false]}
        type="kinematicPosition"
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
        <group rotation={new Euler(0, player.rotation, 0)}>
          <PlayerModel color={color} isBlocking={player.isBlocking} />
        </group>
      </RigidBody>
    </>
  );
}
```

### Acceptance Criteria
- [ ] Bots spawn with full stats
- [ ] Bots have AI controller attached
- [ ] Bots render with player model
- [ ] Bots face their enemies

---

## Phase 5 Complete Checklist

Before proceeding to Phase 6:

- [ ] AI state machine implemented
- [ ] State transitions work correctly
- [ ] Bots patrol when no enemies
- [ ] Patrol targets avoid steep terrain
- [ ] Bots chase detected enemies
- [ ] Bots path around steep slopes
- [ ] Bot movement speed affected by terrain
- [ ] Bots attack in melee range
- [ ] Bots retreat when low health
- [ ] Bots select weapons appropriately
- [ ] Bots occasionally block
- [ ] Bot spawning works at terrain height
- [ ] Bots take fall damage
- [ ] Multiple bots work simultaneously
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `06-ui-hud.md`
