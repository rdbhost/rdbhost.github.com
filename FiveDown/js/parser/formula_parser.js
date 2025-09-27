
// formula_parser.js
// Parser for text formulas into a syntax tree, supporting variable names, function names, numbers, vectors, booleans, and string literals

import { unaryOps, binaryOps, functions } from './numeric_ops.js';

/**
 * Represents an Abstract Syntax Tree (AST) for parsed formulas.
 */
class AST {
    /**
     * Creates a new AST instance.
     * @param {Object} root - The root node of the AST.
     */
    constructor(root) {
        this.root = root;
    }
}

/**
 * Parser class for converting formula strings into abstract syntax trees (AST).
 * Supports operators, functions, variables, literals (numbers, booleans, strings), vectors, and grouping.
 */
class Parser {
    /**
     * Initializes the parser with the given formula.
     * @param {string} formula - The formula string to parse.
     */
    constructor(formula) {
        this.formula = formula.trim();
        this.index = 0;
        this.length = this.formula.length;
    }

    // Main parsing function
    /**
     * Parses the entire formula into an AST.
     * @returns {Object} The root node of the AST.
     * @throws {Error} If there are unexpected characters after parsing.
     */
    parse() {
        const result = this.parseTernary();
        if (this.index < this.length) {
            throw new Error(`Unexpected character at position ${this.index}: '${this.formula[this.index]}'`);
        }
        return result;
    }

    // Parse ternary operator (?:)
    /**
     * Parses ternary expressions (condition ? trueExpr : falseExpr).
     * @returns {Object} The AST node for the ternary expression or the underlying logical OR expression.
     * @throws {Error} If the ':' is missing in a ternary operator.
     */
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
    /**
     * Parses logical OR expressions (left or right).
     * @returns {Object} The AST node for the logical OR expression or the underlying logical AND expression.
     */
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
    /**
     * Parses logical AND expressions (left and right).
     * @returns {Object} The AST node for the logical AND expression or the underlying comparison expression.
     */
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
    /**
     * Parses comparison expressions (e.g., left == right).
     * @returns {Object} The AST node for the comparison expression or the underlying additive expression.
     */
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
    /**
     * Parses additive expressions (e.g., left + right).
     * @returns {Object} The AST node for the additive expression or the underlying multiplicative expression.
     */
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
    /**
     * Parses multiplicative expressions (e.g., left * right).
     * @returns {Object} The AST node for the multiplicative expression or the underlying power expression.
     */
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
    /**
     * Parses power expressions (e.g., left ^ right), right-associative.
     * @returns {Object} The AST node for the power expression or the underlying unary expression.
     */
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
    /**
     * Parses unary expressions (e.g., -operand, not operand).
     * Handles signed numbers by delegating to primary parsing if applicable.
     * @returns {Object} The AST node for the unary expression or the underlying primary expression.
     */
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

