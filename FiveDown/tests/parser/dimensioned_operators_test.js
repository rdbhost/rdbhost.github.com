// tests.js

// Assuming the module is imported or available in global scope via script tag
// For testing, we'll assume unaryOps, binaryOps, ternaryOps, functions are global or we can access them.

import { unaryOps, binaryOps, ternaryOps, functions, parseUnit,toUnitString, isDimensionless, 
          unitsEqual, multiplyUnits, divideUnits, powerUnits } from '../../js/parser/dimensioned_operators.js'

// In a real module, you'd use import, but since it's script tags, we'll assume they are exported to window.

QUnit.module('Unary Operations', function() {

  QUnit.test('sin', function(assert) {
    let result = unaryOps.sin([Math.PI / 2, '']);
    assert.deepEqual(result, [1, ''], 'sin of PI/2 dimensionless');

    assert.throws(function() { unaryOps.sin([1, 'm']); }, /dimensionless/, 'throws on unit');
    assert.throws(function() { unaryOps.sin([[1], '']); }, /number/, 'throws on vector');
  });

  QUnit.test('cos', function(assert) {
    let result = unaryOps.cos([0, '']);
    assert.deepEqual(result, [1, ''], 'cos of 0 dimensionless');

    assert.throws(function() { unaryOps.cos([0, 'rad']); }, /dimensionless/, 'throws on unit');
  });

  QUnit.test('tan', function(assert) {
    let result = unaryOps.tan([0, '']);
    assert.deepEqual(result, [0, ''], 'tan of 0 dimensionless');
  });

  QUnit.test('asin', function(assert) {
    let result = unaryOps.asin([0, '']);
    assert.deepEqual(result, [0, ''], 'asin of 0');

    assert.throws(function() { unaryOps.asin([2, '']); }, /between -1 and 1/, 'throws on out of range');
  });

  QUnit.test('acos', function(assert) {
    let result = unaryOps.acos([1, '']);
    assert.deepEqual(result, [0, ''], 'acos of 1');
  });

  QUnit.test('atan', function(assert) {
    let result = unaryOps.atan([0, '']);
    assert.deepEqual(result, [0, ''], 'atan of 0');
  });

  QUnit.test('sinh', function(assert) {
    let result = unaryOps.sinh([0, '']);
    assert.deepEqual(result, [0, ''], 'sinh of 0');
  });

  QUnit.test('cosh', function(assert) {
    let result = unaryOps.cosh([0, '']);
    assert.deepEqual(result, [1, ''], 'cosh of 0');
  });

  QUnit.test('tanh', function(assert) {
    let result = unaryOps.tanh([0, '']);
    assert.deepEqual(result, [0, ''], 'tanh of 0');
  });

  QUnit.test('asinh', function(assert) {
    let result = unaryOps.asinh([0, '']);
    assert.deepEqual(result, [0, ''], 'asinh of 0');
  });

  QUnit.test('acosh', function(assert) {
    let result = unaryOps.acosh([1, '']);
    assert.deepEqual(result, [0, ''], 'acosh of 1');
  });

  QUnit.test('atanh', function(assert) {
    let result = unaryOps.atanh([0, '']);
    assert.deepEqual(result, [0, ''], 'atanh of 0');

    assert.throws(function() { unaryOps.atanh([2, '']); }, /between -1 and 1/, 'throws on out of range');
  });

  QUnit.test('sqrt', function(assert) {
    let result = unaryOps.sqrt([4, 'm^2']);
    assert.deepEqual(result, [2, 'm'], 'sqrt of 4 m^2');

    assert.throws(function() { unaryOps.sqrt([-1, '']); }, /positive/, 'throws on negative');
  });

  QUnit.test('cbrt', function(assert) {
    let result = unaryOps.cbrt([8, 'm^3']);
    assert.deepEqual(result, [2, 'm'], 'cbrt of 8 m^3');
  });

  QUnit.test('log', function(assert) {
    let result = unaryOps.log([Math.E, '']);
    assert.deepEqual(result, [1, ''], 'log of e');
  });

  QUnit.test('log2', function(assert) {
    let result = unaryOps.log2([2, '']);
    assert.deepEqual(result, [1, ''], 'log2 of 2');
  });

  QUnit.test('ln', function(assert) {
    let result = unaryOps.ln([Math.E, '']);
    assert.deepEqual(result, [1, ''], 'ln of e');
  });

  QUnit.test('log10', function(assert) {
    let result = unaryOps.log10([10, '']);
    assert.deepEqual(result, [1, ''], 'log10 of 10');
  });

  QUnit.test('expm1', function(assert) {
    let result = unaryOps.expm1([0, '']);
    assert.deepEqual(result, [0, ''], 'expm1 of 0');
  });

  QUnit.test('log1p', function(assert) {
    let result = unaryOps.log1p([0, '']);
    assert.deepEqual(result, [0, ''], 'log1p of 0');
  });

  QUnit.test('abs', function(assert) {
    let result = unaryOps.abs([-5, 'm']);
    assert.deepEqual(result, [5, 'm'], 'abs of -5 m');
  });

  QUnit.test('ceil', function(assert) {
    let result = unaryOps.ceil([1.2, 's']);
    assert.deepEqual(result, [2, 's'], 'ceil of 1.2 s');
  });

  QUnit.test('floor', function(assert) {
    let result = unaryOps.floor([1.8, 'kg']);
    assert.deepEqual(result, [1, 'kg'], 'floor of 1.8 kg');
  });

  QUnit.test('round', function(assert) {
    let result = unaryOps.round([1.5, 'm']);
    assert.deepEqual(result, [2, 'm'], 'round of 1.5 m');
  });

  QUnit.test('trunc', function(assert) {
    let result = unaryOps.trunc([1.9, '']);
    assert.deepEqual(result, [1, ''], 'trunc of 1.9');
  });

  QUnit.test('unary minus', function(assert) {
    let result = unaryOps['-']([5, 'm']);
    assert.deepEqual(result, [-5, 'm'], 'unary minus number');

    result = unaryOps['-']([[1,2,3], 'm']);
    assert.deepEqual(result, [[-1,-2,-3], 'm'], 'unary minus vector');
  });

  QUnit.test('unary plus', function(assert) {
    let result = unaryOps['+']([5, 'm']);
    assert.deepEqual(result, [5, 'm'], 'unary plus number');
  });

  QUnit.test('exp', function(assert) {
    let result = unaryOps.exp([0, '']);
    assert.deepEqual(result, [1, ''], 'exp of 0');
  });

  QUnit.test('not', function(assert) {
    let result = unaryOps.not([true, '']);
    assert.deepEqual(result, [false, ''], 'not true');
  });

  QUnit.test('length', function(assert) {
    let result = unaryOps.length([[1,2,3], 'm']);
    assert.deepEqual(result, [3, ''], 'length of vector');
  });

  QUnit.test('sign', function(assert) {
    let result = unaryOps.sign([ -5, 'm']);
    assert.deepEqual(result, [-1, ''], 'sign of -5');
  });

});

