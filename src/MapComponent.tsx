import React, { useRef, HTMLAttributes, useLayoutEffect, PropsWithChildren, createContext, ReactNode, useContext, forwardRef } from 'react';
import Reconciler from 'react-reconciler';
import { unstable_now as now } from 'scheduler';

import * as OL from 'ol';
import * as OLLayers from 'ol/layer';
import * as OLSources from 'ol/source';
import * as OLInteractions from 'ol/interaction';
import * as OLGeometries from 'ol/geom';
import * as OLStyles from 'ol/style';
import { ViewOptions } from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { EventHandlerProps } from './ol-types';

type GenericOLInstance = {
  dispose(): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  on(ev: string, handler: (...args: any) => void): void;
  un(ev: string, handler: (...args: any) => void): void;
  attach?: string;
  attachAdd?: string;
  _root?: any;
  _parent?: GenericOLInstance;
  _primitive?: boolean;
} & { [k in `get${Capitalize<string>}`]: () => any } & {
  [k in `set${Capitalize<string>}`]: (value: any) => void;
} & {
  [k in `add${Capitalize<string>}`]: (value: any) => void;
} & { [k in `remove${Capitalize<string>}`]: (value: any) => void } & {
  [k in `has${Capitalize<string>}`]: (value: any) => boolean;
};

interface Catalogue {
  [name: string]:
    | { new (...args: any): GenericOLInstance }
    | {
        [k: string]: { new (...args: any): GenericOLInstance } | ((...args: any) => OL.Collection<GenericOLInstance>);
      };
}
let catalogue: Catalogue = {
  '*Layer': OLLayers as any,
  '*Source': OLSources as any,
  '*Interaction': OLInteractions as any,
  '*Geometry': OLGeometries as any,
  '*Style': OLStyles as any,
};

export const extend = (objects: Catalogue): void => void (catalogue = { ...catalogue, ...objects });

function getConstructor(name: string) {
  const candidateEnding = Object.keys(catalogue)
    .find(k => k.startsWith('*') && name.endsWith(k.substring(1)))
    ?.substring(1);
  const namespacedCatalogueEntry = candidateEnding && (catalogue as any)[`*${candidateEnding}`][name.substring(0, name.length - candidateEnding.length)];

  const directCatalogueEntry = catalogue[name] as {
    new (...args: any): GenericOLInstance;
  };

  return directCatalogueEntry || namespacedCatalogueEntry || (OL as any)[name];
}

const pascalCase = <T extends string>(str: T) => (str.charAt(0).toUpperCase() + str.substring(1)) as Capitalize<T>;

function pruneKeys<T>(obj: T, ...keys: string[][]) {
  const keysToRemove = new Set(keys.flat());

  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToRemove.has(key)));
}

function getGetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`get${pascalCase(prop)}` as const]?.bind(instance) || (() => instance.get(prop));
}
function getSetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`set${pascalCase(prop)}` as const]?.bind(instance) || ((value: any) => instance.set(prop, value));
}
function getAppender<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return (
    instance[`add${pascalCase(prop)}` as const]?.bind(instance) ||
    (() => {
      throw new Error('No element appender found!');
    })
  );
}
function getRemover<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return (
    instance[`remove${pascalCase(prop)}` as const]?.bind(instance) ||
    (() => {
      throw new Error('No element remover found!');
    })
  );
}
function getHaser<TK extends string>(instance: GenericOLInstance, prop: TK) {
  const array = getGetter(instance, `${prop}s`)();
  const arrayChecker = array?.includes?.bind(array) || array?.array_?.includes?.bind(array.array_);
  return instance[`has${pascalCase(prop)}` as const]?.bind(instance) || ((value: any) => arrayChecker(value)) || (() => false);
}

function shallowCompare(a: any, b: any) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.every((e, i) => b[i] === e);
  if (typeof a === 'object' && typeof b === 'object') {
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    return keys.every(key => a[key] === b[key]);
  }
}

function applyProps(instance: GenericOLInstance, newProps: Record<string, unknown>, oldProps: Record<string, unknown>, diff?: string[]) {
  // Filter identical props and reserved keys
  const identical = Object.keys(newProps).filter(key => newProps[key] === oldProps[key]);
  const props = pruneKeys(newProps, [...identical, 'children', 'key', 'ref']);

  // Mutate our OL element
  if (Object.keys(props).length) {
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('attach')) {
        instance[key as 'attach'] = value;
      } else if (key.startsWith('on')) {
        const eventKey = key.substring(2).toLowerCase();
        if (oldProps[key]) instance.un(eventKey, oldProps[key] as () => void);
        instance.on(eventKey, value);
      } else {
        getSetter(instance, key)(value);
      }
    });
  }
}

function appendChild(parentInstance: GenericOLInstance, child: GenericOLInstance) {
  if (!child) return;

  if (child.attach) {
    getSetter(parentInstance, child.attach)(child);
  } else if (child.attachAdd && !getHaser(parentInstance, child.attachAdd)(child)) {
    getAppender(parentInstance, child.attachAdd)(child);
  }

  child._parent = parentInstance || null;
  child._root = parentInstance._root || parentInstance;
}

function removeChild(parentInstance: GenericOLInstance, child: GenericOLInstance) {
  if (!child) return;

  if (child.attach) {
    getSetter(parentInstance, child.attach)(null);
  } else if (child.attachAdd && getHaser(parentInstance, child.attachAdd)(child)) {
    getRemover(parentInstance, child.attachAdd)(child);
  }

  if (child.dispose) {
    child.dispose();
  }
}

