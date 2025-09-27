// js/num_partial.js
import { Data } from '../dim_data.js';
import { default as unit } from '../lib/UnitMath.js'; // Adjust path based on your setup (e.g., CDN or local file)


/**
 * Parses a unit string into a dimension map, handling space-separated unit products.
 * @param {string} unit - The unit string (e.g., 'm N', 'm^2/s').
 * @returns {Map<string, number>} A map of base units to their exponents.
 */
function parseDims(unt) {
  unt = unt.replace(/\s+/g, ' ').trim(); // Normalize spaces
  const dims = new Map();
  if (!unt) return dims;

  // Split on '/' for numerator and denominator
  const parts = unt.split('/');
  const numeratorParts = parts[0].split(' ').filter(p => p); // Split numerator on spaces
  const denominatorParts = parts.slice(1).join('/').split(' ').filter(p => p); // Combine denominators

  const processPart = (part, sign) => {
    if (!part) return;
    if (part.includes('^')) {
      const [base, expStr] = part.split('^');
      const exp = parseFloat(expStr) || 1;
      // Validate unit with UnitMath
      try {
        unit(1, base);
        dims.set(base, (dims.get(base) || 0) + sign * exp);
      } catch (e) {
        throw new Error(`Invalid unit: ${base}`);
      }
    } else {
      const match = part.match(/^([a-zA-Z]+)(\d*)$/);
      if (match) {
        const base = match[1];
        const exp = match[2] ? parseInt(match[2]) : 1;
        // Validate unit with UnitMath
        try {
          unit(1, base);
          dims.set(base, (dims.get(base) || 0) + sign * exp);
        } catch (e) {
          throw new Error(`Invalid unit: ${base}`);
        }
      } else {
        // Validate unit with UnitMath
        try {
          unit(1, part);
          dims.set(part, (dims.get(part) || 0) + sign * 1);
        } catch (e) {
          throw new Error(`Invalid unit: ${part}`);
        }
      }
    }
  };

  // Process numerator and denominator parts
  numeratorParts.forEach(part => processPart(part, 1));
  denominatorParts.forEach(part => processPart(part, -1));

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
    // Allow unitless addition
    if ((!a.unit() || a.unit() === '') && (!b.unit() || b.unit() === '')) {
      const resultVal = addVal(a.val(), b.val());
      return new Data(resultVal, '');
    }
    // If one is unitless, treat as the other's unit
    let unitToUse = a.unit() || b.unit();
    const bConv = b.asGivenUnit(unitToUse)[0];
    const aConv = a.asGivenUnit(unitToUse)[0];
    const resultVal = addVal(aConv.val(), bConv.val());
    return new Data(resultVal, unitToUse);
  },
  '-': (a, b) => {
    const aTyp = a.type();
    const bTyp = b.type();
    if (aTyp !== bTyp) throw new Error('Type mismatch in -');
    if (aTyp !== 'number' && aTyp !== 'vector') throw new Error('Invalid type for -');
    // Allow unitless subtraction
    if ((!a.unit() || a.unit() === '') && (!b.unit() || b.unit() === '')) {
      const resultVal = subtractVal(a.val(), b.val());
      return new Data(resultVal, '');
    }
    // If one is unitless, treat as the other's unit
    let unitToUse = a.unit() || b.unit();
    const bConv = b.asGivenUnit(unitToUse)[0];
    const aConv = a.asGivenUnit(unitToUse)[0];
    const resultVal = subtractVal(aConv.val(), bConv.val());
    return new Data(resultVal, unitToUse);
  },
  '*': (a, b) => {
    const aBase = a.asBaseUnit();
    const bBase = b.asBaseUnit();
    const aType = aBase.type();
    const bType = bBase.type();
    let siResult;
    if (aType === 'number' && bType === 'number') {
      siResult = aBase.val() * bBase.val();
    } else if (aType === 'number' && bType === 'vector') {
      siResult = bBase.val().map(x => aBase.val() * x);
    } else if (aType === 'vector' && bType === 'number') {
      siResult = aBase.val().map(x => x * bBase.val());
    } else if (aType === 'vector' && bType === 'vector' && aBase.val().length === 3 && bBase.val().length === 3) {
      siResult = crossProduct(aBase.val(), bBase.val());
    } else {
      throw new Error('Invalid types for *');
    }
    // If both are unitless, result is unitless
    if ((!aBase.unit()) && (!bBase.unit())) {
      return new Data(siResult, '');
    }
    let dims = parseDims(aBase.unit());
    const bDims = parseDims(bBase.unit());
    for (let [k, v] of bDims) dims.set(k, (dims.get(k) || 0) + v);
    const newUnit = unitToString(dims);
    return new Data(siResult, newUnit);
  },
  '/': (a, b) => {
    const aBase = a.asBaseUnit();
    const bBase = b.asBaseUnit();
    const aType = aBase.type();
    const bType = bBase.type();
    let siResult;
    if (aType === 'number' && bType === 'number') {
      siResult = aBase.val() / bBase.val();
    } else if (aType === 'vector' && bType === 'number') {
      siResult = aBase.val().map(x => x / bBase.val());
    } else {
      throw new Error('Invalid types for /');
    }
    // If both are unitless, result is unitless
    if ((!aBase.unit()) && (!bBase.unit())) {
      return new Data(siResult, '');
    }
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
    // If both are unitless, result is unitless
    if ((!a.unit() || a.unit() === '') && (!b.unit() || b.unit() === '')) {
      const resultVal = a.val() % b.val();
      return new Data(resultVal, '');
    }
    const unitToUse = a.unit() || b.unit();
    const bConv = b.asGivenUnit(unitToUse)[0];
    const aConv = a.asGivenUnit(unitToUse)[0];
    const resultVal = aConv.val() % bConv.val();
    return new Data(resultVal, unitToUse);
  },
  '^': (a, b) => {
    const aTyp = a.type();
    if (aTyp !== 'number' || b.type() !== 'number') throw new Error('^ for numbers only');
    if (b.unit()) throw new Error('Exponent must be unitless');
    const aBase = a.asBaseUnit();
    const siA = aBase.val();
    const power = b.val();
    const siResult = Math.pow(siA, power);
    // If base is unitless, result is unitless
    if (!aBase.unit()) {
      return new Data(siResult, '');
    }
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
  let u = baseA.unit();
  let val = baseA.val();
  if (u === 'deg' || u === 'degree' || u === 'degrees') {
    // Convert degrees to radians
    val = val * (Math.PI / 180);
    u = 'rad';
  }
  if (u !== '' && u !== 'rad') throw new Error(`${mathFunc.name} expects unitless, rad, or degree`);
  if (baseA.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(val);
  if (Number.isNaN(resultVal)) throw new Error(`invalid input to ${mathFunc.name}`);
  return new Data(resultVal);
}

function invTrigFunction(mathFunc, a) {
  if (a.unit()) throw new Error(`${mathFunc.name} expects unitless argument`);
  if (a.type() !== 'number') throw new Error(`${mathFunc.name} for numbers only`);
  const resultVal = mathFunc(a.val());
  if (Number.isNaN(resultVal)) throw new Error(`invalid input to ${mathFunc.name}`);
  return new Data(resultVal, 'rad');
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
  /**
   * Converts degrees to radians. Accepts a Data object with unit 'deg', 'degree', 'degrees', or unitless.
   * Returns a Data object with value in radians and unit 'rad'.
   */
  radians: (a) => {
    const baseA = a.asBaseUnit();
    let u = baseA.unit();
    let val = baseA.val();
    if (u === 'deg' || u === 'degree' || u === 'degrees') {
      // Convert degrees to radians
      val = val * (Math.PI / 180);
      u = 'rad';
    } else if (!u || u === '') {
      // Treat as degrees if unitless
      val = val * (Math.PI / 180);
      u = 'rad';
    } else if (u !== 'rad') {
      throw new Error('radians expects unitless or degree input');
    }
    return new Data(val, 'rad');
  },

   /**
    * Returns the index of item in vector or string (0-based). Returns -1 if not found.
    * First argument must be a Data object of type 'number' or 'string'.
    * Second argument must be a Data object of type 'vector' or 'string'.
    */
  index: (item, vector) => {
    // Validate item type
    if (item.type() !== 'number' && item.type() !== 'string') {
        throw new Error('index expects a number or string as first argument');
    }

    // Validate vector type
    if (vector.type() !== 'vector' && vector.type() !== 'string') {
        throw new Error('index expects a vector or string as second argument');
    }

    const itemVal = item.val();

    if (vector.type() === 'vector') {
        // Handle vector case (item must be a number)
        if (item.type() !== 'number') {
            throw new Error('index expects a number as first argument when second argument is a vector');
        }
        const arr = vector.val();
        const idx = arr.findIndex(x => x === itemVal);
        return new Data(idx);
    } else {
        // Handle string case
        const str = vector.val();
        const idx = str.indexOf(itemVal);
        return new Data(idx);
    }
  },
  sin: (a) => trigFunction(Math.sin, a),
  cos: (a) => trigFunction(Math.cos, a),
  tan: (a) => trigFunction(Math.tan, a),
  asin: (a) => invTrigFunction(Math.asin, a),
  acos: (a) => invTrigFunction(Math.acos, a),
  atan: (a) => invTrigFunction(Math.atan, a),
  atan2: (y, x) => {
    if (y.type() !== 'number' || x.type() !== 'number') throw new Error('atan2 expects number inputs');
    let yUnit = y.unit() || '';
    let xUnit = x.unit() || '';
    if (yUnit !== xUnit) 
      throw new Error('atan2 expects both inputs to have the same unit');
    const resultVal = Math.atan2(y.val(), x.val());
    if (Number.isNaN(resultVal)) throw new Error('invalid inputs to atan2');
    return new Data(resultVal, yUnit || 'rad');
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
    // if (a.unit()) throw new Error('sign expects unitless');
    const elSign = elementwise(Math.sign);
    return new Data(elSign(a.val()), a.unit());
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
    // If a single vector argument, call min with its elements
    if (args.length === 1 && args[0].type && args[0].type() === 'vector') {
      return functions.min(...args[0].val().map(v => new Data(v, args[0].unit())));
    }
    if (args.length < 2) throw new Error('min requires at least 2 arguments');
    args.forEach(arg => { if (arg.type() !== 'number') throw new Error('min for numbers only'); });
    // If all are unitless, result is unitless
    if (args.every(arg => !arg.unit())) {
      const vals = args.map(arg => arg.val());
      const resultVal = Math.min(...vals);
      return new Data(resultVal, '');
    }
    const unit = args[0].unit();
    const vals = args.map(arg => arg.asGivenUnit(unit)[0].val());
    const resultVal = Math.min(...vals);
    return new Data(resultVal, unit);
  },
  max: (...args) => {
    // If a single vector argument, call max with its elements
    if (args.length === 1 && args[0].type && args[0].type() === 'vector') {
      return functions.max(...args[0].val().map(v => new Data(v, args[0].unit())));
    }
    if (args.length < 2) throw new Error('max requires at least 2 arguments');
    args.forEach(arg => { if (arg.type() !== 'number') throw new Error('max for numbers only'); });
    // If all are unitless, result is unitless
    if (args.every(arg => !arg.unit() || arg.unit() === '')) {
      const vals = args.map(arg => arg.val());
      const resultVal = Math.max(...vals);
      return new Data(resultVal, '');
    }
    // Use the first non-empty unit
    const unit = args.find(arg => arg.unit() && arg.unit() !== '').unit() || '';
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
  hypot: (a,b) => {
    if (b === undefined) {
      if (a.type() !== 'vector') throw new Error('hypot for vectors only');
    } else {
      if (b.type() !== 'number' || a.type() !== 'number')
        throw new Error('dual inputs must be numbers')
      const v = [a.val(), b.val()];
      return functions.hypot(new Data(v, a.type()))
    }
      
    if (b !== undefined && a.type() !== 'number') throw new Error('hypot for numbers only');
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