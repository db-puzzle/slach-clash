import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { World } from '@/game/world';
import { Player, FollowCamera } from '@/game/entities';
import { useGameStore } from '@/stores/gameStore';

function GameScene(): React.JSX.Element {
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

      {localPlayerId && <FollowCamera playerId={localPlayerId} />}
    </>
  );
}

function LoadingScreen(): React.JSX.Element {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#4ecdc4" />
    </mesh>
  );
}

function HUD(): React.JSX.Element {
  const player = useGameStore((state) =>
    state.localPlayerId ? state.players.get(state.localPlayerId) : undefined
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

function ControlsHint(): React.JSX.Element {
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

function App(): React.JSX.Element {
  // Initialize local player ID and phase
  useEffect(() => {
    useGameStore.getState().setLocalPlayerId('local-player');
    useGameStore.getState().setPhase('playing');
  }, []);

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
