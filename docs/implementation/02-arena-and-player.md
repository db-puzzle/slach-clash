# Phase 2: Arena and Player Controller

## Overview

Create the 3D arena environment with procedural terrain, implement the player character with terrain-aware movement controls, and fixed follow camera with terrain tilt.

**Estimated Time:** 6-8 hours  
**Prerequisites:** Phase 1 complete

---

## Task 2.1: Create Terrain Generation System

### Objective
Build a procedural heightmap-based terrain generation system using Perlin noise.

### File: `client/src/game/terrain/TerrainGenerator.ts`
```typescript
import type { HeightmapConfig, TerrainData } from '@/types';
import { ARENA_WIDTH, ARENA_DEPTH, ROLLING_HILLS_CONFIG } from '@/utils/constants';

// Perlin noise implementation with permutation table
const PERMUTATION = [/* 256 values for noise generation */];

function createPermutationTable(seed: number): number[] {
  // Shuffle permutation based on seed for reproducibility
  // Double the table to avoid index wrapping
}

function perlin2D(x: number, y: number, perm: number[]): number {
  // 2D Perlin noise implementation
  // Returns value between -1 and 1
}

export function generateTerrain(config: HeightmapConfig = ROLLING_HILLS_CONFIG): TerrainData {
  const { resolution, baseFrequency, octaves, persistence, maxHeight, minHeight, smoothness, seed } = config;
  const actualSeed = seed === 0 ? Math.floor(Math.random() * 10000) : seed;
  
  const perm = createPermutationTable(actualSeed);
  const heightmap = new Float32Array(resolution * resolution);
  const normalmap = new Float32Array(resolution * resolution * 3);
  
  // Generate heightmap using fractal noise (multiple octaves)
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      // Accumulate noise at different frequencies
      // Scale to height range
    }
  }
  
  applySmoothing(heightmap, resolution, smoothness);
  calculateNormals(heightmap, normalmap, resolution, ARENA_WIDTH, ARENA_DEPTH);
  
  return { heightmap, normalmap, width: ARENA_WIDTH, depth: ARENA_DEPTH, resolution, config };
}

// Helper functions for terrain queries
export function getHeightAt(terrain: TerrainData, x: number, z: number): number;
export function getNormalAt(terrain: TerrainData, x: number, z: number): { x: number; y: number; z: number };
export function getSlopeAngle(terrain: TerrainData, x: number, z: number): number;
```

### File: `client/src/game/terrain/index.ts`
```typescript
export { 
  generateTerrain, 
  getHeightAt, 
  getNormalAt, 
  getSlopeAngle 
} from './TerrainGenerator';
```

### Acceptance Criteria
- [x] Heightmap generated from Perlin noise
- [x] Normals calculated correctly
- [x] Height queries work at any position with bilinear interpolation
- [x] Slope angle calculation works
- [x] Smoothness parameter affects terrain
- [x] Seed-based reproducibility for multiplayer sync

---

## Task 2.2: Create Terrain Mesh with Vertex Colors

### Objective
Build the terrain mesh from heightmap data with physics collider and visual texture splatting using vertex colors.

### File: `client/src/game/world/TerrainMesh.tsx`
```typescript
import { useMemo, useRef } from 'react';
import { PlaneGeometry, Mesh, Color, Float32BufferAttribute } from 'three';
import { RigidBody } from '@react-three/rapier';
import type { TerrainData } from '@/types';
import { ARENA_WIDTH, ARENA_DEPTH, MAX_TRAVERSABLE_SLOPE, SLIDE_THRESHOLD_SLOPE } from '@/utils/constants';

// Color palette for terrain texture splatting
const COLORS = {
  grass: new Color('#4a7c3f'),    // Rich green - flat, low areas
  dirt: new Color('#8b6914'),     // Brown - mid elevation
  rock: new Color('#6b6b6b'),     // Gray - high elevation or steep
  snow: new Color('#e8f0ff'),     // Off-white - mountain peaks
  warning: new Color('#8b4a4a'),  // Red-brown - unclimbable slopes
};

export function TerrainMesh({ terrain }: { terrain: TerrainData }): React.JSX.Element {
  const geometry = useMemo(() => {
    const { heightmap, normalmap, resolution, config } = terrain;
    const { minHeight, maxHeight } = config;
    
    const geo = new PlaneGeometry(ARENA_WIDTH, ARENA_DEPTH, resolution - 1, resolution - 1);
    geo.rotateX(-Math.PI / 2);
    
    const positions = geo.attributes['position'];
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      // Displace Y based on heightmap
      // Calculate vertex color based on:
      // - Height (grass → dirt → rock → snow)
      // - Slope angle (steep = more rock, very steep = warning color)
      // - Noise variation for natural look
    }
    
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [terrain]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial 
          vertexColors={true}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
    </RigidBody>
  );
}
```

