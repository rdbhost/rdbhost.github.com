
import { MyMath, name_valid } from './math-tools.js'
import { MyUnits } from './unit-math.js'
import { ValScope, UnitScope } from './scopes.js'

class DataManager {

    constructor() {

        this.VALUES = Array()
        this.FORMULAS = new Map()
        this.UNITS = new UnitScope()
        this.math = new MyMath()
        this.unit = new MyUnits()
    }
    
    add_row(name, $tds, $tdu) {

        var _this = this;

        $tds.each(function(i, td) {

            _this.VALUES[i].add(name, $(td));
        })
        _this.UNITS.add(name, $tdu, null) // todo
    }

    remove_row(name) {

        this.VALUES.forEach(function(vals, i) {
            if (vals.has(name)) {
                vals.set(prev, undefined);
                vals.remove(name);
            }
        })
        this.FORMULAS.delete(name);    
        this.UNITS.delete(name)
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
            this.UNITS.delete(prev)
        }
        else {
            need_update = true;

            if (!name_valid(now)) { throw new Error(`invalid name ${now}`) };

            if (this.FORMULAS.has(prev)) {
                let tmp = this.FORMULAS.get(prev);
                this.FORMULAS.delete(prev);
                this.FORMULAS.set(now, tmp);
            }
            this.VALUES.forEach(function(vals, i) {
                if (vals.has(prev)) {
                    let tmp = vals.remove(prev);
                    vals.add(now, tmp);
                }
            })
            if (this.UNITS.has(prev)) {
                let tmp = this.UNITS.get(prev);
                this.UNITS.delete(prev);
                this.UNITS.set(now, tmp);
            }
        }
        return need_update
    }

    populate_values_for_alt(altnum) {
    
        this.VALUES[altnum] = new ValScope();
        let _this = this;
    
        $('tbody > tr').each(function(z, row) {
    
            let $row = $(row);
            let name = $row.find('.name').text();
            if (!name) return 
            if (!name_valid(name)) throw new Error(`invalid name ${name}`) 
    
            $row.find('.result').each(function(i, td) {
                let $td = $(td);
                if ($td.data('alt') == altnum) {
                    _this.VALUES[altnum].add(name, $td);
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
            if (!name_valid(name)) throw new Error(`invalid name ${name}`) 

            let formula = $row.find('.formula').data('value')
            if (formula) { 

                _this.FORMULAS.set(name, formula)
            }

            let unit = $row.find('.unit').data('value')
            if (unit) {

                _this.UNITS.add(name, $row.find('.unit').first(), $row.find('.unit-disp'))
            }
        })
    }

    update_calculated_rows(altnum) {

        let _this = this

        let scope = this.VALUES[altnum]

        this.FORMULAS.forEach(function(formula, key) {

            console.log('formula '+formula)
            let exp = _this.math.parse(formula)
            let res = _this.math.evaluate(exp, scope)
            scope.set(key, res)
        })

        this.FORMULAS.forEach(function(formula, key) {

            console.log('unit formula '+formula)
            // todo
        })
    }

    change_formula(name, formula) {

        let _this = this;

        if (!name_valid(name)) throw new Error(`Error - invalid name ${name}`) 
        
        if (this.FORMULAS.has(name)) {
            this.FORMULAS.delete(name);
        }

        // if formula is blank, clear values
        let exp = _this.math.parse(formula)
        if (exp.type === 'Empty') {

            this.VALUES.forEach(function(scope, _i) {

                scope.set(name, "")
            })
        } 
        else {

            // else if formula is invalid, put error message in first result column
            let errmsg = _this.math.expression_error(formula)
            if (errmsg) {

                this.VALUES.forEach(function(scope, _i) { 
                    scope.set(name, "") 
                })
                this.VALUES[0].set(name, new Error(errmsg))
                this.UNITS.set(name, "") // TODO
            } 
            
            // else formula valid and non-blank, so save, and update result cols
            else {

                this.FORMULAS.set(name, formula);
                this.VALUES.forEach(function(scope, _i) {
    
                    let res = _this.math.evaluate(exp, scope);
                    scope.set(name, res);
                })
                let unit = _this.unit.evaluate(exp, this.UNITS)
                this.UNITS.set(name, unit) 
            }
        }
    }
}

export { DataManager }