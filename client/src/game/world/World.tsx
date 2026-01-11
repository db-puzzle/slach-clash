import { Arena } from './Arena';
import { Obstacles } from './Obstacles';
import { Boundaries } from './Boundaries';

export function World(): React.JSX.Element {
  return (
    <group>
      <Arena />
      <Obstacles />
      <Boundaries />
    </group>
  );
}
