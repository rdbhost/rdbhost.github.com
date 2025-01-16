
function getType(a) {

  if ([true, false].indexOf(a) > -1)
    return 'boolean'

  if (Array.isArray(a)) {

    if (a.length < 2 || a.length > 3)
      throw new Error(`bad vector length ${a.length}`)

    let t = a.filter((x) => x+0 === x)
    if (t.length === a.length)
      return 'vector'

    throw new Error(`bad data type [${typeof a}]`)
  }

  if (a+0 === a)
    return 'number'

  return 'text'
  // throw new Error(`bad input ${a}`)
}

function validateTypes(types, okTypes, warn) {

  if (!Array.isArray(types))
    types = [types,]
  if (!Array.isArray(okTypes))
    throw new Error(`not an array: ${okTypes}`)
  types.forEach(function(t) {
    if (okTypes.indexOf(t) === -1) {
      if (!warn) 
        warn = `data provided with ineligible type [${t}]`
      throw new Error(warn)
    }
  })
}

function array_comparitor(a,b) {
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

var unaryOps = {

    sin: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.sin(a) 
    },
    cos: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.cos(a) 
    },
    tan: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.tan(a) 
    },
    asin: function(a) { 
      validateTypes(getType(a), ['number'])
      if (a > 1 || a < -1)
        throw new Error(`asin takes values between -1 and 1`)
      return Math.asin(a) 
    },
    acos: function(a) { 
      validateTypes(getType(a), ['number'])
      if (a > 1 || a < -1)
        throw new Error(`acos takes values between -1 and 1`)
      return Math.acos(a) 
    },
    atan: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.atan(a) 
    },
    sinh: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.sinh(a) 
    },
    cosh: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.cosh(a) 
    },
    tanh: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.tanh(a) 
    },
    asinh: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.asinh(a) 
    },
    acosh: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.acosh(a) 
    },
    atanh: function(a) { 
      validateTypes(getType(a), ['number'])
      if (a > 1 || a < -1)
        throw new Error(`atanh takes values between -1 and 1`)
      return Math.atanh(a) 
    },
    sqrt: function(a) { 
      validateTypes(getType(a), ['number'])
      if (a < 0)
        throw new Error(`sqrt needs positive  number argument`)
      return Math.sqrt(a) 
    },
    cbrt: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.cbrt(a) 
    },
    log: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.log(a) 
    },
    log2: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.log2(a) 
    },
    ln: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.log(a) 
    },
    log10: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.log10(a) 
    },
    expm1: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.expm1(a) 
    },
    log1p: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.log1p(a) 
    },
    abs: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.abs(a) 
    },
    ceil: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.ceil(a) 
    },
    floor: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.floor(a) 
    },
    round: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.round(a) 
    },
    trunc: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.trunc(a) 
    },
    '-': function(a) { 
      validateTypes(getType(a), ['number', 'vector'])
      return product(-1,a) 
    },
    '+': function(a) { 
      validateTypes(getType(a), ['number', 'vector'])
      return product(1,a) 
    },
    exp: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.exp(a) 
    },
    not: function(a) {
      validateTypes(getType(a), ['boolean'])
      return !a
    },
    length: function(a) { 
      validateTypes(getType(a), ['vector'])
      return stringOrArrayLength(a) 
    },
/*    '!': function(a) { 
      validateTypes(getType(a), ['number'])
      return factorial(a) 
    }, */
    sign: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.sign(a) 
    }
}

var binaryOps = {

    '+': function(a,b) { 
      validateTypes([getType(a), getType(b)], ['number', 'vector'])
      return add(a,b) 
    },
    '-': function(a,b) { 
      validateTypes([getType(a), getType(b)], ['number', 'vector'])
      return subtract(a,b) 
    },
    '*': function(a,b) { 
      validateTypes([getType(a), getType(b)], ['number', 'vector'])
      return product(a,b) 
    },
    '@': function(a,b) { 
      validateTypes([getType(a), getType(b)], ['vector'])
      return dot_product(a,b) 
    },
    '/': function(a,b) { 
      let ta = getType(a), tb = getType(b)
      validateTypes([ta, tb], ['number', 'vector'])
      if (ta === tb && ta === 'vector')
        throw new Error(`/ is not defined for two vectors`)
      if (tb === 'vector')
        throw new Error(`scalar / vector is not defined`)
      if (ta === 'vector')
        return binaryOps['*'](1/b, a)
      return a / b 
    },
    '%': function(a,b) { 
      validateTypes([getType(a), getType(b)], ['number'])
      return a % b 
    },
    '^': function(a,b) {
      validateTypes([getType(a), getType(b)], ['number'])
      return Math.pow(a,b)
    },
    '==': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number', 'vector', 'boolean'])
      if (ta !== tb)
        throw new Error(`both arguments to == must be vector, or both numbers or both boolean`)
      if (ta === 'vector')
        return array_comparitor(a,b) === 0
      return a === b 
    },
    '!=': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number', 'vector', 'boolean'])
      if (ta !== tb)
        throw new Error(`both arguments to != must be vector, or both numbers or both boolean`)
      if (ta === 'vector')
        return array_comparitor(a,b) !== 0
      return a !== b 
    },
    '>': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number'])
