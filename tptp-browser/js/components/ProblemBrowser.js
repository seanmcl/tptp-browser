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

/**
 *
 */
const Style = (() => {
  const sidebarWidth = 160;
  return {
    grid: {
      marginTop: 20
    },
    sidebarWidth: sidebarWidth,
    sidebarButton: {
      float: 'left',
      marginRight: 20,
    }
  }
})();

const QueryKeys = keymirror({
  domains: null,
  equality: null,
  filter: null,
  forms: null,
  minDifficulty: null,
  maxDifficulty: null,
  order: null,
  status: null,
});

/**
 *
 */
const Router = router => (() => {
  const _route = router.getCurrentPathname();
  const _params = router.getCurrentParams();
  const _query = router.getCurrentQuery();
  const extendAndTransition = (key, value) => {
    const v = value.length > 0 ? value : undefined;
    const newQuery = R.merge(_query, {[key]: v});
    router.transitionTo(_route, _params, newQuery);
  };
  const hasQueryParam = key => key in _query;
  const getQueryParam = key => _query[key];
  const getQueryParamList = key => {
    const v = getQueryParam(key);
    return v ? v.split(SELECT_DELIMITER) : [];
  };
  const queryObject = () => _query;
  return {
    extendAndTransition,
    getQueryParam,
    getQueryParamList,
    queryObject,
    hasQueryParam
  };
})();


/**
 *
 */
export default class ProblemBrowserContainer extends React.Component {
  constructor() {
    super();
    this.state = getStateFromStore();
    this._onChange = this._onChange.bind(this);
    this._loadFile = this._loadFile.bind(this);
  }

  componentDidMount() {
    if (this.state.index.isEmpty()) getProblemBrowserIndex();
    this._loadFile(this.props);
    Store.addChangeListener(this._onChange);
  }

  _loadFile(problemSet, type, name) {
    const { index, files } = this.state;
    if (!problemSet || !type || !name || index.isEmpty()) return;
    const pset = index.getProblemSet(problemSet);
    const problem = pset.problemOrAxiom(type, name);
    const filename = problem.file();
    if (filename && !(filename in files) && problem.size() < PROBLEM_MAX_SIZE) {
      getProblemBrowserFile(filename);
    }
  }

  componentWillUpdate() {
    const { problemSet, type, name } = this.props.params;
    this._loadFile(problemSet, type, name);
  }

  componentWillReceiveProps(props) {
    const { problemSet, type, name } = props.params;
    this._loadFile(problemSet, type, name);
  }

  componentWillUnmount() {
    Store.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState(getStateFromStore());
  }

  render() {
    let { problemSet, type, name } = this.props.params;
    const { index, files } = this.state;

    const problemSetNames = index.problemSetNames();
    const defaultProblemSet = () => {
      if (problemSetNames.length > 0) return problemSetNames[0];
      return null;
    };
    problemSet = problemSet || defaultProblemSet();

    const router = Router(this.context.router);
    const selectedDomains = router.getQueryParamList(QueryKeys.domains);
    const selectedStatus = router.getQueryParamList(QueryKeys.status);
    const selectedForms = router.getQueryParamList(QueryKeys.forms);
    const currentFilter = router.getQueryParam(QueryKeys.filter);
    const equality = router.getQueryParam(QueryKeys.equality);
    const order = router.getQueryParam(QueryKeys.order);
    const filterRegexp = new RegExp(currentFilter, 'i');

    let minDifficulty = router.getQueryParam(QueryKeys.minDifficulty);
    minDifficulty = minDifficulty ? minDifficulty : '0.0';
    let maxDifficulty = router.getQueryParam(QueryKeys.maxDifficulty);
    maxDifficulty = maxDifficulty ? maxDifficulty : '1.0';
    minDifficulty = parseFloat(minDifficulty);
    maxDifficulty = parseFloat(maxDifficulty);
    const epsilon = 0.0001;
    minDifficulty = isNaN(minDifficulty) ? 0.0 : minDifficulty - epsilon;
    maxDifficulty = isNaN(maxDifficulty) ? 1.0 : maxDifficulty + epsilon;

    const problemFilter = p =>
      p.name().match(filterRegexp)
      && (selectedDomains.length === 0
          || R.any(c => p.name().match(c))(selectedDomains))
      && (problemSet != 'TPTP'
          || selectedForms.length === 0
          || !p.type
          || R.contains(p.type())(selectedForms))
      && (problemSet != 'TPTP'
          || selectedStatus.length === 0
          || !p.status
          || R.contains(p.status())(selectedStatus))
      && (problemSet != 'TPTP'
          || !p.difficulty
          || !$.isNumeric(p.difficulty())
          || (minDifficulty <= p.difficulty() && p.difficulty() <= maxDifficulty))
      && (!equality
          || !p.hasEquality
          || (equality === 'Some' && p.hasEquality())
          || (equality === 'None' && !p.hasEquality()))
      && (!order
          || !p.numPropSyms
          || !p.numPredSyms
          || (order === 'Propositional' && p.numPropSyms() === p.numPredSyms())
          || (order === 'FirstOrder' && p.numPropSyms() !== p.numPredSyms()));

    const pset = index.getProblemSet(problemSet);
    const domains = pset ? pset.domains() : [];
    const problems = pset ? pset.problems().filter(problemFilter) : [];
    const axioms = pset ? pset.axioms().filter(problemFilter) : [];

    type = type || 'problems';

    const defaultName = () => {
      if (problems && type === 'problems' && problems.length > 0) return problems[0].name();
      if (axioms && type === 'axioms' && axioms.length > 0) return axioms[0].name();
      return null;
    };

    name = name || defaultName();
    this._loadFile(problemSet, type, name);
    const problem = pset ? pset.problemOrAxiom(type, name) : null;
    const file = problem ? problem.file() : null;
    const body = file ? files[file] : null;
    return (
      <ProblemBrowser problems={problems}
                      axioms={axioms}
                      type={type}
                      problem={problem}
                      problemSet={problemSet}
                      problemSetNames={problemSetNames}
                      problemBody={body}
                      domains={domains} />
    );
  }
}

