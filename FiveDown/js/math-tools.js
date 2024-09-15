
import { parse as jexpr_parse, EvalAstFactory, UNARY_OPERATORS, BINARY_OPERATORS } from './jexpr.js'

class MyMath {

    constructor() {

      this.astf = new EvalAstFactory(UNARY_OPERATORS, BINARY_OPERATORS)
    }

    evaluate_diagnostics (scope, result) {

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

      return `bad result ${result}`
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

          let msg = this.evaluate_diagnostics(scope, result)
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

  // test functions for validating some input forms
  //

  const re = new RegExp("^[a-zA-Z_$][a-zA-Z_$0-9]*$");
  function name_valid(name) {
    return re.test(name)
  }

  function clean_name(name) {

    var nxt = name.replace(/[^a-zA-Z_$0-9]/gi, '_')
    if (name.match(/^[0-9]/)) {
      nxt = '_'+nxt
    }
    return nxt
  }

  function data_valid_re(data) {
  
    const dre = new RegExp("^-?[0-9][0-9\.,e]*$");
    return dre.test(data)
  }

  function data_valid(data) {
    
    if (Array.isArray(data)) {
      if (data.length > 1 && data.length < 4) {
        for (let i=0; i<data.length; i++) {
          if (!data_valid_re(data[i])) { return false }
        }
        return true
      }
      return false
    }
    else if (data === false || data === true) {

      return true
    }
    else {

      return data_valid_re(data)
    }
  }

  // formatter - formats data entered into result columns. returns formatted string
  //
  function result_formatter(d) {

    if (Array.isArray(d)) {

      let r = []
      for (let i=0; i<d.length; i++) {

        r.push(Number(d[i]).toPrecision(2))
      }
      return '[' + r.join(',') + ']'

    } 
    else if (d === false || d === true) {

      return d.toString()
    } 
    else if (d === "") {

      return ""
    } 
    else {

      return Number(d).toPrecision(3);
    }
  }

  function formula_formatter(formula) {
  
    return formula.replaceAll('@', '•').replaceAll('*', '×');
  }

  export { MyMath, name_valid, clean_name, data_valid, result_formatter, formula_formatter }

