import { useEffect } from 'react';
import { useDebugStore } from '@/stores/debugStore';
import { useGameStore } from '@/stores/gameStore';

function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function formatVector3(v: { x: number; y: number; z: number }, decimals = 2): string {
  return `(${formatNumber(v.x, decimals)}, ${formatNumber(v.y, decimals)}, ${formatNumber(v.z, decimals)})`;
}

function formatVector2(v: { x: number; z: number }, decimals = 2): string {
  return `(${formatNumber(v.x, decimals)}, ${formatNumber(v.z, decimals)})`;
}

export function DebugPanel(): React.JSX.Element {
  const phase = useGameStore((state) => state.phase);
  const isEnabled = useDebugStore((state) => state.isEnabled);
  const toggleEnabled = useDebugStore((state) => state.toggleEnabled);

  // Player physics
  const playerPosition = useDebugStore((state) => state.playerPosition);
  const playerVelocity = useDebugStore((state) => state.playerVelocity);
  const inputDirection = useDebugStore((state) => state.inputDirection);
  const actualMovement = useDebugStore((state) => state.actualMovement);

  // Terrain info
  const terrainHeight = useDebugStore((state) => state.terrainHeight);
  const slopeAngle = useDebugStore((state) => state.slopeAngle);
  const terrainNormal = useDebugStore((state) => state.terrainNormal);
  const canTraverse = useDebugStore((state) => state.canTraverse);
  const isSliding = useDebugStore((state) => state.isSliding);

  // Grounding
  const isGrounded = useDebugStore((state) => state.isGrounded);
  const distanceToGround = useDebugStore((state) => state.distanceToGround);

  // Collision info
  const nearbyColliders = useDebugStore((state) => state.nearbyColliders);
  const isBlocked = useDebugStore((state) => state.isBlocked);
  const blockReason = useDebugStore((state) => state.blockReason);

  // Frame timing
  const physicsStepsPerSecond = useDebugStore((state) => state.physicsStepsPerSecond);

  // Keyboard shortcut to toggle debug panel (press 'b')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleEnabled();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleEnabled]);

  // Don't show during flyby or when disabled
  if (phase === 'flyby') return <></>;
  if (!isEnabled) return <></>;

  // Calculate velocity magnitude
  const velocityMag = Math.sqrt(
    playerVelocity.x ** 2 + playerVelocity.z ** 2
  );
  const inputMag = Math.sqrt(inputDirection.x ** 2 + inputDirection.z ** 2);
  const actualMag = Math.sqrt(actualMovement.x ** 2 + actualMovement.z ** 2);

  // Check for movement discrepancy (blocked indicator)
  const movementRatio = inputMag > 0.1 ? actualMag / (inputMag * 8) : 1; // Assuming ~8 units/s max speed

  return (
    <div className="absolute top-20 left-4 p-3 bg-black/90 rounded-lg backdrop-blur-sm text-xs font-mono max-w-md max-h-[70vh] overflow-y-auto pointer-events-auto">
      <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
        <span className="text-yellow-400 font-bold">DEBUG PANEL</span>
        <button
          onClick={toggleEnabled}
          className="text-white/50 hover:text-white text-xs"
        >
          [B to close]
        </button>
      </div>

      {/* Block Alert */}
      {isBlocked && (
        <div className="mb-3 p-2 bg-red-600/80 rounded border border-red-400">
          <p className="text-white font-bold">⚠️ MOVEMENT BLOCKED</p>
          <p className="text-red-100 text-xs mt-1">{blockReason}</p>
        </div>
      )}

      {/* Player Position */}
      <div className="mb-3">
        <p className="text-cyan-400 font-bold mb-1">PLAYER POSITION</p>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-white/60">World:</td>
              <td className="text-white">{formatVector3(playerPosition)}</td>
            </tr>
            <tr>
              <td className="text-white/60">Terrain Y:</td>
              <td className="text-white">{formatNumber(terrainHeight)}</td>
            </tr>
            <tr>
              <td className="text-white/60">Height Above:</td>
              <td className={distanceToGround < 0 ? 'text-red-400' : 'text-white'}>
                {formatNumber(distanceToGround)}
                {distanceToGround < 0 && ' ⚠️ BELOW TERRAIN'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Movement */}
      <div className="mb-3">
        <p className="text-green-400 font-bold mb-1">MOVEMENT</p>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-white/60">Input Dir:</td>
              <td className="text-white">{formatVector2(inputDirection)}</td>
            </tr>
            <tr>
              <td className="text-white/60">Velocity:</td>
              <td className="text-white">{formatVector3(playerVelocity)}</td>
            </tr>
            <tr>
              <td className="text-white/60">Speed:</td>
              <td className="text-white">{formatNumber(velocityMag)} u/s</td>
            </tr>
            <tr>
              <td className="text-white/60">Move Ratio:</td>
              <td className={movementRatio < 0.5 ? 'text-orange-400' : 'text-white'}>
                {formatNumber(movementRatio * 100, 0)}%
                {movementRatio < 0.5 && inputMag > 0.1 && ' ⚠️ SLOW'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terrain */}
      <div className="mb-3">
        <p className="text-yellow-400 font-bold mb-1">TERRAIN</p>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-white/60">Slope:</td>
              <td className={!canTraverse ? 'text-red-400' : slopeAngle > 30 ? 'text-orange-400' : 'text-white'}>
                {formatNumber(slopeAngle, 1)}°
                {!canTraverse && ' ⚠️ TOO STEEP'}
              </td>
            </tr>
            <tr>
              <td className="text-white/60">Normal:</td>
              <td className="text-white">{formatVector3(terrainNormal, 3)}</td>
            </tr>
            <tr>
              <td className="text-white/60">Grounded:</td>
              <td className={isGrounded ? 'text-green-400' : 'text-orange-400'}>
                {isGrounded ? 'Yes' : 'No (airborne)'}
              </td>
            </tr>
            <tr>
              <td className="text-white/60">Sliding:</td>
              <td className={isSliding ? 'text-orange-400' : 'text-white'}>
                {isSliding ? 'Yes' : 'No'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nearby Colliders */}
      <div className="mb-3">
        <p className="text-purple-400 font-bold mb-1">
          NEARBY COLLIDERS ({nearbyColliders.length})
        </p>
        {nearbyColliders.length === 0 ? (
          <p className="text-white/50 italic">None detected</p>
        ) : (
          <div className="max-h-32 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-white/40">
                  <th className="text-left">Type</th>
                  <th className="text-left">Position</th>
                  <th className="text-right">Dist</th>
                </tr>
              </thead>
              <tbody>
                {nearbyColliders.map((collider, i) => (
                  <tr key={i} className={collider.distance < 1 ? 'text-orange-300' : 'text-white/80'}>
                    <td className="pr-2">{collider.type}</td>
                    <td className="pr-2">{formatVector3(collider.position, 1)}</td>
                    <td className="text-right">{formatNumber(collider.distance, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collision Analysis */}
      <div className="mb-3">
        <p className="text-red-400 font-bold mb-1">COLLISION ANALYSIS</p>
        <div className="text-white/80 space-y-1">
          {/* Check for Arena ground plane collision */}
          {playerPosition.y < 0.5 && playerPosition.y > -0.5 && terrainHeight < -1 && (
            <p className="text-red-300">
              ⚠️ Player near y=0 but terrain is at {formatNumber(terrainHeight)}.
              Arena ground plane may be interfering!
            </p>
          )}
          
          {/* Check for being below terrain */}
          {distanceToGround < -0.1 && (
            <p className="text-red-300">
              ⚠️ Player is {formatNumber(Math.abs(distanceToGround))}m BELOW terrain surface!
            </p>
          )}
          
          {/* Check for trimesh nearby */}
          {nearbyColliders.some(c => c.type === 'trimesh' && c.distance < 1) && (
            <p className="text-orange-300">
              ⚠️ Trimesh collider very close - possible terrain geometry issue
            </p>
          )}
          
          {/* Check for convex hull nearby */}
          {nearbyColliders.some(c => c.type === 'convexPolyhedron' && c.distance < 1.5) && (
            <p className="text-orange-300">
              ⚠️ Convex hull collider nearby (likely a rock obstacle)
            </p>
          )}
          
          {/* Check for cylinder nearby */}
          {nearbyColliders.some(c => c.type === 'cylinder' && c.distance < 1) && (
            <p className="text-orange-300">
              ⚠️ Cylinder collider nearby (likely a tree trunk)
            </p>
          )}

          {!isBlocked && movementRatio > 0.7 && (
            <p className="text-green-300">✓ Movement appears normal</p>
          )}
        </div>
      </div>

      {/* Performance */}
      <div className="text-white/40 text-[10px] border-t border-white/10 pt-2">
        Physics: {physicsStepsPerSecond} FPS
      </div>
    </div>
  );
}
