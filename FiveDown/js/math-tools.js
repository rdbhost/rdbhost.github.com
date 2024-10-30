
import { Parser, Expression } from "./expr-eval/dist/index.js"
import { unaryOps, binaryOps, ternaryOps, functions } from './numeric_operators.js' 
import { ObjectMapWrap, ValScope } from './scopes.js'

// Signal values for identifying types of errors
//
var BadFormula = Object.create(null),
    EvaluationError = Object.create(null),
    BadInput = Object.create(null)

    
// options for Silent Matts parser
//
let parserOpts = {
        operators: {
                concatenate: false,
                conditional: true,
                factorial: false,

                // Enable and, or, not, <, ==, !=, etc.
                logical: true,
                comparison: true,

                // Disable = operator
                'in': true,
                assignment: false
        }
}


class MyMath {

    constructor() {

      this.parser = new Parser(parserOpts, unaryOps, binaryOps, ternaryOps, functions)
    }

    // parse - process the expression 'expr' into a syntax tree
    //   returns either a syntax tree 'Expression' object, or an Error
    //
    parse (expr) {

      try {

        return this.parser.parse(expr)
      }
      catch( e ) {

        return new Error(e.message, {cause: BadFormula})
      }
    }

    // evaluate the Expression object 'syntree' with the values in scope
    //   returns a numerical result (scalar or vector), or an Error object
    // 
    evaluate(syntree, scope) {

      try {

        // evaluate() with a scope object
        let result = syntree.evaluate(ObjectMapWrap(scope))
        return Number.isNaN(result) ? new Error('bad evaluation', {cause: EvaluationError}) : result;
      } 
      catch (e) {

        // if the evaluation itself throws an Error, check for certain errors
        //if (e.message.substr(0,35) === 'Cannot read properties of undefined') 
        //  return new Error('formula seems incomplete')

        return new Error(e.message, {cause: EvaluationError})
      }
    }

    // data_input_evaluater evaluates an expression with a scope, and returns
    //  either a valid expression (number, boolean, 2or3 element vector)
    //  or an Error object with the input text as it's message
    //
    data_input_evaluater(expr, scope) {

      if (!expr)
        return ""

      let syntree = this.parse(expr)

      if (typeof syntree === 'object' && syntree?.name === 'Error') 
        return new Error(expr, {cause: 'bad-input'})
      
      let res = this.evaluate(syntree, scope)
      if (!data_valid(res)) 
        return new Error(expr, {cause: BadInput})

      return res    
    }

}

  // test functions for validating some input forms
  //
  let reserved_names = ['in', 'or', 'and', 'not']
  const re = new RegExp("^[a-zA-Z_$][a-zA-Z_$0-9]*$");
  function name_valid(name) {
    return reserved_names.indexOf(name) === -1 && re.test(name)
  }

  function clean_name(name) {

    var nxt = name.replace(/[^a-zA-Z_$0-9]/gi, '_')
    if (name.match(/^[0-9]/)) 
      nxt = '_'+nxt

    if (reserved_names.indexOf(name) >= 0)
      nxt = nxt+'_'
    
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

  // formatter - formats data for display in result columns. returns formatted string
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
    else if (d === "" || d === undefined) {

      return ""
    } 
    else {

      return Number(d).toPrecision(5);
    }
  }

  function formula_formatter(formula) {
  
    return formula.replaceAll('@', '•').replaceAll('*', '×');
  }

  export { MyMath, name_valid, clean_name, data_valid, result_formatter, formula_formatter,
           BadFormula, BadInput, EvaluationError }

