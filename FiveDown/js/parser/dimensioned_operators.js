const GAMMA_G = 4.7421875;
const GAMMA_P = [
  0.99999999999999709182,
  57.156235665862923517,
  -59.597960355475491248,
  14.136097974741747174,
  -0.49191381609762019978,
  0.0000339942926278568447,
  0.00004652362892704857514,
  -0.00009837447530481613524,
  0.00015808870322491248884,
  -0.00021026444172410488319,
  0.0002174396181152126432,
  -0.00016431810653676389022,
  0.00008441822398385295881,
  -0.00002619083840158140867,
  0.0000036899182659531622704
];

function array_comparator(a,b) {
  if (a.length > b.length)
    return 1
  if (a.length < b.length)
    return -1
  for (let i=0; i<a.length; i++) {
    if (a[i] > b[i])
      return 1
    if (a[i] < b[i])
      return -1
  }
  return 0
}

const parseUnit = (unit) => {
  if (!unit) return {};
  unit = unit.replace(/\s/g, '');
  const tokens = unit.split('*');
  let dims = {};
  for (let token of tokens) {
    const divTokens = token.split('/');
    for (let j = 0; j < divTokens.length; j++) {
      let sub = divTokens[j];
      if (sub === '') continue;
      const match = sub.match(/([a-zA-Z]+)(\^([-+]?[0-9.]+))?/);
      if (!match) throw new Error(`Invalid unit part: ${sub}`);
      const base = match[1];
      let exp = match[3] ? parseFloat(match[3]) : 1;
      exp *= (j === 0 ? 1 : -1);
      if (!dims[base]) dims[base] = 0;
      dims[base] += exp;
    }
  }
  for (let base in dims) {
    if (dims[base] === 0) delete dims[base];
  }
  return dims;
};

const toUnitString = (dims) => {
  if (!dims || Object.keys(dims).length === 0) return '';
  const bases = Object.keys(dims).sort();
  let num = [];
  let den = [];
  for (let base of bases) {
    let exp = dims[base];
    let absExp = Math.abs(exp);
    let str = base;
    if (absExp !== 1) str += '^' + absExp;
    if (exp > 0) num.push(str);
    else den.push(str);
  }
  let str = num.join('*');
  if (den.length > 0) {
    if (str) str += '/';
    else str = '1/';
    str += den.join('*');
  }
  return str;
};

const isDimensionless = (unit) => Object.keys(parseUnit(unit)).length === 0;

const unitsEqual = (u1, u2) => {
  const d1 = parseUnit(u1);
  const d2 = parseUnit(u2);
  return Object.keys(d1).every(k => d1[k] === d2[k]) && Object.keys(d2).every(k => d1[k] === d2[k]);
};

const multiplyUnits = (u1, u2) => {
  const d1 = parseUnit(u1);
  const d2 = parseUnit(u2);
  let result = {...d1};
  for (let b in d2) {
    if (!result[b]) result[b] = 0;
    result[b] += d2[b];
  }
  for (let b in result) {
    if (result[b] === 0) delete result[b];
  }
  return toUnitString(result);
};

const divideUnits = (u1, u2) => {
  const d1 = parseUnit(u1);
  const d2 = parseUnit(u2);
  let result = {...d1};
  for (let b in d2) {
    if (!result[b]) result[b] = 0;
    result[b] -= d2[b];
  }
  for (let b in result) {
    if (result[b] === 0) delete result[b];
  }
  return toUnitString(result);
};

const powerUnits = (u, exp) => {
  const d = parseUnit(u);
  let result = {};
  for (let b in d) {
    result[b] = d[b] * exp;
  }
  return toUnitString(result);
};

