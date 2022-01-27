import React from 'react';
import Reconciler from 'react-reconciler';
import { unstable_now as now } from 'scheduler';

import * as OL from 'ol';
import * as OLLayers from 'ol/layer';
import * as OLSources from 'ol/source';
import * as OLInteractions from 'ol/interaction';
import * as OLGeometries from 'ol/geom';
import * as OLStyles from 'ol/style';
import * as OLControls from 'ol/control';

import { pascalCase, pruneKeys, shallowCompare } from './utils';

type GenericOLInstance = {
  dispose?: () => void;
  changed?: () => void;
  getVisible?: () => boolean;
  setVisible?: (v: boolean) => void;
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => void;
  on(ev: string, handler: (...args: any) => void): void;
  un(ev: string, handler: (...args: any) => void): void;
  attach?: string;
  attachAdd?: string;
  _root?: any;
  _parent?: GenericOLInstance;
  _primitive?: boolean;
  _type?: string;
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
export let catalogue: Catalogue = {
  '*Layer': OLLayers as any,
  '*Source': OLSources as any,
  '*Interaction': OLInteractions as any,
  '*Geometry': OLGeometries as any,
  '*Style': OLStyles as any,
  '*Control': OLControls as any,
  olView: OL.View as any,
};

export const extend = (objects: Catalogue): void => void (catalogue = { ...catalogue, ...objects });

function getConstructor(name: string) {
  const candidateEnding = Object.keys(catalogue)
    .find(k => k.startsWith('*') && name.endsWith(k.substring(1)))
    ?.substring(1);
  const namespacedCatalogueEntry =
    candidateEnding && (catalogue as any)[`*${candidateEnding}`][pascalCase(name.substring(0, name.length - candidateEnding.length))];

  const directCatalogueEntry = (catalogue[name] || catalogue[pascalCase(name)]) as {
    new (...args: any): GenericOLInstance;
  };

  return directCatalogueEntry || namespacedCatalogueEntry || (OL as any)[pascalCase(name)];
}

function getGetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`get${pascalCase(prop)}` as const]?.bind(instance) || (instance.get && (() => instance.get && instance.get(prop)));
}
function getSetter<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`set${pascalCase(prop)}` as const]?.bind(instance) || (instance.set && ((value: any) => instance.set && instance.set(prop, value))) || null;
}
function getAppender<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`add${pascalCase(prop)}` as const]?.bind(instance) || null;
}
function getRemover<TK extends string>(instance: GenericOLInstance, prop: TK) {
  return instance[`remove${pascalCase(prop)}` as const]?.bind(instance) || null;
}
function getHaser<TK extends string>(instance: GenericOLInstance, prop: TK) {
  const getter = getGetter(instance, `${prop}s`);
  if (!getter) return () => false;
  const array = getter();
  const arrayChecker = array?.includes?.bind(array) || array?.array_?.includes?.bind(array.array_);
  return instance[`has${pascalCase(prop)}` as const]?.bind(instance) || ((value: any) => arrayChecker(value)) || (() => false);
}

export function applyProps(
  instance: GenericOLInstance,
  newProps: Record<string, unknown>,
  oldProps?: Record<string, unknown>,
  diff?: string[],
  forceReplace?: boolean,
) {
  // Filter identical props and reserved keys
  const identical = Object.keys(newProps).filter(key => newProps[key] === oldProps?.[key]);
  const props = pruneKeys(newProps, [...identical, 'children', 'key', 'ref']);

  // Mutate our OL element
  if (Object.keys(props).length) {
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('attach')) {
        instance[key as 'attach'] = value;
      } else if (key.startsWith('on')) {
        const eventKey = key.substring(2).toLowerCase();
        if (oldProps?.[key]) instance.un(eventKey, oldProps[key] as () => void);
        instance.on(eventKey, value);
      } else {
        const setter = getSetter(instance, key);
        if (setter) {
          setter(value);
        } else {
          // No setter, must recreate!
          if (forceReplace && instance._type && instance._parent) {
            const newInstance = createInstance(instance._type, newProps);
            removeChild(instance._parent, instance);
            appendChild(instance._parent, newInstance);
          }
        }
      }
    });
  }
}

function triggerParentChanged(instance?: GenericOLInstance) {
  if (instance && instance.changed) {
    instance.changed();
  } else if (instance && instance._parent) {
    triggerParentChanged(instance._parent);
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
  } else if (child.attachAdd) {
    const appender = getAppender(parentInstance, child.attachAdd);
    if (appender && !getHaser(parentInstance, child.attachAdd)(child)) {
      appender(child);
      parentInstance._attachedAdd = parentInstance._attachedAdd || [];
      parentInstance._attachedAdd.push({ key: child.attachAdd, value: child });
    } else {
      const getter = getGetter(parentInstance, child.attachAdd);
      const setter = getSetter(parentInstance, child.attachAdd);
      if (getter && setter) {
        const val = getter();
        const arr = Array.isArray(val) ? val : [];
        setter([...arr, child]);
      }
    }
  }

  child._parent = parentInstance || null;
  child._root = parentInstance._root || parentInstance;

  triggerParentChanged(parentInstance);
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
    const remover = getRemover(parentInstance, child.attachAdd);
    if (remover) {
      remover(child);
      parentInstance._attachedAdd = parentInstance._attachedAdd || [];
      parentInstance._attachedAdd.splice(
        parentInstance._attachedAdd.findIndex(e => e.key === child.attachAdd && e.value === child),
        1,
      );
    }
  }

  if (child.dispose) {
    child.dispose();
  }
}

