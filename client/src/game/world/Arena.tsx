import { useRef } from 'react';
import { Mesh } from 'three';
import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';

export function Arena(): React.JSX.Element {
  const groundRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Ground plane with physics */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          ref={groundRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[ARENA_WIDTH, ARENA_DEPTH]} />
          <meshStandardMaterial color="#3a5a40" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Grid helper for visual reference */}
      <gridHelper
        args={[ARENA_WIDTH, 20, '#2d4a32', '#2d4a32']}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}