QUnit.module('Binary Operations', function() {

  QUnit.test('+', function(assert) {
    let result = binaryOps['+']([1, 'm'], [2, 'm']);
    assert.deepEqual(result, [3, 'm'], 'add numbers same unit');

    result = binaryOps['+']([[1,2], 'm'], [[3,4], 'm']);
    assert.deepEqual(result, [[4,6], 'm'], 'add vectors');

    assert.throws(function() { binaryOps['+']([1, 'm'], [2, 's']); }, /match/, 'different units');
  });

  QUnit.test('-', function(assert) {
    let result = binaryOps['-']([3, 'm'], [1, 'm']);
    assert.deepEqual(result, [2, 'm'], 'subtract numbers');
  });

  QUnit.test('*', function(assert) {
    let result = binaryOps['*']([2, ''], [3, 'm']);
    assert.deepEqual(result, [6, 'm'], 'scalar * scalar');

    result = binaryOps['*']([2, ''], [[1,2,3], 'm']);
    assert.deepEqual(result, [[2,4,6], 'm'], 'scalar * vector');

    result = binaryOps['*']([[1,0,0], 'm'], [[0,1,0], 'm']);
    assert.deepEqual(result, [[0,0,1], 'm^2'], 'cross product'); // Actually [0,0,1] m^2? Wait, unit multiply.
  });

  QUnit.test('@ (dot product)', function(assert) {
    let result = binaryOps['@']([[1,2,3], 'm'], [[4,5,6], 'm']);
    assert.deepEqual(result, [32, 'm^2'], 'dot product');
  });

  QUnit.test('/', function(assert) {
    let result = binaryOps['/']([10, 'm'], [2, '']);
    assert.deepEqual(result, [5, 'm'], 'divide scalar');

    result = binaryOps['/']([[10,20], 'm'], [2, '']);
    assert.deepEqual(result, [[5,10], 'm'], 'vector / scalar');
  });

  QUnit.test('%', function(assert) {
    let result = binaryOps['%']([10, 'm'], [3, 'm']);
    assert.deepEqual(result, [1, 'm'], 'modulo');
  });

  QUnit.test('^', function(assert) {
    let result = binaryOps['^']([2, 'm'], [3, '']);
    assert.deepEqual(result, [8, 'm^3'], 'power');
  });

  QUnit.test('==', function(assert) {
    let result = binaryOps['==']([5, 'm'], [5, 'm']);
    assert.deepEqual(result, [true, ''], 'equal numbers');

    result = binaryOps['==']([5, 'm'], [5, 's']);
    assert.deepEqual(result, [false, ''], 'different units');

    result = binaryOps['==']([[1,2], 'm'], [[1,2], 'm']);
    assert.deepEqual(result, [true, ''], 'equal vectors');
  });

  QUnit.test('!=', function(assert) {
    let result = binaryOps['!=']([5, 'm'], [6, 'm']);
    assert.deepEqual(result, [true, ''], 'not equal');
  });

  QUnit.test('>', function(assert) {
    let result = binaryOps['>']([5, 'm'], [4, 'm']);
    assert.deepEqual(result, [true, ''], 'greater');
  });

  QUnit.test('<', function(assert) {
    let result = binaryOps['<']([3, 'm'], [4, 'm']);
    assert.deepEqual(result, [true, ''], 'less');
  });

  QUnit.test('>=', function(assert) {
    let result = binaryOps['>=']([5, 'm'], [5, 'm']);
    assert.deepEqual(result, [true, ''], 'greater or equal');
  });

  QUnit.test('<=', function(assert) {
    let result = binaryOps['<=']([4, 'm'], [5, 'm']);
    assert.deepEqual(result, [true, ''], 'less or equal');
  });

  QUnit.test('and', function(assert) {
    let result = binaryOps.and([true, ''], [false, '']);
    assert.deepEqual(result, [false, ''], 'and');
  });

  QUnit.test('or', function(assert) {
    let result = binaryOps.or([true, ''], [false, '']);
    assert.deepEqual(result, [true, ''], 'or');
  });

  QUnit.test('in', function(assert) {
    let result = binaryOps['in']([2, ''], [[1,2,3], '']);
    assert.deepEqual(result, [true, ''], 'in');
    
    result = binaryOps['in']([2, 'm'], [[1,2,3], 's']);
    assert.deepEqual(result, [false, ''], 'different units');
  });

  QUnit.test('[ (index)', function(assert) {
    let result = binaryOps['[']([[1,2,3], 'm'], [1, '']);
    assert.deepEqual(result, [2, 'm'], 'index');
  });

});

