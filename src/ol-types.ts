import React from 'react';
import * as OL from 'ol';
import * as OLLayers from 'ol/layer';
import * as OLSources from 'ol/source';
import * as OLInteractions from 'ol/interaction';
import * as OLGeometries from 'ol/geom';
import * as OLStyles from 'ol/style';
import * as OLControls from 'ol/control';

export type StartingKeys<T, Str extends string, Rest extends string = string> = {
  [K in keyof T]: K extends `${Str}${Rest}` ? K : never;
}[keyof T];

export type StripKey<K, Str extends string> = K extends `${Str}${infer Rest}` ? Rest : never;

export type AppendToKeys<T, Str extends string> = keyof T extends string
  ? {
      [K in `${keyof T}${Str}`]: K extends `${infer S}${Str}` ? (S extends keyof T ? T[S] : never) : never;
    }
  : never;

export type PrependToKeys<T, Str extends string> = keyof T extends string
  ? {
      [K in `${Str}${keyof T}`]: K extends `${Str}${infer S}` ? (S extends keyof T ? T[S] : never) : never;
    }
  : never;

export type AllSetters<T> = Pick<T, StartingKeys<T, 'set'>>;

export type SettersValues<T> = {
  [K in keyof T]: T[K] extends (value: infer VT) => unknown ? VT : never;
};

export type SettableProps<T> = {
  [K in Uncapitalize<StripKey<keyof AllSetters<T>, 'set'>>]: `set${Capitalize<K>}` extends keyof SettersValues<T>
    ? SettersValues<T>[`set${Capitalize<K>}`]
    : never;
};

export type Args<T> = T extends new (...args: unknown[]) => unknown ? ConstructorParameters<T> | ConstructorParameters<T>[0] : T;

export interface NodeProps<T, P> {
  attach?: string;
  attachAdd?: string;
  args?: Omit<Args<P>, 'prototype'>;
  children?: React.ReactNode;
  ref?: React.Ref<T | undefined>;
  key?: React.Key;
  onUpdate?: (self: T) => void;
}

export type PrimitiveType<T, P> = NodeProps<T, P> & { object: T | (() => T) };

type EventHandlerKeys<T> = T extends {
  on: (keys: [infer K], ...args: any) => any;
}
  ? K extends string
    ? K
    : never
  : never;

type ListenerTypeForKey<T, K> = T extends {
  on: (keys: K, listener: infer L) => any;
}
  ? L
  : never;

export type EventHandlerProps<T> = PrependToKeys<
  {
    [key in Capitalize<EventHandlerKeys<T>>]: ListenerTypeForKey<T, Uncapitalize<key>>;
  },
  'on'
>;

export type Node<T, P> = Partial<SettableProps<T>> & Partial<EventHandlerProps<T>> & NodeProps<T, P>;

type ConstructedObject<T> = T extends new (...args: any) => infer C ? C : never;

type ExtractIntrinsicElements<T> = keyof T extends string
  ? {
      [K in Uncapitalize<keyof T>]: Capitalize<K> extends keyof T ? Node<ConstructedObject<T[Capitalize<K>]>, T[Capitalize<K>]> : never;
    }
  : never;

type BaseElements = ExtractIntrinsicElements<typeof OL>;
type LayerElements = AppendToKeys<ExtractIntrinsicElements<typeof OLLayers>, 'Layer'>;
type SourceElements = AppendToKeys<ExtractIntrinsicElements<typeof OLSources>, 'Source'>;
type InteractionElements = AppendToKeys<ExtractIntrinsicElements<typeof OLInteractions>, 'Interaction'>;
type GeometryElements = AppendToKeys<ExtractIntrinsicElements<typeof OLGeometries>, 'Geometry'>;
type StyleElements = AppendToKeys<ExtractIntrinsicElements<typeof OLStyles>, 'Style'>;
type ControlElements = AppendToKeys<ExtractIntrinsicElements<typeof OLControls>, 'Control'>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends BaseElements, LayerElements, SourceElements, InteractionElements, GeometryElements, StyleElements, ControlElements {
      primitive: PrimitiveType<any, any>;
      olView: Node<ConstructedObject<typeof OL['View']>, typeof OL['View']>;
    }
  }
}
