
import { save_storable, get_storable, gather_storable, replace_table_from_json } from './persistance.js'
import { row_is_blank, update_alts, ensure_five_blank, initialize, remove_draggable_rows, apply_draggable_rows } from './sheet.js'


function table_initialize($table) {    

    let DM = $('table').data('DM')

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
    let sheet = 'default'

    let status = get_storable('status')
    if (status) {

        sheet = status['active_sheet']
        let saved = get_storable(sheet)
        if (saved) {
            replace_table_from_json($table, saved)
        }
    }
    else {
        save_storable('status', {'active_sheet': sheet})
    }

    update_alts($table)

    initialize($table);
    table_initialize($table)

    $(window).on('unload', function() {

        //let rows = gather_storable($table)
        //save_storable('default', rows)
    })

    $('.min').on('click', function() {
        let d = gather_storable($table)
        save_storable(sheet, d)
    })
 })

export { row_is_blank } 
