import { useRef } from 'react';
import { Group } from 'three';

interface PlayerModelProps {
  color: string;
  isBlocking?: boolean;
}

export function PlayerModel({
  color,
  isBlocking = false,
}: PlayerModelProps): React.JSX.Element {
  const groupRef = useRef<Group>(null);

  // Body proportions (stylized, blocky)
  const bodyHeight = 0.8;
  const bodyWidth = 0.5;
  const headSize = 0.35;
  const limbWidth = 0.15;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, bodyHeight / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[bodyWidth, bodyHeight, bodyWidth * 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, bodyHeight + headSize / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[headSize, headSize, headSize]} />
        <meshStandardMaterial color="#f4e4c1" /> {/* Skin tone */}
      </mesh>

      {/* Left Arm */}
      <group position={[-(bodyWidth / 2 + limbWidth / 2), bodyHeight / 2 + 0.3, 0]}>
        <mesh
          position={[0, 0, 0]}
          rotation={isBlocking ? [0, 0, Math.PI / 4] : [0, 0, 0]}
          castShadow
        >
          <boxGeometry args={[limbWidth, bodyHeight * 0.7, limbWidth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[bodyWidth / 2 + limbWidth / 2, bodyHeight / 2 + 0.3, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[limbWidth, bodyHeight * 0.7, limbWidth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Left Leg */}
      <mesh position={[-bodyWidth / 4, 0.2, 0]} castShadow>
        <boxGeometry args={[limbWidth, 0.4, limbWidth]} />
        <meshStandardMaterial color="#4a4a4a" /> {/* Dark pants */}
      </mesh>

      {/* Right Leg */}
      <mesh position={[bodyWidth / 4, 0.2, 0]} castShadow>
        <boxGeometry args={[limbWidth, 0.4, limbWidth]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
    </group>
  );
}
