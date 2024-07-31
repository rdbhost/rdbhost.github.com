
import { parse as jexpr_parse, EvalAstFactory } from './jexpr.js'

// This is a fake Map object that uses name keys to track
//   result cells (<td>s wrapped in jQuery objects), and get and set
//   result values for given keys
//
class MapScope {
  
    constructor () {
      this.localScope = new Map()
    }
  
    // add adds a key and cell pair
    //
    add (key, td) {
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`); }
      return this.localScope.set(key, td)
    }

    // removes, and returns, the cell for a given key
    remove (key) {
      if (!name_valid(key)) { throw new Error(`invalid key ${key}`); }
      let tmp = this.localScope.get(key);
      this.localScope.delete(key);
      return tmp;
    }

    // gets the value of the $(td) object stored for key
    get (key) {
      if (!name_valid(key)) {
        throw new Error(`invalid key ${key}`);
      }
      let td = this.localScope.get(key);
      if (td && td.data) {
        return td.data('value');
      }
      return undefined;
    }
  
    // sets value into $(td) object stored.
    //
    set (key, value) {

        if (!name_valid(key)) { throw new Error(`invalid key ${key}`); }
        if (!this.localScope.has(key)) { throw new Error(`key ${key} not found`); }

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
        if (!name_valid(key)) { throw new Error(`invalid key ${key}`); }
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
  };

  class MyMath {

      constructor(math) {

        this.astf = new EvalAstFactory()
      }

      evaluate(exp, scope) {
        
        try {

          // evaluate() with a scope object
          let result = exp.evaluate(scope);

          if (isNaN(result)) {

            return new Error('Error - bad result')
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

  function formatter(d) {
    return Number(d).toPrecision(3);
  }

  export { MapScope, MyMath, name_valid, formatter }

