
import { DataManager } from './datamanager.js'
import { result_formatter } from './math-tools.js'
import { ValScope } from './scopes.js'
import { set_contenteditable_cols } from './sheet.js'
import { samples } from './samples.js'

// gather_storable - iterates over html table, extracting data to store
//   returns an array; each element is either null or an array
//   the row array is description, name, unit, formula or results array
//
function gather_storable($table) {

    let itms = []
    var scope = new ValScope()

    let columns = $table.find('thead th.result').get().map(function(v, _i) { 
        return $(v).data('custom_name') || null 
    })

    // iterate over table rows
    $table.find('tbody > tr').each(function(_i, tr) {

        let $tr = $(tr)
        let row = []

        let tempDM = new DataManager()

        let description = $tr.find('.desc').text()
        let name = $tr.find('.name').text()
        if (name || description) {

            let unit = $tr.find('.unit').text()
            row.push(description, name, unit)

            let formula = $tr.find('.formula').data('value') || $tr.find('.formula').text()
            if (formula) {

                row.push(formula)
            } 
            else {
                
                let results = []
                $tr.find('.result').each(function(_j, td) {
    
                    let $td = $(td)
                    let d = $td.data('value') || $td.text() ? tempDM.math.data_input_evaluater($td.text(), scope) : ""
                    results.push(d)
                })
    
                if (results.some((a) => !!a)) { row.push(results) }
                else { row.push("") }
            }

            itms.push(row) 
        }
        else {
            itms.push(null)
        }
    })

    return {'header': columns,
            'rows': itms}
}

// replace_table_from_json - removes all rows from table, and generates
//   new set of rows from provided data
//
function replace_table_from_json($table, data) {

    if (!data) 
        throw new Error('data not provided') 
    if (!data['rows']) 
        return 

    let $blank_row = $table.data('blank_row')

    let rows = data['rows']
    let result_cols = data['header']
    let altct;

    // if json data provides a list of result_cols, get count from that
    //
    if (result_cols) {

        altct = result_cols.length
    }
    else {

        // otherwise count how many result columns are in source data,
        //  basing on longest row
        //
        altct = rows.reduce(function(m, v) {
            if (v && Array.isArray(v[v.length-1])) {
                return Math.max(m, v[v.length-1].length)
            }
            return m
        }, 0)
    }

    // if there are multiple result columns, expand the header row
    //   and also the blank row, to include enough result columns
    //
    let $res = $table.find('thead th.result')
    let $resplus = $table.find('.alt-add')
    $res.remove()
    for (let i=0; i<altct; i++) {
        let $t = $res.first().clone(true)
        $resplus.before($t)
        if (result_cols[i]) {
            $t.data('custom_name', result_cols[i])
            $t.find('span').text(result_cols[i])
        }
    }

    // fix the blank row
    $res = $blank_row.find('.result')
    $resplus = $blank_row.find('.alt-add')
    $res.remove()
    for (let i=0; i<altct; i++) 
        $resplus.before($res.first().clone(true))

    // iterate over rows in source data
    //
    rows.forEach(function(val, i) {
        
        // append blank row to table
        let $new = $blank_row.clone(true)
        $table.find('tbody').append($new)

        // if source row is not null, insert data into tr
        if (val !== null) {

            let [description, name, unit, other] = val
            $new.find('.desc').text(description).data('prev-val', description)
            $new.find('.name').text(name).data('prev-val', name)
            $new.find('.unit').text(unit).data('prev-val', unit).data('value', unit)

            if (!Array.isArray(other)) {

                $new.find('.formula').text(other).data('prev-val', other).data('value', other)
            }
            else {

                let $res = $new.find('.result')
                if (other.length == 0)
                    other.length = $res.length
                if ($res.length !== other.length) 
                    throw new Error('result ct mismatch') 
                    
                $res.each(function(i, v) {
                    let $td = $(v)
                    $td.text(result_formatter(other[i])).data('value', other[i]).data('prev-val', other[i])
                })
            }
        }

        set_contenteditable_cols($new)
    })
}

// get_storable - gets value from localStorage for provided key
//
function get_storable(id) {

    let d = samples[id] 
    if (d)
        return d

    d = window.localStorage.getItem(id)
    if (d) 
        return JSON.parse(d)        

    return null
}

// save_storable - save provided data as a JSON string in localStorage
//
function save_storable(id, data) {

    if (!id) 
        throw new Error('bad id ${id} in save_storable') 

    if (id in samples)
        return

    let j = JSON.stringify(data)
    window.localStorage.setItem(id, j)
}

// get_next_sheet_name = get first sequential sheet_# name that is not already in localStorage
//
function get_next_sheet_name() {

    for (let i=0; i<100; i++) {
        let num = '00'+i
        let name = 'sheet_'+num.substring(num.length-2)
        if (!window.localStorage.getItem(name)) { 
            return name
        }
    }
    throw new Error('no next sheet number found')
}

// get_all_sheet_names - gets a list of all sheet-names in localStorage + samples
//
function get_all_sheet_names() {

    let names = []
    for (let i=0; i<window.localStorage.length; i++) {
        if (window.localStorage.key(i).substring(0,5).toLowerCase() === 'sheet') {

            names.push(window.localStorage.key(i))
        }
    }

    let sampls = Object.keys(samples)
    names = names.concat(sampls)

    return names
}

// removes a named sheet from localStorage
//
function remove_sheet_from_storage(sheet_id) {

    if (sheet_id in samples)
        return 

    if (!window.localStorage.getItem(sheet_id)) 
        throw new Error(`sheet ${sheet_id} not found in storage`) 

    let s = window.localStorage.removeItem(sheet_id)
}

export { save_storable, get_storable, gather_storable, replace_table_from_json, 
         get_next_sheet_name, get_all_sheet_names, remove_sheet_from_storage }

