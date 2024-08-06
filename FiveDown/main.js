import { DataManager } from './datamanager.js';
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
        let $headers = $('th.result');
        $headers.data('alt', 0);

        $blank_row = $('tbody > tr').first().remove();
        set_contenteditable_cols($blank_row);

        $('tbody > tr').find('.result').each(function(i, td) {
            let $td = $(td);
            $td.data('alt', 0);
            if ($td.text() !== "") {
                let val = clean($td.text());
                $td.data('value', val);
            }
        });

        $('tbody > tr').find('.name').each(function(i, td) {
            let $td = $(td);
            $td.data('prev-val', $td.text());
        });

        $('tbody > tr').each(function(i, row) {
            set_contenteditable_cols($(row));
        });

        $headers.each(function(i, th) {
            let altnum = $(th).data('alt');
            DM.populate_values_for_alt(altnum);
        });

        if (ensure_five_blank()) { 
            setup_draggable();
        }

        DM.populate_formulas();
        $('table').trigger("table:global-recalc");

        // Bind Add Alt button and ensure its visibility is correctly handled
        $('th.alt-add span').show().off('click').on('click', addalt_func);

        // Initially hide the Remove All Alts button
        $('#remove-all-alts').hide().off('click').on('click', remove_all_alts);
        update_alts();
    }

    function set_contenteditable_cols($row) {
        let name = $row.find('.name').text(),
            $formula = $row.find('.formula'),
            $results = $row.find('.result'),
            $rcols = $row.find('.formula, .result, .unit');

        if (name !== "") {
            $rcols.attr('contenteditable', 'true').removeClass('output readonly');
        } else {
            $rcols.attr('contenteditable', 'false').addClass('readonly');
        }

        if ($formula.text() !== "") {
            $results.attr('contenteditable', 'false').addClass('output').removeClass('readonly');
            $formula.attr('tabindex', 0);
        } else {
            $results.attr('contenteditable', 'true').removeClass('output readonly');
            if ($results.text() !== "") {
                $formula.attr('contenteditable', 'false').addClass('readonly');
            }
        }
    }

    function row_is_blank($row) {
        let blank = (($row.find('.desc').text() === "") && 
                     ($row.find('.name').text() === "") && 
                     ($row.find('.formula').text() === "") && 
                     ($row.find('.unit').text() === ""));
        $row.find('.result').each(function(i, td) {
            if ($(td).find('div').text() !== "") {
                blank = false;
            }
        });
        return blank;
    }

    function rows_are_blank($rows) {
        let fail = false;
        $rows.each(function(i, row) {
            if (!row_is_blank($(row))) { fail = true; }
        });
        return !fail;
    }

    function ensure_five_blank() {
        let changed = false;
        let $lastfive = $('tbody > tr').slice(-5);
        while ($lastfive.length < 5) {
            $('tbody').append($blank_row.clone());
            changed = true;
            $lastfive = $('tbody > tr').slice(-5);
        };
        while (!rows_are_blank($lastfive)) {
            $('tbody').append($blank_row.clone());
            changed = true;
            $lastfive = $('tbody > tr').slice(-5);
        };
        if ($('tbody > tr').length > 5) {
            let $sixth = $('tbody > tr').slice(-6, -5);
            while (row_is_blank($sixth)) {
                $('tbody > tr').last().remove();
                $sixth = $('tbody > tr').slice(-6, -5);
            }
        }
        return changed;
    }

    function setup_draggable() {
        if (draggables_installed) {
            $('tbody > tr').draggable('destroy');
            $('tbody > tr').droppable('destroy');
            draggables_installed = true;
        }

        $('tbody > tr').draggable({
            axis: "y",
            handle: '.handle',
            revert: "invalid",
            containment: "parent"
        }).droppable({
            accept: 'tr',
            drop: function(event, ui) {
                let t = $(event.target);
                t.before(ui.draggable);
                $(ui.draggable).css({ left: "", top: "" });
                $('table').trigger('row:pad-end');
            }
        });
    }

    $('.handle').on("dblclick", function(evt) {
        let $tr = $(evt.target).closest('tr');
        let $tr2 = $tr.clone();
        let name = $tr.find('td.name').text();
        while (DM.VALUES[0].has(name)) {
            name = name + '_';
        }
        $tr.find('td.name').text(name);
        $tr.find('td.name').data('prev-val', name);
        $tr.after($tr2);
        setup_draggable();
    });

    function remove_alt(evt) {
        let $hdr = $(evt.target).closest('th');
        let altnum = $hdr.data('alt');
        $hdr.remove();

        $('tbody > tr').each(function(i, row) {
            $(row).find('td.result').each(function(i, td) {
                let $td = $(td);
                if ($td.data('alt') == altnum) {
                    $td.remove();
                }
            });
        });

        update_alts();
        $('table').trigger("table:alt-update");
    }

    function remove_all_alts() {
        $('thead th.result').each(function(i, th) {
            if (i > 0) {
                let altnum = $(th).data('alt');
                $(th).remove();
                $('tbody > tr').each(function(i, row) {
                    $(row).find('td.result').each(function(i, td) {
                        let $td = $(td);
                        if ($td.data('alt') == altnum) {
                            $td.remove();
                        }
                    });
                });
            }
        });

        update_alts();
        $('table').trigger("table:alt-update");
    }

    function addalt_func() {
        let headers = $('th.result').length;
        if (headers >= MAX_ALTS) return;

        let newAltIndex = headers;
        let newAltHeader = $('<th class="result"><div>Alt ' + newAltIndex + '</div><span class="remove-alt">X</span></th>');
        $('th.alt-add').before(newAltHeader);

        $('tbody > tr').each(function(i, row) {
            let lastResult = $(row).find('td.result').last();
            lastResult.after($('<td class="result"></td>'));
        });

        update_alts();
        $('table').trigger("table:alt-update");
    }

    function update_alts() {
        let headers = $('th.result');

        headers.each(function(i, _th) {
            let th = $(_th);
            let altnm = 'Alt ' + i;
            if (i == 0) { altnm = 'Result' };
            th.find('div').text(altnm);
            th.data('alt', i);
        });

        $('tbody > tr').each(function(z, _row) {
            let tds = $(_row).find('.result');
            tds.each(function(i, td) {
                $(td).data('alt', i);
            });
        });

        if (headers.length >= MAX_ALTS) {
            $('th.alt-add span').hide();
            $('th.alt-add').off();
        } else {
            $('th.alt-add span').show();
            $('th.alt-add').off('click').on('click', addalt_func);
        }

        // Adjust visibility of the "Remove All Alts" button
        if (headers.length > 1) {
            $('#remove-all-alts').show();
            headers.find('.remove-alt').show().off().click(remove_alt);
        } else {
            $('#remove-all-alts').hide();
            headers.find('.remove-alt').hide().off();
        }
    }

    $('tbody').on("click", '.delete', function(evt) {
        let $tr = $(evt.target).closest('tr');
        let name = $tr.find('.name').text();
        DM.remove_row(name);
        $tr.remove();
    });

    $('tbody').on("focusout", '.description', function(evt) {
        let $td = $(evt.target);
        if (!$td.text()) { return; }

        if (!$td.data('prev-val')) {
            $td.data("prev-val", $td.text());
            $('table').trigger('row:pad-end');
        }
    });

    $('tbody').on("focusout", '.name', function(evt) {
        let $td = $(evt.target);
        let $tr = $td.closest('tr');
        let name = $td.text();

        if (!name_valid(name)) {
            name = clean_name(name);
            $td.text(name);
        }

        if ($td.text() !== $td.data("prev-val")) {
            set_contenteditable_cols($tr);

            if ($td.text() === "") {
                $tr.find('.formula').text("");
                $tr.find('.result').each(function(i, td) {
                    $(td).text("").data('value', "");
                });

            } else {
                while (DM.VALUES[0].has(name)) {
                    name = name + '_';
                }
            }

            if ($td.data('prev-val') !== "" && $td.data('prev-val') !== undefined) {
                $('table').trigger("row:rename", [$td.data("prev-val"), name]);
            } else if (name) {
                $('table').trigger("row:add", [name, $tr.find('.result')]);
            }
            $td.data("prev-val", name);
            $td.text(name);

            $('table').trigger('row:pad-end');
        }
    });

    $('tbody').on('focusout', '.formula', function(evt) {
        let $t = $(evt.target);
        let $tr = $t.closest('tr');

        set_contenteditable_cols($tr);

        if ($t.attr('contenteditable') == 'false') {
            return;
        }

        if ($t.text() !== ($t.data("prev-val") || '')) {
            $t.data("prev-val", $t.text());
            let $res = $tr.find('td.result');
            $res.text('');

            let name = $tr.find('td.name').text();
            $('table').trigger("row:formula-change", [name, $t.text()]);
        }
    });

    $('tbody').on('focusout', '.result', function(evt) {
        let $t = $(evt.target),
            $tr = $t.closest('tr');

        set_contenteditable_cols($tr);

        if ($t.attr('contenteditable') == 'false') {
            return;
        }

        $t.data('value', $t.text());
        if ($t.data('prev-val') != $t.text()) {
            $('table').trigger('table:global-recalc');
            $t.data('prev-val', $t.text());
        }
    });

    $('table').on('row:rename', function(event, prev, now) {
        setTimeout(function() {
            DM.rename_row(prev, now);
            $('table').trigger('table:global-recalc');
        }, 0);
    }).on('row:add', function(event, name, $tds) {
        setTimeout(function() {
            DM.add_row(name, $tds);
        }, 0);
    }).on('row:pad-end', function() {
        setTimeout(function() {
            if (ensure_five_blank()) {
                setup_draggable();
            }
        }, 0);
    }).on('row:formula-change', function(event, name, formula) {
        setTimeout(function () {
            DM.change_formula(name, formula);
            $('table').trigger('table:global-recalc');
        }, 0);
    }).on("table:alt-update", function() {
        setTimeout(function () {
            DM.VALUES.length = 0;
            $('thead th.result').each(function(z, th) {
                let i = $(th).data('alt');
                DM.populate_values_for_alt(i);
            });
        });
    }).on("table:global-recalc", function() {
        setTimeout(function () {
            $('thead th.result').each(function(z, th) {
                let i = $(th).data('alt');
                DM.update_calculated_rows(i);
            });
        }, 0);
    });

    initialize();
    setup_draggable();
});
