
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
    '+': (a,b) => a+b,
    '-': (a,b) => a-b,
    '*': (a,b) => a*b,
    '/': (a,b) => a/b,
    '%': (a,b) => a%b,
    '^': Math.pow,
    '||': (a,b) => a.concat(b),
    '==': (a,b) => a === b,
    '!=': (a,b) => a !== b,
    '>': (a,b) => a>b,
    '<': (a,b) => a<b,
    '>=': (a,b) => a>=b,
    '<=': (a,b) => a<=b,
    and: (a,b) => a && b,
    or: (a,b) => a || b,
//    'in': inOperator,
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
  
      
  
export { functions, unaryOps, binaryOps, ternaryOps }
