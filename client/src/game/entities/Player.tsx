import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { PlayerModel } from './PlayerModel';
import { useInput } from '@/hooks/useInput';
import { useGameStore } from '@/stores/gameStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useDebugStore } from '@/stores/debugStore';
import { useTerrainData } from '@/game/world';
import { getHeightAt, getNormalAt, getSlopeAngle } from '@/game/terrain';
import { updateFallTracking } from '@/game/systems';
import {
  WALK_SPEED,
  SPRINT_SPEED,
  SPRINT_STAMINA_COST,
  MAX_STAMINA,
  STAMINA_RECOVERY_RATE,
  MAX_TRAVERSABLE_SLOPE,
  SLIDE_THRESHOLD_SLOPE,
  SLIDE_SPEED,
  TERRAIN_SPEED_UPHILL_MIN,
  TERRAIN_SPEED_DOWNHILL_MAX,
  QUICK_SHIELD_STAMINA_COST,
  QUICK_SHIELD_SPEED_MULTIPLIER,
} from '@/utils/constants';

// Rotation speed in radians per second
const ROTATION_SPEED = 10;

// Helper function to get the shortest angle difference (handles wraparound)
function angleDifference(from: number, to: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// Smoothly interpolate rotation with proper angle wrapping
function lerpAngle(from: number, to: number, t: number): number {
  const diff = angleDifference(from, to);
  return from + diff * Math.min(t, 1);
}

// Calculate terrain speed modifier based on slope and movement direction
function calculateTerrainSpeedModifier(
  slopeAngle: number,
  terrainNormal: { x: number; y: number; z: number },
  movementDirection: { x: number; z: number }
): number {
  if (movementDirection.x === 0 && movementDirection.z === 0) return 1;

  const slopeFactor =
    terrainNormal.x * movementDirection.x + terrainNormal.z * movementDirection.z;

  if (slopeFactor < 0) {
    return Math.max(TERRAIN_SPEED_UPHILL_MIN, 1 - (slopeAngle / 90) * 0.5);
  } else {
    return Math.min(TERRAIN_SPEED_DOWNHILL_MAX, 1 + (slopeAngle / 90) * 0.4);
  }
}

interface PlayerProps {
  playerId: string;
  startPosition: [number, number, number];
  color: string;
  isLocal: boolean;
}

export function Player({
  playerId,
  startPosition,
  color,
  isLocal,
}: PlayerProps): React.JSX.Element {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { input } = useInput();
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const player = useGameStore((state) => state.players.get(playerId));
  const players = useGameStore((state) => state.players);
  const terrain = useTerrainData();

  // Camera state for camera-relative movement
  const cameraYaw = useCameraStore((state) => state.yaw);
  const isLocked = useCameraStore((state) => state.isLocked);
  const lockedTargetId = useCameraStore((state) => state.lockedTargetId);

  // Debug store
  const debugEnabled = useDebugStore((state) => state.isEnabled);

  // Movement vectors (reused each frame)
  const moveDirection = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  
  // Track previous position for block detection
  const prevPosition = useRef({ x: 0, y: 0, z: 0 });

  // Initialize player in store
  useEffect(() => {
    if (isLocal) {
      const terrainHeight = terrain
        ? getHeightAt(terrain, startPosition[0], startPosition[2])
        : 0;
      // Spawn 3m above terrain to ensure player starts above the heightfield collider
      const startY = terrainHeight + 3;

      useGameStore.getState().addPlayer({
        id: playerId,
        name: 'Player',
        teamId: 0,
        position: { x: startPosition[0], y: startY, z: startPosition[2] },
        rotation: Math.PI,
        velocity: { x: 0, y: 0, z: 0 },
        health: 10,
        stamina: MAX_STAMINA,
        currentWeaponSlot: 'sword',
        weapons: {
          sword: {
            type: 'sword',
            durability: 15,
            maxDurability: 15,
            isBroken: false,
          },
          spear: {
            type: 'spear',
            durability: 15,
            maxDurability: 15,
            isBroken: false,
          },
          club: { type: 'club', durability: 8, maxDurability: 8, isBroken: false },
          bow: {
            type: 'bow',
            durability: Infinity,
            maxDurability: Infinity,
            isBroken: false,
          },
          shield: {
            type: 'shield',
            durability: 30,
            maxDurability: 30,
            isBroken: false,
          },
          bomb: {
            type: 'bomb',
            durability: Infinity,
            maxDurability: Infinity,
            isBroken: false,
          },
        },
        arrows: 20,
        bombs: 6,
        isBlocking: false,
        isSprinting: false,
        isEliminated: false,
        lastAttackTime: 0,
        staggerEndTime: 0,
      });
    }
  }, [playerId, startPosition, isLocal, terrain]);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !isLocal || !player) return;

    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const stamina = player.stamina;
    const currentRotation = player.rotation;

    // Get terrain info at current position
    let terrainHeight = 0;
    let terrainNormal = { x: 0, y: 1, z: 0 };
    let slopeAngle = 0;

    if (terrain) {
      terrainHeight = getHeightAt(terrain, pos.x, pos.z);
      terrainNormal = getNormalAt(terrain, pos.x, pos.z);
      slopeAngle = getSlopeAngle(terrain, pos.x, pos.z);
    }

    // Check if on ground
    const groundThreshold = 0.5;
    const isOnGround = pos.y - terrainHeight < groundThreshold;

    // Track fall and apply fall damage when landing
    updateFallTracking(playerId, pos.y, isOnGround);

    // Calculate input direction
    const inputForward = (input.moveForward ? 1 : 0) - (input.moveBackward ? 1 : 0);
    const inputRight = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);

    // Determine movement reference angle
    let movementReferenceAngle: number;

    if (isLocked && lockedTargetId) {
      // When locked on, movement is relative to the direction toward target
      const target = players.get(lockedTargetId);
      if (target) {
        const dirX = target.position.x - pos.x;
        const dirZ = target.position.z - pos.z;
        movementReferenceAngle = Math.atan2(dirX, dirZ);
      } else {
        movementReferenceAngle = cameraYaw;
      }
    } else {
      // Free camera mode - movement is relative to camera yaw
      movementReferenceAngle = cameraYaw;
    }

    // Transform input to world space using camera/target direction
    const cosR = Math.cos(movementReferenceAngle);
    const sinR = Math.sin(movementReferenceAngle);

    // Camera forward direction: (sin(yaw), 0, cos(yaw))
    // Camera right direction (screen-relative): (-cos(yaw), 0, sin(yaw))
    // This ensures D moves right on screen, A moves left on screen
    const worldX = -inputRight * cosR + inputForward * sinR;
    const worldZ = inputRight * sinR + inputForward * cosR;

    moveDirection.current.set(worldX, 0, worldZ);

    // Normalize diagonal movement
    if (moveDirection.current.length() > 0) {
      moveDirection.current.normalize();
    }

    // Check for steep slopes
    const canTraverse = slopeAngle < MAX_TRAVERSABLE_SLOPE;
    const shouldSlide = slopeAngle >= SLIDE_THRESHOLD_SLOPE;

    // On steep slopes, allow movement along the slope (perpendicular to uphill direction)
    // but block direct uphill movement
    if (!canTraverse && moveDirection.current.length() > 0 && terrain) {
      const slopeDot =
        terrainNormal.x * moveDirection.current.x + terrainNormal.z * moveDirection.current.z;
      const movingUphill = slopeDot < 0;
      
      if (movingUphill) {
        // Project movement onto the slope contour (perpendicular to slope gradient)
        // This allows sideways movement along steep slopes
        const slopeGradientX = terrainNormal.x;
        const slopeGradientZ = terrainNormal.z;
        const gradientLengthSq = slopeGradientX * slopeGradientX + slopeGradientZ * slopeGradientZ;
        
        if (gradientLengthSq > 0.001) {
          // Remove the uphill component from movement
          const projection = slopeDot / gradientLengthSq;
          moveDirection.current.x -= slopeGradientX * projection;
          moveDirection.current.z -= slopeGradientZ * projection;
          
          // Re-normalize if there's remaining movement
          const remainingLength = moveDirection.current.length();
          if (remainingLength > 0.1) {
            moveDirection.current.normalize();
          } else {
            moveDirection.current.set(0, 0, 0);
          }
        } else {
          moveDirection.current.set(0, 0, 0);
        }
      }
    }

    // Check if quick shield is active and available
    const shieldWeapon = player.weapons.shield;
    const canQuickShield = input.quickShield && shieldWeapon && !shieldWeapon.isBroken;
    const isBlocking = input.block || canQuickShield;

    // Determine speed based on sprint state, blocking, and terrain
    const canSprint =
      input.sprint && stamina > 0 && moveDirection.current.length() > 0 && !isBlocking;
    let speed = canSprint ? SPRINT_SPEED : WALK_SPEED;

    // Apply speed reduction when blocking/shielding
    if (isBlocking) {
      speed *= QUICK_SHIELD_SPEED_MULTIPLIER;
    }

    // Apply terrain speed modifier
    if (terrain && moveDirection.current.length() > 0) {
      const terrainModifier = calculateTerrainSpeedModifier(slopeAngle, terrainNormal, {
        x: moveDirection.current.x,
        z: moveDirection.current.z,
      });
      speed *= terrainModifier;
    }

    // Calculate velocity
    velocity.current.set(
      moveDirection.current.x * speed,
      rb.linvel().y,
      moveDirection.current.z * speed
    );

    // Apply sliding on steep slopes
    if (shouldSlide && isOnGround && terrain) {
      const slideX = -terrainNormal.x;
      const slideZ = -terrainNormal.z;
      const slideLength = Math.sqrt(slideX * slideX + slideZ * slideZ);
      if (slideLength > 0) {
        velocity.current.x += (slideX / slideLength) * SLIDE_SPEED;
        velocity.current.z += (slideZ / slideLength) * SLIDE_SPEED;
      }
    }

    rb.setLinvel(velocity.current, true);

    // Calculate player rotation
    let newRotation = currentRotation;

    if (isLocked && lockedTargetId) {
      // When locked on, always face the target
      const target = players.get(lockedTargetId);
      if (target) {
        const dirX = target.position.x - pos.x;
        const dirZ = target.position.z - pos.z;
        const targetRotation = Math.atan2(dirX, dirZ);
        newRotation = lerpAngle(currentRotation, targetRotation, ROTATION_SPEED * delta);
      }
    } else if (moveDirection.current.length() > 0) {
      // Free camera mode - face movement direction
      const targetRotation = Math.atan2(moveDirection.current.x, moveDirection.current.z);
      newRotation = lerpAngle(currentRotation, targetRotation, ROTATION_SPEED * delta);
    }

    // Update stamina
    let newStamina = stamina;

    if (canSprint) {
      // Sprinting consumes stamina
      newStamina = Math.max(0, stamina - SPRINT_STAMINA_COST * delta);
    } else if (canQuickShield) {
      // Quick shield consumes stamina
      newStamina = Math.max(0, stamina - QUICK_SHIELD_STAMINA_COST * delta);
    } else if (stamina < MAX_STAMINA) {
      // Recover stamina when not sprinting or quick shielding
      newStamina = Math.min(MAX_STAMINA, stamina + STAMINA_RECOVERY_RATE * delta);
    }

    // Update store
    updatePlayer(playerId, {
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: newRotation,
      velocity: {
        x: velocity.current.x,
        y: velocity.current.y,
        z: velocity.current.z,
      },
      stamina: newStamina,
      isSprinting: canSprint,
      isBlocking,
    });

    // Update debug store if enabled
    if (debugEnabled) {
      const actualVel = rb.linvel();
      
      // Detect if movement is blocked
      const expectedSpeed = Math.sqrt(
        velocity.current.x * velocity.current.x + velocity.current.z * velocity.current.z
      );
      const actualSpeed = Math.sqrt(actualVel.x * actualVel.x + actualVel.z * actualVel.z);
      const isBlocked = expectedSpeed > 0.1 && actualSpeed < expectedSpeed * 0.3;
      
      // Check horizontal displacement vs expected
      const horizontalDisplacement = Math.sqrt(
        Math.pow(pos.x - prevPosition.current.x, 2) +
        Math.pow(pos.z - prevPosition.current.z, 2)
      );
      const expectedDisplacement = expectedSpeed * delta;
      const displacementRatio = expectedDisplacement > 0.001 
        ? horizontalDisplacement / expectedDisplacement 
        : 1;
      
      // Determine block reason
      let blockReason = '';
      if (isBlocked) {
        if (!canTraverse) {
          blockReason = `Slope too steep (${slopeAngle.toFixed(1)}° > ${String(MAX_TRAVERSABLE_SLOPE)}°)`;
        } else if (pos.y < 0.1 && terrainHeight < -0.1) {
          blockReason = 'Possible Arena ground plane collision (y≈0)';
        } else if (displacementRatio < 0.3) {
          blockReason = 'Colliding with obstacle or terrain geometry';
        } else {
          blockReason = 'Unknown collision';
        }
      }

      useDebugStore.getState().updatePlayerPhysics({
        position: { x: pos.x, y: pos.y, z: pos.z },
        velocity: { x: actualVel.x, y: actualVel.y, z: actualVel.z },
        inputDirection: { x: moveDirection.current.x, z: moveDirection.current.z },
        actualMovement: { 
          x: (pos.x - prevPosition.current.x) / delta,
          z: (pos.z - prevPosition.current.z) / delta,
        },
      });

      useDebugStore.getState().updateTerrainInfo({
        terrainHeight,
        slopeAngle,
        terrainNormal,
        canTraverse,
        isSliding: shouldSlide,
      });

      useDebugStore.getState().updateGrounding({
        isGrounded: isOnGround,
        distanceToGround: pos.y - terrainHeight,
      });

      useDebugStore.getState().updateCollisionInfo({
        nearbyColliders: [], // Collider query disabled for now
        isBlocked,
        blockReason,
        lastCollisionPoint: isBlocked ? { x: pos.x, y: pos.y, z: pos.z } : null,
      });

      useDebugStore.getState().updateFrameTiming({
        lastFrameDelta: delta,
        physicsStepsPerSecond: Math.round(1 / delta),
      });
      
      // Update previous position
      prevPosition.current = { x: pos.x, y: pos.y, z: pos.z };
    }
  });

  // Calculate initial position based on terrain
  // Add extra height (3m) to ensure player spawns above terrain even with heightfield positioning
  const initialY = terrain
    ? getHeightAt(terrain, startPosition[0], startPosition[2]) + 3
    : startPosition[1] + 10;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[startPosition[0], initialY, startPosition[2]]}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      mass={1}
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
      <group rotation={new Euler(0, player?.rotation ?? 0, 0)}>
        <PlayerModel color={color} isBlocking={player?.isBlocking} />
      </group>
    </RigidBody>
  );
}
