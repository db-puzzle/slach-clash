# Terrain System Specification

## Overview

This document defines the terrain elevation system for Slash & Clash, introducing three-dimensional landscapes with mountains, valleys, and slopes. The system is designed to support multiple map variations while maintaining consistent gameplay mechanics.

---

## Table of Contents

1. [Design Goals](#design-goals)
2. [Map System Architecture](#map-system-architecture)
3. [Terrain Generation](#terrain-generation)
4. [Player Movement on Terrain](#player-movement-on-terrain)
5. [Fall Damage](#fall-damage)
6. [Combat & Projectile Interactions](#combat--projectile-interactions)
7. [Camera Behavior](#camera-behavior)
8. [Obstacle Integration](#obstacle-integration)
9. [Technical Implementation](#technical-implementation)
10. [Future Maps](#future-maps)

---

## Design Goals

- Add strategic depth through three-dimensional terrain
- Create natural cover and tactical positioning opportunities
- Introduce risk/reward mechanics through elevation and fall damage
- Support multiple distinct map styles with a unified terrain system
- Maintain smooth, responsive gameplay on varied terrain

---

## Map System Architecture

### Multi-Map Support

The game will support multiple arena maps, each with distinct terrain characteristics. The terrain system must be designed as a modular, data-driven architecture.

```typescript
interface TerrainMap {
  id: string;
  name: string;
  style: 'smooth' | 'jagged' | 'mixed';
  heightmapConfig: HeightmapConfig;
  obstacles: ObstacleConfig[];
  spawnPoints: SpawnPoint[];
}
```

### Initial Map: Rolling Hills

The first implemented map features **smooth rolling hills** with gentle, natural-looking elevation changes. This serves as the baseline for testing terrain mechanics before introducing more dramatic landscapes.

---

## Terrain Generation

### Distribution

Terrain elevation features are **randomly scattered** across the arena. Each map uses procedural generation with seed-based randomization to ensure:

- Reproducible terrain for multiplayer synchronization
- Variety between matches when desired
- Fair distribution of tactical positions

### Elevation Ranges

The terrain system supports three elevation categories, all of which may appear in a single map:

| Category | Height Range | Slope Characteristics |
|----------|--------------|----------------------|
| Gentle | 1–3 units | Easily traversable, minimal speed impact |
| Moderate | 5–8 units | Noticeable speed changes, strategic positions |
| Dramatic | 10+ units | Major landmarks, potential fall damage zones |

### Heightmap Configuration

```typescript
interface HeightmapConfig {
  resolution: number;        // Grid resolution for height sampling
  baseFrequency: number;     // Primary noise frequency
  octaves: number;           // Noise detail layers
  persistence: number;       // Amplitude falloff per octave
  maxHeight: number;         // Maximum elevation from base (units)
  minHeight: number;         // Minimum elevation (valleys, can be negative)
  smoothness: number;        // Post-processing smoothing factor
  seed: number;              // Randomization seed
}
```

### Default Configuration (Rolling Hills)

```typescript
const ROLLING_HILLS_CONFIG: HeightmapConfig = {
  resolution: 128,
  baseFrequency: 0.02,
  octaves: 4,
  persistence: 0.5,
  maxHeight: 12,
  minHeight: -4,
  smoothness: 0.8,
  seed: 0, // 0 = random seed per match
};
```

---

## Player Movement on Terrain

### Speed Modifiers

Movement speed is affected by the terrain slope angle:

| Slope Direction | Speed Modifier | Description |
|-----------------|----------------|-------------|
| Uphill (steep) | 0.5x–0.7x | Significant slowdown climbing |
| Uphill (gentle) | 0.8x–0.95x | Slight slowdown |
| Flat | 1.0x | Normal speed |
| Downhill (gentle) | 1.05x–1.15x | Slight momentum boost |
| Downhill (steep) | 1.2x–1.4x | Significant momentum gain |

### Speed Calculation

```typescript
function calculateTerrainSpeedModifier(slopeAngle: number, movementDirection: Vector3): number {
  const slopeFactor = Vector3.dot(movementDirection, terrainNormal);
  
  if (slopeFactor > 0) {
    // Moving uphill
    return Math.max(0.5, 1 - (slopeFactor * 0.5));
  } else {
    // Moving downhill
    return Math.min(1.4, 1 + (Math.abs(slopeFactor) * 0.4));
  }
}
```

### Stamina

**Stamina is NOT affected by terrain.** Climbing hills does not consume additional stamina beyond normal movement costs. Sprint stamina cost remains constant regardless of slope.

### Steep Slope Behavior

Players **cannot climb steep slopes**. When a slope exceeds the maximum traversable angle:

- Player is blocked from moving further up
- Player slides downward if standing on an untraversable slope
- Visual feedback indicates the slope is too steep

```typescript
const MAX_TRAVERSABLE_SLOPE_ANGLE = 45; // degrees
const SLIDE_THRESHOLD_ANGLE = 50; // degrees - player begins sliding
const SLIDE_SPEED = 4; // units per second
```

---

## Fall Damage

### Damage Calculation

Falls from steep slopes or edges cause damage based on fall distance:

| Fall Distance | Damage | Notes |
|---------------|--------|-------|
| 0–3 units | 0 | Safe landing |
| 3–6 units | 1 | Minor damage |
| 6–10 units | 2 | Moderate damage |
| 10–15 units | 3 | Significant damage |
| 15+ units | 4+ | Severe damage (1 per 5 additional units) |

### Fall Damage Formula

```typescript
function calculateFallDamage(fallDistance: number): number {
  if (fallDistance <= 3) return 0;
  if (fallDistance <= 6) return 1;
  if (fallDistance <= 10) return 2;
  if (fallDistance <= 15) return 3;
  return 3 + Math.floor((fallDistance - 15) / 5);
}
```

### Fall Detection

- Track player's highest Y position during airborne state
- Calculate fall distance when player lands
- Apply damage and brief stagger on significant falls
- Visual/audio feedback on landing (dust particles, impact sound)

---

## Combat & Projectile Interactions

### Height Advantage

Height provides **visual and positional advantage only**. There are no damage modifiers based on elevation difference:

- Better visibility of the battlefield from elevated positions
- Easier aiming at targets below
- More exposure to ranged attacks from multiple angles

### Arrow Behavior

Arrows follow **natural arc trajectories** affected by elevation:

- Arrows fired from height travel further due to gravity
- Arrows fired uphill have reduced effective range
- Terrain blocks arrow paths (arrows collide with ground)

```typescript
interface ArrowPhysics {
  gravity: number;           // Gravity acceleration
  initialVelocity: number;   // Launch speed
  drag: number;              // Air resistance factor
}
```

### Bomb Behavior

Bombs interact dynamically with terrain:

- **Rolling**: Bombs roll downhill after landing based on slope angle
- **Bounce**: Bombs bounce on impact, affected by terrain angle
- **Fuse**: Standard 5-second fuse applies regardless of movement

```typescript
interface BombTerrainPhysics {
  rollFriction: number;      // Resistance to rolling
  bounceRestitution: number; // Bounciness on impact
  maxRollSpeed: number;      // Cap on roll velocity
}
```

### Explosion Line-of-Sight

Explosions are **blocked by terrain geometry**:

- Damage only applies to targets with line-of-sight to explosion center
- Terrain provides natural cover from blast damage
- Knockback is still applied if player is within radius (reduced by cover)

```typescript
function isInExplosionLineOfSight(
  explosionOrigin: Vector3,
  targetPosition: Vector3,
  terrainCollider: Collider
): boolean {
  const ray = new Ray(explosionOrigin, targetPosition.sub(explosionOrigin).normalize());
  const hit = terrainCollider.castRay(ray, targetPosition.distanceTo(explosionOrigin));
  return hit === null; // No terrain blocking
}
```

---

## Camera Behavior

### Terrain-Following Camera

The follow camera **tilts with terrain angle** to maintain spatial awareness:

- Camera pitch adjusts based on ground slope beneath player
- Smooth interpolation prevents jarring camera movements
- Maximum tilt angle capped to prevent disorientation

```typescript
interface TerrainCameraConfig {
  tiltInfluence: number;     // 0-1, how much terrain affects camera (0.6 recommended)
  tiltSmoothness: number;    // Interpolation speed (5-10 recommended)
  maxTiltAngle: number;      // Maximum pitch adjustment in degrees (15-20)
}
```

### Camera Tilt Implementation

```typescript
function updateCameraTilt(
  currentTilt: number,
  terrainNormal: Vector3,
  deltaTime: number,
  config: TerrainCameraConfig
): number {
  const targetTilt = Math.asin(terrainNormal.z) * config.tiltInfluence;
  const clampedTilt = clamp(targetTilt, -config.maxTiltAngle, config.maxTiltAngle);
  return lerp(currentTilt, clampedTilt, config.tiltSmoothness * deltaTime);
}
```

---

## Obstacle Integration

### Natural Terrain Features

Existing obstacle types (rocks, walls) are **replaced with natural terrain features** that emerge from the heightmap:

| Old Obstacle | New Terrain Feature |
|--------------|---------------------|
| Rocks | Rocky outcroppings, boulders integrated into hillsides |
| Walls | Cliff faces, ridgelines, natural barriers |

### Trees

Trees are a new natural obstacle type that provide cover and visual variety:

| Tree Type | Size | Collision | Placement |
|-----------|------|-----------|-----------|
| Pine | Tall, narrow | Trunk only | Hillsides, clusters |
| Oak | Medium, wide canopy | Trunk only | Flat areas, scattered |
| Dead Tree | Small, bare | Full mesh | Valleys, sparse |

**Tree Behavior:**

- **Collision**: Only the trunk is collidable; canopy is visual only
- **Projectiles**: Arrows and bombs collide with trunks, pass through leaves
- **Line of Sight**: Trunks block explosion damage, canopy does not
- **Placement**: Trees spawn on slopes up to 30 degrees, avoiding steep cliffs

```typescript
interface TreeConfig {
  type: 'pine' | 'oak' | 'dead';
  trunkRadius: number;      // Collision radius
  trunkHeight: number;      // Collision height
  canopyRadius: number;     // Visual canopy size
  maxPlacementSlope: number; // Maximum slope for spawning (degrees)
}

const TREE_TYPES: Record<string, TreeConfig> = {
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
```

### Flat Section Obstacles

Traditional obstacles (rocks, walls) are **retained only on flat terrain sections**:

- Flat areas defined as slopes < 10 degrees
- Obstacles spawn at valid flat positions
- Reduced obstacle count compared to previous flat arena

### Obstacle Placement Rules

```typescript
interface ObstaclePlacementConfig {
  maxSlopeForPlacement: number;  // Maximum slope angle (degrees) for obstacle spawning
  minDistanceFromEdge: number;   // Buffer from arena boundaries
  minDistanceBetween: number;    // Minimum spacing between obstacles
  flatAreaBias: number;          // Preference for truly flat areas (0-1)
}

const DEFAULT_OBSTACLE_PLACEMENT: ObstaclePlacementConfig = {
  maxSlopeForPlacement: 10,
  minDistanceFromEdge: 5,
  minDistanceBetween: 8,
  flatAreaBias: 0.7,
};
```

---

## Technical Implementation

### Heightmap Mesh Generation

1. Generate noise-based heightmap data
2. Create subdivided plane geometry
3. Displace vertices based on heightmap values
4. Compute vertex normals for lighting
5. Generate physics collider from geometry

### Physics Collider

Use **trimesh collider** for accurate terrain collision:

```typescript
// Rapier physics configuration
<RigidBody type="fixed" colliders="trimesh">
  <mesh geometry={terrainGeometry}>
    <meshStandardMaterial map={terrainTexture} />
  </mesh>
</RigidBody>
```

### Performance Considerations

- **LOD System**: Reduce geometry detail at distance
- **Chunking**: Divide large terrains into manageable chunks
- **Collider Optimization**: Simplified collision mesh vs render mesh
- **Texture Splatting**: Blend textures based on slope/height for visual variety

### Terrain Data Structure

```typescript
interface TerrainData {
  heightmap: Float32Array;       // Height values
  normalmap: Float32Array;       // Pre-computed normals
  width: number;
  depth: number;
  resolution: number;
  
  // Helper methods
  getHeightAt(x: number, z: number): number;
  getNormalAt(x: number, z: number): Vector3;
  getSlopeAt(x: number, z: number): number;
}
```

---

## Future Maps

The terrain system is designed to support diverse map styles in future updates:

### Planned Map Styles

| Map Name | Style | Key Features |
|----------|-------|--------------|
| Rolling Hills | Smooth | Gentle slopes, open sightlines, beginner-friendly |
| Craggy Peaks | Jagged | Sharp cliffs, narrow paths, high fall damage risk |
| Canyon Arena | Mixed | Central valley with steep walls, vertical combat |
| Volcanic Rim | Dramatic | Extreme elevation, hazard zones, limited safe areas |
| Archipelago | Varied | Multiple elevated islands, gaps between platforms |

### Map Configuration Examples

```typescript
const CRAGGY_PEAKS_CONFIG: HeightmapConfig = {
  resolution: 128,
  baseFrequency: 0.04,
  octaves: 6,
  persistence: 0.6,
  maxHeight: 20,
  minHeight: -2,
  smoothness: 0.3,  // Less smoothing = more jagged
  seed: 0,
};

const CANYON_ARENA_CONFIG: HeightmapConfig = {
  resolution: 128,
  baseFrequency: 0.015,
  octaves: 3,
  persistence: 0.7,
  maxHeight: 15,
  minHeight: -8,  // Deep central valley
  smoothness: 0.5,
  seed: 0,
};
```

### Map Selection System

```typescript
interface MapRegistry {
  maps: Map<string, TerrainMap>;
  currentMap: string;
  
  loadMap(mapId: string): Promise<void>;
  getAvailableMaps(): TerrainMap[];
  getRandomMap(): TerrainMap;
}
```

---

## Constants Reference

Add the following to `constants.ts`:

```typescript
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
```

---

## Implementation Phases

### Phase 1: Core Terrain

- [ ] Heightmap generation system
- [ ] Terrain mesh rendering
- [ ] Physics collider integration
- [ ] Basic player movement on slopes

### Phase 2: Movement Mechanics

- [ ] Speed modifiers based on slope
- [ ] Steep slope blocking
- [ ] Sliding on untraversable slopes
- [ ] Fall damage system

### Phase 3: Combat Integration

- [ ] Arrow arc physics with terrain
- [ ] Bomb rolling mechanics
- [ ] Explosion line-of-sight blocking

### Phase 4: Camera & Polish

- [ ] Terrain-following camera tilt
- [ ] Visual feedback (dust, impact effects)
- [ ] Terrain texturing and detail

### Phase 5: Multi-Map Support

- [ ] Map registry and loading system
- [ ] Additional map configurations
- [ ] Map selection UI

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-14 | Initial specification |