ProblemBrowserContainer.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class ProblemBrowser extends React.Component {
  render() {
    const { axioms, problemBody, problem, problems, problemSet,
            problemSetNames, type, domains } = this.props;
    const display = type === 'axioms' ? axioms : problems;
    const isTptp = problemSet == 'TPTP';
    const hasAxioms = axioms && axioms.length !== 0;
    return (
      <Grid style={Style.grid}>
        <Row>
          <Col md={12}>
            <ButtonToolbar>
              <span style={Style.sidebarButton}>
                <ProblemSetChooser problemSet={problemSet}
                                   problemSetNames={problemSetNames} />
              </span>

              <span style={R.merge({display: hasAxioms ? null : 'none'}, Style.sidebarButton)}>
                <TypeChooser type={type}
                             problemSet={problemSet} />
              </span>

              <span style={Style.sidebarButton}>
                <DomainsChooser domains={domains} />
              </span>

              <span style={R.merge({display: isTptp ? null : 'none'}, Style.sidebarButton)}>
                <FormsChooser />
              </span>

              <span style={R.merge({display: isTptp ? null : 'none'}, Style.sidebarButton)}>
                  <StatusChooser />
              </span>

              <span style={R.merge({display: isTptp ? null : 'none'}, Style.sidebarButton)}>
                <DifficultyChooser />
              </span>

              <span style={R.merge({display: isTptp ? null : 'none'}, Style.sidebarButton)}>
                <EqualityChooser />
              </span>

              <span style={R.merge({display: isTptp ? null : 'none'}, Style.sidebarButton)}>
                <OrderChooser />
              </span>

              <span id='problem-filter'
                    className='btn-group'
                    style={R.merge({width: 100}, Style.sidebarButton)}>
                <ProblemFilter />
              </span>
            </ButtonToolbar>
          </Col>
        </Row>

        <Row style={{marginTop: 20}}>
          <Col md={2}>
            <div style={Style.sidebarButton}>
              <ProblemList problems={display}
                           type={type} />
            </div>
          </Col>

          <Col md={10}>
            <ProblemDisplay problem={problem}
                            problemSet={problemSet}
                            body={problemBody} />
          </Col>
        </Row>

      </Grid>
    );
  }
}

ProblemBrowser.propTypes = {
  axioms: Types.arrayOf(Types.object),
  difficulty: Types.object,
  problemBody: Types.string,
  problem: Types.object,
  problems: Types.arrayOf(Types.object),
  problemSet: Types.string,
  problemSetNames: Types.arrayOf(Types.string),
  selectedStatus: Types.arrayOf(Types.string),
  selectedForms: Types.arrayOf(Types.string),
  type: Types.string,
};


/**
 *
 */
