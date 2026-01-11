# Slash and Clash — Controls Specification

## 1. Overview

This document defines the control scheme for **Slash and Clash**, a third-person 3D multiplayer action combat game.

**Target Platform (Phase 1):** Web Browser (Keyboard + Mouse)

**Target Platform (Phase 2):** Mobile (Touch Controls)

---

## 2. Web Browser Controls (Phase 1)

### 2.1 Movement

| Action | Control |
|--------|---------|
| Move Forward | `W` |
| Move Backward | `S` |
| Move Left (Strafe) | `A` |
| Move Right (Strafe) | `D` |
| Sprint/Run | `Space` (hold) |

**Camera Behavior:**
- Camera automatically follows the character
- Player direction is determined by camera orientation + movement keys
- No manual camera rotation needed

### 2.2 Combat

#### Basic Combat

| Action | Control |
|--------|---------|
| Attack | `Left Mouse Button` (click) |
| Block | `Right Mouse Button` (hold) |

**Notes:**
- Attack executes with the currently equipped weapon
- Blocking behavior varies based on equipped weapon (see section 2.3)
- Each attack consumes stamina based on weapon type

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

### 2.3 Weapon-Specific Controls

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
| Fire Arrow | `Left Mouse Button` (release) |
| Cancel Shot | `Right Mouse Button` (while drawn) |

**Notes:**
- Arrow fires in the direction the player is facing
- Holding the draw does not consume stamina; releasing fires and consumes 1 stamina
- Requires arrows (consumable resource)

#### Shield

| Action | Control |
|--------|---------|
| Raise Shield | `Right Mouse Button` (hold) |
| Shield Bash | `Left Mouse Button` (click while shield raised) |

**Notes:**
- Shield blocks all melee weapons and arrows
- Bombs cause knockback even when blocking
- Holding shield consumes 0.5 stamina per second

#### Bomb

| Action | Control |
|--------|---------|
| Throw Bomb | `Left Mouse Button` (click) |
| Detonate Bomb | `Left Mouse Button` (click again after thrown) |

**Notes:**
- Bomb is thrown in the direction the player is facing
- Fixed throw distance/arc
- Second click detonates the bomb mid-flight or on ground
- Auto-detonates after 5 seconds if not manually triggered
- Limited by bomb count (consumable resource)

### 2.4 Items & Looting

| Action | Control |
|--------|---------|
| Pick Up Items | Automatic (on contact) |

**Notes:**
- No button press required
- Items automatically added to inventory when player walks over them
- Includes weapons, arrows, and bombs from eliminated players

### 2.5 Menu & UI

| Action | Control |
|--------|---------|
| Open/Close Menu | `ESC` |

**Available in Menu:**
- Settings
- Exit to Lobby
- Resume Match

**Notes:**
- Match pauses for host when ESC is pressed (peer-to-peer architecture)
- Other players continue playing while one player is in menu

---

## 3. Spectator Controls

When eliminated, players enter spectator mode with a bird's-eye (top-down) view.

| Action | Control |
|--------|---------|
| Pan Camera Forward | `W` |
| Pan Camera Backward | `S` |
| Pan Camera Left | `A` |
| Pan Camera Right | `D` |
| Zoom In | `Mouse Scroll Up` (optional) |
| Zoom Out | `Mouse Scroll Down` (optional) |
| Exit to Menu | `ESC` |

**Notes:**
- Spectators can see all players (both teams)
- Camera moves freely across the entire arena
- Zoom functionality is optional for Phase 1

---

## 4. Lobby Controls

### 4.1 Pre-Match Lobby

| Action | Control |
|--------|---------|
| Select Team | `Left Mouse Button` (click on team slot) |
| Ready Up | `Left Mouse Button` (click ready button) |
| Change Character Name | `Left Mouse Button` (click name field, type name) |
| Leave Lobby | `ESC` or click "Leave" button |

**Host-Only Controls:**
- Select squad size via dropdown
- Start match when all players are ready

---

## 5. Mobile Controls (Phase 2)

### 5.1 Movement & Camera

| Action | Control |
|--------|---------|
| Move | Virtual Joystick (left side of screen) |
| Sprint | Virtual Joystick pushed to edge |
| Camera Rotation | Drag anywhere on right side of screen |

### 5.2 Combat

| Action | Control |
|--------|---------|
| Attack | Attack Button (bottom-right) |
| Block | Block Button (bottom-right, hold) |
| Weapon Switch Next | Swipe up on weapon icon |
| Weapon Switch Previous | Swipe down on weapon icon |
| Direct Weapon Select | Tap weapon icon in weapon wheel |

