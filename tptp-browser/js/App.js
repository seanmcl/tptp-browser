'use strict';

import React from 'react';
import Router from 'react-router';
import { DefaultRoute, HashLocation, HistoryLocation, Redirect, Route, RouteHandler } from 'react-router';
import ProblemBrowser from './components/ProblemBrowser';

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
  <Route path='/' handler={App}>
    <Route handler={App}>
      <Route path='browser' handler={ProblemBrowser}/>
      <Route path='browser/:problemSet' handler={ProblemBrowser}/>
      <Route path='browser/:problemSet/:type' handler={ProblemBrowser}/>
      <Route path='browser/:problemSet/:type/:name' handler={ProblemBrowser}/>
    </Route>
  </Route>;

Router.run(routes, HashLocation, (Handler) => {
  React.render(<Handler/>, document.getElementById('App'));
});
