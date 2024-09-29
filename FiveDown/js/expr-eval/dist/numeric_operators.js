
var unaryOps = {

    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    asinh: Math.asinh,
    acosh: Math.acosh,
    atanh: Math.atanh,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    log: Math.log,
    log2: Math.log2,
    ln: Math.log,
    lg: Math.log10,
    log10: Math.log10,
    expm1: Math.expm1,
    log1p: Math.log1p,
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    trunc: Math.trunc,
    '-': (x) => -x,
    '+': Number,
    exp: Math.exp,
    not: (x) => !x,
    length: (x) => stringOrArrayLength(x),
    '!': (x) => factorial(x),
    sign: Math.sign
}

var binaryOps = {

    '+': (a,b) => add(a,b),
    '-': (a,b) => subtract(a,b),
    '*': (a,b) => product(a,b),
    '@': (a,b) => dot_product(a,b),
    '/': (a,b) => a / b,
    '%': (a,b) => a % b,
    '^': Math.pow,
    '==': (a,b) => a === b,
    '!=': (a,b) => a !== b,
    '>': (a,b) => a>b,
    '<': (a,b) => a<b,
    '>=': (a,b) => a>=b,
    '<=': (a,b) => a<=b,
    and: (a,b) => a && b,
    or: (a,b) => a || b,
    '||': (a,b) => a.concat(b),
    'in': (a,b) => inOperator(a,b),
//    '=': setVar,
//    '[': arrayIndex
}

var ternaryOps = {
    '?': (c,y,n) => c ? y : n
}

var functions = {
  
    random: Math.random,
    fac: factorial,
    min: min,
    max: max,
    hypot: Math.hypot,
    pow: Math.pow,
    atan2: Math.atan2,
//    'if': condition,
//    gamma: gamma,
    roundTo: roundTo,
//    map: arrayMap,
//    fold: arrayFold,
//    filter: arrayFilter,
//    indexOf: stringOrArrayIndexOf,
    join: arrayJoin
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
