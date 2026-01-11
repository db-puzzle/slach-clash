# Slash and Clash — Game Requirements Document

## 1. Overview

**Game Name:** Slash and Clash

**Genre:** Real-time multiplayer action combat

**Perspective:** Third-person 3D

**Art Style:** Cartoon, inspired by The Legend of Zelda: Breath of the Wild

**Platform:** Web browser (Phase 1), Mobile (Phase 2)

**Target Match Duration:** 5–10 minutes

**Player Mode:** Multiplayer with AI-controlled bots filling empty slots

---

## 2. Core Gameplay

### 2.1 Match Structure

- **Win Condition:** Eliminate all enemy players
- **Squad Size:** User-selected, ranging from 1v1 to larger team battles
- **Team Formation:** Players create lobbies and choose allies; unfilled slots are controlled by AI bots
- **Future Scope:** Battles with more than 2 teams

### 2.2 Match Flow

1. Host creates a lobby and selects squad size
2. Players join and ready-up
3. Match begins with teams spawning on opposite sides of the arena
4. Combat proceeds freely with no shrinking zone or time pressure
5. Match ends when one team remains

### 2.3 Player Identity

- Anonymous play (no accounts required)
- Players can name their character before each match

### 2.4 Progression

- None — each match is standalone with no persistent unlocks or rankings

---

## 3. Player Stats

### 3.1 Health

- **Maximum Hearts:** 10
- **Death:** When hearts reach 0, the player is eliminated
- **Respawn:** None — eliminated players are out for the match

### 3.2 Stamina

- **Maximum Stamina:** 20
- **Recovery Rate:** 1 stamina per 10 seconds (passive)
- **Recovery Method:** Automatic over time; lower weapon usage speeds recovery
- **Depletion Effect:** When stamina is low, movement and attack speed decrease until sufficient rest/recovery

### 3.3 Character Attributes

- All characters have identical base stats (no classes or customization)

---

## 4. Combat System

### 4.1 Weapons Overview

All players start with access to every weapon type. Weapons have durability and break after extended use.

| Weapon | Damage | Stamina Cost | Attack Speed | Range | Durability | Special |
|--------|--------|--------------|--------------|-------|------------|---------|
| Sword | 2 hearts | 1 | Fast | Short | 15 hits | Balanced, can block |
| Spear | 2 hearts | 2 | Medium | Long | 15 hits | Keeps enemies at distance |
| Club | 4 hearts | 4 | Slow | Short | 8 hits | Staggers enemy (0.5s stun) |
| Bow | 1.5 hearts | 1 | Medium | Far | N/A | Ranged, uses arrows |
| Shield | 0 | 0.5/second | N/A | N/A | 30 blocks | Blocks most attacks |
| Bomb | 3 hearts | 0 | N/A | Thrown | N/A | Area damage |

### 4.2 Consumables

| Item | Starting Amount | Notes |
|------|-----------------|-------|
| Arrows | 20 | Ammunition for bow |
| Bombs | 6 | Thrown explosive, area damage |

### 4.3 Weapon Switching

- Players cycle through weapon slots sequentially
- No delay or cooldown when switching

### 4.4 Weapon Durability

- Each weapon has a set number of uses before breaking
- Durability is calculated to allow defeating approximately 3 enemies per weapon
- When a weapon breaks, it disappears and the player automatically switches to the next slot
- Consumables (arrows, bombs) are separate from durability — they deplete by use count

### 4.5 Blocking System

| Defending With | Can Block | Cannot Block |
|----------------|-----------|--------------|
| Shield | All melee weapons, arrows | Bombs (knockback only) |
| Sword | Sword, spear (partial) | Club, arrows, bombs |
| Spear | Sword (partial) | Club, arrows, bombs |
| Club | Nothing (too slow to block) | — |

**Partial Blocks:** Reduce damage but do not eliminate it; cost extra stamina.

### 4.6 Stagger Mechanic

- Club hits cause a 0.5-second stagger (brief stun)
- Staggered players cannot move or attack during this window

