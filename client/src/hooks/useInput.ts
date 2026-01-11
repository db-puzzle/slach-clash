import { useEffect, useCallback, useState } from 'react';
import type { InputState, WeaponSlot } from '@/types';

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
}

export function useInput(): UseInputReturn {
  const [input, setInput] = useState<InputState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    attack: false,
    block: false,
    weaponSlot: null,
    cycleWeaponNext: false,
    cycleWeaponPrev: false,
  });

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // Prevent default for game keys
    if (
      ['w', 'a', 's', 'd', ' ', 'q', 'e', '1', '2', '3', '4', '5', '6'].includes(
        event.key.toLowerCase()
      )
    ) {
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
        case ' ':
          updates.sprint = true;
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
        case ' ':
          updates.sprint = false;
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
      setIsMouseDown(true);
      setInput((prev) => ({ ...prev, attack: true }));
    } else if (event.button === 2) {
      setIsRightMouseDown(true);
      setInput((prev) => ({ ...prev, block: true }));
    }
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent): void => {
    if (event.button === 0) {
      setIsMouseDown(false);
      setInput((prev) => ({ ...prev, attack: false }));
    } else if (event.button === 2) {
      setIsRightMouseDown(false);
      setInput((prev) => ({ ...prev, block: false }));
    }
  }, []);

  const handleContextMenu = useCallback((event: MouseEvent): void => {
    event.preventDefault(); // Prevent right-click menu
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
    handleMouseUp,
    handleContextMenu,
  ]);

  return { input, isMouseDown, isRightMouseDown };
}
