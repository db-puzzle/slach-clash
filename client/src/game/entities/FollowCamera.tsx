import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '@/stores/gameStore';

interface FollowCameraProps {
  playerId: string;
  distance?: number;
  height?: number;
  smoothness?: number;
}

export function FollowCamera({
  playerId,
  distance = 12,
  height = 8,
  smoothness = 5,
}: FollowCameraProps): null {
  const { camera } = useThree();
  const player = useGameStore((state) => state.players.get(playerId));

  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());

  useFrame((_, delta) => {
    if (!player) return;

    const { position, rotation } = player;

    // Calculate camera position behind player (opposite direction of where player faces)
    const offsetX = -Math.sin(rotation) * distance;
    const offsetZ = -Math.cos(rotation) * distance;

    targetPosition.current.set(
      position.x + offsetX,
      position.y + height,
      position.z + offsetZ
    );

    // Smooth camera movement
    currentPosition.current.lerp(targetPosition.current, smoothness * delta);
    camera.position.copy(currentPosition.current);

    // Look at player
    camera.lookAt(position.x, position.y + 1, position.z);
  });

  return null;
}
