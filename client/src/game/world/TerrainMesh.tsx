import { useMemo, useRef } from 'react';
import { PlaneGeometry, Mesh, Color, Float32BufferAttribute } from 'three';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import type { TerrainData } from '@/types';
import { ARENA_WIDTH, ARENA_DEPTH, MAX_TRAVERSABLE_SLOPE, SLIDE_THRESHOLD_SLOPE } from '@/utils/constants';
import { useDebugStore } from '@/stores/debugStore';

interface TerrainMeshProps {
  terrain: TerrainData;
}

// Color palette for terrain - cleaner elevation-based scheme
const COLORS = {
  // Elevation colors
  grassLow: new Color('#3d8c3a'),    // Bright green for low valleys
  grassMid: new Color('#5a9c4a'),    // Lighter green for low-mid
  dirt: new Color('#9a7b4a'),        // Brown for mid elevations
  dirtDark: new Color('#7a5a32'),    // Darker brown
  rock: new Color('#707070'),        // Gray rock for steep areas
  rockDark: new Color('#505050'),    // Darker gray for very steep
  snow: new Color('#f0f8ff'),        // White snow for peaks
  snowTransition: new Color('#d0e0f0'), // Blue-tinted snow transition
};

// Simple noise function for color variation
function simpleNoise(x: number, z: number): number {
  return (Math.sin(x * 0.5) * Math.cos(z * 0.7) + 
          Math.sin(x * 1.3 + z * 0.9) * 0.5 + 
          Math.cos(x * 0.3 - z * 1.1) * 0.3) * 0.5 + 0.5;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerpColor(color1: Color, color2: Color, t: number, target: Color): Color {
  target.r = color1.r + (color2.r - color1.r) * t;
  target.g = color1.g + (color2.g - color1.g) * t;
  target.b = color1.b + (color2.b - color1.b) * t;
  return target;
}

export function TerrainMesh({ terrain }: TerrainMeshProps): React.JSX.Element {
  const meshRef = useRef<Mesh>(null);
  
  const geometry = useMemo(() => {
    const { heightmap, normalmap, resolution, config } = terrain;
    const segments = resolution - 1;
    const { minHeight, maxHeight } = config;
    const heightRange = maxHeight - minHeight;
    
    // Create subdivided plane
    const geo = new PlaneGeometry(ARENA_WIDTH, ARENA_DEPTH, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    // Displace vertices based on heightmap
    const positions = geo.attributes['position'];
    if (!positions) return geo;
    
    // Create vertex colors array
    const colors = new Float32Array(positions.count * 3);
    const tempColor = new Color();
    const blendColor = new Color();
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Map vertex position to heightmap index
      const hx = Math.floor(((x / ARENA_WIDTH) + 0.5) * (resolution - 1));
      const hz = Math.floor(((z / ARENA_DEPTH) + 0.5) * (resolution - 1));
      
      // Clamp indices to valid range
      const clampedHx = Math.max(0, Math.min(resolution - 1, hx));
      const clampedHz = Math.max(0, Math.min(resolution - 1, hz));
      const index = clampedHz * resolution + clampedHx;
      
      const height = heightmap[index] ?? 0;
      positions.setY(i, height);
      
      // Get normal for slope calculation
      const normalIndex = index * 3;
      const normalY = normalmap[normalIndex + 1] ?? 1;
      
      // Calculate slope angle in degrees (normalY = 1 means flat, 0 means vertical)
      const slopeAngle = Math.acos(Math.max(0, Math.min(1, normalY))) * (180 / Math.PI);
      
      // Normalize height to 0-1
      const normalizedHeight = Math.max(0, Math.min(1, (height - minHeight) / heightRange));
      
      // Add noise variation for natural look
      const noise = simpleNoise(x, z);
      const colorNoise = noise * 0.12;
      
      // === SIMPLE ELEVATION-BASED COLORING ===
      // Low (0-0.45): Green grass - most of the map
      // Mid (0.45-0.75): Brown dirt - hills and plateaus
      // High (0.75-1.0): White snow - peaks only
      
      if (normalizedHeight < 0.45) {
        // Low elevation = GREEN (grass) - largest zone
        const t = normalizedHeight / 0.45;
        lerpColor(COLORS.grassLow, COLORS.grassMid, t + colorNoise, tempColor);
      } else if (normalizedHeight < 0.75) {
        // Mid elevation = BROWN (dirt)
        const t = (normalizedHeight - 0.45) / 0.30;
        if (t < 0.25) {
          // Transition from grass to dirt
          const transitionT = t / 0.25;
          lerpColor(COLORS.grassMid, COLORS.dirt, transitionT, tempColor);
        } else {
          // Pure dirt zone
          lerpColor(COLORS.dirt, COLORS.dirtDark, (t - 0.25) / 0.75 + colorNoise * 0.5, tempColor);
        }
      } else {
        // High elevation = WHITE (snow) - rare peaks
        const t = (normalizedHeight - 0.75) / 0.25;
        if (t < 0.35) {
          // Transition from dirt to snow
          const transitionT = t / 0.35;
          lerpColor(COLORS.dirtDark, COLORS.snowTransition, transitionT, tempColor);
        } else {
          // Snow zone
          lerpColor(COLORS.snowTransition, COLORS.snow, (t - 0.35) / 0.65, tempColor);
        }
      }
      
      // === STEEP SLOPES = GRAY ROCK ===
      // Steep areas get gray rock regardless of elevation
      const steepStart = 25;  // Start showing rock at 25°
      const verysteep = MAX_TRAVERSABLE_SLOPE;  // 45° - unclimbable
      
      if (slopeAngle >= steepStart) {
        const rockFactor = smoothstep(steepStart, verysteep, slopeAngle);
        
        if (slopeAngle >= verysteep) {
          // Unclimbable = dark gray rock
          const darkFactor = smoothstep(verysteep, SLIDE_THRESHOLD_SLOPE + 15, slopeAngle);
          lerpColor(COLORS.rock, COLORS.rockDark, darkFactor, blendColor);
          lerpColor(tempColor, blendColor, 0.9, tempColor);
        } else {
          // Approaching steep = lighter rock blend
          lerpColor(tempColor, COLORS.rock, rockFactor * 0.7, tempColor);
        }
      }
      
      // Apply subtle noise variation
      tempColor.multiplyScalar(0.9 + colorNoise * 0.2);
      
      // Slight ambient occlusion in valleys
      const aoFactor = 0.88 + smoothstep(0, 0.3, normalizedHeight) * 0.12;
      tempColor.multiplyScalar(aoFactor);
      
      // Store color
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }
    
    positions.needsUpdate = true;
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [terrain]);

  // Create low-resolution collision geometry for physics
  // Using 64x64 resolution trimesh to reduce triangle edge snagging
  const collisionGeometry = useMemo(() => {
    const { heightmap, resolution } = terrain;
    
    // Lower resolution for collision - reduces snagging on triangle edges
    const collisionRes = 64;
    const segments = collisionRes - 1;
    
    const geo = new PlaneGeometry(ARENA_WIDTH, ARENA_DEPTH, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    const positions = geo.attributes['position'];
    if (!positions) return geo;
    
    // Sample heights from the full resolution heightmap
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Map vertex position to heightmap index
      const hx = Math.floor(((x / ARENA_WIDTH) + 0.5) * (resolution - 1));
      const hz = Math.floor(((z / ARENA_DEPTH) + 0.5) * (resolution - 1));
      
      const clampedHx = Math.max(0, Math.min(resolution - 1, hx));
      const clampedHz = Math.max(0, Math.min(resolution - 1, hz));
      const index = clampedHz * resolution + clampedHx;
      
      const height = heightmap[index] ?? 0;
      positions.setY(i, height);
    }
    
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    
    return geo;
  }, [terrain]);

  // Extract vertices and indices from collision geometry for TrimeshCollider
  const trimeshData = useMemo(() => {
    const positions = collisionGeometry.attributes['position'];
    const indexAttr = collisionGeometry.index;
    
    if (!positions || !indexAttr) {
      return { vertices: new Float32Array(0), indices: new Uint32Array(0) };
    }
    
    const vertices = new Float32Array(positions.array);
    const indices = new Uint32Array(indexAttr.array);
    
    return { vertices, indices };
  }, [collisionGeometry]);

  // Get debug mode state for wireframe visibility
  const showDebugWireframe = useDebugStore((state) => state.isEnabled);

  return (
    <group>
      {/* Low-resolution collision mesh with TrimeshCollider */}
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider args={[trimeshData.vertices, trimeshData.indices]} />
      </RigidBody>
      
      {/* Wireframe overlay to visualize collision mesh grid - only shown in debug mode */}
      {showDebugWireframe && (
        <mesh geometry={collisionGeometry} position={[0, 0.15, 0]}>
          <meshBasicMaterial 
            color="#ff0000" 
            wireframe={true} 
            transparent={true}
            opacity={0.8}
            depthTest={false}
          />
        </mesh>
      )}
      
      {/* High-resolution visual mesh */}
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        receiveShadow 
        castShadow
      >
        <meshStandardMaterial 
          vertexColors={true}
          roughness={0.85}
          metalness={0.05}
          flatShading={false}
        />
      </mesh>
    </group>
  );
}
