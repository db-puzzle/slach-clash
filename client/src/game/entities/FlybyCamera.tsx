import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '@/stores/gameStore';
import { useCameraStore } from '@/stores/cameraStore';
import {
  FLYBY_ORBIT_DURATION,
  FLYBY_TRANSITION_DURATION,
  FLYBY_ORBIT_RADIUS,
  FLYBY_ORBIT_HEIGHT,
  FLYBY_LOOK_AT_HEIGHT,
} from '@/utils/constants';

type FlybyPhase = 'orbit' | 'transition';

/**
 * Easing function for smooth animation
 */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Easing function for transition (smoother end)
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Calculate camera position on circular orbit around arena center
 */
function getOrbitPosition(angle: number): Vector3 {
  const x = Math.sin(angle) * FLYBY_ORBIT_RADIUS;
  const z = Math.cos(angle) * FLYBY_ORBIT_RADIUS;
  return new Vector3(x, FLYBY_ORBIT_HEIGHT, z);
}

/**
 * Calculate the follow camera position for a given player position
 */
function calculateFollowCameraPosition(
  playerPosition: Vector3,
  cameraYaw: number,
  cameraPitch: number,
  cameraDistance: number,
  cameraHeight: number
): { position: Vector3; lookAt: Vector3 } {
  const horizontalDistance = Math.cos(cameraPitch) * cameraDistance;
  const verticalOffset = Math.sin(cameraPitch) * cameraDistance + cameraHeight;

  const offsetX = -Math.sin(cameraYaw) * horizontalDistance;
  const offsetZ = -Math.cos(cameraYaw) * horizontalDistance;

  const position = new Vector3(
    playerPosition.x + offsetX,
    playerPosition.y + verticalOffset,
    playerPosition.z + offsetZ
  );

  const lookAt = playerPosition.clone();
  lookAt.y += 1; // Look at player's chest level

  return { position, lookAt };
}

/**
 * Calculate the orbit end angle that positions the camera closest to the target position.
 * This ensures the orbit ends near where the follow camera will be.
 */
function calculateOrbitEndAngle(targetCameraPosition: Vector3): number {
  // Project target position onto XZ plane and find angle from arena center
  // atan2(x, z) gives us the angle where:
  // - angle 0 = positive Z axis
  // - angle increases clockwise when viewed from above
  return Math.atan2(targetCameraPosition.x, targetCameraPosition.z);
}

interface FlybyProps {
  playerId: string;
  onComplete: () => void;
}

export function FlybyCamera({ playerId, onComplete }: FlybyProps): null {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);
  const completed = useRef(false);
  const currentPhase = useRef<FlybyPhase>('orbit');
  const transitionStartTime = useRef<number | null>(null);
  const initialized = useRef(false);

  // Store positions for transition interpolation
  const transitionStartPos = useRef(new Vector3());
  const transitionStartLookAt = useRef(new Vector3());

  // Store calculated orbit angles
  const orbitStartAngle = useRef(0);
  const orbitEndAngle = useRef(0);

  // Get player and camera state
  const player = useGameStore((state) => state.players.get(playerId));
  const cameraYaw = useCameraStore((state) => state.yaw);
  const cameraPitch = useCameraStore((state) => state.pitch);
  const cameraDistance = useCameraStore((state) => state.distance);
  const cameraHeight = useCameraStore((state) => state.height);

  // Center point the camera looks at during orbit
  const orbitLookAt = useRef(new Vector3(0, FLYBY_LOOK_AT_HEIGHT, 0));

  // Calculate target camera position based on player spawn
  const targetCameraData = useMemo(() => {
    if (!player) return null;
    
    const playerPos = new Vector3(player.position.x, player.position.y, player.position.z);
    return calculateFollowCameraPosition(
      playerPos,
      cameraYaw,
      cameraPitch,
      cameraDistance,
      cameraHeight
    );
  }, [player, cameraYaw, cameraPitch, cameraDistance, cameraHeight]);

  // Memoize onComplete to avoid effect re-runs
  const handleComplete = useCallback(() => {
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  }, [onComplete]);

  // Initialize orbit path based on player position
  useEffect(() => {
    if (!targetCameraData || initialized.current) return;

    // Calculate orbit end angle based on where the camera needs to end up
    const endAngle = calculateOrbitEndAngle(targetCameraData.position);
    orbitEndAngle.current = endAngle;
    
    // Start angle is one full circle before the end angle
    // This ensures we do a complete 360° orbit ending near the player's camera position
    orbitStartAngle.current = endAngle - Math.PI * 2;

    // Set initial camera position at start angle
    const initialPosition = getOrbitPosition(orbitStartAngle.current);
    camera.position.copy(initialPosition);
    camera.lookAt(orbitLookAt.current);
    
    initialized.current = true;
  }, [camera, targetCameraData]);

  useFrame(() => {
    if (completed.current || !initialized.current || !targetCameraData) return;

    // Initialize start time
    if (startTime.current === null) {
      startTime.current = performance.now();
    }

    const now = performance.now();

    if (currentPhase.current === 'orbit') {
      const elapsed = now - startTime.current;
      const rawProgress = elapsed / FLYBY_ORBIT_DURATION;

      // Check if orbit is complete
      if (rawProgress >= 1) {
        // Set final orbit position
        const finalOrbitPos = getOrbitPosition(orbitEndAngle.current);
        camera.position.copy(finalOrbitPos);
        camera.lookAt(orbitLookAt.current);
        
        // Store current position for transition interpolation
        transitionStartPos.current.copy(finalOrbitPos);
        transitionStartLookAt.current.copy(orbitLookAt.current);
        transitionStartTime.current = now;
        currentPhase.current = 'transition';
        return;
      }

      // Apply easing for smooth animation
      const easedProgress = easeInOutSine(rawProgress);

      // Calculate current angle (interpolate from start to end)
      const currentAngle = orbitStartAngle.current + easedProgress * Math.PI * 2;

      // Calculate camera position on orbit
      const position = getOrbitPosition(currentAngle);

      camera.position.copy(position);
      camera.lookAt(orbitLookAt.current);
    } else if (currentPhase.current === 'transition') {
      if (transitionStartTime.current === null) {
        handleComplete();
        return;
      }

      const elapsed = now - transitionStartTime.current;
      const rawProgress = Math.min(elapsed / FLYBY_TRANSITION_DURATION, 1);

      // Check if transition is complete
      if (rawProgress >= 1) {
        camera.position.copy(targetCameraData.position);
        camera.lookAt(targetCameraData.lookAt);
        handleComplete();
        return;
      }

      // Apply easing for smooth transition
      const easedProgress = easeOutCubic(rawProgress);

      // Interpolate position
      const currentPos = new Vector3().lerpVectors(
        transitionStartPos.current,
        targetCameraData.position,
        easedProgress
      );

      // Interpolate lookAt
      const currentLookAt = new Vector3().lerpVectors(
        transitionStartLookAt.current,
        targetCameraData.lookAt,
        easedProgress
      );

      camera.position.copy(currentPos);
      camera.lookAt(currentLookAt);
    }
  });

  return null;
}
