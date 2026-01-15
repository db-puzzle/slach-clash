import { useMemo, useRef, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Group } from 'three';
import { Tree } from './Trees';
import type { TerrainData } from '@/types';
import { getHeightAt, getSlopeAngle } from '@/game/terrain';
import { OBSTACLE_PLACEMENT, TREE_TYPES, ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';
import { markAsOcclusionAware } from '@/game/systems/OcclusionSystem';

interface ObstaclesProps {
  terrain: TerrainData;
  seed?: number;
}

interface RockObstacle {
  position: [number, number, number];
  size: number;
}

interface TreeObstacle {
  position: [number, number, number];
  type: 'pine' | 'oak' | 'dead';
}

function Rock({ position, size }: { position: [number, number, number]; size: number }): React.JSX.Element {
  const groupRef = useRef<Group>(null);
  
  // Mark this rock as occlusion-aware on mount
  useEffect(() => {
    if (groupRef.current) {
      markAsOcclusionAware(groupRef.current);
    }
  }, []);
  
  return (
    <group ref={groupRef}>
      <RigidBody type="fixed" colliders="hull" position={position}>
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[size]} />
          <meshStandardMaterial color="#6b705c" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}

function generateObstacles(terrain: TerrainData, seed: number): { rocks: RockObstacle[]; trees: TreeObstacle[] } {
  const rng = createSeededRandom(seed);
  const rocks: RockObstacle[] = [];
  const trees: TreeObstacle[] = [];
  
  const { maxSlopeForPlacement, minDistanceFromEdge, minDistanceBetween } = OBSTACLE_PLACEMENT;
  
  // Generate rocks on flat areas
  for (let i = 0; i < 10; i++) {
    const x = (rng() - 0.5) * (ARENA_WIDTH - minDistanceFromEdge * 2);
    const z = (rng() - 0.5) * (ARENA_DEPTH - minDistanceFromEdge * 2);
    const slope = getSlopeAngle(terrain, x, z);
    
    if (slope < maxSlopeForPlacement) {
      const y = getHeightAt(terrain, x, z);
      const size = 1 + rng() * 1.5;
      
      if (isValidPlacement(x, z, rocks, trees, minDistanceBetween)) {
        rocks.push({ position: [x, y + size * 0.5, z], size });
      }
    }
  }
  
  // Generate trees on moderate slopes
  const treeTypes: Array<'pine' | 'oak' | 'dead'> = ['pine', 'oak', 'dead'];
  for (let i = 0; i < 25; i++) {
    const x = (rng() - 0.5) * (ARENA_WIDTH - minDistanceFromEdge * 2);
    const z = (rng() - 0.5) * (ARENA_DEPTH - minDistanceFromEdge * 2);
    const slope = getSlopeAngle(terrain, x, z);
    const treeTypeIndex = Math.floor(rng() * treeTypes.length);
    const treeType = treeTypes[treeTypeIndex] ?? 'pine';
    const treeConfig = TREE_TYPES[treeType];
    const maxSlope = treeConfig?.maxPlacementSlope ?? 30;
    
    if (slope < maxSlope) {
      const y = getHeightAt(terrain, x, z);
      
      if (isValidPlacement(x, z, rocks, trees, minDistanceBetween)) {
        trees.push({ position: [x, y, z], type: treeType });
      }
    }
  }
  
  return { rocks, trees };
}

function isValidPlacement(
  x: number, 
  z: number, 
  rocks: RockObstacle[], 
  trees: TreeObstacle[], 
  minDistance: number
): boolean {
  for (const rock of rocks) {
    const dx = rock.position[0] - x;
    const dz = rock.position[2] - z;
    if (Math.sqrt(dx * dx + dz * dz) < minDistance) return false;
  }
  for (const tree of trees) {
    const dx = tree.position[0] - x;
    const dz = tree.position[2] - z;
    if (Math.sqrt(dx * dx + dz * dz) < minDistance) return false;
  }
  return true;
}

function createSeededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function Obstacles({ terrain, seed = 42 }: ObstaclesProps): React.JSX.Element {
  const { rocks, trees } = useMemo(() => generateObstacles(terrain, seed), [terrain, seed]);
  
  return (
    <group>
      {rocks.map((rock, index) => (
        <Rock key={`rock-${String(index)}`} position={rock.position} size={rock.size} />
      ))}
      {trees.map((tree, index) => (
        <Tree key={`tree-${String(index)}`} position={tree.position} type={tree.type} />
      ))}
    </group>
  );
}
