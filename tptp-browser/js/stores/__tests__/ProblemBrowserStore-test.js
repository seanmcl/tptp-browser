jest.dontMock('../ProblemBrowserStore');
jest.dontMock('object-assign');
jest.dontMock('ramda');

const Store = require('../ProblemBrowserStore');
const Problem = Store.Test.Problem;
const Axiom = Store.Test.Axiom;
const ProblemSet = Store.Test.ProblemSet;
const Index = Store.Test.Index;
const err = new TypeError;

describe('Problem', () => {
  it('Returns correct problem path', () => {
    const p = Problem('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: 1000});
    expect(p.file()).toBe('/problems/TPTP-v6.1.0/Problems/AGT/AGT001+1.p');
  });

  it('Returns correct problem route', () => {
    const p = Problem('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: 1000});
    expect(p.route()).toBe('/browser/TPTP/problems/AGT001+1');
  });

  it('Throws on bad input', () => {
    expect(() => Problem(null, 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: 1000})).toThrow(err);
    expect(() => Problem('TPTP', null)({file: 'AGT001+1.p', size: 1000})).toThrow(err);
    expect(() => Problem('TPTP', 'TPTP-v6.1.0')({file: null, size: 1000})).toThrow(err);
    expect(() => Problem('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: null})).toThrow(err);
  });
});

describe('Axiom', () => {
  it('Returns correct axiom path', () => {
    const p = Axiom('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.ax', size: 1000});
    expect(p.file()).toBe('/problems/TPTP-v6.1.0/Axioms/AGT001+1.ax');
  });

  it('Returns correct axiom route', () => {
    const p = Axiom('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.ax', size: 1000});
    expect(p.route()).toBe('/browser/TPTP/axioms/AGT001+1');
  });

  it('Throws on bad input', () => {
    expect(() => Axiom(null, 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: 1000})).toThrow(err);
    expect(() => Axiom('TPTP', null)({file: 'AGT001+1.p', size: 1000})).toThrow(err);
    expect(() => Axiom('TPTP', 'TPTP-v6.1.0')({file: null, size: 1000})).toThrow(err);
    expect(() => Axiom('TPTP', 'TPTP-v6.1.0')({file: 'AGT001+1.p', size: null})).toThrow(err);
  });
});

describe('ProblemSet', () => {
  const ps = ProblemSet({
    name: 'TPTP',
    dir: 'TPTP-v6.1.0',
    axioms: [{file: 'AGT001+1.p', size: 1000}],
    problems: [{file: 'AGT001+1.ax', size:1000}]
  });
  it('returns axioms', () => {
    expect(ps.axioms().length === 1);
  });
  it('returns problems', () => {
    expect(ps.problems().length === 1);
  });
  it('can find axiom', () => {
    //expect(1).toBe(2);
    expect(ps.problemOrAxiom('axioms', 'AGT001+1').name()).toBe('AGT001+1');
  });
  it('can find problem', () => {
    expect(ps.problemOrAxiom('problems', 'AGT001+1').name()).toBe('AGT001+1');
  });
});

describe('Index', () => {
  const rawSets = [
    {
      name: 'TPTP',
      dir: 'TPTP-v6.1.0',
      axioms: [{file: 'AGT001+1.p', size: 1000}],
      problems: [{file: 'AGT001+1.ax', size:1000}]
    },
    {
      name: 'ILTP-propositional',
      dir: 'ILTP-propositional-v2.1.0',
      axioms: [{file: 'AGT001+1.p', size: 1000}],
      problems: [{file: 'AGT001+1.ax', size:1000}]
    }
  ];
  const index = Index(rawSets);
  it('problemSetNames', () => {
    expect(index.problemSetNames()).toEqual(['TPTP', 'ILTP-propositional'])
  });
  it('getProblemSet', () => {
    expect(index.getProblemSet('TPTP').name()).toEqual('TPTP');
    expect(index.getProblemSet('foo')).toBeNull();
  });
  it('hasProblemSet', () => {
    expect(index.hasProblemSet('TPTP')).toBe(true);
    expect(index.hasProblemSet('foo')).toBe(false);
  });
  it('isEmpty', () => {
    expect(Index([]).isEmpty()).toBe(true);
    expect(index.isEmpty()).toBe(false);
  })
});
