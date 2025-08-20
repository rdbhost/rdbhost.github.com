// tests/sheet_interface_tests.js
// QUnit tests for sheet_interface.js
// Assumes QUnit is loaded, and the necessary modules are available.

import { TableRow } from '../js/table_row.js';
import { RowCollection } from '../js/row_collection.js';
import { PubSub } from '../js/pubsub.js';
import { Data } from '../js/dim_data.js';
import { setupTableInterface, enforceRowRules } from '../js/sheet_interface.js';

// Mock DOM setup
function createMockTable() {
  const table = document.createElement('table');
  table.id = 'main-sheet';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  // Create header row
  const headerRow = document.createElement('tr');
  ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'].forEach(colClass => {
    const th = document.createElement('th');
    th.classList.add(colClass);
    if (colClass === 'add-result') {
      th.innerHTML = '<button>+</button>';
    } else if (colClass === 'result') {
      th.textContent = 'Result';
    }
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create a sample row HTML string for TableRow
  const rowHtml = `
    <tr>
      <td class="handle"></td>
      <td class="description"></td>
      <td class="name" data-value="testName">testName</td>
      <td class="formula"></td>
      <td class="result"></td>
      <td class="add-result"></td>
      <td class="unit"></td>
      <td class="delete"><button>X</button></td>
    </tr>
  `;
  const handler = new TableRow(rowHtml);
  const row = handler.tr;
  tbody.appendChild(row);

  // Attach pubsub and row_collection
  table.pubsub = new PubSub();
  table.row_collection = new RowCollection([handler]);

  document.body.appendChild(table);

  return { table, thead, tbody, row, rowHtml };
}

QUnit.module('sheet_interface.js tests', {
  beforeEach: function() {
    this.mock = createMockTable();
    this.table = this.mock.table;
    this.tbody = this.mock.tbody;
    this.thead = this.mock.thead;
    this.row = this.mock.row;
    this.rowHtml = this.mock.rowHtml;
    this.pubsubCalls = [];
    this.pubsubSpy = (message) => {
      this.pubsubCalls.push(message);
    };
    this.table.pubsub.subscribe('recalculation', this.pubsubSpy);

    // Explicitly call setupTableInterface
    setupTableInterface(this.table);
  },
  afterEach: function() {
    document.body.removeChild(this.table);
  }
});

QUnit.test('Row duplication on double-click', function (assert) {
  const originalRowCount = this.tbody.rows.length;
  const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
  this.row.dispatchEvent(dblClickEvent);

  assert.equal(this.tbody.rows.length, originalRowCount + 1, 'Row is duplicated');
  const newRow = this.tbody.rows[1];
  const newNameTd = newRow.querySelector('td.name');
  assert.ok(newNameTd.textContent.startsWith('_testName'), 'New name is prefixed to avoid duplicate');
  assert.ok(this.table.row_collection.rowMap.has(newNameTd.textContent), 'New row added to collection');
});

QUnit.test('Name change on blur', function (assert) {
  const nameTd = this.row.querySelector('td.name');
  nameTd.contentEditable = true;
  nameTd.textContent = 'newName';
  const blurEvent = new FocusEvent('blur', { bubbles: true });
  nameTd.dispatchEvent(blurEvent);

  assert.equal(nameTd.dataset.value, 'newName', 'Data-value updated');
  assert.ok(this.table.row_collection.rowMap.has('newName'), 'Collection updated with new name');
  assert.notOk(this.table.row_collection.rowMap.has('testName'), 'Old name removed from collection');
});

QUnit.test('Formula edit: focus and blur', async function (assert) {
  const formulaTd = this.row.querySelector('td.formula');
  formulaTd.dataset.value = 'a @ b';
  formulaTd.textContent = 'a ⋅ b'; // Pre-formatted
  formulaTd.contentEditable = true;

  const focusEvent = new FocusEvent('focus', { bubbles: true });
  formulaTd.dispatchEvent(focusEvent);
  assert.equal(formulaTd.textContent, 'a @ b', 'Raw value on focus');

  formulaTd.textContent = 'a * c';
  const blurEvent = new FocusEvent('blur', { bubbles: true });
  formulaTd.dispatchEvent(blurEvent);

  await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async publish

  assert.equal(formulaTd.dataset.value, 'a * c', 'Data-value updated');
  assert.equal(formulaTd.textContent, 'a × c', 'Formatted on blur');
  assert.strictEqual(this.pubsubCalls.length, 1, 'Recalculation triggered once');
  assert.strictEqual(this.pubsubCalls[0], 'go', 'Triggered with "go"');

  // Check rules
  const resultTd = this.row.querySelector('td.result');
  assert.equal(resultTd.contentEditable, 'false', 'Results non-editable');
  assert.ok(resultTd.classList.contains('readonly'), 'Readonly class added');
  assert.ok(resultTd.classList.contains('output'), 'Output class added');
});

