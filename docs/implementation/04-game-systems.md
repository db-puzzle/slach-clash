# Phase 4: Game Systems

## Overview

Implement health, stamina recovery, weapon durability, death, looting mechanics, and fall damage from terrain.

**Estimated Time:** 5-6 hours  
**Prerequisites:** Phase 3 complete

---

## Task 4.1: Health System

### Objective
Implement heart-based health with damage and elimination.

### File: `client/src/game/systems/HealthSystem.ts`
```typescript
import { useGameStore } from '@/stores/gameStore';
import type { PlayerState, DroppedItem, WeaponSlot } from '@/types';
import { MAX_HEALTH } from '@/utils/constants';

export function applyDamage(
  playerId: string,
  damage: number,
  causesStagger: boolean = false
): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player || player.isEliminated) return;

  const newHealth = Math.max(0, player.health - damage);
  const updates: Partial<PlayerState> = { health: newHealth };

  if (causesStagger) {
    updates.staggerEndTime = Date.now() + 500; // 0.5 second stagger
  }

  if (newHealth <= 0) {
    updates.isEliminated = true;
    eliminatePlayer(player);
  }

  updatePlayer(playerId, updates);
}

export function healPlayer(playerId: string, amount: number): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player || player.isEliminated) return;

  const newHealth = Math.min(MAX_HEALTH, player.health + amount);
  updatePlayer(playerId, { health: newHealth });
}

function eliminatePlayer(player: PlayerState): void {
  const { addDroppedItem } = useGameStore.getState();

  // Drop all weapons and items
  const dropOffset = 0.5;
  let itemIndex = 0;

  // Drop weapons
  const weaponSlots: WeaponSlot[] = ['sword', 'spear', 'club', 'bow', 'shield', 'bomb'];
  
  for (const slot of weaponSlots) {
    const weapon = player.weapons[slot];
    if (weapon && !weapon.isBroken && weapon.durability > 0) {
      const angle = (itemIndex / 6) * Math.PI * 2;
      addDroppedItem({
        id: `drop-${player.id}-${slot}-${Date.now()}`,
        type: 'weapon',
        weaponType: slot,
        durability: weapon.durability,
        position: {
          x: player.position.x + Math.cos(angle) * dropOffset,
          y: 0.2,
          z: player.position.z + Math.sin(angle) * dropOffset,
        },
      });
      itemIndex++;
    }
  }

  // Drop arrows
  if (player.arrows > 0) {
    addDroppedItem({
      id: `drop-${player.id}-arrows-${Date.now()}`,
      type: 'arrows',
      quantity: player.arrows,
      position: {
        x: player.position.x + 0.3,
        y: 0.2,
        z: player.position.z + 0.3,
      },
    });
  }

  // Drop bombs
  if (player.bombs > 0) {
    addDroppedItem({
      id: `drop-${player.id}-bombs-${Date.now()}`,
      type: 'bombs',
      quantity: player.bombs,
      position: {
        x: player.position.x - 0.3,
        y: 0.2,
        z: player.position.z - 0.3,
      },
    });
  }
}

export function isStaggered(player: PlayerState): boolean {
  return Date.now() < player.staggerEndTime;
}
```

### Acceptance Criteria
- [ ] Damage reduces health
- [ ] Health cannot go below 0
- [ ] Stagger applies for club hits
- [ ] Player eliminated at 0 health
- [ ] Items dropped on death

---

## Task 4.2: Fall Damage System

### Objective
Implement fall damage when players fall from significant heights on terrain.