function insertBefore(parentInstance: GenericOLInstance, child: GenericOLInstance, beforeChild: GenericOLInstance) {
  if (!child) return;

  child._parent = parentInstance;
  const children = (getGetter(parentInstance, `${child.attachAdd}s`)() as OL.Collection<unknown>)['array_'] as GenericOLInstance[];
  const index = children.indexOf(beforeChild);
  const newChildren = [...children.slice(0, index), child, ...children.slice(index)];
  getSetter(parentInstance, `${child.attachAdd}s`)(newChildren);
}

function createInstance(type: string, { object, args, ...props }: any) {
  const name = pascalCase(type);
  const target = getConstructor(name);

  if (type !== 'primitive' && !target) throw new Error(`${type} is not a part of the OL namespace.`);
  if (type === 'primitive' && !object) throw new Error(`"object" must be set when using primitives.`);

  const instance = (object instanceof Function ? object() : object) || (Array.isArray(args) ? new target(...args) : new target(args));

  if (name.endsWith('Layer')) {
    props = { attachAdd: 'layer', ...props };
  } else if (name.endsWith('Interaction')) {
    props = { attachAdd: 'interaction', ...props };
  } else if (name.endsWith('Geometry')) {
    props = { attach: 'geometry', ...props };
  } else if (name.endsWith('Style')) {
    props = {
      attach: name.substring(0, name.length - 'Style'.length),
      ...props,
    };
  } else if (name.endsWith('Source')) {
    props = { attach: 'source', ...props };
  } else if (name.toLowerCase().endsWith('view')) {
    props = { attach: 'view', ...props };
  } else if (name.toLowerCase().endsWith('feature')) {
    props = { attachAdd: 'feature', ...props };
  } else if (name === 'Primitive') {
    props = { _primitive: true, ...props };
  }

  applyProps(instance, props, {});
  return instance;
}

function switchInstance(instance: GenericOLInstance, type: string, newProps: any, fiber: Reconciler.Fiber) {
  const parent = instance._parent;
  if (!parent) return;
  const newInstance = createInstance(type, newProps);

  removeChild(parent, instance);
  appendChild(parent, newInstance);

  // This evil hack switches the react-internal fiber node
  // https://github.com/facebook/react/issues/14983
  // https://github.com/facebook/react/pull/15021
  [fiber, fiber.alternate].forEach(newFiber => {
    if (newFiber !== null) {
      newFiber.stateNode = newInstance;
      if (newFiber.ref) {
        if (typeof newFiber.ref === 'function') (newFiber as unknown as any).ref(newInstance);
        else (newFiber.ref as Reconciler.RefObject).current = newInstance;
      }
    }
  });
}

const reconciler = Reconciler({
  // OL objects can be updated, so we inform the renderer
  supportsMutation: true,

  // We set this to false because this can work on top of react-dom
  isPrimaryRenderer: false,

  // We can modify the ref here, but we return it instead (no-op)
  getPublicInstance: instance => instance,

  // This object that's passed into the reconciler is the host context.
  // We don't need to expose it though
  getRootHostContext: () => ({}),
  getChildHostContext: () => ({}),

  // Text isn't supported in OL, so we skip it
  createTextInstance: () => {},

  // This is used to calculate updates in the render phase or commitUpdate
  prepareUpdate(instance: GenericOLInstance, type: string, oldProps: any, newProps: any) {
    if (instance._primitive && newProps.object && newProps.object !== instance) return [true];
    else {
      // This is a data object, let's extract critical information about it
      const { args: argsNew = [], children: cN, ...restNew } = newProps;
      const { args: argsOld = [], children: cO, ...restOld } = oldProps;
      // If it has new props or arguments, then it needs to be re-instanciated
      if (!shallowCompare(argsNew, argsOld)) return [true];
      // Create a diff-set, flag if there are any changes
      const diff = Object.entries(restNew)
        .filter(([key, value]) => !shallowCompare(value, restOld[key]))
        .map(([key]) => key);
      if (diff.length) return [false, ...diff];
      // Otherwise do not touch the instance
      return null;
    }
  },

  // This lets us store stuff before React mutates our OL objects.
  // We don't do anything here but return an empty object
  prepareForCommit: () => null,
  resetAfterCommit: () => ({}),

  // OL elements don't have textContent, so we skip this
  shouldSetTextContent: () => false,

  // We can mutate objects once they're assembled into the scene graph here.
  // applyProps removes the need for this though
  finalizeInitialChildren: () => false,

  // This can modify the container and clear children.
  // Might be useful for disposing on demand later
  clearContainer: () => false,

  // This is where we'll create a OL element from a React element
  createInstance,

  // These methods add elements to the scene
  appendChild,
  appendInitialChild: appendChild,
  appendChildToContainer: appendChild,

  // These methods remove elements from the scene
  removeChild,
  removeChildFromContainer: removeChild,

  insertBefore,

  insertInContainerBefore: (parentInstance: GenericOLInstance, child: GenericOLInstance, beforeChild: GenericOLInstance) =>
    insertBefore(
      // getContainer(parentInstance, child).container,
      parentInstance,
      child,
      beforeChild,
    ),

  // This is where we mutate OL objects in the render phase
  commitUpdate(
    instance: GenericOLInstance,
    [reconstruct, ...diff]: [boolean, ...string[]],
    type,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
    fiber: Reconciler.Fiber,
  ) {
    // Reconstruct when args or <primitive object={...} have changes
    if (reconstruct) switchInstance(instance, type, newProps, fiber);
    // Otherwise just overwrite props
    else applyProps(instance, newProps, oldProps, diff);
  },

  supportsPersistence: false,
  supportsHydration: false,
  preparePortalMount() {},
  now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
});

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

const render = (element: ReactNode, rootDiv: HTMLDivElement, mapProps: MapProps & MapEvents) => {
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
};

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
