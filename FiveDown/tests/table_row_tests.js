// tests/table_row_tests.js

import { TableRow } from '../js/table_row.js';
import { Data } from '../js/dim_data.js';

QUnit.module('TableRow Class Tests', function() {

  function escapeHtmlAttribute(str) {
    return str.replace(/"/g, '&quot;');
  }

  function createSampleHtml(resultValues = [{text: '5', data: '5'}], unit = 'unit', formulaData = 'Form', formulaText = 'Form') {
    let results = resultValues.map(({text, data}) => `<td class="result" data-value="${escapeHtmlAttribute(data)}">${text}</td>`).join('');
    return `
      <tr>
        <td class="handle">H</td>
        <td class="description">Desc</td>
        <td class="name">Name</td>
        <td class="formula" data-value="${formulaData}">${formulaText}</td>
        ${results}
        <td class="add-result">Add</td>
        <td class="unit">${unit}</td>
        <td class="delete">Del</td>
      </tr>
    `;
  }

  function htmlToElement(html) {
    const temp = document.createElement('table');
    temp.innerHTML = html.trim();
    return temp.querySelector('tr');
  }

  QUnit.test('Constructor and validation - valid minimal row', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.ok(row.row instanceof HTMLTableRowElement, 'Row element set');
  });

  QUnit.test('Constructor throws on non-TR element', function(assert) {
    const div = document.createElement('div');
    assert.throws(() => new TableRow(div), /Invalid table row element/, 'Throws for non-TR');
  });

  QUnit.test('Constructor validation - too few columns', function(assert) {
    const invalidHtml = '<tr><td class="handle"></td><td class="description"></td></tr>';
    const tr = htmlToElement(invalidHtml);
    assert.throws(() => new TableRow(tr), /Insufficient columns/, 'Throws for insufficient columns');
  });

  QUnit.test('Constructor validation - wrong class on column', function(assert) {
    let html = createSampleHtml().replace('class="name"', 'class="wrong"');
    const tr = htmlToElement(html);
    assert.throws(() => new TableRow(tr), /Expected class "name" on column/, 'Throws for wrong class');
  });

  QUnit.test('Constructor validation - wrong class on unit', function(assert) {
    let html = createSampleHtml().replace('class="unit"', 'class="wrong"');
    const tr = htmlToElement(html);
    assert.throws(() => new TableRow(tr), /Expected class "unit" on column/, 'Throws for wrong unit class');
  });

  QUnit.test('Constructor validation - non-result in results area', function(assert) {
    let html = createSampleHtml().replace('class="result"', 'class="wrong"');
    const tr = htmlToElement(html);
    assert.throws(() => new TableRow(tr), /Expected class "result" on column/, 'Throws for wrong result class');
  });

  QUnit.test('Constructor with multiple results', function(assert) {
    const html = createSampleHtml([{text: '5', data: '5'}, {text: '10', data: '10'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.row.querySelectorAll('td.result').length, 2, 'Multiple result columns');
  });

  QUnit.test('update() replaces row and revalidates', function(assert) {
    const originalHtml = createSampleHtml();
    const originalTr = htmlToElement(originalHtml);
    const row = new TableRow(originalTr);
    const container = document.createElement('div');
    container.appendChild(row.row);

    const newHtml = createSampleHtml([{text: '10', data: '10'}]);
    const newTr = htmlToElement(newHtml);
    row.update(newTr);

    assert.strictEqual(container.children[0], row.row, 'Row replaced in DOM');
    assert.strictEqual(row.result(0).val(), 10, 'Updated value');
    assert.strictEqual(row.unit(), 'unit', 'Unit unchanged');
  });

  QUnit.test('update() throws on non-TR element', function(assert) {
    const originalHtml = createSampleHtml();
    const originalTr = htmlToElement(originalHtml);
    const row = new TableRow(originalTr);
    const div = document.createElement('div');
    assert.throws(() => row.update(div), /Invalid table row element/, 'Throws for non-TR');
  });

  QUnit.test('update() throws on invalid structure', function(assert) {
    const originalHtml = createSampleHtml();
    const originalTr = htmlToElement(originalHtml);
    const row = new TableRow(originalTr);
    const invalidHtml = '<tr><td></td></tr>';
    const invalidTr = htmlToElement(invalidHtml);
    assert.throws(() => row.update(invalidTr), /Insufficient columns/, 'Throws for invalid update');
  });

  QUnit.test('description() getter', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.description(), 'Desc', 'Returns description text');
  });

  QUnit.test('name() getter and setter', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.name(), 'Name', 'Initial name');

    const old = row.name('New Name');
    assert.strictEqual(old, 'Name', 'Returns old name');
    assert.strictEqual(row.name(), 'New Name', 'Name updated');

    assert.throws(() => row.name(''), /Name cannot be blank/, 'Throws for empty name');
    assert.throws(() => row.name('   '), /Name cannot be blank/, 'Throws for whitespace name');
  });

  QUnit.test('formula() getter from data-value', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.formula(), 'Form', 'Returns data-value');
  });

  QUnit.test('unit() getter', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.unit(), 'unit', 'Returns unit text');
  });

  QUnit.test('result() getter for different types', function(assert) {
    let html = createSampleHtml([{text: '42.000', data: '42'}]);
    let tr = htmlToElement(html);
    let row = new TableRow(tr);
    let data = row.result(0);
    assert.strictEqual(data.val(), 42, 'Number value');
    assert.strictEqual(data.unit(), 'unit', 'Unit');
    assert.strictEqual(data.type(), 'number', 'Number type');

    html = createSampleHtml([{text: '3.140', data: '3.14'}]);
    tr = htmlToElement(html);
    row = new TableRow(tr);
    data = row.result(0);
    assert.strictEqual(data.val(), 3.14, 'Float value');
    assert.strictEqual(data.type(), 'number', 'Float type');

    html = createSampleHtml([{text: '1.00,2.00,3.00', data: '[1,2,3]'}]);
    tr = htmlToElement(html);
    row = new TableRow(tr);
    data = row.result(0);
    assert.deepEqual(data.val(), [1,2,3], 'Vector value');
    assert.strictEqual(data.type(), 'vector', 'Vector type');

    html = createSampleHtml([{text: 'true', data: 'true'}]);
    tr = htmlToElement(html);
    row = new TableRow(tr);
    data = row.result(0);
    assert.strictEqual(data.val(), true, 'Boolean value');
    assert.strictEqual(data.type(), 'boolean', 'Boolean type');

    html = createSampleHtml([{text: 'hello', data: '"hello"'}]);
    tr = htmlToElement(html);
    row = new TableRow(tr);
    data = row.result(0);
    assert.strictEqual(data.val(), 'hello', 'String value');
    assert.strictEqual(data.type(), 'string', 'String type');
  });

  QUnit.test('result() setter invalid cases', function(assert) {
    const html = createSampleHtml();
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.throws(() => row.result(-1), /Invalid result index/, 'Invalid negative index');
    assert.throws(() => row.result(1), /Invalid result index/, 'Index out of range');
    assert.throws(() => row.result(0, {}), /New value must be Data or Error instance/, 'Invalid type');
  });

  QUnit.test('result() setter when unit empty', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}], '');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    assert.strictEqual(row.unit(), '', 'Initial empty unit');

    const newData = new Data(100, 'cm');
    const oldData = row.result(0, newData);
    assert.strictEqual(oldData.val(), 5, 'Old value');
    assert.strictEqual(oldData.unit(), '', 'Old unit');
    assert.strictEqual(row.result(0).val(), 100, 'New value set');
    assert.strictEqual(row.unit(), 'cm', 'Unit updated');
    const resultTd = row.row.querySelector('td.result');
    assert.false(resultTd.classList.contains('converted'), 'No converted class');
  });

  QUnit.test('result() setter when units match', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}], 'cm');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const newData = new Data(100, 'cm');
    row.result(0, newData);
    assert.strictEqual(row.result(0).val(), 100, 'Value updated');
    assert.strictEqual(row.unit(), 'cm', 'Unit unchanged');
    const resultTd = row.row.querySelector('td.result');
    assert.false(resultTd.classList.contains('converted'), 'No converted class');
  });

  QUnit.test('result() setter when units mismatch - converts', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}], 'm');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const newData = new Data(100, 'cm');
    row.result(0, newData);
    assert.strictEqual(row.result(0).val(), 1, 'Converted value');
    assert.strictEqual(row.unit(), 'm', 'Unit unchanged');
    const resultTd = row.row.querySelector('td.result');
    assert.true(resultTd.classList.contains('converted'), 'Converted class added');
    assert.strictEqual(resultTd.getAttribute('data-convert-factor'), '0.01', 'Conversion factor set');
  });

  QUnit.test('result() setter throws on incompatible units', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}], 'kg');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const newData = new Data(100, 'cm');
    assert.throws(() => row.result(0, newData), /Incompatible units for conversion/, 'Throws on mismatch');
  });

  QUnit.test('result() setter for vector with conversion', function(assert) {
    const html = createSampleHtml([{text: '1.00,2.00', data: '[1,2]'}], 'm');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const newData = new Data([100, 200], 'cm');
    row.result(0, newData);
    assert.deepEqual(row.result(0).val(), [1, 2], 'Converted vector');
    assert.strictEqual(row.unit(), 'm', 'Unit unchanged');
    const resultTd = row.row.querySelector('td.result');
    assert.true(resultTd.classList.contains('converted'), 'Converted class');
  });

  QUnit.test('result() setter for Error', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const err = new Error('Test error');
    const oldData = row.result(0, err);
    assert.strictEqual(oldData.val(), 5, 'Old value');
    const resultTd = row.row.querySelector('td.result');
    assert.strictEqual(resultTd.textContent, 'Test error', 'Error message set');
    assert.true(resultTd.classList.contains('error'), 'Error class added');
    assert.false(resultTd.hasAttribute('data-value'), 'Data-value removed');
    assert.false(resultTd.classList.contains('converted'), 'No converted class');
    assert.strictEqual(row.result(0), null, 'Getter returns null after error set');
  });

  QUnit.test('result() getter prefers data-value over text', function(assert) {
    const html = createSampleHtml([{text: '1.235', data: '1.23456'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const data = row.result(0);
    assert.strictEqual(data.val(), 1.23456, 'Uses data-value');
  });

  QUnit.test('result() setter formats numbers correctly', function(assert) {
    const html = createSampleHtml([{text: '', data: ''}], '');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const resultTd = row.row.querySelector('td.result');

    row.result(0, new Data(1.23456, ''));
    assert.strictEqual(resultTd.textContent, '1.235', 'Fixed 3 decimals');
    assert.strictEqual(resultTd.getAttribute('data-value'), '1.23456', 'Full value in data');
    assert.strictEqual(row.result(0).val(), 1.23456, 'Getter full value');

    row.result(0, new Data(0.001235, ''));
    assert.strictEqual(resultTd.textContent, '1.235e-3', 'Exponential for small');
    assert.strictEqual(resultTd.getAttribute('data-value'), '0.001235', 'Full value');

    row.result(0, new Data(42, ''));
    assert.strictEqual(resultTd.textContent, '42.000', 'Integer as fixed');
    assert.strictEqual(resultTd.getAttribute('data-value'), '42', 'Integer value');

    row.result(0, new Data(0, ''));
    assert.strictEqual(resultTd.textContent, '0.000', 'Zero formatted');
    assert.strictEqual(resultTd.getAttribute('data-value'), '0', 'Zero value');

    row.result(0, new Data(-0.00012345001, ''));
    assert.strictEqual(resultTd.textContent, '-1.235e-4', 'Negative small exponential');
    assert.strictEqual(resultTd.getAttribute('data-value'), '-0.00012345001', 'Full negative value');
  });

  QUnit.test('result() setter formats vectors to 2 decimals', function(assert) {
    const html = createSampleHtml([{text: '', data: ''}], '');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const resultTd = row.row.querySelector('td.result');

    const vec = [1.23456, 0.001235, 42];
    row.result(0, new Data(vec, ''));
    assert.strictEqual(resultTd.textContent, '1.23,0.00,42.00', 'Vector formatted to 2 decimals');
    assert.strictEqual(resultTd.getAttribute('data-value'), '[1.23456,0.001235,42]', 'Full vector in data');
    assert.deepEqual(row.result(0).val(), vec, 'Getter full vector');
  });

  QUnit.test('result() setter for non-numeric types', function(assert) {
    const html = createSampleHtml([{text: '', data: ''}], '');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const resultTd = row.row.querySelector('td.result');

    row.result(0, new Data(true, ''));
    assert.strictEqual(resultTd.textContent, 'true', 'Boolean text');
    assert.strictEqual(resultTd.getAttribute('data-value'), 'true', 'Boolean data');
    assert.strictEqual(row.result(0).val(), true, 'Boolean value');

    row.result(0, new Data('hello', ''));
    assert.strictEqual(resultTd.textContent, 'hello', 'String text');
    assert.strictEqual(resultTd.getAttribute('data-value'), '"hello"', 'String data');
    assert.strictEqual(row.result(0).val(), 'hello', 'String value');
  });

  QUnit.test('result() setter switches between Error and Data', function(assert) {
    const html = createSampleHtml([{text: '5.000', data: '5'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const resultTd = row.row.querySelector('td.result');

    row.result(0, new Error('Error'));
    assert.true(resultTd.classList.contains('error'), 'Error class set');
    assert.strictEqual(resultTd.textContent, 'Error', 'Error text');
    assert.strictEqual(row.result(0), null, 'Getter null for error');

    row.result(0, new Data(10, 'unit'));
    assert.false(resultTd.classList.contains('error'), 'Error class removed');
    assert.strictEqual(resultTd.textContent, '10.000', 'Data text set');
    assert.strictEqual(resultTd.getAttribute('data-value'), '10', 'Data value set');

    row.result(0, new Error('New Error'));
    assert.true(resultTd.classList.contains('error'), 'Error class re-added');
    assert.strictEqual(resultTd.textContent, 'New Error', 'New error text');
    assert.false(resultTd.hasAttribute('data-value'), 'Data-value removed again');
  });

  QUnit.test('result() getter handles non-JSON data-value as string', function(assert) {
    const html = createSampleHtml([{text: 'hello', data: 'hello'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const data = row.result(0);
    assert.strictEqual(data.val(), 'hello', 'Treats as string');
    assert.strictEqual(data.type(), 'string', 'String type');
  });

  QUnit.test('result() getter and setter for plain text', function(assert) {
    const html = createSampleHtml([{text: 'plain text', data: 'plain text'}]);
    const tr = htmlToElement(html);
    const row = new TableRow(tr);
    const data = row.result(0);
    assert.strictEqual(data.val(), 'plain text', 'Gets plain text as string');
    assert.strictEqual(data.type(), 'string', 'String type');

    // Setter for text
    const newData = new Data('new plain text', '');
    row.result(0, newData);
    const resultTd = row.row.querySelector('td.result');
    assert.strictEqual(resultTd.textContent, 'new plain text', 'Sets plain text');
    assert.strictEqual(resultTd.getAttribute('data-value'), '"new plain text"', 'Data-value as JSON string');
    assert.strictEqual(row.result(0).val(), 'new plain text', 'Gets updated plain text');
  });

});