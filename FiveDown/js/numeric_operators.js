
function getType(a) {

  if ([true, false].indexOf(a) > -1)
    return 'boolean'

  if (Array.isArray(a)) {

    if (a.length < 2 || a.length > 3)
      throw new Error(`bad vector length ${a.length}`)

    let t = a.filter((x) => x+0 === x)
    if (t.length === a.length)
      return 'vector'

    throw new Error(`bad data ${typeof a}`)
  }

  if (a+0 === a)
    return 'number'

  throw new Error('bad input ${a}')
}

var unaryOps = {

    sin: function(a) { return Math.sin(a) },
    cos: function(a) { return Math.cos(a) },
    tan: function(a) { return Math.tan(a) },
    asin: function(a) { return Math.asin(a) },
    acos: function(a) { return Math.acos(a) },
    atan: function(a) { return Math.atan(a) },
    sinh: function(a) { return Math.sinh(a) },
    cosh: function(a) { return Math.cosh(a) },
    tanh: function(a) { return Math.tanh(a) },
    asinh: function(a) { return Math.asinh(a) },
    acosh: function(a) { return Math.acosh(a) },
    atanh: function(a) { return Math.atanh(a) },
    sqrt: function(a) { return Math.sqrt(a) },
    cbrt: function(a) { return Math.cbrt(a) },
    log: function(a) { return Math.log(a) },
    log2: function(a) { return Math.log2(a) },
    ln: function(a) { return Math.log(a) },
    lg: function(a) { return Math.log10(a) },
    log10: function(a) { return Math.log10(a) },
    expm1: function(a) { return Math.expm1(a) },
    log1p: function(a) { return Math.log1p(a) },
    abs: function(a) { return Math.abs(a) },
    ceil: function(a) { return Math.ceil(a) },
    floor: function(a) { return Math.floor(a) },
    round: function(a) { return Math.round(a) },
    trunc: function(a) { return Math.trunc(a) },
    '-': function(a) { return -1 * a },
    '+': function(a) { return 1 * a },
    exp: function(a) { return Math.exp(a) },
    not: (x) => !x,
    length: function(x) { return stringOrArrayLength(x) },
    '!': function(x) { return factorial(x) },
    sign: function(x) { return Math.sign(x) }
}

var binaryOps = {

    '+': (a,b) => add(a,b),
    '-': (a,b) => subtract(a,b),
    '*': (a,b) => product(a,b),
    '@': (a,b) => dot_product(a,b),
    '/': (a,b) => a / b,
    '%': (a,b) => a % b,
    '^': (a,b) => power(a,b),
    '==': (a,b) => a === b,
    '!=': (a,b) => a !== b,
    '>': (a,b) => a>b,
    '<': (a,b) => a<b,
    '>=': (a,b) => a>=b,
    '<=': (a,b) => a<=b,
    and: (a,b) => a && b,
    or: (a,b) => a || b,
//    '||': (a,b) => a.concat(b),
    'in': (a,b) => inOperator(a,b),
//    '=': setVar,
    '[': arrayIndex
}

var ternaryOps = {
    '?': (c,y,n) => c ? y : n
}

var functions = {
  
    random: function(a) { return Math.random(a) },
    fac: factorial,
    min: min,
    max: max,
    hypot: function(a) { return Math.hypot(a) },
    pow: (a,b) => power(a,b),
    atan2: function(a) { return Math.atan2(a) },
//    'if': condition,
//    gamma: gamma,
    roundTo: roundTo,
//    map: arrayMap,
//    fold: arrayFold,
//    filter: arrayFilter,
//    indexOf: stringOrArrayIndexOf,
    join: arrayJoin
}

function power(a,b) {

  let r = Math.pow(a,b)
  if (Number.isNaN(r))
    throw new Error(`bad arguments to ^ ${a} ${b}`)
  return r
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

function arrayJoin(sep, a) {

    if (!Array.isArray(a)) {
      throw new Error('Second argument to join is not an array');
    }
  
    return a.join(sep);
}
  
function inOperator(a, b) {

  if (!Array.isArray(b))
    throw new Error(`'in' operator needs a vector, not ${typeof b}`)
  return contains(b, a);
}

function max(array) {

    if (arguments.length === 1 && Array.isArray(array)) {
      return Math.max.apply(Math, array);
    } else {
      return Math.max.apply(Math, arguments);
    }
  }
  
function min(array) {

    if (arguments.length === 1 && Array.isArray(array)) {
      return Math.min.apply(Math, array);
    } else {
      return Math.min.apply(Math, arguments);
    }
}
  
function add(a, b) {

  if (Array.isArray(a) && Array.isArray(b)) {

      if (a.length !== b.length) 
        throw new Error('vectors to add must be same length') 

      return a.map(function(_v, i) { return a[i]+b[i] })
  }
  else if (Number.isFinite(a) && Number.isFinite(b)) {
      return a + b
  }
  throw new Error('+ needs two numbers or two vectors')
}
function subtract(a, b) {

  if (Array.isArray(a) && Array.isArray(b)) {

      if (a.length !== b.length) 
        throw new Error('vectors to subtract must be same length') 

      return a.map(function(_v, i) { return a[i]-b[i] })
  }
  else if (Number.isFinite(a) && Number.isFinite(b)) {
      return a - b
  }
  throw new Error('- needs two numbers or two vectors')
}

function dot_product(a, b) {

  if (!Array.isArray(a) || !Array.isArray(b)) 
     throw new Error('dot product operates on vectors') 
  if (a.length !== b.length) 
     throw new Error('vectors must be equal length') 

  return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function cross_product(a, b) {

  if (!Array.isArray(a) || !Array.isArray(b)) 
     throw new Error('cross product operates on vectors') 
  if (a.length !== 3 || b.length !== 3) 
     throw new Error('vectors must be length 3') 

  return [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0],
  ]
}

function scalar_multiply(a, b) {

  return b.map(function(v) { return a*v })
}

function product(a, b) {

  if (Array.isArray(a) && Array.isArray(b)) {
      return cross_product(a,b)
  }
  else if (Array.isArray(a) && Number.isFinite(b)) {
      return scalar_multiply(b,a)
  }
  else if (Number.isFinite(a) && Array.isArray(b)) {
      return scalar_multiply(a,b)
  }
  else if (Number.isFinite(a) && Number.isFinite(b)) {
      return a * b
  }
}

  
export { functions, unaryOps, binaryOps, ternaryOps }
