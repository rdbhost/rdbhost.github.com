import { save_storable, get_storable, gather_storable, 
    get_next_sheet_name, get_all_sheet_names, remove_sheet_from_storage } from './persistance.js'
import { load_sheet, remove_draggable_rows, remove_draggable_columns  } from './sheet.js'

// processes sheet_name for display, retrieving a custom name if apropo
//
function display_sheet_name(name, titles) {

    if (name in titles) 
        return titles[name]
    if (name.substring(0,5) == 'sheet')
        name = name.replace('s', 'S')

    return name.replace('_', ' ')
}

function set_sheet_name_active(current) {

    let $spans = $('span.sheet-selecter')
    $spans.removeClass('active').find('button').hide() // attr('disabled', 1)
    let $cur = $('#'+current)
    $cur.addClass('active')

    if ($spans.length > 1) {
        $cur.find('button').show() // removeAttr('disabled')
    }
}

// menu_initialize sets up 
//
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
        $first.addClass('active').find('button').hide()
    }

    // handler for click on a project button
    //
    $('.project-menu').on('click', 'span.sheet-selecter:not(.active)', function(event) {

        let $btn = $(event.target).closest('span.sheet-selecter')
        let target_sheet = $btn.attr('id')
        let status = get_storable('status') 
        if (!status) throw new Error('status not found in localStorage')

        let $table = $('table')

        // if button is for current sheet, ignore it and return
        if (status['active_sheet'] === target_sheet) 
            return 

        // save data from current sheet to localStorage
        let data =  gather_storable($table)
        save_storable(status['active_sheet'], data)

        // remove draggable/droppable handlers
        remove_draggable_rows()
        remove_draggable_columns()

        // save new sheet selection to localStorage status
        save_storable('status', {'active_sheet': target_sheet})

        // set active on active page btn, remove from others
        set_sheet_name_active(target_sheet)
        
        // load sheet for new sheet chosen
        load_sheet($table, target_sheet)

        console.log(`sheet ${target_sheet} selected`)
        return false
    })

    // handler for delete-sheet buttons
    //
    $('.project-menu').on('click', '.sheet-delete', function(event) {

        let target_id = $(event.target).parent().attr('id')
        let $target = $(event.target).closest('span')

        if ( $target.attr('id') !== get_storable('status')['active_sheet'] ) 
            throw new Error('deleted sheet not active') 

        let $alt = $target.next() 
        if ($alt.attr('id') === 'new-sheet') 
            $alt = $target.prev() 
        if (!$alt.length)    
            throw new Error('trying to delete last sheet')  

        $target.remove()
        remove_sheet_from_storage(target_id)

        // remove draggable/droppable handlers
        remove_draggable_rows()
        remove_draggable_columns()
       
        setTimeout(() => $alt.trigger('click'), 0)

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
        if (!data) 
            throw new Error(`sheet default not found in localStorage`) 

        // save (default) data to localStorage under sheet name, then reload by that name
        //
        save_storable('status', {'active_sheet': target_sheet} )
        save_storable(target_sheet, data)

        // remove draggable/droppable handlers
        remove_draggable_rows()
        remove_draggable_columns()
 
        // set active on active page btn, remove from others
        set_sheet_name_active(target_sheet)

        load_sheet($table, target_sheet)

        console.log('new sheet requested '+target_sheet)
        return false
    })
}

export { menu_initialize }

