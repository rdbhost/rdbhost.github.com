import { unaryOps, binaryOps, functions } from '../../js/parser/num_partial.js';
import { Data } from '../../js/dim_data.js';
// import QUnit from 'qunit';

QUnit.module('Unary Operations');

QUnit.test('Unary minus on number with unit', assert => {
  const a = new Data(5, 'm');
  const result = unaryOps['-'](a);
  assert.strictEqual(result.val(), -5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Unary minus on vector with unit', assert => {
  const a = new Data([1, 2, 3], 'm');
  const result = unaryOps['-'](a);
  assert.deepEqual(result.val(), [-1, -2, -3]);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Unary minus on invalid type throws error', assert => {
  const a = new Data(true);
  assert.throws(() => unaryOps['-'](a), new Error('Invalid type for unary -'));
});

QUnit.test('Unary plus on number', assert => {
  const a = new Data(5, 'm');
  const result = unaryOps['+'](a);
  assert.strictEqual(result.val(), 5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Not on boolean', assert => {
  const a = new Data(true);
  const result = unaryOps['not'](a);
  assert.strictEqual(result.val(), false);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Not on boolean with unit throws error', assert => {
  const a = new Data(true, 'm');
  assert.throws(() => unaryOps['not'](a), new Error('not expects unitless'));
});

QUnit.test('Not on non-boolean throws error', assert => {
  const a = new Data(5);
  assert.throws(() => unaryOps['not'](a), new Error('Invalid type for not'));
});

QUnit.module('Binary Operations');

QUnit.test('Addition numbers same unit', assert => {
  const a = new Data(1, 'm');
  const b = new Data(2, 'm');
  const result = binaryOps['+'](a, b);
  assert.strictEqual(result.val(), 3);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Addition numbers compatible units', assert => {
  const a = new Data(1, 'm');
  const b = new Data(100, 'cm');
  const result = binaryOps['+'](a, b);
  assert.strictEqual(result.val(), 2);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Addition vectors compatible units', assert => {
  const a = new Data([1, 2], 'm');
  const b = new Data([100, 200], 'cm');
  const result = binaryOps['+'](a, b);
  assert.deepEqual(result.val(), [2, 4]);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Addition incompatible units throws error', assert => {
  const a = new Data(1, 'm');
  const b = new Data(1, 's');
  assert.throws(() => binaryOps['+'](a, b), new Error('Incompatible units for conversion'));
});

QUnit.test('Addition type mismatch throws error', assert => {
  const a = new Data(1);
  const b = new Data([1]);
  assert.throws(() => binaryOps['+'](a, b), new Error('Type mismatch in +'));
});

QUnit.test('Subtraction similar to addition', assert => {
  const a = new Data(2, 'm');
  const b = new Data(50, 'cm');
  const result = binaryOps['-'](a, b);
  assert.strictEqual(result.val(), 1.5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Multiplication numbers', assert => {
  const a = new Data(2, 'm');
  const b = new Data(3, 's');
  const result = binaryOps['*'](a, b);
  assert.strictEqual(result.val(), 6);
  assert.strictEqual(result.unit(), 'm s');
});

QUnit.test('Multiplication scalar vector', assert => {
  const a = new Data(2);
  const b = new Data([1, 2, 3], 'm');
  const result = binaryOps['*'](a, b);
  assert.deepEqual(result.val(), [2, 4, 6]);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Multiplication vector scalar', assert => {
  const a = new Data([1, 2, 3], 'm');
  const b = new Data(2);
  const result = binaryOps['*'](a, b);
  assert.deepEqual(result.val(), [2, 4, 6]);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Cross product 3D vectors', assert => {
  const a = new Data([1, 0, 0], 'm');
  const b = new Data([0, 1, 0], 's');
  const result = binaryOps['*'](a, b);
  assert.deepEqual(result.val(), [0, 0, 1]);
  assert.strictEqual(result.unit(), 'm s');
});

QUnit.test('Multiplication invalid types throws error', assert => {
  const a = new Data(1);
  const b = new Data(true);
  assert.throws(() => binaryOps['*'](a, b), new Error('Invalid types for *'));
});

QUnit.test('Division numbers', assert => {
  const a = new Data(10, 'm');
  const b = new Data(2, 's');
  const result = binaryOps['/'](a, b);
  assert.strictEqual(result.val(), 5);
  assert.strictEqual(result.unit(), 'm / s');
});

QUnit.test('Division vector scalar', assert => {
  const a = new Data([4, 6, 8], 'm');
  const b = new Data(2);
  const result = binaryOps['/'](a, b);
  assert.deepEqual(result.val(), [2, 3, 4]);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Division invalid types throws error', assert => {
  const a = new Data(1);
  const b = new Data([1]);
  assert.throws(() => binaryOps['/'](a, b), new Error('Invalid types for /'));
});

QUnit.test('Remainder numbers compatible units', assert => {
  const a = new Data(10, 'm');
  const b = new Data(300, 'cm');
  const result = binaryOps['%'](a, b);
  assert.strictEqual(result.val(), 1);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Remainder non-numbers throws error', assert => {
  const a = new Data([1]);
  const b = new Data([2]);
  assert.throws(() => binaryOps['%'](a, b), new Error('% for numbers only'));
});

QUnit.test('Power numbers', assert => {
  const a = new Data(2, 'm');
  const b = new Data(3);
  const result = binaryOps['^'](a, b);
  assert.strictEqual(result.val(), 8);
  assert.strictEqual(result.unit(), 'm^3');
});

QUnit.test('Power exponent with unit throws error', assert => {
  const a = new Data(2);
  const b = new Data(3, 's');
  assert.throws(() => binaryOps['^'](a, b), new Error('Exponent must be unitless'));
});

QUnit.test('Power non-numbers throws error', assert => {
  const a = new Data([1]);
  const b = new Data(2);
  assert.throws(() => binaryOps['^'](a, b), new Error('^ for numbers only'));
});

QUnit.test('Dot product vectors same unit', assert => {
  const a = new Data([1, 2, 3]);
  const b = new Data([4, 5, 6]);
  const result = binaryOps['@'](a, b);
  assert.strictEqual(result.val(), 32);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Dot product vectors compatible units', assert => {
  const a = new Data([1, 2], 'm');
  const b = new Data([100, 200], 'cm');
  const result = binaryOps['@'](a, b);
  assert.strictEqual(result.val(), 5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Dot product length mismatch throws error', assert => {
  const a = new Data([1, 2]);
  const b = new Data([3, 4, 5]);
  assert.throws(() => binaryOps['@'](a, b), new Error('Vectors must have same length for @'));
});

QUnit.test('Dot product non-vectors throws error', assert => {
  const a = new Data(1);
  const b = new Data(2);
  assert.throws(() => binaryOps['@'](a, b), new Error('@ for vectors only'));
});

QUnit.test('Greater than numbers compatible units', assert => {
  const a = new Data(2, 'm');
  const b = new Data(100, 'cm');
  const result = binaryOps['>'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Greater than non-numbers throws error', assert => {
  const a = new Data([1]);
  const b = new Data([2]);
  assert.throws(() => binaryOps['>'](a, b), new Error('> for numbers only'));
});

QUnit.test('Less than similar', assert => {
  const a = new Data(50, 'cm');
  const b = new Data(1, 'm');
  const result = binaryOps['<'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Greater or equal similar', assert => {
  const a = new Data(1, 'm');
  const b = new Data(100, 'cm');
  const result = binaryOps['>='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Less or equal similar', assert => {
  const a = new Data(1, 'm');
  const b = new Data(100, 'cm');
  const result = binaryOps['<='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Equal numbers compatible units', assert => {
  const a = new Data(100, 'cm');
  const b = new Data(1, 'm');
  const result = binaryOps['=='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Equal vectors', assert => {
  const a = new Data([1, 2], 'm');
  const b = new Data([100, 200], 'cm');
  const result = binaryOps['=='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Equal strings', assert => {
  const a = new Data('hello');
  const b = new Data('hello');
  const result = binaryOps['=='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Equal booleans', assert => {
  const a = new Data(true);
  const b = new Data(true);
  const result = binaryOps['=='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Equal incompatible units returns false', assert => {
  const a = new Data(1, 'm');
  const b = new Data(1, 's');
  const result = binaryOps['=='](a, b);
  assert.strictEqual(result.val(), false);
});

QUnit.test('Not equal uses equal', assert => {
  const a = new Data(1);
  const b = new Data(2);
  const result = binaryOps['!='](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('And booleans', assert => {
  const a = new Data(true);
  const b = new Data(false);
  const result = binaryOps['and'](a, b);
  assert.strictEqual(result.val(), false);
});

QUnit.test('And non-booleans throws error', assert => {
  const a = new Data(1);
  const b = new Data(2);
  assert.throws(() => binaryOps['and'](a, b), new Error('and for booleans only'));
});

QUnit.test('And with units throws error', assert => {
  const a = new Data(true);
  const b = new Data(false, 'm');
  assert.throws(() => binaryOps['and'](a, b), new Error('and expects unitless'));
});

QUnit.test('Nand booleans', assert => {
  const a = new Data(true);
  const b = new Data(true);
  const result = binaryOps['nand'](a, b);
  assert.strictEqual(result.val(), false);
});

QUnit.test('Or booleans', assert => {
  const a = new Data(true);
  const b = new Data(false);
  const result = binaryOps['or'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('Xor booleans', assert => {
  const a = new Data(true);
  const b = new Data(false);
  const result = binaryOps['xor'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('In number vector', assert => {
  const a = new Data(2);
  const b = new Data([1, 2, 3]);
  const result = binaryOps['in'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('In string string', assert => {
  const a = new Data('ell');
  const b = new Data('hello');
  const result = binaryOps['in'](a, b);
  assert.strictEqual(result.val(), true);
});

QUnit.test('In with units throws error', assert => {
  const a = new Data(1);
  const b = new Data([1], 'm');
  assert.throws(() => binaryOps['in'](a, b), new Error('in expects unitless'));
});

QUnit.test('In invalid types throws error', assert => {
  const a = new Data(true);
  const b = new Data(false);
  assert.throws(() => binaryOps['in'](a, b), new Error('Invalid types for in'));
});

QUnit.module('Functions');

QUnit.test('Sin unitless', assert => {
  const a = new Data(Math.PI / 2);
  const result = functions.sin(a);
  assert.ok(Math.abs(result.val() - 1) < 1e-10);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Sin radians', assert => {
  const a = new Data(Math.PI / 2, 'rad');
  const result = functions.sin(a);
  assert.ok(Math.abs(result.val() - 1) < 1e-10);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Sin degrees', assert => {
  const a = new Data(90, 'deg');
  const result = functions.sin(a);
  assert.ok(Math.abs(result.val() - 1) < 1e-10);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Sin with invalid unit throws error', assert => {
  const a = new Data(1, 'm');
  assert.throws(() => functions.sin(a), new Error('sin expects unitless or rad'));
});

QUnit.test('Cos similar to sin', assert => {
  const a = new Data(0, 'rad');
  const result = functions.cos(a);
  assert.ok(Math.abs(result.val() - 1) < 1e-10);
});

QUnit.test('Tan similar', assert => {
  const a = new Data(45, 'deg');
  const result = functions.tan(a);
  assert.ok(Math.abs(result.val() - 1) < 1e-10);
});

QUnit.test('Asin unitless', assert => {
  const a = new Data(1);
  const result = functions.asin(a);
  assert.ok(Math.abs(result.val() - Math.PI / 2) < 1e-10);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Asin with unit throws error', assert => {
  const a = new Data(1, 'm');
  assert.throws(() => functions.asin(a), new Error('asin expects unitless argument'));
});

QUnit.test('Acos similar', assert => {
  const a = new Data(1);
  const result = functions.acos(a);
  assert.ok(Math.abs(result.val() - 0) < 1e-10);
});

QUnit.test('Atan similar', assert => {
  const a = new Data(1);
  const result = functions.atan(a);
  assert.ok(Math.abs(result.val() - Math.PI / 4) < 1e-10);
});

QUnit.test('Atan2 numbers', assert => {
  const y = new Data(1);
  const x = new Data(1);
  const result = functions.atan2(y, x);
  assert.ok(Math.abs(result.val() - Math.PI / 4) < 1e-10);
});

QUnit.test('Atan2 with units throws error', assert => {
  const y = new Data(1, 'm');
  const x = new Data(1);
  assert.throws(() => functions.atan2(y, x), new Error('atan2 expects unitless arguments'));
});

QUnit.test('Sinh unitless', assert => {
  const a = new Data(0);
  const result = functions.sinh(a);
  assert.strictEqual(result.val(), 0);
});

QUnit.test('Cosh, Tanh, Asinh, Acosh, Atanh similar', assert => {
  const a = new Data(0);
  const cosh = functions.cosh(a);
  assert.strictEqual(cosh.val(), 1);
});

QUnit.test('Log unitless', assert => {
  const a = new Data(1000);
  const result = functions.log(a);
  assert.strictEqual(result.val(), 3);
});

QUnit.test('Ln similar', assert => {
  const a = new Data(Math.E);
  const result = functions.ln(a);
  assert.strictEqual(result.val(), 1);
});

QUnit.test('Log2 similar', assert => {
  const a = new Data(8);
  const result = functions.log2(a);
  assert.strictEqual(result.val(), 3);
});

QUnit.test('Sqrt number with unit', assert => {
  const a = new Data(4, 'm^2');
  const result = functions.sqrt(a);
  assert.strictEqual(result.val(), 2);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Sqrt vector', assert => {
  const a = new Data([4, 9]);
  const result = functions.sqrt(a);
  assert.deepEqual(result.val(), [2, 3]);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Cbrt similar', assert => {
  const a = new Data(8, 'm^3');
  const result = functions.cbrt(a);
  assert.strictEqual(result.val(), 2);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Sign unitless', assert => {
  const a = new Data(-5);
  const result = functions.sign(a);
  assert.strictEqual(result.val(), -1);
});

QUnit.test('Sign with unit throws error', assert => {
  const a = new Data(5, 'm');
  assert.throws(() => functions.sign(a), new Error('sign expects unitless'));
});

QUnit.test('Random', assert => {
  const result = functions.random();
  assert.ok(result.val() >= 0 && result.val() < 1);
  assert.strictEqual(result.unit(), '');
});

QUnit.test('Fac unitless integer', assert => {
  const a = new Data(5);
  const result = functions.fac(a);
  assert.strictEqual(result.val(), 120);
});

QUnit.test('Fac non-integer throws error', assert => {
  const a = new Data(5.5);
  assert.throws(() => functions.fac(a), new Error('Invalid argument for fac'));
});

QUnit.test('Min numbers compatible units', assert => {
  const a = new Data(1, 'm');
  const b = new Data(200, 'cm');
  const result = functions.min(a, b);
  assert.strictEqual(result.val(), 1);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Min less than 2 args throws error', assert => {
  assert.throws(() => functions.min(new Data(1)), new Error('min requires at least 2 arguments'));
});

QUnit.test('Min non-numbers throws error', assert => {
  const a = new Data([1]);
  const b = new Data([2]);
  assert.throws(() => functions.min(a, b), new Error('min for numbers only'));
});

QUnit.test('Max similar', assert => {
  const a = new Data(1, 'm');
  const b = new Data(200, 'cm');
  const result = functions.max(a, b);
  assert.strictEqual(result.val(), 2);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Abs number', assert => {
  const a = new Data(-5, 'm');
  const result = functions.abs(a);
  assert.strictEqual(result.val(), 5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Abs vector', assert => {
  const a = new Data([-1, 2, -3]);
  const result = functions.abs(a);
  assert.deepEqual(result.val(), [1, 2, 3]);
});

QUnit.test('Abs invalid type throws error', assert => {
  const a = new Data(true);
  assert.throws(() => functions.abs(a), new Error('abs for numbers and vectors'));
});

QUnit.test('RoundTo number', assert => {
  const num = new Data(1.2345);
  const dec = new Data(2);
  const result = functions.roundTo(num, dec);
  assert.strictEqual(result.val(), 1.23);
});

QUnit.test('RoundTo vector', assert => {
  const num = new Data([1.2345, 5.6789]);
  const dec = new Data(1);
  const result = functions.roundTo(num, dec);
  assert.deepEqual(result.val(), [1.2, 5.7]);
});

QUnit.test('RoundTo dec with unit throws error', assert => {
  const num = new Data(1);
  const dec = new Data(2, 'm');
  assert.throws(() => functions.roundTo(num, dec), new Error('roundTo decimal places must be unitless'));
});

QUnit.test('Trunc number', assert => {
  const a = new Data(1.9);
  const result = functions.trunc(a);
  assert.strictEqual(result.val(), 1);
});

QUnit.test('Trunc vector', assert => {
  const a = new Data([1.9, -2.1]);
  const result = functions.trunc(a);
  assert.deepEqual(result.val(), [1, -2]);
});

QUnit.test('Ceil similar', assert => {
  const a = new Data(1.1);
  const result = functions.ceil(a);
  assert.strictEqual(result.val(), 2);
});

QUnit.test('Floor similar', assert => {
  const a = new Data(1.9);
  const result = functions.floor(a);
  assert.strictEqual(result.val(), 1);
});

QUnit.test('Hypot vector', assert => {
  const a = new Data([3, 4], 'm');
  const result = functions.hypot(a);
  assert.strictEqual(result.val(), 5);
  assert.strictEqual(result.unit(), 'm');
});

QUnit.test('Hypot non-vector throws error', assert => {
  const a = new Data(5);
  assert.throws(() => functions.hypot(a), new Error('hypot for vectors only'));
});