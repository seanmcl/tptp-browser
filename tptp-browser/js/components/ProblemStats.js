'use strict';

import $ from 'jquery';
import Highlight from 'highlight.js';
import Marked from 'marked';
import R from 'ramda';
import React from 'react';
import Store from '../stores/ProblemBrowserStore';
import Util from '../Util';
import { Button, ButtonGroup, ButtonToolbar, Col, DropdownButton, Grid, Input,
         MenuItem, Nav, NavItem, Panel, Row } from 'react-bootstrap';
import { ButtonLink, MenuItemLink, NavItemLink } from 'react-router-bootstrap';
import { Column, Table} from 'fixed-data-table';
import { Link } from 'react-router';
import { makeFileRoute } from '../stores/ProblemBrowserStore';
import { PROBLEM_MAX_SIZE,
         getProblemBrowserIndex,
         getProblemBrowserFile } from '../Util';
import { PropTypes as Types } from 'react';
import Select from 'react-select';
import keymirror from 'keymirror';

require('../../node_modules/highlight.js/styles/idea.css');
require('../../node_modules/fixed-data-table/dist/fixed-data-table.css');
require('../../node_modules/react-select/dist/default.css');
require('../../css/default.css');
require('../../css/ProblemBrowser.css');

const MAX_PROBLEMS = 30;
const SELECT_DELIMITER = '-';
const getStateFromStore = () => Store.get();
const buttonToolbarStyle = {marginRight: 20};
