// tests.js

import { loadSample, loadSheet } from '../js/sheet_loader.js';
import { formatFormula as originalFormatFormula, formatResult as originalFormatResult, 
    enforceRowRules as originalEnforceRowRules } from '../js/sheet_interface.js';

const mockSamples = {
  testSample: {
    header: ['Header1', 'Header2'],
    rows: [
      null,
      ['Desc1', 'name1', 'unit1', 'formula1'],
      ['Desc2', 'name2', 'unit2', [1, 'two']],
      null
    ]
  }
};

QUnit.module('loadSample', {
  beforeEach: function() {
    this.table = document.querySelector('#test-table');
    const blankRow = this.table.tBodies[0].rows[0].cloneNode(true);
    this.table.blank_row = blankRow;
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

QUnit.test('loads sample with null rows and formula', function(assert) {
  loadSample(this.table, mockSamples, 'testSample');

  const theadRow = this.table.tHead.rows[0];
  const resultThs = theadRow.querySelectorAll('.result');
  assert.equal(resultThs.length, 2, 'Adjusted to 2 result columns');
  assert.equal(resultThs[0].querySelector('span').textContent, 'Header1', 'First header set');
  assert.equal(resultThs[1].querySelector('span').textContent, 'Header2', 'Second header set');

  const rows = this.table.tBodies[0].rows;
  assert.equal(rows.length, 4, '4 rows loaded (including nulls)');

  // First row: null (blank)
  assert.equal(rows[0].querySelector('.description').textContent, '', 'First row description blank');
  assert.equal(rows[0].querySelector('.name').textContent, '', 'First row name blank');
  assert.equal(rows[0].querySelector('.unit').textContent, '', 'First row unit blank');
  assert.equal(rows[0].querySelector('.formula').textContent, '', 'First row formula blank');
  assert.equal(rows[0].querySelectorAll('.result')[0].textContent, '', 'First row result1 blank');
  assert.equal(rows[0].querySelectorAll('.result')[1].textContent, '', 'First row result2 blank');

  // Second row: formula
  assert.equal(rows[1].querySelector('.description').textContent, 'Desc1', 'Second row description');
  assert.equal(rows[1].querySelector('.name').textContent, 'name1', 'Second row name');
  assert.equal(rows[1].querySelector('.unit').textContent, 'unit1', 'Second row unit');
  assert.equal(rows[1].querySelector('.formula').getAttribute('data-value'), 'formula1', 'Second row formula data-value');
  assert.equal(rows[1].querySelector('.formula').textContent, 'formula1', 'Second row formula text (mocked)');

  // Third row: results
  assert.equal(rows[2].querySelector('.description').textContent, 'Desc2', 'Third row description');
  assert.equal(rows[2].querySelector('.name').textContent, 'name2', 'Third row name');
  assert.equal(rows[2].querySelector('.unit').textContent, 'unit2', 'Third row unit');
  assert.equal(rows[2].querySelector('.formula').textContent, '', 'Third row formula blank');
  assert.equal(rows[2].querySelectorAll('.result')[0].getAttribute('data-value'), '1', 'Third row result1 data-value');
  assert.equal(rows[2].querySelectorAll('.result')[0].textContent, '1', 'Third row result1 text (mocked)');
  assert.equal(rows[2].querySelectorAll('.result')[1].getAttribute('data-value'), '"two"', 'Third row result2 data-value');
  assert.equal(rows[2].querySelectorAll('.result')[1].textContent, '"two"', 'Third row result2 text (mocked)');

  // Fourth row: null (blank)
  assert.equal(rows[3].querySelector('.description').textContent, '', 'Fourth row description blank');

  assert.equal(this.formatFormulaCalled, 1, 'formatFormula called for formula row');
  assert.equal(this.formatResultCalled, 2, 'formatResult called for two results');
  assert.equal(this.enforceRowRulesCalled, 4, 'enforceRowRules called for each row');
});

QUnit.test('does nothing for unknown sample', function(assert) {
  const originalTbodyHTML = this.table.tBodies[0].innerHTML;
  loadSample(this.table, mockSamples, 'unknown');

  assert.equal(this.table.tBodies[0].innerHTML, originalTbodyHTML, 'Table unchanged for unknown sample');
  assert.equal(this.publishCalled, 0, 'No publish called');
});