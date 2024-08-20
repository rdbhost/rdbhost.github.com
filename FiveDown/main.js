
import { save_storable, get_storable, gather_storable, replace_table_from_json } from './persistance.js'
import { update_alts, ensure_five_blank, table_initialize, initialize,
         remove_draggable_rows, apply_draggable_rows } from './sheet.js'
import { menu_initialize } from './menu.js';


function events_initialize($table) {    

    let DM = $table.data('DM')

    // table events to keep calculations current
    //
    $table.on('row:rename', function(event, prev, now) {
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
            remove_draggable_rows($table)
            ensure_five_blank($table) 
            apply_draggable_rows($table)
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

}

$().ready(function() {

    let $table = $('table')

    initialize($table)

    // if there is no status object in localStorage,
    //   create one and add it
    let status = get_storable('status')
    if (!status || !status['active_sheet']) {

        status = {'active_sheet': 'sheet_00'}
        save_storable('status', status)
    }

    // ensure a titles hash is present in localStorage
    if (!get_storable('titles')) {
        save_storable('titles', {})
    }

    // if the current sheet is not stored in localStorage,
    //  gather data from html and store it
    let sheet = status['active_sheet']
    let sheet_data = get_storable(sheet)
    if (!sheet_data) {

        sheet_data = gather_storable($table)
        save_storable(status['active_sheet'], sheet_data)
    }
    replace_table_from_json($table, sheet_data)

    // if there isn't a 'default' page item in localStorage, create one
    //   and store it
    //
    if (!get_storable('default')) {

        save_storable('default', {
            'header': [null],
            'rows': [null, ["a brand new sheet, for your computing pleasure!", "", "", ""]]
        })
    }

    update_alts($table)

    table_initialize($table);
    events_initialize($table)

    menu_initialize(status['active_sheet'])

    // recalculate all values
    //
    $table.trigger("table:global-recalc")


    // when user exits page, save current table state to localStorage
    //
    $(window).on('unload', function() {

        //let rows = gather_storable($table)
        //save_storable('default', rows)
    })

    // temporary measure
    $('.min').on('click', function() {
        let d = gather_storable($table)
        save_storable(sheet, d)
    })
 })


