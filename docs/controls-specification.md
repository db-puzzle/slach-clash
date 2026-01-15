# Slash and Clash — Controls Specification

## 1. Overview

This document defines the control scheme for **Slash and Clash**, a third-person 3D multiplayer action combat game.

**Platforms:** Web Browser (Keyboard + Mouse) and Mobile (Touch Controls)

**Cross-Platform Play:** Desktop and mobile players compete in the same matches. Control schemes are designed for parity in gameplay effectiveness.

---

## 2. Control Philosophy

### 2.1 Design Principles

1. **Camera-Relative Movement**: Movement direction is relative to where the camera is facing, not where the character is facing. This is the modern standard for third-person action games.

2. **Free-Look Camera**: Players can rotate the camera independently of character movement, allowing situational awareness during combat.

3. **Target Lock-On**: Optional lock-on system for focused combat, allowing strafing around enemies while maintaining facing.

4. **Platform Parity**: Both desktop and mobile controls provide equivalent tactical options, though input methods differ.

5. **Familiar Mappings**: Controls follow industry conventions (Shift = Sprint, Space = Shield, Mouse = Camera).

6. **Quick Defense**: Space provides instant shield access regardless of equipped weapon, enabling reactive defense.

### 2.2 Control Modes

The game supports two control modes that players can switch between:

| Mode | Description | Best For |
|------|-------------|----------|
| **Free Camera** | Camera rotates freely with mouse/touch; movement is camera-relative | Exploration, ranged combat, 1vMany |
| **Target Lock** | Camera locks onto target; character faces target; strafing enabled | Dueling, melee combat, 1v1 |

---

## 3. Desktop Controls (Keyboard + Mouse)

### 3.1 Movement

| Action | Control |
|--------|---------|
| Move Forward | `W` |
| Move Backward | `S` |
| Strafe Left | `A` |
| Strafe Right | `D` |
| Sprint | `Shift` (hold) |

**Movement Behavior:**

- **Camera-Relative**: Pressing `W` moves toward where the camera is pointing
- **Character Rotation**: Character automatically faces movement direction (unless locked on)
- **Diagonal Movement**: Normalized to prevent faster diagonal speed
- **Backward Movement**: Character can walk backward while facing forward (useful when locked on)

### 3.2 Camera Control

| Action | Control |
|--------|---------|
| Rotate Camera | Mouse Movement |
| Toggle Target Lock | `Tab` or `Middle Mouse Button` |
| Cycle Lock Target | `Mouse Scroll` (while locked) |
| Reset Camera Behind Player | `V` |

**Camera Behavior:**

- **Free Camera Mode**: 
  - Mouse rotates camera around player (orbit camera)
  - Camera maintains set distance and height behind player
  - Smooth interpolation prevents jarring movement

- **Target Lock Mode**:
  - Camera automatically positions to keep both player and target in view
  - Player character always faces the locked target
  - `A` and `D` become true strafing (circling the target)
  - Lock breaks if target moves out of range or behind obstacles

**Camera Settings:**

| Setting | Default | Range |
|---------|---------|-------|
| Horizontal Sensitivity | 1.0 | 0.1 - 3.0 |
| Vertical Sensitivity | 1.0 | 0.1 - 3.0 |
| Invert Y-Axis | Off | On/Off |
| Camera Distance | 12 units | 8 - 20 units |

### 3.3 Combat

#### Basic Combat

| Action | Control |
|--------|---------|
| Attack | `Left Mouse Button` (click) |
| Block | `Right Mouse Button` (hold) |
| Quick Shield | `Space` (hold) |
| Target Lock Toggle | `Tab` or `Middle Mouse Button` |

**Notes:**

- Attack executes with the currently equipped weapon
- Blocking behavior varies based on equipped weapon (see section 3.4)
- Each attack consumes stamina based on weapon type
- Quick Shield instantly raises shield regardless of equipped weapon

#### Quick Shield Mechanics

| Property | Value |
|----------|-------|
| Activation | Instant |
| Stamina Cost | 0.5 per second (same as regular shield) |
| Movement Speed | Reduced by 30% while raised |
| Weapon Requirement | Requires shield to not be broken |

**Notes:**

