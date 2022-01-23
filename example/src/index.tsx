import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import { createTheme, CssBaseline, ThemeProvider, Button, Stack, Typography, Box } from '@mui/material';

import { RegionsExplorer } from './examples/RegionsExplorer';
import { MapComponent } from '../../src';
import { DarkCanvasLayer } from './ol-components/DarkCanvasLayer';

const theme = createTheme({
  palette: { mode: 'dark' },
});

function Intro() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ top: 0, left: 0, right: 0, bottom: 0, position: 'absolute', opacity: 0.3, zIndex: 1 }}>
        <MapComponent>
          <DarkCanvasLayer />
        </MapComponent>
      </Box>

      <Stack alignItems='center' sx={{ pt: '20vh', zIndex: 999, position: 'relative' }}>
        <Typography component='h1' textTransform='uppercase' fontSize='48px' letterSpacing={8} fontWeight='medium'>
          React-OL-Fiber
        </Typography>

        <Button sx={{ fontSize: '22px' }} component='a' href='https://github.com/giulioz/react-ol-fiber'>
          GitHub / Docs
        </Button>

        <Stack alignItems='center' gap={2}>
          <Typography component='h2' textTransform='uppercase' fontSize='24px' letterSpacing={4} sx={{ mt: 6 }}>
            Examples
          </Typography>

          <Button sx={{ fontSize: '22px' }} component={Link} to='/regions-explorer'>
            Regions Explorer
          </Button>
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Suspense fallback={null}>
      <BrowserRouter>
        <Switch>
          <Route path='/regions-explorer'>
            <RegionsExplorer />
          </Route>
          <Route>
            <Intro />
          </Route>
        </Switch>
      </BrowserRouter>
    </Suspense>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