### File: `client/src/game/systems/FallDamageSystem.ts`
```typescript
import { useGameStore } from '@/stores/gameStore';
import { applyDamage } from './HealthSystem';
import { FALL_DAMAGE_THRESHOLD } from '@/utils/constants';

interface FallTracker {
  highestY: Map<string, number>;
  isAirborne: Map<string, boolean>;
}

const tracker: FallTracker = {
  highestY: new Map(),
  isAirborne: new Map(),
};

// Called each frame to track player's highest Y position
export function updateFallTracking(
  playerId: string, 
  currentY: number, 
  isOnGround: boolean
): void {
  const highestY = tracker.highestY.get(playerId) ?? currentY;
  const wasAirborne = tracker.isAirborne.get(playerId) ?? false;
  
  if (!isOnGround) {
    // Player is airborne - track highest point
    if (currentY > highestY) {
      tracker.highestY.set(playerId, currentY);
    }
    tracker.isAirborne.set(playerId, true);
  } else if (wasAirborne) {
    // Player just landed - calculate fall damage
    const fallDistance = highestY - currentY;
    const damage = calculateFallDamage(fallDistance);
    
    if (damage > 0) {
      applyFallDamage(playerId, damage, fallDistance);
    }
    
    // Reset tracking
    tracker.highestY.set(playerId, currentY);
    tracker.isAirborne.set(playerId, false);
  }
}

// Calculate damage based on fall distance (tiered system)
export function calculateFallDamage(fallDistance: number): number {
  if (fallDistance <= 3) return 0;      // Safe landing
  if (fallDistance <= 6) return 1;      // Minor damage
  if (fallDistance <= 10) return 2;     // Moderate damage
  if (fallDistance <= 15) return 3;     // Significant damage
  return 3 + Math.floor((fallDistance - 15) / 5); // Severe damage (1 per 5 additional units)
}

// Apply fall damage and effects
function applyFallDamage(playerId: string, damage: number, fallDistance: number): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player || player.isEliminated) return;
  
  // Apply damage
  applyDamage(playerId, damage, false);
  
  // Apply brief stagger on significant falls (damage >= 2)
  if (damage >= 2) {
    updatePlayer(playerId, {
      staggerEndTime: Date.now() + 300, // Brief landing stagger
    });
  }
  
  // TODO: Trigger visual/audio feedback
  // - Dust particles at landing position
  // - Impact sound based on damage
  // - Screen shake for local player
}

// Reset tracker for a player (on spawn/respawn)
export function resetFallTracker(playerId: string): void {
  tracker.highestY.delete(playerId);
  tracker.isAirborne.delete(playerId);
}

// Get current fall info for UI/effects
export function getFallInfo(playerId: string): { 
  isAirborne: boolean; 
  currentFallDistance: number 
} {
  const { players } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player) {
    return { isAirborne: false, currentFallDistance: 0 };
  }
  
  const highestY = tracker.highestY.get(playerId) ?? player.position.y;
  const isAirborne = tracker.isAirborne.get(playerId) ?? false;
  
  return {
    isAirborne,
    currentFallDistance: isAirborne ? highestY - player.position.y : 0,
  };
}
```

### Integration with Player Controller

Update the Player.tsx to use the fall damage system:

```typescript
// In Player.tsx useFrame loop, add after terrain height calculation:

import { updateFallTracking } from '@/game/systems/FallDamageSystem';

// ... inside useFrame:

// Check if on ground
const groundThreshold = 0.5;
const isOnGround = pos.y - terrainHeight < groundThreshold;

// Track fall for fall damage
updateFallTracking(playerId, pos.y, isOnGround);
```

### Acceptance Criteria
- [ ] Falls under 3 units are safe (no damage)
- [ ] Falls 3-6 units cause 1 damage
- [ ] Falls 6-10 units cause 2 damage
- [ ] Falls 10-15 units cause 3 damage
- [ ] Falls over 15 units cause 3 + 1 per 5 additional units
- [ ] Brief stagger on significant falls
- [ ] Fall tracking resets on landing

---

## Task 4.3: Stamina System

### Objective
Implement stamina drain, recovery, and fatigue effects.

### File: `client/src/game/systems/StaminaSystem.ts`
```typescript
import { useGameStore } from '@/stores/gameStore';
import { MAX_STAMINA, STAMINA_RECOVERY_RATE, STAMINA_RECOVERY_DELAY } from '@/utils/constants';

interface StaminaTracker {
  lastActionTime: Map<string, number>;
}

const tracker: StaminaTracker = {
  lastActionTime: new Map(),
};

export function consumeStamina(playerId: string, amount: number): boolean {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player) return false;
  if (player.stamina < amount) return false;

  const newStamina = Math.max(0, player.stamina - amount);
  updatePlayer(playerId, { stamina: newStamina });
  tracker.lastActionTime.set(playerId, Date.now());
  
  return true;
}

export function updateStaminaRecovery(playerId: string, delta: number): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player || player.stamina >= MAX_STAMINA) return;

  const lastAction = tracker.lastActionTime.get(playerId) ?? 0;
  const timeSinceAction = Date.now() - lastAction;

  // Only recover if enough time has passed since last action
  if (timeSinceAction < STAMINA_RECOVERY_DELAY) return;

  // Faster recovery when not in combat (not blocking)
  const recoveryMultiplier = player.isBlocking ? 0.5 : 1;
  const recovery = STAMINA_RECOVERY_RATE * delta * recoveryMultiplier;
  const newStamina = Math.min(MAX_STAMINA, player.stamina + recovery);
  
  updatePlayer(playerId, { stamina: newStamina });
}

export function getStaminaPercent(stamina: number): number {
  return (stamina / MAX_STAMINA) * 100;
}

export function isLowStamina(stamina: number): boolean {
  return stamina < MAX_STAMINA * 0.25;
}

export function canPerformAction(playerId: string, staminaCost: number): boolean {
  const { players } = useGameStore.getState();
  const player = players.get(playerId);
  return player ? player.stamina >= staminaCost : false;
}
```

