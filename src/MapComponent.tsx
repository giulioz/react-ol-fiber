import React, { useRef, HTMLAttributes, useLayoutEffect, PropsWithChildren, createContext, ReactNode, useContext, forwardRef } from 'react';

import * as OL from 'ol';
// eslint-disable-next-line import/named
import { ViewOptions } from 'ol/View';
import { fromLonLat } from 'ol/proj';

import { EventHandlerProps } from './ol-types';
import { reconciler, applyProps } from './reconciler';

interface RootState {
  map: OL.Map;
}

const context = createContext<RootState | null>(null);
const roots = new Map<HTMLDivElement, { root: any; state: RootState }>();

export function useOL() {
  const value = useContext(context);
  if (!value) {
    throw new Error('No context available!');
  }
  return value;
}

interface MapProps {
  view?: OL.View | ViewOptions;
}

type MapEvents = Partial<EventHandlerProps<OL.Map>>;

const defaultMapProps = {
  view: {
    center: fromLonLat([37.41, 8.82]),
    zoom: 4,
  },
};

export function render(element: ReactNode, rootDiv: HTMLDivElement, mapProps: MapProps & MapEvents) {
  const { view: viewProp, ...rest } = mapProps;
  const view = viewProp instanceof OL.View ? viewProp : { ...defaultMapProps.view, ...(viewProp || {}) };

  const store = roots.get(rootDiv);
  let root = store?.root;
  const state = store?.state || { map: null };

  if (!root) {
    state.map = new OL.Map({
      target: rootDiv,
      layers: [],
      interactions: [],
      controls: [],
      view: new OL.View(view),
    });

    root = reconciler.createContainer(state.map as any, 1, false, null);
  }

  if (state.map && mapProps.view instanceof OL.View && mapProps.view !== state.map.getView()) {
    state.map.setView(mapProps.view);
  } else if (mapProps.view && state.map && !(mapProps.view instanceof OL.View)) {
    applyProps(state.map.getView() as any, mapProps.view, {});
  }

  if (state.map) {
    applyProps(state.map as any, rest as any, {});
  }

  roots.set(rootDiv, { root, state: state as RootState });

  reconciler.updateContainer(<context.Provider value={state as RootState}>{element}</context.Provider>, root, null, () => undefined);

  return state;
}

export function unmountComponentAtNode(rootDiv: HTMLDivElement) {
  const store = roots.get(rootDiv);
  if (!store) return;

  const { root } = store;

  reconciler.updateContainer(null, root, null, () => {
    // TODO: cleanup map
    roots.delete(rootDiv);
  });
}

export const MapComponent = forwardRef<OL.Map, PropsWithChildren<HTMLAttributes<HTMLDivElement> & MapProps & MapEvents>>(function MapComponent(
  { children, style, view, ...rest },
  ref,
) {
  const mapDivRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const state = render(children, mapDivRef.current!, { view, ...rest });

    if (typeof ref === 'function') ref(state.map);
    else if (ref) ref.current = state.map;
  }, [children, view, ref, rest]);

  useLayoutEffect(() => {
    const container = mapDivRef.current!;
    return () => unmountComponentAtNode(container);
  }, []);

  return <div style={{ width: '100%', height: '100%', ...(style || {}) }} ref={mapDivRef} />;
});
