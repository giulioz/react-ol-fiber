import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Typography, Button, Stack } from '@mui/material';
import { Feature, MapBrowserEvent } from 'ol';
import { Polygon } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { MapComponent, useOL } from '../../../src';

import { SeeCodeButton } from '../components/SeeCodeButton';
import { DarkCanvasLayer } from '../ol-components/DarkCanvasLayer';
import italyRegions from '../../data/italy-regions.json';
import '../style.css';

function RegionsOutlinesLayer({
  hovered,
  onHover,
  clicked,
  onClick,
}: {
  hovered: string | null;
  onHover: (name: string) => void;
  clicked: string | null;
  onClick: (name: string) => void;
}) {
  const features = useMemo(() => new GeoJSON().readFeatures(italyRegions, { featureProjection: 'EPSG:3857' }), []);
  const sourceRef = useRef<VectorSource<any>>(null);

  const { map } = useOL();
  function centerOnFeatures(extent: number[], padding = 50) {
    const view = map.getView();
    view.fit(extent, { padding: [padding, padding, padding, padding] });
  }

  useEffect(() => {
    const feature = features.find(f => f.get('reg_name') === clicked) as Feature<Polygon> | null;
    const geometry = feature?.getGeometry();
    if (geometry) {
      centerOnFeatures(geometry.getExtent());
    } else if (sourceRef.current) {
      centerOnFeatures(sourceRef.current.getExtent());
    }
  }, [clicked]);

  return (
    <>
      <vectorLayer>
        <vectorSource ref={sourceRef}>
          {features.map((feature, i) => (
            <primitive object={feature} key={i} attachAdd='feature'>
              <styleStyle>
                <strokeStyle arg={{ color: 'red', width: 2 }} />
                <fillStyle
                  arg={{
                    color:
                      clicked === feature.get('reg_name')
                        ? 'rgba(255, 0, 0, 0.8)'
                        : hovered === feature.get('reg_name')
                        ? 'rgba(255, 0, 0, 0.5)'
                        : 'rgba(255, 0, 0, 0.1)',
                  }}
                />
              </styleStyle>
            </primitive>
          ))}
        </vectorSource>
      </vectorLayer>

      <pointerInteraction
        arg={{
          handleMoveEvent: (e: MapBrowserEvent<PointerEvent>) => onHover(map.getFeaturesAtPixel(e.pixel)[0]?.get('reg_name')),
          handleDownEvent: (e: MapBrowserEvent<PointerEvent>) => onClick(map.getFeaturesAtPixel(e.pixel)[0]?.get('reg_name')),
        }}
      />
    </>
  );
}

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#ab760c' }, secondary: { main: '#fff' } },
});

export function RegionsExplorer() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <MapComponent style={{ cursor: 'pointer' }}>
        <DarkCanvasLayer />
        <RegionsOutlinesLayer hovered={hovered} onHover={setHovered} clicked={clicked} onClick={setClicked} />
      </MapComponent>

      {clicked && (
        <Stack sx={{ position: 'absolute', top: 0, left: 0, right: 0, pt: 6, pointerEvents: 'none' }} alignItems='center'>
          <Button variant='contained' size='large' sx={{ fontSize: '24px', pointerEvents: 'all' }} onClick={() => setClicked(null)}>
            Back to global view
          </Button>
        </Stack>
      )}

      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <Typography textTransform='uppercase' fontSize='48px' letterSpacing={4} sx={{ mb: 8 }} textAlign='center' fontWeight='medium'>
          {hovered}
        </Typography>
      </Box>

      <SeeCodeButton url='https://github.com/giulioz/react-ol-fiber/blob/main/example/src/examples/RegionsExplorer.tsx' />
    </ThemeProvider>
  );
}
