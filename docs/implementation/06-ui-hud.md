# Phase 6: UI & HUD

## Overview

Implement the in-game HUD, menus, and lobby screens.

**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 5 complete

---

## Task 6.1: Health Hearts Display

### File: `client/src/components/hud/HealthHearts.tsx`

Create a heart-based health display (like Zelda):
- Display 10 heart icons in a row
- Full hearts for full health
- Empty/gray hearts for lost health
- Animate hearts when damage taken
- Position in top-left corner

### Key Implementation
```typescript
function HeartIcon({ filled }: { filled: boolean }): JSX.Element {
  return (
    <span className={`text-2xl ${filled ? 'text-game-health' : 'text-gray-600'}`}>
      {filled ? '❤️' : '🖤'}
    </span>
  );
}
```

### Acceptance Criteria
- [ ] 10 hearts displayed
- [ ] Hearts reflect current health
- [ ] Visual distinction for empty hearts

---

## Task 6.2: Stamina Bar

### File: `client/src/components/hud/StaminaBar.tsx`

Create a horizontal stamina bar:
- Full width at 20 stamina
- Yellow when below 50%
- Red when below 25%
- Smooth animation on changes
- Position below health hearts

### Key Implementation
```typescript
const StaminaBar = ({ stamina, maxStamina }: Props) => {
  const percent = (stamina / maxStamina) * 100;
  const color = percent < 25 ? 'bg-red-500' : percent < 50 ? 'bg-yellow-500' : 'bg-game-stamina';
  
  return (
    <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-200`} 
           style={{ width: `${percent}%` }} />
    </div>
  );
};
```

### Acceptance Criteria
- [ ] Bar width matches stamina percentage
- [ ] Color changes at thresholds
- [ ] Smooth transitions

---

## Task 6.3: Weapon Display

### File: `client/src/components/hud/WeaponDisplay.tsx`

Show current weapon with durability:
- Large weapon icon
- Weapon name
- Durability bar (flashing when low)
- Grayed out if broken
- Show all 6 slots with current highlighted

### Acceptance Criteria
- [ ] Current weapon highlighted
- [ ] Durability visible
- [ ] Broken weapons grayed out
- [ ] All weapon slots visible

---

## Task 6.4: Ammo Counters

### File: `client/src/components/hud/AmmoCounter.tsx`

Display arrow and bomb counts:
- Arrow icon with count
- Bomb icon with count
- Red text when at 0
- Position near weapon display

### Acceptance Criteria
- [ ] Arrow count displayed
- [ ] Bomb count displayed
- [ ] Visual warning at 0

---

## Task 6.5: Terrain Indicators

### File: `client/src/components/hud/TerrainIndicators.tsx`

Display terrain-related warnings and information:
- Slope warning icon when on steep terrain
- Fall damage indicator when airborne at dangerous height
- Minimap showing terrain elevation (optional)

```typescript
import { useGameStore } from '@/stores/gameStore';
import { useTerrainData } from '@/game/world';
import { getSlopeAngle, getHeightAt } from '@/game/terrain';
import { getFallInfo } from '@/game/systems/FallDamageSystem';
import { MAX_TRAVERSABLE_SLOPE, FALL_DAMAGE_THRESHOLD } from '@/utils/constants';

export function TerrainIndicators(): JSX.Element {
  const player = useGameStore((state) => 
    state.localPlayerId ? state.players.get(state.localPlayerId) : null
  );
  const terrain = useTerrainData();
  
  if (!player || !terrain) return <></>;
  
  const slopeAngle = getSlopeAngle(terrain, player.position.x, player.position.z);
  const isSteepSlope = slopeAngle > MAX_TRAVERSABLE_SLOPE * 0.8;
  
  const { isAirborne, currentFallDistance } = getFallInfo(player.id);
  const isDangerousFall = isAirborne && currentFallDistance > FALL_DAMAGE_THRESHOLD;
  
  return (
    <div className="absolute top-20 left-4 flex flex-col gap-2">
      {/* Steep slope warning */}
      {isSteepSlope && (
        <div className="flex items-center gap-2 px-3 py-1 bg-game-warning/80 rounded-lg animate-pulse">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-bold text-game-dark">STEEP SLOPE</span>
        </div>
      )}
      
      {/* Fall damage warning */}
      {isDangerousFall && (
        <div className="flex items-center gap-2 px-3 py-1 bg-game-health/80 rounded-lg animate-pulse">
          <span className="text-lg">⬇️</span>
          <span className="text-sm font-bold text-white">
            FALLING! ({currentFallDistance.toFixed(1)}m)
          </span>
        </div>
      )}
    </div>
  );
}
```

### Acceptance Criteria
- [ ] Steep slope warning shows near limit
- [ ] Fall warning shows when airborne above damage threshold
- [ ] Warnings are visually distinct and noticeable

---

## Task 6.6: Combined HUD Component

### File: `client/src/components/hud/GameHUD.tsx`

Combine all HUD elements including terrain indicators:
```typescript
import { TerrainIndicators } from './TerrainIndicators';

