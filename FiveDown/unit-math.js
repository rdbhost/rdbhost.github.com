
import { parse as jexpr_parse, EvalAstFactory } from './jexpr.js'
import { UNARY_UNIT_OPERATORS, BINARY_UNIT_OPERATORS } from './unit-ops.js'

import _unit from './UnitMath.js'
const unit = _unit.config({ precision: 8 })


class MyUnits{

    constructor() {

      this.astf = new EvalAstFactory(UNARY_UNIT_OPERATORS, BINARY_UNIT_OPERATORS)
    }

    evaluate_diagnostics (scope) {

      // if scope recorded any key misses, report one of them
      let missing = scope.get_diagnostics().get('missing')
      if (missing.length) {
        let first = missing[0]
        return `${first} is not available`
      }

      // else if scope recorded any Error object retrievals, report one
      let foundbad = scope.get_diagnostics().get('foundbad')
      if (foundbad.length) {
        let first = foundbad[0]
        return `${first} is not valid`
      }

      return 'bad result'
    }

    evaluate(exp, scope) {
      
      try {

        scope.reset_diagnostics()

        // evaluate() with a scope object
        let result = exp.evaluate(scope);

        // evaluater handles a variety of input issues by returning NaN, so
        //  if we get a NaN, we inspect the scope records to diagnose reason
        //
        if ( !data_valid(result) ) {

          let msg = this.evaluate_diagnostics(scope)
          return new Error(msg)
        }          

        return result;

      } catch (e) {

        // if the evaluation itself throws an Error, check for certain errors
        if (e.message.substr(0,35) === 'Cannot read properties of undefined') 
          return new Error('formula seems incomplete')

        return e;
      }
    }

    parse (expr) {

      try {

        // parse() returns the AST
        return jexpr_parse(expr, this.astf);
      }
      catch( e ) {

        if (e.message.substr(-27) === ', was undefined (undefined)') 
          return new Error(e.message.substr(0,e.message.length-27))

        return e;
      }
    }

    // expression_error checks formulas for parsing errors
    //
    expression_error(expr) {

      try {

        let t = this.parse(expr, this.astf)
        if (t?.name == 'Error') {
          return t.message || "bad formula"
        }
        return false
      }
      catch (e) {

        return 'bad formula'
      }
    }

    // data_input_evaluater evaluates an expression with a scope, and returns
    //  either a valid expression (number, boolean, 2or3 element vector)
    //  or an Error object with the input text as it's message
    //
    data_input_evaluater(expr, scope) {

      let exp = this.parse(expr)
      let res = this.evaluate(exp, scope)

      if (typeof res === 'object' && res?.name === 'Error') {
        return new Error(expr)
      }
      else {

        if (data_valid(res)) {
          return res
        }
        return new Error(expr)
      }
    }

}

export { MyUnits }
