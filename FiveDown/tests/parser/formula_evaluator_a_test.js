// tests.js
// Note: This assumes formula_parser_a.js, formula_evaluator.js, and numeric_operators.js are in the same directory.
// For numeric_operators.js, use the following stub content to enable function tests like sin():
/*
export const unaryOps = {};
export const binaryOps = {};
export const ternaryOps = {};
export const functions = {
  sin: Math.sin,
  cos: Math.cos,
  max: (...args) => Math.max(...args)
};
*/

import { parseFormula } from '../../parser/formula_parser_a.js';
import { evaluate } from '../../parser/formula_evaluator_a.js';

QUnit.module('Formula Evaluator');

QUnit.test('Literal number', function (assert) {
  const ast = parseFormula('42');
  const result = evaluate(ast);
  assert.equal(result, 42, 'Evaluates number literal correctly');
});

QUnit.test('Literal boolean true', function (assert) {
  const ast = parseFormula('true');
  const result = evaluate(ast);
  assert.true(result, 'Evaluates true boolean literal');
});

QUnit.test('Literal boolean false', function (assert) {
  const ast = parseFormula('false');
  const result = evaluate(ast);
  assert.false(result, 'Evaluates false boolean literal');
});

QUnit.test('Variable with value', function (assert) {
  const ast = parseFormula('x');
  const result = evaluate(ast, { x: 5 });
  assert.equal(result, 5, 'Evaluates variable with provided value');
});

QUnit.test('Undefined variable throws error', function (assert) {
  const ast = parseFormula('x');
  assert.throws(() => evaluate(ast), /Undefined variable/, 'Throws error for undefined variable');
});

QUnit.test('Vector literal 2D', function (assert) {
  const ast = parseFormula('[1, 2]');
  const result = evaluate(ast);
  assert.deepEqual(result, [1, 2], 'Evaluates 2D vector literal');
});

QUnit.test('Vector literal 3D', function (assert) {
  const ast = parseFormula('[1, 2, 3]');
  const result = evaluate(ast);
  assert.deepEqual(result, [1, 2, 3], 'Evaluates 3D vector literal');
});

QUnit.test('Unary plus on number', function (assert) {
  const ast = parseFormula('+3');
  const result = evaluate(ast);
  assert.equal(result, 3, 'Evaluates unary plus on number');
});

QUnit.test('Unary minus on number', function (assert) {
  const ast = parseFormula('-3');
  const result = evaluate(ast);
  assert.equal(result, -3, 'Evaluates unary minus on number');
});

QUnit.test('Unary minus on vector', function (assert) {
  const ast = parseFormula('-[1, 2]');
  const result = evaluate(ast);
  assert.deepEqual(result, [-1, -2], 'Evaluates unary minus element-wise on vector');
});

QUnit.test('Unary not on boolean', function (assert) {
  const ast = parseFormula('not true');
  const result = evaluate(ast);
  assert.false(result, 'Evaluates unary not on boolean');
});

QUnit.test('Binary addition scalars', function (assert) {
  const ast = parseFormula('2 + 3');
  const result = evaluate(ast);
  assert.equal(result, 5, 'Evaluates scalar addition');
});

QUnit.test('Binary addition vector and scalar', function (assert) {
  const ast = parseFormula('[1, 2] + 3');
  const result = evaluate(ast);
  assert.deepEqual(result, [4, 5], 'Evaluates vector + scalar element-wise');
});

QUnit.test('Binary addition vectors', function (assert) {
  const ast = parseFormula('[1, 2] + [3, 4]');
  const result = evaluate(ast);
  assert.deepEqual(result, [4, 6], 'Evaluates vector + vector element-wise');
});

QUnit.test('Binary subtraction scalars', function (assert) {
  const ast = parseFormula('5 - 2');
  const result = evaluate(ast);
  assert.equal(result, 3, 'Evaluates scalar subtraction');
});

QUnit.test('Binary multiplication scalars', function (assert) {
  const ast = parseFormula('4 * 2');
  const result = evaluate(ast);
  assert.equal(result, 8, 'Evaluates scalar multiplication');
});

QUnit.test('Binary division scalars', function (assert) {
  const ast = parseFormula('10 / 2');
  const result = evaluate(ast);
  assert.equal(result, 5, 'Evaluates scalar division');
});

QUnit.test('Binary modulus scalars', function (assert) {
  const ast = parseFormula('10 % 3');
  const result = evaluate(ast);
  assert.equal(result, 1, 'Evaluates scalar modulus');
});

QUnit.test('Binary power scalars', function (assert) {
  const ast = parseFormula('2 ^ 3');
  const result = evaluate(ast);
  assert.equal(result, 8, 'Evaluates scalar power');
});

