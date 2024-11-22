
import { save_storable, get_storable, gather_storable } from './persistance.js'
import { ensure_five_blank, initialize, load_sheet, tbody_handlers,
    remove_draggable_rows, apply_draggable_rows, add_alt_column} from './sheet.js'
import { menu_initialize } from './menu.js';


function events_initialize($table) {    

    // table events to keep calculations current
    //
    $table.on('row:rename', function(event, prev, now) {
        console.log('row rename '+prev+' '+now);
        let DM = $table.data('DM')
        setTimeout(function() {
            DM.rename_row(prev, now);
            $('table').trigger('table:global-recalc');
        }, 0)
    }).on('row:add', function(event, name, $tdres, $tdunit) {
        console.log('row add '+name);
        let DM = $table.data('DM')
        setTimeout(function() {
            DM.add_row(name, $tdres, $tdunit);
        }, 0)
    }).on('row:pad-end', function(event) {
        // console.log('add blanks')
        let DM = $table.data('DM')
        setTimeout(function() {
            remove_draggable_rows($table)
            ensure_five_blank($table) 
            apply_draggable_rows($table)
        }, 0)
    }).on('row:formula-change', function(event, name, $formulaTd) {
        console.log('row formula change '+$formulaTd.data('value'))
        let DM = $table.data('DM')
        setTimeout(function () {
            DM.change_formula(name, $formulaTd)
            $('table').trigger('table:global-recalc')
        }, 0)
    }).on('row:unit-change', function(event, name, unit) {
        console.log('row unit change '+unit)
        // let DM = $table.data('DM')
        setTimeout(function () {
            $('table').trigger('table:global-recalc')
        }, 0)
    }).on('table:add-alt-column', function(event, $table) {
        console.log('add alt column ')
        setTimeout(function () {
            let DM = $table.data('DM')
            let colnum = add_alt_column($table)
            DM.populate_values_for_alt(colnum)
            $('table').trigger('table:global-recalc')
        }, 0)
    }).on("table:alt-update", function() {
        console.log('alt-update requested')
        let DM = $table.data('DM')
        setTimeout(function () {

            DM.VALUES.length = 0
            $('thead th.result').each(function(z,th) {
                let i = $(th).data('alt')
                DM.populate_values_for_alt(i)
            })
        })
    }).on("table:global-recalc", function() {
        console.log('global-recalc requested');
        let DM = $table.data('DM')
        setTimeout(function () {
            DM.update_calculated_units()
            $('thead th.result').each(function(z,th) {
                let i = $(th).data('alt')
                DM.update_calculated_rows(i)
            })
        }, 0);
    });

}

$().ready(function() {

    let $table = $('table')

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

    // if there isn't a 'default' page item in localStorage, create one
    //   and store it
    //
    if (!get_storable('default')) {

        save_storable('default', {
            'header': [null],
            'rows': [null, ["a brand new sheet, for your computing pleasure!", "", "", ""]]
        })
    }

    // if the current sheet is not stored in localStorage,
    //  gather data from html and store it
    let sheet = status['active_sheet']
    let sheet_data = get_storable(sheet)
    if (!sheet_data) {

        sheet_data = gather_storable($table)
        save_storable(sheet, sheet_data)
    }

    // call the various initialize functions
    //
    initialize($table)
    menu_initialize(status['active_sheet'])
    events_initialize($table)
    tbody_handlers($table)

    // load the chosen sheet from localStorage
    //
    load_sheet($table, sheet)

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