class ProblemSetChooser extends React.Component {
  render() {
    const { problemSet, problemSetNames } = this.props;
    return (
        <DropdownButton title={problemSet}>
          {problemSetNames.map(s =>
            <MenuItemLink key={s} to={`/browser/${s}`}>
              {s}
            </MenuItemLink>)}
        </DropdownButton>
    );
  }
}

ProblemSetChooser.propTypes = {
  problemSet: Types.string.isRequired,
  problemSetNames: Types.arrayOf(Types.string).isRequired,
};


/**
 *
 */
class TypeChooser extends React.Component {
  render() {
    const { problemSet, type } = this.props;
    const types = ['problems', 'axioms'];
    return (
      <DropdownButton title={type.capitalize()}>
        {types.map(t =>
            <MenuItemLink key={t}
                          active={type === t}
                          to={`/browser/${problemSet}/${t}`}>
              {t.capitalize()}
            </MenuItemLink>
        )}
      </DropdownButton>
    );
  }
}

TypeChooser.propTypes = {
  type: Types.string.isRequired,
  problemSet: Types.string.isRequired
};



/**
 *
 */
class DomainsChooser extends React.Component {
  render() {
    const { domains } = this.props;
    const router = Router(this.context.router);
    const selectedDomains = router.getQueryParamList(QueryKeys.domains);
    const onChange = (_, ds) => {
      router.extendAndTransition(QueryKeys.domains, ds.map(d => d.value).sort().join(SELECT_DELIMITER));
    };
    const options = domains.map(c => ({value: c, label: c}));
    return (
      <DropdownButton className='dropdown-select' title='Domains'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedDomains}
                delimiter={SELECT_DELIMITER}
                multi={true} />
      </DropdownButton>
    );
  }
}

DomainsChooser.propTypes = {
  domains: Types.arrayOf(Types.string).isRequired,
};

DomainsChooser.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class FormsChooser extends React.Component {
  render() {
    const router = Router(this.context.router);
    const selectedForms = router.getQueryParamList(QueryKeys.forms);
    const forms = ['CNF', 'FOF', 'TFA', 'TFF', 'THF'];
    const options = forms.map(t => ({value: t, label: t}));
    const onChange = (_, forms) => router.extendAndTransition(QueryKeys.forms,
      forms.map(t => t.value).sort().join(SELECT_DELIMITER));
    return (
      <DropdownButton className='dropdown-select' title='Forms'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedForms}
                multi={true} />
      </DropdownButton>
    );
  }
}

FormsChooser.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class StatusChooser extends React.Component {
  render() {
    const router = Router(this.context.router);
    const selectedStatus = router.getQueryParamList(QueryKeys.status);
    const options = [
      {value: 'UNS', label: 'Unsatisfiable'},
      {value: 'SAT', label: 'Satisfiable'},
      {value: 'THM', label: 'Theorem'},
      {value: 'UNK', label: 'Unknown'},
      {value: 'OPN', label: 'Open'},
      {value: 'CSA', label: 'CounterSatisfiable'}
    ];
    const onChange = (_, status) => router.extendAndTransition(QueryKeys.status,
      status.map(s => s.value).sort().join(SELECT_DELIMITER));
    return (
      <DropdownButton className='dropdown-select' title='Status'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedStatus}
                multi={true} />
      </DropdownButton>
    );
  }
}

StatusChooser.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class DifficultyChooser extends React.Component {
  render() {
    const router = Router(this.context.router);
    const minDifficulty = router.getQueryParam(QueryKeys.minDifficulty) || '0.0';
    const maxDifficulty = router.getQueryParam(QueryKeys.maxDifficulty) || '1.0';
    const onChangeMin = () => router.extendAndTransition(QueryKeys.minDifficulty, this.refs.min.getValue());
    const onChangeMax = () => router.extendAndTransition(QueryKeys.maxDifficulty, this.refs.max.getValue());
    return (
      <DropdownButton id='difficulty' className='dropdown-select' title='Difficulty'>
        <Input type='text'
               addonBefore='Min'
               value={minDifficulty}
               ref='min'
               onChange={onChangeMin}/>
        <Input type='text'
               addonBefore='Max'
               value={maxDifficulty}
               ref='max'
               onChange={onChangeMax}/>
      </DropdownButton>
    );
  }
}

