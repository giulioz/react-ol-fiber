# react-ol-fiber

[![Version](https://img.shields.io/npm/v/react-ol-fiber)](https://npmjs.com/package/react-ol-fiber)
[![Downloads](https://img.shields.io/npm/dt/react-ol-fiber.svg)](https://npmjs.com/package/react-ol-fiber)

react-ol-fiber is a <a href="https://reactjs.org/docs/codebase-overview.html#renderers">React renderer</a> for <a href="https://openlayers.org/">OpenLayers</a>.

Build your maps declaratively with re-usable, self-contained components that react to state, are readily interactive and can participate in React's ecosystem.

```bash
npm install ol react-ol-fiber
```

Being a renderer and not a wrapper it's not tied to a specific version of OpenLayers, and allows easy extensibility.

## Quick Start Code

[![Edit react-ol-fiber-qs](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-ol-fiber-qs-32s5j?fontsize=14&hidenavigation=1&theme=dark&view=preview)

```tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { MapComponent } from "react-ol-fiber";
import "ol/ol.css";

function Shapes() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setActive((a) => !a), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <vectorLayer>
      <styleStyle>
        <fillStyle args={{ color: active ? "blue" : "yellow" }} />
        <strokeStyle args={{ color: "red" }} />
      </styleStyle>

      <vectorSource>
        {new Array(100).fill(0).map((_, i) => (
          <feature>
            <circleGeometry args={[[i * 100000, 0], 30000]} />
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

ReactDOM.render(<App />, document.getElementById("root"));
```

## Credits

This library was strongly inspired by <a href="https://github.com/pmndrs/react-three-fiber">react-three-fiber</a> and the technical details given by this amazing <a href="https://codyb.co/articles/a-technical-breakdown-of-react-three-fiber">article</a> by Cody Bennet.
