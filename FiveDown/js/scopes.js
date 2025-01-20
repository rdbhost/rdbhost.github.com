// import { FunctionMap, UnitFunctionMap } from './functions.js'
import { BadFormula, EvaluationError, BadInput, name_valid, result_formatter } from './math-tools.js'

// ObjectMapWrap - wraps a Map object (including ValScope and UnitScope objects)
//  to make members of the Map object accessible as simple object attributes
//  work with ValScope and UnitScope objects
//
//  use like: do_something_with_object(ObjectMapWrap(new ValScope(...)))
//
function ObjectMapWrap(map) {

  const handler = {
          get(target, prop, receiver) {
              return target.get(prop)
          },

          set(target, prop, value) {
              throw new Error('evaluater shouldnt be setting values in ValScope')
          },

          has(target, prop) {
              return target.has(p)
          }
  }

  return new Proxy(map, handler)
}


// This is a fake Map object that uses name keys to track
//   result cells (<td>s wrapped in jQuery objects), and get and set
//   result values for given keys
//
class ValScope {
  
    constructor (maptype) {

      this.localScope = new Map(maptype)
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

    getItem(key) {

      if (!name_valid(key)) throw new Error(`invalid key ${key}`)
      if (!this.has(key)) throw new Error(`key ${key} not found`)

      return this.localScope.get(key)
    }

    // gets the value of the $(td) object stored for key, or a named function
    //   if the name refers to a predefined function
    get (key) {

      if (!name_valid(key)) throw new Error(`invalid key ${key}`)

      let val = this.getItem(key);
      if (typeof val === 'function') {

        return val
      } 
      else {

        let ret = val.data('value')
        return ret 
      }
    }
  
    // sets value into $(td) object stored.
    //
    set (key, val) {

      if (!name_valid(key)) 
        throw new Error(`invalid key ${key}`)
      if (!this.localScope.has(key)) 
        throw new Error(`key ${key} not found in ValScope`)

      let td = this.localScope.get(key)
      let prev = td.data('value')
      let convert = false, value = false;
      
      // if value is converted, set convert flag
      if (typeof val === 'object' && val?.convert) {
        value = val.value
        convert = true
      }
      else {
        value = val
        convert = false
      }

      // save value as data[value] and data[prev-val]
      td.data('value', value).data('prev-val', prev)

      // if value is converted, save value 
      if (convert) {

        td.text(`${result_formatter(value)}`)
        td.addClass('convert').removeClass('error').attr('title', value)
      }
      // if value is an Error object, apply error style, and use error message
      else if (typeof value == 'object' && value.name === 'Error') {

        if (value.cause === BadInput)
          td.text(`${value.message}`)
        else if ([BadFormula, EvaluationError].indexOf(value.cause) > -1)
          td.html(`<div>${value.message}</div>`)
        td.addClass('error').removeAttr('title').removeClass('convert')
      }
      else if (value === undefined) {

        td.removeClass('error output').removeAttr('title').removeClass('convert')
        td.text("")
      } 
      else if (Number.isNaN(value)) {

        td.removeClass('error output').removeAttr('title').removeClass('convert')
        td.text(value)
      }
      else if (Number.isFinite(value)) {

        td.text(result_formatter(value))
        td.attr('title', value)
        td.removeClass('error').attr('title', value).removeClass('convert')
      }
      else {

        if ((""+value).length > 25)
          value = (""+value).substring(25)
        td.text(value)

        if (value === false && td.hasClass("output"))
          td.addClass('fail')
      }
      
      return this
    }
  
    has (key) {
      
        if (!name_valid(key)) 
          throw new Error(`invalid key ${key}`)

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

}


export { ValScope, ObjectMapWrap }
