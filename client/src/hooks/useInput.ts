import { useEffect, useCallback, useState, useRef } from 'react';
import type { InputState, WeaponSlot } from '@/types';
import { useCameraStore } from '@/stores/cameraStore';

const WEAPON_KEY_MAP: Record<string, WeaponSlot> = {
  '1': 'sword',
  '2': 'spear',
  '3': 'club',
  '4': 'bow',
  '5': 'shield',
  '6': 'bomb',
};

interface UseInputReturn {
  input: InputState;
  isMouseDown: boolean;
  isRightMouseDown: boolean;
  isPointerLocked: boolean;
  requestPointerLock: () => void;
}

export function useInput(): UseInputReturn {
  const [input, setInput] = useState<InputState>({
    // Movement
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    // Combat
    attack: false,
    attackHeld: false,
    block: false,
    quickShield: false,
    // Camera
    targetLock: false,
    resetCamera: false,
    // Weapons
    weaponSlot: null,
    cycleWeaponNext: false,
    cycleWeaponPrev: false,
  });

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  
  // Track if target lock was just toggled to prevent repeated toggles
  const targetLockToggled = useRef(false);

  const rotateCamera = useCameraStore((state) => state.rotate);

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // Prevent default for game keys
    const gameKeys = [
      'w', 'a', 's', 'd', 'shift', ' ', 'q', 'e', 'tab', 'v',
      '1', '2', '3', '4', '5', '6',
    ];
    if (gameKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    const key = event.key.toLowerCase();

    setInput((prev) => {
      const updates: Partial<InputState> = {};

      switch (key) {
        case 'w':
          updates.moveForward = true;
          break;
        case 's':
          updates.moveBackward = true;
          break;
        case 'a':
          updates.moveLeft = true;
          break;
        case 'd':
          updates.moveRight = true;
          break;
        case 'shift':
          updates.sprint = true;
          break;
        case ' ':
          updates.quickShield = true;
          break;
        case 'tab':
          // Toggle target lock (only on first press, not repeat)
          if (!event.repeat && !targetLockToggled.current) {
            updates.targetLock = !prev.targetLock;
            targetLockToggled.current = true;
          }
          break;
        case 'v':
          updates.resetCamera = true;
          break;
        case 'e':
          updates.cycleWeaponNext = true;
          break;
        case 'q':
          updates.cycleWeaponPrev = true;
          break;
        default: {
          const weaponSlot = WEAPON_KEY_MAP[key];
          if (weaponSlot) {
            updates.weaponSlot = weaponSlot;
          }
        }
      }

      return { ...prev, ...updates };
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    setInput((prev) => {
      const updates: Partial<InputState> = {};

      switch (key) {
        case 'w':
          updates.moveForward = false;
          break;
        case 's':
          updates.moveBackward = false;
          break;
        case 'a':
          updates.moveLeft = false;
          break;
        case 'd':
          updates.moveRight = false;
          break;
        case 'shift':
          updates.sprint = false;
          break;
        case ' ':
          updates.quickShield = false;
          break;
        case 'tab':
          // Reset toggle flag when key is released
          targetLockToggled.current = false;
          break;
        case 'v':
          updates.resetCamera = false;
          break;
        case 'e':
          updates.cycleWeaponNext = false;
          break;
        case 'q':
          updates.cycleWeaponPrev = false;
          break;
        default: {
          const weaponSlot = WEAPON_KEY_MAP[key];
          if (weaponSlot) {
            updates.weaponSlot = null;
          }
        }
      }

      return { ...prev, ...updates };
    });
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent): void => {
    if (event.button === 0) {
      // Left mouse button - attack
      setIsMouseDown(true);
      setInput((prev) => ({ ...prev, attack: true, attackHeld: true }));
    } else if (event.button === 1) {
      // Middle mouse button - toggle target lock
      event.preventDefault();
      setInput((prev) => ({ ...prev, targetLock: !prev.targetLock }));
    } else if (event.button === 2) {
      // Right mouse button - block
      setIsRightMouseDown(true);
      setInput((prev) => ({ ...prev, block: true }));
    }
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent): void => {
    if (event.button === 0) {
      setIsMouseDown(false);
      setInput((prev) => ({ ...prev, attack: false, attackHeld: false }));
    } else if (event.button === 2) {
      setIsRightMouseDown(false);
      setInput((prev) => ({ ...prev, block: false }));
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent): void => {
      // Only rotate camera when pointer is locked
      if (document.pointerLockElement) {
        rotateCamera(event.movementX, event.movementY);
      }
    },
    [rotateCamera]
  );

  const handleContextMenu = useCallback((event: MouseEvent): void => {
    event.preventDefault(); // Prevent right-click menu
  }, []);

  const handlePointerLockChange = useCallback((): void => {
    setIsPointerLocked(document.pointerLockElement !== null);
  }, []);

  const handlePointerLockError = useCallback((): void => {
    console.error('Pointer lock error');
    setIsPointerLocked(false);
  }, []);

  const requestPointerLock = useCallback((): void => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }, []);

  // Handle wheel for cycling lock targets
  const handleWheel = useCallback((event: WheelEvent): void => {
    // Wheel can be used to cycle targets when locked on
    // This is handled by the camera store, triggered from FollowCamera
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('wheel', handleWheel);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleContextMenu,
    handleWheel,
    handlePointerLockChange,
    handlePointerLockError,
  ]);

  return { input, isMouseDown, isRightMouseDown, isPointerLocked, requestPointerLock };
}
