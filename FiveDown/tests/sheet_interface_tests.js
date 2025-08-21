// tests/sheet-interface_tests.js

import { enforceRowRules, ensureBlankFive, isBlankRow, setupTableInterface } from '../js/sheet_interface.js';
import { RowCollection } from '../js/row_collection.js';
import { TableRow } from '../js/table_row.js';
import { PubSub } from '../js/pubsub.js';

QUnit.module('Sheet Interface Tests', function(hooks) {

  function createMockTable() {
    const table = document.createElement('table');
    table.id = 'main-sheet';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'].forEach(col => {
      const th = document.createElement('th');
      th.classList.add(col);
      if (col === 'add-result') {
        const button = document.createElement('button');
        th.appendChild(button);
      }
      if (col === 'result') {
        th.textContent = 'Result';
        th.draggable = true;
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    table.row_collection = new RowCollection();
    table.pubsub = new PubSub();
    return table;
  }

  function addMockRow(tbody, isBlank = true, formulaValue = '', resultValue = '', nameValue = '') {
    const tr = document.createElement('tr');
    ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'].forEach(col => {
      const td = document.createElement('td');
      td.classList.add(col);
      if (col === 'formula') {
        td.dataset.value = formulaValue;
        td.textContent = isBlank ? '' : formulaValue;
      } else if (col === 'result') {
        td.dataset.value = resultValue;
        td.textContent = isBlank ? '' : resultValue;
      } else if (col === 'name') {
        td.dataset.value = nameValue;
        td.textContent = isBlank ? '' : nameValue;
      } else if (col === 'delete') {
        const button = document.createElement('button');
        td.appendChild(button);
      } else {
        td.textContent = isBlank ? '' : 'non-blank';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    return tr;
  }

  QUnit.test('isBlankRow identifies blank row correctly', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    const blankTr = addMockRow(tbody, true);
    assert.true(isBlankRow(blankTr), 'Blank row detected');

    const nonBlankTr = addMockRow(tbody, false);
    assert.false(isBlankRow(nonBlankTr), 'Non-blank row detected');
  });

  QUnit.test('ensureBlankFive adds missing blank rows', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    table.blank_row = addMockRow(tbody, true).cloneNode(true);
    tbody.innerHTML = ''; // Clear

    // Add 2 non-blank and 2 blank
    addMockRow(tbody, false);
    addMockRow(tbody, false);
    addMockRow(tbody, true);
    addMockRow(tbody, true);

    ensureBlankFive(table);
    const rows = tbody.querySelectorAll('tr');
    assert.strictEqual(rows.length, 7, 'Added 3 blanks to make 5 trailing');
    assert.false(isBlankRow(rows[0]), 'First non-blank');
    assert.false(isBlankRow(rows[1]), 'Second non-blank');
    assert.true(isBlankRow(rows[2]), 'Trailing blank 1');
    assert.true(isBlankRow(rows[3]), 'Trailing blank 2');
    assert.true(isBlankRow(rows[4]), 'Added blank 3');
    assert.true(isBlankRow(rows[5]), 'Added blank 4');
    assert.true(isBlankRow(rows[6]), 'Added blank 5');
  });

  QUnit.test('ensureBlankFive removes extra blank rows', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    table.blank_row = addMockRow(tbody, true).cloneNode(true);
    tbody.innerHTML = ''; // Clear

    // Add 1 non-blank and 7 blanks
    addMockRow(tbody, false);
    for (let i = 0; i < 7; i++) {
      addMockRow(tbody, true);
    }

    ensureBlankFive(table);
    const rows = tbody.querySelectorAll('tr');
    assert.strictEqual(rows.length, 6, 'Removed 2 extras to leave 5 trailing');
    assert.false(isBlankRow(rows[0]), 'Non-blank');
    for (let i = 1; i < 6; i++) {
      assert.true(isBlankRow(rows[i]), `Trailing blank ${i}`);
    }
  });

  QUnit.test('enforceRowRules sets properties correctly with formula', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    const tr = addMockRow(tbody, true, 'some_formula');

    enforceRowRules(tr);

    const formulaTd = tr.querySelector('td.formula');
    assert.strictEqual(formulaTd.contentEditable, 'true', 'Formula editable');
    
    const resultTd = tr.querySelector('td.result');
    assert.strictEqual(resultTd.contentEditable, 'false', 'Result not editable');
    assert.true(resultTd.classList.contains('readonly'), 'Has readonly');
    assert.true(resultTd.classList.contains('output'), 'Has output');
    assert.false(resultTd.classList.contains('input'), 'No input');
  });

  QUnit.test('enforceRowRules sets properties correctly without formula', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    const tr = addMockRow(tbody, true, '');

    enforceRowRules(tr);

    const formulaTd = tr.querySelector('td.formula');
    assert.strictEqual(formulaTd.contentEditable, 'false', 'Formula not editable');
    
    const resultTd = tr.querySelector('td.result');
    assert.strictEqual(resultTd.contentEditable, 'true', 'Result editable');
    assert.false(resultTd.classList.contains('readonly'), 'No readonly');
    assert.false(resultTd.classList.contains('output'), 'No output');
    assert.true(resultTd.classList.contains('input'), 'Has input');
  });

  QUnit.test('setupTableInterface initializes correctly', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    // Populate with some rows including a blank
    addMockRow(tbody, false);
    addMockRow(tbody, true);

    setupTableInterface(table);

    const rows = tbody.querySelectorAll('tr');
    assert.strictEqual(rows.length, 5, 'Ensures 5 blank rows');
    for (let i = 0; i < 5; i++) {
      assert.true(isBlankRow(rows[i]), `Row ${i+1} is blank`);
    }
    assert.ok(table.blank_row, 'Blank row template set');
  });

  QUnit.test('focusin on formula replaces text with data-value', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const tr = table.querySelector('tbody tr');
    const formulaTd = tr.querySelector('td.formula');
    formulaTd.dataset.value = 'raw_formula';
    formulaTd.textContent = 'formatted';

    formulaTd.dispatchEvent(new Event('focusin', { bubbles: true }));

    assert.strictEqual(formulaTd.textContent, 'raw_formula', 'Replaces with data-value');
  });

  QUnit.test('focusout on name updates collection and handles duplicates', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const tr = table.querySelector('tbody tr');
    const nameTd = tr.querySelector('td.name');
    nameTd.contentEditable = true;
    nameTd.dataset.value = 'oldName';
    nameTd.textContent = 'newName';
    table.row_collection.addRow('oldName', new TableRow(tr));

    nameTd.dispatchEvent(new Event('focusout', { bubbles: true }));

    assert.strictEqual(nameTd.dataset.value, 'newName', 'Updates dataset');
    assert.strictEqual(nameTd.textContent, 'newName', 'Updates text');
    assert.strictEqual(table.row_collection.getRow('oldName'), undefined, 'Removes old');
    assert.ok(table.row_collection.getRow('newName'), 'Adds new');

    // Add a second row to create a duplicate scenario
    const tr2 = addMockRow(tbody, true);
    const nameTd2 = tr2.querySelector('td.name');
    nameTd2.contentEditable = true;
    nameTd2.dataset.value = 'dupName';
    nameTd2.textContent = 'dupName';
    table.row_collection.addRow('dupName', new TableRow(tr2));

    // Now change the first row to the duplicate name
    nameTd.textContent = 'dupName';
    nameTd.dispatchEvent(new Event('focusout', { bubbles: true }));
    assert.strictEqual(nameTd.dataset.value, '_dupName', 'Prefixes _ for duplicate');
  });

  QUnit.test('focusout on name reverts if blank from non-blank', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const tr = table.querySelector('tbody tr');
    const nameTd = tr.querySelector('td.name');
    nameTd.contentEditable = true;
    nameTd.dataset.value = 'oldName';
    nameTd.textContent = '';

    nameTd.dispatchEvent(new Event('focusout', { bubbles: true }));

    assert.strictEqual(nameTd.textContent, 'oldName', 'Reverts to old name');
  });

  QUnit.test('focusout on formula updates and formats', async function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const tr = table.querySelector('tbody tr');
    const formulaTd = tr.querySelector('td.formula');
    formulaTd.contentEditable = true;
    formulaTd.dataset.value = 'old@*';
    formulaTd.textContent = 'new@*';
    let published = false;
    table.pubsub.subscribe('recalculation', (msg) => { if (msg === 'go') published = true; });

    formulaTd.dispatchEvent(new Event('focusout', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 0));

    assert.strictEqual(formulaTd.dataset.value, 'new@*', 'Updates dataset');
    assert.strictEqual(formulaTd.textContent, 'new⋅×', 'Formats text');
    assert.true(published, 'Publishes recalc if changed');
  });

  QUnit.test('focusout on result updates, formats, clears formula', async function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const tr = table.querySelector('tbody tr');
    const resultTd = tr.querySelector('td.result');
    resultTd.contentEditable = true;
    resultTd.dataset.value = 'old@*';
    resultTd.textContent = 'new@*';
    const formulaTd = tr.querySelector('td.formula');
    formulaTd.dataset.value = 'some_formula';
    let published = false;
    table.pubsub.subscribe('recalculation', (msg) => { if (msg === 'go') published = true; });

    resultTd.dispatchEvent(new Event('focusout', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 0));

    assert.strictEqual(resultTd.dataset.value, 'new@*', 'Updates dataset');
    assert.strictEqual(resultTd.textContent, 'new⋅×', 'Formats text');
    assert.true(published, 'Publishes recalc if changed');
    assert.strictEqual(formulaTd.dataset.value, '', 'Clears formula dataset');
    assert.strictEqual(formulaTd.textContent, '', 'Clears formula text');
  });

  QUnit.test('row dragging reorders rows', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    const rows = tbody.querySelectorAll('tr');
    const row1 = rows[0];
    const row2 = rows[1];
    row1.querySelector('td.name').textContent = 'row1';
    row2.querySelector('td.name').textContent = 'row2';

    // Mock dataTransfer
    const mockDataTransfer = {
      effectAllowed: null,
      setData: function() {},
    };

    // Simulate dragstart on row1
    const handle1 = row1.querySelector('td.handle');
    const dragStartEvent = new CustomEvent('dragstart', { bubbles: true });
    dragStartEvent.dataTransfer = mockDataTransfer;
    handle1.dispatchEvent(dragStartEvent);

    // Simulate dragover on row2
    const dragOverEvent = new CustomEvent('dragover', { bubbles: true });
    dragOverEvent.preventDefault = function() {};
    row2.dispatchEvent(dragOverEvent);

    // Simulate drop on row2 (set clientY to 0 for after)
    const dropEvent = new CustomEvent('drop', { bubbles: true });
    dropEvent.preventDefault = function() {};
    dropEvent.clientY = 0;
    row2.dispatchEvent(dropEvent);

    // Simulate dragend
    const dragEndEvent = new CustomEvent('dragend', { bubbles: true });
    handle1.dispatchEvent(dragEndEvent);

    const newRows = tbody.querySelectorAll('tr');
    assert.strictEqual(newRows[0].querySelector('td.name').textContent, 'row2', 'Row2 now first');
    assert.strictEqual(newRows[1].querySelector('td.name').textContent, 'row1', 'Row1 now second');
  });

  QUnit.test('column dragging reorders result columns', function(assert) {
    const table = createMockTable();
    const tbody = table.querySelector('tbody');
    addMockRow(tbody, true);
    setupTableInterface(table);
    // Add a second result column for dragging
    const thead = table.querySelector('thead');
    const headerRow = thead.querySelector('tr');
    const addTh = headerRow.querySelector('th.add-result');
    const newTh = document.createElement('th');
    newTh.classList.add('result');
    newTh.draggable = true;
    newTh.textContent = 'Result 1';
    headerRow.insertBefore(newTh, addTh);
    // Add corresponding td to each existing tr
    for (const tr of tbody.querySelectorAll('tr')) {
      const newTd = document.createElement('td');
      newTd.classList.add('result');
      newTd.dataset.value = '';
      newTd.textContent = '';
      tr.insertBefore(newTd, tr.querySelector('td.add-result'));
    }
    // Update headers for clarity
    const ths = thead.querySelectorAll('th.result');
    ths[0].textContent = 'Result 0';
    ths[1].textContent = 'Result 1';

    // Mock dataTransfer
    const mockDataTransfer = {
      effectAllowed: null,
      setData: function() {},
    };

    // Simulate dragstart on first result th
    const th0 = ths[0];
    const dragStartEvent = new CustomEvent('dragstart', { bubbles: true });
    dragStartEvent.dataTransfer = mockDataTransfer;
    th0.dispatchEvent(dragStartEvent);

    // Simulate dragover on second
    const dragOverEvent = new CustomEvent('dragover', { bubbles: true });
    dragOverEvent.preventDefault = function() {};
    ths[1].dispatchEvent(dragOverEvent);

    // Simulate drop on second (set clientX to 0 for right)
    const dropEvent = new CustomEvent('drop', { bubbles: true });
    dropEvent.preventDefault = function() {};
    dropEvent.clientX = 0;
    ths[1].dispatchEvent(dropEvent);

    // Simulate dragend
    const dragEndEvent = new CustomEvent('dragend', { bubbles: true });
    th0.dispatchEvent(dragEndEvent);

    const newThs = thead.querySelectorAll('th.result');
    assert.strictEqual(newThs[0].textContent, 'Result 1', 'Result 1 now first');
    assert.strictEqual(newThs[1].textContent, 'Result 0', 'Result 0 now second');
  });

});