import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { PlayerModel } from './PlayerModel';
import { useInput } from '@/hooks/useInput';
import { useGameStore } from '@/stores/gameStore';
import { useTerrainData } from '@/game/world';
import { getHeightAt, getNormalAt, getSlopeAngle } from '@/game/terrain';
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

// Calculate terrain speed modifier based on slope and movement direction
function calculateTerrainSpeedModifier(
  slopeAngle: number,
  terrainNormal: { x: number; y: number; z: number },
  movementDirection: { x: number; z: number }
): number {
  if (movementDirection.x === 0 && movementDirection.z === 0) return 1;
  
  // Calculate if moving uphill or downhill
  // Dot product of terrain normal XZ with movement direction
  const slopeFactor = terrainNormal.x * movementDirection.x + terrainNormal.z * movementDirection.z;
  
  if (slopeFactor > 0) {
    // Moving uphill (against the slope normal direction)
    return Math.max(TERRAIN_SPEED_UPHILL_MIN, 1 - (slopeAngle / 90) * 0.5);
  } else {
    // Moving downhill (with the slope)
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
  const terrain = useTerrainData();

  // Movement vectors (reused each frame)
  const moveDirection = useRef(new Vector3());
  const velocity = useRef(new Vector3());
  
  // Fall tracking for fall damage
  const highestY = useRef(startPosition[1]);
  const isAirborne = useRef(false);

  // Initialize player in store
  useEffect(() => {
    if (isLocal) {
      // Calculate actual start height from terrain
      const terrainHeight = terrain ? getHeightAt(terrain, startPosition[0], startPosition[2]) : 0;
      const startY = terrainHeight + 1; // 1 unit above terrain
      
      useGameStore.getState().addPlayer({
        id: playerId,
        name: 'Player',
        teamId: 0,
        position: { x: startPosition[0], y: startY, z: startPosition[2] },
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
    
    // Track fall height
    if (!isOnGround) {
      if (pos.y > highestY.current) {
        highestY.current = pos.y;
      }
      isAirborne.current = true;
    } else if (isAirborne.current) {
      // Just landed - fall damage handled in game systems (Phase 4)
      isAirborne.current = false;
      highestY.current = pos.y;
    }

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
    
    // Check for steep slopes
    const canTraverse = slopeAngle < MAX_TRAVERSABLE_SLOPE;
    const shouldSlide = slopeAngle >= SLIDE_THRESHOLD_SLOPE;
    
    // Block movement up steep slopes
    if (!canTraverse && moveDirection.current.length() > 0 && terrain) {
      // Check if trying to move uphill
      const movingUphill = terrainNormal.x * moveDirection.current.x + terrainNormal.z * moveDirection.current.z > 0;
      if (movingUphill) {
        moveDirection.current.set(0, 0, 0); // Block uphill movement
      }
    }

    // Determine speed based on sprint state and terrain
    const canSprint =
      input.sprint && stamina > 0 && moveDirection.current.length() > 0;
    let speed = canSprint ? SPRINT_SPEED : WALK_SPEED;
    
    // Apply terrain speed modifier
    if (terrain && moveDirection.current.length() > 0) {
      const terrainModifier = calculateTerrainSpeedModifier(
        slopeAngle,
        terrainNormal,
        { x: moveDirection.current.x, z: moveDirection.current.z }
      );
      speed *= terrainModifier;
    }

    // Calculate velocity
    velocity.current.set(
      moveDirection.current.x * speed,
      rb.linvel().y, // Preserve vertical velocity (gravity)
      moveDirection.current.z * speed
    );
    
    // Apply sliding on steep slopes
    if (shouldSlide && isOnGround && terrain) {
      // Slide in direction of slope (opposite of normal's XZ)
      const slideX = -terrainNormal.x;
      const slideZ = -terrainNormal.z;
      const slideLength = Math.sqrt(slideX * slideX + slideZ * slideZ);
      if (slideLength > 0) {
        velocity.current.x += (slideX / slideLength) * SLIDE_SPEED;
        velocity.current.z += (slideZ / slideLength) * SLIDE_SPEED;
      }
    }

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

    // Update stamina (NOT affected by terrain - as per spec)
    let newStamina = stamina;
    if (canSprint) {
      newStamina = Math.max(0, stamina - SPRINT_STAMINA_COST * delta);
    } else if (!input.sprint && stamina < MAX_STAMINA) {
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
      isBlocking: input.block,
    });
  });

  // Calculate initial position based on terrain
  const initialY = terrain 
    ? getHeightAt(terrain, startPosition[0], startPosition[2]) + 1 
    : startPosition[1];

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
