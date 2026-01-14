# Phase 8: Audio & Polish

## Overview

Add sound effects, visual polish, spectator mode, and terrain-specific feedback including fall damage effects and environmental sounds.

**Estimated Time:** 5-6 hours  
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
  
  // Terrain/fall sounds
  sounds.lightLanding = new Howl({ src: ['/assets/sounds/light-landing.mp3'] });
  sounds.mediumLanding = new Howl({ src: ['/assets/sounds/medium-landing.mp3'] });
  sounds.heavyLanding = new Howl({ src: ['/assets/sounds/heavy-landing.mp3'] });
  sounds.slide = new Howl({ src: ['/assets/sounds/slide.mp3'], loop: true });
  
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

## Task 8.7: Fall Damage Effects

### Objective
Add visual and audio feedback for fall damage landings.

### File: `client/src/game/effects/FallEffect.tsx`
```typescript
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { playSound } from '@/audio/AudioManager';

interface FallEffectProps {
  position: { x: number; y: number; z: number };
  damage: number;
}

export function FallEffect({ position, damage }: FallEffectProps): JSX.Element {
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(0);
  
  useEffect(() => {
    // Play landing sound based on damage
    if (damage >= 3) {
      playSound('heavyLanding', 1);
    } else if (damage >= 1) {
      playSound('mediumLanding', 0.7);
    } else {
      playSound('lightLanding', 0.4);
    }
    
    // Fade out effect
    const timer = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(timer);
  }, [damage]);
  
  useFrame((_, delta) => {
    if (scale < 1) {
      setScale(Math.min(1, scale + delta * 5));
    }
  });
  
  if (!visible) return <></>;
  
  // Dust ring effect
  const ringSize = 1 + damage * 0.5;
  
  return (
    <group position={[position.x, position.y + 0.1, position.z]}>
      {/* Dust cloud particles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[scale * ringSize, scale * ringSize, 1]}>
        <ringGeometry args={[0.5, 1, 16]} />
        <meshBasicMaterial 
          color="#8b7355" 
          transparent 
          opacity={(1 - scale) * 0.6} 
        />
      </mesh>
      
      {/* Impact crater (for heavy falls) */}
      {damage >= 2 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[0.5 + damage * 0.2, 8]} />
          <meshBasicMaterial 
            color="#5a4a3a" 
            transparent 
            opacity={(1 - scale) * 0.4} 
          />
        </mesh>
      )}
    </group>
  );
}
```

### Screen Shake for Local Player

Add screen shake when taking fall damage:

```typescript
// In FollowCamera.tsx, add shake handling:

const shakeIntensity = useRef(0);
const shakeDecay = 10; // How fast shake fades

// Trigger shake from fall damage (via event or store)
export function triggerCameraShake(intensity: number): void {
  shakeIntensity.current = intensity;
}

// In useFrame:
if (shakeIntensity.current > 0) {
  const shake = shakeIntensity.current;
  camera.position.x += (Math.random() - 0.5) * shake * 0.1;
  camera.position.y += (Math.random() - 0.5) * shake * 0.05;
  shakeIntensity.current = Math.max(0, shake - delta * shakeDecay);
}
```

### Acceptance Criteria
- [ ] Dust effect on landing
- [ ] Effect size scales with damage
- [ ] Landing sound plays
- [ ] Sound intensity based on damage
- [ ] Screen shake for significant falls

---

## Task 8.8: Death Effect

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

## Task 8.9: Polish Touches

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

## Task 8.10: Sound Asset List

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
| light-landing.mp3 | Safe landing from small height |
| medium-landing.mp3 | Landing with minor fall damage |
| heavy-landing.mp3 | Landing with significant fall damage |
| slide.mp3 | Sliding on steep slope (loop) |

Note: Placeholder sounds can be generated or sourced from free sound libraries.

---

## Phase 8 Complete Checklist

- [ ] Audio manager initialized
- [ ] Combat sounds working
- [ ] Spatial audio functional
- [ ] Damage flash effect
- [ ] Sprint visual effect
- [ ] Durability warning
- [ ] Fall damage visual effects (dust, impact)
- [ ] Fall landing sounds (tiered by damage)
- [ ] Screen shake on heavy falls
- [ ] Spectator mode working
- [ ] Death effects
- [ ] Polish touches added
- [ ] All sound files present (or placeholders)
- [ ] `npm run types` passes
- [ ] `npm run lint` passes

---

## 🎉 Prototype Complete!

After completing Phase 8, you have a working prototype of **Slash and Clash** with:

- ✅ 3D procedural terrain with hills, valleys, and slopes
- ✅ Trees, rocks, and natural obstacle placement
- ✅ Terrain-aware player movement (speed modifiers, slope blocking)
- ✅ Fall damage from heights
- ✅ All 6 weapon types with terrain interactions
- ✅ Arrows and bombs affected by terrain
- ✅ Combat with blocking and damage
- ✅ Health, stamina, durability systems
- ✅ Terrain-aware AI bots
- ✅ Full HUD with terrain warnings
- ✅ Multiplayer networking with terrain sync
- ✅ Sound effects including terrain impacts
- ✅ Spectator mode

### Next Steps

1. **Playtesting** - Gather feedback on balance and feel
2. **Bug fixes** - Address issues found in testing
3. **Performance** - Optimize terrain mesh and physics for 60fps
4. **Additional Maps** - Implement Craggy Peaks, Canyon Arena maps
5. **Texture Splatting** - Add visual variety to terrain based on slope/height
6. **Assets** - Replace placeholder art with final models
7. **Phase 2** - Mobile support

---

**Congratulations on completing the Slash and Clash prototype!**
