import type { HeightmapConfig, TerrainData } from '@/types';
import { ARENA_WIDTH, ARENA_DEPTH, ROLLING_HILLS_CONFIG } from '@/utils/constants';

// ============================================
// PERLIN NOISE IMPLEMENTATION
// ============================================

// Permutation table for Perlin noise (doubled to avoid index wrapping)
const PERMUTATION = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
  27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
  92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
  209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
  164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
  147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
  28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
  155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
  191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
  181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
  61, 156, 180,
];

// Create doubled permutation table
function createPermutationTable(seed: number): number[] {
  const p = [...PERMUTATION];
  
  // Simple shuffle based on seed
  let s = seed;
  for (let i = p.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    const temp = p[i];
    const pj = p[j];
    if (temp !== undefined && pj !== undefined) {
      p[i] = pj;
      p[j] = temp;
    }
  }
  
  // Double the table
  return [...p, ...p];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2D(x: number, y: number, perm: number[]): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  
  const u = fade(xf);
  const v = fade(yf);
  
  const aa = perm[perm[X] ?? 0 + Y] ?? 0;
  const ab = perm[(perm[X] ?? 0) + Y + 1] ?? 0;
  const ba = perm[(perm[X + 1] ?? 0) + Y] ?? 0;
  const bb = perm[(perm[X + 1] ?? 0) + Y + 1] ?? 0;
  
  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
  
  return lerp(x1, x2, v);
}

// ============================================
// PLATEAU GENERATION
// ============================================

// Number of plateau levels
const PLATEAU_LEVELS = 5;
// How strongly to snap to plateaus (0 = no plateaus, 1 = hard snap)
const PLATEAU_STRENGTH = 0.75;
// Smooth transition zone between plateaus (in normalized height units)
const PLATEAU_TRANSITION = 0.06;

// Low elevation bias - higher values = more low elevation terrain
// 0.5 = no bias, < 0.5 = more high terrain, > 0.5 = more low terrain
const LOW_ELEVATION_BIAS = 0.7;

// Ramp configuration
const RAMP_WIDTH = 8;       // Width of ramps in world units

// Guaranteed features configuration
const GUARANTEED_MID_PLATEAUS = 3;   // Number of guaranteed mid-elevation areas
const GUARANTEED_HIGH_PEAKS = 2;      // Number of guaranteed high peaks (at least 1 climbable)
const MID_PLATEAU_RADIUS = 15;        // Radius of mid-elevation areas
const HIGH_PEAK_RADIUS = 10;          // Radius of high peak areas

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Apply bias to push heights toward lower values
// bias > 0.5 = more low terrain, bias < 0.5 = more high terrain
function applyElevationBias(normalizedHeight: number, bias: number): number {
  // Use a power curve to redistribute heights
  // Higher bias values create steeper curves that push values down
  const power = bias / (1 - bias); // Convert 0.7 bias to ~2.33 power
  return Math.pow(normalizedHeight, power);
}

// Apply plateau/terrace effect to height
function applyPlateauEffect(normalizedHeight: number, numLevels: number, strength: number, transition: number): number {
  // Calculate which plateau level this height belongs to
  const levelHeight = 1 / numLevels;
  const level = Math.floor(normalizedHeight * numLevels);
  const levelBase = level * levelHeight;
  
  // Position within current level (0-1)
  const posInLevel = (normalizedHeight - levelBase) / levelHeight;
  
  // Create flat plateau with smooth transitions at edges
  let plateauHeight: number;
  
  if (posInLevel < transition) {
    // Smooth ramp up from previous level
    plateauHeight = levelBase + smoothstep(0, transition, posInLevel) * levelHeight * 0.5;
  } else if (posInLevel > 1 - transition) {
    // Smooth ramp up to next level
    const rampProgress = smoothstep(1 - transition, 1, posInLevel);
    plateauHeight = levelBase + levelHeight * 0.5 + rampProgress * levelHeight * 0.5;
  } else {
    // Flat plateau area
    plateauHeight = levelBase + levelHeight * 0.5;
  }
  
  // Blend between original height and plateau height
  return normalizedHeight * (1 - strength) + plateauHeight * strength;
}

// ============================================
// RAMP/PATH GENERATION FOR CONNECTIVITY
// ============================================

interface RampPath {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  width: number;
}

