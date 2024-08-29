/*
 * @license
 * Portions Copyright (c) 2013, the Dart project authors.
*/

import _unit from './UnitMath.js'
const unit = _unit.config({ precision: 8 })


export const BINARY_UNIT_OPERATORS = {
   '+': (a, b) => unit.add(a, b),
   '-': (a, b) => unit.subtract(a, b),
   '*': (a, b) => unit.multiply(a, b),
   '@': (a, b) => 1, 
   '/': (a, b) => unit.divide(a, b),
   '%': (a, b) => unit.subtract(a, b), // a % b,
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
   '-': (a) => unit.multiply(a, -1),
   '!': (a) => !a,
}


export const POSTFIX_PRECEDENCE = 13
