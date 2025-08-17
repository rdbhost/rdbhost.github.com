// formula_parser.js

// Classes for the syntax tree nodes
class BinaryNode {
  constructor(left, op, right) {
    this.left = left;
    this.op = op;
    this.right = right;
  }

  toString() {
    return `(${this.left.toString()} ${this.op} ${this.right.toString()})`;
  }
}

class UnaryNode {
  constructor(op, expr) {
    this.op = op;
    this.expr = expr;
  }

  toString() {
    return `${this.op}${this.expr.toString()}`;
  }
}

class FunctionNode {
  constructor(name, arg) {
    this.name = name;
    this.arg = arg;
  }

  toString() {
    return `${this.name}(${this.arg.toString()})`;
  }
}

class NumberNode {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value.toString();
  }
}

class VariableNode {
  constructor(name) {
    this.name = name;
  }

  toString() {
    return this.name;
  }
}

// Lexer: Tokenizes the input string
function* tokenizer(str) {
  let pos = 0;
  while (pos < str.length) {
    const char = str[pos];
    if (/\s/.test(char)) {
      pos++;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let num = '';
      while (pos < str.length && /[0-9.]/.test(str[pos])) {
        num += str[pos++];
      }
      yield { type: 'number', value: parseFloat(num) };
      continue;
    }
    if (/[a-zA-Z]/.test(char)) {
      let name = '';
      while (pos < str.length && /[a-zA-Z0-9]/.test(str[pos])) {
        name += str[pos++];
      }
      yield { type: 'variable', value: name };
      continue;
    }
    if ('+-*/()'.includes(char)) {
      yield { type: char === '(' || char === ')' ? 'paren' : 'operator', value: char };
      pos++;
      continue;
    }
    throw new Error(`Unknown character: ${char}`);
  }
}

// Parser: Builds the syntax tree using recursive descent
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse() {
    return this.expression();
  }

  expression() {
    let node = this.term();
    while (this.current.type === 'operator' && '+-'.includes(this.current.value)) {
      const op = this.consume().value;
      const right = this.term();
      node = new BinaryNode(node, op, right);
    }
    return node;
  }

  term() {
    let node = this.factor();
    while (this.current.type === 'operator' && '*/'.includes(this.current.value)) {
      const op = this.consume().value;
      const right = this.factor();
      node = new BinaryNode(node, op, right);
    }
    return node;
  }

  factor() {
    let token = this.current;
    if (token.type === 'operator' && token.value === '-') {
      this.consume();
      const expr = this.factor();
      return new UnaryNode('-', expr);
    }
    if (token.type === 'number') {
      this.consume();
      return new NumberNode(token.value);
    }
    if (token.type === 'variable') {
      const next = this.tokens[this.pos + 1] || { type: 'eof' };
      if (next.type === 'paren' && next.value === '(') {
        const name = token.value;
        if (name !== 'sin' && name !== 'cos') {
          throw new Error(`Unknown function: ${name}`);
        }
        this.consume(); // function name
        this.consume(); // '('
        const arg = this.expression();
        if (this.current.type !== 'paren' || this.current.value !== ')') {
          throw new Error('Missing closing parenthesis');
        }
        this.consume(); // ')'
        return new FunctionNode(name, arg);
      } else {
        this.consume();
        return new VariableNode(token.value);
      }
    }
    if (token.type === 'paren' && token.value === '(') {
      this.consume();
      const node = this.expression();
      if (this.current.type !== 'paren' || this.current.value !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      this.consume();
      return node;
    }
    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  get current() {
    return this.tokens[this.pos] || { type: 'eof' };
  }

  consume() {
    const token = this.current;
    this.pos++;
    return token;
  }
}

// Main function to parse the formula string into a syntax tree
function parseFormula(formula) {
  const tokens = Array.from(tokenizer(formula));
  const parser = new Parser(tokens);
  return parser.parse();
}

export { BinaryNode, UnaryNode, FunctionNode, NumberNode, VariableNode, tokenizer, Parser, parseFormula };