### Texture Splatting Logic
Colors are blended based on:

| Factor | Low Value | High Value |
|--------|-----------|------------|
| Height (0-1) | Grass | Snow |
| Slope (0-90°) | Original color | Rock |
| Slope (>40°) | Original color | Warning (red-brown) |

### Acceptance Criteria
- [x] Terrain mesh generates from heightmap
- [x] Terrain shows elevation variation (hills, valleys)
- [x] Vertex colors show height-based coloring
- [x] Steep slopes show warning colors (red-brown)
- [x] Trimesh physics collider works
- [x] Player can walk on terrain surface
- [x] Shadows cast and receive properly

---

## Task 2.3: Create Trees

### Objective
Add tree obstacles with trunk-only collision.

### File: `client/src/game/world/Trees.tsx`
```typescript
import { RigidBody } from '@react-three/rapier';
import { TREE_TYPES } from '@/utils/constants';

interface TreeProps {
  position: [number, number, number];
  type: 'pine' | 'oak' | 'dead';
}

function PineTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  const config = TREE_TYPES['pine'];
  return (
    <group position={position}>
      {/* Trunk - has collision */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, config.trunkHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[config.trunkRadius, config.trunkRadius * 1.2, config.trunkHeight, 8]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Canopy - visual only, no collision */}
      <mesh position={[0, config.trunkHeight * 0.7, 0]} castShadow>
        <coneGeometry args={[config.canopyRadius, config.trunkHeight * 0.8, 8]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Similar implementations for OakTree and DeadTree

export function Tree({ position, type }: TreeProps): React.JSX.Element {
  switch (type) {
    case 'pine': return <PineTree position={position} />;
    case 'oak': return <OakTree position={position} />;
    case 'dead': return <DeadTree position={position} />;
  }
}
```

### Tree Types

| Type | Trunk Collision | Canopy | Placement Slope Limit |
|------|----------------|--------|----------------------|
| Pine | Cuboid (narrow) | 2 cones | 30° |
| Oak | Cuboid (wide) | Sphere | 20° |
| Dead | Hull (with branches) | None | 35° |

### Acceptance Criteria
- [x] Three tree types render correctly
- [x] Trunk collision only (canopy passes through)
- [x] Trees cast shadows

---

## Task 2.4: Create Terrain-Aware Obstacles

### Objective
Place rocks and trees based on terrain slope.

### File: `client/src/game/world/Obstacles.tsx`
```typescript
import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Tree } from './Trees';
import type { TerrainData } from '@/types';
import { getHeightAt, getSlopeAngle } from '@/game/terrain';
import { OBSTACLE_PLACEMENT, TREE_TYPES, ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';

function generateObstacles(terrain: TerrainData, seed: number) {
  const rng = createSeededRandom(seed);
  const rocks = [];
  const trees = [];
  
  // Generate rocks on flat areas (slope < 10°)
  for (let i = 0; i < 10; i++) {
    const x = (rng() - 0.5) * (ARENA_WIDTH - minDistanceFromEdge * 2);
    const z = (rng() - 0.5) * (ARENA_DEPTH - minDistanceFromEdge * 2);
    const slope = getSlopeAngle(terrain, x, z);
    
    if (slope < maxSlopeForPlacement && isValidPlacement(...)) {
      const y = getHeightAt(terrain, x, z);
      rocks.push({ position: [x, y + size * 0.5, z], size });
    }
  }
  
  // Generate trees based on their maxPlacementSlope
  for (let i = 0; i < 25; i++) {
    // Similar logic with tree-specific slope limits
  }
  
  return { rocks, trees };
}

export function Obstacles({ terrain, seed = 42 }: ObstaclesProps): React.JSX.Element {
  const { rocks, trees } = useMemo(() => generateObstacles(terrain, seed), [terrain, seed]);
  
  return (
    <group>
      {rocks.map((rock, i) => <Rock key={`rock-${i}`} {...rock} />)}
      {trees.map((tree, i) => <Tree key={`tree-${i}`} {...tree} />)}
    </group>
  );
}
```

