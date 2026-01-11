import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';

export function Boundaries(): React.JSX.Element {
  const wallHeight = 5;
  const wallThickness = 1;
  const halfWidth = ARENA_WIDTH / 2;
  const halfDepth = ARENA_DEPTH / 2;

  return (
    <group>
      {/* North wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, wallHeight / 2, -halfDepth - wallThickness / 2]}
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
        position={[0, wallHeight / 2, halfDepth + wallThickness / 2]}
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
        position={[halfWidth + wallThickness / 2, wallHeight / 2, 0]}
      >
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[-halfWidth - wallThickness / 2, wallHeight / 2, 0]}
      >
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
