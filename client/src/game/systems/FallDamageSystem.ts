import { useGameStore } from '@/stores/gameStore';
import { FALL_DAMAGE_THRESHOLD } from '@/utils/constants';

interface FallTracker {
  highestY: Map<string, number>;
  isAirborne: Map<string, boolean>;
}

const tracker: FallTracker = {
  highestY: new Map(),
  isAirborne: new Map(),
};

/**
 * Called each frame to track player's highest Y position while airborne.
 * When landing, calculates and applies fall damage if applicable.
 */
export function updateFallTracking(
  playerId: string,
  currentY: number,
  isOnGround: boolean
): void {
  const highestY = tracker.highestY.get(playerId) ?? currentY;
  const wasAirborne = tracker.isAirborne.get(playerId) ?? false;

  if (!isOnGround) {
    // Player is airborne - track highest point
    if (currentY > highestY) {
      tracker.highestY.set(playerId, currentY);
    }
    tracker.isAirborne.set(playerId, true);
  } else if (wasAirborne) {
    // Player just landed - calculate fall damage
    const fallDistance = highestY - currentY;
    const damage = calculateFallDamage(fallDistance);

    if (damage > 0) {
      applyFallDamage(playerId, damage, fallDistance);
    }

    // Reset tracking
    tracker.highestY.set(playerId, currentY);
    tracker.isAirborne.set(playerId, false);
  } else {
    // On ground and wasn't airborne - update baseline
    tracker.highestY.set(playerId, currentY);
  }
}

/**
 * Calculate damage based on fall distance (tiered system).
 * 
 * | Fall Distance | Damage |
 * |---------------|--------|
 * | 0-3 units     | 0      |
 * | 3-6 units     | 1      |
 * | 6-10 units    | 2      |
 * | 10-15 units   | 3      |
 * | >15 units     | 3 + 1 per 5 additional units |
 */
export function calculateFallDamage(fallDistance: number): number {
  if (fallDistance <= FALL_DAMAGE_THRESHOLD) return 0; // Safe landing (0-3 units)
  if (fallDistance <= 6) return 1; // Minor damage
  if (fallDistance <= 10) return 2; // Moderate damage
  if (fallDistance <= 15) return 3; // Significant damage
  return 3 + Math.floor((fallDistance - 15) / 5); // Severe damage (1 per 5 additional units)
}

/**
 * Apply fall damage and effects to a player.
 */
function applyFallDamage(
  playerId: string,
  damage: number,
  fallDistance: number
): void {
  const { players, updatePlayer } = useGameStore.getState();
  const player = players.get(playerId);

  if (!player || player.isEliminated) return;

  // Calculate new health
  const newHealth = Math.max(0, player.health - damage);
  const isEliminated = newHealth <= 0;

  // Apply brief stagger on significant falls (damage >= 2)
  const staggerDuration = damage >= 2 ? 300 : 0; // 300ms stagger for significant falls
  const staggerEndTime =
    staggerDuration > 0 ? Date.now() + staggerDuration : player.staggerEndTime;

  updatePlayer(playerId, {
    health: newHealth,
    isEliminated,
    staggerEndTime,
  });

  // Log for debugging (can be removed later)
  console.log(
    `[FallDamage] Player ${playerId} fell ${fallDistance.toFixed(1)} units, took ${damage} damage. Health: ${newHealth}`
  );
}

/**
 * Reset tracker for a player (on spawn/respawn).
 */
export function resetFallTracker(playerId: string): void {
  tracker.highestY.delete(playerId);
  tracker.isAirborne.delete(playerId);
}

/**
 * Get current fall info for UI/effects.
 */
export function getFallInfo(playerId: string): {
  isAirborne: boolean;
  currentFallDistance: number;
} {
  const { players } = useGameStore.getState();
  const player = players.get(playerId);

  if (!player) {
    return { isAirborne: false, currentFallDistance: 0 };
  }

  const highestY = tracker.highestY.get(playerId) ?? player.position.y;
  const isAirborne = tracker.isAirborne.get(playerId) ?? false;

  return {
    isAirborne,
    currentFallDistance: isAirborne
      ? Math.max(0, highestY - player.position.y)
      : 0,
  };
}

/**
 * Check if a fall distance would cause damage (for UI warnings).
 */
export function wouldCauseFallDamage(fallDistance: number): boolean {
  return fallDistance > FALL_DAMAGE_THRESHOLD;
}