### Placement Rules (from constants)
```typescript
export const OBSTACLE_PLACEMENT = {
  maxSlopeForPlacement: 10,  // Rocks only on flat terrain
  minDistanceFromEdge: 5,
  minDistanceBetween: 8,
  flatAreaBias: 0.7,
};
```

### Acceptance Criteria
- [x] Rocks placed on flat terrain sections
- [x] Trees placed based on their slope limits
- [x] Procedural placement is deterministic with seed
- [x] Minimum spacing between obstacles respected
- [x] Objects placed at correct terrain height

---

## Task 2.5: Create Arena Boundaries

### Objective
Add invisible walls at arena edges that account for terrain height.

### File: `client/src/game/world/Boundaries.tsx`
```typescript
import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH, ROLLING_HILLS_CONFIG } from '@/utils/constants';

export function Boundaries(): React.JSX.Element {
  // Account for terrain height range
  const terrainHeightRange = ROLLING_HILLS_CONFIG.maxHeight - ROLLING_HILLS_CONFIG.minHeight;
  const wallHeight = terrainHeightRange + 10;
  const wallY = (ROLLING_HILLS_CONFIG.minHeight + ROLLING_HILLS_CONFIG.maxHeight) / 2;

  return (
    <group>
      {/* Four invisible walls at arena edges */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, wallY, -halfDepth]}>
        <mesh visible={false}>
          <boxGeometry args={[ARENA_WIDTH, wallHeight, 1]} />
        </mesh>
      </RigidBody>
      {/* ... North, South, East, West walls */}
    </group>
  );
}
```

### Acceptance Criteria
- [x] Invisible walls at all 4 edges
- [x] Walls cover full terrain height range
- [x] Player cannot leave arena bounds

---

## Task 2.6: Combine World Components

### Objective
Create a World component with TerrainContext for sharing terrain data.

### File: `client/src/game/world/World.tsx`
```typescript
import { useMemo, createContext, useContext } from 'react';
import { TerrainMesh } from './TerrainMesh';
import { Obstacles } from './Obstacles';
import { Boundaries } from './Boundaries';
import { generateTerrain } from '@/game/terrain';
import { ROLLING_HILLS_CONFIG } from '@/utils/constants';
import type { TerrainData } from '@/types';

// Context for sharing terrain data with Player and Camera
export const TerrainContext = createContext<TerrainData | null>(null);

export function useTerrainData(): TerrainData | null {
  return useContext(TerrainContext);
}

export function World({ seed = 0 }: { seed?: number }): React.JSX.Element {
  const terrain = useMemo(() => {
    const config = { ...ROLLING_HILLS_CONFIG, seed };
    return generateTerrain(config);
  }, [seed]);

  return (
    <TerrainContext.Provider value={terrain}>
      <group>
        <TerrainMesh terrain={terrain} />
        <Obstacles terrain={terrain} seed={seed} />
        <Boundaries />
      </group>
    </TerrainContext.Provider>
  );
}
```

### File: `client/src/game/world/index.ts`
```typescript
export { Arena } from './Arena';
export { TerrainMesh } from './TerrainMesh';
export { Obstacles } from './Obstacles';
export { Tree } from './Trees';
export { Boundaries } from './Boundaries';
export { World, TerrainContext, useTerrainData } from './World';
```

### Acceptance Criteria
- [x] World component renders terrain and obstacles
- [x] Terrain data shared via context
- [x] Seed parameter for reproducible terrain

---

## Task 2.7: Create Input Handler Hook

### Objective
Capture keyboard input for player controls.

