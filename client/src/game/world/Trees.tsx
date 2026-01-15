import { useRef, useEffect } from 'react';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { Group } from 'three';
import { TREE_TYPES } from '@/utils/constants';
import { markAsOcclusionAware } from '@/game/systems/OcclusionSystem';

interface TreeProps {
  position: [number, number, number];
  type: 'pine' | 'oak' | 'dead';
}

function PineTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  const groupRef = useRef<Group>(null);
  const config = TREE_TYPES['pine'];
  
  // Mark this tree as occlusion-aware on mount
  useEffect(() => {
    if (groupRef.current) {
      markAsOcclusionAware(groupRef.current);
    }
  }, []);
  
  if (!config) {
    return <group position={position} />;
  }
  
  return (
    <group ref={groupRef} position={position}>
      {/* Trunk - has cylindrical collision matching the visual */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider 
          args={[config.trunkHeight / 2, config.trunkRadius * 1.1]} 
          position={[0, config.trunkHeight / 2, 0]} 
        />
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
  const groupRef = useRef<Group>(null);
  const config = TREE_TYPES['oak'];
  
  // Mark this tree as occlusion-aware on mount
  useEffect(() => {
    if (groupRef.current) {
      markAsOcclusionAware(groupRef.current);
    }
  }, []);
  
  if (!config) {
    return <group position={position} />;
  }
  
  return (
    <group ref={groupRef} position={position}>
      {/* Trunk - has cylindrical collision matching the visual */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider 
          args={[config.trunkHeight / 2, config.trunkRadius * 1.15]} 
          position={[0, config.trunkHeight / 2, 0]} 
        />
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
  const groupRef = useRef<Group>(null);
  const config = TREE_TYPES['dead'];
  
  // Mark this tree as occlusion-aware on mount
  useEffect(() => {
    if (groupRef.current) {
      markAsOcclusionAware(groupRef.current);
    }
  }, []);
  
  if (!config) {
    return <group position={position} />;
  }
  
  return (
    <group ref={groupRef} position={position}>
      {/* Trunk only collision - branches are visual only to prevent getting stuck */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider 
          args={[config.trunkHeight / 2, config.trunkRadius * 1.05]} 
          position={[0, config.trunkHeight / 2, 0]} 
        />
        <mesh position={[0, config.trunkHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[config.trunkRadius, config.trunkRadius * 1.1, config.trunkHeight, 6]} />
          <meshStandardMaterial color="#5d4037" roughness={1} />
        </mesh>
      </RigidBody>
      {/* Bare branches - visual only, no collision */}
      <mesh position={[0.3, config.trunkHeight * 0.8, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.05, 0.03, 1, 4]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
      <mesh position={[-0.2, config.trunkHeight * 0.9, 0.2]} rotation={[Math.PI / 6, 0, -Math.PI / 5]} castShadow>
        <cylinderGeometry args={[0.04, 0.02, 0.8, 4]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
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