- Provides instant defensive option without weapon switching
- Uses the shield from inventory (requires available shield durability)
- Returns to previously equipped weapon when released
- Cannot attack while Quick Shield is active (release first)
- If shield is broken, Space has no effect

#### Weapon Switching

| Action | Control |
|--------|---------|
| Cycle to Next Weapon | `E` |
| Cycle to Previous Weapon | `Q` |
| Equip Sword | `1` |
| Equip Spear | `2` |
| Equip Club | `3` |
| Equip Bow | `4` |
| Equip Shield | `5` |
| Equip Bomb | `6` |

**Notes:**

- Weapon switching is instant with no delay or cooldown
- If a weapon is broken/depleted, pressing its number key has no effect
- Cycling with Q/E automatically skips broken weapons

### 3.4 Weapon-Specific Controls

#### Sword, Spear, Club

| Action | Control |
|--------|---------|
| Swing/Attack | `Left Mouse Button` (click) |
| Block | `Right Mouse Button` (hold) |

**Blocking Effectiveness:**

- **Sword:** Can block sword and spear attacks (partial block on spear)
- **Spear:** Can block sword attacks (partial block only)
- **Club:** Cannot block (too slow)

#### Bow

| Action | Control |
|--------|---------|
| Draw Arrow | `Left Mouse Button` (press and hold) |
| Aim | Mouse Movement (while drawn) |
| Fire Arrow | `Left Mouse Button` (release) |
| Cancel Shot | `Right Mouse Button` (while drawn) |

**Notes:**

- Arrow fires toward crosshair/camera center
- While aiming, movement speed is reduced by 50%
- Holding the draw does not consume stamina; releasing fires and consumes 1 stamina
- Requires arrows (consumable resource)
- Target lock provides aim assist (arrow curves slightly toward target)

#### Shield

| Action | Control |
|--------|---------|
| Raise Shield | `Right Mouse Button` (hold) OR `Space` (hold) |
| Shield Bash | `Left Mouse Button` (click while shield raised) |

**Notes:**

- Shield blocks all melee weapons and arrows
- Bombs cause knockback even when blocking
- Holding shield consumes 0.5 stamina per second
- Movement speed reduced by 30% while shield raised
- Space provides Quick Shield access from any weapon

#### Bomb

| Action | Control |
|--------|---------|
| Throw Bomb | `Left Mouse Button` (click) |
| Detonate Bomb | `Left Mouse Button` (click again after thrown) |

**Notes:**

- Bomb is thrown toward crosshair/camera center
- Arc trajectory with gravity
- Second click detonates the bomb mid-flight or on ground
- Auto-detonates after 5 seconds if not manually triggered
- Limited by bomb count (consumable resource)

### 3.5 Items & Looting

| Action | Control |
|--------|---------|
| Pick Up Items | Automatic (on contact) |

**Notes:**

- No button press required
- Items automatically added to inventory when player walks over them
- Includes weapons, arrows, and bombs from eliminated players

### 3.6 Menu & UI

| Action | Control |
|--------|---------|
| Open/Close Menu | `ESC` |
| Toggle Scoreboard | `Tab` (hold) — when not in combat |

**Available in Menu:**

- Settings (Controls, Audio, Video)
- Exit to Lobby
- Resume Match

**Notes:**

- Game continues for all players when ESC is pressed (no pause in multiplayer)
- Mouse cursor appears when menu is open
- Pointer Lock releases when menu opens

---

## 4. Mobile Controls (Touch)

### 4.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Health/Stamina]                              [Settings]   │
│                                                             │
│                                                             │
│                      [Crosshair]                            │
│                                                             │
│                                                             │
│    ┌───────┐                                   [Weapon]     │
│    │       │                              ┌───┐  Wheel      │
│    │ Move  │         (Camera Zone)        │Atk│   ┌───┐     │
│    │ Stick │                              └───┘   │Blk│     │
│    └───────┘                       [Shield]       └───┘     │
│              [Sprint]                [Lock]                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Movement & Camera

| Action | Control |
|--------|---------|
| Move | Left Virtual Joystick |
| Sprint | Sprint button (toggle) OR joystick pushed to edge |
| Camera Rotation | Drag anywhere on right 60% of screen |
| Reset Camera | Double-tap camera zone |

**Movement Behavior:**

