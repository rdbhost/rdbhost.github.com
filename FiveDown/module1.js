

import { MyMath } from './math-tools.js'

var m = new MyMath();

// parse() returns the AST
//const expr = m.parse('(a + b');
const expr = m.parse('a+b(1)+c');

if (typeof expr == 'object' && expr.name == 'Error') {

  console.log('bad formula '+expr);
}
else {

  function b(i) { return i+1 }

  // evaluate() with a scope object
  const result = expr.evaluate(new Map([
    ['a', 42],
    ['b', b], 
    ['c', 2],
  ]));
  console.log(result); // 48
}