// Generate ramp paths that connect plateau levels
function generateRampPaths(seed: number, arenaWidth: number, arenaDepth: number): RampPath[] {
  const ramps: RampPath[] = [];
  const halfWidth = arenaWidth / 2;
  const halfDepth = arenaDepth / 2;
  
  // Use seed for deterministic ramp placement
  let s = seed;
  const nextRandom = (): number => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  
  // Create radial ramps from center outward at various angles
  const numRadialRamps = 8;
  for (let i = 0; i < numRadialRamps; i++) {
    const baseAngle = (i / numRadialRamps) * Math.PI * 2;
    const angleVariation = (nextRandom() - 0.5) * 0.3;
    const angle = baseAngle + angleVariation;
    
    // Ramp from near center to edge
    const innerRadius = 8 + nextRandom() * 10;
    const outerRadius = Math.min(halfWidth, halfDepth) - 5;
    
    ramps.push({
      startX: Math.cos(angle) * innerRadius,
      startZ: Math.sin(angle) * innerRadius,
      endX: Math.cos(angle) * outerRadius,
      endZ: Math.sin(angle) * outerRadius,
      width: RAMP_WIDTH + nextRandom() * 4,
    });
  }
  
  // Add some cross-connecting ramps at mid-radius
  const numCrossRamps = 6;
  const midRadius = (halfWidth + halfDepth) / 4;
  for (let i = 0; i < numCrossRamps; i++) {
    const angle1 = (i / numCrossRamps) * Math.PI * 2 + nextRandom() * 0.5;
    const angle2 = angle1 + Math.PI / 3 + nextRandom() * 0.4;
    
    ramps.push({
      startX: Math.cos(angle1) * midRadius,
      startZ: Math.sin(angle1) * midRadius,
      endX: Math.cos(angle2) * midRadius,
      endZ: Math.sin(angle2) * midRadius,
      width: RAMP_WIDTH * 0.8,
    });
  }
  
  return ramps;
}

// Calculate distance from point to line segment
function distanceToSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lengthSq = dx * dx + dz * dz;
  
  if (lengthSq === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (pz - z1) * (pz - z1));
  }
  
  // Project point onto line, clamped to segment
  let t = ((px - x1) * dx + (pz - z1) * dz) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  
  return Math.sqrt((px - projX) * (px - projX) + (pz - projZ) * (pz - projZ));
}

// Get progress along ramp (0 = start, 1 = end)
function getProgressAlongRamp(px: number, pz: number, ramp: RampPath): number {
  const dx = ramp.endX - ramp.startX;
  const dz = ramp.endZ - ramp.startZ;
  const lengthSq = dx * dx + dz * dz;
  
  if (lengthSq === 0) return 0;
  
  let t = ((px - ramp.startX) * dx + (pz - ramp.startZ) * dz) / lengthSq;
  return Math.max(0, Math.min(1, t));
}

// Apply ramps to heightmap to ensure connectivity
function applyRamps(
  heightmap: Float32Array,
  resolution: number,
  width: number,
  depth: number,
  ramps: RampPath[]
): void {
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const index = z * resolution + x;
      
      // Convert to world coordinates
      const worldX = (x / resolution - 0.5) * width;
      const worldZ = (z / resolution - 0.5) * depth;
      
      const currentHeight = heightmap[index] ?? 0;
      
      // Check each ramp
      for (const ramp of ramps) {
        const distToRamp = distanceToSegment(
          worldX, worldZ,
          ramp.startX, ramp.startZ,
          ramp.endX, ramp.endZ
        );
        
        if (distToRamp < ramp.width) {
          // Get heights at ramp endpoints
          const startHx = Math.floor(((ramp.startX / width) + 0.5) * (resolution - 1));
          const startHz = Math.floor(((ramp.startZ / depth) + 0.5) * (resolution - 1));
          const endHx = Math.floor(((ramp.endX / width) + 0.5) * (resolution - 1));
          const endHz = Math.floor(((ramp.endZ / depth) + 0.5) * (resolution - 1));
          
          const clampedStartHx = Math.max(0, Math.min(resolution - 1, startHx));
          const clampedStartHz = Math.max(0, Math.min(resolution - 1, startHz));
          const clampedEndHx = Math.max(0, Math.min(resolution - 1, endHx));
          const clampedEndHz = Math.max(0, Math.min(resolution - 1, endHz));
          
          const startHeight = heightmap[clampedStartHz * resolution + clampedStartHx] ?? 0;
          const endHeight = heightmap[clampedEndHz * resolution + clampedEndHx] ?? 0;
          
          // Calculate target height based on progress along ramp
          const progress = getProgressAlongRamp(worldX, worldZ, ramp);
          const targetHeight = startHeight + (endHeight - startHeight) * smoothstep(0, 1, progress);
          
          // Calculate blend factor based on distance from ramp center
          const edgeFade = smoothstep(ramp.width, ramp.width * 0.3, distToRamp);
          
          // Blend current height toward ramp height
          heightmap[index] = currentHeight * (1 - edgeFade) + targetHeight * edgeFade;
        }
      }
    }
  }
}

