'use strict';

import Dispatcher from '../SiteDispatcher';
import { ActionTypes } from '../SiteConstants';
import { EventEmitter } from 'events';
import { CHANGE_EVENT } from '../Util';
import R from 'ramda';
import assign from 'object-assign';

/**
 * The file
 *     /problems/TPTP-v6.1.0/Problems/AGT/AGT001+1.p'
 * corresponds to route
 *     /browser/TPTP/problems/AGT001+1
 */
const makeFilePath = (problemSetDir, type, problemFile) => {
  const domain = problemFile.substr(0, 3);
  return type === 'axioms' ?
    `/problems/${problemSetDir}/Axioms/${problemFile}` :
    `/problems/${problemSetDir}/Problems/${domain}/${problemFile}`;
};

/**
 *
 */
export const makeFileRoute = (problemSetName, type, problemName) => {
  return `/browser/${problemSetName}/${type}/${problemName}`;
};


/**
 *
 */
const Problem = (problemSetName, problemSetDir) => p => (() => {
  if (!problemSetName || !problemSetDir || !p || !p.file || !p.size) throw new TypeError;
  const _fileName = p.file;
  const _problemName = _fileName.replace(/\.[^\.]*$/, '');
  const _route = makeFileRoute(problemSetName, 'problems', _problemName);
  const _file = makeFilePath(problemSetDir, 'problems', _fileName);
  const domain = () => p.file.substr(0, 3);
  const file = () => _file;
  const name = () => _problemName;
  const size = () => p.size;
  const route = () => _route;
  const matches = rex => _problemName.match(rex);
  const type = () => {
    switch (name()[6]) {
      case '-': return 'CNF';
      case '+': return 'FOF';
      case '_': return 'TFF';
      case '=': return 'TFA';
      case '^': return 'THF';
      default: throw `Unknown type: ${name()}}`;
    }
  };
  // stats[0] is problem name
  const stats = () => p.stats;
  const version = () => p.stats ? p.stats[1] : null;
  const status = () => p.stats ? p.stats[2] : null;
  const difficulty = () => p.stats ? p.stats[3] : null;
  const numFormulas = () => p.stats ? p.stats[4] : null;
  const numNonHornClauses = () => p.stats ? p.stats[5] : null;
  const numUnitClauses = () => p.stats ? p.stats[6] : null;
  // 7 is num type definitions
  // 8 is num definitions
  // 9 is num range restricted clauses
  const numAtoms = () => p.stats ? p.stats[10] : null;
  const numEqualityAtoms = () => p.stats ? p.stats[11] : null;
  // 12 is num variable atoms
  // 13 is max formula depth
  // 14 is avg formula depth
  const numPredSyms = () => p.stats ? p.stats[15] : null;
  const numPropSyms = () => p.stats ? p.stats[16] : null;
  // 17 is predicate arity range
  const numConnectives = () => p.stats ? p.stats[18] : null;
  // 19 is num type connectives
  const numVariables = () => p.stats ? p.stats[20] : null;
  // 21 is num singleton vars
  // 22 is num polymorphic types
  const numUniversal = () => p.stats ? p.stats[23] : null;
  const numExistential = () => p.stats ? p.stats[24] : null;
  // 25 is num lambda exprs
  // 26 max term depth
  // 27 avg term depth
  const numFuncSyms = () => p.stats ? p.stats[28] : null;
  const numConstantSyms = () => p.stats ? p.stats[29] : null;
  // 30 is func arity range
  // 31 is num arith syms
  const hasEquality = () => numEqualityAtoms() > 0;
  const isPropositional = () => numPropSyms() === numPredSyms();
  const isFirstOrder = () => numPropSyms() !== numPredSyms();
  return {
    difficulty,
    domain,
    file,
    hasEquality,
    isPropositional,
    isFirstOrder,
    matches,
    name,
    numEqualityAtoms,
    numFormulas,
    numNonHornClauses,
    numUnitClauses,
    numAtoms,
    numPredSyms,
    numPropSyms,
    numConnectives,
    numVariables,
    numUniversal,
    numExistential,
    numFuncSyms,
    numConstantSyms,
    route,
    size,
    stats,
    status,
    type,
    version,
  };
})();


const Axiom = (problemSetName, problemSetDir) => p => (() => {
  if (!problemSetName || !problemSetDir || !p || !p.file || !p.size) throw new TypeError;
  const _fileName = p.file;
  const _problemName = _fileName.replace(/\.[^\.]*$/, '');
  const _route = makeFileRoute(problemSetName, 'axioms', _problemName);
  const _file = makeFilePath(problemSetDir, 'axioms', _fileName);
  const file = () => _file;
  const name = () => _problemName;
  const size = () => p.size;
  const route = () => _route;
  const matches = rex => _problemName.match(rex);
  return {file, name, size, route, matches};
})();


/**
 *
 */
const ProblemSet = o => (() => {
  if (!o.dir || !o.axioms || !o.problems) throw new TypeError;
  const _axioms = o.axioms.map(Axiom(o.name, o.dir));
  const _problems = o.problems.map(Problem(o.name, o.dir));
  const _domains = R.uniq(_problems.map(p => p.name().substr(0, 3)));
  const dir = () => o.dir;
  const name = () => o.name;
  const axioms = () => _axioms;
  const problems = () => _problems;
  const problem = name => R.find(p => p.name() === name)(_problems);
  const axiom = name => R.find(p => p.name() === name)(_axioms);
  const hasStats = () => o.hasStats;
  const domains = () => _domains;
  const problemOrAxiom = (type, name) => type === 'axioms' ? axiom(name) : problem(name);
  return {name, axioms, dir, problems, problemOrAxiom, domains, hasStats};
})();


/**
 *
 */
const Index = sets => (() => {
  const _obj = sets.reduce((s, o) => R.assoc(o.name, ProblemSet(o), s), {});
  const problemSetNames = () => Object.keys(_obj);
  const hasProblemSet = s => s in _obj;
  const getProblemSet = s => _obj[s] || null;
  const isEmpty = () => Object.keys(_obj).length === 0;
  return {problemSetNames, getProblemSet, hasProblemSet, isEmpty};
})();


/**
 *
 */
let _state = {
  index: Index([]),
  files: {},
};

const Store = assign({}, EventEmitter.prototype, {
  emitChange() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  get() {
    return _state;
  }
});

Store.dispatchToken = Dispatcher.register(action => {
  switch(action.type) {
    case ActionTypes.PROBLEM_BROWSER_RECEIVE_INDEX:
      console.log('Received Index');
      _state.index = Index(action.index);
      Store.emitChange();
      break;

    case ActionTypes.PROBLEM_BROWSER_RECEIVE_FILE:
      console.log(`Received file: ${action.name}`);
      _state.files[action.name] = action.file;
      Store.emitChange();
      break;

    default:
      // do nothing
  }
});

export default Store;

/**
 * Expose constructors for unit testing.
 */
export const Test = {Problem, Axiom, ProblemSet, Index};
