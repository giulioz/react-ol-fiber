import { Globals } from '@react-spring/core';
import { createStringInterpolator, colors } from '@react-spring/shared';
import { createHost } from '@react-spring/animated';

import { applyProps, catalogue } from './reconciler';
import { AllElements } from './ol-types';

type Primitives = keyof AllElements;

const primitives = Object.entries(catalogue)
  .flatMap(([key, value]) => {
    if (key.startsWith('*')) {
      return Object.keys(value).map(k => k + key.substring(1));
    } else {
      return key;
    }
  })
  .filter(key => /^[A-Z]/.test(key) || key.startsWith('ol'))
  .map(key => key[0].toLowerCase() + key.slice(1)) as Primitives[];

Globals.assign({
  createStringInterpolator,
  colors,
});

const host = createHost(primitives, {
  applyAnimatedValues: (instance, props) => applyProps(instance, props, undefined, undefined, true),
});

export const animated = host.animated;
export { animated as a };
