# Slash and Clash — Implementation Plan Overview

## Document Structure

This implementation plan is split into separate files for each development phase:

| File | Phase | Description |
|------|-------|-------------|
| `00-overview.md` | — | This file: project overview and design decisions |
| `01-project-foundation.md` | Phase 1 | Project setup, dependencies, folder structure |
| `02-arena-and-player.md` | Phase 2 | 3D arena, player controller, camera system |
| `03-combat-system.md` | Phase 3 | Weapons, attacks, blocking, damage |
| `04-game-systems.md` | Phase 4 | Health, stamina, durability, looting |
| `05-ai-bots.md` | Phase 5 | Enemy AI behavior and spawning |
| `06-ui-hud.md` | Phase 6 | HUD, menus, lobby screens |
| `07-networking.md` | Phase 7 | Multiplayer, lobbies, state sync |
| `08-audio-polish.md` | Phase 8 | Sound effects, visual feedback, spectator mode |

---

## Design Decisions

Based on requirements discussion, the following decisions guide implementation:

### Visual Style
- **Art Direction:** Block/stylized low-poly geometric shapes
- **Character Models:** Capsule-based humanoids with colored limbs
- **Weapons:** Simple geometric representations
- **Arena:** Procedural terrain with rolling hills, trees, and natural obstacles

### Terrain
- **Type:** Procedural heightmap-based terrain
- **Initial Map:** Rolling Hills (smooth, gentle elevation changes)
- **Elevation Range:** -4 to +12 units from base
- **Features:** Mountains, valleys, slopes with natural cover
- **Obstacles:** Trees (trunk collision only), rocky outcroppings, cliff faces

### Camera
- **Type:** Fixed follow camera
- **Behavior:** Always behind and above player, auto-rotates to match player direction
- **No manual camera rotation** in Phase 1

### Weapons
- **Starting Weapons:** All 6 weapon types from the beginning
  - Sword, Spear, Club, Bow, Shield, Bomb
- **All functional** in first prototype

### AI Bots
- **Behavior Level:** Simple chase-and-attack
- **No advanced tactics** (flanking, baiting, coordination)
- **Weapon switching** based on distance only

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Build Tool | Vite | ^5.x | Fast development, HMR |
| Framework | React | ^18.x | UI components |
| Language | TypeScript | ^5.x | Type safety |
| 3D Rendering | Three.js | ^0.160.x | WebGL rendering |
| 3D React | React Three Fiber | ^8.x | Declarative 3D |
| 3D Helpers | @react-three/drei | ^9.x | Useful 3D components |
| Physics | Rapier | ^1.x | WASM physics engine |
| Physics React | @react-three/rapier | ^1.x | React bindings for Rapier |
| State | Zustand | ^4.x | Global game state |
| Styling | Tailwind CSS | ^3.x | UI styling |
| Audio | Howler.js | ^2.x | Sound effects |
| Networking | Socket.io | ^4.x | Real-time multiplayer |
| Server | Node.js + Express | ^20.x | Lobby server |

---

## Project Structure

```
slash_clash/
├── docs/                          # Documentation
│   ├── implementation/            # Implementation plan files
│   ├── slash-and-clash-requirements.md
│   └── controls-specification.md
├── client/                        # Frontend application
│   ├── public/
│   │   └── assets/
│   │       ├── models/            # 3D models (if any)
│   │       ├── sounds/            # Audio files
│   │       └── textures/          # Texture images
│   ├── src/
│   │   ├── components/            # React UI components
│   │   │   ├── hud/               # In-game HUD elements
│   │   │   ├── menus/             # Menu screens
│   │   │   └── lobby/             # Lobby components
│   │   ├── game/                  # Core game logic
│   │   │   ├── entities/          # Player, weapons, projectiles
│   │   │   ├── systems/           # Combat, stamina, durability
│   │   │   ├── physics/           # Collision helpers
│   │   │   ├── ai/                # Bot behavior
│   │   │   ├── terrain/           # Heightmap generation, terrain utils
│   │   │   └── world/             # Arena, obstacles, trees
│   │   ├── networking/            # Socket.io client
│   │   ├── audio/                 # Sound management
│   │   ├── stores/                # Zustand stores
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── utils/                 # Helper functions
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── eslint.config.js
├── server/                        # Backend for lobbies
│   ├── src/
│   │   ├── lobby/                 # Lobby management
│   │   ├── signaling/             # P2P connection setup
│   │   └── index.ts               # Server entry
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Core Data Types

These TypeScript interfaces are used throughout the codebase:

### Player State
```typescript
interface PlayerState {
  id: string;
  name: string;
  teamId: number;
  position: Vector3;
  rotation: number;          // Y-axis rotation (radians)
  velocity: Vector3;
  health: number;            // 0-10 (hearts)
  stamina: number;           // 0-20
  currentWeaponSlot: WeaponSlot;
  weapons: WeaponInventory;
  arrows: number;            // 0-20
  bombs: number;             // 0-6
  isBlocking: boolean;
  isSprinting: boolean;
  isEliminated: boolean;
  lastAttackTime: number;
  staggerEndTime: number;    // 0 if not staggered
}
```

### Weapons
```typescript
type WeaponSlot = 'sword' | 'spear' | 'club' | 'bow' | 'shield' | 'bomb';

interface WeaponState {
  type: WeaponSlot;
  durability: number;        // Remaining uses
  maxDurability: number;
  isBroken: boolean;
}

