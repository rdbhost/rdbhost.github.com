// js/num_partial.js
import { Data } from '../dim_data.js';

function parseDims(unit) {
  unit = unit.replace(/\s/g, '');
  const dims = new Map();
  if (!unit) return dims;
  const parts = unit.split('/');
  const processPart = (part, sign) => {
    if (part.includes('^')) {
      const [base, expStr] = part.split('^');
      const exp = parseFloat(expStr) || 1;
      dims.set(base, (dims.get(base) || 0) + sign * exp);
    } else {
      const match = part.match(/^([a-zA-Z]+)(\d*)$/);
      if (match) {
        const base = match[1];
        const exp = match[2] ? parseInt(match[2]) : 1;
        dims.set(base, (dims.get(base) || 0) + sign * exp);
      } else {
        dims.set(part, (dims.get(part) || 0) + sign * 1);
      }
    }
  };
  processPart(parts[0], 1);
  for (let i = 1; i < parts.length; i++) {
    processPart(parts[i], -1);
  }
  return dims;
}

function unitToString(dims) {
  if (dims.size === 0) return '';
  const pos = [];
  const neg = [];
  for (let [dim, exp] of [...dims.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (exp === 0) continue;
    let term = dim;
    const absExp = Math.abs(exp);
    if (absExp !== 1) term += `^${absExp}`;
    if (exp > 0) pos.push(term);
    else neg.push(term);
  }
  let str = pos.join(' ');
  if (neg.length > 0) {
    str = str ? `${str} / ` : '1 / ';
    str += neg.join(' ');
  }
  return str;
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
  if (a.length !== 3 || b.length !== 3) throw new Error('Cross product requires 3D vectors');
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function elementwise(f) {
  return (val) => {
    if (typeof val === 'number') return f(val);
    if (Array.isArray(val)) return val.map(f);
    throw new Error(`Invalid type for ${f.name || 'function'}`);
  };
}

const unaryOps = {
  '-': (a) => {
    const typ = a.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('Invalid type for unary -');
    const negVal = elementwise(x => -x)(a.val());
    return new Data(negVal, a.unit());
  },
  '+': (a) => a,
  'not': (a) => {
    if (a.unit()) throw new Error('not expects unitless');
    const val = a.val();
    if (typeof val === 'boolean') return new Data(!val);
    throw new Error('Invalid type for not');
  },
};

const binaryOps = {
  '+': (a, b) => {
    const aTyp = a.type();
    const bTyp = b.type();
    if (aTyp !== bTyp) throw new Error('Type mismatch in +');
    if (aTyp !== 'number' && aTyp !== 'vector') throw new Error('Invalid type for +');
    const bConv = b.asGivenUnit(a.unit())[0];
    const resultVal = addVal(a.val(), bConv.val());
    return new Data(resultVal, a.unit());
  },
  '-': (a, b) => {
    const aTyp = a.type();
    const bTyp = b.type();
    if (aTyp !== bTyp) throw new Error('Type mismatch in -');
    if (aTyp !== 'number' && aTyp !== 'vector') throw new Error('Invalid type for -');
    const bConv = b.asGivenUnit(a.unit())[0];
    const resultVal = subtractVal(a.val(), bConv.val());
    return new Data(resultVal, a.unit());
  },
  '*': (a, b) => {
    const aBase = a.asBaseUnit();
    const bBase = b.asBaseUnit();
    const siA = aBase.val();
    const siB = bBase.val();
    let siResult;
    if (typeof siA === 'number' && typeof siB === 'number') siResult = siA * siB;
    else if (typeof siA === 'number' && Array.isArray(siB)) siResult = siB.map(x => siA * x);
    else if (Array.isArray(siA) && typeof siB === 'number') siResult = siA.map(x => x * siB);
    else if (Array.isArray(siA) && Array.isArray(siB) && siA.length === 3 && siB.length === 3) siResult = crossProduct(siA, siB);
    else throw new Error('Invalid types for *');
    let dims = parseDims(aBase.unit());
    const bDims = parseDims(bBase.unit());
    for (let [k, v] of bDims) dims.set(k, (dims.get(k) || 0) + v);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '/': (a, b) => {
    const aBase = a.asBaseUnit();
    const bBase = b.asBaseUnit();
    const siA = aBase.val();
    const siB = bBase.val();
    let siResult;
    if (typeof siA === 'number' && typeof siB === 'number') siResult = siA / siB;
    else if (Array.isArray(siA) && typeof siB === 'number') siResult = siA.map(x => x / siB);
    else throw new Error('Invalid types for /');
    let dims = parseDims(aBase.unit());
    const bDims = parseDims(bBase.unit());
    for (let [k, v] of bDims) dims.set(k, (dims.get(k) || 0) - v);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '%': (a, b) => {
    const aTyp = a.type();
    const bTyp = b.type();
    if (aTyp !== 'number' || bTyp !== 'number') throw new Error('% for numbers only');
    const bConv = b.asGivenUnit(a.unit())[0];
    const resultVal = a.val() % bConv.val();
    return new Data(resultVal, a.unit());
  },
  '^': (a, b) => {
    const aTyp = a.type();
    if (aTyp !== 'number' || b.type() !== 'number') throw new Error('^ for numbers only');
    if (b.unit()) throw new Error('Exponent must be unitless');
    const aBase = a.asBaseUnit();
    const siA = aBase.val();
    const power = b.val();
    const siResult = Math.pow(siA, power);
    let dims = parseDims(aBase.unit());
    for (let [k, v] of dims) dims.set(k, v * power);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '@': (a, b) => {
    if (a.type() !== 'vector' || b.type() !== 'vector') throw new Error('@ for vectors only');
    const bConv = b.asGivenUnit(a.unit())[0];
    const aVal = a.val();
    const bVal = bConv.val();
    if (aVal.length !== bVal.length) throw new Error('Vectors must have same length for @');
    const siResult = aVal.reduce((sum, val, i) => sum + val * bVal[i], 0);
    return new Data(siResult, a.unit());
  },
  '>': (a, b) => {
    if (a.type() !== b.type()) return new Data(false);
    if (a.type() !== 'number') throw new Error('> for numbers only');
    const bConv = b.asGivenUnit(a.unit())[0];
    return new Data(a.val() > bConv.val());
  },
  '<': (a, b) => {
    if (a.type() !== b.type()) return new Data(false);
    if (a.type() !== 'number') throw new Error('< for numbers only');
    const bConv = b.asGivenUnit(a.unit())[0];
    return new Data(a.val() < bConv.val());
  },
  '>=': (a, b) => {
    if (a.type() !== b.type()) return new Data(false);
    if (a.type() !== 'number') throw new Error('>= for numbers only');
    const bConv = b.asGivenUnit(a.unit())[0];
    return new Data(a.val() >= bConv.val());
  },
  '<=': (a, b) => {
    if (a.type() !== b.type()) return new Data(false);
    if (a.type() !== 'number') throw new Error('<= for numbers only');
    const bConv = b.asGivenUnit(a.unit())[0];
    return new Data(a.val() <= bConv.val());
  },
  '==': (a, b) => {
    const aVal = a.val();
    const bVal = b.val();
    const aTyp = a.type();
    const bTyp = b.type();
    if (aTyp !== bTyp) return new Data(false);
    if (aTyp === 'string' || aTyp === 'boolean') return new Data(aVal === bVal);
    try {
      const bConv = b.asGivenUnit(a.unit())[0];
      if (aTyp === 'vector') {
        return new Data(aVal.length === bConv.val().length && aVal.every((x, i) => x === bConv.val()[i]));
      }
      return new Data(aVal === bConv.val());
    } catch (e) {
      if (e.message.includes('Incompatible units')) return new Data(false);
      throw e;
    }
  },
  '!=': (a, b) => new Data(!binaryOps['=='](a, b).val()),
  'and': (a, b) => {
    if (a.type() !== 'boolean' || b.type() !== 'boolean') throw new Error('and for booleans only');
    if (a.unit() || b.unit()) throw new Error('and expects unitless');
    return new Data(a.val() && b.val());
  },
  'nand': (a, b) => {
    if (a.type() !== 'boolean' || b.type() !== 'boolean') throw new Error('nand for booleans only');
    if (a.unit() || b.unit()) throw new Error('nand expects unitless');
    return new Data(!(a.val() && b.val()));
  },
  'or': (a, b) => {
    if (a.type() !== 'boolean' || b.type() !== 'boolean') throw new Error('or for booleans only');
    if (a.unit() || b.unit()) throw new Error('or expects unitless');
    return new Data(a.val() || b.val());
  },
  'xor': (a, b) => {
    if (a.type() !== 'boolean' || b.type() !== 'boolean') throw new Error('xor for booleans only');
    if (a.unit() || b.unit()) throw new Error('xor expects unitless');
    return new Data(a.val() !== b.val());
  },
  'in': (a, b) => {
    const aTyp = a.type();
    const bTyp = b.type();
    if (a.unit() || b.unit()) throw new Error('in expects unitless');
    if (aTyp === 'number' && bTyp === 'vector') {
      return new Data(b.val().includes(a.val()));
    } else if (aTyp === 'string' && bTyp === 'string') {
      return new Data(b.val().includes(a.val()));
    }
    throw new Error('Invalid types for in');
  },
};

function trigFunction(mathFunc, a) {
  const baseA = a.asBaseUnit();
  const u = baseA.unit();
  if (u !== '' && u !== 'rad') throw new Error(`${mathFunc.name} expects unitless or rad`);
  if (baseA.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(baseA.val());
  if (Number.isNaN(resultVal)) throw new Error(`invalid input to ${mathFunc.name}`);
  return new Data(resultVal);
}

function invTrigFunction(mathFunc, a) {
  if (a.unit()) throw new Error(`${mathFunc.name} expects unitless argument`);
  if (a.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(a.val());
  if (Number.isNaN(resultVal)) throw new Error(`invalid input to ${mathFunc.name}`);
  return new Data(resultVal);
}

function hyperbolicFunction(mathFunc, a) {
  if (a.unit()) throw new Error(`${mathFunc.name} expects unitless argument`);
  if (a.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(a.val());
  if (Number.isNaN(resultVal)) throw new Error(`invalid inputs to ${mathFunc.name}`);
  return new Data(resultVal);
}

function logFunction(mathFunc, a) {
  if (a.unit()) throw new Error(`${mathFunc.name} expects unitless argument`);
  if (a.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(a.val());
  if (Number.isNaN(resultVal)) throw new Error(`invalid inputs to ${mathFunc.name}`);
  return new Data(resultVal);
}

const functions = {
  sin: (a) => trigFunction(Math.sin, a),
  cos: (a) => trigFunction(Math.cos, a),
  tan: (a) => trigFunction(Math.tan, a),
  asin: (a) => invTrigFunction(Math.asin, a),
  acos: (a) => invTrigFunction(Math.acos, a),
  atan: (a) => invTrigFunction(Math.atan, a),
  atan2: (y, x) => {
    if (y.unit() || x.unit()) throw new Error('atan2 expects unitless arguments');
    if (y.type() !== 'number' || x.type() !== 'number') throw new Error('atan2 for numbers only');
    const resultVal = Math.atan2(y.val(), x.val());
    if (Number.isNaN(resultVal)) throw new Error('invalid inputs to atan2');
    return new Data(resultVal);
  },
  sinh: (a) => hyperbolicFunction(Math.sinh, a),
  cosh: (a) => hyperbolicFunction(Math.cosh, a),
  tanh: (a) => hyperbolicFunction(Math.tanh, a),
  asinh: (a) => hyperbolicFunction(Math.asinh, a),
  acosh: (a) => hyperbolicFunction(Math.acosh, a),
  atanh: (a) => hyperbolicFunction(Math.atanh, a),
  log: (a) => logFunction(Math.log10, a),
  ln: (a) => logFunction(Math.log, a),
  log2: (a) => logFunction(Math.log2, a),
  sqrt: (a) => {
    const aBase = a.asBaseUnit();
    const siVal = aBase.val();
    const elSqrt = elementwise(Math.sqrt);
    const siResult = elSqrt(siVal);
    let dims = parseDims(aBase.unit());
    for (let [k, v] of dims) dims.set(k, v * 0.5);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  cbrt: (a) => {
    const aBase = a.asBaseUnit();
    const siVal = aBase.val();
    const elCbrt = elementwise(Math.cbrt);
    const siResult = elCbrt(siVal);
    let dims = parseDims(aBase.unit());
    for (let [k, v] of dims) dims.set(k, v / 3);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  sign: (a) => {
    if (a.unit()) throw new Error('sign expects unitless');
    const elSign = elementwise(Math.sign);
    return new Data(elSign(a.val()));
  },
  random: () => new Data(Math.random()),
  fac: (a) => {
    if (a.unit()) throw new Error('fac expects unitless');
    const val = a.val();
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) throw new Error('Invalid argument for fac');
    let r = 1;
    for (let i = 2; i <= val; i++) r *= i;
    return new Data(r);
  },
  min: (...args) => {
    if (args.length < 2) throw new Error('min requires at least 2 arguments');
    args.forEach(arg => { if (arg.type() !== 'number') throw new Error('min for numbers only'); });
    const unit = args[0].unit();
    const vals = args.map(arg => arg.asGivenUnit(unit)[0].val());
    const resultVal = Math.min(...vals);
    return new Data(resultVal, unit);
  },
  max: (...args) => {
    if (args.length < 2) throw new Error('max requires at least 2 arguments');
    args.forEach(arg => { if (arg.type() !== 'number') throw new Error('max for numbers only'); });
    const unit = args[0].unit();
    const vals = args.map(arg => arg.asGivenUnit(unit)[0].val());
    const resultVal = Math.max(...vals);
    return new Data(resultVal, unit);
  },
  abs: (a) => {
    const typ = a.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('abs for numbers and vectors');
    const absVal = elementwise(Math.abs)(a.val());
    return new Data(absVal, a.unit());
  },
  roundTo: (num, dec) => {
    if (dec.unit()) throw new Error('roundTo decimal places must be unitless');
    if (dec.type() !== 'number') throw new Error('roundTo decimal places must be number');
    const typ = num.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('roundTo for numbers and vectors');
    const d = dec.val();
    const p = Math.pow(10, d);
    const elRound = elementwise(v => Math.round(v * p) / p);
    const resultVal = elRound(num.val());
    return new Data(resultVal, num.unit());
  },
  trunc: (a) => {
    const typ = a.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('trunc for numbers and vectors');
    const elTrunc = elementwise(Math.trunc);
    const resultVal = elTrunc(a.val());
    return new Data(resultVal, a.unit());
  },
  ceil: (a) => {
    const typ = a.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('ceil for numbers and vectors');
    const elCeil = elementwise(Math.ceil);
    const resultVal = elCeil(a.val());
    return new Data(resultVal, a.unit());
  },
  floor: (a) => {
    const typ = a.type();
    if (typ !== 'number' && typ !== 'vector') throw new Error('floor for numbers and vectors');
    const elFloor = elementwise(Math.floor);
    const resultVal = elFloor(a.val());
    return new Data(resultVal, a.unit());
  },
  hypot: (a) => {
    if (a.type() !== 'vector') throw new Error('hypot for vectors only');
    const val = a.val();
    const resultVal = Math.hypot(...val);
    return new Data(resultVal, a.unit());
  },
  length: (a) => {
    if (a.type() !== 'vector') throw new Error('length for vectors only');
    return functions.hypot(a)
  },
};

export { unaryOps, binaryOps, functions };