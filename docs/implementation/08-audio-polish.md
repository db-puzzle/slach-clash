# Phase 8: Audio & Polish

## Overview

Add sound effects, visual polish, and spectator mode.

**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 7 complete

---

## Task 8.1: Audio Manager

### File: `client/src/audio/AudioManager.ts`

```typescript
import { Howl, Howler } from 'howler';

interface SoundLibrary {
  [key: string]: Howl;
}

const sounds: SoundLibrary = {};

export function initAudio(): void {
  // Combat sounds
  sounds.swordSwing = new Howl({ src: ['/assets/sounds/sword-swing.mp3'] });
  sounds.spearThrust = new Howl({ src: ['/assets/sounds/spear-thrust.mp3'] });
  sounds.clubSwing = new Howl({ src: ['/assets/sounds/club-swing.mp3'] });
  sounds.bowDraw = new Howl({ src: ['/assets/sounds/bow-draw.mp3'] });
  sounds.bowRelease = new Howl({ src: ['/assets/sounds/bow-release.mp3'] });
  sounds.bombThrow = new Howl({ src: ['/assets/sounds/bomb-fuse.mp3'] });
  sounds.explosion = new Howl({ src: ['/assets/sounds/explosion.mp3'] });
  
  // Impact sounds
  sounds.hit = new Howl({ src: ['/assets/sounds/hit.mp3'] });
  sounds.block = new Howl({ src: ['/assets/sounds/block.mp3'] });
  sounds.weaponBreak = new Howl({ src: ['/assets/sounds/break.mp3'] });
  
  // UI sounds
  sounds.pickup = new Howl({ src: ['/assets/sounds/pickup.mp3'] });
  sounds.death = new Howl({ src: ['/assets/sounds/death.mp3'] });
  sounds.menuClick = new Howl({ src: ['/assets/sounds/click.mp3'] });
}

export function playSound(name: string, volume = 1): void {
  const sound = sounds[name];
  if (sound) {
    sound.volume(volume);
    sound.play();
  }
}

export function playSpatialSound(
  name: string, 
  position: { x: number; z: number },
  listenerPosition: { x: number; z: number }
): void {
  const sound = sounds[name];
  if (!sound) return;
  
  const dx = position.x - listenerPosition.x;
  const dz = position.z - listenerPosition.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  // Volume falloff
  const volume = Math.max(0, 1 - distance / 30);
  
  // Pan based on direction
  const pan = Math.max(-1, Math.min(1, dx / 10));
  
  sound.volume(volume);
  sound.stereo(pan);
  sound.play();
}
```

### Acceptance Criteria
- [ ] All sounds load on init
- [ ] Sounds play correctly
- [ ] Spatial audio works

---

## Task 8.2: Combat Audio Integration

Add sounds to combat events:

```typescript
// In combat system
function onAttack(weaponType: WeaponSlot): void {
  switch (weaponType) {
    case 'sword':
      playSound('swordSwing');
      break;
    case 'spear':
      playSound('spearThrust');
      break;
    case 'club':
      playSound('clubSwing');
      break;
    // etc.
  }
}

function onHit(wasBlocked: boolean): void {
  playSound(wasBlocked ? 'block' : 'hit');
}

function onWeaponBreak(): void {
  playSound('weaponBreak');
}
```

### Acceptance Criteria
- [ ] Attack sounds play
- [ ] Hit sounds play
- [ ] Block sounds play
- [ ] Break sounds play

---

## Task 8.3: Visual Feedback - Damage Flash

### File: `client/src/game/entities/DamageFlash.tsx`

Flash effect when taking damage:

```typescript
function useDamageFlash(health: number): string {
  const prevHealth = useRef(health);
  const [flashing, setFlashing] = useState(false);
  
  useEffect(() => {
    if (health < prevHealth.current) {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 200);
    }
    prevHealth.current = health;
  }, [health]);
  
  return flashing ? '#ff0000' : 'normal';
}
```

Apply to player model material when damaged.

### Acceptance Criteria
- [ ] Player flashes red on hit
- [ ] Flash is brief (200ms)
- [ ] Works for all players

---

## Task 8.4: Sprint Visual Effect

Add speed lines or blur when sprinting:

```typescript
// In PlayerModel
{isSprinting && (
  <group>
    {/* Speed lines behind player */}
    <mesh position={[0, 1, 0.5]} rotation={[0, 0, Math.PI/2]}>
      <planeGeometry args={[0.1, 1]} />
      <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
    </mesh>
  </group>
)}
```

### Acceptance Criteria
- [ ] Visual effect when sprinting
- [ ] Effect disappears when stopping

