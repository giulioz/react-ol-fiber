import React, { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme, Typography, Button, Stack } from '@mui/material';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { useSpring, config, useSpringRef, useTransition, useChain } from '@react-spring/core';
import { animated } from '@react-spring/web';
import { MapComponent, a } from '../../../src';

import { SeeCodeButton } from '../components/SeeCodeButton';
import { DarkCanvasLayer } from '../ol-components/DarkCanvasLayer';
import usaCities from '../../data/usa-cities.json';
import '../style.css';

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#fff' }, secondary: { main: '#fff' } },
});

export function Spring() {
  const cities = useMemo(() => new GeoJSON().readFeatures(usaCities, { featureProjection: 'EPSG:3857' }) as Feature<Point>[], []);

  const [currentCity, setCurrentCity] = useState(Math.floor(Math.random() * cities.length));
  const city = cities[currentCity];
  const viewSpringRef = useSpringRef();
  const viewSpring = useSpring({ pos: city.getGeometry()?.getCoordinates() || [0, 0], zoom: 7, config: config.stiff, ref: viewSpringRef });

  const bulletTransitionRef = useSpringRef();
  const bulletTransition = useTransition(currentCity, {
    from: { opacity: 0, radius: 0 },
    enter: { opacity: 0.8, radius: 20000 },
    leave: { opacity: 0, radius: 0 },
    exitBeforeEnter: true,
    config: { duration: 500 },
    ref: bulletTransitionRef,
  });

  useChain([bulletTransitionRef, viewSpringRef], [0, 0.7]);

  const [overlayDiv, setOverlayDiv] = useState<HTMLDivElement | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <MapComponent style={{ cursor: 'pointer' }}>
        <DarkCanvasLayer />
        <a.olView
          arg={{
            center: [0, 0],
            zoom: 4,
          }}
          center={viewSpring.pos}
          zoom={viewSpring.zoom}
        />

        {bulletTransition(({ opacity, radius }, i) => {
          const cityCoords = cities[i].getGeometry()?.getCoordinates() || [0, 0];
          return (
            <>
              <a.vectorLayer opacity={opacity}>
                <styleStyle>
                  <fillStyle arg={{ color: ' red' }} />
                </styleStyle>

                <vectorSource>
                  <feature>
                    <a.circleGeometry args={[[0, 0], 20000]} center={cityCoords} radius={radius} />
                  </feature>
                </vectorSource>
              </a.vectorLayer>

              {overlayDiv && <overlay arg={{ element: overlayDiv }} position={cityCoords} attachAdd='overlay' positioning='top-center' offset={[0, 12]} />}
            </>
          );
        })}
      </MapComponent>

      <div ref={setOverlayDiv}>
        {bulletTransition(({ opacity }, i) => (
          <animated.div style={{ opacity }}>
            <Typography textAlign='center' fontWeight='medium' letterSpacing={2} fontSize='24px'>
              {cities[i].get('NAME')}
            </Typography>
            <Typography textAlign='center' fontWeight='bold' fontSize='14px'>
              POP. {cities[i].get('POPULATION')}
            </Typography>
          </animated.div>
        ))}
      </div>

      <Stack sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, pb: 6, pointerEvents: 'none' }} alignItems='center'>
        <Button
          variant='contained'
          size='large'
          sx={{ fontSize: '20px', pointerEvents: 'all' }}
          onClick={() => setCurrentCity(Math.floor(Math.random() * cities.length))}
        >
          Go to random city
        </Button>
      </Stack>

      <SeeCodeButton url='https://github.com/giulioz/react-ol-fiber/blob/main/example/src/examples/Spring.tsx' />
    </ThemeProvider>
  );
}