### File: `client/src/hooks/useInput.ts`
```typescript
import { useEffect, useCallback, useState } from 'react';
import type { InputState, WeaponSlot } from '@/types';

const WEAPON_KEY_MAP: Record<string, WeaponSlot> = {
  '1': 'sword', '2': 'spear', '3': 'club',
  '4': 'bow', '5': 'shield', '6': 'bomb',
};

export function useInput(): { input: InputState; isMouseDown: boolean; isRightMouseDown: boolean } {
  // Track WASD, Space, Q/E, 1-6, mouse buttons
  // Prevent default for game keys
  // Prevent right-click context menu
}
```

### Acceptance Criteria
- [x] WASD keys detected
- [x] Space (sprint) detected
- [x] Mouse buttons detected (left = attack, right = block)
- [x] Number keys 1-6 detected for weapon switching
- [x] Q/E weapon cycling detected
- [x] Right-click menu prevented

---

## Task 2.8: Create Player Character Model

### Objective
Build a stylized block-based humanoid character.

### File: `client/src/game/entities/PlayerModel.tsx`
```typescript
export function PlayerModel({ color, isBlocking = false }: PlayerModelProps): React.JSX.Element {
  // Body proportions (stylized, blocky)
  const bodyHeight = 0.8;
  const bodyWidth = 0.5;
  const headSize = 0.35;
  const limbWidth = 0.15;

  return (
    <group>
      {/* Body - colored by team */}
      <mesh position={[0, bodyHeight / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[bodyWidth, bodyHeight, bodyWidth * 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head - skin tone */}
      {/* Arms - blocking pose when isBlocking */}
      {/* Legs - dark pants */}
    </group>
  );
}
```

### Acceptance Criteria
- [x] Block-based humanoid visible
- [x] Body, head, arms, legs rendered
- [x] Color prop affects body/arms
- [x] Blocking pose changes arm position

---

## Task 2.9: Create Terrain-Aware Player Controller

### Objective
Implement player movement with terrain-aware physics, slope speed modifiers, and sprint.

### File: `client/src/game/entities/Player.tsx`
```typescript
import { useTerrainData } from '@/game/world';
import { getHeightAt, getNormalAt, getSlopeAngle } from '@/game/terrain';
import {
  WALK_SPEED, SPRINT_SPEED, SPRINT_STAMINA_COST, MAX_STAMINA, STAMINA_RECOVERY_RATE,
  MAX_TRAVERSABLE_SLOPE, SLIDE_THRESHOLD_SLOPE, SLIDE_SPEED,
  TERRAIN_SPEED_UPHILL_MIN, TERRAIN_SPEED_DOWNHILL_MAX,
} from '@/utils/constants';

// Calculate speed modifier based on slope and movement direction
function calculateTerrainSpeedModifier(slopeAngle, terrainNormal, movementDirection): number {
  const slopeFactor = terrainNormal.x * movementDirection.x + terrainNormal.z * movementDirection.z;
  
  if (slopeFactor > 0) {
    // Moving uphill - slower
    return Math.max(TERRAIN_SPEED_UPHILL_MIN, 1 - (slopeAngle / 90) * 0.5);
  } else {
    // Moving downhill - faster
    return Math.min(TERRAIN_SPEED_DOWNHILL_MAX, 1 + (slopeAngle / 90) * 0.4);
  }
}

export function Player({ playerId, startPosition, color, isLocal }): React.JSX.Element {
  const terrain = useTerrainData();
  
  useFrame((_, delta) => {
    // Get terrain info at player position
    const terrainHeight = getHeightAt(terrain, pos.x, pos.z);
    const terrainNormal = getNormalAt(terrain, pos.x, pos.z);
    const slopeAngle = getSlopeAngle(terrain, pos.x, pos.z);
    
    // Check slope limits
    const canTraverse = slopeAngle < MAX_TRAVERSABLE_SLOPE;
    const shouldSlide = slopeAngle >= SLIDE_THRESHOLD_SLOPE;
    
    // Block uphill movement on steep slopes
    if (!canTraverse && movingUphill) {
      moveDirection.set(0, 0, 0);
    }
    
    // Apply terrain speed modifier
    speed *= calculateTerrainSpeedModifier(slopeAngle, terrainNormal, moveDirection);
    
    // Apply sliding on very steep slopes
    if (shouldSlide && isOnGround) {
      velocity.x += slideDirection.x * SLIDE_SPEED;
      velocity.z += slideDirection.z * SLIDE_SPEED;
    }
    
    // Update stamina (NOT affected by terrain)
    // Track fall height for fall damage
  });

  // Spawn at correct terrain height
  const initialY = getHeightAt(terrain, startPosition[0], startPosition[2]) + 1;
  
  return (
    <RigidBody position={[startPosition[0], initialY, startPosition[2]]} ...>
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
      <PlayerModel color={color} isBlocking={player?.isBlocking} />
    </RigidBody>
  );
}
```

