import { DataManager } from './datamanager.js'
import { name_valid, clean_name } from './math-tools.js';


$().ready(function() {

    let MAX_ALTS = 8;
    let $blank_row;
    let draggables_installed = false;
    const DM = new DataManager();

    function clean(itm) {
        return Number(itm);
    }

    function initialize() {

        // setup initial sheet
        let $headers = $('th.result');
        $headers.data('alt', 0);
        $headers.find('span').hide().off();

        // grab copy of first row, presumed blank.
        $blank_row = $('tbody > tr').first().remove();
        set_contenteditable_cols($blank_row);

        // for each result cell, set data[alt]=0, and push value to data[value]
        $('tbody > tr').find('.result').each(function(i, td) {
            let $td = $(td);
            $td.data('alt', 0);
            if ($td.text() !== "") {
                let val = clean($td.text());
                $td.data('value', val);
            }
        })

        // for each name cell, set data[prev-val]
        $('tbody > tr').find('.name').each(function(i, td) {
            let $td = $(td);
            $td.data('prev-val', $td.text());
        })

        // iterate over initial sheet content, and set contenteditable and style
        //   for each column after name
        $('tbody > tr').each(function(i, row) {

            let $row = $(row);
            set_contenteditable_cols($row);
        })

        // push values from initial sheet into VALUES[0] MapScope
        $headers.each(function(i, th) {

            let altnum = $(th).data('alt');
            DM.populate_values_for_alt(altnum);
        });

        // pad end with 5 blank lines
        if (ensure_five_blank()) { 
            setup_draggable()
        };

        // push formulas from initial sheet into FORMULAS Map, and recalc
        DM.populate_formulas();
        $('table').trigger("table:global-recalc"); // be column specific

    }

    function set_contenteditable_cols($row) {

        let name = $row.find('.name').text(),
            $formula = $row.find('.formula'),
            $results = $row.find('.result'),
            $rcols = $row.find('.formula, .result, .unit');

        if (name != "") { // name non-blank
            $rcols.attr('contenteditable', 'true')
                .removeClass('output readonly') //.attr('tabindex', 0);
        } else {  // name blank
            $rcols.attr('contenteditable', 'false')
                .addClass('readonly') //.attr('tabindex', -1);            
        }
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

    // test that a row is blank
    //
    function row_is_blank($row) {

        let blank = (($row.find('.desc').text() == "")
                 &&  ($row.find('.name').text() == "")
                 &&  ($row.find('.formula').text() == "")
                 &&  ($row.find('.unit').text() == ""));

        $row.find('.result').each(function(i, td) {
            if ($(td).find('div').text() !== "") {
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
    function ensure_five_blank() {

        var changed = false;
        // pad to length 5
        let $lastfive = $('tbody > tr').slice(-5);
        while ($lastfive.length < 5) {
            $('tbody').append($blank_row.clone());
            changed = true;
            $lastfive = $('tbody > tr').slice(-5);
        };
        // add blanks so that last five are blank
        while (!rows_are_blank($lastfive)) {
            $('tbody').append($blank_row.clone());
            changed = true;
            $lastfive = $('tbody > tr').slice(-5);
        };
        // prune off extra blanks at end
        if ($('tbody > tr').length > 5) {
            let $sixth = $('tbody > tr').slice(-6,-5);
            while (row_is_blank($sixth)) {
                $('tbody > tr').last().remove();
                $sixth = $('tbody > tr').slice(-6,-5);
            };
        }
        return changed
    }

    // make all rows draggable to reorder
    //  all rows are both draggable and also drop targets.
    //
    function setup_draggable() {

        if (draggables_installed) {
            $('tbody > tr').draggable('destroy');
            $('tbody > tr').droppable('destroy');
            draggables_installed = true;
        };

        $('tbody > tr').draggable({
            axis: "y",              // only vertical dragging
            handle: '.handle',      // grip on left-column only
            revert: "invalid",      // revert if drag-n-drop not valid
            containment: "parent"   // keep dragging within table
        }).droppable({  
            accept: 'tr',           // only rows are droppable
            drop: function( event, ui ) {
                let t = $(event.target);
                t.before(ui.draggable);    // drop inserts row before target row
                $(ui.draggable).css({'left': "", 'top': ""}); // remove spurious attributes
                $('table').trigger('row:pad-end');
            }
        });    
    }

    // double click on left-column duplicates row
    //
    $('.handle').on("dblclick", function(evt) {
        let $tr = $(evt.target).closest('tr');
        let $tr2 = $tr.clone()
        let name = $tr.find('td.name').text()
        while (DM.VALUES[0].has(name)) {
            name = name+'_';
        }
        $tr.find('td.name').text(name)
        $tr.find('td.name').data('prev-val',name)
        $tr.after($tr2);
        setup_draggable();
    });

    // click on header '+' adds alt 
    //
    function remove_alt(evt) {

        let $hdr = $(evt.target).closest('th');
        let altnum = $hdr.data('alt');
        $hdr.remove();

        // in each row, add one result column
        $('tbody > tr').each(function (i, row) {
            let $results = $(row).find('td.result');
            $results.each(function(i, td){
                let $td = $(td);
                if ($td.data('alt') == altnum) {
                    $td.remove();
                }
            })
        });

        update_alts();
        $('table').trigger("table:alt-update");
    }
    function addalt_func() {

        // add additional header column, named Alt #
        let h = $('th.result').last();
        h.after(h.clone());

        // in each row, add one result column
        $('tbody > tr').each(function (i, row) {
            let last = $(row).find('td.result').last();
            last.after(last.clone());
        });

        update_alts();
        $('table').trigger("table:alt-update");
    }        
    $('th.alt-add').click(addalt_func);

    // updates header to show Result, Alt 1, Alt 2 etc
    //   and header and each row to have data('alt') in sequential order
    //   starting at 0;
    //
    function update_alts() {

        let headers = $('th.result');

        headers.each(function(i, _th) {

            let th = $(_th);
            let altnm = 'Alt '+i;
            if (i == 0) { altnm = 'Result'};
            th.find('div').text(altnm);
            th.data('alt', i);
        })

        // in each row, add one result column
        $('tbody > tr').each(function (z, _row) {
            
            let tds = $(_row).find('.result');
            tds.each(function(i, td) {
                $(td).data('alt', i);
            });
        });

        // if at maximum column count, hide and disable add-alt button
        if (headers.length >= MAX_ALTS) {
            $('th.alt-add span').hide();
            $('th.alt-add').off();            
        }

        // if multiple alts avail, reveal '-' remove buttons to each
        if (headers.length>1) {
            headers.find('span').show();
            headers.find('span').click(remove_alt)
        }
        // otherwise, hide and disable '-' buttons 
        else {
            headers.find('span').hide();
            headers.find('span').off();
        }
    }

    // click on right-column deletes row
    //
    $('tbody').on("click", '.delete', function(evt) {

        let $tr = $(evt.target).closest('tr')
        let name = $tr.find('.name')
        DM.remove_row(name)
        $tr.remove();
    });


    // focusout handler on description column checks for data entry, and 
    //  fires table-padding signal if any description was left
    //
    $('tbody').on("focusout", '.description', function(evt) {

        let $td = $(evt.target);                // $td is jquery obj for td element
        if (!$td.text()) { return }

        if (!$td.data('prev-val')) {            // if there was no prior value, 

            $td.data("prev-val", $td.text())    // store description in data
            $('table').trigger('row:pad-end')   // and pad end of table
        } 
    });

    // focusout handler on name column checks for name change, and 
    //  fires global rename event if name was changed.
    //
    $('tbody').on("focusout", '.name', function(evt) {

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

                $('table').trigger("row:add", [name, $tr.find('.result')])
            }
            $td.data("prev-val", name)      // store new name in data
            $td.text(name)

            $('table').trigger('row:pad-end')
        } 
    });

    $('tbody').on('focusout', '.formula', function(evt) {
        
        let $t = $(evt.target);                    // t is $<td>
        let $tr = $t.closest('tr');

        set_contenteditable_cols($tr)

        if ($t.attr('contenteditable') == 'false') {
            return;
        }

        if ($t.text() !== ($t.data("prev-val") || '')) {   // is formula diff from stored?
            $t.data("prev-val", $t.text());        // store new formula in data
            let $res = $tr.find('td.result');
            $res.text('');                         // clear non-calced result value

            let name = $tr.find('td.name').text();
            $('table').trigger("row:formula-change", [name, $t.text()]);       
        } 
    })

    $('tbody').on('focusout', '.result', function(evt) {

        let $t = $(evt.target),
            $tr = $t.closest('tr');
        
        set_contenteditable_cols($tr)

        if ($t.attr('contenteditable') == 'false') {
            return;
        }

        $t.data('value', $t.text())
        if ($t.data('prev-val') != $t.text()) {
            $('table').trigger('table:global-recalc')  // TODO: change to column recalc
            $t.data('prev-val', $t.text())
        }
    })

    // table events to keep calculations current
    //
    $('table').on('row:rename', function(event, prev, now) {
        console.log('row rename '+prev+' '+now);
        setTimeout(function() {
            DM.rename_row(prev, now);
            $('table').trigger('table:global-recalc');
        }, 0)
    }).on('row:add', function(event, name, $tds) {
        console.log('row add '+name);
        setTimeout(function() {
            DM.add_row(name, $tds);
        }, 0)
    }).on('row:pad-end', function(event) {
        console.log('add blanks')
        setTimeout(function() {
            if (ensure_five_blank()) {
                setup_draggable()
            }
        }, 0)
    }).on('row:formula-change', function(event, name, formula) {
        console.log('row formula change '+formula)
        setTimeout(function () {
            DM.change_formula(name, formula)
            $('table').trigger('table:global-recalc')
        }, 0)
    }).on("table:alt-update", function() {
        console.log('alt-update requested')
        setTimeout(function () {

            DM.VALUES.length = 0
            $('thead th.result').each(function(z,th) {
                let i = $(th).data('alt')
                DM.populate_values_for_alt(i)
            })
        })
    }).on("table:global-recalc", function() {
        console.log('global-recalc requested');
        setTimeout(function () {
            $('thead th.result').each(function(z,th) {
                let i = $(th).data('alt')
                DM.update_calculated_rows(i)
            })
        }, 0);
    });

    initialize();
    setup_draggable();

})