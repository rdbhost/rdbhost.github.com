import { DataManager } from './datamanager.js'
import { name_valid, clean_name, formula_formatter, result_formatter } from './math-tools.js'
import { get_storable, replace_table_from_json } from './persistance.js';
//import { format_unit } from './unit-math.js';

const MAX_ALTS = 8
var draggable_rows = 0,
    draggable_columns = 0
    
// set_contenteditable_cols -- function to examine a row, and set 
//   style and editability of formula, result, and unit cells
//   based on content of row.
//
function set_contenteditable_cols($row) {

    let name = $row.find('.name').text(),
        $formula = $row.find('.formula'),
        $results = $row.find('.result'),
        $rcols = $row.find('.formula, .result, .unit');

    if (name == "") { // if name not given, formula and results noteditable

        $rcols.attr('contenteditable', 'false')
            .addClass('readonly')
        $row.find('.result, .unit').attr('tabindex', -1)      
        $formula.attr('tabindex', 0);
            
    } 
    else {    // if name provided, then formula and results are either/or
        
        $rcols.attr('contenteditable', 'true')
            .removeClass('output readonly').attr('tabindex', 0)
    
        if ($formula.text() != "") {  // formula non-blank
            $results.attr('contenteditable', 'false')
                .addClass('output').removeClass('readonly').attr('tabindex', -1);
            $formula.attr('tabindex', 0);

        } else {  // formula is blank
        
            $results.attr('contenteditable', 'true')
                .removeClass('output readonly').attr('tabindex', 0);
            if ($results.text() != "") {
                $formula.attr('contenteditable', 'false')
                    .addClass('readonly').attr('tabindex', -1);
            }
        }
    }
}

// minimize_table_results - removes all results columns beyond first, from header
//  and blank_row.  also removes all rows (other than saved blank)
//
function minimize_table($table) {

    let $header = $table.find('thead > tr')
    let $excess = $header.find('th.result:not(:first)')
    $excess.remove()

    let $blank = $table.data('blank_row')
    $excess = $blank.find('td.result:not(:first)')
    $excess.remove()

    $table.find('tbody > tr').remove()
}

// add row to sheet
//
function add_row_to_sheet($table, $after, descr, name, formula, results, unit) {

    let $new = $table.data('blank_row').clone(true, true)

    $new.find('.description').text(descr)
    $new.find('.name').text(name).data('prev-val', name)
    $new.find('.formula').text(formula).data('prev-val', formula)
    $new.find('.unit').text(unit).data('prev-val', unit)

    let $results = $new.find('.result')
    if (results.length == 0)
        results.length = $results.length
    if ($results.length !== results.length) 
        throw new Error(`results length mismatch ${$results.length} ${results.length}`)

    results.forEach(function(val, i) {

        let $td = $($results.get(i))
        $td.text(val || "").data('prev-val', val || "")
        $td.data('alt', i)
    })

    // if an $after row provide, put new after it, else put new at end
    if ($after) 
        $after.after($new)
    
    else 
        $table.find('tbody').append($new)

    // if new row is not blank, added result cells, unit cells, and formula to DataManager
    if (name) {

        let DM = $table.data('DM')
        DM.add_row(name, $new.find('td.result'), $new.find('td.unit'))
        if (formula) {

            DM.change_formula(name, $new.find('.formula'))
        }

        set_contenteditable_cols($new)
    }
    
}

// test that a row is blank
//
function row_is_blank($row) {

    if ($row.length === 0) 
        return false 
    
    let isBlank = (($row.find('.description').text() == "")
                &&  ($row.find('.name').text() == "")
                &&  ($row.find('.formula').text() == "")
                &&  ($row.find('.unit').text() == ""));

    if (!isBlank) 
        return false 

    $row.find('.result').each(function(i, td) {
        if ($(td).find('span').text() !== "") {
            isBlank = false
        }
    })
    return isBlank
}

