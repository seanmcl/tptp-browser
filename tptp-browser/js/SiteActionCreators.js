'use strict';

import Dispatcher from './SiteDispatcher';
import { ActionTypes } from './SiteConstants';


module.exports = {

  quotesReceiveQuotes: quotes => {
    Dispatcher.dispatch({
      type: ActionTypes.QUOTES_RECEIVE_QUOTES,
      quotes
    })
  },

  thesisReceivePages: pages => Dispatcher.dispatch({
    type: ActionTypes.THESIS_RECEIVE_PAGES,
    pages
  }),

  blogReceiveIndex: index => Dispatcher.dispatch({
    type: ActionTypes.BLOG_RECEIVE_INDEX,
    index
  }),

  blogReceiveEntry: basename => entry => Dispatcher.dispatch({
    type: ActionTypes.BLOG_RECEIVE_ENTRY,
    basename,
    entry
  }),

  problemBrowserReceiveIndex: index => Dispatcher.dispatch({
    type: ActionTypes.PROBLEM_BROWSER_RECEIVE_INDEX,
    index,
  }),

  problemBrowserReceiveFile: name => file => Dispatcher.dispatch({
    type: ActionTypes.PROBLEM_BROWSER_RECEIVE_FILE,
    name,
    file,
  }),

};