interface WeaponInventory {
  sword: WeaponState | null;
  spear: WeaponState | null;
  club: WeaponState | null;
  bow: WeaponState | null;   // Bow doesn't break, uses arrows
  shield: WeaponState | null;
  bomb: WeaponState | null;  // Bombs are consumable, not durability
}

interface WeaponStats {
  damage: number;            // Hearts of damage
  staminaCost: number;
  attackSpeed: number;       // Attacks per second
  range: number;             // Units
  durability: number;        // Max hits before breaking
  canBlock: boolean;
  blockEffectiveness: Record<WeaponSlot, 'full' | 'partial' | 'none'>;
}
```

### Combat
```typescript
interface AttackEvent {
  attackerId: string;
  weaponType: WeaponSlot;
  position: Vector3;
  direction: Vector3;
  timestamp: number;
}

interface DamageEvent {
  targetId: string;
  attackerId: string;
  damage: number;
  wasBlocked: boolean;
  wasPartialBlock: boolean;
  causedStagger: boolean;
}
```

### Game State
```typescript
interface GameState {
  phase: 'lobby' | 'playing' | 'ended';
  players: Map<string, PlayerState>;
  projectiles: Projectile[];
  droppedItems: DroppedItem[];
  matchStartTime: number;
  winningTeam: number | null;
  terrain: TerrainData;
}

interface Projectile {
  id: string;
  type: 'arrow' | 'bomb';
  ownerId: string;
  position: Vector3;
  velocity: Vector3;
  createdAt: number;
  detonated?: boolean;       // For bombs
}

interface DroppedItem {
  id: string;
  type: 'weapon' | 'arrows' | 'bombs';
  weaponType?: WeaponSlot;
  durability?: number;
  quantity?: number;         // For arrows/bombs
  position: Vector3;
}
```

### Terrain
```typescript
interface HeightmapConfig {
  resolution: number;        // Grid resolution for height sampling
  baseFrequency: number;     // Primary noise frequency
  octaves: number;           // Noise detail layers
  persistence: number;       // Amplitude falloff per octave
  maxHeight: number;         // Maximum elevation from base (units)
  minHeight: number;         // Minimum elevation (valleys, can be negative)
  smoothness: number;        // Post-processing smoothing factor
  seed: number;              // Randomization seed (0 = random per match)
}

interface TerrainData {
  heightmap: Float32Array;   // Height values
  normalmap: Float32Array;   // Pre-computed normals
  width: number;
  depth: number;
  resolution: number;
  config: HeightmapConfig;
  
  getHeightAt(x: number, z: number): number;
  getNormalAt(x: number, z: number): Vector3;
  getSlopeAt(x: number, z: number): number;
}

interface TerrainMap {
  id: string;
  name: string;
  style: 'smooth' | 'jagged' | 'mixed';
  heightmapConfig: HeightmapConfig;
  obstacles: ObstacleConfig[];
  spawnPoints: SpawnPoint[];
}

interface TreeConfig {
  type: 'pine' | 'oak' | 'dead';
  trunkRadius: number;
  trunkHeight: number;
  canopyRadius: number;
  maxPlacementSlope: number;
}
```

---

## Development Order

Execute phases in this order. Each phase builds on the previous:

```
Phase 1: Project Foundation
    ↓
Phase 2: Arena & Player Controller
    ↓
Phase 3: Combat System (all 6 weapons)
    ↓
Phase 4: Game Systems (health, stamina, durability, looting)
    ↓
Phase 5: AI Bots
    ↓
Phase 6: UI & HUD
    ↓
Phase 7: Networking (multiplayer)
    ↓
Phase 8: Audio & Polish
```

---

## Usage Instructions

To implement each phase:

1. Open the corresponding phase document
2. Use the document content as context/prompt for Claude AI
3. Implement tasks in the order listed
4. Complete all acceptance criteria before moving to next phase
5. Run linting and type checks after each task

---

## Constants Reference

Game balance constants used across the codebase:

```typescript
// Health
const MAX_HEALTH = 10;

// Stamina
const MAX_STAMINA = 20;
const STAMINA_RECOVERY_RATE = 0.1;    // Per second
const STAMINA_RECOVERY_DELAY = 2000;  // Ms after last action

// Sprint
const SPRINT_STAMINA_COST = 2;        // Per second
const WALK_SPEED = 5;                 // Units per second
const SPRINT_SPEED = 8;

// Combat timing
const STAGGER_DURATION = 500;         // Ms
const BOMB_FUSE_TIME = 5000;          // Ms auto-detonate
const BOMB_BLAST_RADIUS = 3;          // Units

// Terrain
const MAX_TRAVERSABLE_SLOPE = 45;     // Degrees
const SLIDE_THRESHOLD_SLOPE = 50;     // Degrees - player begins sliding
const SLIDE_SPEED = 4;                // Units per second
const FALL_DAMAGE_THRESHOLD = 3;      // Units - falls below this are safe
const TERRAIN_SPEED_UPHILL_MIN = 0.5; // Minimum speed multiplier going uphill
const TERRAIN_SPEED_DOWNHILL_MAX = 1.4; // Maximum speed multiplier going downhill
const CAMERA_TILT_INFLUENCE = 0.6;    // How much terrain affects camera tilt
const CAMERA_TILT_SMOOTHNESS = 8;     // Camera tilt interpolation speed
const CAMERA_MAX_TILT_ANGLE = 18;     // Degrees

// Weapon stats (see 03-combat-system.md for full table)
```

---

**Next Step:** Proceed to `01-project-foundation.md` to begin implementation.
