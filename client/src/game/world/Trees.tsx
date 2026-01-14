import { RigidBody } from '@react-three/rapier';
import { TREE_TYPES } from '@/utils/constants';

interface TreeProps {
  position: [number, number, number];
  type: 'pine' | 'oak' | 'dead';
}

function PineTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  const config = TREE_TYPES['pine'];
  if (!config) {
    return <group position={position} />;
  }
  
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
      <mesh position={[0, config.trunkHeight * 1.1, 0]} castShadow>
        <coneGeometry args={[config.canopyRadius * 0.7, config.trunkHeight * 0.5, 8]} />
        <meshStandardMaterial color="#388e3c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function OakTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  const config = TREE_TYPES['oak'];
  if (!config) {
    return <group position={position} />;
  }
  
  return (
    <group position={position}>
      {/* Trunk - has collision */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, config.trunkHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[config.trunkRadius, config.trunkRadius * 1.3, config.trunkHeight, 8]} />
          <meshStandardMaterial color="#4e342e" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Canopy - visual only */}
      <mesh position={[0, config.trunkHeight + config.canopyRadius * 0.5, 0]} castShadow>
        <sphereGeometry args={[config.canopyRadius, 8, 8]} />
        <meshStandardMaterial color="#33691e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function DeadTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  const config = TREE_TYPES['dead'];
  if (!config) {
    return <group position={position} />;
  }
  
  return (
    <group position={position}>
      {/* Full mesh collision for dead trees */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, config.trunkHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[config.trunkRadius, config.trunkRadius * 1.1, config.trunkHeight, 6]} />
          <meshStandardMaterial color="#5d4037" roughness={1} />
        </mesh>
        {/* Bare branches */}
        <mesh position={[0.3, config.trunkHeight * 0.8, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 1, 4]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>
        <mesh position={[-0.2, config.trunkHeight * 0.9, 0.2]} rotation={[Math.PI / 6, 0, -Math.PI / 5]} castShadow>
          <cylinderGeometry args={[0.04, 0.02, 0.8, 4]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>
      </RigidBody>
    </group>
  );
}

export function Tree({ position, type }: TreeProps): React.JSX.Element {
  switch (type) {
    case 'pine':
      return <PineTree position={position} />;
    case 'oak':
      return <OakTree position={position} />;
    case 'dead':
      return <DeadTree position={position} />;
  }
}
