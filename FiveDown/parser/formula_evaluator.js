// Evaluator: Computes the numerical result of the AST with variable values

import { BinaryNode, UnaryNode, FunctionNode, NumberNode, VariableNode, tokenizer, Parser, parseFormula } from './formula_parser.js'




function evaluate(ast, variables = {}) {
  if (ast instanceof NumberNode) {
    return ast.value;
  }
  if (ast instanceof VariableNode) {
    if (!(ast.name in variables)) {
      throw new Error(`Undefined variable: ${ast.name}`);
    }
    return variables[ast.name];
  }
  if (ast instanceof UnaryNode) {
    const exprValue = evaluate(ast.expr, variables);
    if (ast.op === '-') {
      return -exprValue;
    }
    throw new Error(`Unknown unary operator: ${ast.op}`);
  }
  if (ast instanceof BinaryNode) {
    const leftValue = evaluate(ast.left, variables);
    const rightValue = evaluate(ast.right, variables);
    switch (ast.op) {
      case '+':
        return leftValue + rightValue;
      case '-':
        return leftValue - rightValue;
      case '*':
        return leftValue * rightValue;
      case '/':
        if (rightValue === 0) {
          throw new Error('Division by zero');
        }
        return leftValue / rightValue;
      default:
        throw new Error(`Unknown binary operator: ${ast.op}`);
    }
  }
  if (ast instanceof FunctionNode) {
    const argValue = evaluate(ast.arg, variables);
    switch (ast.name) {
      case 'sin':
        return Math.sin(argValue);
      case 'cos':
        return Math.cos(argValue);
      default:
        throw new Error(`Unknown function: ${ast.name}`);
    }
  }
  throw new Error('Invalid node type');
}

export { evaluate };