/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
*/

import _unit from './lib/UnitMath.js'
const unit = _unit.config({ precision: 8 })


export const BINARY_UNIT_OPERATORS = {
   '+': (a, b) => unit.add(a, b),
   '-': (a, b) => unit.sub(a, b),
   '*': (a, b) => unit.mul(a, b),
   '@': (a, b) => 1, 
   '/': (a, b) => unit.div(a, b),
   '%': (a, b) => unit.sub(a, b), // a % b,
   '^': (a, b) => unit.pow(a, b),
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
}

export const UNARY_UNIT_OPERATORS = {
   '+': (a) => a,
   '-': (a) => unit.mul(a, -1),
   '!': (a) => !a,
}


export const POSTFIX_PRECEDENCE = 13
