// formula_parser_a.js
// Parser for text formulas into a syntax tree, supporting variable names, function names, numbers, vectors, and booleans

import { unaryOps, binaryOps, functions } from './numeric_ops.js';

class Parser {
    constructor(formula) {
        this.formula = formula.trim();
        this.index = 0;
        this.length = this.formula.length;
    }

    // Main parsing function
    parse() {
        const result = this.parseTernary();
        if (this.index < this.length) {
            throw new Error(`Unexpected character at position ${this.index}: '${this.formula[this.index]}'`);
        }
        return result;
    }

    // Parse ternary operator (?:)
    parseTernary() {
        let node = this.parseLogicalOr();
        if (this.match('?')) {
            const condition = node;
            const trueExpr = this.parseLogicalOr();
            if (!this.match(':')) {
                throw new Error(`Expected ':' for ternary operator at position ${this.index}`);
            }
            const falseExpr = this.parseTernary();
            node = {
                type: 'Ternary',
                operator: '?',
                condition,
                trueExpr,
                falseExpr
            };
        }
        return node;
    }

    // Parse logical OR (or)
    parseLogicalOr() {
        let node = this.parseLogicalAnd();
        while (this.match('or')) {
            const left = node;
            const operator = 'or';
            const right = this.parseLogicalAnd();
            node = {
                type: 'Binary',
                operator,
                left,
                right
            };
        }
        return node;
    }

    // Parse logical AND (and)
    parseLogicalAnd() {
        let node = this.parseComparison();
        while (this.match('and')) {
            const left = node;
            const operator = 'and';
            const right = this.parseComparison();
            node = {
                type: 'Binary',
                operator,
                left,
                right
            };
        }
        return node;
    }

    // Parse comparison operators (==, !=, <, >, <=, >=, in)
    parseComparison() {
        let node = this.parseAdditive();
        let op;
        while ((op = this.matchAny(['==', '!=', '<=', '>=', '>', '<', 'in']))) {
            const left = node;
            const right = this.parseAdditive();
            node = {
                type: 'Binary',
                operator: op,
                left,
                right
            };
        }
        return node;
    }

    // Parse additive operators (+, -)
    parseAdditive() {
        let node = this.parseMultiplicative();
        let op;
        while ((op = this.matchAny(['+', '-']))) {
            const left = node;
            const right = this.parseMultiplicative();
            node = {
                type: 'Binary',
                operator: op,
                left,
                right
            };
        }
        return node;
    }

    // Parse multiplicative operators (*, /, %, @)
    parseMultiplicative() {
        let node = this.parsePower();
        let op;
        while ((op = this.matchAny(['*', '/', '%', '@']))) {
            const left = node;
            const right = this.parsePower();
            node = {
                type: 'Binary',
                operator: op,
                left,
                right
            };
        }
        return node;
    }

    // Parse power operator (^), right-associative
    parsePower() {
        let node = this.parseUnary();
        while (this.match('^')) {
            const left = node;
            const operator = '^';
            const right = this.parsePower();  // Right-associative
            node = {
                type: 'Binary',
                operator,
                left,
                right
            };
        }
        return node;
    }

    // Parse unary operators (-, +, not)
    parseUnary() {
        this.skipWhitespace();
        const peek = this.peek();
        if (peek === '-' || peek === '+' || this.formula.slice(this.index, this.index + 3).toLowerCase() === 'not') {
            let op;
            if (this.formula.slice(this.index, this.index + 3).toLowerCase() === 'not') {
                op = 'not';
                this.index += 3;
            } else {
                op = peek;
                const nextChar = this.formula[this.index + 1] || '';
                if ((op === '-' || op === '+') && (this.isDigit(nextChar) || nextChar === '.')) {
                    // Signed number, parse as literal in primary
                    return this.parsePrimary();
                }
                this.index++;
            }
            const operand = this.parseUnary();
            return {
                type: 'Unary',
                operator: op,
                operand
            };
        }
        return this.parsePrimary();
    }

