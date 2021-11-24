import Reconciler from 'react-reconciler';
import { unstable_now as now } from 'scheduler';

import * as OL from 'ol';
import * as OLLayers from 'ol/layer';
import * as OLSources from 'ol/source';
import * as OLInteractions from 'ol/interaction';
import * as OLGeometries from 'ol/geom';
import * as OLStyles from 'ol/style';

import { pascalCase, pruneKeys, shallowCompare } from './utils';

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
  _attached?: { key: string; value: GenericOLInstance }[];
  _attachedAdd?: { key: string; value: GenericOLInstance }[];
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

function getGetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`get${pascalCase(prop)}` as const]?.bind(instance) || (() => instance.get(prop));
}
function getSetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`set${pascalCase(prop)}` as const]?.bind(instance) || (instance.set && ((value: any) => instance.set(prop, value))) || null;
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

export function applyProps(instance: GenericOLInstance, newProps: Record<string, unknown>, oldProps: Record<string, unknown>, diff?: string[]) {
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
        const setter = getSetter(instance, key);
        if (setter) {
          setter(value);
        } else {
          // No setter, must recreate!
        }
      }
    });
  }
}

function appendChild(parentInstance: GenericOLInstance, child: GenericOLInstance) {
  if (!child) return;

  if (child.attach) {
    const setter = getSetter(parentInstance, child.attach);
    if (setter) {
      setter(child);
      parentInstance._attached = parentInstance._attached || [];
      parentInstance._attached.push({ key: child.attach, value: child });
    } else {
      // No setter, must recreate!
    }
  } else if (child.attachAdd && !getHaser(parentInstance, child.attachAdd)(child)) {
    getAppender(parentInstance, child.attachAdd)(child);
    parentInstance._attachedAdd = parentInstance._attachedAdd || [];
    parentInstance._attachedAdd.push({ key: child.attachAdd, value: child });
  }

  child._parent = parentInstance || null;
  child._root = parentInstance._root || parentInstance;
}

function removeChild(parentInstance: GenericOLInstance, child: GenericOLInstance) {
  if (!child) return;

  if (child.attach) {
    const setter = getSetter(parentInstance, child.attach);
    if (setter) {
      setter(null);
      parentInstance._attached = parentInstance._attached || [];
      parentInstance._attached.splice(
        parentInstance._attached.findIndex(e => e.key === child.attach && e.value === child),
        1,
      );
    } else {
      // No setter, must recreate!
    }
  } else if (child.attachAdd && getHaser(parentInstance, child.attachAdd)(child)) {
    getRemover(parentInstance, child.attachAdd)(child);
    parentInstance._attachedAdd = parentInstance._attachedAdd || [];
    parentInstance._attachedAdd.splice(
      parentInstance._attachedAdd.findIndex(e => e.key === child.attachAdd && e.value === child),
      1,
    );
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

function autoAttach(name: string) {
  if (name.endsWith('Layer')) {
    return { attachAdd: 'layer' };
  } else if (name.endsWith('Interaction')) {
    return { attachAdd: 'interaction' };
  } else if (name.endsWith('Geometry')) {
    return { attach: 'geometry' };
  } else if (name === 'FillStyle' || name === 'StrokeStyle') {
    return { attach: name.substring(0, name.length - 'Style'.length).toLowerCase() };
  } else if (name === 'StyleStyle') {
    return { attach: 'style' };
  } else if (name.endsWith('Style')) {
    return { attach: 'image' };
  } else if (name.endsWith('Source')) {
    return { attach: 'source' };
  } else if (name.toLowerCase().endsWith('view')) {
    return { attach: 'view' };
  } else if (name.toLowerCase().endsWith('feature')) {
    return { attachAdd: 'feature' };
  } else if (name === 'Primitive') {
    return { _primitive: true };
  }
  return {};
}

function getImmutableChildren(type: string, children: any): false | { type: string; props: any }[] {
  const name = pascalCase(type);
  const target = getConstructor(name);
  if (target && children) {
    const childrenArr: { type: string; props: any }[] = Array.isArray(children) ? children : [children];
    const unappliableChildren = childrenArr.filter(c => {
      const a = c && { ...autoAttach(pascalCase(c.type)), ...c.props };
      const setter = a?.attach && target.prototype[`set${pascalCase(a.attach)}`];
      const adder = a?.attachAdd && target.prototype[`add${pascalCase(a.attachAdd)}`];
      return c && (!(setter || adder) || getImmutableChildren(c.type, c.props.children));
    });

    if (unappliableChildren.length > 0) {
      return unappliableChildren;
    }
  }

  return false;
}

function createInstance(type: string, { object, args, ...props }: any) {
  const name = pascalCase(type);
  const target = getConstructor(name);

  if (type !== 'primitive' && !target) throw new Error(`${type} is not a part of the OL namespace.`);
  if (type === 'primitive' && !object) throw new Error(`"object" must be set when using primitives.`);

  props = { ...props, ...autoAttach(name) };

  const unappliableChildren = getImmutableChildren(type, props.children);
  if (unappliableChildren) {
    const childrenArgs: any = {};
    unappliableChildren.forEach(c => {
      const a = c && { ...autoAttach(pascalCase(c.type)), ...c.props };
      if (a.attach && c) {
        childrenArgs[a.attach] = createInstance(c.type, c.props);
      }
    });

    args = args || {};
    args = { ...args, ...childrenArgs };
  }

  const instance = (object instanceof Function ? object() : object) || (Array.isArray(args) ? new target(...args) : new target(args));

  applyProps(instance, props, {}, []);
  return instance;
}

function switchInstance(instance: GenericOLInstance, type: string, newProps: any, fiber: Reconciler.Fiber) {
  const parent = instance._parent;
  if (!parent) return;
  const newInstance = createInstance(type, newProps);

  removeChild(parent, instance);
  appendChild(parent, newInstance);

  (instance._attached || []).forEach(a => {
    appendChild(newInstance, a.value);
  });
  (instance._attachedAdd || []).forEach(a => {
    appendChild(newInstance, a.value);
  });

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

export const reconciler = Reconciler({
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
    if (getImmutableChildren(type, newProps.children)) return [true];
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