    // Parse primary expressions (literals, variables, functions, vectors, grouped expressions, strings)
    /**
     * Parses primary expressions such as literals (numbers, booleans, strings), variables, function calls, vectors, or grouped expressions.
     * @returns {Object} The AST node for the primary expression.
     * @throws {Error} If there's an unexpected token or mismatched brackets/parentheses.
     */
    parsePrimary() {
        this.skipWhitespace();

        // String literals (single or double quotes)
        if (this.peek() === '"' || this.peek() === "'") {
            return this.parseString();
        }

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

    // Parse a string literal (single or double quoted)
    /**
     * Parses a string literal enclosed in single or double quotes.
     * @returns {Object} A Literal AST node with the parsed string value.
     * @throws {Error} If the string is not properly terminated.
     */
    parseString() {
        const quote = this.peek(); // Either ' or "
        this.index++; // Skip opening quote
        let value = '';
        while (this.index < this.length && this.formula[this.index] !== quote) {
            value += this.formula[this.index++];
        }
        if (this.index >= this.length || this.formula[this.index] !== quote) {
            throw new Error(`Unterminated string literal at position ${this.index}`);
        }
        this.index++; // Skip closing quote
        return { type: 'Literal', value };
    }

    // Parse a number (integer, floating-point, scientific notation, with optional leading sign)
    /**
     * Parses a numeric literal, including integers, floats, and scientific notation.
     * @returns {Object} A Literal AST node with the parsed numeric value.
     * @throws {Error} If the number is invalid.
     */
    parseNumber() {
        let numStr = '';
        const start = this.index;

        // Optional sign
        if (this.peek() === '-' || this.peek() === '+') {
            numStr += this.formula[this.index++];
        }

        let hasDigitsBeforeDecimal = false;
        let hasDecimal = false;
        let hasDigitsAfterDecimal = false;

        // Digits before decimal or decimal start
        if (this.peek() === '.') {
            numStr += this.formula[this.index++];
            hasDecimal = true;
        } else {
            while (this.isDigit()) {
                numStr += this.formula[this.index++];
                hasDigitsBeforeDecimal = true;
            }
            if (this.match('.')) {
                numStr += '.';
                hasDecimal = true;
            }
        }

        // Digits after decimal
        while (this.isDigit()) {
            numStr += this.formula[this.index++];
            hasDigitsAfterDecimal = true;
        }

        // Check for double decimal or invalid decimal
        if (hasDecimal && !hasDigitsBeforeDecimal && !hasDigitsAfterDecimal) {
            throw new Error(`Invalid number at position ${start}`);
        }
        if (this.peek() === '.' && hasDecimal) {
            throw new Error(`Invalid number at position ${start}`);
        }

        // Scientific notation
        let eOp = this.matchAny(['e', 'E']);
        if (eOp) {
            numStr += eOp;
            let sign = this.matchAny(['-', '+']);
            if (sign) {
                numStr += sign;
            }
            let hasExponentDigits = false;
            while (this.isDigit()) {
                numStr += this.formula[this.index++];
                hasExponentDigits = true;
            }
            if (!hasExponentDigits) {
                throw new Error(`Invalid number at position ${start}`);
            }
        }

        const value = parseFloat(numStr);
        if (isNaN(value)) {
            throw new Error(`Invalid number at position ${start}`);
        }
        return { type: 'Literal', value };
    }

    // Parse an identifier (variable or function name)
    /**
     * Parses an identifier (alphanumeric with underscores).
     * @returns {string} The parsed identifier name.
     */
    parseIdentifier() {
        let name = '';
        while (this.isLetter() || this.isDigit() || this.peek() === '_') {
            name += this.formula[this.index++];
        }
        return name;
    }

    // Utility methods
    /**
     * Peeks at the current character without advancing the index.
     * @returns {string} The current character or empty string if at end.
     */
    peek() {
        return this.index < this.length ? this.formula[this.index] : '';
    }

    /**
     * Matches a token case-insensitively and advances the index if matched.
     * @param {string} token - The token to match.
     * @returns {boolean} True if matched, false otherwise.
     */
    match(token) {
        this.skipWhitespace();
        if (this.formula.slice(this.index, this.index + token.length).toLowerCase() === token.toLowerCase()) {  // Case-insensitive for words like 'and', 'or', 'not', 'in', 'true', 'false'
            this.index += token.length;
            return true;
        }
        return false;
    }

    /**
     * Matches any of the given tokens (longest first) case-insensitively.
     * @param {string[]} tokens - Array of tokens to try matching.
     * @returns {string|false} The matched token or false if none match.
     */
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

    /**
     * Checks if the current character is a digit.
     * @param {string} [char=this.peek()] - The character to check.
     * @returns {boolean} True if it's a digit, false otherwise.
     */
    isDigit(char = this.peek()) {
        return /[0-9]/.test(char);
    }

    /**
     * Checks if the current character is a letter.
     * @returns {boolean} True if it's a letter, false otherwise.
     */
    isLetter() {
        const c = this.peek();
        return /[a-zA-Z]/.test(c);
    }

    /**
     * Skips over whitespace characters.
     */
    skipWhitespace() {
        while (this.index < this.length && /\s/.test(this.formula[this.index])) {
            this.index++;
        }
    }
}

/**
 * Exported function to parse a formula into an AST instance.
 * @param {string} formula - The formula string to parse.
 * @returns {AST} An AST instance containing the parsed tree.
 */
function parseFormula(formula) {
    const parser = new Parser(formula);
    const root = parser.parse();
    return new AST(root);
}

export { AST, Parser, parseFormula };