QUnit.test('Result edit: focus and blur', async function (assert) {
  const resultTd = this.row.querySelector('td.result');
  resultTd.contentEditable = true;
  resultTd.dataset.value = '1.234';

  const focusEvent = new FocusEvent('focus', { bubbles: true });
  resultTd.dispatchEvent(focusEvent);
  assert.equal(resultTd.textContent, '1.234', 'Raw value on focus');

  resultTd.textContent = '5.678';
  const blurEvent = new FocusEvent('blur', { bubbles: true });
  resultTd.dispatchEvent(blurEvent);

  await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async publish

  assert.equal(resultTd.textContent, '5.678', 'Formatted on blur'); // Adjust based on actual formatting
  assert.equal(resultTd.dataset.value, '5.678', 'Data-value updated');
  assert.strictEqual(this.pubsubCalls.length, 1, 'Recalculation triggered once');
  assert.strictEqual(this.pubsubCalls[0], 'go', 'Triggered with "go"');

  const formulaTd = this.row.querySelector('td.formula');
  assert.equal(formulaTd.textContent, '', 'Formula cleared');
  assert.equal(formulaTd.contentEditable, 'false', 'Formula non-editable');

  assert.equal(resultTd.contentEditable, 'true', 'Results editable');
  assert.ok(resultTd.classList.contains('input'), 'Input class added');
});

QUnit.test('Add result column on button click', function (assert) {
  const addButton = this.thead.querySelector('th.add-result button');
  const clickEvent = new MouseEvent('click', { bubbles: true });
  addButton.dispatchEvent(clickEvent);

  const headers = this.thead.querySelectorAll('th');
  assert.equal(headers[4].textContent, 'Result 0', 'First result renamed to Result 0');
  assert.equal(headers[5].textContent, 'Result 1', 'New result column added');

  const newResultTd = this.row.querySelectorAll('td.result')[1];
  assert.ok(newResultTd, 'New td added to row');
  assert.equal(newResultTd.contentEditable, 'true', 'New td editable if formula blank');
});

QUnit.test('Delete row on button click', async function (assert) {
  const deleteButton = this.row.querySelector('td.delete button');
  const clickEvent = new MouseEvent('click', { bubbles: true });
  deleteButton.dispatchEvent(clickEvent);

  await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async publish

  assert.equal(this.tbody.rows.length, 0, 'Row removed from DOM');
  assert.notOk(this.table.row_collection.rowMap.has('testName'), 'Row removed from collection');
  assert.strictEqual(this.pubsubCalls.length, 1, 'Recalculation triggered once');
  assert.strictEqual(this.pubsubCalls[0], 'go', 'Triggered with "go"');
});

QUnit.test('Result header edit on double-click', function (assert) {
  const resultTh = this.thead.querySelector('th.result');
  const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
  resultTh.dispatchEvent(dblClickEvent);

  assert.equal(resultTh.contentEditable, 'true', 'Header becomes editable');

  // Simulate edit and focusout
  resultTh.textContent = 'New Result';
  const focusoutEvent = new FocusEvent('focusout', { bubbles: true });
  resultTh.dispatchEvent(focusoutEvent);

  assert.equal(resultTh.contentEditable, 'false', 'Editable removed on focusout');
  assert.equal(resultTh.textContent, 'New Result', 'Text updated');
});

QUnit.test('enforceRowRules with formula', function (assert) {
  const row = this.row;
  const formulaTd = row.querySelector('td.formula');
  formulaTd.dataset.value = 'a * b';
  formulaTd.textContent = 'a × b';

  enforceRowRules(row);

  const resultTd = row.querySelector('td.result');
  assert.equal(resultTd.contentEditable, 'false', 'Results non-editable when formula present');
  assert.ok(resultTd.classList.contains('readonly'), 'Readonly class added');
  assert.ok(resultTd.classList.contains('output'), 'Output class added');
  assert.equal(formulaTd.contentEditable, 'true', 'Formula remains editable');
});

QUnit.test('enforceRowRules without formula', function (assert) {
  const row = this.row;
  const formulaTd = row.querySelector('td.formula');
  formulaTd.dataset.value = '';
  formulaTd.textContent = '';

  enforceRowRules(row);

  const resultTd = row.querySelector('td.result');
  assert.equal(resultTd.contentEditable, 'true', 'Results editable when formula blank');
  assert.ok(resultTd.classList.contains('input'), 'Input class added');
  assert.notOk(resultTd.classList.contains('readonly'), 'Readonly class removed');
  assert.notOk(resultTd.classList.contains('output'), 'Output class removed');
  assert.equal(formulaTd.contentEditable, 'false', 'Formula non-editable');
});