### Acceptance Criteria
- [ ] Stamina consumed on actions
- [ ] Actions fail if stamina too low
- [ ] Stamina recovers over time
- [ ] Recovery delayed after actions
- [ ] Lower recovery while blocking

---

## Task 4.4: Durability System

### Objective
Track weapon durability and handle weapon breaking.

### File: `client/src/game/systems/DurabilitySystem.ts`
```typescript
import { useGameStore } from '@/stores/gameStore';
import type { WeaponSlot, WeaponInventory } from '@/types';
import { WEAPON_STATS } from '@/utils/constants';

const WEAPON_ORDER: WeaponSlot[] = ['sword', 'spear', 'club', 'bow', 'shield', 'bomb'];

export function reduceDurability(playerId: string, weaponSlot: WeaponSlot): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player) return;

  const weapon = player.weapons[weaponSlot];
  if (!weapon || weapon.isBroken) return;

  // Bow and bomb don't use durability (they use ammo)
  if (weaponSlot === 'bow' || weaponSlot === 'bomb') return;

  const newDurability = weapon.durability - 1;
  const newWeapons: WeaponInventory = {
    ...player.weapons,
    [weaponSlot]: {
      ...weapon,
      durability: newDurability,
      isBroken: newDurability <= 0,
    },
  };

  const updates: { weapons: WeaponInventory; currentWeaponSlot?: WeaponSlot } = { 
    weapons: newWeapons 
  };

  // Auto-switch if weapon broke
  if (newDurability <= 0 && player.currentWeaponSlot === weaponSlot) {
    const nextWeapon = getNextAvailableWeapon(weaponSlot, newWeapons);
    if (nextWeapon) {
      updates.currentWeaponSlot = nextWeapon;
    }
  }

  updatePlayer(playerId, updates);
}

export function reduceShieldDurability(playerId: string): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);
  
  if (!player) return;

  const shield = player.weapons.shield;
  if (!shield || shield.isBroken) return;

  const newDurability = shield.durability - 1;
  const newWeapons: WeaponInventory = {
    ...player.weapons,
    shield: {
      ...shield,
      durability: newDurability,
      isBroken: newDurability <= 0,
    },
  };

  updatePlayer(playerId, { weapons: newWeapons });
}

export function getNextAvailableWeapon(
  currentSlot: WeaponSlot, 
  weapons: WeaponInventory
): WeaponSlot | null {
  const currentIndex = WEAPON_ORDER.indexOf(currentSlot);
  
  for (let i = 1; i <= 6; i++) {
    const nextIndex = (currentIndex + i) % 6;
    const slot = WEAPON_ORDER[nextIndex];
    if (slot) {
      const weapon = weapons[slot];
      if (weapon && !weapon.isBroken) {
        // Special check for ammo weapons
        if (slot === 'bow') return slot; // Bow is always available (arrows separate)
        if (slot === 'bomb') return slot; // Bombs separate from durability
        return slot;
      }
    }
  }
  
  return null;
}

export function getDurabilityPercent(durability: number, maxDurability: number): number {
  if (!isFinite(maxDurability)) return 100;
  return (durability / maxDurability) * 100;
}

export function isLowDurability(durability: number, maxDurability: number): boolean {
  if (!isFinite(maxDurability)) return false;
  return durability <= maxDurability * 0.2;
}
```

### Acceptance Criteria
- [ ] Melee attacks reduce durability
- [ ] Blocking reduces shield durability
- [ ] Weapons break at 0 durability
- [ ] Auto-switch on weapon break
- [ ] Broken weapons cannot be used

---

## Task 4.5: Looting System

### Objective
Allow players to pick up dropped items on contact.

