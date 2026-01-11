# Phase 2: Arena and Player Controller

## Overview

Create the 3D arena environment and implement the player character with movement controls and fixed follow camera.

**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 1 complete

---

## Task 2.1: Create Arena Ground

### Objective
Build the arena floor with visual grid for spatial reference.

### File: `client/src/game/world/Arena.tsx`
```typescript
import { useRef } from 'react';
import { Mesh } from 'three';
import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';

export function Arena(): JSX.Element {
  const groundRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Ground plane with physics */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh 
          ref={groundRef} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[ARENA_WIDTH, ARENA_DEPTH]} />
          <meshStandardMaterial 
            color="#3a5a40" 
            roughness={0.8}
          />
        </mesh>
      </RigidBody>

      {/* Grid helper for visual reference */}
      <gridHelper 
        args={[ARENA_WIDTH, 20, '#2d4a32', '#2d4a32']} 
        position={[0, 0.01, 0]} 
      />
    </group>
  );
}
```

### Acceptance Criteria
- [ ] Green ground plane visible
- [ ] Grid lines visible on ground
- [ ] Ground is 60x60 units

---

## Task 2.2: Create Arena Obstacles

### Objective
Add rock and wall obstacles for cover and tactical gameplay.

### File: `client/src/game/world/Obstacles.tsx`
```typescript
import { RigidBody } from '@react-three/rapier';

interface ObstacleProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function Rock({ position, size, color = '#6b705c' }: ObstacleProps): JSX.Element {
  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[size[0]]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function Wall({ position, size, color = '#a5a58d' }: ObstacleProps): JSX.Element {
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
    { position: [-15, 1.5, -10] as [number, number, number], size: [1.5, 1.5, 1.5] as [number, number, number] },
    { position: [12, 1.2, 8] as [number, number, number], size: [1.2, 1.2, 1.2] as [number, number, number] },
    { position: [-8, 1.8, 15] as [number, number, number], size: [1.8, 1.8, 1.8] as [number, number, number] },
    { position: [20, 1, -18] as [number, number, number], size: [1, 1, 1] as [number, number, number] },
    { position: [-20, 1.4, -5] as [number, number, number], size: [1.4, 1.4, 1.4] as [number, number, number] },
    { position: [5, 2, 20] as [number, number, number], size: [2, 2, 2] as [number, number, number] },
    { position: [0, 1.6, 0] as [number, number, number], size: [1.6, 1.6, 1.6] as [number, number, number] }, // Center rock
  ],
  walls: [
    { position: [-10, 1.5, 0] as [number, number, number], size: [1, 3, 8] as [number, number, number] },
    { position: [10, 1.5, 5] as [number, number, number], size: [8, 3, 1] as [number, number, number] },
    { position: [0, 1.5, -15] as [number, number, number], size: [12, 3, 1] as [number, number, number] },
    { position: [-18, 1, 18] as [number, number, number], size: [6, 2, 1] as [number, number, number] },
    { position: [18, 1, -8] as [number, number, number], size: [1, 2, 6] as [number, number, number] },
  ],
};

export function Obstacles(): JSX.Element {
  return (
    <group>
      {OBSTACLE_LAYOUT.rocks.map((rock, index) => (
        <Rock 
          key={`rock-${index}`} 
          position={rock.position} 
          size={rock.size} 
        />
      ))}
      {OBSTACLE_LAYOUT.walls.map((wall, index) => (
        <Wall 
          key={`wall-${index}`} 
          position={wall.position} 
          size={wall.size} 
        />
      ))}
    </group>
  );
}
```

### Acceptance Criteria
- [ ] Rocks are visible as dodecahedrons
- [ ] Walls are visible as boxes
- [ ] Obstacles scattered across arena
- [ ] Center rock provides mid-map cover

---

## Task 2.3: Create Arena Boundaries

### Objective
Add invisible walls at arena edges to keep players inside.

### File: `client/src/game/world/Boundaries.tsx`
```typescript
import { RigidBody } from '@react-three/rapier';
import { ARENA_WIDTH, ARENA_DEPTH } from '@/utils/constants';

export function Boundaries(): JSX.Element {
  const wallHeight = 5;
  const wallThickness = 1;
  const halfWidth = ARENA_WIDTH / 2;
  const halfDepth = ARENA_DEPTH / 2;

  return (
    <group>
      {/* North wall */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, wallHeight / 2, -halfDepth - wallThickness / 2]}>
        <mesh visible={false}>
          <boxGeometry args={[ARENA_WIDTH + wallThickness * 2, wallHeight, wallThickness]} />
        </mesh>
      </RigidBody>

      {/* South wall */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, wallHeight / 2, halfDepth + wallThickness / 2]}>
        <mesh visible={false}>
          <boxGeometry args={[ARENA_WIDTH + wallThickness * 2, wallHeight, wallThickness]} />
        </mesh>
      </RigidBody>

      {/* East wall */}
      <RigidBody type="fixed" colliders="cuboid" position={[halfWidth + wallThickness / 2, wallHeight / 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>

      {/* West wall */}
      <RigidBody type="fixed" colliders="cuboid" position={[-halfWidth - wallThickness / 2, wallHeight / 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, ARENA_DEPTH]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
```

