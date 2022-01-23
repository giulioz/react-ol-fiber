import { miniRender } from './utils';
import { extend } from '../src';
import React, { useRef, useState } from 'react';

import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import TextStyle from 'ol/style/Text';
import { Circle, Point, Polygon } from 'ol/geom';
import { DragPan, MouseWheelZoom } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import BaseObject from 'ol/Object';

class UnknownCustom extends BaseObject {}
extend({ UnknownCustom: UnknownCustom as any });
declare global {
  namespace JSX {
    interface IntrinsicElements {
      unknownCustom: any;
    }
  }
}

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
            <pointGeometry arg={[0, 0]} />
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
            <pointGeometry arg={[0, 0]} />
          </feature>
          <feature>
            <circleGeometry args={[[2, 5], 4]} />
          </feature>
          <feature>
            <polygonGeometry arg={[]} />
          </feature>
        </vectorSource>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource().getFeatures()).toHaveLength(3);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Circle);
    expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Polygon);
    const circle = layer.getSource().getFeatures()[1].getGeometry() as Circle;
    expect(circle.getRadius()).toBe(4);
    expect(circle.getCenter()).toEqual([2, 5]);
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

  test('correctly attaches multiple controls', async () => {
    const [_, map] = await miniRender(
      <>
        <zoomControl />
        <attributionControl />
      </>,
    );
    expect(map.getControls().getArray()).toHaveLength(2);
    expect(map.getControls().getArray()[0]).toBeInstanceOf(Zoom);
    expect(map.getControls().getArray()[1]).toBeInstanceOf(Attribution);
  });

  test('handles attachment of an invalid element with extend', async () => {
    let refVal = null as any;
    function TestComponent() {
      return <unknownCustom ref={(e: any) => (refVal = e)} />;
    }
    const [_, map] = await miniRender(<TestComponent />);
    expect(refVal).toBeInstanceOf(UnknownCustom);
    expect(refVal.attach).toBeFalsy();
    expect(refVal.attachAdd).toBeFalsy();
  });

  test('correctly attaches fill and stroke to a style', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle>
          <fillStyle arg={{ color: 'red' }} />
          <strokeStyle arg={{ color: 'blue', width: 4 }} />
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
          <fillStyle arg={{ color: 'red' }} />
        </styleStyle>
        <styleStyle attachAdd='style'>
          <fillStyle arg={{ color: 'blue' }} />
        </styleStyle>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(Array.isArray(layer.getStyle())).toBeTruthy();
    const styles = layer.getStyle() as Style[];
    expect(styles[0].getFill().getColor()).toBe('red');
    expect(styles[1].getFill().getColor()).toBe('blue');
  });

  test('correctly attaches a circle to a style (children as ctor params)', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle>
          <circleStyle>
            <fillStyle arg={{ color: 'red' }} />
            <strokeStyle arg={{ color: 'blue', width: 4 }} />
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

  test('correctly attaches text to a style', async () => {
    const [_, map] = await miniRender(
      <vectorLayer>
        <styleStyle>
          <textStyle arg={{ text: 'abc' }}>
            <fillStyle arg={{ color: 'red' }} />
          </textStyle>
        </styleStyle>
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getStyle()).toBeInstanceOf(Style);
    const style = layer.getStyle() as Style;
    expect(style.getFill()).toBeFalsy();
    expect(style.getText()).toBeInstanceOf(TextStyle);
    const text = style.getText() as TextStyle;
    expect(text.getFill().getColor()).toBe('red');
    expect(text.getText()).toBe('abc');
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
            <pointGeometry arg={[]} />
          </feature>
          <feature>
            <primitive object={new Circle([2, 5], 4)} />
          </feature>
          <primitive object={new Feature(new Polygon([]))} />
        </primitive>
        <primitive object={new Style()}>
          <fillStyle arg={{ color: 'red' }} />
          <strokeStyle arg={{ color: 'blue' }} />
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

  test('correctly attaches a view', async () => {
    const [_, map] = await miniRender(<olView arg={{ center: [42, 42] }} />);
    map.on('change:view', () => expect(map.getView().getCenter()).toBe([42, 42]));
  });
});

describe('Dynamic attachments', () => {
  test('correctly attaches and removes a style from a layer', async () => {
    let externalEvent = (value: number) => {};
    function Component() {
      const [state, setState] = useState<number>(0);
      externalEvent = setState;
      return <vectorLayer>{state > 0 && <styleStyle>{state > 1 && <fillStyle arg={{ color: 'red' }} />}</styleStyle>}</vectorLayer>;
    }
    const [_, map, act] = await miniRender(<Component />);
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getStyle()).toBeInstanceOf(Function);
    await act(async () => externalEvent(1));
    expect(layer.getStyle()).toBeTruthy();
    expect((layer.getStyle() as Style).getFill()).toBeFalsy();
    await act(async () => externalEvent(2));
    expect((layer.getStyle() as Style).getFill()).toBeInstanceOf(Fill);
    expect((layer.getStyle() as Style).getFill().getColor()).toBe('red');
    await act(async () => externalEvent(1));
    expect((layer.getStyle() as Style).getFill()).toBeFalsy();
    await act(async () => externalEvent(0));
    expect(layer.getStyle()).toBeFalsy();
  });

  test('correctly attaches features in order from state with timeout', async () => {
    let externalEvent = () => {};
    function Component() {
      const [state, setState] = useState<null | [number, number][]>(null);
      externalEvent = () =>
        setState([
          [0, 0],
          [1, 1],
          [2, 2],
        ]);
      return (
        <vectorSource>
          {state
            ? state.map((c, i) => (
                <feature key={i}>
                  <pointGeometry args={[c]} />
                </feature>
              ))
            : null}
        </vectorSource>
      );
    }
    const [_, map, act] = await miniRender(
      <vectorLayer>
        <Component />
      </vectorLayer>,
    );
    const layer = map.getLayers().getArray()[0] as VectorLayer<VectorSource<any>>;
    expect(layer.getSource().getFeatures()).toHaveLength(0);
    await act(async () => externalEvent());
    expect(layer.getSource().getFeatures()).toHaveLength(3);
    expect(layer.getSource().getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect((layer.getSource().getFeatures()[0].getGeometry() as Point).getCoordinates()).toStrictEqual([0, 0]);
    expect(layer.getSource().getFeatures()[1].getGeometry()).toBeInstanceOf(Point);
    expect((layer.getSource().getFeatures()[1].getGeometry() as Point).getCoordinates()).toStrictEqual([1, 1]);
    expect(layer.getSource().getFeatures()[2].getGeometry()).toBeInstanceOf(Point);
    expect((layer.getSource().getFeatures()[2].getGeometry() as Point).getCoordinates()).toStrictEqual([2, 2]);
  });

  test('correctly attaches and removes a new layer in the middle after a while', async () => {
    let externalEvent = (value: boolean) => {};
    function Component() {
      const [state, setState] = useState<boolean>(false);
      externalEvent = setState;
      return (
        <>
          <vectorLayer />
          {state && <tileLayer />}
          <imageLayer />
        </>
      );
    }
    const [_, map, act] = await miniRender(<Component />);
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
    await act(async () => externalEvent(true));
    expect(map.getLayers().getLength()).toBe(3);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(TileLayer);
    expect(map.getLayers().getArray()[2]).toBeInstanceOf(ImageLayer);
    await act(async () => externalEvent(false));
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
  });

  test('correctly attaches and removes a new layer in the beginning after a while', async () => {
    let externalEvent = (value: boolean) => {};
    function Component() {
      const [state, setState] = useState<boolean>(false);
      externalEvent = setState;
      return (
        <>
          {state && <tileLayer />}
          <vectorLayer />
          <imageLayer />
        </>
      );
    }
    const [_, map, act] = await miniRender(<Component />);
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
    await act(async () => externalEvent(true));
    expect(map.getLayers().getLength()).toBe(3);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(TileLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[2]).toBeInstanceOf(ImageLayer);
    await act(async () => externalEvent(false));
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
  });

  test('correctly attaches and removes a new layer in the end after a while', async () => {
    let externalEvent = (value: boolean) => {};
    function Component() {
      const [state, setState] = useState<boolean>(false);
      externalEvent = setState;
      return (
        <>
          <vectorLayer />
          <imageLayer />
          {state && <tileLayer />}
        </>
      );
    }
    const [_, map, act] = await miniRender(<Component />);
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
    await act(async () => externalEvent(true));
    expect(map.getLayers().getLength()).toBe(3);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
    expect(map.getLayers().getArray()[2]).toBeInstanceOf(TileLayer);
    await act(async () => externalEvent(false));
    expect(map.getLayers().getLength()).toBe(2);
    expect(map.getLayers().getArray()[0]).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().getArray()[1]).toBeInstanceOf(ImageLayer);
  });
});
