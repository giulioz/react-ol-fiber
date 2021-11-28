import { miniRender } from './utils';
import React, { useState } from 'react';

import { Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

describe('Args prop', () => {
  test('creates and recreates a style from args', async () => {
    let externalEvent = (value: boolean) => {};
    function MyStyle() {
      const [state, setState] = useState(false);
      externalEvent = setState;
      return (
        <styleStyle>
          <fillStyle args={{ color: state ? 'red' : 'blue' }} />
        </styleStyle>
      );
    }
    const [_, map, act] = await miniRender(
      <vectorLayer>
        <MyStyle />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    const style = layer.getStyle() as Style;
    expect(style.getFill().getColor()).toBe('blue');
    await act(async () => externalEvent(true));
    expect(style.getFill().getColor()).toBe('red');
    await act(async () => externalEvent(false));
    expect(style.getFill().getColor()).toBe('blue');
  });

  test('does not recreate the object when the args does not change', async () => {
    let externalEvent = (value: number) => {};
    function MyStyle() {
      const [state, setState] = useState(1);
      externalEvent = setState;
      return (
        <styleStyle>
          <fillStyle args={{ color: 'red' }} />
          <strokeStyle args={{ color: 'red', width: state }} />
        </styleStyle>
      );
    }
    const [_, map, act] = await miniRender(
      <vectorLayer>
        <MyStyle />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    const style = layer.getStyle() as Style;
    (style.getFill() as any).__instance = 42;
    expect(style.getStroke().getWidth()).toBe(1);
    await act(async () => externalEvent(2));
    expect((style.getFill() as any).__instance).toBe(42);
    expect(style.getStroke().getWidth()).toBe(2);
    await act(async () => externalEvent(3));
    expect((style.getFill() as any).__instance).toBe(42);
    expect(style.getStroke().getWidth()).toBe(3);
  });
});