### 4.7 Friendly Fire

- Enabled — players can damage teammates with all weapons including bombs
- Adds strategic risk to area attacks

---

## 5. Looting System

### 5.1 Item Drops

- When a player is eliminated, all their items drop to the ground
- Items scatter around the death location (not a single pile)

### 5.2 Pickup Mechanics

- Instant on contact — no channeling or delay
- Picked up items go into extra inventory (no slot limits)
- Players must physically move to items, creating risk/reward decisions

---

## 6. Death and Spectating

### 6.1 Elimination

- Eliminated players are removed from active play for the remainder of the match
- Death animation: Character disappears (no complex animation for Phase 1)

### 6.2 Spectator Mode

- Eliminated players can spectate the remainder of the battle
- View: Bird's-eye (top-down) perspective
- Visibility: Both friendly and enemy players are visible to spectators

---

## 7. Arena

### 7.1 Map Design

- **Size:** Large — allows for hunting/stalking phases and strategic movement
- **Layout:** Fixed battlefield (no procedural generation)
- **Obstacles:** Rocks, walls, trees, and other cover elements
- **Interactivity:** None for Phase 1 (no traps, destructibles, or pickups)

### 7.2 Spawn Points

- Teams spawn on opposite sides of the arena
- Safe distance to allow initial strategy/formation

---

## 8. Lobby System

### 8.1 Lobby Creation

- Any player can create a lobby
- Host selects squad size (1v1, 2v2, 3v3, etc.)

### 8.2 Joining

- Players can join open lobbies
- Players choose which team/side to join

### 8.3 Ready System

- All players must ready-up before match starts
- Match begins when all slots are filled (by humans or AI) and all players are ready

### 8.4 AI Bots

- Unfilled player slots are controlled by AI
- Bot behavior: Simple and predictable for Phase 1
- Bots use all weapons and follow basic combat logic

### 8.5 Restrictions

- No kick functionality — players cannot remove others from lobby

---

## 9. AI Bot Behavior (Phase 1)

### 9.1 Combat AI

- Engage nearest visible enemy
- Use appropriate weapon for range (bow at distance, melee up close)
- Basic blocking when attacked
- No advanced tactics (flanking, coordination, baiting)

### 9.2 Movement AI

- Patrol toward enemies
- Take cover occasionally
- Follow teammates loosely

---

## 10. User Interface

### 10.1 HUD Elements

- **Hearts:** Current health display (out of 10)
- **Stamina Bar:** Current stamina (out of 20)
- **Current Weapon:** Icon showing equipped weapon
- **Arrow Count:** Remaining arrows
- **Bomb Count:** Remaining bombs
- **Weapon Durability:** Visual indicator of remaining uses (optional)

### 10.2 No Minimap

- Players must rely on awareness and sound cues
- Part of the skill expression

### 10.3 Menus

- Main menu: Create lobby, join lobby, settings
- Lobby screen: Player list, team selection, ready button, squad size selector
- Post-match: Results screen showing eliminations

---

## 11. Audio

### 11.1 Sound Effects

| Event | Sound |
|-------|-------|
| Sword swing | Whoosh |
| Spear thrust | Sharper whoosh |
| Club swing | Heavy whoosh |
| Arrow shot | Bow twang + arrow whistle |
| Bomb throw | Fuse sizzle |
| Bomb explosion | Boom |
| Weapon impact (hit) | Thud/clash depending on target |
| Blocked attack | Metallic clang |
| Footsteps | Based on terrain |
| Item pickup | Chime/click |
| Player elimination | Death sound |
| Low stamina | Optional: labored breathing |

### 11.2 Music

- None for Phase 1

### 11.3 Spatial Audio

- Sound effects should be directional
- Players can hear nearby enemies (footsteps, weapon swings)
- Adds tactical awareness layer

---

## 12. Technical Architecture

