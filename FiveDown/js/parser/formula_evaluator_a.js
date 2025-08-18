// formula_evaluator_a.js
// Evaluator for ASTs produced by the formula parser, supporting scalar and vector operations

import { unaryOps, binaryOps, ternaryOps, functions } from './numeric_operators.js';

function evaluate(ast, variables = {}) {
    function isNumber(value) {
        return typeof value === 'number';
    }

    function isVector(value) {
        return Array.isArray(value) && value.length >= 2 && value.length <= 3 && value.every(isNumber);
    }

    // Helper to apply binary operations element-wise with broadcasting
    function applyBinaryElementwise(a, b, scalarOp) {
        if (isNumber(a) && isNumber(b)) {
            return scalarOp(a, b);
        }
        if (isVector(a) && isVector(b)) {
            if (a.length !== b.length) {
                throw new Error('Vector lengths do not match');
            }
            return a.map((x, i) => scalarOp(x, b[i]));
        }
        if (isNumber(a) && isVector(b)) {
            return b.map(y => scalarOp(a, y));
        }
        if (isVector(a) && isNumber(b)) {
            return a.map(x => scalarOp(x, b));
        }
        throw new Error('Incompatible types for binary operation');
    }

    // Helper for unary operations element-wise
    function applyUnaryElementwise(value, scalarOp) {
        if (isNumber(value)) {
            return scalarOp(value);
        }
        if (isVector(value)) {
            return value.map(scalarOp);
        }
        throw new Error('Incompatible type for unary operation');
    }

    switch (ast.type) {
        case 'Literal':
            return ast.value;

        case 'Variable':
            if (!(ast.name in variables)) {
                throw new Error(`Undefined variable: ${ast.name}`);
            }
            return variables[ast.name];

        case 'Vector':
            return ast.elements.map(el => evaluate(el, variables));

        case 'Unary':
            const operand = evaluate(ast.operand, variables);
            switch (ast.operator) {
                case '+':
                    return applyUnaryElementwise(operand, x => +x);
                case '-':
                    return applyUnaryElementwise(operand, x => -x);
                case 'not':
                    return applyUnaryElementwise(operand, x => !x);
                default:
                    throw new Error(`Unknown unary operator: ${ast.operator}`);
            }

        case 'Binary':
            const left = evaluate(ast.left, variables);
            const right = evaluate(ast.right, variables);
            switch (ast.operator) {
                case '+':
                    return applyBinaryElementwise(left, right, (x, y) => x + y);
                case '-':
                    return applyBinaryElementwise(left, right, (x, y) => x - y);
                case '*':
                    return applyBinaryElementwise(left, right, (x, y) => x * y);
                case '/':
                    return applyBinaryElementwise(left, right, (x, y) => x / y);
                case '%':
                    return applyBinaryElementwise(left, right, (x, y) => x % y);
                case '^':
                    return applyBinaryElementwise(left, right, (x, y) => Math.pow(x, y));
                case '@':
                    // Assuming @ is dot product for vectors
                    if (isVector(left) && isVector(right)) {
                        if (left.length !== right.length) {
                            throw new Error('Vector lengths do not match for dot product');
                        }
                        return left.reduce((sum, x, i) => sum + x * right[i], 0);
                    }
                    throw new Error('Operator @ requires two vectors');
                case '==':
                    return applyBinaryElementwise(left, right, (x, y) => x === y);
                case '!=':
                    return applyBinaryElementwise(left, right, (x, y) => x !== y);
                case '<':
                    return applyBinaryElementwise(left, right, (x, y) => x < y);
                case '>':
                    return applyBinaryElementwise(left, right, (x, y) => x > y);
                case '<=':
                    return applyBinaryElementwise(left, right, (x, y) => x <= y);
                case '>=':
                    return applyBinaryElementwise(left, right, (x, y) => x >= y);
                case 'and':
                    return applyBinaryElementwise(left, right, (x, y) => x && y);
                case 'or':
                    return applyBinaryElementwise(left, right, (x, y) => x || y);
                case 'in':
                    // 'in' checks if left is in right (right must be array, left scalar)
                    if (!Array.isArray(right)) {
                        throw new Error('Right side of "in" must be an array');
                    }
                    return right.includes(left);
                case '[':
                    // Array indexing
                    if (!Array.isArray(left)) {
                        throw new Error('Cannot index non-array');
                    }
                    if (!isNumber(right) || !Number.isInteger(right)) {
                        throw new Error('Index must be an integer');
                    }
                    if (right < 0 || right >= left.length) {
                        throw new Error('Index out of bounds');
                    }
                    return left[right];
                default:
                    // Fallback to binaryOps if defined in numeric_operators.js
                    if (binaryOps[ast.operator]) {
                        return binaryOps[ast.operator](left, right);
                    }
                    throw new Error(`Unknown binary operator: ${ast.operator}`);
            }

        case 'Ternary':
            const condition = evaluate(ast.condition, variables);
            // Assuming condition is a scalar boolean
            if (typeof condition !== 'boolean') {
                throw new Error('Ternary condition must evaluate to a boolean');
            }
            return condition ? evaluate(ast.trueExpr, variables) : evaluate(ast.falseExpr, variables);

        case 'FunctionCall':
            const args = ast.arguments.map(arg => evaluate(arg, variables));
            // Combine unaryOps and functions from numeric_operators.js
            const allFunctions = { ...unaryOps, ...functions };
            const func = allFunctions[ast.name];
            if (!func) {
                throw new Error(`Unknown function: ${ast.name}`);
            }
            // Apply function; assuming functions handle vectors if needed
            return func(...args);

        default:
            throw new Error(`Unknown AST node type: ${ast.type}`);
    }
}

export { evaluate };