// ============================================
// GUARANTEED TERRAIN FEATURES
// ============================================

interface TerrainFeature {
  x: number;
  z: number;
  radius: number;
  targetHeight: number;  // Normalized height 0-1
}

// Generate positions for guaranteed mid and high elevation features
function generateGuaranteedFeatures(
  seed: number,
  arenaWidth: number,
  arenaDepth: number
): { midPlateaus: TerrainFeature[]; highPeaks: TerrainFeature[] } {
  const midPlateaus: TerrainFeature[] = [];
  const highPeaks: TerrainFeature[] = [];
  
  let s = seed + 9999; // Offset seed for features
  const nextRandom = (): number => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  
  const halfSize = Math.min(arenaWidth, arenaDepth) / 2;
  const margin = 15; // Keep features away from edges
  
  // Generate mid-elevation plateaus spread around the map
  for (let i = 0; i < GUARANTEED_MID_PLATEAUS; i++) {
    const angle = (i / GUARANTEED_MID_PLATEAUS) * Math.PI * 2 + nextRandom() * 0.8;
    const distance = 20 + nextRandom() * (halfSize - margin - 20);
    
    midPlateaus.push({
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      radius: MID_PLATEAU_RADIUS + nextRandom() * 8,
      targetHeight: 0.5 + nextRandom() * 0.15, // Mid elevation (50-65%)
    });
  }
  
  // Generate high peaks - at least one near center for accessibility
  for (let i = 0; i < GUARANTEED_HIGH_PEAKS; i++) {
    let x: number, z: number;
    
    if (i === 0) {
      // First peak near center - guaranteed to be accessible
      const centerOffset = 10 + nextRandom() * 15;
      const angle = nextRandom() * Math.PI * 2;
      x = Math.cos(angle) * centerOffset;
      z = Math.sin(angle) * centerOffset;
    } else {
      // Other peaks can be anywhere
      const angle = nextRandom() * Math.PI * 2;
      const distance = 25 + nextRandom() * (halfSize - margin - 25);
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
    }
    
    highPeaks.push({
      x,
      z,
      radius: HIGH_PEAK_RADIUS + nextRandom() * 5,
      targetHeight: 0.8 + nextRandom() * 0.15, // High elevation (80-95%)
    });
  }
  
  return { midPlateaus, highPeaks };
}

// Apply guaranteed features to heightmap
function applyGuaranteedFeatures(
  heightmap: Float32Array,
  resolution: number,
  width: number,
  depth: number,
  features: TerrainFeature[],
  minHeight: number,
  maxHeight: number
): void {
  const heightRange = maxHeight - minHeight;
  
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const index = z * resolution + x;
      
      // Convert to world coordinates
      const worldX = (x / resolution - 0.5) * width;
      const worldZ = (z / resolution - 0.5) * depth;
      
      const currentHeight = heightmap[index] ?? 0;
      
      // Check each feature
      for (const feature of features) {
        const dx = worldX - feature.x;
        const dz = worldZ - feature.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < feature.radius) {
          // Calculate target height in world units
          const targetHeight = feature.targetHeight * heightRange + minHeight;
          
          // Smooth blend based on distance from center
          // Center has full effect, edges blend with existing terrain
          const blendFactor = smoothstep(feature.radius, feature.radius * 0.3, distance);
          
          // Only raise terrain, don't lower it (preserves existing high areas)
          const newHeight = currentHeight + (targetHeight - currentHeight) * blendFactor;
          if (newHeight > currentHeight) {
            heightmap[index] = newHeight;
          }
        }
      }
    }
  }
}

// ============================================
// TERRAIN GENERATION
// ============================================

