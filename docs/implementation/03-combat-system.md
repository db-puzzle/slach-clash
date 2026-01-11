# Phase 3: Combat System

## Overview

Implement all 6 weapon types with attacks, blocking, damage, and weapon-specific mechanics.

**Estimated Time:** 6-8 hours  
**Prerequisites:** Phase 2 complete

---

## Task 3.1: Create Weapon Models

### Objective
Build visual representations for each weapon type.

### File: `client/src/game/entities/weapons/WeaponModels.tsx`
```typescript
interface WeaponModelProps {
  isActive?: boolean;
}

export function SwordModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[0.4, 0.5, 0]}>
      {/* Blade */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.08, 0.8, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#ffd700" metalness={0.6} />
      </mesh>
    </group>
  );
}

export function SpearModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[0.3, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
      {/* Shaft */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Tip */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function ClubModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[0.4, 0.4, 0]}>
      {/* Handle */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.2]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
    </group>
  );
}

export function BowModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[0.3, 0.5, -0.2]}>
      {/* Bow body (simplified arc) */}
      <mesh castShadow>
        <torusGeometry args={[0.4, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* String */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
    </group>
  );
}

export function ShieldModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[-0.4, 0.5, 0.2]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.6, 0.06]} />
        <meshStandardMaterial color="#2a5298" />
      </mesh>
      {/* Emblem */}
      <mesh position={[0, 0, 0.04]} castShadow>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  );
}

export function BombModel({ isActive = true }: WeaponModelProps): JSX.Element {
  if (!isActive) return <></>;
  return (
    <group position={[0.4, 0.5, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>
      {/* Fuse */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}
```

### File: `client/src/game/entities/weapons/index.ts`
```typescript
export * from './WeaponModels';
```

### Acceptance Criteria
- [ ] All 6 weapon models visible
- [ ] Weapons have distinct silhouettes
- [ ] Weapons positioned on player's side

---

## Task 3.2: Create Combat System Store

### Objective
Manage combat state including attacks, cooldowns, and hit detection.

### File: `client/src/stores/combatStore.ts`
```typescript
import { create } from 'zustand';
import type { WeaponSlot, AttackEvent, DamageEvent } from '@/types';
import { WEAPON_STATS } from '@/utils/constants';

interface CombatStore {
  // Active attacks
  activeAttacks: AttackEvent[];
  pendingDamage: DamageEvent[];
  
  // Cooldowns
  attackCooldowns: Map<string, number>;
  
  // Actions
  startAttack: (event: AttackEvent) => void;
  endAttack: (attackerId: string) => void;
  registerDamage: (event: DamageEvent) => void;
  processDamage: () => DamageEvent[];
  canAttack: (playerId: string, weaponType: WeaponSlot) => boolean;
  setAttackCooldown: (playerId: string, weaponType: WeaponSlot) => void;
  clearCooldown: (playerId: string) => void;
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  activeAttacks: [],
  pendingDamage: [],
  attackCooldowns: new Map(),

  startAttack: (event): void => {
    set((state) => ({
      activeAttacks: [...state.activeAttacks, event],
    }));
  },

  endAttack: (attackerId): void => {
    set((state) => ({
      activeAttacks: state.activeAttacks.filter((a) => a.attackerId !== attackerId),
    }));
  },

  registerDamage: (event): void => {
    set((state) => ({
      pendingDamage: [...state.pendingDamage, event],
    }));
  },

  processDamage: (): DamageEvent[] => {
    const { pendingDamage } = get();
    set({ pendingDamage: [] });
    return pendingDamage;
  },

  canAttack: (playerId, weaponType): boolean => {
    const { attackCooldowns } = get();
    const cooldownEnd = attackCooldowns.get(playerId);
    if (!cooldownEnd) return true;
    return Date.now() >= cooldownEnd;
  },

  setAttackCooldown: (playerId, weaponType): void => {
    const stats = WEAPON_STATS[weaponType];
    if (!stats) return;
    const cooldownMs = (1 / stats.attackSpeed) * 1000;
    const cooldowns = new Map(get().attackCooldowns);
    cooldowns.set(playerId, Date.now() + cooldownMs);
    set({ attackCooldowns: cooldowns });
  },

  clearCooldown: (playerId): void => {
    const cooldowns = new Map(get().attackCooldowns);
    cooldowns.delete(playerId);
    set({ attackCooldowns: cooldowns });
  },
}));
```