### 12.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| 3D Rendering | Three.js | Scene rendering, models, animations |
| Physics/Collision | Cannon.js or Rapier | Hit detection, movement physics |
| Networking | Socket.io + Node.js | Real-time multiplayer communication |
| Frontend UI | React | HUD overlay, menus, lobby screens |
| Audio | Howler.js | Sound effect playback, spatial audio |

### 12.2 Networking Model

- **Peer-to-peer with host**
- One player's browser acts as the authoritative "server"
- All game state validation runs on host
- Other players send inputs to host, receive game state updates

**Trade-offs accepted for Phase 1:**
- Host has slight latency advantage
- Less cheat-resistant than dedicated servers
- Simpler and cheaper to implement

**Future consideration:** Migrate to dedicated game servers if player base grows.

### 12.3 Client Responsibilities

- Render game state
- Capture and send player input
- Play audio
- Display UI

### 12.4 Host Responsibilities

- Run game loop and physics simulation
- Validate all player actions
- Broadcast game state to all clients
- Control AI bot behavior

---

## 13. Phase 1 Scope

### 13.1 Included

- Single arena map with obstacles
- All 6 weapon types functional
- Durability and consumable systems
- Blocking and stagger mechanics
- Stamina and fatigue system
- Looting from eliminated players
- Lobby system with squad size selection
- AI bots (simple behavior)
- Ready-up system
- Spectator mode for eliminated players
- Core HUD (hearts, stamina, weapon, ammo)
- Sound effects
- Web browser support

### 13.2 Excluded (Future Phases)

- Mobile support (Phase 2)
- Multiple arena maps
- More than 2 teams per match
- Advanced AI behavior
- Music
- Dodge/roll mechanics
- Charged attacks
- Positioning bonuses (flanking, backstab, high ground)
- Shrinking zone / match timer
- Account system with progression
- Cosmetic unlocks
- Dedicated game servers
- Death animations
- Low health visual feedback

---

## 14. Phase 2 Roadmap (Mobile)

### 14.1 Input Adaptation

- Virtual joystick for movement
- Touch buttons for attack, block, weapon switch
- Simplified UI for smaller screens

### 14.2 Performance

- Reduced polygon count for models
- Lower particle effects
- Optimized for mobile GPUs

### 14.3 Cross-Platform

- Web and mobile players in same matches
- Consistent gameplay balance

---

## 15. Success Metrics

### 15.1 Technical

- Matches run smoothly at 60fps on mid-range hardware
- Network latency under 100ms for playable experience
- No desync between host and clients

### 15.2 Gameplay

- Average match duration: 5–10 minutes
- Weapon usage is varied (no single dominant strategy)
- AI bots provide adequate challenge for solo testing

---

## 16. Open Questions for Development

1. Exact arena dimensions and obstacle placement
2. Character model design and animations
3. Weapon visual designs
4. Bomb blast radius size
5. Arrow travel speed and drop-off
6. Specific sound effect assets
7. UI visual design and layout
8. Bot difficulty tuning

---

## 17. Appendix

### A. Damage Calculations

**Hits to eliminate a full-health player (10 hearts):**

| Weapon | Hits to Kill |
|--------|--------------|
| Sword | 5 |
| Spear | 5 |
| Club | 3 (with stagger advantage) |
| Bow | 7 |
| Bomb | 4 (but area damage) |

### B. Stamina Economy

**Actions possible with full stamina (20):**

| Weapon | Max Consecutive Attacks |
|--------|------------------------|
| Sword | 20 |
| Spear | 10 |
| Club | 5 |
| Bow | 20 |

**Recovery time from empty to full:** 200 seconds (3 min 20 sec)

### C. Weapon Durability vs Combat

Each weapon is designed to last approximately 3 enemy eliminations:

| Weapon | Durability | Hits to Kill | Enemies Defeated |
|--------|------------|--------------|------------------|
| Sword | 15 hits | 5 | 3 |
| Spear | 15 hits | 5 | 3 |
| Club | 8 hits | 3 | 2–3 |
| Shield | 30 blocks | N/A | Defensive only |
