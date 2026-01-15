import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector3, Object3D, Mesh, MeshStandardMaterial, Material } from 'three';
import { useGameStore } from '@/stores/gameStore';
import {
  OCCLUSION_TRANSPARENCY,
  OCCLUSION_FADE_SPEED,
  OCCLUSION_RAY_OFFSET,
} from '@/utils/constants';

/**
 * Stores original material properties for restoration
 */
interface OriginalMaterialState {
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
}

/**
 * Tracks an occluding object with its fade state
 */
interface OccludingObject {
  object: Object3D;
  currentOpacity: number;
  targetOpacity: number;
  originalStates: Map<Material, OriginalMaterialState>;
}

/**
 * User data marker for occlusion-aware objects
 */
const OCCLUSION_MARKER = 'occlusionAware';

/**
 * Marks an Object3D as occlusion-aware (can become transparent)
 */
export function markAsOcclusionAware(object: Object3D): void {
  object.userData[OCCLUSION_MARKER] = true;
}

/**
 * Checks if an Object3D is marked as occlusion-aware
 */
function isOcclusionAware(object: Object3D): boolean {
  // Walk up the hierarchy to find if any parent is marked
  let current: Object3D | null = object;
  while (current) {
    if (current.userData[OCCLUSION_MARKER]) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Gets the root occlusion-aware parent of an object
 */
function getOcclusionRoot(object: Object3D): Object3D | null {
  let root: Object3D | null = null;
  let current: Object3D | null = object;
  
  while (current) {
    if (current.userData[OCCLUSION_MARKER]) {
      root = current;
    }
    current = current.parent;
  }
  
  return root;
}

/**
 * Collects all materials from an object and its descendants
 */
function collectMaterials(object: Object3D): Map<Material, OriginalMaterialState> {
  const materials = new Map<Material, OriginalMaterialState>();
  
  object.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      
      for (const mat of mats) {
        if (!materials.has(mat)) {
          materials.set(mat, {
            transparent: mat.transparent,
            opacity: mat.opacity,
            depthWrite: mat.depthWrite,
          });
        }
      }
    }
  });
  
  return materials;
}

/**
 * Applies transparency to all materials in an object
 */
function applyTransparency(object: Object3D, opacity: number): void {
  object.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      
      for (const mat of mats) {
        if (mat instanceof MeshStandardMaterial) {
          mat.transparent = true;
          mat.opacity = opacity;
          // Keep depth write for semi-transparent to avoid visual artifacts
          mat.depthWrite = opacity > 0.9;
          mat.needsUpdate = true;
        }
      }
    }
  });
}

/**
 * Restores original material properties
 */
function restoreMaterials(originalStates: Map<Material, OriginalMaterialState>): void {
  originalStates.forEach((state, mat) => {
    if (mat instanceof MeshStandardMaterial) {
      mat.transparent = state.transparent;
      mat.opacity = state.opacity;
      mat.depthWrite = state.depthWrite;
      mat.needsUpdate = true;
    }
  });
}

interface OcclusionSystemProps {
  playerId: string;
}

/**
 * System that detects obstacles between camera and player,
 * making them semi-transparent so the player is always visible.
 */
export function OcclusionSystem({ playerId }: OcclusionSystemProps): null {
  const { camera, scene } = useThree();
  const player = useGameStore((state) => state.players.get(playerId));
  
  // Raycaster for detecting occlusions
  const raycaster = useRef(new Raycaster());
  
  // Track currently occluding objects
  const occludingObjects = useRef<Map<Object3D, OccludingObject>>(new Map());
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Restore all materials on cleanup
      occludingObjects.current.forEach((data) => {
        restoreMaterials(data.originalStates);
      });
      occludingObjects.current.clear();
    };
  }, []);
  
  useFrame((_, delta) => {
    if (!player) return;
    
    const { position: playerPos } = player;
    const playerPosition = new Vector3(
      playerPos.x,
      playerPos.y + OCCLUSION_RAY_OFFSET, // Aim at chest level
      playerPos.z
    );
    
    // Direction from camera to player
    const direction = playerPosition.clone().sub(camera.position).normalize();
    const distance = camera.position.distanceTo(playerPosition);
    
    // Set up raycaster
    raycaster.current.set(camera.position, direction);
    raycaster.current.far = distance;
    
    // Find all intersections
    const intersections = raycaster.current.intersectObjects(scene.children, true);
    
    // Track which occlusion roots are currently blocking
    const currentlyBlocking = new Set<Object3D>();
    
    for (const intersection of intersections) {
      // Skip if this is the player or something too close to the camera
      if (intersection.distance < 0.5 || intersection.distance > distance - 0.5) {
        continue;
      }
      
      // Check if this object or its parent is occlusion-aware
      if (!isOcclusionAware(intersection.object)) {
        continue;
      }
      
      // Get the root occlusion object
      const root = getOcclusionRoot(intersection.object);
      if (root) {
        currentlyBlocking.add(root);
      }
    }
    
    // Update existing occluding objects and add new ones
    currentlyBlocking.forEach((root) => {
      if (!occludingObjects.current.has(root)) {
        // New occluding object - start fading out
        occludingObjects.current.set(root, {
          object: root,
          currentOpacity: 1,
          targetOpacity: OCCLUSION_TRANSPARENCY,
          originalStates: collectMaterials(root),
        });
      } else {
        // Already tracked - ensure target is transparent
        const data = occludingObjects.current.get(root);
        if (data) {
          data.targetOpacity = OCCLUSION_TRANSPARENCY;
        }
      }
    });
    
    // Objects no longer blocking should fade back in
    occludingObjects.current.forEach((data, root) => {
      if (!currentlyBlocking.has(root)) {
        data.targetOpacity = 1;
      }
    });
    
    // Apply opacity transitions
    const toRemove: Object3D[] = [];
    
    occludingObjects.current.forEach((data, root) => {
      // Lerp toward target opacity
      const diff = data.targetOpacity - data.currentOpacity;
      const step = OCCLUSION_FADE_SPEED * delta;
      
      if (Math.abs(diff) < 0.01) {
        data.currentOpacity = data.targetOpacity;
      } else {
        data.currentOpacity += Math.sign(diff) * Math.min(step, Math.abs(diff));
      }
      
      // Apply the current opacity
      applyTransparency(root, data.currentOpacity);
      
      // If fully restored, remove from tracking and restore original materials
      if (data.currentOpacity >= 0.99 && data.targetOpacity >= 0.99) {
        restoreMaterials(data.originalStates);
        toRemove.push(root);
      }
    });
    
    // Clean up fully restored objects
    for (const root of toRemove) {
      occludingObjects.current.delete(root);
    }
  });
  
  return null;
}