    // Parse primary expressions (literals, variables, functions, vectors, grouped expressions)
    parsePrimary() {
        this.skipWhitespace();

        // Numbers
        const peek = this.peek();
        const nextChar = this.formula[this.index + 1] || '';
        if (this.isDigit(peek) || peek === '.' || ((peek === '-' || peek === '+') && (this.isDigit(nextChar) || nextChar === '.'))) {
            return this.parseNumber();
        }

        // Booleans
        if (this.match('true')) {
            return { type: 'Literal', value: true };
        }
        if (this.match('false')) {
            return { type: 'Literal', value: false };
        }

        // Vectors with square brackets [1, 2, 3]
        if (this.match('[')) {
            const elements = [];
            this.skipWhitespace();
            if (!this.match(']')) {
                do {
                    elements.push(this.parseTernary());
                    this.skipWhitespace();
                } while (this.match(','));
                if (!this.match(']')) {
                    throw new Error(`Expected ']' at position ${this.index}`);
                }
            }
            if (elements.length !== 2 && elements.length !== 3) {
                throw new Error(`Vectors must be 2- or 3-tuples at position ${this.index - 1}`);
            }
            return { type: 'Vector', elements };
        }

        // Parenthesized expressions (grouping only, no vectors)
        if (this.match('(')) {
            const expr = this.parseTernary();
            if (!this.match(')')) {
                throw new Error(`Expected ')' at position ${this.index}`);
            }
            return expr;
        }

        // Variable or function names
        if (this.isLetter()) {
            const name = this.parseIdentifier();

            // Function call
            if (this.match('(')) {
                const args = [];
                if (!this.match(')')) {
                    do {
                        args.push(this.parseTernary());
                    } while (this.match(','));
                    if (!this.match(')')) {
                        throw new Error(`Expected ')' at position ${this.index}`);
                    }
                }
                // Check if known function or unary op
                if (Object.keys(functions).includes(name) || Object.keys(unaryOps).includes(name)) {
                    return {
                        type: 'FunctionCall',
                        name,
                        arguments: args
                    };
                }
                throw new Error(`Unknown function '${name}' at position ${this.index}`);
            }

            // Array indexing
            if (this.match('[')) {
                const index = this.parseTernary();
                if (!this.match(']')) {
                    throw new Error(`Expected ']' at position ${this.index}`);
                }
                return {
                    type: 'Binary',
                    operator: '[',
                    left: { type: 'Variable', name },
                    right: index
                };
            }

            // Variable
            return { type: 'Variable', name };
        }

        throw new Error(`Unexpected token at position ${this.index}: '${this.peek()}'`);
    }

    // Parse a number (integer, floating-point, scientific notation, with optional leading sign)
    parseNumber() {
        let numStr = '';
        const start = this.index;

        // Optional sign
        if (this.peek() === '-' || this.peek() === '+') {
            numStr += this.formula[this.index++];
        }

        // Digits before decimal or decimal start
        if (this.peek() === '.') {
            numStr += this.formula[this.index++];
        } else {
            while (this.isDigit()) {
                numStr += this.formula[this.index++];
            }
            if (this.match('.')) {
                numStr += '.';
            }
        }

        // Digits after decimal
        while (this.isDigit()) {
            numStr += this.formula[this.index++];
        }

        // Scientific notation
        let eOp = this.matchAny(['e', 'E']);
        if (eOp) {
            numStr += eOp;
            let sign = this.matchAny(['-', '+']);
            if (sign) {
                numStr += sign;
            }
            while (this.isDigit()) {
                numStr += this.formula[this.index++];
            }
        }

        const value = parseFloat(numStr);
        if (isNaN(value)) {
            throw new Error(`Invalid number at position ${start}`);
        }
        return { type: 'Literal', value };
    }

    // Parse an identifier (variable or function name)
    parseIdentifier() {
        let name = '';
        while (this.isLetter() || this.isDigit() || this.peek() === '_') {
            name += this.formula[this.index++];
        }
        return name;
    }

    // Utility methods
    peek() {
        return this.index < this.length ? this.formula[this.index] : '';
    }

    match(token) {
        this.skipWhitespace();
        if (this.formula.slice(this.index, this.index + token.length).toLowerCase() === token.toLowerCase()) {  // Case-insensitive for words like 'and', 'or', 'not', 'in', 'true', 'false'
            this.index += token.length;
            return true;
        }
        return false;
    }

    matchAny(tokens) {
        this.skipWhitespace();
        tokens = [...tokens].sort((a, b) => b.length - a.length);  // Try longer tokens first
        for (const token of tokens) {
            if (this.formula.slice(this.index, this.index + token.length).toLowerCase() === token.toLowerCase()) {
                this.index += token.length;
                return token;
            }
        }
        return false;
    }

    isDigit(char = this.peek()) {
        return /[0-9]/.test(char);
    }

    isLetter() {
        const c = this.peek();
        return /[a-zA-Z]/.test(c);
    }

    skipWhitespace() {
        while (this.index < this.length && /\s/.test(this.formula[this.index])) {
            this.index++;
        }
    }
}

// Export the parse function
export function parseFormula(formula) {
    const parser = new Parser(formula);
    return parser.parse();
}