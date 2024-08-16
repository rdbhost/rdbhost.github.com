
// gather_storable - iterates over html table, extracting data to store
//   returns an array; each element is either null or an array
//   the row array is description, name, unit, formula or results array
//
function gather_storable($table) {

    let itms = []

    // iterate over table rows
    $table.find('tbody > tr').each(function(_i, tr) {

        let $tr = $(tr)
        let row = []

        let description = $tr.find('.desc').text()
        let name = $tr.find('.name').text()
        if (name || description) {

            let unit = $tr.find('.unit').text()
            row.push(description, name, unit)

            let formula = $tr.find('.formula').text()
            if (formula) {
                row.push(formula)
            } 
            else {
                let results = []
                $tr.find('.result').each(function(_j, td) {
    
                    results.push($(td).data('value'))
                })
    
                row.push(results)
            }
            itms.push(row)    
        }
        else {
            itms.push(null)
        }
    })

    return itms
}

// replace_table_from_json - removes all rows from table, and generates
//   new set of rows from provided data
//
function replace_table_from_json($table, rows) {

    if (!rows) { throw new Error('data not provided') }

    let $trs = $table.find('tbody > tr')
    let $blank_row = $trs.first(); $blank_row.remove()
    $trs.remove()
    $table.find('tbody').append($blank_row.clone(true))

    // count how many result columns are in source data,
    //  basing on longest row
    //
    let altct = rows.reduce(function(m, v) {
        if (v && Array.isArray(v[v.length-1])) {
            return Math.max(m, v[v.length-1].length)
        }
        return m
    }, 0)

    // if there are multiple result columns, expand the header row
    //   and also the blank row, to include enough result columns
    //
    if (altct > 1) {
        
        let $res = $table.find('thead th.result')
        let $resplus = $res.next(); $res.remove()
        for (i=0; i<altct; i++) {
            $resplus.before($res.clone(true))
        }

        $res = $blank_row.find('.result')
        $resplus = $res.next(); $res.remove()
        for (i=0; i<altct; i++) {
            $resplus.before($res.clone(true))
        }
    }

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
            $new.find('.unit').text(unit).data('prev-val', unit)

            if (!Array.isArray(other)) {
                $new.find('.formula').text(other).data('prev-val', other)
            }
            else {
                let $res = $new.find('.result')
                if ($res.length !== other.length) { throw new Error('result ct mismatch') }
                    
                $res.each(function(i, v) {
                    let $td = $(v)
                    $td.text(other[i]).data('value', other[i]).data('prev-val', other[i])
                })
            }
        }
    })
}

// get_storable - gets value from localStorage for provided key
//
function get_storable(id) {

    let d = window.localStorage.getItem(id)
    if (d) {
        return JSON.parse(d)        
    }
    return null
}

// save_storable - save provided data as a JSON string in localStorage
//
function save_storable(id, data) {

    let j = JSON.stringify(data)
    window.localStorage.setItem(id, j)
}

export { save_storable, get_storable, gather_storable, replace_table_from_json }