### Acceptance Criteria
- [ ] Invisible walls at all 4 edges
- [ ] Player cannot leave arena bounds
- [ ] Walls don't render visually

---

## Task 2.4: Combine World Components

### Objective
Create a World component that combines all arena elements.

### File: `client/src/game/world/World.tsx`
```typescript
import { Arena } from './Arena';
import { Obstacles } from './Obstacles';
import { Boundaries } from './Boundaries';

export function World(): JSX.Element {
  return (
    <group>
      <Arena />
      <Obstacles />
      <Boundaries />
    </group>
  );
}
```

### File: `client/src/game/world/index.ts`
```typescript
export { Arena } from './Arena';
export { Obstacles } from './Obstacles';
export { Boundaries } from './Boundaries';
export { World } from './World';
```

### Acceptance Criteria
- [ ] World component renders all arena elements
- [ ] Clean exports from index.ts

---

## Task 2.5: Create Input Handler Hook

### Objective
Capture keyboard input for player controls.

### File: `client/src/hooks/useInput.ts`
```typescript
import { useEffect, useCallback, useState } from 'react';
import type { InputState, WeaponSlot } from '@/types';

const WEAPON_KEY_MAP: Record<string, WeaponSlot> = {
  '1': 'sword',
  '2': 'spear',
  '3': 'club',
  '4': 'bow',
  '5': 'shield',
  '6': 'bomb',
};

interface UseInputReturn {
  input: InputState;
  isMouseDown: boolean;
  isRightMouseDown: boolean;
}

export function useInput(): UseInputReturn {
  const [input, setInput] = useState<InputState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    attack: false,
    block: false,
    weaponSlot: null,
    cycleWeaponNext: false,
    cycleWeaponPrev: false,
  });

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // Prevent default for game keys
    if (['w', 'a', 's', 'd', ' ', 'q', 'e', '1', '2', '3', '4', '5', '6'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    const key = event.key.toLowerCase();

    setInput((prev) => {
      const updates: Partial<InputState> = {};

      switch (key) {
        case 'w':
          updates.moveForward = true;
          break;
        case 's':
          updates.moveBackward = true;
          break;
        case 'a':
          updates.moveLeft = true;
          break;
        case 'd':
          updates.moveRight = true;
          break;
        case ' ':
          updates.sprint = true;
          break;
        case 'e':
          updates.cycleWeaponNext = true;
          break;
        case 'q':
          updates.cycleWeaponPrev = true;
          break;
        default:
          if (WEAPON_KEY_MAP[key]) {
            updates.weaponSlot = WEAPON_KEY_MAP[key] ?? null;
          }
      }

      return { ...prev, ...updates };
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    setInput((prev) => {
      const updates: Partial<InputState> = {};

      switch (key) {
        case 'w':
          updates.moveForward = false;
          break;
        case 's':
          updates.moveBackward = false;
          break;
        case 'a':
          updates.moveLeft = false;
          break;
        case 'd':
          updates.moveRight = false;
          break;
        case ' ':
          updates.sprint = false;
          break;
        case 'e':
          updates.cycleWeaponNext = false;
          break;
        case 'q':
          updates.cycleWeaponPrev = false;
          break;
        default:
          if (WEAPON_KEY_MAP[key]) {
            updates.weaponSlot = null;
          }
      }

      return { ...prev, ...updates };
    });
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent): void => {
    if (event.button === 0) {
      setIsMouseDown(true);
      setInput((prev) => ({ ...prev, attack: true }));
    } else if (event.button === 2) {
      setIsRightMouseDown(true);
      setInput((prev) => ({ ...prev, block: true }));
    }
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent): void => {
    if (event.button === 0) {
      setIsMouseDown(false);
      setInput((prev) => ({ ...prev, attack: false }));
    } else if (event.button === 2) {
      setIsRightMouseDown(false);
      setInput((prev) => ({ ...prev, block: false }));
    }
  }, []);

  const handleContextMenu = useCallback((event: MouseEvent): void => {
    event.preventDefault(); // Prevent right-click menu
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleContextMenu]);

  return { input, isMouseDown, isRightMouseDown };
}
```