- **Virtual Joystick**: Appears where left thumb touches; disappears on release
- **Camera-Relative**: Movement direction follows camera orientation
- **Joystick Deadzone**: Small deadzone prevents accidental movement
- **Sprint Toggle**: Tap sprint button to toggle; auto-disables when stopping

**Camera Settings (Mobile):**

| Setting | Default | Range |
|---------|---------|-------|
| Touch Sensitivity | 1.0 | 0.5 - 2.0 |
| Invert Y-Axis | Off | On/Off |
| Camera Smoothing | Medium | Low/Medium/High |

### 4.3 Combat

| Action | Control |
|--------|---------|
| Attack | Attack Button (tap) |
| Block | Block Button (toggle on/off) |
| Quick Shield | Shield Button (toggle on/off) |
| Target Lock | Lock Button (toggle) |
| Cycle Lock Target | Swipe left/right on Lock Button |

**Notes:**

- **Block is Toggle**: Tap to start blocking, tap again to stop (holding is fatiguing on touch)
- **Quick Shield**: Dedicated button raises shield regardless of equipped weapon
- **Attack Button Position**: Bottom-right, large touch target

### 4.4 Weapon Selection (Weapon Wheel)

| Action | Control |
|--------|---------|
| Open Weapon Wheel | Tap weapon icon (right side) |
| Select Weapon | Drag to weapon and release |
| Quick Switch (Next) | Swipe right on weapon icon |
| Quick Switch (Previous) | Swipe left on weapon icon |
| Close Without Selecting | Tap outside wheel |

**Weapon Wheel Behavior:**

- Opens radially around weapon icon
- Shows all 6 weapons with durability indicators
- Broken weapons appear grayed out
- Time slows to 50% while wheel is open (single-player feel in multiplayer)
- Auto-closes after 2 seconds of inactivity

### 4.5 Weapon-Specific (Mobile)

#### Bow

| Action | Control |
|--------|---------|
| Draw Arrow | Press and hold Attack Button |
| Aim | Drag on camera zone while drawn |
| Fire Arrow | Release Attack Button |
| Cancel Shot | Tap Block Button while drawn |

**Notes:**

- Aim assist is slightly stronger on mobile (larger target hitbox)
- Charge indicator shows draw progress

#### Shield

| Action | Control |
|--------|---------|
| Raise Shield | Block Button (toggle on) OR Shield Button |
| Shield Bash | Attack Button while blocking |
| Lower Shield | Block Button (toggle off) OR release Shield Button |

#### Bomb

| Action | Control |
|--------|---------|
| Throw Bomb | Tap Attack Button |
| Aim Throw | Drag on camera zone before throwing |
| Detonate | Tap Attack Button again |

**Notes:**

- Trajectory preview line shows where bomb will land
- Tap anywhere after throwing to detonate

### 4.6 Target Lock (Mobile)

| Action | Control |
|--------|---------|
| Enable Lock-On | Tap Lock Button |
| Cycle Targets | Swipe left/right on Lock Button |
| Disable Lock-On | Tap Lock Button again |
| Auto-Lock Nearest | Double-tap Lock Button |

**Lock-On Behavior:**

- Lock icon appears above targeted enemy
- Camera automatically tracks target
- Movement becomes strafing around target
- Lock breaks if target eliminated or out of range

### 4.7 Mobile UI Customization

Players can customize touch control layout:

| Option | Description |
|--------|-------------|
| Button Size | Small / Medium / Large |
| Button Opacity | 25% - 100% |
| Joystick Position | Adjustable anchor point |
| Button Layout | Preset layouts or custom drag-to-position |
| Haptic Feedback | On / Off / Intensity |

---

## 5. Spectator Controls

When eliminated, players enter spectator mode with a bird's-eye (top-down) view.

### 5.1 Desktop Spectator

| Action | Control |
|--------|---------|
| Pan Camera | `WASD` or Mouse at screen edge |
| Rotate View | Mouse Movement |
| Zoom In | `Mouse Scroll Up` |
| Zoom Out | `Mouse Scroll Down` |
| Follow Player | Click on player |
| Cycle Players | `Q` / `E` |
| Free Camera | `F` |
| Exit to Menu | `ESC` |

### 5.2 Mobile Spectator

