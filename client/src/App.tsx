import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { World } from '@/game/world';
import { Player, FollowCamera } from '@/game/entities';
import { useGameStore } from '@/stores/gameStore';
import { ROLLING_HILLS_CONFIG } from '@/utils/constants';

function GameScene(): React.JSX.Element {
  const localPlayerId = useGameStore((state) => state.localPlayerId);
  const [terrainSeed] = useState(() => Math.floor(Math.random() * 10000));

  return (
    <>
      {/* === ENHANCED LIGHTING === */}
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#b4c4d4" />
      
      {/* Main directional light (sun) with enhanced shadows */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      {/* Secondary fill light from opposite direction */}
      <directionalLight
        position={[-20, 30, -15]}
        intensity={0.3}
        color="#8ba4c4"
      />
      
      {/* Hemisphere light for sky/ground color contrast */}
      <hemisphereLight 
        args={['#87ceeb', '#3d5a3d', 0.4]} 
        position={[0, 50, 0]}
      />
      
      {/* Point light for subtle warm highlights */}
      <pointLight
        position={[0, 20, 0]}
        intensity={0.2}
        color="#ffcc88"
        distance={80}
        decay={2}
      />

      {/* === FOG FOR DEPTH PERCEPTION === */}
      <fog attach="fog" args={['#a8c4d4', 60, 200]} />

      {/* Sky gradient background */}
      <color attach="background" args={['#87b8d8']} />

      <Physics gravity={[0, -20, 0]}>
        <World seed={terrainSeed}>
          <Player
            playerId="local-player"
            startPosition={[0, 0, 40]}
            color="#4ecdc4"
            isLocal={true}
          />
        </World>
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

  // Calculate height display
  const heightDisplay = player.position.y.toFixed(1);

  return (
    <div className="absolute bottom-4 left-4 p-4 bg-game-dark/80 rounded-lg backdrop-blur-sm">
      <div className="text-white font-game space-y-1">
        <p>❤️ Health: {player.health}/10</p>
        <p>⚡ Stamina: {player.stamina.toFixed(1)}/20</p>
        <p>🗡️ Weapon: {player.currentWeaponSlot}</p>
        <p>🏃 Sprinting: {player.isSprinting ? 'Yes' : 'No'}</p>
        <p className="text-game-accent text-sm mt-2">📍 Height: {heightDisplay}m</p>
      </div>
    </div>
  );
}

function TerrainLegend(): React.JSX.Element {
  return (
    <div className="absolute bottom-4 right-4 p-3 bg-game-dark/80 rounded-lg backdrop-blur-sm text-xs">
      <p className="text-game-accent font-bold mb-2">Terrain Guide</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#4a9c4a' }} />
          <span className="text-white">Grass (low elevation)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#9a7b4a' }} />
          <span className="text-white">Dirt (mid elevation)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#f0f8ff' }} />
          <span className="text-white">Snow (high peaks)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#707070' }} />
          <span className="text-gray-300">Rock (steep slopes)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#505050' }} />
          <span className="text-gray-400 font-bold">🚫 Too steep!</span>
        </div>
      </div>
    </div>
  );
}

function ControlsHint(): React.JSX.Element {
  return (
    <div className="absolute top-4 right-4 p-4 bg-game-dark/80 rounded-lg text-sm backdrop-blur-sm">
      <p className="text-game-accent font-bold mb-2">Controls</p>
      <p className="text-white">WASD - Move</p>
      <p className="text-white">Space - Sprint</p>
      <p className="text-white">Left Click - Attack</p>
      <p className="text-white">Right Click - Block</p>
      <p className="text-white">1-6 - Switch Weapon</p>
    </div>
  );
}

function TerrainInfo(): React.JSX.Element {
  return (
    <div className="absolute top-4 left-4 p-3 bg-game-dark/80 rounded-lg text-xs backdrop-blur-sm">
      <p className="text-game-accent font-bold">Rolling Hills Arena</p>
      <p className="text-white/70">
        Height range: {ROLLING_HILLS_CONFIG.minHeight}m to {ROLLING_HILLS_CONFIG.maxHeight}m
      </p>
      <p className="text-gray-400 mt-1">
        ⚠️ Dark gray rock = too steep to climb!
      </p>
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
        camera={{ fov: 60, near: 0.1, far: 300 }}
        className="absolute inset-0"
        gl={{ 
          antialias: true,
          toneMapping: 1, // ACESFilmicToneMapping
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <GameScene />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <TerrainInfo />
        <ControlsHint />
        <HUD />
        <TerrainLegend />
      </div>
    </div>
  );
}

export default App;
