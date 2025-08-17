// formula_parser_test.js
// Test file for formula_parser using QUnit
// Assume this is run in a browser environment where QUnit is loaded via script.

// Import from formula_parser.js (adjust path as needed)
import { tokenizer, Parser, parseFormula } from '../../parser/formula_parser.js';

QUnit.module('formula_parser');

QUnit.test('tokenizer handles numbers, variables, operators, parens', assert => {
  const tokens = Array.from(tokenizer('2 + 3 * (a - 1.5)'));
  const expected = [
    { type: 'number', value: 2 },
    { type: 'operator', value: '+' },
    { type: 'number', value: 3 },
    { type: 'operator', value: '*' },
    { type: 'paren', value: '(' },
    { type: 'variable', value: 'a' },
    { type: 'operator', value: '-' },
    { type: 'number', value: 1.5 },
    { type: 'paren', value: ')' }
  ];
  assert.deepEqual(tokens, expected, 'Tokens match');
});

QUnit.test('tokenizer ignores whitespace', assert => {
  const tokens = Array.from(tokenizer(' 2 +  b  '));
  const expected = [
    { type: 'number', value: 2 },
    { type: 'operator', value: '+' },
    { type: 'variable', value: 'b' }
  ];
  assert.deepEqual(tokens, expected, 'Whitespace ignored');
});

QUnit.test('tokenizer throws for unknown char', assert => {
  assert.throws(() => Array.from(tokenizer('2 + ?')), new Error('Unknown character: ?'), 'Throws for unknown');
});

QUnit.test('parseFormula builds correct tree for simple expression', assert => {
  const tree = parseFormula('2 + 3');
  assert.strictEqual(tree.toString(), '(2 + 3)', 'Simple addition');
});

QUnit.test('parseFormula handles precedence and associativity', assert => {
  const tree = parseFormula('2 + 3 * 4');
  assert.strictEqual(tree.toString(), '(2 + (3 * 4))', 'Multiplication precedence');
});

QUnit.test('parseFormula handles parentheses', assert => {
  const tree = parseFormula('(2 + 3) * 4');
  assert.strictEqual(tree.toString(), '((2 + 3) * 4)', 'Parentheses override precedence');
});

QUnit.test('parseFormula with variables', assert => {
  const tree = parseFormula('a + b * c - d / 2');
  assert.strictEqual(tree.toString(), '((a + (b * c)) - (d / 2))', 'Variables and multiple ops');
});

QUnit.test('parseFormula throws for missing closing paren', assert => {
  assert.throws(() => parseFormula('(2 + 3'), new Error('Missing closing parenthesis'), 'Missing )');
});

QUnit.test('parseFormula throws for unexpected token', assert => {
  assert.throws(() => parseFormula('2 + +'), /Unexpected token/, 'Double operator');
});

QUnit.test('parseFormula handles floats and complex vars', assert => {
  const tree = parseFormula('1.5 * var123');
  assert.strictEqual(tree.toString(), '(1.5 * var123)', 'Float and alphanumeric var');
});

QUnit.test('parseFormula handles sin function', assert => {
  const tree = parseFormula('sin(3.14)');
  assert.strictEqual(tree.toString(), 'sin(3.14)', 'Simple sin');
});

QUnit.test('parseFormula handles cos function', assert => {
  const tree = parseFormula('cos(x)');
  assert.strictEqual(tree.toString(), 'cos(x)', 'Simple cos');
});

QUnit.test('parseFormula handles nested functions and ops', assert => {
  const tree = parseFormula('sin(2 * pi) + cos(0)');
  assert.strictEqual(tree.toString(), '(sin((2 * pi)) + cos(0))', 'Functions with ops');
});

QUnit.test('parseFormula handles unary minus with function', assert => {
  const tree = parseFormula('-sin(x)');
  assert.strictEqual(tree.toString(), '-sin(x)', 'Unary minus on sin');
});

QUnit.test('parseFormula throws for unknown function', assert => {
  assert.throws(() => parseFormula('tan(x)'), new Error('Unknown function: tan'), 'Unknown function');
});

QUnit.test('parseFormula throws for missing paren in function', assert => {
  assert.throws(() => parseFormula('sin(x'), new Error('Missing closing parenthesis'), 'Missing ) in sin');
});

QUnit.test('parseFormula handles function as part of larger expression', assert => {
  const tree = parseFormula('2 + sin(3) * 4');
  assert.strictEqual(tree.toString(), '(2 + (sin(3) * 4))', 'Function with precedence');
});