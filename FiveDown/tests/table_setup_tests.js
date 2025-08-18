// test.js
import { ensureBlankFive, isBlank } from '../js/table-drag.js';

// Combined QUnit tests for ensureBlankFive and Drag and Drop

// ensureBlankFive module
QUnit.module('ensureBlankFive', {
  beforeEach: function() {
    // Reset tbody for each test
    this.table = document.getElementById('main-sheet');
    this.tbody = this.table.tBodies[0];
    this.tbody.innerHTML = '';

    // The data-blank-row is already set from import, but we can access it
    this.blankHtml = this.table.getAttribute('data-blank-row');

    // Helper to add a non-blank row
    this.addNonBlankRow = () => {
      const row = document.createElement('tr');
      row.innerHTML = '<td>desc</td><td>name</td><td>formula</td><td>result</td><td>unit</td>';
      this.tbody.appendChild(row);
    };

    // Helper to add a blank row (matching the module's parsing method)
    this.addBlankRow = () => {
      const tempTbody = document.createElement('tbody');
      tempTbody.innerHTML = this.blankHtml;
      const newRow = tempTbody.firstChild;
      if (newRow) {
        this.tbody.appendChild(newRow);
      }
    };
  }
});

QUnit.test('adds blank rows when fewer than 5 blanks at end', function(assert) {
  // Setup: 2 non-blanks + 3 blanks
  this.addNonBlankRow();
  this.addNonBlankRow();
  this.addBlankRow();
  this.addBlankRow();
  this.addBlankRow();

  ensureBlankFive();

  assert.equal(this.tbody.rows.length, 2 + 5, 'Total rows should be 2 non-blanks + 5 blanks');
  const lastFive = Array.from(this.tbody.rows).slice(-5);
  lastFive.forEach(row => {
    assert.true(isBlank(row), 'Last five rows should be blank');
  });
});

QUnit.test('removes extra blank rows when more than 5 blanks at end', function(assert) {
  // Setup: 2 non-blanks + 7 blanks
  this.addNonBlankRow();
  this.addNonBlankRow();
  for (let i = 0; i < 7; i++) {
    this.addBlankRow();
  }

  ensureBlankFive();

  assert.equal(this.tbody.rows.length, 2 + 5, 'Total rows should be 2 non-blanks + 5 blanks');
  const lastFive = Array.from(this.tbody.rows).slice(-5);
  lastFive.forEach(row => {
    assert.true(isBlank(row), 'Last five rows should be blank');
  });
  assert.false(isBlank(this.tbody.rows[1]), 'Second row should be non-blank');
});

QUnit.test('does nothing when exactly 5 blanks at end', function(assert) {
  // Setup: 2 non-blanks + 5 blanks
  this.addNonBlankRow();
  this.addNonBlankRow();
  for (let i = 0; i < 5; i++) {
    this.addBlankRow();
  }
  const originalLength = this.tbody.rows.length;

  ensureBlankFive();

  assert.equal(this.tbody.rows.length, originalLength, 'Row count should remain the same');
  const lastFive = Array.from(this.tbody.rows).slice(-5);
  lastFive.forEach(row => {
    assert.true(isBlank(row), 'Last five rows should be blank');
  });
});

QUnit.test('throws error if data-blank-row not available', function(assert) {
  // Remove the data attribute temporarily
  this.table.removeAttribute('data-blank-row');

  assert.throws(
    () => ensureBlankFive(),
    new Error("data-blank-row not available"),
    'Should throw error when blank row HTML is missing'
  );

  // Restore for other tests (though beforeEach resets, but attribute is on table)
  this.table.setAttribute('data-blank-row', this.blankHtml);
});

QUnit.test('handles case with no rows', function(assert) {
  // Setup: 0 rows, should add 5 blanks
  ensureBlankFive();

  assert.equal(this.tbody.rows.length, 5, 'Should add 5 blank rows');
  Array.from(this.tbody.rows).forEach(row => {
    assert.true(isBlank(row), 'All rows should be blank');
  });
});

QUnit.test('handles case with only blanks more than 5', function(assert) {
  // Setup: 8 blanks
  for (let i = 0; i < 8; i++) {
    this.addBlankRow();
  }

  ensureBlankFive();

  assert.equal(this.tbody.rows.length, 5, 'Should remove extras to leave 5 blanks');
});

