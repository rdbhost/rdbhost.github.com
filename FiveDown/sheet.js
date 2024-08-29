import { DataManager } from './datamanager.js'
import { name_valid, clean_name, formula_formatter } from './math-tools.js'
import { get_storable, replace_table_from_json } from './persistance.js';

const MAX_ALTS = 8;
    
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
            
    } else {    // if name provided, then formula and results are either/or
        
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

// test that a row is blank
//
function row_is_blank($row) {

    if ($row.length === 0) { return false }
    
    let blank = (($row.find('.desc').text() == "")
                &&  ($row.find('.name').text() == "")
                &&  ($row.find('.formula').text() == "")
                &&  ($row.find('.unit').text() == ""));

    if (!blank) { return false }

    $row.find('.result').each(function(i, td) {
        if ($(td).find('span').text() !== "") {
            blank = false;
        }
    })
    return blank;
}
function rows_are_blank($rows) {

    let fail = false;
    $rows.each(function(i, row) {
        if (!row_is_blank($(row))) { fail = true; }
    })
    return !fail;
}

// ensures that the sheet ends with 5 blank rows.
//
function ensure_five_blank($table) {

    let $blank_row = $table.data('blank_row')

    // pad to length 5
    let $lastfive = $table.find('tbody > tr').slice(-5);
    while ($lastfive.length < 5) {
        let $br = $blank_row.clone(true)
        $table.find('tbody').append($br);
        $lastfive = $('tbody > tr').slice(-5);
    }
    
    // add blanks so that last five are blank
    while (!rows_are_blank($lastfive)) {
        let $br = $blank_row.clone(true)
        $table.find('tbody').append($br);
        $lastfive = $table.find('tbody > tr').slice(-5);
    };
    // prune off extra blanks at end
    if ($table.find('tbody > tr').length > 5) {
        let $sixth = $table.find('tbody > tr').slice(-6,-5);
        while (row_is_blank($sixth)) {
            let $tr = $table.find('tbody > tr').last()
            $tr.remove();
            $sixth = $table.find('tbody > tr').slice(-6,-5);
        };
    }

    update_alts($table)
}

// make all rows draggable to reorder
//  all rows are both draggable and also drop targets.
//
function apply_draggable_rows($table) {

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

    let $rows = $table.find('tbody > tr')
    $rows.draggable(drag_opts).droppable(drop_opts)
}

// remove draggable handlers from all rows
//
function remove_draggable_rows($table) {

    $table.find('tbody > tr').draggable('destroy').droppable('destroy')
}

// move one result column, including th.  column `num` is moved to just before column `before`
//
function move_result_column($table, num, before) {

    // move `num` column to before `before`
    let $results = $table.find('thead th.result, thead th.alt-add')
    let $before = $results.get(before)
    let $num = $results.get(num); $num.remove()
    $before.before($num)

    // for each row in table, move one result col
    $table.find('tbody > tr').each(function(i, row) {

        let $row = $(row)
        let $results = $row.find('td.result, td.alt-add')
        if ($results.length < before) { throw new Error(`bad before $(before) in alt drag `) }

        let $before = $results.get(before)
        let $num = $results.get(num); $num.remove()

        $before.before($num)
    })

    update_alts($table)
}

// make result columns, draggable to reorder
//  all result columns are both draggable and droppable targets.
//  the add-alt column is droppable, not draggable
//
function apply_draggable_columns($table) {

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
    $table.find('thead th.result').draggable(drag_opts).droppable(drop_opts)
    $table.find('thead th.alt-add').droppable(drop_opts)
}

// uninstalls handlers for column drag n drop
//
function remove_draggable_columns($table) {

    $table.find('thead > th.result').draggable('destroy').droppable('destroy')
    $table.find('thead > th.alt-add').droppable('destroy')
}

// click on header '+' adds alt 
//
function remove_alt(evt, $table) {

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
function addalt_func(evt) {

    let $table = evt.data
    remove_draggable_columns($table)

    // add additional header column, named Alt #
    let $pluscol = $table.find('th.alt-add').first()
    let $h = $table.find('th.result').last().remove()
    $pluscol.before($h.clone(true))  // restores starting col set

    let $new = $h.clone(true)
    $pluscol.before($new)

    // in each row, add one result column
    $table.find('tbody > tr').each(function (i, row) {
        let $last = $(row).find('td.result').last()
        $last.after($last.clone(true));
    });

    // in blank_row, add one result column
    let $blank_row = $table.data('blank_row')
    let $last = $blank_row.find('td.result').last()
    $last.after($last.clone(true));

    update_alts($table);
    apply_draggable_columns($table)

    $table.trigger("table:alt-update");
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
        headers.find('button.close-res').click($table, remove_alt) // extra params???
    }
    // otherwise, hide and disable '-' buttons 
    else {
        headers.find('button.close-res').hide();
        headers.find('button.close-res').off();
    }
}

// load data for given sheet_name from localStorage, and populate html table
//
function load_sheet($table, sheet_name) {

    // load sheet data for target sheet
    let saved = get_storable(sheet_name)
    if (!saved) { throw new Error(`sheet ${sheet_name} not found in localStorage`) }
 
    $table.find('tbody > tr').remove()
    replace_table_from_json($table, saved)
 
    ensure_five_blank($table)
    table_initialize($table)
 
    $table.trigger("table:global-recalc")
}
 
// processes raw table html, saving blank_row template to table.data() and 
//   removing all rows
//
function initialize($table) {

    // grab copy of first row, presumed blank.
    let $blank_row = $table.find('tbody > tr').first()
    set_contenteditable_cols($blank_row)
    $blank_row.remove();
    $blank_row.find('.result').data('alt', 0)
    $table.data('blank_row', $blank_row)

    $table.find('tbody > tr').remove()

}

// processes all html table rows, saving to data(), saving data to 
//   DataManager and formatting as necessary
//
function table_initialize($table) {

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

    // push values from initial sheet into VALUES[0] MapScope
    $headers.each(function(i, th) {

        let altnum = $(th).data('alt');
        DM.populate_values_for_alt(altnum);
    });

    // push formulas from initial sheet into FORMULAS Map, and recalc
    DM.populate_formulas_and_units();

    // $table becomes available on event obj as evt.data
    $table.find('th.alt-add').on('click', $table, addalt_func);  

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
 
        remove_draggable_columns($table)

        let $tr = $(evt.target).closest('tr');
        let $tr2 = $tr.clone(true, true)
        let name = $tr.find('td.name').text()

        let DM = $table.data('DM')
        while (DM.VALUES[0].has(name)) {
            name = name+'_';
        }
        $tr2.find('td.name').text(name)
        $tr2.find('td.name').data('prev-val',name)
        $tr.after($tr2);

        apply_draggable_columns($table)
    });

    // click on right-column deletes row
    //
    $table.find('tbody').on("click", '.delete', function(evt) {

        remove_draggable_rows($table)

        let $tr = $(evt.target).closest('tr')
        let name = $tr.find('.name').text()
        let DM = $table.data('DM')
        if (name) { DM.remove_row(name) }
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
        if ($td.attr('contenteditable') == 'false') { return }
        $td.text($td.data('value'))
    })
    $table.find('tbody').on('focusout', '.formula', function(evt) {
        
        let $td = $(evt.target);                    // t is $<td>
        let $tr = $td.closest('tr');

        if ($td.attr('contenteditable') == 'false') { return }
        set_contenteditable_cols($tr)

        let formula = $td.text()
        $td.text(formula_formatter(formula))

        if (formula !== ($td.data("prev-val") || '')) {            // is formula diff from stored?

            $td.data("prev-val", formula).data('value', formula);  // store new formula in data
            // let $res = $tr.find('td.result');
            //$res.text('');                         // clear non-calced result value

            let name = $tr.find('td.name').text();
            $table.trigger("row:formula-change", [name, $td.data('value')]);       
        } 
    })

    // handler on result cells pushes data changes into data() and calls
    //   for global recalc
    //   
    $table.find('tbody').on('focusout', '.result', function(evt) {

        let $t = $(evt.target),
            $tr = $t.closest('tr'),
            name = $tr.find('.name').text()

        set_contenteditable_cols($tr)

        if ($t.attr('contenteditable') === 'false') {
            return;
        }

        let DM = $table.data('DM')
        let scope = DM.VALUES[$t.data('alt')]
        let input_val = $t.text()

        if ($t.data('prev-val') === input_val) {
            return
        } else {
            $t.data('prev-val', input_val)
        }

        if (input_val === "") {

            scope.set(name, "")
        }
        else {

            let DM = $table.data('DM')
            let res = DM.math.data_input_evaluater(input_val, scope)
            scope.set(name, res)
        }
        $table.trigger('table:global-recalc')  // TODO: change to column recalc
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

            let name = $tr.find('td.name').text();
            $table.trigger("row:unit-change", [name, $td.data('value')]);       
        } 
    })

}

export { initialize, table_initialize, tbody_handlers, set_contenteditable_cols, addalt_func, update_alts, 
         load_sheet, ensure_five_blank, row_is_blank, rows_are_blank, 
         apply_draggable_columns, remove_draggable_columns, apply_draggable_rows, remove_draggable_rows }