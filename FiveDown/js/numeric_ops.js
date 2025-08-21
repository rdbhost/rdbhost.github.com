// numeric_ops.js
import { Data, formatFormula, formatResult } from './dim_data.js';

function parseUnit(unit) {
  const map = new Map();
  if (!unit) return map;
  unit = unit.replace(/\s/g, '');
  const terms = unit.split('*');
  terms.forEach(term => {
    let sign = 1;
    if (term.startsWith('/')) {
      sign = -1;
      term = term.slice(1);
    }
    let [base, expStr] = term.split('^');
    const exp = expStr ? parseFloat(expStr) : 1;
    const current = map.get(base) || 0;
    map.set(base, current + sign * exp);
  });
  return map;
}

function unitToString(dims) {
  if (dims.size === 0) return '';
  const pos = []
  const neg = []
  for (let [dim, exp] of [...dims.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (exp > 0) {
      pos.push(exp === 1 ? dim : `${dim}^${exp}`)
    } else if (exp < 0) {
      neg.push(exp === -1 ? dim : `${dim}^${-exp}`)
    }
  }
  let str = pos.join('*');
  if (neg.length) {
    str = str ? `${str}/` : '1/';
    str += neg.join('*');
  }
  return str;
}

function getUnitInfo(unit) {
  const baseMap = parseUnit(unit)
  let factor = 1
  const dims = new Map()
  for (let [base, exp] of baseMap) {
    const conv = new Data(1, base).asBaseUnit()
    const baseFactor = conv.val()
    const trueBase = conv.unit()
    factor *= Math.pow(baseFactor, exp)
    dims.set(trueBase, (dims.get(trueBase) || 0) + exp)
  }
  const normalized = unitToString(dims)
  return {dims, factor, normalized}
}

function multiplyVal(val, factor) {
  if (typeof val === 'number') return val * factor;
  if (Array.isArray(val)) return val.map(x => x * factor);
  throw new Error('Invalid value type for multiply');
}

function divideVal(val, factor) {
  if (typeof val === 'number') return val / factor;
  if (Array.isArray(val)) return val.map(x => x / factor);
  throw new Error('Invalid value type for divide');
}

function addVal(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => x + b[i]);
  throw new Error('Invalid value type for add');
}

function subtractVal(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => x - b[i]);
  throw new Error('Invalid value type for subtract');
}

function crossProduct(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function mapsEqual(m1, m2) {
  if (m1.size !== m2.size) return false;
  for (let [k, v] of m1) if (v !== m2.get(k)) return false;
  return true;
}

function elementwise(f) {
  return (val) => {
    if (typeof val === 'number') return f(val);
    if (Array.isArray(val)) return val.map(f);
    throw new Error(`Invalid type for ${f.name}`);
  };
}

const unaryOps = {
  '-': (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    let siResult;
    if (typeof siVal === 'number') siResult = -siVal;
    else if (Array.isArray(siVal)) siResult = siVal.map(x => -x);
    else throw new Error('Invalid type for unary -');
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  '+': (a) => a,
  'not': (a) => {
    if (a.unit()) throw new Error('not unitless');
    const val = a.val();
    if (typeof val === 'boolean') return new Data(!val);
    throw new Error('Invalid not');
  },
};

const binaryOps = {
  '+': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in +');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    const siResult = addVal(siA, siB);
    return new Data(divideVal(siResult, aInfo.factor), a.unit());
  },
  '-': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in -');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    const siResult = subtractVal(siA, siB);
    return new Data(divideVal(siResult, aInfo.factor), a.unit());
  },
  '*': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    let siResult;
    if (typeof siA === 'number' && typeof siB === 'number') siResult = siA * siB;
    else if (typeof siA === 'number' && Array.isArray(siB)) siResult = siB.map(x => siA * x);
    else if (Array.isArray(siA) && typeof siB === 'number') siResult = siA.map(x => x * siB);
    else if (Array.isArray(siA) && Array.isArray(siB)) {
      siResult = crossProduct(siA, siB);
    } else throw new Error('Invalid *');
    const dims = new Map(aInfo.dims);
    for (let [k, v] of bInfo.dims) dims.set(k, (dims.get(k) || 0) + v);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '/': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    let siResult;
    if (typeof siA === 'number' && typeof siB === 'number') siResult = siA / siB;
    else if (Array.isArray(siA) && typeof siB === 'number') siResult = siA.map(x => x / siB);
    else throw new Error('Invalid /');
    const dims = new Map(aInfo.dims);
    for (let [k, v] of bInfo.dims) dims.set(k, (dims.get(k) || 0) - v);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '%': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in %');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    const siResult = siA % siB;
    return new Data(divideVal(siResult, aInfo.factor), a.unit());
  },
  '^': (a, b) => {
    if (b.unit()) throw new Error('Exponent unitless');
    const aInfo = getUnitInfo(a.unit());
    const siA = multiplyVal(a.val(), aInfo.factor);
    const power = b.val();
    const siResult = Math.pow(siA, power);
    const dims = new Map();
    for (let [k, v] of aInfo.dims) dims.set(k, v * power);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '@': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in @');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    if (Array.isArray(siA) && Array.isArray(siB) && siA.length === siB.length) {
      const siResult = siA.reduce((sum, val, i) => sum + val * siB[i], 0);
      const dims = new Map(aInfo.dims);
      for (let [k, v] of bInfo.dims) dims.set(k, (dims.get(k) || 0) + v);
      const newUnit = unitToString(dims);
      return new Data(siResult, newUnit);
    }
    throw new Error('Invalid @');
  },
  '>': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in >');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    return new Data(siA > siB);
  },
  '>=': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in >=');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    return new Data(siA >= siB);
  },
  '<': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in <');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    return new Data(siA < siB);
  },
  '<=': (a, b) => {
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) throw new Error('Dimension mismatch in <=');
    const siA = multiplyVal(a.val(), aInfo.factor);
    const siB = multiplyVal(b.val(), bInfo.factor);
    return new Data(siA <= siB);
  },
  '==': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal !== typeof bVal) return new Data(false);
    if (typeof aVal === 'string') return new Data(aVal === bVal);
    const aInfo = getUnitInfo(a.unit());
    const bInfo = getUnitInfo(b.unit());
    if (!mapsEqual(aInfo.dims, bInfo.dims)) return new Data(false);
    const siA = multiplyVal(aVal, aInfo.factor);
    const siB = multiplyVal(bVal, bInfo.factor);
    if (Array.isArray(siA) && Array.isArray(siB)) {
      return new Data(siA.length === siB.length && siA.every((x, i) => x === siB[i]));
    }
    return new Data(siA === siB);
  },
  '!=': (a, b) => new Data(!binaryOps['=='](a, b).val()),
  'and': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') return new Data(aVal && bVal);
    throw new Error('Invalid and');
  },
  'nand': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') return new Data(!(aVal && bVal));
    throw new Error('Invalid nand');
  },
  'or': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') return new Data(aVal || bVal);
    throw new Error('Invalid or');
  },
  'xor': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') return new Data(aVal !== bVal);
    throw new Error('Invalid xor');
  },
  'in': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    if (typeof aVal === 'number' && Array.isArray(bVal)) return new Data(bVal.includes(aVal));
    throw new Error('Invalid in');
  },
};

