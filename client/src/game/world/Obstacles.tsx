import { RigidBody } from '@react-three/rapier';

interface ObstacleProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function Rock({
  position,
  size,
  color = '#6b705c',
}: ObstacleProps): React.JSX.Element {
  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[size[0]]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function Wall({
  position,
  size,
  color = '#a5a58d',
}: ObstacleProps): React.JSX.Element {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </RigidBody>
  );
}

// Predefined obstacle layout for the arena
const OBSTACLE_LAYOUT = {
  rocks: [
    {
      position: [-15, 1.5, -10] as [number, number, number],
      size: [1.5, 1.5, 1.5] as [number, number, number],
    },
    {
      position: [12, 1.2, 8] as [number, number, number],
      size: [1.2, 1.2, 1.2] as [number, number, number],
    },
    {
      position: [-8, 1.8, 15] as [number, number, number],
      size: [1.8, 1.8, 1.8] as [number, number, number],
    },
    {
      position: [20, 1, -18] as [number, number, number],
      size: [1, 1, 1] as [number, number, number],
    },
    {
      position: [-20, 1.4, -5] as [number, number, number],
      size: [1.4, 1.4, 1.4] as [number, number, number],
    },
    {
      position: [5, 2, 20] as [number, number, number],
      size: [2, 2, 2] as [number, number, number],
    },
    {
      position: [0, 1.6, 0] as [number, number, number],
      size: [1.6, 1.6, 1.6] as [number, number, number],
    }, // Center rock
  ],
  walls: [
    {
      position: [-10, 1.5, 0] as [number, number, number],
      size: [1, 3, 8] as [number, number, number],
    },
    {
      position: [10, 1.5, 5] as [number, number, number],
      size: [8, 3, 1] as [number, number, number],
    },
    {
      position: [0, 1.5, -15] as [number, number, number],
      size: [12, 3, 1] as [number, number, number],
    },
    {
      position: [-18, 1, 18] as [number, number, number],
      size: [6, 2, 1] as [number, number, number],
    },
    {
      position: [18, 1, -8] as [number, number, number],
      size: [1, 2, 6] as [number, number, number],
    },
  ],
};

export function Obstacles(): React.JSX.Element {
  return (
    <group>
      {OBSTACLE_LAYOUT.rocks.map((rock, index) => (
        <Rock key={`rock-${String(index)}`} position={rock.position} size={rock.size} />
      ))}
      {OBSTACLE_LAYOUT.walls.map((wall, index) => (
        <Wall key={`wall-${String(index)}`} position={wall.position} size={wall.size} />
      ))}
    </group>
  );
}