### Acceptance Criteria
- [ ] Attack events tracked
- [ ] Damage events queued
- [ ] Cooldowns prevent spam attacks
- [ ] Cooldown based on weapon attack speed

---

## Task 3.3: Create Attack Hitbox System

### Objective
Implement hitbox detection for melee attacks.

### File: `client/src/game/systems/HitDetection.ts`
```typescript
import type { PlayerState, WeaponSlot } from '@/types';
import { WEAPON_STATS } from '@/utils/constants';

interface HitResult {
  targetId: string;
  damage: number;
  wasBlocked: boolean;
  wasPartialBlock: boolean;
  causedStagger: boolean;
}

export function checkMeleeHit(
  attacker: PlayerState,
  targets: PlayerState[],
  weaponType: WeaponSlot
): HitResult[] {
  const stats = WEAPON_STATS[weaponType];
  if (!stats) return [];

  const results: HitResult[] = [];
  const attackerPos = attacker.position;
  const attackerDir = {
    x: Math.sin(attacker.rotation),
    z: Math.cos(attacker.rotation),
  };

  for (const target of targets) {
    if (target.id === attacker.id) continue;
    if (target.isEliminated) continue;
    if (target.teamId === attacker.teamId) continue; // No friendly fire check here, add later

    // Calculate distance
    const dx = target.position.x - attackerPos.x;
    const dz = target.position.z - attackerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if in range
    if (distance > stats.range) continue;

    // Check if in attack cone (roughly 90 degrees in front)
    const toTarget = { x: dx / distance, z: dz / distance };
    const dot = attackerDir.x * toTarget.x + attackerDir.z * toTarget.z;
    if (dot < 0.5) continue; // ~60 degree cone

    // Check blocking
    const blockResult = checkBlock(target, attacker, weaponType);

    results.push({
      targetId: target.id,
      damage: blockResult.wasBlocked ? 
        (blockResult.wasPartialBlock ? stats.damage * 0.5 : 0) : 
        stats.damage,
      wasBlocked: blockResult.wasBlocked,
      wasPartialBlock: blockResult.wasPartialBlock,
      causedStagger: weaponType === 'club' && !blockResult.wasBlocked,
    });
  }

  return results;
}

function checkBlock(
  defender: PlayerState,
  attacker: PlayerState,
  attackWeapon: WeaponSlot
): { wasBlocked: boolean; wasPartialBlock: boolean } {
  if (!defender.isBlocking) {
    return { wasBlocked: false, wasPartialBlock: false };
  }

  const defenderWeapon = defender.currentWeaponSlot;
  const defenderStats = WEAPON_STATS[defenderWeapon];
  
  if (!defenderStats?.canBlock) {
    return { wasBlocked: false, wasPartialBlock: false };
  }

  // Check if defender is facing attacker
  const dx = attacker.position.x - defender.position.x;
  const dz = attacker.position.z - defender.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const toAttacker = { x: dx / distance, z: dz / distance };
  const defenderDir = {
    x: Math.sin(defender.rotation),
    z: Math.cos(defender.rotation),
  };
  const dot = defenderDir.x * toAttacker.x + defenderDir.z * toAttacker.z;
  
  // Must be roughly facing attacker to block
  if (dot < 0.3) {
    return { wasBlocked: false, wasPartialBlock: false };
  }

  const effectiveness = defenderStats.blockEffectiveness[attackWeapon];
  
  if (effectiveness === 'full') {
    return { wasBlocked: true, wasPartialBlock: false };
  } else if (effectiveness === 'partial') {
    return { wasBlocked: true, wasPartialBlock: true };
  }
  
  return { wasBlocked: false, wasPartialBlock: false };
}

export function checkArrowHit(
  arrowPos: { x: number; y: number; z: number },
  targets: PlayerState[],
  ownerId: string
): HitResult | null {
  const hitRadius = 0.5;

  for (const target of targets) {
    if (target.id === ownerId) continue;
    if (target.isEliminated) continue;

    const dx = target.position.x - arrowPos.x;
    const dy = target.position.y + 1 - arrowPos.y; // Aim at body center
    const dz = target.position.z - arrowPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < hitRadius) {
      // Check if blocked by shield
      if (target.isBlocking && target.currentWeaponSlot === 'shield') {
        return {
          targetId: target.id,
          damage: 0,
          wasBlocked: true,
          wasPartialBlock: false,
          causedStagger: false,
        };
      }

      return {
        targetId: target.id,
        damage: WEAPON_STATS.bow?.damage ?? 1.5,
        wasBlocked: false,
        wasPartialBlock: false,
        causedStagger: false,
      };
    }
  }

  return null;
}

export function checkBombHit(
  bombPos: { x: number; y: number; z: number },
  players: PlayerState[],
  blastRadius: number
): HitResult[] {
  const results: HitResult[] = [];

  for (const player of players) {
    if (player.isEliminated) continue;

    const dx = player.position.x - bombPos.x;
    const dz = player.position.z - bombPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < blastRadius) {
      // Damage falloff based on distance
      const falloff = 1 - (distance / blastRadius) * 0.5;
      const baseDamage = WEAPON_STATS.bomb?.damage ?? 3;

      // Shield blocks knockback but takes durability hit
      const blocked = player.isBlocking && player.currentWeaponSlot === 'shield';

      results.push({
        targetId: player.id,
        damage: blocked ? 0 : baseDamage * falloff,
        wasBlocked: blocked,
        wasPartialBlock: blocked, // Shield only partially blocks bombs
        causedStagger: false,
      });
    }
  }

  return results;
}
```