### 5.3 Weapon-Specific (Mobile)

#### Bow

| Action | Control |
|--------|---------|
| Draw Arrow | Press and hold Attack button |
| Fire Arrow | Release Attack button |

#### Bomb

| Action | Control |
|--------|---------|
| Throw Bomb | Tap Attack button |
| Detonate Bomb | Tap Attack button again |

**Note:** Mobile controls are tentative and subject to refinement during Phase 2 development.

---

## 6. Control Feedback & Visual Indicators

### 6.1 Visual Feedback

| State | Indicator |
|-------|-----------|
| Weapon Equipped | Weapon icon highlighted in HUD |
| Blocking | Shield effect animation, character pose change |
| Low Stamina | Stamina bar color change (yellow/red) |
| Weapon About to Break | Durability indicator flashing |
| Out of Arrows/Bombs | Grayed-out icon, "0" displayed |
| Sprint Active | Subtle speed lines or movement blur |

### 6.2 Audio Feedback

| Action | Sound Cue |
|--------|-----------|
| Weapon Switch | Click/whoosh sound |
| Attack | Weapon-specific swing sound |
| Successful Hit | Impact/clash sound |
| Block Successful | Metallic clang |
| Weapon Broken | Crack/shatter sound |
| Out of Stamina | Exhausted gasp (optional) |

---

## 7. Control Remapping (Future)

**Phase 1:** Fixed controls (no remapping)

**Future Phases:** 
- Allow players to rebind keyboard keys
- Save control preferences locally (browser storage)

---

## 8. Accessibility Considerations (Future)

- **Colorblind modes:** Team indicators with shapes/patterns
- **One-handed mode:** Alternative control scheme
- **Key hold vs toggle:** Option to toggle block instead of hold
- **Sensitivity settings:** Camera rotation and movement speed adjustment

---

## 9. Tutorial/Control Hints

### 9.1 First-Time Player Experience

Display control hints during first match:
- Movement: "Use WASD to move"
- Combat: "Left Click to attack, Right Click to block"
- Weapons: "Press Q/E or 1-6 to switch weapons"
- Sprint: "Hold Space to sprint"

### 9.2 In-Game Reminders

Context-sensitive hints:
- When stamina is depleted: "Wait for stamina to recover"
- When weapon breaks: "Weapon broken! Switch to another (Q/E)"
- When out of arrows: "No arrows remaining"
- Near loot: "Walk over items to collect them"

---

## 10. Control Testing Checklist

- [ ] WASD movement responsive in all directions
- [ ] Camera follows player smoothly without jitter
- [ ] Sprint (Space) increases movement speed noticeably
- [ ] Left click attack works with all melee weapons
- [ ] Right click block works with sword, spear, shield
- [ ] Q/E cycles through available weapons correctly
- [ ] Number keys 1-6 equip specific weapons
- [ ] Bow draw/release mechanic feels responsive
- [ ] Bomb throw direction matches player facing
- [ ] Bomb detonation on second click works reliably
- [ ] Item pickup on contact has no delay
- [ ] ESC menu opens/closes without issues
- [ ] Spectator WASD panning works smoothly
- [ ] All controls display correctly in tutorial/hints

---

## Appendix A: Quick Reference

### Essential Controls

```
Movement:     WASD
Sprint:       Space (hold)
Attack:       Left Mouse Button
Block:        Right Mouse Button
Switch Weapon: Q/E or 1-6
Menu:         ESC
```

### Weapon-Specific

```
Bow:   Hold LMB → Release LMB to fire
Bomb:  LMB to throw → LMB again to detonate
```

---

## Appendix B: Control Flow Diagrams

### Combat Loop

```
[Movement (WASD)] → [Face Enemy] → [Select Weapon (1-6)] → [Attack (LMB)] or [Block (RMB)]
         ↓                                                         ↓
    [Sprint (Space)]                                    [Stamina Consumed]
         ↓                                                         ↓
  [Engage/Disengage]                                    [Wait for Recovery]
```

### Weapon Switch Flow

```
[Current Weapon] → Press Q → [Next Weapon in Sequence]
                              ↓
                      [Skip if Broken/Depleted]
                              ↓
                      [Equip First Available]

[Any State] → Press 1-6 → [Directly Equip Weapon (if available)]
```

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Phase 1 Specification
