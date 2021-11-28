(global as any).URL.createObjectURL = function () {};
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

import { Map, View } from 'ol';

import { reconciler } from '../src/reconciler';
import '../src/index';

export async function miniRender(element: JSX.Element) {
  const rootDiv = document.createElement('div');
  const map = new Map({
    target: rootDiv,
    layers: [],
    interactions: [],
    controls: [],
    view: new View(),
  });

  await reconciler.act(async () => {
    const root = reconciler.createContainer(map as any, 1, false, null);
    reconciler.updateContainer(element, root, null, () => undefined);
  });

  return [rootDiv, map, reconciler.act] as const;
}
