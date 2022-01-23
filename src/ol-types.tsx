import React from 'react';
import * as OL from 'ol';
import * as OLLayers from 'ol/layer';
import * as OLSources from 'ol/source';
import * as OLInteractions from 'ol/interaction';
import * as OLGeometries from 'ol/geom';
import * as OLStyles from 'ol/style';
import * as OLControls from 'ol/control';
import RenderEvent from 'ol/render/Event';
import { ObjectEvent } from 'ol/Object';
import { VectorSourceEvent } from 'ol/source/Vector';
import { TileSourceEvent } from 'ol/source/Tile';
import { ImageSourceEvent } from 'ol/source/Image';

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
  on: (keys: K, listener: (ev: infer L) => infer R) => any;
}
  ? (ev: Omit<L, 'target'> & { target: T }) => R
  : never;

type KnownEventFix<K extends string, T> = K extends `Pointer${infer Rest}`
  ? (e: OL.MapBrowserEvent<PointerEvent>) => void
  : K extends `${infer Rest}click`
  ? (e: OL.MapBrowserEvent<MouseEvent>) => void
  : K extends `${infer Rest}compose`
  ? (e: RenderEvent) => void
  : K extends `${infer Rest}render`
  ? (e: RenderEvent) => void
  : K extends `${infer Rest}feature`
  ? (e: VectorSourceEvent<any>) => void
  : K extends `Featuresload${infer Rest}`
  ? (e: VectorSourceEvent<any>) => void
  : K extends `Tileload${infer Rest}`
  ? (e: TileSourceEvent) => void
  : K extends `Imageload${infer Rest}`
  ? (e: ImageSourceEvent) => void
  : K extends `Change:${infer Rest}`
  ? (e: ObjectEvent) => void
  : K extends `Propertychange`
  ? (e: ObjectEvent) => void
  : K extends `Move${infer Rest}`
  ? (e: OL.MapEvent) => void
  : ListenerTypeForKey<T, Uncapitalize<K>>;

export type EventHandlerProps<T> = PrependToKeys<
  {
    [key in Capitalize<EventHandlerKeys<T>>]: KnownEventFix<key, T>;
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

// Allows correct props for a primitive with generics
export function OLPrimitive<T>(props: { object: T } & NodeProps<T, unknown>) {
  return <primitive {...props} />;
}