### File: `client/src/game/entities/DroppedItemEntity.tsx`
```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/stores/gameStore';
import type { DroppedItem, WeaponSlot } from '@/types';

interface DroppedItemEntityProps {
  item: DroppedItem;
}

const WEAPON_COLORS: Record<WeaponSlot, string> = {
  sword: '#c0c0c0',
  spear: '#8b4513',
  club: '#654321',
  bow: '#deb887',
  shield: '#2a5298',
  bomb: '#2f2f2f',
};

export function DroppedItemEntity({ item }: DroppedItemEntityProps): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const removeDroppedItem = useGameStore((state) => state.removeDroppedItem);
  const players = useGameStore((state) => state.players);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const localPlayerId = useGameStore((state) => state.localPlayerId);

  // Floating animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
      meshRef.current.position.y = item.position.y + Math.sin(Date.now() / 300) * 0.1;
    }

    // Check pickup collision with local player
    if (!localPlayerId) return;
    const player = players.get(localPlayerId);
    if (!player || player.isEliminated) return;

    const dx = player.position.x - item.position.x;
    const dz = player.position.z - item.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1) {
      pickupItem(item, localPlayerId);
      removeDroppedItem(item.id);
    }
  });

  const pickupItem = (droppedItem: DroppedItem, playerId: string): void => {
    const player = players.get(playerId);
    if (!player) return;

    if (droppedItem.type === 'weapon' && droppedItem.weaponType && droppedItem.durability) {
      const slot = droppedItem.weaponType;
      const existingWeapon = player.weapons[slot];
      
      // Only pick up if current weapon is broken or new one has more durability
      if (!existingWeapon || existingWeapon.isBroken || 
          droppedItem.durability > existingWeapon.durability) {
        updatePlayer(playerId, {
          weapons: {
            ...player.weapons,
            [slot]: {
              type: slot,
              durability: droppedItem.durability,
              maxDurability: droppedItem.durability,
              isBroken: false,
            },
          },
        });
      }
    } else if (droppedItem.type === 'arrows' && droppedItem.quantity) {
      updatePlayer(playerId, {
        arrows: player.arrows + droppedItem.quantity,
      });
    } else if (droppedItem.type === 'bombs' && droppedItem.quantity) {
      updatePlayer(playerId, {
        bombs: player.bombs + droppedItem.quantity,
      });
    }
  };

  // Render based on item type
  let color = '#ffff00';
  let geometry: JSX.Element;

  if (item.type === 'weapon' && item.weaponType) {
    color = WEAPON_COLORS[item.weaponType] ?? '#ffff00';
    geometry = <boxGeometry args={[0.3, 0.3, 0.3]} />;
  } else if (item.type === 'arrows') {
    color = '#8b4513';
    geometry = <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />;
  } else {
    color = '#2f2f2f';
    geometry = <sphereGeometry args={[0.15, 16, 16]} />;
  }

  return (
    <mesh ref={meshRef} position={[item.position.x, item.position.y, item.position.z]}>
      {geometry}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  );
}
```

### File: `client/src/game/entities/DroppedItems.tsx`
```typescript
import { useGameStore } from '@/stores/gameStore';
import { DroppedItemEntity } from './DroppedItemEntity';

export function DroppedItems(): JSX.Element {
  const droppedItems = useGameStore((state) => state.droppedItems);

  return (
    <group>
      {droppedItems.map((item) => (
        <DroppedItemEntity key={item.id} item={item} />
      ))}
    </group>
  );
}
```

### Acceptance Criteria
- [ ] Items render at death location
- [ ] Items float and rotate
- [ ] Walking over items picks them up
- [ ] Weapons restore durability
- [ ] Arrows/bombs add to count
- [ ] Pickup is instant (no delay)

---

## Task 4.6: Game Systems Index

### File: `client/src/game/systems/index.ts`
```typescript
export { applyDamage, healPlayer, isStaggered } from './HealthSystem';
export { 
  updateFallTracking, 
  calculateFallDamage, 
  resetFallTracker,
  getFallInfo 
} from './FallDamageSystem';
export { 
  consumeStamina, 
  updateStaminaRecovery, 
  getStaminaPercent, 
  isLowStamina,
  canPerformAction 
} from './StaminaSystem';
export { 
  reduceDurability, 
  reduceShieldDurability, 
  getNextAvailableWeapon,
  getDurabilityPercent,
  isLowDurability 
} from './DurabilitySystem';
export { checkMeleeHit, checkArrowHit, checkBombHit } from './HitDetection';
```

### Acceptance Criteria
- [ ] All systems exported from index

---

## Phase 4 Complete Checklist

Before proceeding to Phase 5:

- [ ] Damage reduces player health
- [ ] Players eliminated at 0 health
- [ ] Stagger mechanic works for club
- [ ] Fall damage calculated from height
- [ ] Falls under 3 units are safe
- [ ] Falls 3-15 units cause tiered damage
- [ ] Falls over 15 units cause severe damage
- [ ] Brief stagger on significant falls
- [ ] Stamina consumed by actions
- [ ] Stamina recovers over time
- [ ] Recovery delayed after actions
- [ ] Weapon durability decreases on use
- [ ] Weapons break and auto-switch
- [ ] Items drop on player death
- [ ] Items can be picked up on contact
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `05-ai-bots.md`
