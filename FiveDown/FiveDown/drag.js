

$().ready(function() {

      // make result columns, draggable to reorder
    //  all result columns are both draggable and droppable targets.
    //  the add-alt column is droppable, not draggable
    //
    function apply_draggable_columns() {

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
                // TODO - reorder cells in every row to match header
            }
        }    

        let $t = $('thead th.result')
        $('thead th.result').draggable(drag_opts).droppable(drop_opts)
        $('thead th.alt-add').droppable(drop_opts)
    }

    function remove_draggable_columns() {

        let $t = $('thead > th.result')
        $t.draggable('destroy').droppable('destroy')
        let $v = $('thead > th.alt-add')
        $v.droppable('destroy')
    }

    function addalt_func() {

        // add additional header column, named Alt #
        let $h = $('th.result').last().remove()
        let $new = $h.clone(true)

        let $p = $('th.alt-add').first()
        $p.before($h.clone(true))     // restores starting column set
        $p.before($new)

        // in each row, add one result column
        $('tbody > tr').each(function (i, row) {
            let $last = $(row).find('td.result').last()
            $last.after($last.clone(true, true));
        });

    } 

    // make all rows draggable to reorder
    //  all rows are both draggable and also drop targets.
    //
    function apply_draggable_rows() {

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

        let $rows = $('tbody > tr')
        $rows.draggable(drag_opts).droppable(drop_opts)
    }

    // remove draggable handlers from all rows
    //
    function remove_draggable_rows() {

        let $t = $('tbody > tr')
        $t.draggable('destroy').droppable('destroy')
    }


    apply_draggable_rows()

    apply_draggable_columns()
    remove_draggable_columns()

    addalt_func()
 
    apply_draggable_columns()
}) 