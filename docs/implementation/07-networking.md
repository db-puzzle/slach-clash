# Phase 7: Networking

## Overview

Implement multiplayer functionality with peer-to-peer architecture, including terrain synchronization to ensure all players have identical terrain.

**Estimated Time:** 8-10 hours  
**Prerequisites:** Phase 6 complete

---

## Task 7.1: Initialize Server Project

### Commands
```bash
cd /Users/danilobibancos/slash_clash
mkdir -p server/src
cd server
npm init -y
npm install express socket.io cors
npm install -D typescript @types/node @types/express ts-node nodemon
npx tsc --init
```

### File: `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### Acceptance Criteria
- [ ] Server project initialized
- [ ] Dependencies installed
- [ ] TypeScript configured

---

## Task 7.2: Lobby Server

### File: `server/src/index.ts`

Create Socket.io server for lobby management:

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

interface Lobby {
  id: string;
  hostId: string;
  squadSize: number;
  players: Map<string, LobbyPlayer>;
}

const lobbies = new Map<string, Lobby>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('createLobby', (squadSize: number) => {
    const lobbyId = generateLobbyId();
    // Create and store lobby
  });
  
  socket.on('joinLobby', (lobbyId: string, playerName: string) => {
    // Join existing lobby
  });
  
  socket.on('ready', (lobbyId: string) => {
    // Toggle ready state
  });
  
  socket.on('startMatch', (lobbyId: string) => {
    // Start game if all ready
  });
});

httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### Key Events
- `createLobby` - Host creates new lobby
- `joinLobby` - Player joins existing lobby
- `leaveLobby` - Player leaves lobby
- `ready` - Toggle ready state
- `selectTeam` - Change team
- `startMatch` - Begin game (host only)

### Acceptance Criteria
- [ ] Server starts on port 3001
- [ ] Lobbies can be created
- [ ] Players can join/leave
- [ ] Ready states tracked

---

## Task 7.3: Client Socket Service

### File: `client/src/networking/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectToServer(): Socket {
  if (socket) return socket;
  
  socket = io('http://localhost:3001');
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function createLobby(squadSize: number): void {
  socket?.emit('createLobby', squadSize);
}

export function joinLobby(lobbyId: string, playerName: string): void {
  socket?.emit('joinLobby', lobbyId, playerName);
}

export function setReady(lobbyId: string): void {
  socket?.emit('ready', lobbyId);
}

export function startMatch(lobbyId: string): void {
  socket?.emit('startMatch', lobbyId);
}
```

### Acceptance Criteria
- [ ] Client connects to server
- [ ] All lobby actions work
- [ ] Events properly typed

---

## Task 7.4: Lobby Store

### File: `client/src/stores/lobbyStore.ts`

```typescript
import { create } from 'zustand';
import type { LobbyPlayer, LobbyState } from '@/types';

interface LobbyStore {
  lobby: LobbyState | null;
  isHost: boolean;
  localPlayerId: string | null;
  
  setLobby: (lobby: LobbyState) => void;
  updatePlayer: (player: LobbyPlayer) => void;
  removePlayer: (playerId: string) => void;
  clearLobby: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobby: null,
  isHost: false,
  localPlayerId: null,
  
  setLobby: (lobby) => set({ lobby }),
  // ... other actions
}));
```

### Acceptance Criteria
- [ ] Lobby state managed
- [ ] Updates from server applied
- [ ] Host status tracked

---

## Task 7.5: Peer-to-Peer Game State

### File: `client/src/networking/peerConnection.ts`

Host broadcasts game state, clients send inputs:

```typescript
// Host: runs game loop, broadcasts state
export function hostGameLoop(): void {
  // Update physics
  // Process AI
  // Broadcast state to all clients
  socket.emit('gameState', serializeGameState());
}

// Client: send inputs to host
export function sendInput(input: InputState): void {
  socket.emit('playerInput', input);
}

// Client: receive and apply game state
socket.on('gameState', (state) => {
  applyGameState(state);
});
```

### Key Concepts
- Host runs authoritative game loop
- Clients only send inputs
- Host broadcasts state 30-60 times/second
- Clients interpolate between updates

### Acceptance Criteria
- [ ] Host broadcasts state
- [ ] Clients send inputs
- [ ] State synchronization works

---

## Task 7.6: Terrain Synchronization

### Objective
Ensure all players in a match have identical terrain by synchronizing the terrain seed.

### File: `client/src/networking/terrainSync.ts`
```typescript
import type { HeightmapConfig } from '@/types';
import { ROLLING_HILLS_CONFIG } from '@/utils/constants';

interface TerrainSyncData {
  seed: number;
  mapId: string;
  configOverrides?: Partial<HeightmapConfig>;
}