// ensures that the sheet ends with 5 blank rows.
//
function ensure_five_blank($table) {

    // pad to length 5
    let $lastfive = $table.find('tbody > tr').slice(-5);
    while ($lastfive.length < 5) {
        add_row_to_sheet($table, null, "", "", "", [], "")
        $lastfive = $('tbody > tr').slice(-5);
    }
    
    // add blanks so that last five are blank
    while (!row_is_blank($($lastfive.get(0)))
        || !row_is_blank($($lastfive.get(1)))
        || !row_is_blank($($lastfive.get(2)))
        || !row_is_blank($($lastfive.get(3)))
        || !row_is_blank($($lastfive.get(4))) ) {

            add_row_to_sheet($table, null, "", "", "", [], "")
            $lastfive = $table.find('tbody > tr').slice(-5);
    }

    // prune off extra blanks at end
    if ($table.find('tbody > tr').length > 5) {

        let $sixth = $table.find('tbody > tr').slice(-6,-5);
        while (row_is_blank($sixth)) {

            let $tr = $table.find('tbody > tr').last()
            $tr.remove();
            $sixth = $table.find('tbody > tr').slice(-6,-5);
        }
    }
}

// make all rows draggable to reorder
//  all rows are both draggable and also drop targets.
//
function apply_draggable_rows($table) {

    if (draggable_rows > 0)
        throw new Error('applying draggable rows repeatedly')
    draggable_rows += 1

    let drag_opts = {
        axis: "y",              // only vertical dragging
        handle: '.handle',      // grip on left-column only
        revert: "invalid",      // revert if drag-n-drop not valid
        containment: "parent"   // keep dragging within table
    }
    let drop_opts = {  
        accept: 'tr',           // only rows are droppable
        drop: function( event, ui ) {
            let t = $(event.target);
            t.before(ui.draggable);    // drop inserts row before target row
            $(ui.draggable).css({'left': "", 'top': ""}); // remove spurious attributes
            $('table').trigger('row:pad-end');
        }
    }    

    // console.log('applying draggable rows')
    let $rows = $table.find('tbody > tr')
    $rows.draggable(drag_opts).droppable(drop_opts)
}

// remove draggable handlers from all rows
//
function remove_draggable_rows($table) {

    if (draggable_rows < 1)
        throw new Error('removing draggable rows where none exist')
    draggable_rows -= 1

    // console.log('removing draggable rows')
    $table.find('tbody > tr').draggable('destroy').droppable('destroy')
}

// move one result column, including th.  column `num` is moved to just before column `before`
//
function move_result_column($table, num, before) {

    // move `num` column to before `before`
    let $results = $table.find('thead th.result, thead th.alt-add')
    let beforecell = $results.get(before)
    let source = $results.get(num); source.remove()
    beforecell.before(source)

    // for each row in table, move one result col
    $table.find('tbody > tr').each(function(i, row) {

        let $row = $(row)
        let $results = $row.find('td.result, td.alt-add')
        if ($results.length < before) 
            throw new Error(`bad before $(before) in alt drag `) 

        let beforecell = $results.get(before)
        let source = $results.get(num); source.remove()

        beforecell.before(source)
    })

    update_alts($table)
    $table.trigger("table:alt-update")
}

// make result columns, draggable to reorder
//  all result columns are both draggable and droppable targets.
//  the add-alt column is droppable, not draggable
//
function apply_draggable_columns($table) {

    if (draggable_columns > 0)
        throw new Error('applying draggable rows repeatedly')
    draggable_columns += 1

    let drag_opts = {
        axis: "x",              // only horizontal dragging
        revert: "invalid",      // revert if drag-n-drop not valid
        containment: "parent"   // keep dragging within table header
    }
    let drop_opts = {  
        accept: 'th',           // only header cells are droppable
        drop: function( event, ui ) {
            let t = $(event.target);
            $(ui.draggable).css({'left': "", 'top': ""}); // remove spurious attributes
            let from = $(ui.draggable).data('alt')
            let to = t.data('alt')
            console.log(`header ${from} to before ${to}`)
            // TODO - reorder cells in every row to match header
            move_result_column($table, from, to)
        }
    }    

    // let $t = $('thead th.result')
    console.log('applying draggable columns')
    $table.find('thead th.result').draggable(drag_opts).droppable(drop_opts)
    $table.find('thead th.alt-add').droppable(drop_opts)
}

// uninstalls handlers for column drag n drop
//
function remove_draggable_columns($table) {

    if (draggable_columns < 1)
        throw new Error('removing draggable rows where none exist')
    draggable_columns -= 1

    console.log('removing draggable columns')
    $table.find('thead > th.result').draggable('destroy').droppable('destroy')
    $table.find('thead > th.alt-add').droppable('destroy')
}

