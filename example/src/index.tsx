import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { RegionsExplorer } from './examples/RegionsExplorer';
import { Spring } from './examples/Spring';
import { Intro } from './examples/Intro';

function App() {
  return (
    <Suspense fallback={null}>
      <BrowserRouter>
        <Switch>
          <Route path='/regions-explorer'>
            <RegionsExplorer />
          </Route>
          <Route path='/spring'>
            <Spring />
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
