// tests/formula_parser_tests.js

import { parseFormula, AST } from '../../js/parser/formula_parser.js';

QUnit.module('Formula Parser');

QUnit.test('returns AST instance', function(assert) {
  const ast = parseFormula('42');
  assert.ok(ast instanceof AST);
});

function parse(str) {
  return parseFormula(str).root;
}

function literal(value) {
  return { type: 'Literal', value };
}

function variable(name) {
  return { type: 'Variable', name };
}

function vector(elements) {
  return { type: 'Vector', elements };
}

function unary(operator, operand) {
  return { type: 'Unary', operator, operand };
}

function binary(operator, left, right) {
  return { type: 'Binary', operator, left, right };
}

function ternary(condition, trueExpr, falseExpr) {
  return { type: 'Ternary', operator: '?', condition, trueExpr, falseExpr };
}

function functionCall(name, args) {
  return { type: 'FunctionCall', name, arguments: args };
}

QUnit.module('literals');

QUnit.test('parses positive integer', function(assert) {
  assert.deepEqual(parse('42'), literal(42));
});

QUnit.test('parses positive float', function(assert) {
  assert.deepEqual(parse('3.14'), literal(3.14));
});

QUnit.test('parses negative integer', function(assert) {
  assert.deepEqual(parse('-5'), literal(-5));
});

QUnit.test('parses positive signed integer', function(assert) {
  assert.deepEqual(parse('+5'), literal(5));
});

QUnit.test('parses scientific notation', function(assert) {
  assert.deepEqual(parse('1e3'), literal(1000));
  assert.deepEqual(parse('1.2E-3'), literal(0.0012));
  assert.deepEqual(parse('-2.5e+2'), literal(-250));
});

QUnit.test('parses booleans case-insensitively', function(assert) {
  assert.deepEqual(parse('true'), literal(true));
  assert.deepEqual(parse('TRUE'), literal(true));
  assert.deepEqual(parse('false'), literal(false));
  assert.deepEqual(parse('False'), literal(false));
});

QUnit.test('throws on invalid number', function(assert) {
  assert.throws(() => parse('1..2'), /Invalid number/);
  assert.throws(() => parse('1e'), /Invalid number/);
});

QUnit.module('vectors');

QUnit.test('parses 2D vector', function(assert) {
  assert.deepEqual(parse('[1,2]'), vector([literal(1), literal(2)]));
});

QUnit.test('parses 3D vector', function(assert) {
  assert.deepEqual(parse('[1, 2, 3]'), vector([literal(1), literal(2), literal(3)]));
});

QUnit.test('parses vector with whitespace', function(assert) {
  assert.deepEqual(parse('[ 1 , 2 ]'), vector([literal(1), literal(2)]));
});

QUnit.test('parses vector with expressions', function(assert) {
  assert.deepEqual(parse('[1+1, 2*2]'), vector([
    binary('+', literal(1), literal(1)),
    binary('*', literal(2), literal(2))
  ]));
});

QUnit.test('throws on invalid vector lengths', function(assert) {
  assert.throws(() => parse('[]'), /Vectors must be 2- or 3-tuples/);
  assert.throws(() => parse('[1]'), /Vectors must be 2- or 3-tuples/);
  assert.throws(() => parse('[1,2,3,4]'), /Vectors must be 2- or 3-tuples/);
});

QUnit.test('throws on missing closing bracket', function(assert) {
  assert.throws(() => parse('[1,2'), /Expected ']' /);
});

QUnit.module('variables');

QUnit.test('parses simple variable', function(assert) {
  assert.deepEqual(parse('x'), variable('x'));
});

QUnit.test('parses variable with underscore and digits', function(assert) {
  assert.deepEqual(parse('abc_123'), variable('abc_123'));
});

QUnit.test('throws on invalid identifier start', function(assert) {
  assert.throws(() => parse('1abc'), /Unexpected char/);
});

QUnit.module('grouping');

QUnit.test('parses parenthesized expression', function(assert) {
  assert.deepEqual(parse('(42)'), literal(42));
});

QUnit.test('throws on missing closing parenthesis', function(assert) {
  assert.throws(() => parse('(42'), /Expected '\)' /);
});

QUnit.module('unary operators');

QUnit.test('parses unary minus on variable', function(assert) {
  assert.deepEqual(parse('-x'), unary('-', variable('x')));
});

QUnit.test('parses unary plus on variable', function(assert) {
  assert.deepEqual(parse('+x'), unary('+', variable('x')));
});

QUnit.test('parses logical not', function(assert) {
  assert.deepEqual(parse('not true'), unary('not', literal(true)));
  assert.deepEqual(parse('NOT false'), unary('not', literal(false)));
});

QUnit.test('parses nested unary', function(assert) {
  assert.deepEqual(parse('--x'), unary('-', unary('-', variable('x'))));
});

