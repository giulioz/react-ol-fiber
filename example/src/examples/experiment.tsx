// import {
//   AppBar,
//   CssBaseline,
//   IconButton,
//   Stack,
//   Toolbar,
//   Typography,
//   createTheme,
//   ThemeProvider,
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Box,
// } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
// import { Feature } from 'ol';
// import VectorSource from 'ol/source/Vector';
// import GeoJSON from 'ol/format/GeoJSON';
// import { getCenter } from 'ol/extent';
// import 'ol/ol.css';

// import { MapComponent, useOL } from '../../src';
// import { DarkCanvasLayer } from './ol-components/DarkCanvasLayer';
// import usaCities from '../data/usa-cities.json';
// import italyRegions from '../data/italy-regions.json';
// import './style.css';

// const theme = createTheme({
//   palette: {
//     mode: 'dark',
//     primary: { main: '#0284C7' },
//     background: { paper: '#1E293B' },
//   },
// });

// function Inner() {
//   const [features, setFeatures] = useState<Feature<any>[]>([]);
//   const [styled, setStyled] = useState(false);

//   useEffect(() => {
//     async function load() {
//       const geoJson = new GeoJSON().readFeatures(italyRegions, { featureProjection: 'EPSG:3857' });
//       setFeatures(geoJson);
//     }
//     load();

//     const interval = setInterval(() => setStyled(a => !a), 500);
//     return () => clearInterval(interval);
//   }, []);

//   const { map } = useOL();
//   const [extent, setExtent] = useState([0, 0, 0, 0]);
//   useEffect(() => {
//     const view = map.getView();
//     view.fit(extent, { padding: [100, 100, 100, 100] });
//   }, [extent]);

//   return (
//     <>
//       <zoomControl />

//       <DarkCanvasLayer />

//       <vectorLayer>
//         <styleStyle>
//           {/* <circleStyle radius={10}>
//             <fillStyle args={{ color: styled ? 'blue' : 'yellow' }} />
//             <strokeStyle args={{ color: 'red' }} />
//           </circleStyle> */}
//           <strokeStyle args={{ color: 'red' }} />
//         </styleStyle>

//         <vectorSource args={{ wrapX: false }} onChange={e => setExtent(e?.target?.getExtent())}>
//           {features.map((feature, i) => (
//             <olPrimitive object={feature} key={i} attachAdd='feature' />
//           ))}
//         </vectorSource>
//       </vectorLayer>

//       <dragPanInteraction />
//       <mouseWheelZoomInteraction />
//     </>
//   );
// }

// function App2() {
//   const [drawerOpen, setDrawerOpen] = useState(true);

//   const [mousePos, setMousePos] = useState<number[]>([0, 0]);

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />

//       <Stack sx={{ height: '100%', width: '100%' }}>
//         <AppBar position='static' sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
//           <Toolbar variant='dense'>
//             <IconButton size='large' edge='start' color='inherit' aria-label='menu' sx={{ mr: 2 }} onClick={() => setDrawerOpen(a => !a)}>
//               <MenuIcon />
//             </IconButton>
//             <Typography variant='h6' component='div' sx={{ flexGrow: 1, textTransform: 'uppercase', letterSpacing: 3 }}>
//               React-OL-Fiber
//             </Typography>
//           </Toolbar>
//         </AppBar>

//         <Stack sx={{ flexGrow: 1 }} direction='row'>
//           <Drawer
//             variant='persistent'
//             anchor='left'
//             open={drawerOpen}
//             sx={{
//               width: 300,
//               flexShrink: 0,
//               '& .MuiDrawer-paper': {
//                 width: 300,
//                 boxSizing: 'border-box',
//               },
//             }}
//           >
//             <Toolbar variant='dense' sx={{ width: '250px' }} />
//             <Typography variant='h6' component='div'>
//               Layers
//             </Typography>
//             <List>
//               {['USA Cities', 'Italian Regions'].map((text, index) => (
//                 <ListItem button key={text}>
//                   <ListItemText primary={text} />
//                 </ListItem>
//               ))}
//             </List>
//           </Drawer>

//           <Box sx={{ flexGrow: 1 }}>
//             <MapComponent onPointermove={e => setMousePos(e.coordinate)}>
//               <Inner />
//             </MapComponent>
//           </Box>
//         </Stack>

//         <Stack sx={{ height: 24, px: 2 }} direction='row' justifyContent='flex-end' alignItems='center'>
//           <Typography variant='overline'>Coords: {mousePos.map(c => c.toFixed(3)).join(', ')}</Typography>
//         </Stack>
//       </Stack>
//     </ThemeProvider>
//   );
// }