### Acceptance Criteria
- [ ] Melee hits detected in front arc
- [ ] Range checked per weapon
- [ ] Blocking reduces/negates damage
- [ ] Club causes stagger
- [ ] Arrow hits detected
- [ ] Bomb area damage calculated

---

## Task 3.4: Integrate Combat into Player

Update the Player component to handle attacking with weapons. This involves:

1. Processing attack input when left-click is pressed
2. Checking cooldowns before allowing attacks
3. Calling hit detection for melee weapons
4. Reducing weapon durability on use
5. Applying damage to hit targets
6. Handling stagger state

### Key Implementation Points

```typescript
// In Player.tsx useFrame loop:

// Handle attack input
if (input.attack && canAttack) {
  const weaponType = player.currentWeaponSlot;
  const stats = WEAPON_STATS[weaponType];
  
  // Check stamina
  if (player.stamina >= stats.staminaCost) {
    // Melee attack
    if (['sword', 'spear', 'club'].includes(weaponType)) {
      const hits = checkMeleeHit(player, enemies, weaponType);
      for (const hit of hits) {
        applyDamage(hit.targetId, hit.damage, hit.causedStagger);
      }
      reduceDurability(weaponType);
    }
    
    // Consume stamina
    updatePlayer(playerId, { stamina: player.stamina - stats.staminaCost });
    
    // Set cooldown
    setAttackCooldown(playerId, weaponType);
  }
}
```

### Acceptance Criteria
- [ ] Left-click triggers attack
- [ ] Attack respects cooldown
- [ ] Stamina consumed on attack
- [ ] Weapon durability reduced
- [ ] Enemies take damage on hit

---

## Task 3.5: Implement Projectile System

### Objective
Create arrows and thrown bombs with physics.

