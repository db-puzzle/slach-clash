import { create } from 'zustand';
import type { CameraState } from '@/types';
import {
  CAMERA_DEFAULT_DISTANCE,
  CAMERA_DEFAULT_HEIGHT,
  CAMERA_SENSITIVITY,
  CAMERA_MIN_PITCH,
  CAMERA_MAX_PITCH,
} from '@/utils/constants';

interface CameraStore extends CameraState {
  // Actions
  rotate: (deltaX: number, deltaY: number) => void;
  setLock: (isLocked: boolean, targetId?: string | null) => void;
  cycleTarget: (direction: 'next' | 'prev', availableTargets: string[]) => void;
  resetCamera: (playerRotation: number) => void;
  setDistance: (distance: number) => void;
  setSensitivity: (sensitivity: number) => void;
  setInvertY: (invert: boolean) => void;
}

const initialState: CameraState = {
  yaw: Math.PI, // Start facing same direction as player (toward -Z)
  pitch: 0.4, // Slight downward angle
  isLocked: false,
  lockedTargetId: null,
  distance: CAMERA_DEFAULT_DISTANCE,
  height: CAMERA_DEFAULT_HEIGHT,
  sensitivity: CAMERA_SENSITIVITY,
  invertY: false,
};

export const useCameraStore = create<CameraStore>((set, get) => ({
  ...initialState,

  rotate: (deltaX: number, deltaY: number): void => {
    const state = get();
    if (state.isLocked) return; // Don't rotate when locked on

    const sensitivity = state.sensitivity;
    const invertMultiplier = state.invertY ? -1 : 1;

    set({
      yaw: state.yaw - deltaX * sensitivity,
      pitch: Math.max(
        CAMERA_MIN_PITCH,
        Math.min(CAMERA_MAX_PITCH, state.pitch + deltaY * sensitivity * invertMultiplier)
      ),
    });
  },

  setLock: (isLocked: boolean, targetId?: string | null): void => {
    set({
      isLocked,
      lockedTargetId: isLocked ? (targetId ?? null) : null,
    });
  },

  cycleTarget: (direction: 'next' | 'prev', availableTargets: string[]): void => {
    const state = get();
    if (!state.isLocked || availableTargets.length === 0) return;

    const currentIndex = state.lockedTargetId
      ? availableTargets.indexOf(state.lockedTargetId)
      : -1;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availableTargets.length;
    } else {
      newIndex =
        currentIndex === -1
          ? availableTargets.length - 1
          : (currentIndex - 1 + availableTargets.length) % availableTargets.length;
    }

    set({ lockedTargetId: availableTargets[newIndex] });
  },

  resetCamera: (playerRotation: number): void => {
    set({
      yaw: playerRotation,
      pitch: 0.4,
    });
  },

  setDistance: (distance: number): void => {
    set({ distance });
  },

  setSensitivity: (sensitivity: number): void => {
    set({ sensitivity });
  },

  setInvertY: (invert: boolean): void => {
    set({ invertY: invert });
  },
}));
