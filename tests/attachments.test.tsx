import { miniRender } from './utils';
import React, { useEffect, useState } from 'react';

import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { Circle, Point, Polygon } from 'ol/geom';
import { DragPan, MouseWheelZoom } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';

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

  test('correctly attaches a style to a layer (implicit)', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<any>;
    expect(layer.getStyle()).toBeInstanceOf(Style);
  });

  test('correctly attaches a style to a layer (explicit)', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle attach='style' />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<any>;
    expect(layer.getStyle()).toBeInstanceOf(Style);
  });

  test('correctly attaches a feature with style and geometry to a source to a layer', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <vectorSource>
          <feature>
            <styleStyle />
            <pointGeometry args={[0, 0]} />
          </feature>
        </vectorSource>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource()).toBeInstanceOf(VectorSource);
    expect(layer.getSource().getFeatures()).toHaveLength(1);
    expect(layer.getSource().getFeatures()[0].getStyle()).toBeInstanceOf(Style);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
  });

  test('correctly attaches multiple features in order', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <vectorSource>
          <feature>
            <pointGeometry args={[0, 0]} />
          </feature>
          <feature>
            <circleGeometry args={[[2, 5], 4]} />
          </feature>
          <feature>
            <polygonGeometry args={[[]]} />
          </feature>
        </vectorSource>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource().getFeatures()).toHaveLength(3);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Circle);
    expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Polygon);
  });

  test('correctly attaches multiple interactions', async () => {
    const [_, map] = await miniRender(
      <>
        <dragPanInteraction />
        <mouseWheelZoomInteraction />
      </>,
    );
    expect(map.getInteractions().getArray()).toHaveLength(2);
    expect(map.getInteractions().getArray()[0]).toBeInstanceOf(DragPan);
    expect(map.getInteractions().getArray()[1]).toBeInstanceOf(MouseWheelZoom);
  });

  test('correctly attaches fill and stroke to a style', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle>
          <fillStyle args={{ color: 'red' }} />
          <strokeStyle args={{ color: 'blue', width: 4 }} />
        </styleStyle>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getStyle()).toBeInstanceOf(Style);
    const style = layer.getStyle() as Style;
    expect(style.getFill()).toBeInstanceOf(Fill);
    expect(style.getFill().getColor()).toBe('red');
    expect(style.getStroke()).toBeInstanceOf(Stroke);
    expect(style.getStroke().getWidth()).toBe(4);
  });

  test('correctly attaches multiple styles', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        {/* TODO: support auto attachAdd with multiple children */}
        <styleStyle attachAdd='style'>
          <fillStyle args={{ color: 'red' }} />
        </styleStyle>
        <styleStyle attachAdd='style'>
          <fillStyle args={{ color: 'blue' }} />
        </styleStyle>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(Array.isArray(layer.getStyle())).toBeTruthy();
    const styles = layer.getStyle() as Style[];
    expect(styles[0].getFill().getColor()).toBe('red');
    expect(styles[1].getFill().getColor()).toBe('blue');
  });

  test('correctly attaches a full circle to a style (children as ctor params)', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle>
          <circleStyle>
            <fillStyle args={{ color: 'red' }} />
            <strokeStyle args={{ color: 'blue', width: 4 }} />
          </circleStyle>
        </styleStyle>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getStyle()).toBeInstanceOf(Style);
    const style = layer.getStyle() as Style;
    expect(style.getFill()).toBeFalsy();
    expect(style.getImage()).toBeInstanceOf(CircleStyle);
    const image = style.getImage() as CircleStyle;
    expect(image.getFill().getColor()).toBe('red');
    expect(image.getStroke().getColor()).toBe('blue');
  });

  test('correctly attaches primitives with auto attach', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <vectorSource>
          <feature>
            <primitive object={new Point([])} />
          </feature>
          <feature>
            <primitive object={new Circle([2, 5], 4)} />
          </feature>
          <primitive object={new Feature(new Polygon([]))} />
        </vectorSource>
        <primitive object={new Style()} />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource().getFeatures()).toHaveLength(3);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Circle);
    expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Polygon);
    expect(layer.getStyle()).toBeInstanceOf(Style);
  });

  test('correctly attaches children in primitives', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <primitive object={new VectorSource()}>
          <feature>
            <pointGeometry args={[[]]} />
          </feature>
          <feature>
            <primitive object={new Circle([2, 5], 4)} />
          </feature>
          <primitive object={new Feature(new Polygon([]))} />
        </primitive>
        <primitive object={new Style()}>
          <fillStyle args={{ color: 'red' }} />
          <strokeStyle args={{ color: 'blue' }} />
        </primitive>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource().getFeatures()).toHaveLength(3);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Circle);
    expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Polygon);
    expect(layer.getStyle()).toBeInstanceOf(Style);
    const style = layer.getStyle() as Style;
    expect(style.getFill().getColor()).toBe('red');
    expect(style.getStroke().getColor()).toBe('blue');
  });
});

describe('Dynamic attachments', () => {
  test('correctly attaches features in order from state with timeout', async () => {
    function Component() {
      const [state, setState] = useState<null | [number, number][]>(null);
      useEffect(
        () =>
          void setTimeout(
            () =>
              setState([
                [0, 0],
                [1, 1],
                [2, 2],
              ]),
            100,
          ),
        [],
      );
      return (
        <>
          {state
            ? state.map((c, i) => (
                <feature key={i}>
                  <pointGeometry args={[c]} />
                </feature>
              ))
            : null}
        </>
      );
    }
    const [_, map] = await miniRender(
      <vectorLayer>
        <Component />
      </vectorLayer>,
    );
    setTimeout(() => {
      const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
      expect(layer.getSource().getFeatures()).toHaveLength(3);
      expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
      expect((layer.getSource().getFeatures()[0].getGeometry() as Point).getCoordinates()).toBe([0, 0]);
      expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Point);
      expect((layer.getSource().getFeatures()[1].getGeometry() as Point).getCoordinates()).toBe([1, 1]);
      expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Point);
      expect((layer.getSource().getFeatures()[2].getGeometry() as Point).getCoordinates()).toBe([2, 2]);
    }, 200);
  });
});
