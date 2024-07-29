

import { parse, EvalAstFactory } from './jexpr.js'

var sam = 1;
function ben() { return 5; }

// An EvalAstFactory produces an AST that can be evaluated
const astFactory = new EvalAstFactory();

// parse() returns the AST
const expr = parse('(a + b([1, 2, 3]) * c)', astFactory);

// evaluate() with a scope object
const result = expr.evaluate({
  a: 42,
  b: 5, //ben,
  c: 2,
});

console.log(result); // 48