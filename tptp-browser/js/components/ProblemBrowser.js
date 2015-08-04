'use strict';

import $ from 'jquery';
import Highlight from 'highlight.js';
import Marked from 'marked';
import R from 'ramda';
import React from 'react';
import Store from '../stores/ProblemBrowserStore';
import Util from '../Util';
import { Button, ButtonGroup, ButtonToolbar, Col, Collapse, DropdownButton,
         Grid, Input, ListGroup, ListGroupItem,
         MenuItem, Nav, NavItem, Panel, PanelGroup, Row } from 'react-bootstrap';
import { ButtonLink, MenuItemLink, NavItemLink } from 'react-router-bootstrap';
import { Column, Table } from 'fixed-data-table';
import { Link } from 'react-router';
import { makeFileRoute } from '../stores/ProblemBrowserStore';
import { PROBLEM_MAX_SIZE,
         getProblemBrowserIndex,
         getProblemBrowserFile } from '../Util';
import { PropTypes as Types } from 'react';
import Select from 'react-select';
import keymirror from 'keymirror';
import { BarChart, PieChart, Treemap } from 'react-d3';
import Numeral from 'numeral';

require('../../node_modules/highlight.js/styles/idea.css');
require('../../node_modules/fixed-data-table/dist/fixed-data-table.css');
require('../../node_modules/react-select/dist/default.css');
require('../../css/default.css');
require('../../css/ProblemBrowser.css');

const MAX_PROBLEMS = 30;
const SELECT_DELIMITER = '-';
const getStateFromStore = () => Store.get();

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
    pieChart: {
      width: 350,
      height: 350,
      radius: 100,
      innerRadius: 20,
    },
    barChart: {
      width: 350,
      height: 350,
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
 * Add some utility functions to the router
 */
const Router = router => {
  const cleanQuery = q => R.fromPairs(R.toPairs(q).filter(x => x[1]));
  router.extendQuery = (keyOrObj, val) => {
    const cur = router.getCurrentQuery();
    const obj = (typeof(keyOrObj) === 'string') ? {[keyOrObj]: val} : keyOrObj;
    const query = cleanQuery(R.merge(cur, obj));
    router.transitionTo(router.getCurrentPathname(), null, query);
  };
  router.transitionWithQuery = to => {
    router.transitionTo(to, null, cleanQuery(router.getCurrentQuery()));
  };
  router.hasQueryParam = key => key in router.getCurrentQuery();
  router.getQueryParam = key => router.getCurrentQuery()[key];
  router.getQueryParamList = key => {
    const v = router.getCurrentQuery()[key];
    return v ? v.split(SELECT_DELIMITER) : [];
  };
  return router;
};

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
    let routeChanged = false;
    if (!problemSet) {
      problemSet = 'TPTP';
      routeChanged = true;
    }
    if (!type) {
      type = type || 'problems';
      routeChanged = true;
    }
    const router = Router(this.context.router);
    const { index, files } = this.state;
    const problemSetNames = index.problemSetNames();
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
          || (order === 'Propositional' && p.isPropositional())
          || (order === 'FirstOrder' && p.isFirstOrder()));

    const pset = index.getProblemSet(problemSet);
    const domains = pset ? pset.domains() : [];
    const problems = pset ? pset.problems().filter(problemFilter) : [];
    const axioms = pset ? pset.axioms().filter(problemFilter) : [];

    // Ensure the name is in the route for non-charts.
    const defaultName = (() => {
      if (problems && type === 'problems' && problems.length > 0) return problems[0].name();
      if (axioms && type === 'axioms' && axioms.length > 0) return axioms[0].name();
      return null;
    })();

    if (defaultName && !name) {
      name = defaultName;
      routeChanged = true;
    }

    if (routeChanged) {
      if (name) {
        router.transitionWithQuery(`/browser/${problemSet}/${type}/${name}`);
      } else {
        router.transitionWithQuery(`/browser/${problemSet}/${type}`);
      }
      return null;
    }

    const problem = (pset && name) ? pset.problemOrAxiom(type, name) : null;
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
  router: Types.func.isRequired,
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
    const isCharts = type === 'charts';
    return (
      <Grid style={Style.grid}>
        <Row>
          <Col md={2}>
            <div style={{marginBottom: 20}}>
              <ButtonGroup justified>
                <ProblemSetChooser problemSet={problemSet}
                                   problemSetNames={problemSetNames} />
              </ButtonGroup>
            </div>

            <div style={{display: axioms ? undefined : 'none', marginBottom: 20}}>
              <ButtonGroup justified>
                <TypeChooser type={type}
                             problemSet={problemSet} />
              </ButtonGroup>
            </div>

            <div style={{marginBottom: 20}}>
              <ProblemFilter />
            </div>

            <div>
              <DomainsChooser domains={domains} />
            </div>

            <div style={{display: isTptp ? undefined : 'none'}}>
              <StatusChooser />
            </div>

            <div style={{display: isTptp ? undefined : 'none'}}>
              <DifficultyChooser />
            </div>

            <div style={{display: isTptp ? undefined : 'none'}}>
              <EqualityChooser />
            </div>

            <div style={{display: isTptp ? undefined : 'none'}}>
              <OrderChooser />
            </div>
          </Col>

          <Col md={8}>
            {isCharts ?
              <div style={{display: isTptp ? undefined : 'none'}}>
                <ChartsDisplay problems={problems} />
              </div>

              :

              <ProblemDisplay problem={problem}
                              problemSet={problemSet}
                              body={problemBody} />
            }
          </Col>

          <Col md={2}>
            <ProblemList problems={display}
                         type={type} />
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
class ChartsDisplay extends React.Component {
  render() {
    const { problems } = this.props;
    const count = problems.length;
    if (count === 0) return <h1>No problems match</h1>;

    return (
      <Grid fluid>
        <Row>
          <Col md={6}>
            <EqualityChart problems={problems} />
          </Col>
          <Col md={6}>
            <StatusChart problems={problems} />
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <OrderChart problems={problems} />
          </Col>
          <Col md={6}>
            <DifficultyChart problems={problems} />
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <DomainChart problems={problems} />
          </Col>
        </Row>
      </Grid>
    )
  }
}

ChartsDisplay.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
};


