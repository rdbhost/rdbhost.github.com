
import { MyMath, name_valid, write_result_cell } from './math-tools.js'
import { FunctionMap /*, UnitFunctionMap */ } from './functions.js'

class ColumnGetter {

    constructor(col, map) {

        this.colidx = col
        this.map = map
    }

    get(tag) {

        let $row = this.map.get(tag)
        if ( !$row )
            return undefined
        return $($row.find('td.result')[this.colidx])
    }

    has(tag) {

        return this.map.has(tag) 
    }
}

class FormulaGetter {

    constructor(map) {

        this.map = map
    }

    get(tag) {

        let $row = this.map.get(tag)
        if ( !$row )
            return undefined
        return $row.find('td.formula')
    }

    has(tag) {

        return this.map.has(tag) 
    }
 
}

class DataManager {

    constructor() {

        this.ROWS = new Map()
        this.math = new MyMath()
    }
    
    add_row(name, $tr) {

        this.ROWS.set(name, $tr)
    }

    remove_row(name) {

        this.ROWS.delete(name);    
    }

    rename_row(prev, now) {

        let need_update = false;

        if (now == " ") now = "" 

        if (now == "") { 
            this.ROWS.delete(prev)
        }
        else {
            need_update = true;

            if (!name_valid(now)) 
                throw new Error(`invalid name ${now}`) 

            if (this.ROWS.has(prev)) {
                let tmp = this.ROWS.get(prev)
                this.ROWS.delete(prev)
                this.ROWS.set(now, tmp)
            }
        }
        return need_update
    }

    column(colidx) {

        let cg = new ColumnGetter(colidx, this.ROWS)
        return cg // ObjectMapWrap(cg)
    }

    formulas() {

        return new FormulaGetter(this.ROWS)
    }

    update_calculated_rows(altnum) {

        let _this = this
        let scope = this.column(altnum)

        if (!scope)
            throw new Error(`this.VALUES[${altnum}] is nullish`)

        let formulas = this.formulas()

        this.ROWS.forEach(function($row, key) {

            let formula = formulas.get(key)
            formula = formula ? formula.data('value') : undefined
            formula = formula ? formula.replace(/\s/g, "") : undefined

            if (formula) {

                let exp = _this.math.parse(formula)
                let res = (exp.name === 'Error' ? exp : _this.math.evaluate(exp, scope))
    
     //           let unit = _this.UNITS.getItem(key)
     //           let factor = unit.data('conversion_factor')
    
     /*           if (factor !== undefined) {
    
                    res = res * factor
                    scope.set(key, {value: res, convert: !!factor})
                    $formulaTd.attr('data-conversion', factor.toPrecision(3)).addClass('convert')
                }
                else { */
                
                    write_result_cell(scope.get(key), res)
                    // formula.removeAttr('data-conversion').removeAttr('convert')
    
                    if (res?.cause && res.cause.length) {
                        res.cause.forEach(function(key) {
                            let badsrc = scope.getItem(key)
                            badsrc.addClass('error')
                        })
                    }
    //            }
                }
        })

    }

}

export { DataManager }