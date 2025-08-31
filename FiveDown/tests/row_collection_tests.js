// tests/row_collection_tests.js

import { RowCollection } from '../js/row_collection.js';
import { TableRow } from '../js/table_row.js';
import { Data } from '../js/dim_data.js';

QUnit.module('RowCollection and ColumnObjectWrapper Tests', function() {

  function htmlToElement(html) {
    const temp = document.createElement('table');
    temp.innerHTML = html.trim();
    return temp.querySelector('tr');
  }

  function escapeHtmlAttribute(str) {
    return str.replace(/"/g, '&quot;');
  }

  function createSampleRowHtml(name = 'testRow', resultValues = [{text: '5', data: '5'}], unit = 'unit') {
    let results = resultValues.map(({text, data}) => `<td class="result" data-value="${escapeHtmlAttribute(data)}">${text}</td>`).join('');
    return `
      <tr>
        <td class="handle">H</td>
        <td class="description">Desc</td>
        <td class="name">${name}</td>
        <td class="formula" data-value="formula">formula</td>
        ${results}
        <td class="add-result">Add</td>
        <td class="unit">${unit}</td>
        <td class="delete">Del</td>
      </tr>
    `;
  }

  QUnit.test('RowCollection constructor empty', function(assert) {
    const collection = new RowCollection();
    assert.strictEqual(collection.rows.size, 0, 'Empty collection');
  });

  QUnit.test('RowCollection constructor with rows', function(assert) {
    const html1 = createSampleRowHtml('row1');
    const tr1 = htmlToElement(html1);
    const row1 = new TableRow(tr1);

    const html2 = createSampleRowHtml('row2');
    const tr2 = htmlToElement(html2);
    const row2 = new TableRow(tr2);

    const collection = new RowCollection([row1, row2]);
    assert.strictEqual(collection.rows.size, 2, 'Two rows added');
    assert.strictEqual(collection.getRow('row1').name(), 'row1', 'Row1 retrieved');
    assert.strictEqual(collection.getRow('row2').name(), 'row2', 'Row2 retrieved');
  });

  QUnit.test('addRow adds row', function(assert) {
    const collection = new RowCollection();

    const html = createSampleRowHtml('row1');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    collection.addRow('row1', row);
    assert.strictEqual(collection.rows.size, 1, 'Row added');
    assert.strictEqual(collection.getRow('row1').name(), 'row1', 'Row retrieved');
  });

  QUnit.test('addRow throws if not TableRow', function(assert) {
    const collection = new RowCollection();
    assert.throws(() => collection.addRow('invalid', {}), /Row must be an instance of TableRow/, 'Throws for invalid row');
  });

  QUnit.test('getRow returns undefined if not found', function(assert) {
    const collection = new RowCollection();
    assert.strictEqual(collection.getRow('nonexistent'), undefined, 'Undefined for missing row');
  });

  QUnit.test('removeRow removes row', function(assert) {
    const html = createSampleRowHtml('row1');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const collection = new RowCollection();
    collection.addRow('row1', row);
    collection.removeRow('row1');
    assert.strictEqual(collection.rows.size, 0, 'Row removed');
    assert.strictEqual(collection.getRow('row1'), undefined, 'Row not found after remove');
  });

  QUnit.test('audit passes with matching names', function(assert) {
    const html1 = createSampleRowHtml('row1');
    const tr1 = htmlToElement(html1);
    const row1 = new TableRow(tr1);

    const html2 = createSampleRowHtml('row2');
    const tr2 = htmlToElement(html2);
    const row2 = new TableRow(tr2);

    const collection = new RowCollection([row1, row2]);
    collection.audit();
    assert.ok(true, 'Audit passes without throwing');
  });

  QUnit.test('audit throws on mismatch', function(assert) {
    const html = createSampleRowHtml('row1');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const collection = new RowCollection();
    collection.addRow('rowMismatch', row);
    assert.throws(() => collection.audit(), /Mismatch: key "rowMismatch" does not match row name "row1"/, 'Throws on mismatch');
  });

  QUnit.test('columnProxy get', function(assert) { 
    const html1 = createSampleRowHtml('row1', [{text: '10', data: '10'}]);
    const tr1 = htmlToElement(html1);
    const row1 = new TableRow(tr1);

    const html2 = createSampleRowHtml('row2', [{text: '20', data: '20'}]);
    const tr2 = htmlToElement(html2);
    const row2 = new TableRow(tr2);

    const collection = new RowCollection([row1, row2]);
    const col0 = collection.getColumnProxy(0);

    // Get
    assert.strictEqual(col0.row1.val(), 10, 'Get row1 value');
    assert.strictEqual(col0.row2.val(), 20, 'Get row2 value');
  })

  

});