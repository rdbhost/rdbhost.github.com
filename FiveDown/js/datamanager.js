
import { MyMath, name_valid } from './math-tools.js'
// import { MyUnits } from './unit-math.js'
import { ValScope } /* , UnitScope } */ from './scopes.js'
import { FunctionMap /*, UnitFunctionMap */ } from './functions.js'

class DataManager {

    constructor() {

        this.VALUES = Array()
        this.FORMULAS = new Map()
    //     this.UNITS = new UnitScope(UnitFunctionMap)
        this.math = new MyMath()
    //    this.unit = new MyUnits()
    }
    
    add_row(name, $tds, $tdu) {

        var _this = this;

        $tds.each(function(i, td) {

            _this.VALUES[i].addItem(name, $(td));
        })
//        _this.UNITS.addItem(name, $tdu)
    }

    remove_row(name) {

        this.VALUES.forEach(function(vals, i) {
            if (vals.has(name)) {
                vals.set(name, undefined);
                vals.remove(name);
            }
        })
        this.FORMULAS.delete(name);    
 //       this.UNITS.delete(name)
    }

    rename_row(prev, now) {

        let need_update = false;

        if (now == " ") now = "" 

        if (now == "") { 
            this.VALUES.forEach(function(vals, i) {
                if (vals.has(prev)) {
                    vals.set(prev, undefined)
                    vals.remove(prev)
                }
            })
            this.FORMULAS.delete(prev)
 //           this.UNITS.delete(prev)
        }
        else {
            need_update = true;

            if (!name_valid(now)) 
                throw new Error(`invalid name ${now}`) 

            if (this.FORMULAS.has(prev)) {
                let tmp = this.FORMULAS.get(prev);
                this.FORMULAS.delete(prev);
                this.FORMULAS.set(now, tmp);
            }
            this.VALUES.forEach(function(vals, i) {
                if (vals.has(prev)) {
                    let tmp = vals.remove(prev);
                    vals.addItem(now, tmp);
                }
            })
/*            if (this.UNITS.has(prev)) {
                let tmp = this.UNITS.get(prev);
                this.UNITS.delete(prev);
                this.UNITS.set(now, tmp);
            }
*/        }
        return need_update
    }

    populate_values_for_alt(altnum) {
    
        this.VALUES[altnum] = new ValScope(FunctionMap);
        let _this = this;
    
        $('tbody > tr').each(function(z, row) {
    
            let $row = $(row);
            let name = $row.find('.name').text();
            if (!name) 
                return 
            if (!name_valid(name)) 
                throw new Error(`invalid name ${name}`) 
    
            $row.find('.result').each(function(i, td) {
                let $td = $(td);
                if ($td.data('alt') == altnum) {
                    _this.VALUES[altnum].addItem(name, $td);
                    let val = _this.math.data_input_evaluater($td.text(), _this.VALUES[altnum]);
                    _this.VALUES[altnum].set(name, val);
                }
            })
        })
    }

    populate_formulas_and_units() {
    
        let _this = this

        $('tbody > tr').each(function(z, row) {
    
            let $row = $(row)
            let name = $row.find('.name').text()
            if (!name) return
            if (!name_valid(name)) 
                throw new Error(`invalid name ${name}`) 

            let formula = $row.find('.formula').data('value')
            if (formula) { 

                _this.FORMULAS.set(name, $row.find('.formula'))
            }

 //           _this.UNITS.addItem(name, $row.find('.unit').first())
        })
    }

    update_calculated_rows(altnum) {

        let _this = this
        let scope = this.VALUES[altnum]

        this.FORMULAS.forEach(function($formulaTd, key) {

            let formula = $formulaTd.data('value')
            // console.log('formula '+formula)

            let exp = _this.math.parse(formula)
            let res = _this.math.evaluate(exp, scope)

 //           let unit = _this.UNITS.getItem(key)
 //           let factor = unit.data('conversion_factor')

 /*           if (factor !== undefined) {

                res = res * factor
                scope.set(key, {value: res, convert: !!factor})
                $formulaTd.attr('data-conversion', factor.toPrecision(3)).addClass('convert')
            }
            else { */
                scope.set(key, res)
                $formulaTd.removeAttr('data-conversion').removeAttr('convert')

                if (res.cause && res.cause.length) {
                    res.cause.forEach(function(key) {
                        let badsrc = scope.getItem(key)
                        badsrc.addClass('error')
                    })
                }
//            }
        })

    }

    update_calculated_units() {

        let _this = this

        this.FORMULAS.forEach(function($formulaTd, key) {

            let formula = $formulaTd.data('value')
 //           console.log('unit formula '+formula)

 //           let exp = _this.unit.parse(formula)
 //           let res = _this.unit.evaluate(exp, _this.UNITS)
 //           res = res.getUnits().toString()

//            _this.UNITS.set(key, res)
//            console.log('unit calculated '+res)
        })
    }

    change_formula(name, $formulaTd) {

        let _this = this
        let formula = $formulaTd.data('value')

        if (!name_valid(name)) 
            throw new Error(`Error - invalid name ${name}`) 
        
        if (this.FORMULAS.has(name)) {
            this.FORMULAS.delete(name);
        }

        // if formula is blank, clear values
        if (formula === '') {

            this.VALUES.forEach(function(scope, _i) {

                scope.set(name, "")
            })
        } 
        else {

            // else if formula is invalid, put error message in first result column
            //   and clear other result columns
            let exp = _this.math.parse(formula)
            if (typeof exp === 'object' && exp.name === 'Error') {

                this.VALUES.forEach(function(scope, _i) { 
                    scope.set(name, "") 
                })
                this.VALUES[0].set(name, exp)
     //           this.UNITS.set(name, "") 
            } 
            
            // else formula valid and non-blank, so save, and update result cols
            else {

                this.FORMULAS.set(name, $formulaTd);
                this.VALUES.forEach(function(scope, _i) {
    
                    let res = _this.math.evaluate(exp, scope);
                    scope.set(name, res);
                })
    //            let untexp = _this.unit.parse(formula)
    //            let unit = _this.unit.evaluate(untexp, this.UNITS)
    //            this.UNITS.set(name, unit) 
            }
        }
    }
}

export { DataManager }