# Phase 1: Project Foundation

## Overview

Set up the complete project structure with all dependencies, configurations, and base files needed for development.

**Estimated Time:** 2-3 hours  
**Prerequisites:** Node.js 20+, npm/pnpm installed

---

## Task 1.1: Initialize Client Project

### Objective
Create the Vite + React + TypeScript client application.

### Commands to Execute
```bash
cd /Users/danilobibancos/slash_clash
npm create vite@latest client -- --template react-ts
cd client
npm install
```

### Acceptance Criteria
- [ ] `client/` directory created
- [ ] Can run `npm run dev` and see Vite welcome page
- [ ] TypeScript compiles without errors

---

## Task 1.2: Install Core Dependencies

### Objective
Add all required packages for 3D rendering, physics, and state management.

### Commands to Execute
```bash
cd /Users/danilobibancos/slash_clash/client

# 3D Rendering
npm install three @react-three/fiber @react-three/drei

# Physics
npm install @react-three/rapier

# State Management
npm install zustand

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Audio (install now, use later)
npm install howler

# Type definitions
npm install -D @types/three @types/howler
```

### Acceptance Criteria
- [ ] All packages installed without errors
- [ ] `package.json` includes all dependencies
- [ ] No conflicting peer dependency warnings

---

## Task 1.3: Configure TypeScript

### Objective
Set up strict TypeScript configuration for type safety.

### File: `client/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Strict Type Checking */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@game/*": ["./src/game/*"],
      "@stores/*": ["./src/stores/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### File: `client/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts"]
}
```

### Acceptance Criteria
- [ ] TypeScript compiles with strict mode
- [ ] Path aliases resolve correctly
- [ ] No type errors in existing files

---

## Task 1.4: Configure Vite

### Objective
Set up Vite with path aliases and optimized build settings.

### File: `client/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@game': path.resolve(__dirname, './src/game'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
```

### Acceptance Criteria
- [ ] Dev server runs on port 3000
- [ ] Path aliases work in imports
- [ ] Build completes without errors

---

## Task 1.5: Configure Tailwind CSS

### Objective
Set up Tailwind for UI styling with a game-appropriate theme.

### File: `client/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zelda-inspired palette
        'game': {
          'dark': '#1a1c2c',
          'darker': '#0f0f1a',
          'accent': '#4ecdc4',
          'accent-dark': '#2a9d8f',
          'health': '#e63946',
          'stamina': '#f4a261',
          'warning': '#ffd166',
        },
      },
      fontFamily: {
        'game': ['Rubik', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
```

### File: `client/src/index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Rubik', system-ui, sans-serif;
  }
  
  body {
    @apply bg-game-darker text-white;
    margin: 0;
    overflow: hidden;
  }
  
  #root {
    width: 100vw;
    height: 100vh;
  }
}

@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-game-accent text-game-dark font-bold rounded-lg 
           hover:bg-game-accent-dark transition-colors duration-200
           active:scale-95 transform;
  }
  
  .btn-secondary {
    @apply px-6 py-3 bg-game-dark border-2 border-game-accent text-game-accent 
           font-bold rounded-lg hover:bg-game-accent hover:text-game-dark 
           transition-colors duration-200;
  }
}
```

### Acceptance Criteria
- [ ] Tailwind classes apply correctly
- [ ] Custom colors available
- [ ] Google Font loads

---

## Task 1.6: Configure ESLint

### Objective
Set up ESLint with strict rules for code quality.

### File: `client/eslint.config.js`
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
);
```

### Update `client/package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "types": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

### Acceptance Criteria
- [ ] `npm run lint` passes with no errors
- [ ] `npm run types` passes with no errors
- [ ] ESLint catches unused variables

---

## Task 1.7: Create Folder Structure

### Objective
Create all directories and placeholder files for the project architecture.

### Directories to Create
```bash
cd /Users/danilobibancos/slash_clash/client/src

# Create all directories
mkdir -p components/hud
mkdir -p components/menus
mkdir -p components/lobby
mkdir -p game/entities
mkdir -p game/systems
mkdir -p game/physics
mkdir -p game/ai
mkdir -p game/terrain
mkdir -p game/world
mkdir -p networking
mkdir -p audio
mkdir -p stores
mkdir -p hooks
mkdir -p types
mkdir -p utils

# Create public asset directories
mkdir -p ../public/assets/sounds
mkdir -p ../public/assets/textures
```

### File: `client/src/types/index.ts`
```typescript
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
```

### File: `client/src/utils/constants.ts`
```typescript
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

import type { WeaponStats } from '@/types';

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
  resolution: 128,
  baseFrequency: 0.02,
  octaves: 4,
  persistence: 0.5,
  maxHeight: 12,
  minHeight: -4,
  smoothness: 0.8,
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
  minDistanceFromEdge: 5,
  minDistanceBetween: 8,
  flatAreaBias: 0.7,
};
```