| Action | Control |
|--------|---------|
| Pan Camera | Drag with one finger |
| Zoom | Pinch gesture |
| Follow Player | Tap on player |
| Cycle Players | Swipe left/right on player list |
| Exit to Menu | Tap menu button |

**Notes:**

- Spectators can see all players (both teams)
- Camera can move freely across the entire arena
- Player names and health bars visible to spectators

---

## 6. Lobby Controls

### 6.1 Desktop Lobby

| Action | Control |
|--------|---------|
| Select Team | `Left Mouse Button` (click on team slot) |
| Ready Up | `Left Mouse Button` (click ready button) |
| Change Character Name | Click name field, type name |
| Leave Lobby | `ESC` or click "Leave" button |
| Chat | `Enter` to open chat, type, `Enter` to send |

### 6.2 Mobile Lobby

| Action | Control |
|--------|---------|
| Select Team | Tap team slot |
| Ready Up | Tap ready button |
| Change Character Name | Tap name field, use keyboard |
| Leave Lobby | Tap "Leave" button |
| Chat | Tap chat input, use keyboard |

**Host-Only Controls:**

- Select squad size via dropdown/picker
- Start match when all players are ready

---

## 7. Control Feedback & Visual Indicators

### 7.1 Visual Feedback

| State | Indicator |
|-------|-----------|
| Weapon Equipped | Weapon icon highlighted in HUD |
| Blocking | Shield effect animation, character pose change |
| Quick Shield Active | Shield icon pulse, character raises shield |
| Low Stamina | Stamina bar color change (yellow → red) |
| Weapon About to Break | Durability indicator flashing red |
| Out of Arrows/Bombs | Grayed-out icon, "0" displayed |
| Sprint Active | Motion blur effect, speed lines |
| Target Locked | Lock icon above enemy, screen edge highlight |
| Shield Broken | Shield button grayed out, "X" overlay |
| Aim Mode (Bow) | Crosshair tightens, vignette effect |

### 7.2 Audio Feedback

| Action | Sound Cue |
|--------|-----------|
| Weapon Switch | Click/whoosh sound |
| Attack | Weapon-specific swing sound |
| Successful Hit | Impact/clash sound |
| Block Successful | Metallic clang |
| Weapon Broken | Crack/shatter sound |
| Shield Raised | Shield ready sound |
| Target Lock On | Lock-on chime |
| Target Lock Off | Unlock sound |
| Out of Stamina | Exhausted gasp |
| Low Stamina Warning | Heartbeat/breathing |

### 7.3 Haptic Feedback (Mobile)

| Action | Vibration Pattern |
|--------|-------------------|
| Attack Hit | Short strong pulse |
| Blocked Attack | Double pulse |
| Damage Taken | Long medium pulse |
| Shield Raised | Quick light tap |
| Weapon Switch | Light tap |
| Target Lock | Medium pulse |

---

## 8. Cross-Platform Considerations

### 8.1 Input Parity

Both platforms must provide equivalent capabilities:

| Capability | Desktop | Mobile |
|------------|---------|--------|
| Precise aiming | Mouse | Touch + aim assist |
| Quick weapon switch | Number keys | Weapon wheel (time-slow) |
| Camera control | Mouse (instant) | Touch drag (smooth) |
| Quick Shield | Spacebar | Shield button |
| Block hold | RMB hold | Toggle button |

### 8.2 Balance Adjustments

To ensure fair cross-platform play:

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Bow aim assist | None | Slight curve toward target |
| Target lock range | 15 units | 18 units |
| Weapon wheel | Instant | 50% time slow |
| Input buffering | 50ms | 100ms |

### 8.3 Visual Indicators

Both platforms show when opponents are on different input types:

- Controller icon next to name for mobile players
- Keyboard icon next to name for desktop players

---

## 9. Control Remapping

### 9.1 Desktop Remapping

Players can rebind all keyboard keys:

| Rebindable Actions | Default |
|--------------------|---------|
| All movement keys | WASD |
| Sprint | Shift |
| Quick Shield | Space |
| Attack | LMB |
| Block | RMB |
| Target Lock | Tab / MMB |
| Weapon slots 1-6 | 1-6 |
| Weapon cycle | Q / E |
| Menu | ESC |
| Camera reset | V |

**Notes:**

- Mouse buttons can be swapped (left-handed support)
- Settings saved to browser localStorage
- Import/Export settings as JSON