var unaryOps = {

    sin: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('sin expects a number');
      if (!isDimensionless(unit)) throw new Error(`sin requires dimensionless argument`);
      return [Math.sin(val), '']
    },
    cos: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('cos expects a number');
      if (!isDimensionless(unit)) throw new Error(`cos requires dimensionless argument`);
      return [Math.cos(val), '']
    },
    tan: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('tan expects a number');
      if (!isDimensionless(unit)) throw new Error(`tan requires dimensionless argument`);
      return [Math.tan(val), '']
    },
    asin: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('asin expects a number');
      if (!isDimensionless(unit)) throw new Error(`asin requires dimensionless argument`);
      if (val > 1 || val < -1)
        throw new Error(`asin takes values between -1 and 1`)
      return [Math.asin(val), '']
    },
    acos: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('acos expects a number');
      if (!isDimensionless(unit)) throw new Error(`acos requires dimensionless argument`);
      if (val > 1 || val < -1)
        throw new Error(`acos takes values between -1 and 1`)
      return [Math.acos(val), '']
    },
    atan: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('atan expects a number');
      if (!isDimensionless(unit)) throw new Error(`atan requires dimensionless argument`);
      return [Math.atan(val), '']
    },
    sinh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('sinh expects a number');
      if (!isDimensionless(unit)) throw new Error(`sinh requires dimensionless argument`);
      return [Math.sinh(val), '']
    },
    cosh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('cosh expects a number');
      if (!isDimensionless(unit)) throw new Error(`cosh requires dimensionless argument`);
      return [Math.cosh(val), '']
    },
    tanh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('tanh expects a number');
      if (!isDimensionless(unit)) throw new Error(`tanh requires dimensionless argument`);
      return [Math.tanh(val), '']
    },
    asinh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('asinh expects a number');
      if (!isDimensionless(unit)) throw new Error(`asinh requires dimensionless argument`);
      return [Math.asinh(val), '']
    },
    acosh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('acosh expects a number');
      if (!isDimensionless(unit)) throw new Error(`acosh requires dimensionless argument`);
      return [Math.acosh(val), '']
    },
    atanh: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('atanh expects a number');
      if (!isDimensionless(unit)) throw new Error(`atanh requires dimensionless argument`);
      if (val > 1 || val < -1)
        throw new Error(`atanh takes values between -1 and 1`)
      return [Math.atanh(val), '']
    },
    sqrt: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('sqrt expects a number');
      if (val < 0)
        throw new Error(`sqrt needs positive  number argument`)
      return [Math.sqrt(val), powerUnits(unit, 0.5)]
    },
    cbrt: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('cbrt expects a number');
      return [Math.cbrt(val), powerUnits(unit, 1/3)]
    },
    log: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('log expects a number');
      if (!isDimensionless(unit)) throw new Error(`log requires dimensionless argument`);
      return [Math.log(val), '']
    },
    log2: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('log2 expects a number');
      if (!isDimensionless(unit)) throw new Error(`log2 requires dimensionless argument`);
      return [Math.log2(val), '']
    },
    ln: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('ln expects a number');
      if (!isDimensionless(unit)) throw new Error(`ln requires dimensionless argument`);
      return [Math.log(val), '']
    },
    log10: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('log10 expects a number');
      if (!isDimensionless(unit)) throw new Error(`log10 requires dimensionless argument`);
      return [Math.log10(val), '']
    },
    expm1: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('expm1 expects a number');
      if (!isDimensionless(unit)) throw new Error(`expm1 requires dimensionless argument`);
      return [Math.expm1(val), '']
    },
    log1p: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('log1p expects a number');
      if (!isDimensionless(unit)) throw new Error(`log1p requires dimensionless argument`);
      return [Math.log1p(val), '']
    },
    abs: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('abs expects a number');
      return [Math.abs(val), unit]
    },
    ceil: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('ceil expects a number');
      return [Math.ceil(val), unit]
    },
    floor: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('floor expects a number');
      return [Math.floor(val), unit]
    },
    round: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('round expects a number');
      return [Math.round(val), unit]
    },
    trunc: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('trunc expects a number');
      return [Math.trunc(val), unit]
    },
    '-': function(a) { 
      let [val, unit] = a;
      if (typeof val === 'number') {
        return [-val, unit];
      } else if (Array.isArray(val)) {
        return [val.map(v => -v), unit];
      } else {
        throw new Error('- expects number or vector');
      }
    },
    '+': function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number' && !Array.isArray(val)) {
        throw new Error('+ expects number or vector');
      }
      return [val, unit]
    },
    exp: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('exp expects a number');
      if (!isDimensionless(unit)) throw new Error(`exp requires dimensionless argument`);
      return [Math.exp(val), '']
    },
    not: function(a) {
      let [val, unit] = a;
      if (typeof val !== 'boolean') throw new Error('not expects a boolean');
      if (!isDimensionless(unit)) throw new Error(`not requires dimensionless argument`);
      return [!val, '']
    },
    length: function(a) { 
      let [val, unit] = a;
      if (!Array.isArray(val)) throw new Error('length expects a vector');
      return [val.length, '']
    },
    sign: function(a) { 
      let [val, unit] = a;
      if (typeof val !== 'number') throw new Error('sign expects a number');
      return [Math.sign(val), '']
    }
}