// Host generates terrain seed at match start
export function generateTerrainSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

// Include terrain in lobby/match start message
export function getTerrainSyncData(seed: number, mapId: string = 'rolling_hills'): TerrainSyncData {
  return {
    seed,
    mapId,
    configOverrides: undefined,
  };
}

// Client receives terrain data and generates matching terrain
export function applyTerrainSync(syncData: TerrainSyncData): HeightmapConfig {
  const baseConfig = ROLLING_HILLS_CONFIG; // Could select based on mapId in future
  return {
    ...baseConfig,
    seed: syncData.seed,
    ...(syncData.configOverrides ?? {}),
  };
}
```

### Integration with Lobby Server

Update server to broadcast terrain seed:

```typescript
// In server/src/index.ts

socket.on('startMatch', (lobbyId: string) => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;
  
  // Generate terrain seed for this match
  const terrainSeed = Math.floor(Math.random() * 2147483647);
  
  // Broadcast match start with terrain data
  io.to(lobbyId).emit('matchStart', {
    terrainSeed,
    mapId: 'rolling_hills',
    players: Array.from(lobby.players.values()),
  });
});
```

### Acceptance Criteria
- [ ] Host generates terrain seed at match start
- [ ] Seed broadcast to all players
- [ ] All clients generate identical terrain
- [ ] Terrain sync data included in match start

---

## Task 7.7: State Serialization

### File: `client/src/networking/serialization.ts`

Efficient state encoding (terrain data is NOT serialized each frame - only the seed is shared at match start):

```typescript
interface NetworkGameState {
  timestamp: number;
  players: NetworkPlayerState[];
  projectiles: NetworkProjectile[];
  droppedItems: NetworkDroppedItem[];
}

// Note: Terrain is NOT included in frame-by-frame sync
// All clients generate terrain locally from the shared seed
// This saves significant bandwidth

export function serializeGameState(): NetworkGameState {
  const state = useGameStore.getState();
  return {
    timestamp: Date.now(),
    players: Array.from(state.players.values()).map(serializePlayer),
    projectiles: state.projectiles.map(serializeProjectile),
    droppedItems: state.droppedItems.map(serializeItem),
  };
}

export function applyGameState(netState: NetworkGameState): void {
  // Apply received state to local store
  // Interpolate positions for smooth movement
}
```

### Acceptance Criteria
- [ ] State serializes efficiently
- [ ] Deserialization works
- [ ] All game objects included
- [ ] Terrain NOT included (generated from seed)

---

## Task 7.8: Input Prediction (Client-Side)

### File: `client/src/networking/prediction.ts`

Local player prediction for responsiveness:

```typescript
// Client predicts local movement immediately
// Corrects when server state received

export function predictLocalMovement(input: InputState, delta: number): void {
  // Apply input locally for immediate response
  // Store prediction for later reconciliation
}

export function reconcileWithServer(serverState: PlayerState): void {
  // Compare predicted state with server state
  // Correct if discrepancy detected
}
```

### Acceptance Criteria
- [ ] Local player feels responsive
- [ ] Corrections are smooth
- [ ] No rubber-banding

---

## Task 7.9: Lobby Integration

Update lobby screen to use networking:

1. Create lobby button calls `createLobby()`
2. Join lobby uses `joinLobby(lobbyId, name)`
3. Ready button calls `setReady()`
4. Start button calls `startMatch()`
5. Listen for lobby updates from server

### Acceptance Criteria
- [ ] UI connected to networking
- [ ] Real-time lobby updates
- [ ] Match starts for all players

---

## Task 7.10: Match Flow

### Complete multiplayer match flow:

1. Host creates lobby
2. Players join and ready up
3. Host starts match
4. Server generates terrain seed and broadcasts to all clients
5. All clients generate identical terrain from seed
6. Server signals all clients to begin
7. Host runs game loop
8. Clients render and send inputs
9. Match ends when one team eliminated
10. Server records result
11. All clients return to lobby/menu

### Acceptance Criteria
- [ ] Full match flow works
- [ ] All players synchronized
- [ ] Victory/defeat shown correctly

---

## Phase 7 Complete Checklist

- [ ] Server project created
- [ ] Socket.io server running
- [ ] Lobby create/join works
- [ ] Ready system works
- [ ] Terrain seed generated at match start
- [ ] Terrain seed broadcast to all clients
- [ ] All clients generate identical terrain
- [ ] Match start synchronized
- [ ] Game state broadcasts
- [ ] Client input sending
- [ ] State synchronization
- [ ] Input prediction
- [ ] Full match flow works
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

**Next Phase:** Proceed to `08-audio-polish.md`