### 9.2 Mobile Customization

| Customizable | Options |
|--------------|---------|
| Button positions | Drag to reposition |
| Button sizes | Small / Medium / Large |
| Joystick type | Fixed / Floating |
| Sprint activation | Toggle / Edge-push / Dedicated button |
| Block mode | Hold / Toggle |

---

## 10. Accessibility

### 10.1 Available Options

| Option | Description |
|--------|-------------|
| Colorblind Modes | Deuteranopia, Protanopia, Tritanopia filters |
| Team Indicators | Shapes/patterns in addition to colors |
| High Contrast UI | Bold outlines, larger text |
| Screen Shake | Adjustable intensity (0-100%) |
| Hold vs Toggle | Block, Sprint, Aim can be toggle instead of hold |
| One-Handed Mode | All actions accessible with one hand |
| Auto-Lock | Automatically lock onto nearest enemy |
| Reduced Motion | Disable motion blur, speed lines |
| Text Size | Adjustable UI text scaling |
| Audio Cues | Visual indicators for important sounds |

### 10.2 Motor Accessibility

| Feature | Description |
|---------|-------------|
| Input buffering | Actions queue if pressed slightly early |
| Simplified controls mode | Reduces required inputs |
| Sticky targeting | Lock-on doesn't break as easily |

---

## 11. Tutorial & Control Hints

### 11.1 First-Time Player Experience

Interactive tutorial covering:

1. **Movement** (30 seconds): WASD/joystick basics
2. **Camera** (30 seconds): Mouse/touch look, reset camera
3. **Combat Basics** (60 seconds): Attack, block, stamina
4. **Target Lock** (30 seconds): Lock-on, strafing
5. **Quick Shield** (30 seconds): Instant defense with Space
6. **Weapons** (60 seconds): Switching, durability, weapon types

**Completion:** Tutorial can be skipped; progress saved

### 11.2 In-Game Contextual Hints

| Trigger | Hint |
|---------|------|
| First movement | "Use WASD to move" / "Use joystick to move" |
| Near enemy | "Tab to lock on" / "Tap lock button" |
| Stamina depleted | "Wait for stamina to recover" |
| Weapon breaks | "Weapon broken! Press Q/E to switch" |
| Out of arrows | "No arrows remaining" |
| Near loot | "Walk over items to collect" |
| Taking damage | "Press Space for Quick Shield" / "Tap shield button" |
| Enemy attacking | "Hold RMB or Space to block" / "Tap block or shield" |

**Settings:** Hints can be disabled in options

---

## 12. Control Testing Checklist

### 12.1 Desktop

- [ ] WASD movement is camera-relative
- [ ] Mouse rotates camera smoothly
- [ ] Shift sprint works and consumes stamina
- [ ] Space raises shield instantly (Quick Shield)
- [ ] Quick Shield works regardless of equipped weapon
- [ ] Quick Shield fails gracefully when shield is broken
- [ ] Tab toggles target lock
- [ ] Lock-on enables strafing movement
- [ ] Lock breaks appropriately (range, LOS, death)
- [ ] LMB attack works with all weapons
- [ ] RMB block works with sword, spear, shield
- [ ] Q/E cycles through available weapons
- [ ] Number keys 1-6 equip specific weapons
- [ ] Bow aiming follows camera/crosshair
- [ ] Bomb throw arc matches camera direction
- [ ] V resets camera behind player
- [ ] ESC opens menu and releases pointer lock
- [ ] All keys are remappable
- [ ] Settings persist across sessions

### 12.2 Mobile

- [ ] Virtual joystick appears at touch point
- [ ] Joystick movement is camera-relative
- [ ] Right-side touch rotates camera
- [ ] Sprint toggle works correctly
- [ ] Attack button responsive with no delay
- [ ] Block toggle activates/deactivates
- [ ] Shield button raises shield instantly
- [ ] Lock button toggles and cycles
- [ ] Weapon wheel opens and selects correctly
- [ ] Weapon wheel time-slow activates
- [ ] Bow aim assist helps target enemies
- [ ] All buttons can be repositioned
- [ ] Haptic feedback triggers appropriately
- [ ] UI scales correctly on different devices

### 12.3 Cross-Platform