### File: `client/src/hooks/index.ts`
```typescript
export { useInput } from './useInput';
```

### Acceptance Criteria
- [ ] WASD keys detected
- [ ] Space (sprint) detected
- [ ] Mouse buttons detected
- [ ] Number keys 1-6 detected
- [ ] Q/E weapon cycling detected
- [ ] Right-click menu prevented

---

## Task 2.6: Create Player Character Model

### Objective
Build a stylized block-based humanoid character.

### File: `client/src/game/entities/PlayerModel.tsx`
```typescript
import { useRef } from 'react';
import { Group } from 'three';

interface PlayerModelProps {
  color: string;
  isBlocking?: boolean;
}

export function PlayerModel({ color, isBlocking = false }: PlayerModelProps): JSX.Element {
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
```

### Acceptance Criteria
- [ ] Block-based humanoid visible
- [ ] Body, head, arms, legs rendered
- [ ] Color prop affects body/arms
- [ ] Blocking pose changes arm position

---

## Task 2.7: Create Player Controller

### Objective
Implement player movement with physics and sprint functionality.

### File: `client/src/game/entities/Player.tsx`
```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { PlayerModel } from './PlayerModel';
import { useInput } from '@/hooks/useInput';
import { useGameStore } from '@/stores/gameStore';
import { WALK_SPEED, SPRINT_SPEED, SPRINT_STAMINA_COST, MAX_STAMINA, STAMINA_RECOVERY_RATE } from '@/utils/constants';

interface PlayerProps {
  playerId: string;
  startPosition: [number, number, number];
  color: string;
  isLocal: boolean;
}

export function Player({ playerId, startPosition, color, isLocal }: PlayerProps): JSX.Element {
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
        rotation: 0,
        velocity: { x: 0, y: 0, z: 0 },
        health: 10,
        stamina: MAX_STAMINA,
        currentWeaponSlot: 'sword',
        weapons: {
          sword: { type: 'sword', durability: 15, maxDurability: 15, isBroken: false },
          spear: { type: 'spear', durability: 15, maxDurability: 15, isBroken: false },
          club: { type: 'club', durability: 8, maxDurability: 8, isBroken: false },
          bow: { type: 'bow', durability: Infinity, maxDurability: Infinity, isBroken: false },
          shield: { type: 'shield', durability: 30, maxDurability: 30, isBroken: false },
          bomb: { type: 'bomb', durability: Infinity, maxDurability: Infinity, isBroken: false },
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

    // Calculate movement direction from input
    moveDirection.current.set(0, 0, 0);
    
    if (input.moveForward) moveDirection.current.z -= 1;
    if (input.moveBackward) moveDirection.current.z += 1;
    if (input.moveLeft) moveDirection.current.x -= 1;
    if (input.moveRight) moveDirection.current.x += 1;

    // Normalize diagonal movement
    if (moveDirection.current.length() > 0) {
      moveDirection.current.normalize();
    }

    // Determine speed based on sprint state
    const canSprint = input.sprint && stamina > 0 && moveDirection.current.length() > 0;
    const speed = canSprint ? SPRINT_SPEED : WALK_SPEED;

    // Apply movement
    velocity.current.set(
      moveDirection.current.x * speed,
      rb.linvel().y, // Preserve vertical velocity (gravity)
      moveDirection.current.z * speed
    );

    rb.setLinvel(velocity.current, true);

    // Calculate rotation to face movement direction
    let newRotation = player.rotation;
    if (moveDirection.current.length() > 0) {
      newRotation = Math.atan2(moveDirection.current.x, moveDirection.current.z);
    }

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
      velocity: { x: velocity.current.x, y: velocity.current.y, z: velocity.current.z },
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
```

### Acceptance Criteria
- [ ] Player spawns at start position
- [ ] WASD moves player in correct directions
- [ ] Space activates sprint (faster movement)
- [ ] Sprint drains stamina
- [ ] Stamina recovers when not sprinting
- [ ] Player rotates to face movement direction
- [ ] Player collides with obstacles
- [ ] Player state updates in store

---

## Task 2.8: Create Fixed Follow Camera

### Objective
Implement a camera that follows behind the player at a fixed angle.

### File: `client/src/game/entities/FollowCamera.tsx`
```typescript
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
  smoothness = 5 
}: FollowCameraProps): null {
  const { camera } = useThree();
  const player = useGameStore((state) => state.players.get(playerId));
  
  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());

  useFrame((_, delta) => {
    if (!player) return;

    const { position, rotation } = player;

    // Calculate camera position behind player
    const offsetX = Math.sin(rotation) * distance;
    const offsetZ = Math.cos(rotation) * distance;

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
```