export function generateTerrain(config: HeightmapConfig = ROLLING_HILLS_CONFIG): TerrainData {
  const { resolution, baseFrequency, octaves, persistence, maxHeight, minHeight, smoothness, seed } = config;
  const actualSeed = seed === 0 ? Math.floor(Math.random() * 10000) : seed;
  
  const perm = createPermutationTable(actualSeed);
  const heightmap = new Float32Array(resolution * resolution);
  const normalmap = new Float32Array(resolution * resolution * 3);
  const heightRange = maxHeight - minHeight;
  
  // Generate heightmap using fractal noise
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const index = z * resolution + x;
      
      // Normalize coordinates to world space
      const worldX = (x / resolution - 0.5) * ARENA_WIDTH;
      const worldZ = (z / resolution - 0.5) * ARENA_DEPTH;
      
      let height = 0;
      let amplitude = 1;
      let frequency = baseFrequency;
      let maxAmplitude = 0;
      
      // Fractal noise accumulation
      for (let o = 0; o < octaves; o++) {
        height += perlin2D(worldX * frequency + actualSeed + o * 100, worldZ * frequency + actualSeed + o * 100, perm) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }
      
      // Normalize to 0-1 range
      let normalizedHeight = (height / maxAmplitude + 1) / 2;
      
      // Apply low-elevation bias to make most terrain green (low)
      normalizedHeight = applyElevationBias(normalizedHeight, LOW_ELEVATION_BIAS);
      
      // Apply plateau effect
      normalizedHeight = applyPlateauEffect(normalizedHeight, PLATEAU_LEVELS, PLATEAU_STRENGTH, PLATEAU_TRANSITION);
      
      // Scale to actual height range
      heightmap[index] = normalizedHeight * heightRange + minHeight;
    }
  }
  
  // Generate and apply guaranteed features (mid plateaus and high peaks)
  const { midPlateaus, highPeaks } = generateGuaranteedFeatures(actualSeed, ARENA_WIDTH, ARENA_DEPTH);
  
  // Apply mid-elevation plateaus first
  applyGuaranteedFeatures(heightmap, resolution, ARENA_WIDTH, ARENA_DEPTH, midPlateaus, minHeight, maxHeight);
  
  // Apply high peaks
  applyGuaranteedFeatures(heightmap, resolution, ARENA_WIDTH, ARENA_DEPTH, highPeaks, minHeight, maxHeight);
  
  // Generate and apply ramps for connectivity between plateaus
  const ramps = generateRampPaths(actualSeed, ARENA_WIDTH, ARENA_DEPTH);
  applyRamps(heightmap, resolution, ARENA_WIDTH, ARENA_DEPTH, ramps);
  
  // Apply smoothing pass to blend features and ramps smoothly
  applySmoothing(heightmap, resolution, smoothness * 0.6);
  
  // Extra smoothing specifically on ramp areas to ensure gentle slopes
  applyRampSmoothing(heightmap, resolution, ARENA_WIDTH, ARENA_DEPTH, ramps);
  
  // Additional smoothing on feature edges for natural transitions
  applySmoothing(heightmap, resolution, smoothness * 0.3);
  
  // Calculate normals
  calculateNormals(heightmap, normalmap, resolution, ARENA_WIDTH, ARENA_DEPTH);
  
  return {
    heightmap,
    normalmap,
    width: ARENA_WIDTH,
    depth: ARENA_DEPTH,
    resolution,
    config,
  };
}

function applySmoothing(heightmap: Float32Array, resolution: number, smoothness: number): void {
  // Gaussian blur or averaging pass for smoother terrain
  const iterations = Math.floor(smoothness * 5);
  for (let i = 0; i < iterations; i++) {
    // Simple box blur
    const temp = new Float32Array(heightmap);
    for (let z = 1; z < resolution - 1; z++) {
      for (let x = 1; x < resolution - 1; x++) {
        const index = z * resolution + x;
        const center = temp[index] ?? 0;
        const left = temp[index - 1] ?? 0;
        const right = temp[index + 1] ?? 0;
        const up = temp[index - resolution] ?? 0;
        const down = temp[index + resolution] ?? 0;
        heightmap[index] = (center + left + right + up + down) / 5;
      }
    }
  }
}

