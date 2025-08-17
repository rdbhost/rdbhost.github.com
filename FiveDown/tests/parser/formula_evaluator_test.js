

// formula_evaluator_tests.js

import { parseFormula } from '../../parser/formula_parser.js';
import { evaluate } from '../../parser/formula_evaluator.js';

// QUnit test suite
QUnit.module('Evaluator Tests', function () {
  QUnit.test('Basic addition: 2 + 3', function (assert) {
    const formula = '2 + 3';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, 5, '2 + 3 evaluates to 5');
  });

  QUnit.test('Multiplication precedence: 2 + 3 * 4', function (assert) {
    const formula = '2 + 3 * 4';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, 14, '2 + 3 * 4 evaluates to 14');
  });

  QUnit.test('Division: 10 / 2', function (assert) {
    const formula = '10 / 2';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, 5, '10 / 2 evaluates to 5');
  });

  QUnit.test('Unary minus: -5 + 2', function (assert) {
    const formula = '-5 + 2';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, -3, '-5 + 2 evaluates to -3');
  });

  QUnit.test('Parentheses: (2 + 3) * 4', function (assert) {
    const formula = '(2 + 3) * 4';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, 20, '(2 + 3) * 4 evaluates to 20');
  });

  QUnit.test('Sin function: sin(0)', function (assert) {
    const formula = 'sin(0)';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.ok(Math.abs(result - 0) < 1e-10, 'sin(0) evaluates to 0');
  });

  QUnit.test('Cos function: cos(0)', function (assert) {
    const formula = 'cos(0)';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.ok(Math.abs(result - 1) < 1e-10, 'cos(0) evaluates to 1');
  });

  QUnit.test('Variable substitution: x + y', function (assert) {
    const formula = 'x + y';
    const ast = parseFormula(formula);
    const result = evaluate(ast, { x: 10, y: 20 });
    assert.equal(result, 30, 'x + y with x=10, y=20 evaluates to 30');
  });

  QUnit.test('Complex expression: x * sin(y) + 1', function (assert) {
    const formula = 'x * sin(y) + 1';
    const ast = parseFormula(formula);
    const result = evaluate(ast, { x: 2, y: Math.PI / 2 });
    assert.ok(Math.abs(result - 3) < 1e-10, 'x * sin(y) + 1 with x=2, y=π/2 evaluates to 3');
  });

  QUnit.test('Division by zero error: 10 / 0', function (assert) {
    const formula = '10 / 0';
    const ast = parseFormula(formula);
    assert.throws(
      () => evaluate(ast, {}),
      /Division by zero/,
      '10 / 0 throws division by zero error'
    );
  });

  QUnit.test('Undefined variable error: x + 5', function (assert) {
    const formula = 'x + 5';
    const ast = parseFormula(formula);
    assert.throws(
      () => evaluate(ast, {}),
      /Undefined variable: x/,
      'x + 5 with undefined x throws error'
    );
  });

  QUnit.test('Nested operations: 2 * (3 + 4 * (5 - 2))', function (assert) {
    const formula = '2 * (3 + 4 * (5 - 2))';
    const ast = parseFormula(formula);
    const result = evaluate(ast, {});
    assert.equal(result, 30, '2 * (3 + 4 * (5 - 2)) evaluates to 30');
  });

  QUnit.test('Unary minus with variable: -x * 2', function (assert) {
    const formula = '-x * 2';
    const ast = parseFormula(formula);
    const result = evaluate(ast, { x: 3 });
    assert.equal(result, -6, '-x * 2 with x=3 evaluates to -6');
  });

  QUnit.test('Function with variable: sin(x)', function (assert) {
    const formula = 'sin(x)';
    const ast = parseFormula(formula);
    const result = evaluate(ast, { x: 0 });
    assert.ok(Math.abs(result - 0) < 1e-10, 'sin(x) with x=0 evaluates to 0');
  });
});