### Acceptance Criteria
- [ ] Camera follows player position
- [ ] Camera stays behind player based on rotation
- [ ] Camera movement is smooth (lerped)
- [ ] Camera looks at player center
- [ ] Height and distance configurable

---

## Task 2.9: Create Player Entity Index

### Objective
Export all player-related components.

### File: `client/src/game/entities/index.ts`
```typescript
export { Player } from './Player';
export { PlayerModel } from './PlayerModel';
export { FollowCamera } from './FollowCamera';
```

### Acceptance Criteria
- [ ] All components exported from index

---

## Task 2.10: Update App with Game Scene

### Objective
Integrate the world and player into the main application.

### File: `client/src/App.tsx`
```typescript
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { World } from '@/game/world';
import { Player, FollowCamera } from '@/game/entities';
import { useGameStore } from '@/stores/gameStore';

function GameScene(): JSX.Element {
  const localPlayerId = useGameStore((state) => state.localPlayerId);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[20, 30, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <hemisphereLight args={['#87ceeb', '#3a5a40', 0.3]} />

      {/* Sky color */}
      <color attach="background" args={['#87ceeb']} />

      <Physics gravity={[0, -20, 0]}>
        <World />
        <Player 
          playerId="local-player" 
          startPosition={[0, 2, 20]} 
          color="#4ecdc4"
          isLocal={true}
        />
      </Physics>

      {localPlayerId && (
        <FollowCamera playerId={localPlayerId} />
      )}
    </>
  );
}

function LoadingScreen(): JSX.Element {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#4ecdc4" />
    </mesh>
  );
}

function HUD(): JSX.Element {
  const player = useGameStore((state) => 
    state.localPlayerId ? state.players.get(state.localPlayerId) : null
  );

  if (!player) return <></>;

  return (
    <div className="absolute bottom-4 left-4 p-4 bg-game-dark/80 rounded-lg">
      <div className="text-white font-game">
        <p>❤️ Health: {player.health}/10</p>
        <p>⚡ Stamina: {player.stamina.toFixed(1)}/20</p>
        <p>🗡️ Weapon: {player.currentWeaponSlot}</p>
        <p>🏃 Sprinting: {player.isSprinting ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}

function ControlsHint(): JSX.Element {
  return (
    <div className="absolute top-4 right-4 p-4 bg-game-dark/80 rounded-lg text-sm">
      <p className="text-game-accent font-bold mb-2">Controls</p>
      <p className="text-white">WASD - Move</p>
      <p className="text-white">Space - Sprint</p>
      <p className="text-white">Left Click - Attack</p>
      <p className="text-white">Right Click - Block</p>
      <p className="text-white">1-6 - Switch Weapon</p>
    </div>
  );
}

function App(): JSX.Element {
  // Initialize local player ID
  useGameStore.getState().setLocalPlayerId('local-player');
  useGameStore.getState().setPhase('playing');

  return (
    <div className="w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 200 }}
        className="absolute inset-0"
      >
        <Suspense fallback={<LoadingScreen />}>
          <GameScene />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <HUD />
        <ControlsHint />
      </div>
    </div>
  );
}

export default App;
```

### Acceptance Criteria
- [ ] Arena and obstacles render
- [ ] Player character visible
- [ ] Camera follows player
- [ ] HUD shows health/stamina
- [ ] Controls hint visible
- [ ] Physics works (gravity, collisions)

---

## Task 2.11: Test and Verify

### Commands
```bash
cd /Users/danilobibancos/slash_clash/client
npm run types
npm run lint
npm run dev
```

### Manual Testing Checklist
- [ ] Player moves with WASD
- [ ] Player sprints with Space
- [ ] Stamina decreases while sprinting
- [ ] Stamina recovers when not sprinting
- [ ] Player rotates to face movement direction
- [ ] Camera follows smoothly behind player
- [ ] Player collides with rocks and walls
- [ ] Player cannot leave arena bounds
- [ ] HUD updates in real-time
- [ ] No console errors

---

## Phase 2 Complete Checklist

Before proceeding to Phase 3, verify:

- [ ] Arena ground with grid visible
- [ ] Rocks and walls placed around arena
- [ ] Invisible boundary walls working
- [ ] Input hook captures all controls
- [ ] Block-style player model rendered
- [ ] WASD movement working correctly
- [ ] Sprint with stamina drain/recovery
- [ ] Fixed follow camera tracking player
- [ ] Player collides with environment
- [ ] HUD displays player stats
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `03-combat-system.md`