### Movement Speed Modifiers

| Slope Direction | Speed Modifier | Description |
|-----------------|----------------|-------------|
| Uphill (steep) | 0.5x–0.7x | Significant slowdown |
| Uphill (gentle) | 0.8x–0.95x | Slight slowdown |
| Flat | 1.0x | Normal speed |
| Downhill (gentle) | 1.05x–1.15x | Slight boost |
| Downhill (steep) | 1.2x–1.4x | Significant boost |

### Slope Behavior

| Slope Angle | Behavior |
|-------------|----------|
| 0-45° | Normal movement with speed modifier |
| 45-50° | Blocked from climbing, can descend |
| >50° | Forced sliding downhill |

### Acceptance Criteria
- [x] Player spawns at terrain height
- [x] WASD moves player in correct directions
- [x] Movement speed modified by terrain slope
- [x] Uphill movement is slower
- [x] Downhill movement is faster
- [x] Steep slopes (>45°) block upward movement
- [x] Very steep slopes (>50°) cause sliding
- [x] Sprint with stamina drain/recovery
- [x] Stamina NOT affected by terrain slope
- [x] Player rotates to face movement direction
- [x] Fall height tracked for fall damage system

---

## Task 2.10: Create Terrain-Following Camera

### Objective
Implement a camera that follows behind the player with terrain-aware tilt.

### File: `client/src/game/entities/FollowCamera.tsx`
```typescript
import { useTerrainData } from '@/game/world';
import { getNormalAt } from '@/game/terrain';
import { CAMERA_TILT_INFLUENCE, CAMERA_TILT_SMOOTHNESS, CAMERA_MAX_TILT_ANGLE } from '@/utils/constants';

export function FollowCamera({ playerId, distance = 12, height = 8, smoothness = 5 }): null {
  const terrain = useTerrainData();
  const currentTilt = useRef(0);

  useFrame((_, delta) => {
    // Position camera behind player
    const offsetX = -Math.sin(rotation) * distance;
    const offsetZ = -Math.cos(rotation) * distance;
    
    // Smooth camera movement
    currentPosition.lerp(targetPosition, smoothness * delta);
    
    // Calculate terrain tilt from ground normal
    if (terrain) {
      const terrainNormal = getNormalAt(terrain, position.x, position.z);
      const targetTilt = Math.asin(terrainNormal.z) * CAMERA_TILT_INFLUENCE;
      const clampedTilt = clamp(targetTilt, -maxTiltRad, maxTiltRad);
      currentTilt.current += (clampedTilt - currentTilt.current) * CAMERA_TILT_SMOOTHNESS * delta;
    }
    
    // Apply tilt to camera
    camera.lookAt(player);
    euler.x += currentTilt.current;
  });
}
```

### Camera Tilt Settings (from constants)
```typescript
export const CAMERA_TILT_INFLUENCE = 0.6;    // How much terrain affects tilt
export const CAMERA_TILT_SMOOTHNESS = 8;     // Interpolation speed
export const CAMERA_MAX_TILT_ANGLE = 18;     // Maximum degrees
```

### Acceptance Criteria
- [x] Camera follows player position
- [x] Camera stays behind player based on rotation
- [x] Camera movement is smooth (lerped)
- [x] Camera tilts with terrain slope
- [x] Tilt is clamped to maximum angle
- [x] Tilt interpolation is smooth

---

## Task 2.11: Enhanced Lighting and Fog