/**
 *
 */
class StatusChart extends React.Component {
  render() {
    const { problems } = this.props;
    const count = problems.length;
    const pcnt = v => {
      const num = problems.filter(p => p.status() === v).length;
      return (num > 0) ? Numeral(100 * num / count).format('00.0') : null;
    };
    const data = [
      {value: pcnt('UNS'), label: 'Unsatisfiable'},
      {value: pcnt('SAT'), label: 'Satisfiable'},
      {value: pcnt('THM'), label: 'Theorem'},
      {value: pcnt('UNK'), label: 'Unknown'},
      {value: pcnt('OPN'), label: 'Open'},
      {value: pcnt('CSA'), label: 'CounterSatisfiable'},
    ].filter(o => o.value !== null);

    return (
      <PieChart data={data} {...Style.pieChart} />
    )
  }
}

StatusChart.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
};


/**
 *
 */
class EqualityChart extends React.Component {
  render() {
    const { problems } = this.props;
    const count = problems.length;
    const numEquality = problems.filter(p => p.hasEquality()).length;
    const pcntEquality = Numeral(100 * numEquality / count).format('00.0');
    const pcntNoEquality = Numeral(100 - pcntEquality).format('00.0');
    const data = [
      {label: 'Equality', value: pcntEquality},
      {label: 'No Equality', value: pcntNoEquality},
    ];

    return (
      <PieChart data={data} {...Style.pieChart} />
    )
  }
}

EqualityChart.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
};

/**
 *
 */
