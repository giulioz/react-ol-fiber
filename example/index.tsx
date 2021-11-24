import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';

import { MapComponent } from '../src';
import usaCities from './data/usa-cities.json';

function App() {
  const [features, setFeatures] = useState<Feature<any>[]>([]);
  const [styled, setStyled] = useState(false);

  useEffect(() => {
    async function load() {
      const geoJson = new GeoJSON().readFeatures(usaCities, { featureProjection: 'EPSG:3857' });
      setFeatures(geoJson);
    }
    load();

    const interval = setInterval(() => setStyled(a => !a), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapComponent ref={m => ((window as any).m = m)}>
      <tileLayer>
        <oSMSource />
      </tileLayer>

      <vectorLayer>
        <styleStyle>
          <circleStyle radius={10}>
            <fillStyle args={{ color: styled ? 'blue' : 'yellow' }} />
            <strokeStyle args={{ color: 'red' }} />
          </circleStyle>
        </styleStyle>

        <vectorSource>
          {features.map((feature, i) => (
            <primitive object={feature} key={i} attachAdd='feature' />
          ))}
        </vectorSource>
      </vectorLayer>

      <dragPanInteraction />
      <mouseWheelZoomInteraction />
    </MapComponent>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