### File: `client/src/stores/gameStore.ts`
```typescript
import { create } from 'zustand';
import type { GamePhase, PlayerState, Projectile, DroppedItem } from '@/types';

interface GameStore {
  // State
  phase: GamePhase;
  players: Map<string, PlayerState>;
  localPlayerId: string | null;
  projectiles: Projectile[];
  droppedItems: DroppedItem[];
  matchStartTime: number;
  winningTeam: number | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setLocalPlayerId: (id: string) => void;
  addPlayer: (player: PlayerState) => void;
  updatePlayer: (id: string, updates: Partial<PlayerState>) => void;
  removePlayer: (id: string) => void;
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  addDroppedItem: (item: DroppedItem) => void;
  removeDroppedItem: (id: string) => void;
  startMatch: () => void;
  endMatch: (winningTeam: number) => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'menu' as GamePhase,
  players: new Map<string, PlayerState>(),
  localPlayerId: null,
  projectiles: [],
  droppedItems: [],
  matchStartTime: 0,
  winningTeam: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setPhase: (phase): void => set({ phase }),
  
  setLocalPlayerId: (id): void => set({ localPlayerId: id }),

  addPlayer: (player): void =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.set(player.id, player);
      return { players: newPlayers };
    }),

  updatePlayer: (id, updates): void =>
    set((state) => {
      const player = state.players.get(id);
      if (!player) return state;
      const newPlayers = new Map(state.players);
      newPlayers.set(id, { ...player, ...updates });
      return { players: newPlayers };
    }),

  removePlayer: (id): void =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.delete(id);
      return { players: newPlayers };
    }),

  addProjectile: (projectile): void =>
    set((state) => ({
      projectiles: [...state.projectiles, projectile],
    })),

  removeProjectile: (id): void =>
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== id),
    })),

  addDroppedItem: (item): void =>
    set((state) => ({
      droppedItems: [...state.droppedItems, item],
    })),

  removeDroppedItem: (id): void =>
    set((state) => ({
      droppedItems: state.droppedItems.filter((i) => i.id !== id),
    })),

  startMatch: (): void =>
    set({
      phase: 'playing',
      matchStartTime: Date.now(),
      winningTeam: null,
    }),

  endMatch: (winningTeam): void =>
    set({
      phase: 'ended',
      winningTeam,
    }),

  resetGame: (): void => set(initialState),
}));
```

### File: `client/src/App.tsx`
```typescript
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '@/stores/gameStore';

function Game(): JSX.Element {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function App(): JSX.Element {
  const phase = useGameStore((state) => state.phase);

  return (
    <div className="w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 10, 10], fov: 60 }}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Game />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="p-4">
          <p className="text-white text-xl font-game">
            Slash and Clash - Phase: {phase}
          </p>
          <p className="text-game-accent text-sm">
            Project foundation complete!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

### File: `client/src/main.tsx`
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Acceptance Criteria
- [ ] All directories created
- [ ] Type definitions compile
- [ ] Constants export correctly
- [ ] Zustand store works
- [ ] App renders with 3D canvas and UI overlay

---

## Task 1.8: Verify Everything Works

### Objective
Run all checks to confirm project is properly set up.

### Commands to Execute
```bash
cd /Users/danilobibancos/slash_clash/client

# Type check
npm run types

# Lint check
npm run lint

# Start dev server
npm run dev
```

### Expected Result
- Browser opens to `http://localhost:3000`
- Orange cube visible in center of screen
- "Slash and Clash - Phase: menu" text in top-left
- No console errors
- No TypeScript errors
- No ESLint errors

### Acceptance Criteria
- [ ] `npm run types` passes
- [ ] `npm run lint` passes
- [ ] Dev server starts without errors
- [ ] 3D scene renders correctly
- [ ] UI overlay displays correctly

---

## Phase 1 Complete Checklist

Before proceeding to Phase 2, verify:

- [ ] Vite + React + TypeScript project initialized
- [ ] All dependencies installed (Three.js, R3F, Rapier, Zustand, Tailwind)
- [ ] Strict TypeScript configuration active
- [ ] Path aliases configured and working
- [ ] Tailwind CSS with custom theme configured
- [ ] ESLint with strict rules configured
- [ ] All directories created per project structure
- [ ] Core types defined in `src/types/index.ts`
- [ ] Game constants defined in `src/utils/constants.ts`
- [ ] Zustand game store created
- [ ] Basic App.tsx with 3D canvas and UI overlay
- [ ] All checks pass (`npm run types`, `npm run lint`)
- [ ] Dev server runs and displays test scene

---

**Next Phase:** Proceed to `02-arena-and-player.md`