const functions = {
  sin: (a) => {
    if (a.unit()) throw new Error('sin expects unitless argument');
    return new Data(elementwise(Math.sin)(a.val()), '');
  },
  // Similar for other trig, log, exp functions - unitless input/output
  sqrt: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.sqrt)(siVal);
    const newDims = new Map();
    for (let [k, v] of info.dims) newDims.set(k, v * 0.5);
    const newUnit = unitToString(newDims);
    return new Data(siResult, newUnit);
  },
  cbrt: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.cbrt)(siVal);
    const newDims = new Map();
    for (let [k, v] of info.dims) newDims.set(k, v / 3);
    const newUnit = unitToString(newDims);
    return new Data(siResult, newUnit);
  },
  abs: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.abs)(siVal);
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  ceil: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.ceil)(siVal);
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  floor: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.floor)(siVal);
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  round: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.round)(siVal);
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  trunc: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    const siResult = elementwise(Math.trunc)(siVal);
    return new Data(divideVal(siResult, info.factor), a.unit());
  },
  sign: (a) => new Data(elementwise(Math.sign)(a.val()), ''),
  length: (a) => {
    const info = getUnitInfo(a.unit());
    const siVal = multiplyVal(a.val(), info.factor);
    let result;
    if (Array.isArray(siVal)) result = Math.hypot(...siVal);
    else if (typeof siVal === 'string') result = siVal.length;
    else throw new Error('Invalid length');
    return new Data(result, a.unit());
  },
  random: () => new Data(Math.random(), ''),
  fac: (n) => {
    if (n.unit()) throw new Error('fac unitless');
    const val = n.val();
    if (!Number.isInteger(val) || val < 0) throw new Error('Invalid fac');
    let r = 1;
    for (let i = 2; i <= val; i++) r *= i;
    return new Data(r, '');
  },
  min: (...args) => {
    if (args.length === 0) throw new Error('min requires arguments');
    const infos = args.map(arg => getUnitInfo(arg.unit()));
    const firstInfo = infos[0];
    infos.forEach(info => {
      if (!mapsEqual(info.dims, firstInfo.dims)) throw new Error('Dimension mismatch in min');
    });
    const siVals = args.map((arg, i) => multiplyVal(arg.val(), infos[i].factor));
    const siResult = Math.min(...siVals);
    return new Data(siResult / firstInfo.factor, args[0].unit());
  },
  max: (...args) => {
    if (args.length === 0) throw new Error('max requires arguments');
    const infos = args.map(arg => getUnitInfo(arg.unit()));
    const firstInfo = infos[0];
    infos.forEach(info => {
      if (!mapsEqual(info.dims, firstInfo.dims)) throw new Error('Dimension mismatch in max');
    });
    const siVals = args.map((arg, i) => multiplyVal(arg.val(), infos[i].factor));
    const siResult = Math.max(...siVals);
    return new Data(siResult / firstInfo.factor, args[0].unit());
  },
  hypot: (...args) => {
    if (args.length === 0) throw new Error('hypot requires arguments');
    const infos = args.map(arg => getUnitInfo(arg.unit()));
    const firstInfo = infos[0];
    infos.forEach(info => {
      if (!mapsEqual(info.dims, firstInfo.dims)) throw new Error('Dimension mismatch in hypot');
    });
    const siVals = args.map((arg, i) => multiplyVal(arg.val(), infos[i].factor));
    const siResult = Math.hypot(...siVals);
    return new Data(siResult / firstInfo.factor, args[0].unit());
  },
  atan2: (y, x) => {
    if (y.unit() || x.unit()) throw new Error('atan2 unitless');
    return new Data(Math.atan2(y.val(), x.val()), '');
  },
  roundTo: (num, dec) => {
    if (dec.unit()) throw new Error('roundTo dec unitless');
    const nVal = num.val();
    const dVal = dec.val();
    const p = Math.pow(10, dVal);
    return new Data(Math.round(nVal * p) / p, num.unit());
  },
  // Add similar for other functions
};

export { unaryOps, binaryOps, functions };