var binaryOps = {

    '+': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for addition`);
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (va.length !== vb.length) throw new Error('vectors to add must be same length');
        return [va.map((v, i) => v + vb[i]), ua];
      } else if (typeof va === 'number' && typeof vb === 'number') {
        return [va + vb, ua];
      } else {
        throw new Error('+ expects two numbers or two vectors');
      }
    },
    '-': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for subtraction`);
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (va.length !== vb.length) throw new Error('vectors to subtract must be same length');
        return [va.map((v, i) => v - vb[i]), ua];
      } else if (typeof va === 'number' && typeof vb === 'number') {
        return [va - vb, ua];
      } else {
        throw new Error('- expects two numbers or two vectors');
      }
    },
    '*': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      let u = multiplyUnits(ua, ub);
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (va.length !== 3 || vb.length !== 3) throw new Error('cross product vectors must be length 3');
        return [[
          va[1]*vb[2] - va[2]*vb[1],
          va[2]*vb[0] - va[0]*vb[2],
          va[0]*vb[1] - va[1]*vb[0]
        ], u];
      } else if (Array.isArray(va) && typeof vb === 'number') {
        return [va.map(v => v * vb), u];
      } else if (typeof va === 'number' && Array.isArray(vb)) {
        return [vb.map(v => va * v), u];
      } else if (typeof va === 'number' && typeof vb === 'number') {
        return [va * vb, u];
      } else {
        throw new Error('* expects numbers and/or vectors');
      }
    },
    '@': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (!Array.isArray(va) || !Array.isArray(vb)) throw new Error('@ expects two vectors');
      if (va.length !== vb.length) throw new Error('vectors must be equal length');
      let v = va.map((x, i) => x * vb[i]).reduce((m, n) => m + n, 0);
      let u = multiplyUnits(ua, ub);
      return [v, u]
    },
    '/': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (Array.isArray(va) && Array.isArray(vb))
        throw new Error(`/ is not defined for two vectors`)
      if (typeof vb !== 'number')
        throw new Error(`division requires scalar denominator`)
      let u = divideUnits(ua, ub);
      if (Array.isArray(va)) {
        return [va.map(x => x / vb), u]
      } else if (typeof va === 'number') {
        return [va / vb, u] 
      } else {
        throw new Error('/ expects number or vector numerator and number denominator');
      }
    },
    '%': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('% expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for %`);
      return [va % vb, ua] 
    },
    '^': function(a,b) {
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('^ expects two numbers');
      if (!isDimensionless(ub)) throw new Error(`Exponent must be dimensionless`);
      let v = Math.pow(va, vb);
      let u = powerUnits(ua, vb);
      return [v, u]
    },
    '==': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      let res;
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (!unitsEqual(ua, ub)) return [false, ''];
        res = array_comparator(va,vb) === 0;
      } else if (typeof va === 'number' && typeof vb === 'number') {
        if (!unitsEqual(ua, ub)) return [false, ''];
        res = va === vb;
      } else if (typeof va === 'boolean' && typeof vb === 'boolean') {
        if (!unitsEqual(ua, ub)) return [false, ''];
        res = va === vb;
      } else {
        throw new Error(`both arguments to == must be same type: vectors, numbers, or booleans`)
      }
      return [res, '']
    },
    '!=': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      let res;
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (!unitsEqual(ua, ub)) return [true, ''];
        res = array_comparator(va,vb) !== 0;
      } else if (typeof va === 'number' && typeof vb === 'number') {
        if (!unitsEqual(ua, ub)) return [true, ''];
        res = va !== vb;
      } else if (typeof va === 'boolean' && typeof vb === 'boolean') {
        if (!unitsEqual(ua, ub)) return [true, ''];
        res = va !== vb;
      } else {
        throw new Error(`both arguments to != must be same type: vectors, numbers, or booleans`)
      }
      return [res, '']
    },
    '>': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('> expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for >`);
      return [va > vb, '']
    },
    '<': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('< expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for <`);
      return [va < vb, '']
    },
    '>=': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('>= expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for >=`);
      return [va >= vb, '']
    },
    '<=': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('<= expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for <=`);
      return [va <= vb, '']
    },
    and: function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'boolean' || typeof vb !== 'boolean') throw new Error('and expects two booleans');
      if (!isDimensionless(ua) || !isDimensionless(ub)) throw new Error(`and requires dimensionless arguments`);
      return [va && vb, '']
    },
    or: function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'boolean' || typeof vb !== 'boolean') throw new Error('or expects two booleans');
      if (!isDimensionless(ua) || !isDimensionless(ub)) throw new Error(`or requires dimensionless arguments`);
      return [va || vb, '']
    }, 
    'in': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number') throw new Error('in expects number as first arg');
      if (!Array.isArray(vb)) throw new Error('in expects vector as second arg');
      if (!unitsEqual(ua, ub)) return [false, ''];
      return [vb.includes(va), '']
    },
    '[': function(a,b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (!Array.isArray(va)) throw new Error('[ expects vector as first arg');
      if (typeof vb !== 'number') throw new Error('[ expects number as second arg');
      if (!isDimensionless(ub)) throw new Error(`Index must be dimensionless`);
      return [va[vb | 0], ua]
    },
}

