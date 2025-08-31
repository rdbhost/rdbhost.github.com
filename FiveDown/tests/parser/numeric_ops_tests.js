import { unaryOps, binaryOps, functions } from '../../js/parser/numeric_ops.js';
import { Data } from '../../js/dim_data.js';

QUnit.module('numeric_ops', {
  beforeEach: function() {
    // Helper to create Data instances
    this.createData = (value, unit = '') => new Data(value, unit);
  }
});

QUnit.test('unaryOps -', function(assert) {
  const data = this.createData(5, 'm');
  const result = unaryOps['-'](data);
  assert.equal(result.val(), -5, 'Value negated');
  assert.equal(result.unit(), 'm', 'Unit preserved');

  const vecData = this.createData([1, 2, 3], 'cm');
  const vecResult = unaryOps['-'](vecData);
  assert.deepEqual(vecResult.val(), [-1, -2, -3], 'Vector negated');
  assert.equal(vecResult.unit(), 'cm', 'Unit preserved');
});

QUnit.test('unaryOps +', function(assert) {
  const data = this.createData(5, 'm');
  const result = unaryOps['+'](data);
  assert.equal(result.val(), 5, 'Value unchanged');
  assert.equal(result.unit(), 'm', 'Unit preserved');
});

QUnit.test('unaryOps not', function(assert) {
  const trueData = this.createData(true);
  const falseResult = unaryOps['not'](trueData);
  assert.equal(falseResult.val(), false, 'true negated to false');

  const falseData = this.createData(false);
  const trueResult = unaryOps['not'](falseData);
  assert.equal(trueResult.val(), true, 'false negated to true');

  assert.throws(() => unaryOps['not'](this.createData(true, 'unit')), /not unitless/, 'Throws on unit');
});

QUnit.test('binaryOps +', function(assert) {
  const a = this.createData(5, 'm');
  const b = this.createData(3, 'm');
  const result = binaryOps['+'](a, b);
  assert.equal(result.val(), 8, 'Scalar addition');
  assert.equal(result.unit(), 'm', 'Unit preserved');

  const vecA = this.createData([1, 2], 'cm');
  const vecB = this.createData([3, 4], 'cm');
  const vecResult = binaryOps['+'](vecA, vecB);
  assert.deepEqual(vecResult.val(), [4, 6], 'Vector addition');
  assert.equal(vecResult.unit(), 'cm', 'Unit preserved');

  assert.throws(() => binaryOps['+'](a, this.createData(3, 's')), /mismatch/, 'Throws on unit mismatch');
});

QUnit.test('binaryOps -', function(assert) {
  const a = this.createData(5, 'm');
  const b = this.createData(3, 'm');
  const result = binaryOps['-'](a, b);
  assert.equal(result.val(), 2, 'Scalar subtraction');
  assert.equal(result.unit(), 'm', 'Unit preserved');
});

QUnit.test('binaryOps * scalar', function(assert) {
  const a = this.createData(2);
  const b = this.createData(3);
  const result = binaryOps['*'](a, b);
  assert.equal(result.val(), 6, 'Scalar multiplication');
  assert.equal(result.unit(), '', 'Unit empty');
});

QUnit.test('binaryOps * scalar-vector', function(assert) {
  const a = this.createData(2);
  const b = this.createData([3, 4], 'm');
  const result = binaryOps['*'](a, b);
  assert.deepEqual(result.val(), [6, 8], 'Scalar-vector multiplication');
  assert.equal(result.unit(), 'm', 'Unit from vector');
});

QUnit.test('binaryOps * vector-vector (cross)', function(assert) {
  const a = this.createData([1, 2, 3], 'm');
  const b = this.createData([4, 5, 6], 's');
  const result = binaryOps['*'](a, b);
  assert.deepEqual(result.val(), [-3, 6, -3], 'Cross product');
  assert.equal(result.unit(), 'm*s', 'Derived unit');
});

QUnit.test('binaryOps /', function(assert) {
  const a = this.createData(6, 'm');
  const b = this.createData(2, 's');
  const result = binaryOps['/'](a, b);
  assert.equal(result.val(), 3, 'Scalar division');
  assert.equal(result.unit(), 'm/s', 'Derived unit');
});

QUnit.test('binaryOps / non-base', function(assert) {
  const a = this.createData(6, 'cm');
  const b = this.createData(2, 's');
  const result = binaryOps['/'](a, b);
  assert.equal(result.val(), 0.03, 'Scalar division');
  assert.equal(result.unit(), 'm/s', 'Derived unit');
});

QUnit.test('binaryOps %', function(assert) {
  const a = this.createData(5, 'm');
  const b = this.createData(3, 'm');
  const result = binaryOps['%'](a, b);
  assert.equal(result.val(), 2, 'Modulo');
  assert.equal(result.unit(), 'm', 'Unit preserved');
});

QUnit.test('binaryOps ^', function(assert) {
  const a = this.createData(2, 'm');
  const b = this.createData(3);
  const result = binaryOps['^'](a, b);
  assert.equal(result.val(), 8, 'Power');
  assert.equal(result.unit(), 'm^3', 'Derived unit');
});

QUnit.test('binaryOps @ (dot)', function(assert) {
  const a = this.createData([1, 2, 3], 'm');
  const b = this.createData([4, 5, 6], 'm');
  const result = binaryOps['@'](a, b);
  assert.equal(result.val(), 32, 'Dot product');
  assert.equal(result.unit(), 'm^2', 'Derived unit');

  const c = this.createData([4, 5, 6], 's');
  assert.throws(() => binaryOps['@'](a, c), /mismatch/, 'Throws on mixed units');
});

QUnit.test('binaryOps comparisons', function(assert) {
  const a = this.createData(3, 'm');
  const b = this.createData(5, 'cm');
  const greater = binaryOps['>'](a, b);
  assert.true(greater.val(), '3m > 5cm');
});

QUnit.test('binaryOps logical', function(assert) {
  const trueD = this.createData(true);
  const falseD = this.createData(false);
  assert.true(binaryOps['and'](trueD, trueD).val(), 'and true true');
  assert.false(binaryOps['and'](trueD, falseD).val(), 'and true false');
  // Similar for nand, or, xor
});

QUnit.test('binaryOps in', function(assert) {
  const a = this.createData(2);
  const b = this.createData([1, 2, 3]);
  assert.true(binaryOps['in'](a, b).val(), '2 in [1,2,3]');
});

QUnit.test('functions sin', function(assert) {
  const a = this.createData(Math.PI / 2);
  const result = functions['sin'](a);
  assert.ok(Math.abs(result.val() - 1) < 0.0001, 'sin(PI/2) ~ 1');
});

QUnit.test('functions sqrt', function(assert) {
  const a = this.createData(4, 'm^2');
  const result = functions['sqrt'](a);
  assert.equal(result.val(), 2, 'sqrt(4)');
  assert.equal(result.unit(), 'm', 'Derived unit m');
});

QUnit.test('functions min', function(assert) {
  const a = this.createData(5, 'm');
  const b = this.createData(3, 'm');
  const result = functions['min'](a, b);
  assert.equal(result.val(), 3, 'min(5,3) = 3');
  assert.equal(result.unit(), 'm', 'Unit preserved');
});

QUnit.test('functions length', function(assert) {
  const vec = this.createData([3, 4], 'm');
  const result = functions['length'](vec);
  assert.equal(result.val(), 5, 'length([3,4]) = 5');
  assert.equal(result.unit(), 'm', 'Unit preserved');
});

// Add more tests for other functions, ops as needed
