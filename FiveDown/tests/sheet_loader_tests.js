// tests.js

import { loadSample, loadSheet, scanSheet } from '../js/sheet_loader.js';
import { formatFormula as originalFormatFormula, formatResult as originalFormatResult, 
  enforceRowRules as originalEnforceRowRules } from '../js/sheet_interface.js';
import { RowCollection } from '../js/row_collection.js';
import { TableRow } from '../js/table_row.js';

const mockSamples = {
  testSample: {
    header: ['Header1'],
    rows: [
      null,
      ['Desc1', 'name1', 'unit1', 'formula1'],
      ['Desc2', 'name2', 'unit2', [1]],
      null
    ]
  },
  duplicateNameSample: {
    header: ['Header1'],
    rows: [
      ['Desc1', 'dup', 'unit1', 'formula1'],
      ['Desc2', 'dup', 'unit2', 'formula2'],
      ['Desc3', 'dup', 'unit3', [3]]
    ]
  },
  noNameSample: {
    header: ['Header1'],
    rows: [
      null,
      ['Desc1', '', 'unit1', 'formula1'],
      null,
      ['Desc2', '', 'unit2', [1]]
    ]
  }
};

function populateTable(table, headers, rowsData) {
  const theadRow = table.tHead.rows[0];
  const resultThs = theadRow.querySelectorAll('.result');
  resultThs.forEach((th, idx) => {
    if (idx < headers.length) {
      th.querySelector('span').textContent = headers[idx];
    }
  });

  const tbody = table.tBodies[0];
  tbody.innerHTML = '';
  rowsData.forEach(row => {
    const tr = document.createElement('tr');
    // Handle
    const handleTd = document.createElement('td');
    handleTd.classList.add('handle');
    tr.appendChild(handleTd);

    // Description
    const descTd = document.createElement('td');
    descTd.classList.add('description');
    descTd.textContent = row.description || '';
    tr.appendChild(descTd);

    // Name
    const nameTd = document.createElement('td');
    nameTd.classList.add('name');
    nameTd.textContent = row.name || '';
    tr.appendChild(nameTd);

    // Formula
    const formulaTd = document.createElement('td');
    formulaTd.classList.add('formula');
    if (row.formulaData) {
      formulaTd.setAttribute('data-value', row.formulaData);
    }
    formulaTd.textContent = row.formulaText || '';
    tr.appendChild(formulaTd);

    // Result
    const resultTd = document.createElement('td');
    resultTd.classList.add('result');
    if (row.resultData) {
      resultTd.setAttribute('data-value', row.resultData);
    }
    resultTd.textContent = row.resultText || '';
    tr.appendChild(resultTd);

    // Add-result (empty)
    const addResultTd = document.createElement('td');
    addResultTd.classList.add('add-result');
    tr.appendChild(addResultTd);

    // Unit
    const unitTd = document.createElement('td');
    unitTd.classList.add('unit');
    unitTd.textContent = row.unit || '';
    tr.appendChild(unitTd);

    // Delete
    const deleteTd = document.createElement('td');
    deleteTd.classList.add('delete');
    tr.appendChild(deleteTd);

    tbody.appendChild(tr);
  });
}

QUnit.module('loadSheet row_collection integration', {
  beforeEach: function() {
    this.table = document.querySelector('#test-table');
    const blankRow = this.table.tBodies[0].rows[0].cloneNode(true);
    this.table.blank_row = blankRow;
    this.table.row_collection = new RowCollection();
    this.table.pubsub = { publish: function() {} };

    // Monkeypatch
    this.originalFormatFormula = originalFormatFormula;
    this.originalFormatResult = originalFormatResult;
    this.originalEnforceRowRules = originalEnforceRowRules;

    window.formatFormula = function(text) { return text; };
    window.formatResult = function(text) { return text; };
    window.enforceRowRules = function() {};

    this.formatFormulaCalled = 0;
    window.formatFormula = (text) => {
      this.formatFormulaCalled++;
      return text;
    };

    this.formatResultCalled = 0;
    window.formatResult = (text) => {
      this.formatResultCalled++;
      return text;
    };

    this.enforceRowRulesCalled = 0;
    window.enforceRowRules = (row) => {
      this.enforceRowRulesCalled++;
    };

    this.publishCalled = 0;
    this.table.pubsub.publish = () => {
      this.publishCalled++;
    };
  },
  afterEach: function() {
    // Restore originals
    window.formatFormula = this.originalFormatFormula;
    window.formatResult = this.originalFormatResult;
    window.enforceRowRules = this.originalEnforceRowRules;
  }
});

