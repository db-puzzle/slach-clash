import { useMemo, createContext, useContext, type ReactNode } from 'react';
import { TerrainMesh } from './TerrainMesh';
import { Obstacles } from './Obstacles';
import { Boundaries } from './Boundaries';
import { generateTerrain } from '@/game/terrain';
import { ROLLING_HILLS_CONFIG } from '@/utils/constants';
import type { TerrainData } from '@/types';

// Context for sharing terrain data
export const TerrainContext = createContext<TerrainData | null>(null);

export function useTerrainData(): TerrainData | null {
  return useContext(TerrainContext);
}

interface WorldProps {
  seed?: number;
  children?: ReactNode;
}

export function World({ seed = 0, children }: WorldProps): React.JSX.Element {
  const terrain = useMemo(() => {
    const config = { ...ROLLING_HILLS_CONFIG, seed };
    return generateTerrain(config);
  }, [seed]);

  return (
    <TerrainContext.Provider value={terrain}>
      <group>
        <TerrainMesh terrain={terrain} />
        <Obstacles terrain={terrain} seed={seed} />
        <Boundaries />
      </group>
      {children}
    </TerrainContext.Provider>
  );
}
