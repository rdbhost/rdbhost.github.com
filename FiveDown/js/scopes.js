import { FunctionMap } from './functions.js'
import { name_valid, result_formatter } from './math-tools.js'
import _unit from './lib/UnitMath.js'
const unit = _unit.config({ precision: 8 })

// This is a fake Map object that uses name keys to track
//   result cells (<td>s wrapped in jQuery objects), and get and set
//   result values for given keys
//
class ValScope {
  
    constructor () {

      this.localScope = new Map(FunctionMap)
      this.diagnostics = undefined 
      this.reset_diagnostics()
    }
  
    // add adds a key and cell pair
    //
    addItem (key, td) {

      if (!name_valid(key)) 
        throw new Error(`invalid key ${key}`)

      return this.localScope.set(key, td)
    }

    // removes, and returns, the cell for a given key
    remove (key) {

      if (!name_valid(key)) throw new Error(`invalid key ${key}`)

      let tmp = this.localScope.get(key);
      this.localScope.delete(key);
      return tmp;
    }

    // gets the value of the $(td) object stored for key, or a named function
    //   if the name refers to a predefined function
    get (key) {

      if (!name_valid(key)) throw new Error(`invalid key ${key}`)

      if (this.has(key)) {

        let val = this.localScope.get(key);
        if (typeof val === 'function') {

          return val
        } else {

          let ret = val.data('value')
          
          // if stored value is an Error object, add key to foundbad list
          if (typeof ret === 'object' && ret.message !== undefined) {

            this.diagnostics.get('foundbad').push(key)
          }
          return ret 
        }
      }

      return undefined;
    }
  
    // sets value into $(td) object stored.
    //
    set (key, value) {

        if (!name_valid(key)) throw new Error(`invalid key ${key}`)
        if (!this.localScope.has(key)) throw new Error(`key ${key} not found in MapScope`)

        let td = this.localScope.get(key);
        td.data('value', value)
        td.data('prev-val', undefined)

        // if value is an Error object, apply error style, and use error message
        if (typeof value == 'object' && value.message !== undefined) {

          td.text(`${value.message}`)
          td.addClass('error').removeAttr('title')
        }
        else if (value === undefined) {
          td.text("")
          td.removeClass('error output').removeAttr('title')
        }
        else {

          td.text(result_formatter(value))
          td.removeClass('error').attr('title', value)
        }
        return this
    }
  
    has (key) {
      
        if (!name_valid(key)) 
          throw new Error(`invalid key ${key}`)

        if (!this.localScope.has(key)) 
          this.diagnostics.get('missing').push(key)

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

      const input = [['missing', []],
                     ['foundbad', []]]
      this.diagnostics = new Map(input)
    }
};

class UnitScope extends ValScope {

  constructor() {
    super()
  }

  // add adds a key and two cells
  //
  addItem (key, td, td_display) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)

    return this.localScope.set(key, [td, td_display])
  }

  // getItem gets the $<td> for the unit cell
  //
  getItem(key) {

    return this.localScope.get(key)[0]
  }

  // gets the value of the $(td) object stored for key
  //
  get (key) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)

    if (this.has(key)) {

      let val = this.getItem(key);

      let ret = val.data('value')
      if (!ret)
        return undefined
        
      // if stored value is an Error object, add key to foundbad list
      if (typeof ret === 'object' && ret.message !== undefined) {

        this.diagnostics.get('foundbad').push(key)
      }
      return unit(1, ret) 
    }

    return undefined;
  }

  // sets value into $(td) object stored.
  //
  set (key, value) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)
    if (!this.localScope.has(key)) 
      throw new Error(`key ${key} not found in MapScope`)

    let $td = this.localScope.get(key)[0];
    $td.data('value', value)
    $td.data('prev-val', undefined)
    $td.attr('title', `calculated value: ${value}`)

    // if (calculated) value does not match raw (entered) value, set error class
    let disp = $td.text()
    if (disp && disp !== value) {
      $td.addClass('error')
    }
    else { 
      $td.removeAttr('title').removeClass('error')
    }

    // TODO - do something with td_display, this.localScope.get(key)[1]

    // if value is an Error object, throw it as exception
    if (typeof value == 'object' && value.message !== undefined) {

      throw value
    }
    return this
  }

}

export { ValScope, UnitScope }
