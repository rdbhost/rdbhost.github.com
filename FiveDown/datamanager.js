
import { MapScope, MyMath, name_valid, formatter } from './math-tools.js'

class DataManager {

    constructor() {

        this.VALUES = Array();
        this.FORMULAS = new Map();
        this.math = new MyMath();
    }
    
    add_row(name, $tds) {

        var _this = this;

        $tds.each(function(i, td) {

            _this.VALUES[i].add(name, $(td));
        })
    }

    remove_row(name) {

        this.VALUES.forEach(function(vals, i) {
            if (vals.has(name)) {
                vals.remove(name);
            }
        })
        this.FORMULAS.delete(name);    
    }

    rename_row(prev, now) {

        let need_update = false;

        if (now == "") { 
            this.VALUES.forEach(function(vals, i) {
                if (vals.has(prev)) {
                    vals.remove(prev);
                }
            })
            this.FORMULAS.delete(prev);
        }
        else {
            need_update = true;
        }
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

        return need_update
    }

    populate_values_for_alt(altnum) {
    
        this.VALUES[altnum] = new MapScope();
        let _this = this;
    
        $('tbody > tr').each(function(z, row) {
    
            let $row = $(row);
            let name = $row.find('.name').text();
            if (!name_valid(name)) { throw new Error(`invalid name ${name}`) };
    
            $row.find('.result').each(function(i, td) {
                let $td = $(td);
                if ($td.data('alt') == altnum) {
                    _this.VALUES[altnum].add(name, $td);
                }
            })
        })
    }

    populate_formulas() {
    
        let _this = this;

        $('tbody > tr').each(function(z, row) {
    
            let $row = $(row);
            let formula = $row.find('.formula').text();
            if (formula == "") { return };

            let name = $row.find('.name').text();
            if (!name_valid(name)) { throw new Error(`invalid name ${name}`) };

            _this.FORMULAS.set(name, formula);
        })
    }

    update_calculated_rows(altnum) {

        let _this = this;

        let scope = this.VALUES[altnum];

        this.FORMULAS.forEach(function(formula, key) {

            console.log('formula '+formula);
            let exp = _this.math.parse(formula)
            let res = _this.math.evaluate(exp, scope);
            scope.set(key, res);
        });
    }

    change_formula(name, formula) {

        let _this = this;

        if (!name_valid(name)) { throw new Error(`Error - invalid name ${name}`) };
        
        if (this.FORMULAS.has(name)) {
            this.FORMULAS.delete(name);
        }

        // if formula is invalid, put error message in first result column
        let errmsg = _this.math.expression_error(formula)
        if (errmsg) {
            this.VALUES[0].set(name, new Error(errmsg))
        // else save formula in FORMULAS
        } else {
            this.FORMULAS.set(name, formula);
            this.VALUES.forEach(function(scope, _i) {

                let exp = _this.math.parse(formula)
                let res = _this.math.evaluate(exp, scope);
                scope.set(name, res);
            })
        }
    }
}

export { DataManager }