//      if (ta !== tb)
//        throw new Error(`both arguments to > must be vector, or both numbers`)
      return a>b 
    },
    '<': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number'])
//      if (ta !== tb)
//        throw new Error(`both arguments to < must be vector, or both numbers`)
      return a<b 
    },
    '>=': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number'])
//      if (ta !== tb)
//        throw new Error(`both arguments to >= must be vectors, or both numbers`)
      return a>=b 
    },
    '<=': function(a,b) { 
      let ta = getType(a),
          tb = getType(b)
      validateTypes([ta, tb], ['number'])
//      if (ta !== tb)
//        throw new Error(`both arguments to <= must be vectors, or both numbers`)
      return a<=b 
    },
    and: function(a,b) { 
      validateTypes([getType(a), getType(b)], ['boolean'])
      return a && b 
    },
    or: function(a,b) { 
      validateTypes([getType(a), getType(b)], ['boolean'])
      return a || b 
    }, 
//    '||': function(a,b) { return a.concat(b) },
    'in': function(a,b) { 
      validateTypes(getType(a), ['number'])
      validateTypes(getType(b), ['vector'])
      return inOperator(a,b) 
    },
//    '=': setVar,
    '[': function(a,b) { 
      validateTypes(getType(a), ['vector'])
      validateTypes(getType(b), ['number'])
      return arrayIndex(a,b) 
    },
}

var ternaryOps = {

    '?': function(c,y,n) { 
      validateTypes(getType(c), ['boolean'])
      if (getType(y) !== getType(n))
        throw new Error(`2nd and 3rd args to ? op should be same type [${getType(y)} != ${getType(n)}]`)
      return c ? y : n
    }
  }

var functions = {
  
    random: function(a) { 
      validateTypes(getType(a), ['number'])
      return Math.random(a) 
    },
    fac: function(a) { 
      validateTypes(getType(a), ['number'])
      return factorial(a)
    },
    min: function(array) {

      if (arguments.length === 1 && Array.isArray(array)) {
      
        return min.apply(Math, array)
      } 
      else {
  
        let types = Array.from(arguments).map(function(a) { return getType(a) })
        validateTypes(types, ['number'])
        return Math.min.apply(Math, arguments)
      }
    },
    max: function(array) {
      if (arguments.length === 1 && Array.isArray(array)) {
      
        return max.apply(Math, array)
      } 
      else {
  
        let types = Array.from(arguments).map(function(a) { return getType(a) })
        validateTypes(types, ['number'])
        return Math.max.apply(Math, arguments)
      }
    },
    hypot: function hypot(array) { 
      if (arguments.length === 1 && Array.isArray(array)) {
      
        return hypot.apply(Math, array)
      } 
      else {
  
        let types = Array.from(arguments).map(function(a) { return getType(a) })
        validateTypes(types, ['number'])
        return Math.hypot.apply(Math, arguments) 
      }
    },
//    pow: (a,b) => power(a,b),
    atan2: function(a, b) { 
      validateTypes([getType(a),getType(b)], ['number'])
      return Math.atan2(a, b) 
    },
//    'if': condition,
//    gamma: gamma,
    roundTo: function(a, b) {
      validateTypes([getType(a), getType(b)], ['number'])
      return roundTo(a,b)
    },
//    map: arrayMap,
//    fold: arrayFold,
//    filter: arrayFilter,
//    indexOf: stringOrArrayIndexOf,
//    join: arrayJoin
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
/*
function arrayJoin(sep, a) {

    if (!Array.isArray(a)) {
      throw new Error('Second argument to join is not an array');
    }
  
    return a.join(sep);
} */
  
function inOperator(a, b) {

  if (!Array.isArray(b))
    throw new Error(`'in' operator needs a vector, not [${typeof b}]`)
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
     throw new Error('cross product vectors must be length 3') 

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



  
export { functions, unaryOps, binaryOps, ternaryOps }
