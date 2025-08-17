// tests/parser/formula_parser_a_test.js
// QUnit test suite for formula_parser_a.js

// import QUnit from 'qunit';
import { parseFormula } from '../../parser/formula_parser_a.js';  // Adjust path based on directory structure: tests/parser to parser/

QUnit.module('Formula Parser Tests');

QUnit.test('Parse simple number', assert => {
    const ast = parseFormula('42');
    assert.deepEqual(ast, { type: 'Literal', value: 42 }, 'Parses integer');
});

QUnit.test('Parse floating-point number', assert => {
    const ast = parseFormula('3.14');
    assert.deepEqual(ast, { type: 'Literal', value: 3.14 }, 'Parses float');
});

QUnit.test('Parse scientific notation', assert => {
    const ast = parseFormula('1.23e4');
    assert.deepEqual(ast, { type: 'Literal', value: 12300 }, 'Parses scientific notation');
});

QUnit.test('Parse boolean true', assert => {
    const ast = parseFormula('true');
    assert.deepEqual(ast, { type: 'Literal', value: true }, 'Parses true');
});

QUnit.test('Parse boolean false', assert => {
    const ast = parseFormula('false');
    assert.deepEqual(ast, { type: 'Literal', value: false }, 'Parses false');
});

QUnit.test('Parse variable', assert => {
    const ast = parseFormula('x');
    assert.deepEqual(ast, { type: 'Variable', name: 'x' }, 'Parses variable');
});

QUnit.test('Parse vector 2-tuple', assert => {
    const ast = parseFormula('[1, 2]');
    assert.deepEqual(ast, {
        type: 'Vector',
        elements: [
            { type: 'Literal', value: 1 },
            { type: 'Literal', value: 2 }
        ]
    }, 'Parses 2-tuple vector');
});

QUnit.test('Parse vector 3-tuple', assert => {
    const ast = parseFormula('[3, 4.5, -6]');
    assert.deepEqual(ast, {
        type: 'Vector',
        elements: [
            { type: 'Literal', value: 3 },
            { type: 'Literal', value: 4.5 },
            { type: 'Literal', value: -6 }
        ]
    }, 'Parses 3-tuple vector');
});

QUnit.test('Parse unary minus', assert => {
    const ast = parseFormula('-x');
    assert.deepEqual(ast, {
        type: 'Unary',
        operator: '-',
        operand: { type: 'Variable', name: 'x' }
    }, 'Parses unary minus');
});

QUnit.test('Parse unary not', assert => {
    const ast = parseFormula('not true');
    assert.deepEqual(ast, {
        type: 'Unary',
        operator: 'not',
        operand: { type: 'Literal', value: true }
    }, 'Parses unary not');
});

QUnit.test('Parse binary addition', assert => {
    const ast = parseFormula('1 + 2');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: '+',
        left: { type: 'Literal', value: 1 },
        right: { type: 'Literal', value: 2 }
    }, 'Parses addition');
});

QUnit.test('Parse binary multiplication with precedence', assert => {
    const ast = parseFormula('1 + 2 * 3');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: '+',
        left: { type: 'Literal', value: 1 },
        right: {
            type: 'Binary',
            operator: '*',
            left: { type: 'Literal', value: 2 },
            right: { type: 'Literal', value: 3 }
        }
    }, 'Respects multiplication precedence');
});

QUnit.test('Parse power operator', assert => {
    const ast = parseFormula('2 ^ 3 ^ 4');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: '^',
        left: { type: 'Literal', value: 2 },
        right: {
            type: 'Binary',
            operator: '^',
            left: { type: 'Literal', value: 3 },
            right: { type: 'Literal', value: 4 }
        }
    }, 'Parses right-associative power');
});

QUnit.test('Parse comparison', assert => {
    const ast = parseFormula('x > 5');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: '>',
        left: { type: 'Variable', name: 'x' },
        right: { type: 'Literal', value: 5 }
    }, 'Parses greater than');
});

QUnit.test('Parse logical and', assert => {
    const ast = parseFormula('true and false');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: 'and',
        left: { type: 'Literal', value: true },
        right: { type: 'Literal', value: false }
    }, 'Parses and');
});

QUnit.test('Parse ternary', assert => {
    const ast = parseFormula('x > 0 ? 1 : -1');
    assert.deepEqual(ast, {
        type: 'Ternary',
        operator: '?',
        condition: {
            type: 'Binary',
            operator: '>',
            left: { type: 'Variable', name: 'x' },
            right: { type: 'Literal', value: 0 }
        },
        trueExpr: { type: 'Literal', value: 1 },
        falseExpr: { type: 'Literal', value: -1 }
    }, 'Parses ternary');
});

QUnit.test('Parse function call', assert => {
    const ast = parseFormula('sin(3.14)');
    assert.deepEqual(ast, {
        type: 'FunctionCall',
        name: 'sin',
        arguments: [{ type: 'Literal', value: 3.14 }]
    }, 'Parses function call');
});

QUnit.test('Parse array indexing', assert => {
    const ast = parseFormula('vec[0]');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: '[',
        left: { type: 'Variable', name: 'vec' },
        right: { type: 'Literal', value: 0 }
    }, 'Parses array indexing');
});

QUnit.test('Parse complex expression', assert => {
    const ast = parseFormula('(1 + 2) * sin(x) ^ 2 > 0 and not false');
    assert.deepEqual(ast, {
        type: 'Binary',
        operator: 'and',
        left: {
            type: 'Binary',
            operator: '>',
            left: {
                type: 'Binary',
                operator: '*',
                left: {
                    type: 'Binary',
                    operator: '+',
                    left: { type: 'Literal', value: 1 },
                    right: { type: 'Literal', value: 2 }
                },
                right: {
                    type: 'Binary',
                    operator: '^',
                    left: {
                        type: 'FunctionCall',
                        name: 'sin',
                        arguments: [{ type: 'Variable', name: 'x' }]
                    },
                    right: { type: 'Literal', value: 2 }
                }
            },
            right: { type: 'Literal', value: 0 }
        },
        right: {
            type: 'Unary',
            operator: 'not',
            operand: { type: 'Literal', value: false }
        }
    }, 'Parses complex expression with precedence');
});

QUnit.test('Error on invalid vector length', assert => {
    assert.throws(() => parseFormula('[1]'), Error, 'Throws on single element vector');
    assert.throws(() => parseFormula('[1,2,3,4]'), Error, 'Throws on 4-tuple');
});

QUnit.test('Error on unknown function', assert => {
    assert.throws(() => parseFormula('unknown(1)'), Error, 'Throws on unknown function');
});

QUnit.test('Error on unexpected token', assert => {
    assert.throws(() => parseFormula('1 +'), Error, 'Throws on incomplete expression');
});