QUnit.test('treats signed numbers as literals', function(assert) {
  assert.deepEqual(parse('-5'), literal(-5));
  assert.deepEqual(parse('+3.14'), literal(3.14));
});

QUnit.module('binary operators');

QUnit.test('parses addition', function(assert) {
  assert.deepEqual(parse('1 + 2'), binary('+', literal(1), literal(2)));
});

QUnit.test('parses subtraction', function(assert) {
  assert.deepEqual(parse('1 - 2'), binary('-', literal(1), literal(2)));
});

QUnit.test('parses multiplication', function(assert) {
  assert.deepEqual(parse('1 * 2'), binary('*', literal(1), literal(2)));
});

QUnit.test('parses division', function(assert) {
  assert.deepEqual(parse('1 / 2'), binary('/', literal(1), literal(2)));
});

QUnit.test('parses modulus', function(assert) {
  assert.deepEqual(parse('1 % 2'), binary('%', literal(1), literal(2)));
});

QUnit.test('parses power', function(assert) {
  assert.deepEqual(parse('1 ^ 2'), binary('^', literal(1), literal(2)));
});

QUnit.test('parses dot product', function(assert) {
  assert.deepEqual(parse('[1,2] @ [3,4]'), binary('@', vector([literal(1), literal(2)]), vector([literal(3), literal(4)])));
});

QUnit.test('respects multiplicative precedence', function(assert) {
  assert.deepEqual(parse('1 + 2 * 3'), binary('+', literal(1), binary('*', literal(2), literal(3))));
});

QUnit.test('respects power precedence and right-associativity', function(assert) {
  assert.deepEqual(parse('1 ^ 2 ^ 3'), binary('^', literal(1), binary('^', literal(2), literal(3))));
});

QUnit.test('parses comparison operators', function(assert) {
  assert.deepEqual(parse('1 < 2'), binary('<', literal(1), literal(2)));
  assert.deepEqual(parse('a == b'), binary('==', variable('a'), variable('b')));
  assert.deepEqual(parse('3 in [1,2,3]'), binary('in', literal(3), vector([literal(1), literal(2), literal(3)])));
});

QUnit.test('parses logical operators case-insensitively', function(assert) {
  assert.deepEqual(parse('true and false'), binary('and', literal(true), literal(false)));
  assert.deepEqual(parse('true OR false'), binary('or', literal(true), literal(false)));
});

QUnit.test('respects logical precedence', function(assert) {
  assert.deepEqual(parse('a and b or c'), binary('or', binary('and', variable('a'), variable('b')), variable('c')));
});

QUnit.test('parses left-associative comparisons without chaining', function(assert) {
  assert.deepEqual(parse('1 < 2 < 3'), binary('<', binary('<', literal(1), literal(2)), literal(3)));
});

QUnit.module('function calls');

QUnit.test('parses known function call', function(assert) {
  assert.deepEqual(parse('sin(x)'), functionCall('sin', [variable('x')]));
  assert.deepEqual(parse('abs( -5 )'), functionCall('abs', [literal(-5)]));
});

QUnit.test('parses function with multiple args', function(assert) {
  assert.deepEqual(parse('min(1,2,3)'), functionCall('min', [literal(1), literal(2), literal(3)]));
});

QUnit.test('parses empty function call', function(assert) {
  assert.deepEqual(parse('random()'), functionCall('random', []));
});

QUnit.test('throws on unknown function', function(assert) {
  assert.throws(() => parse('foo(x)'), /Unknown function 'foo'/);
});

QUnit.test('throws on missing closing parenthesis', function(assert) {
  assert.throws(() => parse('sin(x'), /Expected '\)' /);
});

QUnit.module('array indexing');

QUnit.test('parses array index', function(assert) {
  assert.deepEqual(parse('a[1]'), binary('[', variable('a'), literal(1)));
});

QUnit.test('parses index with expression', function(assert) {
  assert.deepEqual(parse('a[1+1]'), binary('[', variable('a'), binary('+', literal(1), literal(1))));
});

QUnit.test('throws on missing closing bracket', function(assert) {
  assert.throws(() => parse('a[1'), /Expected ']' /);
});

QUnit.module('ternary operator');

QUnit.test('parses ternary', function(assert) {
  assert.deepEqual(parse('true ? 1 : 2'), ternary(literal(true), literal(1), literal(2)));
});

QUnit.test('parses nested ternary right-associatively', function(assert) {
  assert.deepEqual(parse('a ? b : c ? d : e'), ternary(variable('a'), variable('b'), ternary(variable('c'), variable('d'), variable('e'))));
});

QUnit.test('throws on missing colon', function(assert) {
  assert.throws(() => parse('true ? 1'), /Expected ':' /);
});

QUnit.module('errors');

QUnit.test('throws on unexpected character', function(assert) {
  assert.throws(() => parse('1 + 2#'), /Unexpected character/);
});

QUnit.test('throws on unexpected token', function(assert) {
  assert.throws(() => parse('1 +'), /Unexpected token/);
});