### Objective
Set up visually appealing lighting with shadows and fog for depth perception.

### File: `client/src/App.tsx` (GameScene lighting)
```typescript
function GameScene(): React.JSX.Element {
  return (
    <>
      {/* === ENHANCED LIGHTING === */}
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#b4c4d4" />
      
      {/* Main directional light (sun) with high-res shadows */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      {/* Fill light from opposite direction */}
      <directionalLight position={[-20, 30, -15]} intensity={0.3} color="#8ba4c4" />
      
      {/* Hemisphere light for sky/ground contrast */}
      <hemisphereLight args={['#87ceeb', '#3d5a3d', 0.4]} />
      
      {/* Point light for warm highlights */}
      <pointLight position={[0, 20, 0]} intensity={0.2} color="#ffcc88" distance={80} />

      {/* === FOG FOR DEPTH PERCEPTION === */}
      <fog attach="fog" args={['#a8c4d4', 40, 120]} />
      
      {/* Sky background */}
      <color attach="background" args={['#87b8d8']} />
      
      <Physics gravity={[0, -20, 0]}>
        <World seed={terrainSeed} />
        <Player ... />
      </Physics>
    </>
  );
}
```

### Acceptance Criteria
- [x] Main sun light with high-resolution shadows
- [x] Fill light for softer shadows
- [x] Hemisphere light for ambient contrast
- [x] Distance fog for depth perception
- [x] Sky background color

---

## Task 2.12: Create Entity Index

### File: `client/src/game/entities/index.ts`
```typescript
export { Player } from './Player';
export { PlayerModel } from './PlayerModel';
export { FollowCamera } from './FollowCamera';
```

---

## Task 2.13: UI Components

### Objective
Add HUD elements for terrain information.

### File: `client/src/App.tsx` (UI components)
```typescript
function TerrainLegend(): React.JSX.Element {
  return (
    <div className="absolute bottom-4 right-4 p-3 bg-game-dark/80 rounded-lg">
      <p className="text-game-accent font-bold mb-2">Terrain Guide</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#4a7c3f' }} />
          <span className="text-white">Grass (flat, easy)</span>
        </div>
        {/* Dirt, Rock, Warning, Snow indicators */}
      </div>
    </div>
  );
}

function TerrainInfo(): React.JSX.Element {
  return (
    <div className="absolute top-4 left-4 p-3 bg-game-dark/80 rounded-lg">
      <p className="text-game-accent font-bold">Rolling Hills Arena</p>
      <p className="text-white/70">Height range: -4m to 12m</p>
      <p className="text-yellow-400/80">⚠️ Red-brown areas are too steep to climb!</p>
    </div>
  );
}

function HUD(): React.JSX.Element {
  // Shows Health, Stamina, Weapon, Sprint status, and Height
}
```

### Acceptance Criteria
- [x] Terrain legend shows color meanings
- [x] Terrain info shows height range
- [x] Warning about steep areas
- [x] HUD shows player height

---

## Phase 2 Complete Checklist

Before proceeding to Phase 3, verify:

- [x] Terrain heightmap generation with Perlin noise
- [x] Terrain mesh renders with vertex color splatting
- [x] Height-based coloring (grass → dirt → rock → snow)
- [x] Slope-based coloring (steep = rock, very steep = warning)
- [x] Terrain physics collider works (trimesh)
- [x] Trees spawn on appropriate slopes with trunk collision
- [x] Rocks spawn on flat areas
- [x] Invisible boundary walls cover terrain height
- [x] Input hook captures all controls
- [x] Block-style player model rendered
- [x] Player spawns at terrain height
- [x] WASD movement working correctly
- [x] Slope speed modifiers (uphill slower, downhill faster)
- [x] Steep slopes block movement (>45°)
- [x] Very steep slopes cause sliding (>50°)
- [x] Sprint with stamina drain/recovery
- [x] Stamina NOT affected by terrain
- [x] Terrain-following camera with tilt
- [x] Enhanced lighting with shadows
- [x] Fog for depth perception
- [x] Terrain legend and info UI
- [x] `npm run types` passes
- [x] `npm run lint` passes

---

**Next Phase:** Proceed to `03-combat-system.md`
