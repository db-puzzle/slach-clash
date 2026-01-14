import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useTerrainData } from '@/game/world';
import { getNormalAt } from '@/game/terrain';
import {
  CAMERA_TILT_INFLUENCE,
  CAMERA_TILT_SMOOTHNESS,
  CAMERA_MAX_TILT_ANGLE,
} from '@/utils/constants';

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
  const terrain = useTerrainData();

  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const currentTilt = useRef(0);

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

    // Calculate terrain tilt
    if (terrain) {
      const terrainNormal = getNormalAt(terrain, position.x, position.z);
      
      // Calculate target tilt based on terrain slope in viewing direction
      // Use the Z component of the normal (forward/back slope)
      const targetTilt = Math.asin(Math.max(-1, Math.min(1, terrainNormal.z))) * CAMERA_TILT_INFLUENCE;
      
      // Clamp tilt to maximum angle (convert to radians)
      const maxTiltRad = CAMERA_MAX_TILT_ANGLE * (Math.PI / 180);
      const clampedTilt = Math.max(-maxTiltRad, Math.min(maxTiltRad, targetTilt));
      
      // Smooth tilt interpolation
      currentTilt.current += (clampedTilt - currentTilt.current) * CAMERA_TILT_SMOOTHNESS * delta;
    }

    // Look at player
    camera.lookAt(position.x, position.y + 1, position.z);
    
    // Apply subtle terrain-based tilt to camera
    if (currentTilt.current !== 0) {
      const euler = new Euler().setFromQuaternion(camera.quaternion);
      euler.x += currentTilt.current;
      camera.quaternion.setFromEuler(euler);
    }
  });

  return null;
}
