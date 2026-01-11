import { create } from 'zustand';
import type { GamePhase, PlayerState, Projectile, DroppedItem } from '@/types';

interface GameStore {
  // State
  phase: GamePhase;
  players: Map<string, PlayerState>;
  localPlayerId: string | null;
  projectiles: Projectile[];
  droppedItems: DroppedItem[];
  matchStartTime: number;
  winningTeam: number | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setLocalPlayerId: (id: string) => void;
  addPlayer: (player: PlayerState) => void;
  updatePlayer: (id: string, updates: Partial<PlayerState>) => void;
  removePlayer: (id: string) => void;
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  addDroppedItem: (item: DroppedItem) => void;
  removeDroppedItem: (id: string) => void;
  startMatch: () => void;
  endMatch: (winningTeam: number) => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'menu' as GamePhase,
  players: new Map<string, PlayerState>(),
  localPlayerId: null,
  projectiles: [] as Projectile[],
  droppedItems: [] as DroppedItem[],
  matchStartTime: 0,
  winningTeam: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setPhase: (phase): void => {
    set({ phase });
  },

  setLocalPlayerId: (id): void => {
    set({ localPlayerId: id });
  },

  addPlayer: (player): void => {
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.set(player.id, player);
      return { players: newPlayers };
    });
  },

  updatePlayer: (id, updates): void => {
    set((state) => {
      const player = state.players.get(id);
      if (!player) return state;
      const newPlayers = new Map(state.players);
      newPlayers.set(id, { ...player, ...updates });
      return { players: newPlayers };
    });
  },

  removePlayer: (id): void => {
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.delete(id);
      return { players: newPlayers };
    });
  },

  addProjectile: (projectile): void => {
    set((state) => ({
      projectiles: [...state.projectiles, projectile],
    }));
  },

  removeProjectile: (id): void => {
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== id),
    }));
  },

  addDroppedItem: (item): void => {
    set((state) => ({
      droppedItems: [...state.droppedItems, item],
    }));
  },

  removeDroppedItem: (id): void => {
    set((state) => ({
      droppedItems: state.droppedItems.filter((i) => i.id !== id),
    }));
  },

  startMatch: (): void => {
    set({
      phase: 'playing',
      matchStartTime: Date.now(),
      winningTeam: null,
    });
  },

  endMatch: (winningTeam): void => {
    set({
      phase: 'ended',
      winningTeam,
    });
  },

  resetGame: (): void => {
    set({
      ...initialState,
      players: new Map<string, PlayerState>(),
      projectiles: [],
      droppedItems: [],
    });
  },
}));