---

## Task 8.5: Weapon Durability Warning

Flash weapon HUD when durability low:

```typescript
const isLow = durability <= maxDurability * 0.2;

<div className={isLow ? 'animate-pulse text-red-500' : ''}>
  {/* Weapon icon and durability bar */}
</div>
```

### Acceptance Criteria
- [ ] Low durability weapons flash
- [ ] Clear visual warning

---

## Task 8.6: Spectator Mode

### File: `client/src/game/SpectatorCamera.tsx`

Bird's-eye camera for eliminated players:

```typescript
export function SpectatorCamera(): JSX.Element {
  const { camera } = useThree();
  const [position, setPosition] = useState({ x: 0, z: 0 });
  const { input } = useInput();
  
  useFrame((_, delta) => {
    // WASD pans camera
    const speed = 20;
    let dx = 0, dz = 0;
    
    if (input.moveForward) dz -= speed * delta;
    if (input.moveBackward) dz += speed * delta;
    if (input.moveLeft) dx -= speed * delta;
    if (input.moveRight) dx += speed * delta;
    
    setPosition(prev => ({
      x: Math.max(-30, Math.min(30, prev.x + dx)),
      z: Math.max(-30, Math.min(30, prev.z + dz)),
    }));
    
    camera.position.set(position.x, 40, position.z + 20);
    camera.lookAt(position.x, 0, position.z);
  });
  
  return null;
}
```

### Spectator HUD
- Show "SPECTATING" text
- Show remaining players per team
- ESC to exit to menu

### Acceptance Criteria
- [ ] Top-down camera view
- [ ] WASD pans camera
- [ ] Can see all players
- [ ] Clear spectator indicator

---

## Task 8.7: Death Effect

Simple death effect:

```typescript
function DeathEffect({ position }: { position: Vector3 }): JSX.Element {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return <></>;
  
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#ff6600" transparent opacity={0.5} />
    </mesh>
  );
}
```

### Acceptance Criteria
- [ ] Effect plays on death
- [ ] Effect fades out
- [ ] Positioned at death location

---

## Task 8.8: Polish Touches

### Low Stamina Indicator
- Slight screen vignette when low stamina
- Optional: heavy breathing sound

### Item Pickup Feedback
- Brief flash on HUD element that increased
- Pickup sound plays

### Block Impact
- Camera shake on heavy block
- Sparks effect (optional)

### Acceptance Criteria
- [ ] Low stamina visible
- [ ] Pickup feedback clear
- [ ] Game feels responsive

---

## Task 8.9: Sound Asset List

Required sound files in `/public/assets/sounds/`:

| File | Purpose |
|------|---------|
| sword-swing.mp3 | Sword attack |
| spear-thrust.mp3 | Spear attack |
| club-swing.mp3 | Club attack |
| bow-draw.mp3 | Drawing bow |
| bow-release.mp3 | Firing arrow |
| bomb-fuse.mp3 | Bomb thrown |
| explosion.mp3 | Bomb explodes |
| hit.mp3 | Damage dealt |
| block.mp3 | Attack blocked |
| break.mp3 | Weapon breaks |
| pickup.mp3 | Item collected |
| death.mp3 | Player eliminated |
| click.mp3 | Menu button |
| footstep.mp3 | Movement (optional) |

Note: Placeholder sounds can be generated or sourced from free sound libraries.

---

## Phase 8 Complete Checklist

- [ ] Audio manager initialized
- [ ] Combat sounds working
- [ ] Spatial audio functional
- [ ] Damage flash effect
- [ ] Sprint visual effect
- [ ] Durability warning
- [ ] Spectator mode working
- [ ] Death effects
- [ ] Polish touches added
- [ ] All sound files present (or placeholders)
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

## 🎉 Prototype Complete!

After completing Phase 8, you have a working prototype of **Slash and Clash** with:

- ✅ 3D arena with obstacles
- ✅ Player movement and controls
- ✅ All 6 weapon types
- ✅ Combat with blocking and damage
- ✅ Health, stamina, durability systems
- ✅ AI bots for single-player testing
- ✅ Full HUD and UI
- ✅ Multiplayer networking
- ✅ Sound effects
- ✅ Spectator mode

### Next Steps

1. **Playtesting** - Gather feedback on balance and feel
2. **Bug fixes** - Address issues found in testing
3. **Performance** - Optimize for 60fps on target hardware
4. **Assets** - Replace placeholder art with final models
5. **Phase 2** - Mobile support

---

**Congratulations on completing the Slash and Clash prototype!**