DifficultyChooser.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class EqualityChooser extends React.Component {
  render() {
    const router = Router(this.context.router);
    const selectedEquality = router.getQueryParam(QueryKeys.equality);
    const options = [
      {value: 'Some', label: 'Some'},
      {value: 'None', label: 'None'},
    ];
    const onChange = s => router.extendAndTransition(QueryKeys.equality, s);
    return (
      <DropdownButton className='dropdown-select' title='Equality'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedEquality}
                multi={false} />
      </DropdownButton>
    );
  }
}

EqualityChooser.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class OrderChooser extends React.Component {
  render() {
    const router = Router(this.context.router);
    const selectedOrder = router.getQueryParam(QueryKeys.order);
    const options = [
      {value: 'Propositional', label: 'Propositional'},
      {value: 'FirstOrder', label: 'First Order'},
    ];
    const onChange = s => router.extendAndTransition(QueryKeys.order, s);
    return (
      <DropdownButton className='dropdown-select' title='Order'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedOrder}
                multi={false} />
      </DropdownButton>
    );
  }
}

OrderChooser.contextTypes = {
  router: Types.func.isRequired
};

/**
 *
 */
class ProblemFilter extends React.Component {
  render() {
    const router = Router(this.context.router);
    const contents = router.getQueryParam(QueryKeys.filter) || '';
    const onChange = () => router.extendAndTransition(QueryKeys.filter, this.refs.input.getValue());
    return (
      <Input type='text'
             value={contents}
             placeholder='Filter'
             ref='input'
             onChange={onChange} />
    );
  }
}

ProblemFilter.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class ProblemList extends React.Component {
  render() {
    const { problems, type } = this.props;
    const router = Router(this.context.router);
    const query = router.queryObject();
    if (!problems) return null;
    const rowGetter = n => [problems[n]];
    const count = problems.length;
    //noinspection JSUnusedLocalSymbols
    const cellRenderer = (cellData, cellDataKey, rowData, rowIndex, columnData, width) => {
      return <Link to={cellData.route()} query={query}>{cellData.name()}</Link>;
    };
    return (
      <Table rowHeight={30}
             rowGetter={rowGetter}
             rowsCount={count}
             width={Style.sidebarWidth}
             maxHeight={500}
             headerHeight={30}>
        <Column label={`${type.capitalize()}: ${count}`}
                cellRenderer={cellRenderer}
                align='left'
                width={Style.sidebarWidth}
                dataKey={0}/>
      </Table>
    );
  }
}

ProblemList.propTypes = {
  type: Types.string,
  problems: Types.arrayOf(Types.object),
};

ProblemList.contextTypes = {
  router: Types.func.isRequired
};


/**
 *
 */
class ProblemDisplay extends React.Component {
  constructor() {
    super();
    this._highlightCode = this._highlightCode.bind(this);
  }

  componentDidMount() {
    this._highlightCode();
  }

  componentDidUpdate() {
    this._highlightCode();
  }

  _highlightCode() {
    const { problemSet } = this.props;
    const domNode = React.findDOMNode(this);
    const nodes = domNode ? domNode.querySelectorAll('pre code') : [];
    const unquote = s => s.replace(/[\'\"]/g, '');
    const makeLink = s => {
      const name = unquote(s).replace(/Axioms\//, '').replace(/\.ax/, '');
      const route = makeFileRoute(problemSet, 'axioms', name);
      //noinspection HtmlUnknownAnchorTarget
      return `<a href='/#${route}'>${s}</a>`
    };
    for (let i = 0; i < nodes.length; i = i + 1) {
      const node = nodes[i];
      Highlight.highlightBlock(node);
      const inodes1 = node.querySelectorAll('.hljs-string');
      const inodes = R.filter(n => n.innerHTML.startsWith('\'Axioms'))(inodes1);
      for (let j = 0; j < inodes.length; j = j + 1) {
        const inode = inodes[j];
        inode.innerHTML = makeLink(inode.innerHTML);
      }
    }
  }

  render() {
    const { problem, body } = this.props;
    if (!problem) return null;
    if (problem.size() > PROBLEM_MAX_SIZE) {
      return (
        <Panel header='Error' bsStyle='danger'>
          Problem is too large to display. ({problem.size()} bytes)
        </Panel>
      );
    }
    if (!body) return <h4>Loading...</h4>;
    return (
      <pre>
        <code className='prolog'>
          {body}
          </code>
      </pre>
    );
  }
}

ProblemDisplay.propTypes = {
  problem: Types.object,
  problemSet: Types.string,
  body: Types.string
};

ProblemDisplay.contextTypes = {
  router: Types.func.isRequired
};
