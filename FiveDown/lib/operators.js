/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
 */
export const KEYWORDS = ['this'];
export const BINARY_OPERATORS = {
   '+': (a, b) => add(a, b),
   '-': (a, b) => subtract(a, b),
   '*': (a, b) => product(a, b),
   '@': (a, b) => dot_product(a, b), 
   '/': (a, b) => a / b,
   '%': (a, b) => a % b,
   '^': (a, b) => Math.pow(a,b),
   '==': (a, b) => a === b, // use shorter symbol, but stricter compare
   '!=': (a, b) => a !== b, // ditto
   '>': (a, b) => a > b,
   '>=': (a, b) => a >= b,
   '<': (a, b) => a < b,
   '<=': (a, b) => a <= b,
   '||': (a, b) => !!(a || b),
   '&&': (a, b) => !!(a && b),
//   '??': (a, b) => a ?? b,
//    '===': (a, b) => a === b,
//    '!==': (a, b) => a !== b,
//   '|': (a, f) => f(a),
//   '|>': (a, f) => f(a),
};
export const UNARY_OPERATORS = {
   '+': (a) => a,
   '-': (a) => product(-1, a),
   '!': (a) => !a,
};

export const PRECEDENCE = {
    '!': 0,
    ':': 0,
    ',': 0,
    ')': 0,
    ']': 0,
    '}': 0,
 //   '|>': 1,
    '?': 2,
 //   '??': 3,
    '||': 4,
    '&&': 5,
 //   '|': 6,
 //   '&': 8,
    // equality
    '!=': 9,
    '==': 9,
 //   '!==': 9,
 //   '===': 9,
    // relational
    '>=': 10,
    '>': 10,
    '<=': 10,
    '<': 10,
    // additive
    '+': 11,
    '-': 11,
    // multiplicative
    '%': 12,
    '/': 12,
    '*': 12,
    '@': 12,  // DVK: assumed
    '^': 13,
    // postfix
    '(': 13,
    '[': 13,
    '.': 13,
    '{': 13, // not sure this is correct
};

function add(a, b) {

   if (Array.isArray(a) && Array.isArray(b)) {

       if (a.length !== b.length) { throw new Error('vectors to add must be same length') }
       return a.map(function(_v, i) { return a[i]+b[i] })
   }
   else if (Number.isFinite(a) && Number.isFinite(b)) {
       return a + b
   }
   throw new Error('+ needs two numbers or two vectors')
}
function subtract(a, b) {

   if (Array.isArray(a) && Array.isArray(b)) {

       if (a.length !== b.length) { throw new Error('vectors to subtract must be same length') }
       return a.map(function(_v, i) { return a[i]-b[i] })
   }
   else if (Number.isFinite(a) && Number.isFinite(b)) {
       return a - b
   }
   throw new Error('- needs two numbers or two vectors')
}

function dot_product(a, b) {

   if (!Array.isArray(a) || !Array.isArray(b)) { throw new Error('dot product operates on vectors') }
   if (a.length !== b.length) { throw new Error('vectors must be equal length') }

   return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function cross_product(a, b) {

   if (!Array.isArray(a) || !Array.isArray(b)) { throw new Error('cross product operates on vectors') }
   if (a.length !== 3 || b.length !== 3) { throw new Error('vectors must be length 3') }

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

export const POSTFIX_PRECEDENCE = 13;
