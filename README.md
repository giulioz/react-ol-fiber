# react-ol-fiber

[![Version](https://img.shields.io/npm/v/react-ol-fiber)](https://npmjs.com/package/react-ol-fiber)
[![Downloads](https://img.shields.io/npm/dt/react-ol-fiber.svg)](https://npmjs.com/package/react-ol-fiber)
[![Test](https://github.com/giulioz/react-ol-fiber/actions/workflows/test.yml/badge.svg)](https://github.com/giulioz/react-ol-fiber/actions/workflows/test.yml)

react-ol-fiber is a <a href="https://reactjs.org/docs/codebase-overview.html#renderers">React renderer</a> for <a href="https://openlayers.org/">OpenLayers</a>.

Build your maps declaratively with re-usable, self-contained components that react to state, are readily interactive and can participate in React's ecosystem.

```bash
npm install ol react-ol-fiber
```

Being a renderer and not a wrapper it's not tied to a specific version of OpenLayers, and allows easy extensibility.

## Quick Start Code

[![Edit react-ol-fiber-qs](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-ol-fiber-qs-32s5j?fontsize=14&hidenavigation=1&theme=dark&view=preview)

<img src="https://i.imgur.com/k5AerZY.gif" />

```tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { MapComponent } from 'react-ol-fiber';
import 'ol/ol.css';

function Shapes() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setActive(a => !a), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <vectorLayer>
      <styleStyle>
        <fillStyle arg={{ color: active ? 'blue' : 'yellow' }} />
        <strokeStyle arg={{ color: 'red' }} />
      </styleStyle>

      <vectorSource>
        {new Array(32 * 32).fill(0).map((_, i) => (
          <feature>
            <circleGeometry args={[[(i % 32) * 100000, Math.floor(i / 32) * 100000], 30000]} />
          </feature>
        ))}
      </vectorSource>
    </vectorLayer>
  );
}

function App() {
  return (
    <MapComponent>
      <tileLayer>
        <oSMSource />
      </tileLayer>

      <Shapes />

      <dragPanInteraction />
      <mouseWheelZoomInteraction />
    </MapComponent>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```

## Docs

### The MapComponent component

The most important component in react-ol-fiber is `<MapComponent />` it instantiate an OpenLayer `Map` object and mounts it in a full-width and full-height div. As children you can provide OpenLayer elements that can be mounted inside the map, such as layers, controls and interactions.

```tsx
function App() {
  return (
    <MapComponent
      view={{
        center: fromLonLat([37.41, 8.82]),
        zoom: 4,
      }}
    >
      <tileLayer>
        <oSMSource />
      </tileLayer>
    </MapComponent>
  );
}
```

### Using OpenLayers classes

To create instances of OpenLayers classes in react-ol-fiber you can use JSX primitives. As component name, use the original class name with the first letter in lower case, followed by its category.

To provide arguments to the class constructor use the `args` prop, or `arg` if the constructor has a single parameter. To attach the children to the parent you can use the `attach` and `attachAdd` props (even though they are inferred automatically whenever possible by the reconciler).

Some examples:

```tsx
function Component() {
  return (
    <>
      <feature /> {/* ol/Feature */}
      <tileLayer /> {/* ol/layers/Tile */}
      <vectorLayer /> {/* ol/layers/Vector */}
      <circleGeometry args={[[0, 0], 10]} /> {/* ol/geom/Circle */}
      <pointGeometry arg={[0, 0]} /> {/* ol/geom/Point */}
      <dragPanInteraction /> {/* ol/geom/Point */}
      <styleStyle /> {/* ol/style/Style */}
      <strokeStyle arg={{ color: 'red', width: 2 }} /> {/* ol/style/Stroke */}
    </>
  );
}
```

### Props

The props are applied using the setters found in the target object. The reconciler is optimized to call only the setters of the modified values.

```tsx
function Component() {
  // This will call setOpacity in the VectorLayer
  return <vectorLayer opacity={0.75} />;
}
```

### Event handlers

All the events described in the OpenLayers documentation are capitalized and prefixed with "on".

```tsx
function Component() {
  // This will set the 'select' event
  return <selectInteraction onSelect={e => console.log(e)} />;

  // This will set the 'change' event
  return <vectorSource onChange={e => console.log(e)} />;

  // It also works on the map component!
  return <MapComponent onPointermove={e => console.log(e.coordinate)} />;
}
```

### Hooks

Whenever you need to access the underlying OpenLayers map instance, you can use the `useOL()` hook. Remember that this can work only inside a component that is child of a MapComponent. :warning:

```tsx
function Inner() {
  const { map } = useOL();
  function centerOnFeatures(extent: number[]) {
    const view = map.getView();
    view.fit(extent);
  }

  return (
    <vectorLayer>
      <vectorSource onChange={e => centerOnFeatures(e.target.getExtent())}>
        <feature>
          <circleGeometry args={[[0, 0], 30000]} />
        </feature>
      </vectorSource>
    </vectorLayer>
  );
}

function Parent() {
  // WARNING: you can't use useOL() here
  return (
    <MapComponent>
      <Inner />
    </MapComponent>
  );
}
```

### Spring Animation

Provisional [react-spring](https://react-spring.io/) support is available! You can use the spring api to animate your maps, using the `a.` components. See [this example](https://github.com/giulioz/react-ol-fiber/blob/main/example/src/examples/Spring.tsx) to see how.

### Using primitives

If you want to use your own already instanced objects, you can use the primitive wrapper and set a custom attach:

```tsx
function Component() {
  const features = myLoadFeatures();
  return (
    <vectorSource>
      {features.map((feature, i) => (
        <primitive object={feature} key={i} attachAdd='feature' />
      ))}
    </vectorSource>
  );
}
```

:warning: Using the `<primitive />` instrinsic the props will not be checked. To have a generic primitive component, based on the `object` prop type, use the `<OLPrimitive />` wrapper instead.

### Extending the catalogue

To extend the available components reachable by react-ol-fiber, you can use the `extend()` command. You can even implement your own props application logic using setters!

```tsx
import BaseLayer from 'ol/layer/Base';
class MyLayer extends BaseLayer {
  constructor(args: { ctorArg: boolean }) {
    super({});
  }

  setMyNumber(value: number) {
    console.log(value);
  }
}

import { extend, MapComponent, TypeOLCustomClass } from 'react-ol-fiber';
extend({ MyLayer: MyLayer as any });
declare global {
  namespace JSX {
    interface IntrinsicElements {
      myLayer: TypeOLCustomClass<typeof MyLayer>;
    }
  }
}

function Test() {
  return (
    <MapComponent>
      <myLayer arg={{ ctorArg: false }} myNumber={42} />
    </MapComponent>
  );
}
```

## FAQ

### I'm not seeing my map and the entire page is blank

You need to add make your parent DOM elements full-height:

```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
}
```

## Credits

This library was strongly inspired by <a href="https://github.com/pmndrs/react-three-fiber">react-three-fiber</a> and the technical details given by this amazing <a href="https://codyb.co/articles/a-technical-breakdown-of-react-three-fiber">article</a> by Cody Bennet.