// Extra smoothing on ramp areas to ensure they have gentle, traversable slopes
function applyRampSmoothing(
  heightmap: Float32Array,
  resolution: number,
  width: number,
  depth: number,
  ramps: RampPath[]
): void {
  const smoothingIterations = 8;
  
  for (let iter = 0; iter < smoothingIterations; iter++) {
    const temp = new Float32Array(heightmap);
    
    for (let z = 1; z < resolution - 1; z++) {
      for (let x = 1; x < resolution - 1; x++) {
        const index = z * resolution + x;
        
        // Convert to world coordinates
        const worldX = (x / resolution - 0.5) * width;
        const worldZ = (z / resolution - 0.5) * depth;
        
        // Check if this point is near any ramp
        let nearRamp = false;
        for (const ramp of ramps) {
          const dist = distanceToSegment(
            worldX, worldZ,
            ramp.startX, ramp.startZ,
            ramp.endX, ramp.endZ
          );
          if (dist < ramp.width * 1.2) {
            nearRamp = true;
            break;
          }
        }
        
        if (nearRamp) {
          // Apply stronger smoothing on ramp areas
          const center = temp[index] ?? 0;
          const left = temp[index - 1] ?? 0;
          const right = temp[index + 1] ?? 0;
          const up = temp[index - resolution] ?? 0;
          const down = temp[index + resolution] ?? 0;
          const ul = temp[index - resolution - 1] ?? 0;
          const ur = temp[index - resolution + 1] ?? 0;
          const dl = temp[index + resolution - 1] ?? 0;
          const dr = temp[index + resolution + 1] ?? 0;
          
          // Weighted average with diagonals for smoother gradients
          heightmap[index] = (center * 4 + left + right + up + down + ul * 0.5 + ur * 0.5 + dl * 0.5 + dr * 0.5) / 10;
        }
      }
    }
  }
}

function calculateNormals(
  heightmap: Float32Array, 
  normalmap: Float32Array, 
  resolution: number,
  width: number,
  depth: number
): void {
  const cellWidth = width / resolution;
  const cellDepth = depth / resolution;
  
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const index = z * resolution + x;
      
      // Get neighboring heights with boundary clamping
      const current = heightmap[index] ?? 0;
      const left = x > 0 ? (heightmap[index - 1] ?? current) : current;
      const right = x < resolution - 1 ? (heightmap[index + 1] ?? current) : current;
      const up = z > 0 ? (heightmap[index - resolution] ?? current) : current;
      const down = z < resolution - 1 ? (heightmap[index + resolution] ?? current) : current;
      
      // Calculate normal from height differences
      const nx = (left - right) / (2 * cellWidth);
      const nz = (up - down) / (2 * cellDepth);
      const ny = 1;
      
      // Normalize
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normalmap[index * 3] = nx / length;
      normalmap[index * 3 + 1] = ny / length;
      normalmap[index * 3 + 2] = nz / length;
    }
  }
}

// ============================================
// TERRAIN QUERY HELPERS
// ============================================

export function getHeightAt(terrain: TerrainData, x: number, z: number): number {
  const { heightmap, resolution, width, depth } = terrain;
  
  // Convert world coordinates to heightmap coordinates
  const hx = ((x / width) + 0.5) * (resolution - 1);
  const hz = ((z / depth) + 0.5) * (resolution - 1);
  
  // Clamp to valid range
  const ix = Math.max(0, Math.min(resolution - 2, Math.floor(hx)));
  const iz = Math.max(0, Math.min(resolution - 2, Math.floor(hz)));
  
  // Bilinear interpolation
  const fx = hx - ix;
  const fz = hz - iz;
  
  const ix1 = Math.min(ix + 1, resolution - 1);
  const iz1 = Math.min(iz + 1, resolution - 1);
  
  const h00 = heightmap[iz * resolution + ix] ?? 0;
  const h10 = heightmap[iz * resolution + ix1] ?? 0;
  const h01 = heightmap[iz1 * resolution + ix] ?? 0;
  const h11 = heightmap[iz1 * resolution + ix1] ?? 0;
  
  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  
  return h0 * (1 - fz) + h1 * fz;
}

export function getNormalAt(terrain: TerrainData, x: number, z: number): { x: number; y: number; z: number } {
  const { normalmap, resolution, width, depth } = terrain;
  
  const hx = ((x / width) + 0.5) * (resolution - 1);
  const hz = ((z / depth) + 0.5) * (resolution - 1);
  
  const ix = Math.max(0, Math.min(resolution - 1, Math.floor(hx)));
  const iz = Math.max(0, Math.min(resolution - 1, Math.floor(hz)));
  
  const index = (iz * resolution + ix) * 3;
  
  return {
    x: normalmap[index] ?? 0,
    y: normalmap[index + 1] ?? 1,
    z: normalmap[index + 2] ?? 0,
  };
}

export function getSlopeAngle(terrain: TerrainData, x: number, z: number): number {
  const normal = getNormalAt(terrain, x, z);
  // Slope angle from vertical (y = 1 means flat, y = 0 means vertical)
  return Math.acos(Math.min(1, Math.max(0, normal.y))) * (180 / Math.PI);
}