var ternaryOps = {

    '?': function(c,y,n) { 
      let [vc, uc] = c;
      let [vy, uy] = y;
      let [vn, un] = n;
      if (typeof vc !== 'boolean') throw new Error('? expects boolean condition');
      if (!isDimensionless(uc)) throw new Error(`Condition must be dimensionless`);
      let ty = Array.isArray(vy) ? 'vector' : typeof vy;
      let tn = Array.isArray(vn) ? 'vector' : typeof vn;
      if (ty !== tn)
        throw new Error(`2nd and 3rd args to ? op should be same type [${ty} != ${tn}]`)
      if (!unitsEqual(uy, un)) throw new Error(`Units must match for ? arms`);
      return vc ? y : n
    }
  }

var functions = {
  
    random: function(a) { 
      let [va, ua] = a;
      if (typeof va !== 'number') throw new Error('random expects a number');
      return [Math.random() * va, ua]
    },
    fac: function(a) { 
      let [va, ua] = a;
      if (typeof va !== 'number') throw new Error('fac expects a number');
      if (!isDimensionless(ua)) throw new Error(`fac requires dimensionless argument`);
      return [factorial(va), '']
    },
    min: function(...args) {
      if (args.length === 1 && Array.isArray(args[0][0])) {
        let [va, ua] = args[0];
        return [Math.min.apply(Math, va), ua]
      } else {
        let vals = args.map(a => a[0]);
        if (!vals.every(v => typeof v === 'number')) throw new Error('min expects numbers');
        let units = args.map(a => a[1]);
        let u = units[0];
        if (!units.every(ux => unitsEqual(ux, u))) throw new Error(`Units must match for min`);
        return [Math.min.apply(Math, vals), u]
      }
    },
    max: function(...args) {
      if (args.length === 1 && Array.isArray(args[0][0])) {
        let [va, ua] = args[0];
        return [Math.max.apply(Math, va), ua]
      } else {
        let vals = args.map(a => a[0]);
        if (!vals.every(v => typeof v === 'number')) throw new Error('max expects numbers');
        let units = args.map(a => a[1]);
        let u = units[0];
        if (!units.every(ux => unitsEqual(ux, u))) throw new Error(`Units must match for max`);
        return [Math.max.apply(Math, vals), u]
      }
    },
    hypot: function(...args) { 
      if (args.length === 1 && Array.isArray(args[0][0])) {
        let [va, ua] = args[0];
        return [Math.hypot.apply(Math, va), ua]
      } else {
        let vals = args.map(a => a[0]);
        if (!vals.every(v => typeof v === 'number')) throw new Error('hypot expects numbers');
        let units = args.map(a => a[1]);
        let u = units[0];
        if (!units.every(ux => unitsEqual(ux, u))) throw new Error(`Units must match for hypot`);
        return [Math.hypot.apply(Math, vals), u]
      }
    },
    atan2: function(a, b) { 
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('atan2 expects two numbers');
      if (!unitsEqual(ua, ub)) throw new Error(`Units must match for atan2`);
      return [Math.atan2(va, vb), '']
    },
    roundTo: function(a, b) {
      let [va, ua] = a;
      let [vb, ub] = b;
      if (typeof va !== 'number' || typeof vb !== 'number') throw new Error('roundTo expects two numbers');
      if (!isDimensionless(ub)) throw new Error(`roundTo exponent must be dimensionless`);
      return [roundTo(va, vb), ua]
    },
}

