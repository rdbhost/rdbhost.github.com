
import { save_storable, get_storable, gather_storable, replace_table_from_json, 
         get_next_sheet_name, get_all_sheet_names, remove_sheet_from_storage } from './persistance.js'
import { update_alts, ensure_five_blank, initialize, pre_initialize,
         remove_draggable_rows, apply_draggable_rows } from './sheet.js'


function load_sheet($table, sheet_name) {

        // load sheet data for target sheet
        let saved = get_storable(sheet_name)
        if (!saved) { throw new Error(`sheet ${sheet_name} not found in localStorage`) }

        replace_table_from_json($table, saved)

        ensure_five_blank($table)
}

function project_initialize(sheet_names, current) {

    // add names to sheet menu
    //
    let $projs = $('.project-menu > span')
    let $first = $projs.first(); $first.remove()
    let $new;
    
    if (sheet_names.length > 0) {

        sheet_names.sort()

        sheet_names.forEach(function(name, i) {
            $new = $first.clone(true)
            $new.attr('id', name)
            $new.find('span').text(name)
            $projs.last().before($new)
        })

        $projs.find('span.sheet-selecter').removeClass('active')
        $projs.find('#'+current).addClass('active')
    }
    else {

        $projs.before($first)
    }

    // handler for click on a project button
    //
    $('.project-menu').on('click', 'span:not(.active)', function(event) {

        let $btn = $(event.target).closest('span.sheet-selecter')
        let target_sheet = $btn.attr('id')
        let status = get_storable('status') 
        if (!status) { throw new Error('status not found in localStorage') }

        let $table = $('table')

        // if button is for current sheet, ignore it and return
        if (status['active_sheet'] === target_sheet) { return }

        // save data from current sheet to localStorage
        let data =  gather_storable($table)
        save_storable(status['active_sheet'], data)

        // save new sheet selection to localStorage status
        save_storable('status', {'active_sheet': target_sheet})

        // load sheet for new sheet chosen
        load_sheet($table, target_sheet)
 
        console.log('sheet selected')
    })

    $('.project-menu').on('click', '.sheet-delete', function(event) {

        let target_id = $(event.target).parent().attr('id')
        let $target = $(event.target).closest('span')
        $target.remove()

        remove_sheet_from_storage(target_id)

        console.log(`sheet delete button clicked ${target_id}`)
    })

    // handler for click on the new-sheet button
    //
    $('.project-menu').on('click', '#new-sheet', function(event) {

        let $table = $('table')
        let target_sheet = get_next_sheet_name()

        // add item to sheet menu
        //
        let $projs = $('.project-menu') 
        let $first = $projs.find('span.sheet-selecter').first(); $first.remove(); 
        let $newsheet = $('#new-sheet')
        $projs.prepend($first.clone(true))
        let $new = $first.clone(true)
        $new.find('span').text(target_sheet)
        $newsheet.before($new)

        // get default page data from localStorage
        //
        let data = get_storable('default')
        if (!data) { throw new Error(`sheet default not found in localStorage`) }

        // save (default) data to localStorage under sheet name, then reload by that name
        //
        save_storable('status', {'active_sheet': target_sheet} )
        save_storable(target_sheet, data)
        load_sheet($table, target_sheet)

        console.log('new sheet requested '+target_sheet)
    })
}


function table_initialize($table) {    

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

    pre_initialize($table)

    // if there is no status object in localStorage,
    //   create one and add it
    let status = get_storable('status')
    if (!status || !status['active_sheet']) {

        status = {'active_sheet': 'sheet_00'}
        save_storable('status', status)
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
            'rows': [null]
        })
    }

    update_alts($table)

    initialize($table);
    table_initialize($table)

    let names = get_all_sheet_names()
    project_initialize(names, status['active_sheet'])

    $(window).on('unload', function() {

        //let rows = gather_storable($table)
        //save_storable('default', rows)
    })

    $('.min').on('click', function() {
        let d = gather_storable($table)
        save_storable(sheet, d)
    })
 })