export function GameHUD(): JSX.Element {
  const player = useGameStore(state => 
    state.localPlayerId ? state.players.get(state.localPlayerId) : null
  );
  
  if (!player) return <></>;
  
  return (
    <div className="absolute inset-0 pointer-events-none p-4">
      {/* Top Left: Health & Stamina */}
      <div className="absolute top-4 left-4">
        <HealthHearts health={player.health} />
        <StaminaBar stamina={player.stamina} maxStamina={20} />
      </div>
      
      {/* Terrain Warnings */}
      <TerrainIndicators />
      
      {/* Bottom Center: Weapons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <WeaponDisplay 
          weapons={player.weapons} 
          currentSlot={player.currentWeaponSlot} 
        />
      </div>
      
      {/* Bottom Right: Ammo */}
      <div className="absolute bottom-4 right-4">
        <AmmoCounter arrows={player.arrows} bombs={player.bombs} />
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] All HUD elements positioned correctly
- [ ] Updates in real-time
- [ ] Doesn't block gameplay (pointer-events-none)

---

## Task 6.7: Main Menu

### File: `client/src/components/menus/MainMenu.tsx`

Create the main menu screen:
- Game title "Slash and Clash"
- "Create Lobby" button
- "Join Lobby" button  
- "Settings" button
- Stylized background

### Acceptance Criteria
- [ ] Title prominently displayed
- [ ] Buttons are clickable
- [ ] Buttons navigate to correct screens

---

## Task 6.8: Lobby Screen

### File: `client/src/components/lobby/LobbyScreen.tsx`

Create the pre-match lobby:
- Team panels (Team A / Team B)
- Player slots showing names
- Ready indicator per player
- Squad size selector (host only)
- Ready button
- Leave button

### Key Elements
- Team selection by clicking slots
- Ready/Not Ready toggle
- Start button (host only, when all ready)
- Fill with bots option

### Acceptance Criteria
- [ ] Teams displayed side by side
- [ ] Player names visible
- [ ] Ready status shown
- [ ] Host can change settings
- [ ] Start when all ready

---

## Task 6.9: Results Screen

### File: `client/src/components/menus/ResultsScreen.tsx`

Post-match summary:
- "Victory" or "Defeat" message
- Winning team display
- Player stats (eliminations)
- "Play Again" button
- "Return to Menu" button

### Acceptance Criteria
- [ ] Win/loss clearly shown
- [ ] Stats displayed
- [ ] Navigation buttons work

---

## Task 6.10: Control Hints Overlay

### File: `client/src/components/hud/ControlHints.tsx`

Context-sensitive hints:
- Show on first match
- "WASD to move"
- "Space to sprint"
- "Left click to attack"
- Dismissable

### Acceptance Criteria
- [ ] Hints visible on first play
- [ ] Can be dismissed
- [ ] Positioned unobtrusively

---

## Task 6.11: HUD Index Exports

### File: `client/src/components/hud/index.ts`
```typescript
export { GameHUD } from './GameHUD';
export { HealthHearts } from './HealthHearts';
export { StaminaBar } from './StaminaBar';
export { WeaponDisplay } from './WeaponDisplay';
export { AmmoCounter } from './AmmoCounter';
export { TerrainIndicators } from './TerrainIndicators';
export { ControlHints } from './ControlHints';
```

### File: `client/src/components/menus/index.ts`
```typescript
export { MainMenu } from './MainMenu';
export { ResultsScreen } from './ResultsScreen';
```

### File: `client/src/components/lobby/index.ts`
```typescript
export { LobbyScreen } from './LobbyScreen';
```

---

## Phase 6 Complete Checklist

- [ ] Health hearts display working
- [ ] Stamina bar with color states
- [ ] Weapon display with durability
- [ ] Ammo counters displayed
- [ ] Terrain slope warning indicator
- [ ] Fall damage warning indicator
- [ ] Combined HUD positioned correctly
- [ ] Main menu with navigation
- [ ] Lobby screen functional
- [ ] Results screen displays winner
- [ ] Control hints for new players
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `07-networking.md`