class OrderChart extends React.Component {
  render() {
    const { problems } = this.props;
    const count = problems.length;
    const numProp = problems.filter(p => p.isPropositional()).length;
    const pcntProp = Numeral(100 * numProp / count).format('00.0');
    const pcntFirstOrder = Numeral(100 - pcntProp).format('00.0');
    const data = [
      {label: 'Propositional', value: pcntProp},
      {label: 'First Order', value: pcntFirstOrder},
    ];

    return (
      <PieChart data={data} {...Style.pieChart} />
    )
  }
}

OrderChart.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
};


/**
 *
 */
class DifficultyChart extends React.Component {
  render() {
    const { problems } = this.props;
    const step = 0.1;
    const datum = x =>
      problems.filter(p => p.difficulty() >= x && p.difficulty() < x + step).length;
    const data = R.unfold(x => x > 1.0 ? false : [{label: Numeral(x).format('.0'), value: datum(x)}, x + step], 0.0);
    return (
      <BarChart data={data} {...Style.barChart} />
    )
  }
}

DifficultyChart.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
};


/**
 *
 */
class DomainChart extends React.Component {
  render() {
    const { problems } = this.props;
    const fn = (obj, p) => {
      const current = obj[p.domain()];
      const next = current ? current + 1 : 1;
      return R.merge(obj, {[p.domain()]: next});
    };
    const data = R.toPairs(R.reduce(fn, {}, problems)).map(arr => ({label: arr[0], value: arr[1]}));
    return (
      <Treemap data={data} {...Style.barChart} />
    )
  }
}

DomainChart.propTypes = {
  problems: Types.arrayOf(Types.object).isRequired,
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
    const types = ['problems', 'axioms', 'charts'];
    return (
      <DropdownButton title={type.capitalize()}>
        {types.map(t =>
            <MenuItemLink key={t} to={`/browser/${problemSet}/${t}`}>
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
      const domains = ds.map(d => d.value).sort().join(SELECT_DELIMITER);
      router.extendQuery(QueryKeys.domains, domains);
    };
    const options = domains.map(c => ({value: c, label: c}));
    return (
      <div>
        <Panel collapsible defaultExpanded={false} header='Domains'>
          <Select options={options}
                  placeholder='Any'
                  onChange={onChange}
                  value={selectedDomains}
                  delimiter={SELECT_DELIMITER}
                  multi={true} />
        </Panel>
      </div>
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
    const onChange = (_, forms) =>
      router.extendQuery(QueryKeys.forms, forms.map(t => t.value).sort().join(SELECT_DELIMITER));
    return (
      <Panel collapsible defaultExpanded={false} header='Forms'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedForms}
                multi={true} />
      </Panel>
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
    const onChange = (_, status) => router.extendQuery(
      QueryKeys.status, status.map(s => s.value).sort().join(SELECT_DELIMITER));
    return (
      <Panel collapsible defaultExpanded={false} header='Status'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedStatus}
                multi={true} />
      </Panel>
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
    const onChangeMin = () => router.extendQuery(QueryKeys.minDifficulty, this.refs.min.getValue());
    const onChangeMax = () => router.extendQuery(QueryKeys.maxDifficulty, this.refs.max.getValue());
    return (
      <Panel collapsible defaultExpanded={false} header='Difficulty'>
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
      </Panel>
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
    const onChange = s => router.extendQuery(QueryKeys.equality, s);
    return (
      <Panel collapsible defaultExpanded={false} header='Equality'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedEquality}
                multi={false} />
      </Panel>
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
    const onChange = s => router.extendQuery(QueryKeys.order, s);
    return (
      <Panel collapsible defaultExpanded={false} header='Order'>
        <Select options={options}
                placeholder='Any'
                onChange={onChange}
                value={selectedOrder}
                multi={false} />
      </Panel>
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
    const onChange = () => router.extendQuery(QueryKeys.filter, this.refs.input.getValue());
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
    const query = router.getCurrentQuery();
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
        <Column label={`Count: ${count}`}
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