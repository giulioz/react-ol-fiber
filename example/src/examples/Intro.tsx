import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createTheme, CssBaseline, ThemeProvider, Button, Stack, Typography, Box } from '@mui/material';

import { MapComponent, useOL } from '../../../src';
import { DarkCanvasLayer } from '../ol-components/DarkCanvasLayer';
import { SeeCodeButton } from '../components/SeeCodeButton';

const theme = createTheme({
  palette: { mode: 'dark', secondary: { main: '#fff' } },
});

function MapRotator() {
  const { map } = useOL();
  useEffect(() => {
    function loop() {
      map.getView().adjustCenter([5000, 0]);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }, []);

  return null;
}

export function Intro() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ top: 0, left: 0, right: 0, bottom: 0, position: 'absolute', opacity: 0.4, zIndex: 1 }}>
        <MapComponent view={{ center: [0, 3500000] }}>
          <DarkCanvasLayer />
          <MapRotator />
          <dragPanInteraction />
        </MapComponent>
      </Box>

      <Stack alignItems='center' sx={{ pt: '20vh', zIndex: 999, position: 'relative', pointerEvents: 'none' }}>
        <Typography component='h1' textTransform='uppercase' fontSize='48px' letterSpacing={8} fontWeight='medium' textAlign='center'>
          React-OL-Fiber
        </Typography>
        <Button sx={{ fontSize: '22px', pointerEvents: 'auto' }} component='a' href='https://github.com/giulioz/react-ol-fiber'>
          GitHub / Docs
        </Button>

        <Stack alignItems='center' gap={2}>
          <Typography component='h2' textTransform='uppercase' fontSize='24px' letterSpacing={4} sx={{ mt: 6 }} textAlign='center'>
            Examples
          </Typography>
          <Button sx={{ fontSize: '22px', pointerEvents: 'auto' }} component={Link} to='/regions-explorer'>
            Regions Explorer
          </Button>
        </Stack>
      </Stack>

      <SeeCodeButton home url='https://github.com/giulioz/react-ol-fiber/blob/main/example/src/examples/Intro.tsx' />
    </ThemeProvider>
  );
}
