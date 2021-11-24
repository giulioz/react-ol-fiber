import { miniRender } from './utils';

import React from 'react';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';

describe('Static attachments', () => {
  test('correctly attaches a single layer to a map (implicit)', async () => {
    const [_, map] = await miniRender(<vectorLayer />);
    expect(map.getLayers().getLength()).toBe(1);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
  });

  test('correctly attaches a single layer to a map (explicit)', async () => {
    const [_, map] = await miniRender(<tileLayer attachAdd='layer' />);
    expect(map.getLayers().getLength()).toBe(1);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(TileLayer);
  });

  test('correctly attaches multiple layers to a map in order', async () => {
    const [_, map] = await miniRender(
      <>
        <vectorLayer attachAdd='layer' />
        <tileLayer />
        <imageLayer />
      </>,
    );
    expect(map.getLayers().getLength()).toBe(3);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(TileLayer);
    expect(map.getLayers().getArray()[2]).toBeInstanceOf(ImageLayer);
  });

  test('correctly attaches multiple layers to a map in order from a component', async () => {
    function MyLayers() {
      return (
        <>
          <vectorLayer attachAdd='layer' />
          <tileLayer />
        </>
      );
    }

    const [_, map] = await miniRender(
      <>
        <MyLayers />
        <imageLayer />
      </>,
    );
    expect(map.getLayers().getLength()).toBe(3);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(TileLayer);
    expect(map.getLayers().getArray()[2]).toBeInstanceOf(ImageLayer);
  });
});
