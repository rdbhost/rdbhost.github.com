// formula_evaluator.js
// Evaluator for ASTs produced by the formula parser, supporting scalar and vector operations

import { unaryOps, binaryOps, functions } from './numeric_ops.js';
import { AST } from './formula_parser.js';
import { Data } from '../dim_data.js';
import { ColumnObjectWrapper } from '../row_collection.js';

// Helper functions copied from numeric_ops.js for vector handling
function parseUnit(unit) {
  const map = new Map();
  if (!unit) return map;
  unit = unit.replace(/\s/g, '');
  const terms = unit.split('*');
  terms.forEach(term => {
    let sign = 1;
    if (term.startsWith('/')) {
      sign = -1;
      term = term.slice(1);
    }
    let [base, expStr] = term.split('^');
    const exp = expStr ? parseFloat(expStr) : 1;
    const current = map.get(base) || 0;
    map.set(base, current + sign * exp);
  });
  return map;
}

function unitToString(dims) {
  if (dims.size === 0) return '';
  const pos = []
  const neg = []
  for (let [dim, exp] of [...dims.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (exp > 0) {
      pos.push(exp === 1 ? dim : `${dim}^${exp}`)
    } else if (exp < 0) {
      neg.push(exp === -1 ? dim : `${dim}^${-exp}`)
    }
  }
  let str = pos.join('*');
  if (neg.length) {
    str = str ? `${str}/` : '1/';
    str += neg.join('*');
  }
  return str;
}

function getUnitInfo(unit) {
  const baseMap = parseUnit(unit)
  let factor = 1
  const dims = new Map()
  for (let [base, exp] of baseMap) {
    const conv = new Data(1, base).asBaseUnit()
    const baseFactor = conv.val()
    const trueBase = conv.unit()
    factor *= Math.pow(baseFactor, exp)
    dims.set(trueBase, (dims.get(trueBase) || 0) + exp)
  }
  const normalized = unitToString(dims)
  return {dims, factor, normalized}
}

function multiplyVal(val, factor) {
  if (typeof val === 'number') return val * factor;
  if (Array.isArray(val)) return val.map(x => x * factor);
  throw new Error('Invalid value type for multiply');
}

function divideVal(val, factor) {
  if (typeof val === 'number') return val / factor;
  if (Array.isArray(val)) return val.map(x => x / factor);
  throw new Error('Invalid value type for divide');
}

function mapsEqual(m1, m2) {
  if (m1.size !== m2.size) return false;
  for (let [k, v] of m1) if (v !== m2.get(k)) return false;
  return true;
}

/**
 * Evaluates the Abstract Syntax Tree (AST) produced by the formula parser.
 * Supports scalar, vector, and boolean operations using provided variables.
 * @param {AST} ast - The AST instance to evaluate.
 * @param {ColumnObjectWrapper} variables - A ColumnObjectWrapper providing Data values for variables.
 * @returns {Data} The result of the evaluation as a Data instance.
 * @throws {Error} If the ast is not an instance of AST, variables is not a ColumnObjectWrapper, or if there are undefined variables, type mismatches, or unknown operations.
 */
function evaluate(ast, variables) {
    if (!(ast instanceof AST)) {
        throw new Error('ast must be an instance of AST');
    }
    if (!(variables instanceof ColumnObjectWrapper)) {
        throw new Error('variables must be an instance of ColumnObjectWrapper');
    }

    function evaluateNode(node, variables) {
        switch (node.type) {
            case 'Literal':
                return new Data(node.value, '');

            case 'Variable':
                const data = variables[node.name];
                if (!data) {
                    throw new Error(`Undefined variable: ${node.name}`);
                }
                return data;

            case 'Vector':
                const elementsData = node.elements.map(el => evaluateNode(el, variables));
                if (elementsData.length === 0) {
                    return new Data([], '');
                }
                const infos = elementsData.map(d => getUnitInfo(d.unit()));
                const firstInfo = infos[0];
                infos.forEach(info => {
                    if (!mapsEqual(info.dims, firstInfo.dims)) {
                        throw new Error('Vector elements must have same dimensions');
                    }
                });
                const targetUnit = elementsData[0].unit();
                const targetFactor = firstInfo.factor;
                const adjustedVals = elementsData.map((d, i) => divideVal(multiplyVal(d.val(), infos[i].factor), targetFactor));
                return new Data(adjustedVals, targetUnit);

            case 'Unary':
                const operand = evaluateNode(node.operand, variables);
                if (!unaryOps[node.operator]) {
                    throw new Error(`Unknown unary operator: ${node.operator}`);
                }
                return unaryOps[node.operator](operand);

            case 'Binary':
                const left = evaluateNode(node.left, variables);
                const right = evaluateNode(node.right, variables);
                if (node.operator === '[') {
                    const lval = left.val();
                    const rval = right.val();
                    if (!Array.isArray(lval)) {
                        throw new Error('Cannot index non-array');
                    }
                    if (typeof rval !== 'number' || !Number.isInteger(rval)) {
                        throw new Error('Index must be an integer');
                    }
                    if (rval < 0 || rval >= lval.length) {
                        throw new Error('Index out of bounds');
                    }
                    return new Data(lval[rval], left.unit());
                } else {
                    if (!binaryOps[node.operator]) {
                        throw new Error(`Unknown binary operator: ${node.operator}`);
                    }
                    return binaryOps[node.operator](left, right);
                }

            case 'Ternary':
                const condition = evaluateNode(node.condition, variables);
                if (typeof condition.val() !== 'boolean') {
                    throw new Error('Ternary condition must evaluate to a boolean');
                }
                return condition.val() ? evaluateNode(node.trueExpr, variables) : evaluateNode(node.falseExpr, variables);

            case 'FunctionCall':
                const args = node.arguments.map(arg => evaluateNode(arg, variables));
                const func = functions[node.name];
                if (!func) {
                    throw new Error(`Unknown function: ${node.name}`);
                }
                return func(...args);

            default:
                throw new Error(`Unknown AST node type: ${node.type}`);
        }
    }

    return evaluateNode(ast.root, variables);
}

export { evaluate };