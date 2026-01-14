import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH, ROLLING_HILLS_CONFIG } from '@/utils/constants';

export function Boundaries(): React.JSX.Element {
  // Account for terrain height range (minHeight to maxHeight plus some margin)
  const terrainHeightRange = ROLLING_HILLS_CONFIG.maxHeight - ROLLING_HILLS_CONFIG.minHeight;
  const wallHeight = terrainHeightRange + 10; // Extra margin above terrain
  const wallThickness = 1;
  const halfWidth = ARENA_WIDTH / 2;
  const halfDepth = ARENA_DEPTH / 2;
  
  // Center walls vertically to cover terrain range
  const wallY = (ROLLING_HILLS_CONFIG.minHeight + ROLLING_HILLS_CONFIG.maxHeight) / 2;

  return (
    <group>
      {/* North wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, wallY, -halfDepth - wallThickness / 2]}
      >
        <mesh visible={false}>
          <boxGeometry
            args={[ARENA_WIDTH + wallThickness * 2, wallHeight, wallThickness]}
          />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, wallY, halfDepth + wallThickness / 2]}
      >
        <mesh visible={false}>
          <boxGeometry
            args={[ARENA_WIDTH + wallThickness * 2, wallHeight, wallThickness]}
          />
        </mesh>
      </RigidBody>

      {/* East wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[halfWidth + wallThickness / 2, wallY, 0]}
      >
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[-halfWidth - wallThickness / 2, wallY, 0]}
      >
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
