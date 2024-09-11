// import { FunctionMap, UnitFunctionMap } from './functions.js'
import { name_valid, result_formatter } from './math-tools.js'
import { conversion_factor, unit } from './unit-math.js'

// This is a fake Map object that uses name keys to track
//   result cells (<td>s wrapped in jQuery objects), and get and set
//   result values for given keys
//
class ValScope {
  
    constructor (maptype) {

      this.localScope = new Map(maptype)
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
      if (!this.localScope.has(key)) throw new Error(`key ${key} not found in ValScope`)

      let td = this.localScope.get(key)
      td.data('value', value)
      td.data('prev-val', undefined)

      if (typeof value === 'object' && value?.convert) {

        td.text(`${result_formatter(value.value)}`)
        td.addClass('convert').removeClass('error').attr('title', value.value)
      }
      // if value is an Error object, apply error style, and use error message
      else if (typeof value == 'object' && value.message !== undefined) {

        td.text(`${value.message}`)
        td.addClass('error').removeAttr('title').removeClass('convert')
      }
      else if (value === undefined) {
        td.text("")
        td.removeClass('error output').removeAttr('title').removeClass('convert')
      }
      else {

        td.text(result_formatter(value))
        td.removeClass('error').attr('title', value).removeClass('convert')
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

  constructor (maptype) {

    super(maptype)
  }

  // add adds a key and two cells
  //
  addItem (key, td) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)

    return this.localScope.set(key, td)
  }

  // getItem gets the $<td> for the unit cell
  //
  getItem(key) {

    return this.localScope.get(key)
  }

  // gets the value of the $(td) object stored for key
  //
  get (key) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)

    if (this.has(key)) {

      let val = this.getItem(key);

      if (typeof val === 'function') {

        return val
      }
      else {
        let ret = val.data('value')
        if (!ret)
          return undefined
          
        // if stored value is an Error object, add key to foundbad list
        if (typeof ret === 'object' && ret.message !== undefined) {

          this.diagnostics.get('foundbad').push(key)
        }
        return unit(1, ret) 
      }
    }

    return undefined;
  }

  // sets value into $(td) object stored.
  //
  set (key, calculated) {

    if (!name_valid(key)) 
      throw new Error(`invalid key ${key}`)
    if (!this.localScope.has(key)) 
      throw new Error(`key ${key} not found in UnitScope`)

    let $td = this.localScope.get(key);
    $td.data('calculated', calculated)
    $td.data('prev-val', undefined)

    // if (calculated) value does not match raw (entered) value, set error class
    let disp = $td.text()
    $td.data('conversion_factor', undefined)
    if (disp && disp !== calculated) {

      let t = conversion_factor(calculated, disp)
      if (t === false) {

        $td.attr('title', `calculated units: ${calculated}`)
        $td.addClass('error')
      }
      else {

        $td.data('conversion_factor', t)
        $td.removeClass('error').addClass('convert')
        $td.attr('title', `converted from ${calculated} units`)
      }
    }
    else { 
      $td.removeAttr('title').removeClass('error')
      $td.attr('title', `calculated units: ${calculated}`)
    }

    // if value is an Error object, throw it as exception
    if (typeof calculated == 'object' && calculated.message !== undefined) {

      throw calculated
    }
    return this
  }

}

export { ValScope, UnitScope }