- [ ] Desktop and mobile players can match
- [ ] No significant advantage for either platform
- [ ] Platform indicators visible
- [ ] Chat works between platforms

---

## Appendix A: Quick Reference

### Desktop Controls

```
MOVEMENT
  WASD .............. Move (camera-relative)
  Shift ............. Sprint (hold)

CAMERA
  Mouse ............. Rotate Camera
  Tab / MMB ......... Toggle Target Lock
  Scroll ............ Cycle Lock Targets
  V ................. Reset Camera

COMBAT
  Left Click ........ Attack
  Right Click ....... Block (hold)
  Space ............. Quick Shield (hold)
  Q / E ............. Cycle Weapons
  1-6 ............... Direct Weapon Select

MENU
  ESC ............... Open Menu
  Tab (hold) ........ Scoreboard
```

### Mobile Controls

```
MOVEMENT
  Left Joystick ..... Move
  Sprint Button ..... Toggle Sprint

CAMERA
  Right Touch ....... Rotate Camera
  Lock Button ....... Toggle Target Lock
  Double-tap Lock ... Lock Nearest

COMBAT
  Attack Button ..... Attack
  Block Button ...... Toggle Block
  Shield Button ..... Quick Shield
  Weapon Icon ....... Open Weapon Wheel
```

### Weapon-Specific

```
Bow:    Hold Attack → Aim → Release to Fire
Bomb:   Attack to Throw → Attack again to Detonate
Shield: Block/Space to Raise → Attack for Shield Bash
```

---

## Appendix B: Control Flow Diagrams

### Combat Loop (Desktop)

```
[Camera Look] → [Spot Enemy] → [Tab: Lock On]
                                     ↓
[WASD: Strafe] ←──────────── [Circling Enemy]
      ↓                            ↓
[Space: Shield] ←── [Incoming Attack] ── [RMB: Block]
      ↓                            ↓
[LMB: Counter Attack] ────→ [Stamina Check]
      ↓                            ↓
[Hit/Miss] ──────────────→ [Continue/Disengage]
```

### Target Lock State Machine

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌──────────┐    Tab    ┌──────────┐     │
│    │   FREE   │ ───────→  │  LOCKED  │     │
│    │  CAMERA  │ ←───────  │    ON    │     │
│    └──────────┘    Tab    └──────────┘     │
│         ↑                      │           │
│         │                      │           │
│         └── Target Lost/Died ──┘           │
│                                             │
└─────────────────────────────────────────────┘
```

### Weapon Wheel Flow (Mobile)

```
[Tap Weapon Icon] → [Wheel Opens] → [Time Slows]
                          ↓
                   [Drag to Weapon]
                          ↓
              [Release] ─────────→ [Weapon Equipped]
                   OR                    ↓
              [Tap Outside] ──→ [Cancel, Keep Current]
```

### Quick Shield Flow

```
[Any Weapon Equipped] → [Space Pressed] → [Shield Available?]
                                                ↓
                              Yes ─────────────────────── No
                               ↓                          ↓
                        [Raise Shield]            [No Effect]
                               ↓                   (Shield Broken)
                        [Block Active]
                               ↓
                        [Space Released]
                               ↓
                        [Return to Previous Weapon]
```

---

## Appendix C: Input State Schema

For developers implementing the control system:

```typescript
interface InputState {
  // Movement
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  sprint: boolean;
  
  // Camera
  cameraRotationX: number;  // Mouse delta or touch delta
  cameraRotationY: number;
  resetCamera: boolean;
  
  // Combat
  attack: boolean;
  attackHeld: boolean;      // For bow charging
  block: boolean;
  quickShield: boolean;     // Space key / Shield button
  targetLock: boolean;
  cycleTargetNext: boolean;
  cycleTargetPrev: boolean;
  
  // Weapons
  weaponSlot: WeaponSlot | null;
  cycleWeaponNext: boolean;
  cycleWeaponPrev: boolean;
  
  // Mobile-specific
  joystickAngle: number;    // 0-360 degrees
  joystickMagnitude: number; // 0-1
  weaponWheelOpen: boolean;
  weaponWheelSelection: WeaponSlot | null;
}
```

---

**Document Version:** 2.1  
**Last Updated:** January 15, 2026  
**Status:** Revised Specification (Desktop + Mobile)