QUnit.test('handles mixed blanks not at end', function(assert) {
  // Setup: blank, non-blank, blank (blanks not consecutive at end)
  this.addBlankRow();
  this.addNonBlankRow();
  this.addBlankRow();

  // Function only counts consecutive blanks at the end, so here end has 1 blank
  ensureBlankFive();

  assert.equal(this.tbody.rows.length, 3 + 4, 'Should add 4 to make 5 blanks at end');
  const lastFive = Array.from(this.tbody.rows).slice(-5);
  lastFive.forEach(row => {
    assert.true(isBlank(row), 'Last five should be blank');
  });
  assert.true(isBlank(this.tbody.rows[0]), 'First row remains blank');
  assert.false(isBlank(this.tbody.rows[1]), 'Second row non-blank');
});

// Drag and Drop module
QUnit.module('Drag and Drop Functionality', {
  beforeEach: function() {
    this.table = document.getElementById('main-sheet');
    this.thead = this.table.tHead;
    this.tbody = this.table.tBodies[0];
    this.headerRow = this.thead.rows[0];

    // Reset thead
    this.headerRow.innerHTML = `
      <th>Description</th>
      <th>Name</th>
      <th>Formula</th>
      <th class="result">Result0</th>
      <th>Unit</th>
    `;
    this.headerRow.querySelector('th.result').draggable = true;

    // Reset tbody to known state without extra blanks from module init
    this.tbody.innerHTML = `
      <tr>
        <td>desc1</td>
        <td>name1</td>
        <td>formula1</td>
        <td>result01</td>
        <td>unit1</td>
      </tr>
      <tr>
        <td>desc2</td>
        <td>name2</td>
        <td>formula2</td>
        <td>result02</td>
        <td>unit2</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;

    // Set draggable on reset rows
    Array.from(this.tbody.rows).forEach(row => {
      const handle = row.cells[0];
      if (handle) handle.draggable = true;
    });

    // Ensure data-blank-row is set (from module)
    this.blankHtml = this.table.getAttribute('data-blank-row');

    // Helper to add a result column
    this.addResultColumn = (title) => {
      const colIndex = this.headerRow.cells.length - 1; // Before unit
      const newTh = document.createElement('th');
      newTh.classList.add('result');
      newTh.textContent = title;
      newTh.draggable = true;
      this.headerRow.insertBefore(newTh, this.headerRow.cells[colIndex]);

      // Add cells to all body rows
      const bodyRows = Array.from(this.tbody.rows);
      bodyRows.forEach(row => {
        const newTd = row.insertCell(colIndex);
        newTd.textContent = ''; // Blank for now
      });
    };

    // Helper to add a row
    this.addRow = (isBlankRow = false) => {
      const tempTbody = document.createElement('tbody');
      tempTbody.innerHTML = isBlankRow ? this.blankHtml : '<tr><td>newdesc</td><td>newname</td><td>newformula</td><td>newresult</td><td>newunit</td></tr>';
      const newRow = tempTbody.firstChild;
      if (newRow) {
        this.tbody.appendChild(newRow);
        const handle = newRow.cells[0];
        if (handle) handle.draggable = true;
      }
    };

    // Helper to simulate drag and drop for columns
    this.simulateColumnDrag = (fromIndex, toIndex, isAfter = false) => {
      const source = this.headerRow.cells[fromIndex];
      const target = this.headerRow.cells[toIndex];

      const dataTransfer = new DataTransfer();

      // Dragstart
      const dragstart = new DragEvent('dragstart', { bubbles: true, dataTransfer });
      source.dispatchEvent(dragstart);

      // Dragover
      const dragover = new DragEvent('dragover', { bubbles: true, dataTransfer });
      target.dispatchEvent(dragover);

      // Drop
      const bounding = target.getBoundingClientRect();
      const offset = isAfter ? bounding.width * 0.75 : bounding.width * 0.25;
      const clientX = bounding.left + offset;
      const drop = new DragEvent('drop', { bubbles: true, dataTransfer, clientX });
      target.dispatchEvent(drop);

      // Dragend
      const dragend = new DragEvent('dragend', { bubbles: true, dataTransfer });
      source.dispatchEvent(dragend);
    };

    // Helper to simulate drag and drop for rows
    this.simulateRowDrag = (fromRowIndex, toRowIndex, isAfter = false) => {
      const sourceHandle = this.tbody.rows[fromRowIndex].cells[0];
      const targetHandle = this.tbody.rows[toRowIndex].cells[0];

      const dataTransfer = new DataTransfer();

      // Dragstart
      const dragstart = new DragEvent('dragstart', { bubbles: true, dataTransfer });
      sourceHandle.dispatchEvent(dragstart);

      // Dragover
      const dragover = new DragEvent('dragover', { bubbles: true, dataTransfer });
      targetHandle.dispatchEvent(dragover);

      // Drop
      const bounding = targetHandle.getBoundingClientRect();
      const offset = isAfter ? bounding.height * 0.75 : bounding.height * 0.25;
      const clientY = bounding.top + offset;
      const drop = new DragEvent('drop', { bubbles: true, dataTransfer, clientY });
      targetHandle.dispatchEvent(drop);

      // Dragend
      const dragend = new DragEvent('dragend', { bubbles: true, dataTransfer });
      sourceHandle.dispatchEvent(dragend);
    };
  }
});

QUnit.test('reorders columns when dragging one result column before another', function(assert) {
  // Add a second result column
  this.addResultColumn('Result1');

  // Headers: Description(0), Name(1), Formula(2), Result0(3), Result1(4), Unit(5)
  assert.equal(this.headerRow.cells[3].textContent, 'Result0', 'Initial order: Result0 at 3');
  assert.equal(this.headerRow.cells[4].textContent, 'Result1', 'Initial order: Result1 at 4');

  this.simulateColumnDrag(3, 4, true);

  assert.equal(this.headerRow.cells[3].textContent, 'Result1', 'After drag: Result1 at 3');
  assert.equal(this.headerRow.cells[4].textContent, 'Result0', 'After drag: Result0 at 4');

  // Check in a body row too
  const bodyRow = this.tbody.rows[0];
  assert.equal(bodyRow.cells.length, 6, 'Body row has correct number of cells');
});

QUnit.test('reorders rows when dragging one row before another', function(assert) {
  // Assume initial 2 data rows + blank
  assert.equal(this.tbody.rows[0].cells[0].textContent, 'desc1', 'Initial: row0 desc1');
  assert.equal(this.tbody.rows[1].cells[0].textContent, 'desc2', 'Initial: row1 desc2');

  // To swap, drag row0 to row1, isAfter=true -> insert after row1
  this.simulateRowDrag(0, 1, true);

  assert.equal(this.tbody.rows[0].cells[0].textContent, 'desc2', 'After drag: row0 now desc2');
  assert.equal(this.tbody.rows[1].cells[0].textContent, 'desc1', 'After drag: row1 now desc1');
});

QUnit.test('delegation works for dynamically added result columns', function(assert) {
  // Add a new result column dynamically
  this.addResultColumn('ResultNew');

  // Headers: Desc(0),Name(1),Formula(2),Result0(3),ResultNew(4),Unit(5)

  // Drag 4 to 3, isAfter=false -> toIndex=3, insert before 3: moves 4 to 3, shifting others
  this.simulateColumnDrag(4, 3, false);

  assert.equal(this.headerRow.cells[3].textContent, 'ResultNew', 'Dynamic column dragged to new position');
  assert.equal(this.headerRow.cells[4].textContent, 'Result0', 'Original column moved');
});

QUnit.test('delegation works for dynamically added rows', function(assert) {
  // Add a new row
  this.addRow(false); // non-blank: newdesc etc.

  // Now tbody rows: 0 desc1,1 desc2,2 blank,3 newdesc

  // Simulate drag the new row (3) to before row0 (0), isAfter=false
  this.simulateRowDrag(3, 0, false);

  assert.equal(this.tbody.rows[0].cells[0].textContent, 'newdesc', 'Dynamic row dragged to top');
  assert.equal(this.tbody.rows[1].cells[0].textContent, 'desc1', 'Original row0 now at 1');
});

QUnit.test('cannot drag non-result columns', function(assert) {
  const nonDragTh = this.headerRow.cells[0]; // Description
  nonDragTh.draggable = true; // Force for test

  const dataTransfer = new DataTransfer();
  const dragstart = new DragEvent('dragstart', { bubbles: true, dataTransfer });
  nonDragTh.dispatchEvent(dragstart);

  // Simulate drop on another
  const target = this.headerRow.cells[1];
  const dragover = new DragEvent('dragover', { bubbles: true, dataTransfer });
  target.dispatchEvent(dragover);

  const bounding = target.getBoundingClientRect();
  const clientX = bounding.left + bounding.width / 2;
  const drop = new DragEvent('drop', { bubbles: true, dataTransfer, clientX });
  target.dispatchEvent(drop);

  // Order should not change
  assert.equal(this.headerRow.cells[0].textContent, 'Description', 'Non-drag column not moved');
});