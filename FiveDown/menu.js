import { save_storable, get_storable, gather_storable, replace_table_from_json, 
    get_next_sheet_name, get_all_sheet_names, remove_sheet_from_storage } from './persistance.js'
import { ensure_five_blank  } from './sheet.js'

// load data for given sheet_name from localStorage, and populate html table
//
function load_sheet($table, sheet_name) {

   // load sheet data for target sheet
   let saved = get_storable(sheet_name)
   if (!saved) { throw new Error(`sheet ${sheet_name} not found in localStorage`) }

   replace_table_from_json($table, saved)

   ensure_five_blank($table)
}

// processes sheet_name for display, retrieving a custom name if apropo
//
function display_sheet_name(name, titles) {
    if (name in titles) { return titles[name] }
    return name.replace('_', ' ').replace('s', 'S')
}

function set_sheet_name_active(current) {

    $('span.sheet-selecter').removeClass('active').find('button').removeAttr('disabled')
    let $cur = $('#'+current)
    $cur.addClass('active').find('button').attr('disabled', 't')
}

function menu_initialize(current) {

    let sheet_names = get_all_sheet_names()

    // add names to sheet menu
    //
    let $projs = $('.project-menu > span')
    let $first = $projs.first(); $first.remove()
    let $new;

    if (sheet_names.length > 0) {

        sheet_names.sort()
        let titles = get_storable('titles')

        sheet_names.forEach(function(name, i) {
            $new = $first.clone(true)
            $new.attr('id', name)
            $new.find('span').text(display_sheet_name(name, titles))
            $projs.last().before($new)
        })

        set_sheet_name_active(current)
    }
    else {

        $projs.before($first)
    }

    // handler for click on a project button
    //
    $('.project-menu').on('click', 'span.sheet-selecter:not(.active)', function(event) {

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

        // set active on active page btn, remove from others
        set_sheet_name_active(target_sheet)
        
        // load sheet for new sheet chosen
        load_sheet($table, target_sheet)

        console.log('sheet selected')
        return false
    })

    // handler for delete-sheet buttons
    //
    $('.project-menu').on('click', '.sheet-delete', function(event) {

        let target_id = $(event.target).parent().attr('id')
        let $target = $(event.target).closest('span')

        $target.remove()
        remove_sheet_from_storage(target_id)

        console.log(`sheet delete button clicked ${target_id}`)
        return false
    })

    // handler for rename sheet
    //
    $('.project-menu').on('dblclick', '.sheet-selecter', function(event) {

        let target_id = $(event.target).parent().attr('id')
        let titles = get_storable('titles')

        let $span = $(event.target).closest('span.sheet-selecter > span')
        $span.attr('contenteditable', 'true')
        $span.trigger('focus')

        $span.one('focusout', function() {
            if ($span.text()) {
                titles[target_id] = $span.text()
                save_storable('titles', titles)
            }
            else {
                $span.text(display_sheet_name(target_id, {}))
            }
            $span.attr('contenteditable', 'false')
        })

        console.log(`sheet rename button clicked ${target_id}`)
        return false
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
        $new.find('span').text(display_sheet_name(target_sheet, {}))
        $new.attr('id', target_sheet)
        $newsheet.before($new)

        // get default page data from localStorage
        //
        let data = get_storable('default')
        if (!data) { throw new Error(`sheet default not found in localStorage`) }

        // save (default) data to localStorage under sheet name, then reload by that name
        //
        save_storable('status', {'active_sheet': target_sheet} )
        save_storable(target_sheet, data)

        // set active on active page btn, remove from others
        set_sheet_name_active(target_sheet)

        load_sheet($table, target_sheet)

        console.log('new sheet requested '+target_sheet)
        return false
    })
}

export { menu_initialize }