QUnit.module('Ternary Operations', function() {

  QUnit.test('?', function(assert) {
    let result = ternaryOps['?']([true, ''], [5, 'm'], [10, 'm']);
    assert.deepEqual(result, [5, 'm'], 'true branch');

    result = ternaryOps['?']([false, ''], [5, 'm'], [10, 'm']);
    assert.deepEqual(result, [10, 'm'], 'false branch');

    assert.throws(function() { ternaryOps['?']([true, ''], [5, 'm'], [10, 's']); }, /match/, 'units mismatch');
  });

});

QUnit.module('Functions', function() {

  QUnit.test('random', function(assert) {
    let result = functions.random([10, 'm']);
    assert.ok(result[0] >= 0 && result[0] < 10, 'random value');
    assert.equal(result[1], 'm', 'unit preserved');
  });

  QUnit.test('fac', function(assert) {
    let result = functions.fac([5, '']);
    assert.deepEqual(result, [120, ''], 'factorial 5');
  });

  QUnit.test('min', function(assert) {
    let result = functions.min([3, 'm'], [1, 'm'], [2, 'm']);
    assert.deepEqual(result, [1, 'm'], 'min scalars');

    result = functions.min([[3,1,2], 'm']);
    assert.deepEqual(result, [1, 'm'], 'min vector');
  });

  QUnit.test('max', function(assert) {
    let result = functions.max([1, 'm'], [3, 'm'], [2, 'm']);
    assert.deepEqual(result, [3, 'm'], 'max scalars');
  });

  QUnit.test('hypot', function(assert) {
    let result = functions.hypot([3, 'm'], [4, 'm']);
    assert.deepEqual(result, [5, 'm'], 'hypot');
  });

  QUnit.test('atan2', function(assert) {
    let result = functions.atan2([1, ''], [1, '']);
    assert.deepEqual(result, [Math.PI/4, ''], 'atan2');
  });

  QUnit.test('roundTo', function(assert) {
    let result = functions.roundTo([123.456, 'm'], [2, '']);
    assert.deepEqual(result, [123.46, 'm'], 'roundTo');
  });

});

QUnit.module('Unit Helpers', function() {

  QUnit.test('parseUnit', function(assert) {
    let result = parseUnit('m^2/s');
    assert.deepEqual(result, {m: 2, s: -1}, 'parse m^2/s');
  });

  QUnit.test('toUnitString', function(assert) {
    let result = toUnitString({m: 2, s: -1});
    assert.equal(result, 'm^2/s', 'to string');
  });

  QUnit.test('isDimensionless', function(assert) {
    assert.true(isDimensionless(''), 'empty');
    assert.false(isDimensionless('m'), 'not empty');
  });

  QUnit.test('unitsEqual', function(assert) {
    assert.true(unitsEqual('m/s', 'm/s'), 'equal');
    assert.false(unitsEqual('m', 's'), 'not equal');
  });

  QUnit.test('multiplyUnits', function(assert) {
    let result = multiplyUnits('m', 's');
    assert.equal(result, 'm*s', 'multiply');
  });

  QUnit.test('divideUnits', function(assert) {
    let result = divideUnits('m', 's');
    assert.equal(result, 'm/s', 'divide');
  });

  QUnit.test('powerUnits', function(assert) {
    let result = powerUnits('m/s', 2);
    assert.equal(result, 'm^2/s^2', 'power');
  });

});