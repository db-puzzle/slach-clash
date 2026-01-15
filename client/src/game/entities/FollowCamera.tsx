import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useTerrainData } from '@/game/world';
import { getNormalAt } from '@/game/terrain';
import { useInput } from '@/hooks/useInput';
import {
  CAMERA_TILT_INFLUENCE,
  CAMERA_TILT_SMOOTHNESS,
  CAMERA_MAX_TILT_ANGLE,
  CAMERA_SMOOTHNESS,
  TARGET_LOCK_RANGE,
  TARGET_LOCK_BREAK_RANGE,
} from '@/utils/constants';

interface FollowCameraProps {
  playerId: string;
}

export function FollowCamera({ playerId }: FollowCameraProps): null {
  const { camera } = useThree();
  const player = useGameStore((state) => state.players.get(playerId));
  const players = useGameStore((state) => state.players);
  const terrain = useTerrainData();
  const { input, requestPointerLock, isPointerLocked } = useInput();

  // Camera store state
  const cameraYaw = useCameraStore((state) => state.yaw);
  const cameraPitch = useCameraStore((state) => state.pitch);
  const cameraDistance = useCameraStore((state) => state.distance);
  const cameraHeight = useCameraStore((state) => state.height);
  const isLocked = useCameraStore((state) => state.isLocked);
  const lockedTargetId = useCameraStore((state) => state.lockedTargetId);
  const setLock = useCameraStore((state) => state.setLock);
  const resetCamera = useCameraStore((state) => state.resetCamera);

  // Refs for smooth interpolation
  const currentPosition = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());
  const currentTilt = useRef(0);
  const initialized = useRef(false);

  // Handle target lock toggle from input
  useEffect(() => {
    if (!player) return;

    if (input.targetLock && !isLocked) {
      // Find nearest enemy to lock onto
      const nearestTarget = findNearestTarget(player, players, playerId);
      if (nearestTarget) {
        setLock(true, nearestTarget);
      }
    } else if (!input.targetLock && isLocked) {
      setLock(false);
    }
  }, [input.targetLock, isLocked, player, players, playerId, setLock]);

  // Handle camera reset (V key)
  useEffect(() => {
    if (input.resetCamera && player) {
      resetCamera(player.rotation);
    }
  }, [input.resetCamera, player, resetCamera]);

  // Request pointer lock on click
  useEffect(() => {
    const handleClick = (): void => {
      if (!isPointerLocked) {
        requestPointerLock();
      }
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      return () => canvas.removeEventListener('click', handleClick);
    }
  }, [isPointerLocked, requestPointerLock]);

  useFrame((_, delta) => {
    if (!player) return;

    const { position: playerPos } = player;
    const playerPosition = new Vector3(playerPos.x, playerPos.y, playerPos.z);

    let targetCameraPosition: Vector3;
    let targetLookAt: Vector3;

    if (isLocked && lockedTargetId) {
      // Target lock mode - camera positions to show both player and target
      const target = players.get(lockedTargetId);

      if (target && !target.isEliminated) {
        const targetPosition = new Vector3(target.position.x, target.position.y, target.position.z);
        const distanceToTarget = playerPosition.distanceTo(targetPosition);

        // Break lock if target is too far
        if (distanceToTarget > TARGET_LOCK_BREAK_RANGE) {
          setLock(false);
        } else {
          // Calculate camera position for target lock
          // Camera should be behind and above player, looking at midpoint between player and target
          const dirToTarget = targetPosition.clone().sub(playerPosition).normalize();
          
          // Camera goes opposite direction from target
          const cameraOffset = dirToTarget.clone().multiplyScalar(-cameraDistance);
          cameraOffset.y = cameraHeight;

          targetCameraPosition = playerPosition.clone().add(cameraOffset);
          
          // Look at a point slightly above the player (not the midpoint, to keep player in view)
          targetLookAt = playerPosition.clone();
          targetLookAt.y += 1;
        }
      } else {
        // Target eliminated or not found, break lock
        setLock(false);
      }
    }

    // Free camera mode (or fallback if lock just broke)
    if (!isLocked || !targetCameraPosition!) {
      // Calculate camera position from yaw and pitch
      const horizontalDistance = Math.cos(cameraPitch) * cameraDistance;
      const verticalOffset = Math.sin(cameraPitch) * cameraDistance + cameraHeight;

      const offsetX = -Math.sin(cameraYaw) * horizontalDistance;
      const offsetZ = -Math.cos(cameraYaw) * horizontalDistance;

      targetCameraPosition = new Vector3(
        playerPos.x + offsetX,
        playerPos.y + verticalOffset,
        playerPos.z + offsetZ
      );

      targetLookAt = playerPosition.clone();
      targetLookAt.y += 1; // Look at player's chest level
    }

    // Initialize camera position on first frame
    if (!initialized.current) {
      currentPosition.current.copy(targetCameraPosition!);
      currentLookAt.current.copy(targetLookAt!);
      initialized.current = true;
    }

    // Smooth camera movement
    const smoothFactor = Math.min(CAMERA_SMOOTHNESS * delta, 1);
    currentPosition.current.lerp(targetCameraPosition!, smoothFactor);
    currentLookAt.current.lerp(targetLookAt!, smoothFactor);

    camera.position.copy(currentPosition.current);

    // Calculate terrain tilt (subtle effect)
    if (terrain) {
      const terrainNormal = getNormalAt(terrain, playerPos.x, playerPos.z);

      // Calculate target tilt based on terrain slope
      const targetTilt =
        Math.asin(Math.max(-1, Math.min(1, terrainNormal.z))) * CAMERA_TILT_INFLUENCE;

      // Clamp tilt to maximum angle
      const maxTiltRad = CAMERA_MAX_TILT_ANGLE * (Math.PI / 180);
      const clampedTilt = Math.max(-maxTiltRad, Math.min(maxTiltRad, targetTilt));

      // Smooth tilt interpolation
      currentTilt.current += (clampedTilt - currentTilt.current) * CAMERA_TILT_SMOOTHNESS * delta;
    }

    // Look at target
    camera.lookAt(currentLookAt.current);

    // Apply subtle terrain-based tilt
    if (currentTilt.current !== 0) {
      const euler = new Euler().setFromQuaternion(camera.quaternion);
      euler.z += currentTilt.current * 0.3; // Reduced influence for roll
      camera.quaternion.setFromEuler(euler);
    }
  });

  return null;
}

/**
 * Find the nearest valid target for lock-on
 */
function findNearestTarget(
  player: { position: { x: number; y: number; z: number }; teamId: number },
  players: Map<string, { position: { x: number; y: number; z: number }; teamId: number; isEliminated: boolean }>,
  localPlayerId: string
): string | null {
  const playerPos = new Vector3(player.position.x, player.position.y, player.position.z);
  
  let nearestId: string | null = null;
  let nearestDistance = TARGET_LOCK_RANGE;

  players.forEach((otherPlayer, id) => {
    // Skip self and teammates and eliminated players
    if (id === localPlayerId || otherPlayer.teamId === player.teamId || otherPlayer.isEliminated) {
      return;
    }

    const otherPos = new Vector3(
      otherPlayer.position.x,
      otherPlayer.position.y,
      otherPlayer.position.z
    );
    const distance = playerPos.distanceTo(otherPos);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = id;
    }
  });

  return nearestId;
}