// click on header '+' adds alt 
//
function remove_alt(evt) {

    let $table = evt.data
    remove_draggable_columns($table)

    let $hdr = $(evt.target).closest('th');
    let altnum = $hdr.data('alt');
    $hdr.remove()

    // in each row, remove one td
    $table.find('tbody > tr').each(function (i, row) {
        let $results = $(row).find('td.result');
        $results.each(function(i, td){
            let $td = $(td);
            if ($td.data('alt') == altnum) {
                $td.remove()
            }
        })
    });

    // remove one td from blank_row
    let $blank_row = $table.data('blank_row')
    let $blank_res = $blank_row.find('td.result');
    $blank_res.each(function(i, td){
        let $td = $(td);
        if ($td.data('alt') == altnum) {
            $td.remove()
        }
    })

    update_alts($table);
    apply_draggable_columns($table)

    $table.trigger("table:alt-update");
}

// addalt_func - a handler for the add-alternate-result-column button
//
function add_alt_column($table) {

    remove_draggable_columns($table)

    // add additional header column, named Alt #
    let $pluscol = $table.find('th.alt-add').first()
    let $h = $table.find('th.result').last().detach() // remove()
    $pluscol.before($h.clone(true))  // restores starting col set
    $h.data('custom_name', '')

    $h.data('custom_name', '') // remove custom name from clonable header
    $h.data('alt', null)
    let $new = $h.clone(true)
    $pluscol.before($new)

    // in each row, add one result column
    $table.find('tbody > tr').each(function (i, row) {

        let $last = $(row).find('td.result').last()
        $last.after($last.clone(true))
    });

    // in blank_row, add one result column
    let $blank_row = $table.data('blank_row')
    let $last = $blank_row.find('td.result').last()
    $last.after($last.clone(true))

    let colnum = update_alts($table)-1
    apply_draggable_columns($table)

    // TODO - add populate_values_for_alt
    // $table.trigger("table:alt-update");
    return colnum
}        

// updates header to show Result, Result 1, Result 2 etc
//   and header and each row to have data('alt') in sequential order
//   starting at 0;
//
function update_alts($table) {

    let headers = $table.find('th.result')

    headers.each(function(i, _th) {

        let $th = $(_th);
        let altnm = 'Result '+i;
        if (i == 0 && headers.length===1 ) { altnm = 'Result' };
        let $span = $th.find('span')
        $span.text($th.data('custom_name') || altnm)
        $th.data('alt', i)
    })
    $table.find('th.alt-add').data('alt', headers.length)

    // in each row, push alt value into data
    $table.find('tbody > tr').each(function (z, _row) {
        
        let tds = $(_row).find('.result');
        tds.each(function(i, td) {
            $(td).data('alt', i);
        });
    });

    // if at maximum column count, hide and disable add-alt button
    if (headers.length >= MAX_ALTS) {
        $table.find('th.alt-add button.close-res').hide();
        $table.find('th.alt-add').off();            
    }

    // if multiple alts avail, reveal '-' remove buttons to each
    if (headers.length>1) {
        headers.find('button.close-res').show();
        headers.find('button.close-res').on();
        headers.find('button.close-res').on('click', $table, remove_alt) // extra params???
    }
    // otherwise, hide and disable '-' buttons 
    else {
        headers.find('button.close-res').hide();
        headers.find('button.close-res').off();
    }

    return headers.length
}

// load data for given sheet_name from localStorage, and populate html table
//
function load_sheet($table, sheet_name) {

    // load sheet data for target sheet
    let saved = get_storable(sheet_name)
    if (!saved) 
        throw new Error(`sheet ${sheet_name} not found in localStorage`) 
 
    minimize_table($table)
    replace_table_from_json($table, saved)
 
    ensure_five_blank($table)
    table_normalize($table)
 
    $table.trigger("table:global-recalc")
}
 
// processes raw table html, saving blank_row template to table.data() and 
//   removing all rows
//
function initialize($table) {

    // grab copy of first row, presumed blank.
    let $blank_row = $table.find('tbody > tr').first()
    $blank_row.remove();

    // initialize blank row
    set_contenteditable_cols($blank_row)
    $blank_row.find('.result').data('alt', 0)

    // store blank row in $table.data
    $table.data('blank_row', $blank_row)

    // remove all other rows from table
    minimize_table($table)
}
 

