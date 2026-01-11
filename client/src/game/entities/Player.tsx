import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { PlayerModel } from './PlayerModel';
import { useInput } from '@/hooks/useInput';
import { useGameStore } from '@/stores/gameStore';
import {
  WALK_SPEED,
  SPRINT_SPEED,
  SPRINT_STAMINA_COST,
  MAX_STAMINA,
  STAMINA_RECOVERY_RATE,
} from '@/utils/constants';

// Rotation speed in radians per second (adjust for smoother/faster turning)
const ROTATION_SPEED = 8;

// Helper function to get the shortest angle difference (handles wraparound)
function angleDifference(from: number, to: number): number {
  let diff = to - from;
  // Normalize to [-π, π]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// Smoothly interpolate rotation with proper angle wrapping
function lerpAngle(from: number, to: number, t: number): number {
  const diff = angleDifference(from, to);
  return from + diff * Math.min(t, 1);
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

  // Movement vectors (reused each frame)
  const moveDirection = useRef(new Vector3());
  const velocity = useRef(new Vector3());

  // Initialize player in store
  useEffect(() => {
    if (isLocal) {
      useGameStore.getState().addPlayer({
        id: playerId,
        name: 'Player',
        teamId: 0,
        position: { x: startPosition[0], y: startPosition[1], z: startPosition[2] },
        rotation: Math.PI, // Start facing toward arena center (-Z direction)
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
  }, [playerId, startPosition, isLocal]);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !isLocal || !player) return;

    const rb = rigidBodyRef.current;
    const stamina = player.stamina;
    const currentRotation = player.rotation;

    // Calculate input direction in local/camera space
    // Forward = positive, Right = positive (from player's perspective)
    const inputForward = (input.moveForward ? 1 : 0) - (input.moveBackward ? 1 : 0);
    const inputRight = (input.moveLeft ? 1 : 0) - (input.moveRight ? 1 : 0);

    // Transform from local space to world space using player's current rotation
    // This makes controls relative to where the player is facing
    const cosR = Math.cos(currentRotation);
    const sinR = Math.sin(currentRotation);

    // Rotate input by player's facing direction
    // Local forward (0,0,1) -> World (sin(θ), 0, cos(θ))
    // Local right (1,0,0) -> World (cos(θ), 0, -sin(θ))
    const worldX = inputRight * cosR + inputForward * sinR;
    const worldZ = -inputRight * sinR + inputForward * cosR;

    moveDirection.current.set(worldX, 0, worldZ);

    // Normalize diagonal movement
    if (moveDirection.current.length() > 0) {
      moveDirection.current.normalize();
    }

    // Determine speed based on sprint state
    const canSprint =
      input.sprint && stamina > 0 && moveDirection.current.length() > 0;
    const speed = canSprint ? SPRINT_SPEED : WALK_SPEED;

    // Apply movement
    velocity.current.set(
      moveDirection.current.x * speed,
      rb.linvel().y, // Preserve vertical velocity (gravity)
      moveDirection.current.z * speed
    );

    rb.setLinvel(velocity.current, true);

    // Calculate rotation to face movement direction with smooth interpolation
    // Only rotate when moving forward or sideways, not when moving purely backward
    let newRotation = currentRotation;
    const isMovingForward = inputForward > 0;
    const isMovingSideways = inputRight !== 0;

    if (moveDirection.current.length() > 0 && (isMovingForward || isMovingSideways)) {
      const targetRotation = Math.atan2(moveDirection.current.x, moveDirection.current.z);
      // Smoothly interpolate toward target rotation
      newRotation = lerpAngle(currentRotation, targetRotation, ROTATION_SPEED * delta);
    }
    // When moving purely backward, keep current rotation (walk backward while facing forward)

    // Update stamina
    let newStamina = stamina;
    if (canSprint) {
      newStamina = Math.max(0, stamina - SPRINT_STAMINA_COST * delta);
    } else if (!input.sprint && stamina < MAX_STAMINA) {
      newStamina = Math.min(MAX_STAMINA, stamina + STAMINA_RECOVERY_RATE * delta);
    }

    // Get current position
    const pos = rb.translation();

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
      isBlocking: input.block,
    });
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={startPosition}
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