function insertBefore(parentInstance: GenericOLInstance, child: GenericOLInstance, beforeChild: GenericOLInstance) {
  if (!child) return;

  child._parent = parentInstance;
  const getter = getGetter(parentInstance, `${child.attachAdd}s`);
  const setter = getSetter(parentInstance, `${child.attachAdd}s`);
  if (getter && setter) {
    const children = (getter() as OL.Collection<unknown>)['array_'] as GenericOLInstance[];
    const index = children.indexOf(beforeChild);
    const newChildren = [...children.slice(0, index), child, ...children.slice(index)];
    setter(newChildren);
  }
}

function autoAttach(name: string, props: any, object?: any) {
  if (props.attach || props.attachAdd) return {};

  if (name.endsWith('Layer') || object instanceof OLLayers.Layer) {
    return { attachAdd: 'layer' };
  } else if (name.endsWith('Interaction') || object instanceof OLInteractions.Interaction) {
    return { attachAdd: 'interaction' };
  } else if (name.endsWith('Geometry') || object instanceof OLGeometries.Geometry) {
    return { attach: 'geometry' };
  } else if (name === 'fillStyle' || name === 'strokeStyle') {
    return { attach: name.substring(0, name.length - 'Style'.length).toLowerCase() };
  } else if (name === 'styleStyle' || object instanceof OLStyles.Style) {
    return { attach: 'style' };
  } else if (name === 'textStyle' || object instanceof OLStyles.Text) {
    return { attach: 'text' };
  } else if (name.endsWith('Style') || object instanceof OLStyles.Image) {
    return { attach: 'image' };
  } else if (name.endsWith('Source') || object instanceof OLSources.Source) {
    return { attach: 'source' };
  } else if (name.endsWith('Control' || object instanceof OLControls.Control)) {
    return { attachAdd: 'control' };
  } else if (name.toLowerCase().endsWith('view') || object instanceof OL.View) {
    return { attach: 'view' };
  } else if (name.toLowerCase().endsWith('feature') || object instanceof OL.Feature) {
    return { attachAdd: 'feature' };
  } else if (name === 'olPrimitive') {
    return { _primitive: true };
  }
  return {};
}

function getImmutableChildren(type: string, children: any): false | { type: string; props: any }[] {
  const target = getConstructor(type);
  if (target && children) {
    const childrenArr: { type: string; props: any }[] = Array.isArray(children) ? children : [children];
    const unappliableChildren = childrenArr.filter(c => {
      const a = c && typeof c.type === 'string' && { ...autoAttach(c.type, c.props), ...c.props };
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

// Hacky mini renderer for style functions
function miniChildCreate(jsx: JSX.Element) {
  if (!jsx) return null;
  const root = createInstance(jsx.type, jsx.props);
  const children: JSX.Element[] = Array.isArray(jsx.props.children) ? jsx.props.children : [jsx.props.children];
  const childrenCreated = children.map(miniChildCreate);
  childrenCreated.forEach(c => appendChild(root, c));
  return root;
}

function fnWrapper(fn: Function) {
  return (...params: any[]) => {
    const jsx = fn(...params);
    if (React.isValidElement(jsx)) {
      return miniChildCreate(jsx);
    } else {
      return jsx;
    }
  };
}

function createInstance(type: string, { object, arg, args, fn, ...props }: any) {
  const target = getConstructor(type);

  if (type !== 'olPrimitive' && type !== 'olFn' && !target) throw new Error(`${type} is not a part of the OL namespace.`);
  if (type === 'olPrimitive' && !object) throw new Error(`"object" must be set when using primitives.`);
  if (type === 'olFn' && !fn) throw new Error(`"fn" must be a function when using olFn.`);

  props = { ...autoAttach(type, props, object), ...props };

  const unappliableChildren = getImmutableChildren(type, props.children);
  if (unappliableChildren) {
    const childrenArgs: any = {};
    unappliableChildren.forEach(c => {
      const a = c && typeof c.type === 'string' && { ...autoAttach(c.type, c.props), ...c.props };
      if (a.attach && c) {
        childrenArgs[a.attach] = createInstance(c.type, c.props);
      }
    });

    arg = arg || {};
    arg = { ...arg, ...childrenArgs };
  }

  const instance =
    (fn instanceof Function && fnWrapper(fn)) ||
    (object instanceof Function ? object() : object) ||
    (Array.isArray(args) ? new target(...args) : new target(arg));
  instance._type = type;

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
      const { arg: argNew, args: argsNew = [], children: cN, ...restNew } = newProps;
      const { arg: argOld, args: argsOld = [], children: cO, ...restOld } = oldProps;
      // If it has new props or arguments, then it needs to be re-instanciated
      if (!shallowCompare(argsNew, argsOld) || !shallowCompare(argNew, argOld)) return [true];
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
    // Reconstruct when args or <olPrimitive object={...} have changes
    if (reconstruct) switchInstance(instance, type, newProps, fiber);
    // Otherwise just overwrite props
    else applyProps(instance, newProps, oldProps, diff);
  },

  hideInstance(instance: GenericOLInstance) {
    instance.setVisible?.(false);
  },
  unhideInstance(instance: GenericOLInstance, props: Record<string, unknown>) {
    if (props.visible == null || props.visible) {
      instance.setVisible?.(true);
    }
  },
  hideTextInstance() {},

  supportsPersistence: false,
  supportsHydration: false,
  preparePortalMount() {},
  now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
});
