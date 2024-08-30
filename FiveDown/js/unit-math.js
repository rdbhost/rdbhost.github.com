
import { parse as jexpr_parse, EvalAstFactory } from './jexpr.js'
import { UNARY_UNIT_OPERATORS, BINARY_UNIT_OPERATORS } from './unit-ops.js'

import _unit from './lib/UnitMath.js'
const unit = _unit.config({ precision: 8 })

function unit_valid(u) {

  if (typeof u !== 'object')
    return false
  
  return (u.type === 'Unit')
}

function format_unit(u) {

  try {
    let t = unit(u)
    return t.getUnits().toString()
  }
  catch(e) {
    return e
  }
}

class MyUnits{

    constructor() {

      this.astf = new EvalAstFactory(UNARY_UNIT_OPERATORS, BINARY_UNIT_OPERATORS)
    }

    parse (expr) {

      try {

        // parse() returns the AST
        return jexpr_parse(expr, this.astf);
      }
      catch( e ) {

        return e;
      }
    }

    evaluate(exp, scope) {
      
      try {

        scope.reset_diagnostics()

        // evaluate() with a scope object
        let result = exp.evaluate(scope);

        return result;

      } 
      catch (e) {

        return e;
      }
    }

    // unit_input_evaluater evaluates an expression with a scope, and returns
    //  either a valid expression (a unit.Unit)
    //  or an Error object with the input text as it's message
    //
    unit_input_evaluater(expr, scope) {

      let exp = this.parse(expr)
      let res = this.evaluate(exp, scope)

      if (typeof res === 'object' && res?.name === 'Error') {
        return new Error(expr)
      }
      else {

        if (unit_valid(res)) {
          return res
        }
        return new Error(expr)
      }
    }

}

export { MyUnits, format_unit }