### File: `client/src/game/entities/Projectile.tsx`
```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '@/stores/gameStore';
import { checkArrowHit, checkBombHit } from '@/game/systems/HitDetection';
import { ARROW_SPEED, BOMB_FUSE_TIME, BOMB_BLAST_RADIUS } from '@/utils/constants';

interface ArrowProps {
  id: string;
  ownerId: string;
  startPosition: [number, number, number];
  direction: [number, number, number];
}

export function Arrow({ id, ownerId, startPosition, direction }: ArrowProps): JSX.Element {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const removeProjectile = useGameStore((state) => state.removeProjectile);
  const players = useGameStore((state) => state.players);
  const updatePlayer = useGameStore((state) => state.updatePlayer);

  useEffect(() => {
    // Set initial velocity
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel({
        x: direction[0] * ARROW_SPEED,
        y: direction[1] * ARROW_SPEED + 2, // Slight arc
        z: direction[2] * ARROW_SPEED,
      }, true);
    }

    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
      removeProjectile(id);
    }, 5000);

    return (): void => { clearTimeout(timeout); };
  }, [id, direction, removeProjectile]);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const pos = rigidBodyRef.current.translation();
    
    // Ground collision
    if (pos.y < 0.1) {
      removeProjectile(id);
      return;
    }

    // Hit detection
    const hit = checkArrowHit(
      { x: pos.x, y: pos.y, z: pos.z },
      Array.from(players.values()),
      ownerId
    );

    if (hit) {
      const target = players.get(hit.targetId);
      if (target) {
        updatePlayer(hit.targetId, {
          health: Math.max(0, target.health - hit.damage),
        });
      }
      removeProjectile(id);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={startPosition}
      gravityScale={0.3}
      colliders="ball"
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Arrowhead */}
      <mesh position={[0, 0, -0.3]}>
        <coneGeometry args={[0.03, 0.1, 4]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
    </RigidBody>
  );
}

interface BombProps {
  id: string;
  ownerId: string;
  startPosition: [number, number, number];
  direction: [number, number, number];
}

export function Bomb({ id, ownerId, startPosition, direction }: BombProps): JSX.Element {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const removeProjectile = useGameStore((state) => state.removeProjectile);
  const players = useGameStore((state) => state.players);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const createdAt = useRef(Date.now());

  const detonate = (): void => {
    if (!rigidBodyRef.current) return;

    const pos = rigidBodyRef.current.translation();
    const hits = checkBombHit(
      { x: pos.x, y: pos.y, z: pos.z },
      Array.from(players.values()),
      BOMB_BLAST_RADIUS
    );

    for (const hit of hits) {
      const target = players.get(hit.targetId);
      if (target) {
        updatePlayer(hit.targetId, {
          health: Math.max(0, target.health - hit.damage),
        });
      }
    }

    // TODO: Add explosion effect
    removeProjectile(id);
  };

  useEffect(() => {
    // Set initial velocity (throw arc)
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel({
        x: direction[0] * 8,
        y: 5,
        z: direction[2] * 8,
      }, true);
    }

    // Auto-detonate after fuse time
    const timeout = setTimeout(detonate, BOMB_FUSE_TIME);
    return (): void => { clearTimeout(timeout); };
  }, []);

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={startPosition}
      colliders="ball"
      restitution={0.3}
    >
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>
      {/* Fuse spark effect */}
      <pointLight position={[0, 0.2, 0]} intensity={0.5} color="#ff6600" distance={1} />
    </RigidBody>
  );
}
```

### Acceptance Criteria
- [ ] Arrows travel in direction fired
- [ ] Arrows affected by gravity
- [ ] Arrows hit and damage players
- [ ] Bombs thrown in arc
- [ ] Bombs bounce on landing
- [ ] Bombs auto-detonate after 5 seconds
- [ ] Bomb blast damages players in radius

---

## Task 3.6: Weapon Switching

### Objective
Implement weapon slot cycling and direct selection.

Add to Player.tsx:
- Track previous input state to detect key presses (not holds)
- On E press: cycle to next available weapon
- On Q press: cycle to previous available weapon  
- On 1-6 press: directly equip that weapon if available
- Skip broken weapons when cycling

### Implementation Notes
```typescript
// Track weapon slots in order
const WEAPON_ORDER: WeaponSlot[] = ['sword', 'spear', 'club', 'bow', 'shield', 'bomb'];

function getNextWeapon(current: WeaponSlot, weapons: WeaponInventory): WeaponSlot {
  const currentIndex = WEAPON_ORDER.indexOf(current);
  for (let i = 1; i <= 6; i++) {
    const nextIndex = (currentIndex + i) % 6;
    const slot = WEAPON_ORDER[nextIndex];
    if (slot && weapons[slot] && !weapons[slot].isBroken) {
      return slot;
    }
  }
  return current;
}
```

### Acceptance Criteria
- [ ] E cycles to next weapon
- [ ] Q cycles to previous weapon
- [ ] 1-6 selects specific weapon
- [ ] Broken weapons skipped
- [ ] HUD updates on switch

---

## Phase 3 Complete Checklist

Before proceeding to Phase 4:

- [ ] All 6 weapon models render correctly
- [ ] Combat store tracks attacks and cooldowns
- [ ] Melee hit detection works (sword, spear, club)
- [ ] Blocking reduces/negates damage
- [ ] Club causes stagger effect
- [ ] Arrows fire and hit targets
- [ ] Bombs throw, bounce, and explode
- [ ] Bomb area damage applies correctly
- [ ] Weapon switching with Q/E works
- [ ] Direct weapon selection with 1-6 works
- [ ] Attack consumes stamina
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `04-game-systems.md`
