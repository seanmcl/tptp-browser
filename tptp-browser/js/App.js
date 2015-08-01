'use strict';

import React from 'react';
import Router from 'react-router';
import { Route, RouteHandler, Redirect, HashLocation, HistoryLocation } from 'react-router';
import ProblemBrowser from './components/ProblemBrowser';
import ProblemStats from './components/ProblemStats';

require('bootstrap-webpack');
require('../css/default.css');

class App extends React.Component {
  render() {
    return (
      <RouteHandler />
    );
  }
}

const routes =
  <Route>
    <Route handler={App}>
      <Route path='browser' handler={ProblemBrowser}/>
      <Route path='stats' handler={ProblemStats}/>
      <Route path='browser/:problemSet' handler={ProblemBrowser}/>
      <Route path='browser/:problemSet/:type' handler={ProblemBrowser}/>
      <Route path='browser/:problemSet/:type/:name' handler={ProblemBrowser}/>
    </Route>
  </Route>;

Router.run(routes, HashLocation, (Handler) => {
  React.render(<Handler/>, document.getElementById('App'));
});