QUnit.test('Binary power vectors', function (assert) {
  const ast = parseFormula('[2, 3] ^ 2');
  const result = evaluate(ast);
  assert.deepEqual(result, [4, 9], 'Evaluates vector power element-wise');
});

QUnit.test('Dot product vectors', function (assert) {
  const ast = parseFormula('[1, 2] @ [3, 4]');
  const result = evaluate(ast);
  assert.equal(result, 11, 'Evaluates vector dot product');
});

QUnit.test('Dot product mismatch lengths throws error', function (assert) {
  const ast = parseFormula('[1, 2] @ [3, 4, 5]');
  assert.throws(() => evaluate(ast), /Vector lengths do not match/, 'Throws error for dot product length mismatch');
});

QUnit.test('Comparison less than', function (assert) {
  const ast = parseFormula('2 < 3');
  const result = evaluate(ast);
  assert.true(result, 'Evaluates < comparison');
});

QUnit.test('Comparison equal', function (assert) {
  const ast = parseFormula('5 == 5');
  const result = evaluate(ast);
  assert.true(result, 'Evaluates == comparison');
});

QUnit.test('Logical and', function (assert) {
  const ast = parseFormula('true and false');
  const result = evaluate(ast);
  assert.false(result, 'Evaluates logical and');
});

QUnit.test('Logical or', function (assert) {
  const ast = parseFormula('true or false');
  const result = evaluate(ast);
  assert.true(result, 'Evaluates logical or');
});

QUnit.test('Ternary true branch', function (assert) {
  const ast = parseFormula('1 > 0 ? 5 : 6');
  const result = evaluate(ast);
  assert.equal(result, 5, 'Evaluates ternary true branch');
});

QUnit.test('Ternary false branch', function (assert) {
  const ast = parseFormula('1 < 0 ? 5 : 6');
  const result = evaluate(ast);
  assert.equal(result, 6, 'Evaluates ternary false branch');
});

QUnit.test('Ternary non-boolean condition throws error', function (assert) {
  const ast = parseFormula('42 ? 5 : 6');
  assert.throws(() => evaluate(ast), /Ternary condition must evaluate to a boolean/, 'Throws error for non-boolean ternary condition');
});

QUnit.test('In operator with array', function (assert) {
  const ast = parseFormula('2 in [1, 2, 3]');
  const result = evaluate(ast);
  assert.true(result, 'Evaluates in operator true');
});

QUnit.test('In operator false', function (assert) {
  const ast = parseFormula('4 in [1, 2, 3]');
  const result = evaluate(ast);
  assert.false(result, 'Evaluates in operator false');
});

QUnit.test('In operator non-array throws error', function (assert) {
  const ast = parseFormula('2 in 5');
  assert.throws(() => evaluate(ast), /Right side of "in" must be an array/, 'Throws error for non-array in right side');
});

QUnit.test('Array indexing', function (assert) {
  const ast = parseFormula('arr[1]');
  const result = evaluate(ast, { arr: [10, 20, 30] });
  assert.equal(result, 20, 'Evaluates array indexing');
});

QUnit.test('Array indexing non-array throws error', function (assert) {
  const ast = parseFormula('x[1]');
  assert.throws(() => evaluate(ast, { x: 5 }), /Cannot index non-array/, 'Throws error for indexing non-array');
});

QUnit.test('Array indexing non-integer index throws error', function (assert) {
  const ast = parseFormula('arr[1.5]');
  assert.throws(() => evaluate(ast, { arr: [10, 20] }), /Index must be an integer/, 'Throws error for non-integer index');
});

QUnit.test('Array indexing out of bounds throws error', function (assert) {
  const ast = parseFormula('arr[2]');
  assert.throws(() => evaluate(ast, { arr: [10, 20] }), /Index out of bounds/, 'Throws error for out-of-bounds index');
});

QUnit.test('Function call sin', function (assert) {
  const ast = parseFormula('sin(0)');
  const result = evaluate(ast);
  assert.equal(result, 0, 'Evaluates sin function');
});

QUnit.test('Function call max', function (assert) {
  const ast = parseFormula('max(1, 3, 2)');
  const result = evaluate(ast);
  assert.equal(result, 3, 'Evaluates max function with multiple args');
});

QUnit.test('Unknown function throws error', function (assert) {
  const ast = parseFormula('unknown(1)');
  assert.throws(() => evaluate(ast), /Unknown function/, 'Throws error for unknown function');
});

QUnit.test('Complex expression with variables and vectors', function (assert) {
  const ast = parseFormula('a + [b, c] ^ 2');
  const result = evaluate(ast, { a: 1, b: 2, c: 3 });
  assert.deepEqual(result, [1 + 4, 1 + 9], 'Evaluates complex mixed expression');
});