// processes all html table rows, saving to data(), saving data to 
//   DataManager and formatting as necessary
//
function table_normalize($table) {

    const DM = new DataManager();
    $table.data('DM', DM)

    // setup initial sheet
    let $headers = $table.find('th.result');
    $headers.find('button.close-res').hide().off();

    $table.find('tbody > tr').each(function(i, tr) {

        let $row = $(tr)
        set_contenteditable_cols($row);

        // for name cell, set data[prev-val]
        let name = $row.find('.name').text()
        $row.find('.name').data('prev-val', name);

        // for result cell, set alt val in data
        $row.find('.result').first().data('alt', 0)

        let $form_cell = $row.find('.formula')
        $form_cell.data('value', $form_cell.text())
        $form_cell.text(formula_formatter($form_cell.text()))
    })

    update_alts($table)

    // push values from initial sheet into VALUES[0] MapScope
    $headers.each(function(i, th) {

        let altnum = $(th).data('alt');
        DM.populate_values_for_alt(altnum);
    });

    // push formulas from initial sheet into FORMULAS Map, and recalc
    DM.populate_formulas_and_units();

    ensure_five_blank($table)
    apply_draggable_rows($table)
    apply_draggable_columns($table)

}

// tbody_handlers install click handlers on tbody and thead for most click events
//
function tbody_handlers($table) {

    // double click on left-column duplicates row
    //
    $table.find('tbody').on("dblclick", ".handle", function(evt) {   // tbody
 
        remove_draggable_rows($table)

        let $tr = $(evt.target).closest('tr')
        let name = $tr.find('td.name').text()
        let descr = $tr.find('td.description').text()
        let formula = $tr.find('td.formula').text()
        let unit = $tr.find('td.unit').text()

        let res = $tr.find('td.result').map(function(i, td) { 
            return $(td).text() 
        }).get()

        if (name) {

            let DM = $table.data('DM')
            while (DM.VALUES[0].has(name)) 
                name = name+'_';
            add_row_to_sheet($table, $tr, descr, name, formula, res, unit)
            
            $table.trigger('table:global-recalc')   // TODO use row specific recalc
        }
        else 
            add_row_to_sheet($table, $tr, descr, "", "", [], "")    

        update_alts($table)
        apply_draggable_rows($table)
    });

    // click on right-column deletes row
    //
    $table.find('tbody').on("click", '.delete', function(evt) {

        remove_draggable_rows($table)

        let $tr = $(evt.target).closest('tr')
        let name = $tr.find('.name').text()
        if (name) {
            let DM = $table.data('DM')
            DM.remove_row(name) 
            $table.trigger('table:global-recalc')   
        }
        $tr.remove()

        apply_draggable_rows($table)
        $table.trigger('row:pad-end')   // and pad end of table
    });


    // focusout handler on description column checks for data entry, and 
    //  fires table-padding signal if any description was left
    //
    $table.find('tbody').on("focusout", '.description', function(evt) {

        let $td = $(evt.target);                // $td is jquery obj for td element
        if (!$td.text()) { return }

        if (!$td.data('prev-val')) {            // if there was no prior value, 

            $td.data("prev-val", $td.text())    // store description in data
            $table.trigger('row:pad-end')   // and pad end of table
        } 
    });

    // focusout handler on name column checks for name change, and 
    //  fires global rename event if name was changed.
    //
    $table.find('tbody').on("focusout", '.name', function(evt) {

        let $td = $(evt.target);                 // $td is $(<td>)
        let $tr = $td.closest('tr')
        let name = $td.text()

        if (!name_valid(name)) {
            name = clean_name(name)
            $td.text(name)
        }

        if ($td.text() !== $td.data("prev-val")) { // is name diff from stored?

            set_contenteditable_cols($tr)

            if ($td.text() === "") {
                $tr.find('.formula').text("");
                $tr.find('.result').each(function(i, td) {
                    $(td).text("").data('value', "")
                })
                
            } else {
            
                let DM = $table.data('DM')
                while (DM.VALUES[0].has(name)) {
                    name = name+'_';
                }
            }

            // if prev-val is defined, send a row:rename signal
            if ($td.data('prev-val') !== "" && $td.data('prev-val') !== undefined) {

                $('table').trigger("row:rename", [$td.data("prev-val"), name]);
            }
            // otherwise, if name defined, send a row:add signal
            else if (name) {

                $('table').trigger("row:add", [name, $tr.find('.result'), $tr.find('.unit')])
            }
            $td.data("prev-val", name)      // store new name in data
            $td.text(name)

            $('table').trigger('row:pad-end')
        } 
    });

    // handler on formula cells changes the contenteditable and styling
    //   of formula and result cells 
    //
    $table.find('tbody').on('focusin', '.formula', function(evt) {

        let $td = $(evt.target);                    // $td is $<td>
        if ($td.attr('contenteditable') == 'false') 
            return
        $td.text($td.data('value')).removeClass('convert')
    })
    $table.find('tbody').on('focusout', '.formula', function(evt) {
        
        let $td = $(evt.target);                    // t is $<td>
        let $tr = $td.closest('tr');

        let formula = $td.text()
        $td.text(formula_formatter(formula))
        if ($td.attr('data-conversion'))
            $td.addClass('convert')

        if (formula !== ($td.data("prev-val") || '')) {            // is formula diff from stored?

            $td.data("prev-val", formula).data('value', formula);  // store new formula in data

            let name = $tr.find('td.name').text();
            $table.trigger("row:formula-change", [name, $td]);       
        } 

        set_contenteditable_cols($tr)
        //if ($td.attr('contenteditable') == 'false') 
        //    return 

    })

    // handler on result cells pushes data changes into data() and calls
    //   for global recalc
    //   
    $table.find('tbody').on('focusin', '.result', function(evt) {

        let $td = $(evt.target);                    // $td is $<td>
        if ($td.attr('contenteditable') == 'false') 
            return 

/*        if ($td.data('prev-val') !== undefined) {

            $td.data('polished', $td.text())
            $td.text($td.data('prev-val'))
        }
        else
            $td.data('polished', '') */
    })
    $table.find('tbody').on('focusout', '.result', function(evt) {

        let $t = $(evt.target),
            $tr = $t.closest('tr')

        set_contenteditable_cols($tr)

        if ($t.attr('contenteditable') === 'false') 
            return

        let input_val = $t.text()
/*        if ($t.data('prev-val') === input_val) {

            $t.text($t.data('polished'))
            return
        } */

        $t.data('prev-val', input_val)

        let name = $tr.find('.name').text() 
        let DM = $table.data('DM')
        let scope = DM.VALUES[$t.data('alt')] 
        if (!scope) debugger

        if (input_val === "") {

            scope.set(name, "")
        }
        else {

            let res = DM.math.data_input_evaluater(input_val, scope)
            scope.set(name, res)
        }
        $table.trigger('table:global-recalc')  // TODO: change to column recalc
    })


     // handler on unit cells changes the contenteditable and styling
    //   of unit cells
    //
    $table.find('tbody').on('focusout', '.unit', function(evt) {
        
        let $td = $(evt.target);                    // t is $<td>
        let $tr = $td.closest('tr');

        set_contenteditable_cols($tr)
        if ($td.attr('contenteditable') == 'false') return 

        let unit = $td.text()
        if (unit !== ($td.data("prev-val") || '')) {         // is unit diff from stored?

            $td.data("prev-val", unit).data('value', unit);  // store new unit in data
            let disp = unit // format_unit(unit)
            if (disp?.message) {

                $td.text(unit).data('value', undefined).data('prev-val', unit)
                $td.addClass('error')
            }
            else {

                $td.text(disp).removeClass('error')
            }

            let name = $tr.find('td.name').text();
            $table.trigger("row:unit-change", [name, $td.data('value')]);       
        } 
    })

    // dblclick on result column header enables editing of header
    //
    $table.find('thead').on('dblclick', 'th.result', function(evt) {

        // enable content editing, and put focus in cll
        let $th = $(evt.target).closest('th')
        let $span = $th.find('span');
        $span.attr('contenteditable', 'true')
        $span.trigger('focus')

        // one-shot focusout handler saves changes to data() and disables editing
        $span.one('focusout', function() {

            if ($span.text()) {
                $th.data('custom_name', $span.text())
            }
            else {
                let append = $table.find('thead th.result').length > 1 ? $span.closest('th').data('alt') : ""
                $span.text('Result '+append)
                $th.data('custom_name', null)
            }

            $span.attr('contenteditable', 'false')
        })

    })

    // $table becomes available on event obj as evt.data
    $table.find('thead').on('click', '.alt-add', function() {

        $table.trigger('table:add-alt-column', [$table])
    });  

}

export { initialize, table_normalize, tbody_handlers, set_contenteditable_cols, update_alts, add_alt_column,
         load_sheet, ensure_five_blank, row_is_blank, 
         apply_draggable_columns, remove_draggable_columns, apply_draggable_rows, remove_draggable_rows }