QUnit.test('adds named rows to row_collection', function(assert) {
  loadSample(this.table, mockSamples, 'testSample');

  assert.equal(this.table.row_collection.rows.size, 2, 'Two named rows added');
  assert.ok(this.table.row_collection.getRow('name1') instanceof TableRow, 'name1 added');
  assert.equal(this.table.row_collection.getRow('name1').name(), 'name1', 'name1 matches');
  assert.ok(this.table.row_collection.getRow('name2') instanceof TableRow, 'name2 added');
  assert.equal(this.table.row_collection.getRow('name2').name(), 'name2', 'name2 matches');
});

QUnit.test('handles duplicate names with prefix', function(assert) {
  loadSample(this.table, mockSamples, 'duplicateNameSample');

  assert.equal(this.table.row_collection.rows.size, 3, 'Three rows added');
  assert.ok(this.table.row_collection.getRow('dup') instanceof TableRow, 'First dup added as dup');
  assert.equal(this.table.row_collection.getRow('dup').name(), 'dup', 'First name dup');
  assert.ok(this.table.row_collection.getRow('_dup') instanceof TableRow, 'Second dup added as _dup');
  assert.equal(this.table.row_collection.getRow('_dup').name(), '_dup', 'Second name _dup');
  assert.ok(this.table.row_collection.getRow('__dup') instanceof TableRow, 'Third dup added as __dup');
  assert.equal(this.table.row_collection.getRow('__dup').name(), '__dup', 'Third name __dup');

  const rows = this.table.tBodies[0].rows;
  assert.equal(rows[0].querySelector('.name').textContent, 'dup', 'First row name updated to dup');
  assert.equal(rows[0].querySelector('.name').getAttribute('data-value'), 'dup', 'First row data-value dup');
  assert.equal(rows[1].querySelector('.name').textContent, '_dup', 'Second row name updated to _dup');
  assert.equal(rows[1].querySelector('.name').getAttribute('data-value'), '_dup', 'Second row data-value _dup');
  assert.equal(rows[2].querySelector('.name').textContent, '__dup', 'Third row name updated to __dup');
  assert.equal(rows[2].querySelector('.name').getAttribute('data-value'), '__dup', 'Third row data-value __dup');
});

QUnit.test('does not add rows without names', function(assert) {
  loadSample(this.table, mockSamples, 'noNameSample');

  assert.equal(this.table.row_collection.rows.size, 0, 'No rows added to collection');
  const rows = this.table.tBodies[0].rows;
  assert.equal(rows[1].querySelector('.name').textContent, '', 'Second row name blank');
  assert.equal(rows[1].querySelector('.name').getAttribute('data-value'), null, 'Second row no data-value');
  assert.equal(rows[3].querySelector('.name').textContent, '', 'Fourth row name blank');
  assert.equal(rows[3].querySelector('.name').getAttribute('data-value'), null, 'Fourth row no data-value');
});

QUnit.test('handles mixed named and unnamed rows', function(assert) {
  const mixedSample = {
    header: ['Header1'],
    rows: [
      ['Desc1', 'name1', 'unit1', 'formula1'],
      ['Desc2', '', 'unit2', [1]],
      null,
      ['Desc3', 'name3', 'unit3', 'formula3']
    ]
  };
  loadSheet(this.table, mixedSample);

  assert.equal(this.table.row_collection.rows.size, 2, 'Two named rows added');
  assert.ok(this.table.row_collection.getRow('name1') instanceof TableRow, 'name1 added');
  assert.ok(this.table.row_collection.getRow('name3') instanceof TableRow, 'name3 added');

  const rows = this.table.tBodies[0].rows;
  assert.equal(rows[0].querySelector('.name').textContent, 'name1', 'First row named');
  assert.equal(rows[1].querySelector('.name').textContent, '', 'Second row unnamed');
  assert.equal(rows[3].querySelector('.name').textContent, 'name3', 'Fourth row named');
});

QUnit.test('blank and null rows not added to collection', function(assert) {
  const blankRowsSample = {
    header: ['Header1'],
    rows: [
      null,
      null,
      ['', '', '', ''],
      null
    ]
  };
  loadSheet(this.table, blankRowsSample);

  assert.equal(this.table.row_collection.rows.size, 0, 'No rows added to collection');
});

QUnit.module('scanSheet', {
  beforeEach: function() {
    this.table = document.querySelector('#test-table');
    this.table.tBodies[0].innerHTML = '';
  }
});

QUnit.test('scans empty table', function(assert) {
  const result = scanSheet(this.table);
  assert.deepEqual(result.header, ['Result'], 'Single result header');
  assert.deepEqual(result.rows, [], 'No rows');
});

QUnit.test('scans blank row', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: '', name: '', formulaData: null, formulaText: '', resultData: null, resultText: '', unit: '' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [null], 'Blank row as null');
});

