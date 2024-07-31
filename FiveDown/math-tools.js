
import { parse as jexpr_parse, EvalAstFactory } from './jexpr.js'

// This is a fake Map object that uses name keys to track
//   result cells (<td>s wrapped in jQuery objects), and get and set
//   result values for given keys
//
class MapScope {
  
    constructor () {
      this.localScope = new Map()
      this.diagnostics = undefined // new Map([['missing', []]])
      this.reset_diagnostics()
    }
  
    // add adds a key and cell pair
    //
    add (key, td) {
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
      return this.localScope.set(key, td)
    }

    // removes, and returns, the cell for a given key
    remove (key) {
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
      let tmp = this.localScope.get(key);
      this.localScope.delete(key);
      return tmp;
    }

    // gets the value of the $(td) object stored for key
    get (key) {
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
      if (this.has(key)) {
        let td = this.localScope.get(key);
        return td.data('value');
      }
      return undefined;
    }
  
    // sets value into $(td) object stored.
    //
    set (key, value) {

        if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
        if (!this.localScope.has(key)) { throw new Error(`key ${key} not found in MapScope`) }

        if (!name_valid(key)) { throw new Error(`invalid key ${key}`); }
        if (!this.localScope.has(key)) { throw new Error(`key ${key} not found in MapScope`) }

        let td = this.localScope.get(key);

        // if value is an Error object, apply error style, and use error message
        if (typeof value == 'object' && value.message !== undefined) {

          td.data('value', undefined);
          td.text(value.message);
          td.addClass('error');
        }
        else {

          td.data('value', value);
          td.text(formatter(value));
          td.removeClass('error');
        }
        td.data('prev-val', undefined);
        return this;
    }
  
    has (key) {
        if (!name_valid(key)) { throw new Error(`invalid key ${key}`) }
        if (!this.localScope.has(key)) { this.diagnostics.missing.push(key) }
        return this.localScope.has(key)
    }
  
    keys () {
      return this.localScope.keys()
    }

    delete (key) {
      return this.localScope.delete(key)
    }

    clear () {
      return this.localScope.clear()
    }

    get_diagnostics() {
      return this.diagnostics
    }

    reset_diagnostics() {
      this.diagnostics = new Map()
      this.diagnostics['missing'] = []
    }
  };

  class MyMath {

      constructor(math) {

        this.astf = new EvalAstFactory()
      }

      evaluate_diagnostics (scope) {

        let missing = scope.get_diagnostics().missing
        if (missing.length) {
          let first = missing[0]
          return `Error - ${first} is not available`
        }
        return 'Error - bad result'
      }

      evaluate(exp, scope) {
        
        try {

          scope.reset_diagnostics()

          // evaluate() with a scope object
          let result = exp.evaluate(scope);

          if (isNaN(result)) {

            let msg = this.evaluate_diagnostics(scope)
            return new Error(msg)
          }          

          return result;

        } catch (e) {

          return e;
        }
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

      expression_error(expr) {

        let t = this.parse(expr, this.astf)
        if (t?.name == 'Error') {
          return t.message || "bad formula"
        }
        return false
      }

   }

  const re = new RegExp("^[a-zA-Z_$][a-zA-Z_$0-9]*$");
  function name_valid(name) {
    return re.test(name)
  }
  function clean_name(name) {
    var nxt = name.replace(/[^a-zA-Z_$0-9]/gi, '_')
    if (name.match(/^[0-9]/)) {
      nxt = '_'.nxt
    }
    return nxt
  }

  function formatter(d) {
    return Number(d).toPrecision(3);
  }

  export { MapScope, MyMath, name_valid, clean_name, formatter }