function arrayIndex(array, index) {

  return array[index | 0];
}

function contains(array, obj) {

  for (var i = 0; i < array.length; i++) {
    if (array[i] === obj) {
      return true;
    }
  }
  return false;
}

function factorial(a) { // a!

    return gamma(a + 1);
}
  
function stringOrArrayLength(s) {

    if (Array.isArray(s)) {
      return s.length;
    }
    return String(s).length;
}

function roundTo(value, exp) {

    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math.round(value);
    }
    value = +value;
    exp = -(+exp);
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}
  
function inOperator(a, b) {

  if (!Array.isArray(b))
    throw new Error(`'in' operator needs a vector, not [${typeof b}]`)
  return contains(b, a);
}

// Gamma function from math.js
function gamma(n) {
  var t, x;

  if (isInteger(n)) {
    if (n <= 0) {
      return isFinite(n) ? Infinity : NaN;
    }

    if (n > 171) {
      return Infinity; // Will overflow
    }

    var value = n - 2;
    var res = n - 1;
    while (value > 1) {
      res *= value;
      value--;
    }

    if (res === 0) {
      res = 1; // 0! is per definition 1
    }

    return res;
  }

  if (n < 0.5) {
    return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
  }

  if (n >= 171.35) {
    return Infinity; // will overflow
  }

  if (n > 85.0) { // Extended Stirling Approx
    var twoN = n * n;
    var threeN = twoN * n;
    var fourN = threeN * n;
    var fiveN = fourN * n;
    return Math.sqrt(2 * Math.PI / n) * Math.pow((n / Math.E), n) *
      (1 + (1 / (12 * n)) + (1 / (288 * twoN)) - (139 / (51840 * threeN)) -
      (571 / (2488320 * fourN)) + (163879 / (209018880 * fiveN)) +
      (5246819 / (75246796800 * fiveN * n)));
  }

  --n;
  x = GAMMA_P[0];
  for (var i = 1; i < GAMMA_P.length; ++i) {
    x += GAMMA_P[i] / (n + i);
  }

  t = n + GAMMA_G + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
}
function isInteger(value) {
  return isFinite(value) && (value === Math.round(value));
}

export { functions, unaryOps, binaryOps, ternaryOps, parseUnit, toUnitString, isDimensionless, 
          unitsEqual, multiplyUnits, divideUnits, powerUnits }