QUnit.test('scans row with formula in text', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: 'Test Desc', name: 'testName', formulaData: null, formulaText: 'a + b', resultData: null, resultText: '', unit: 'unit' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', 'a + b']
  ], 'Row with formula text');
});

QUnit.test('scans row with formula in data-value', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: 'Test Desc', name: 'testName', formulaData: 'a + b', formulaText: 'formatted', resultData: null, resultText: '', unit: 'unit' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', 'a + b']
  ], 'Row with formula data-value preferred');
});

//QUnit.test('scans row with scalar result in text', function(assert) {
//  populateTable(this.table, ['Result'], [
//    { description: 'Test Desc', name: 'testName', formulaData: null, formulaText: '', resultData: null, resultText: '42', unit: 'unit' }
//  ]);
//  const result = scanSheet(this.table);
//  assert.deepEqual(result.rows, [
//    ['Test Desc', 'testName', 'unit', '42']
//  ], 'Row with scalar result text as string');
//});

QUnit.test('scans row with scalar result in data-value', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: 'Test Desc', name: 'testName', formulaData: null, formulaText: '', resultData: '42', resultText: 'formatted', unit: 'unit' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', 42]
  ], 'Row with scalar result data-value parsed as number');
});

QUnit.test('scans row with array result', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: 'Test Desc', name: 'testName', formulaData: null, formulaText: '', resultData: '[1,2,3]', resultText: '[1,2,3]', unit: 'unit' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', [1,2,3]]
  ], 'Row with array result parsed');
});

QUnit.test('scans row with non-parsable result', function(assert) {
  populateTable(this.table, ['Result'], [
    { description: 'Test Desc', name: 'testName', formulaData: null, formulaText: '', resultData: null, resultText: 'text', unit: 'unit' }
  ]);
  const result = scanSheet(this.table);
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', 'text']
  ], 'Row with non-parsable result as string');
});

QUnit.test('scans multiple result columns', function(assert) {
  const table = document.querySelector('#test-table');
  // Manually add second result column for test
  const theadRow = table.tHead.rows[0];
  const addTh = theadRow.querySelector('.add-result');
  const templateTh = theadRow.querySelector('.result').cloneNode(true);
  templateTh.querySelector('span').textContent = 'Result2';
  theadRow.insertBefore(templateTh, addTh);

  const tbody = table.tBodies[0];
  tbody.innerHTML = '';
  const tr = document.createElement('tr');
  ['handle', 'description', 'name', 'formula', 'result', 'result', 'add-result', 'unit', 'delete'].forEach(cls => {
    const td = document.createElement('td');
    td.classList.add(cls);
    tr.appendChild(td);
  });
  tr.querySelector('.description').textContent = 'Test Desc';
  tr.querySelector('.name').textContent = 'testName';
  tr.querySelector('.unit').textContent = 'unit';
  const results = tr.querySelectorAll('.result');
  results[0].setAttribute('data-value', '42');
  results[1].setAttribute('data-value', '[1,2]');
  tbody.appendChild(tr);

  const result = scanSheet(table);
  assert.deepEqual(result.header, ['Result', 'Result2'], 'Multiple headers');
  assert.deepEqual(result.rows, [
    ['Test Desc', 'testName', 'unit', [42, [1,2]]]
  ], 'Row with multiple results as array');
});

QUnit.test('scans mixed rows including blanks', function(assert) {
  const table = document.querySelector('#test-table');
  populateTable(table, ['Result'], [
    { description: '', name: '', formulaData: null, formulaText: '', resultData: null, resultText: '', unit: '' }, // blank
    { description: 'Desc', name: 'name', formulaData: null, formulaText: 'formula', resultData: null, resultText: '', unit: 'unit' }, // formula
    { description: '', name: '', formulaData: null, formulaText: '', resultData: null, resultText: '', unit: '' }, // blank
    { description: 'Desc2', name: 'name2', formulaData: null, formulaText: '', resultData: null, resultText: 'text', unit: '' } // result
  ]);
  const result = scanSheet(table);
  assert.deepEqual(result.rows, [
    null,
    ['Desc', 'name', 'unit', 'formula'],
    null,
    ['Desc2', 'name2', null, 'text']
  ], 'Mixed rows with blanks as null');
});

QUnit.test('handles null or missing fields as null in output', function(assert) {
  const table = document.querySelector('#test-table');
  populateTable(table, ['Result'], [
    { description: null, name: null, formulaData: null, formulaText: null, resultData: null, resultText: null, unit: null }
  ]);
  const result = scanSheet(table);
  assert.deepEqual(result.rows, [
    null
  ], 'Null fields as null, blank result as empty string');
});