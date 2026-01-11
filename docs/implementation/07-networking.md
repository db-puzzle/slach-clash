# Phase 7: Networking

## Overview

Implement multiplayer functionality with peer-to-peer architecture.

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

## Task 7.6: State Serialization

### File: `client/src/networking/serialization.ts`

Efficient state encoding:

```typescript
interface NetworkGameState {
  timestamp: number;
  players: NetworkPlayerState[];
  projectiles: NetworkProjectile[];
  droppedItems: NetworkDroppedItem[];
}

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

---

## Task 7.7: Input Prediction (Client-Side)

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

## Task 7.8: Lobby Integration

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

## Task 7.9: Match Flow

### Complete multiplayer match flow:

1. Host creates lobby
2. Players join and ready up
3. Host starts match
4. Server signals all clients to begin
5. Host runs game loop
6. Clients render and send inputs
7. Match ends when one team eliminated
8. Server records result
9. All clients return to lobby/menu

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
