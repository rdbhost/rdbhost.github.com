// tests/column_object_wrapper_tests.js

import { RowCollection, ColumnObjectWrapper } from '../js/row_collection.js';
import { TableRow } from '../js/table_row.js';
import { Data } from '../js/dim_data.js';

QUnit.module('ColumnObjectWrapper Tests', function() {

  function htmlToElement(html) {
    const temp = document.createElement('table');
    temp.innerHTML = html.trim();
    return temp.querySelector('tr');
  }

  function createSampleRowHtml(name, resultValues = [{text: 'result1', data: '"result1"'}], unit = 'unit') {
    let results = resultValues.map(({text, data}) => `<td class="result" data-value=${data}>${text}</td>`).join('');
    return `
      <tr>
        <td class="handle">drag handle</td>
        <td class="description">desc</td>
        <td class="name">${name}</td>
        <td class="formula" data-value="formula">formula</td>
        ${results}
        <td class="add-result">add-results</td>
        <td class="unit">${unit}</td>
        <td class="delete">close</td>
      </tr>
    `;
  }

  function createExtraResultsRowHtml(name) {
    return createSampleRowHtml(name, [
      {text: 'result3a', data: '"result3a"'},
      {text: 'result3b', data: '"result3b"'}
    ]);
  }

  QUnit.test('constructor with valid RowCollection and columnIndex', function(assert) {
    const collection = new RowCollection();
    const wrapper = new ColumnObjectWrapper(collection, 0);
    assert.ok(wrapper, 'Instance created (proxied)');
  });

  QUnit.test('get result by row name', function(assert) {
    const html1 = createSampleRowHtml('name1');
    const tr1 = htmlToElement(html1);
    const row1 = new TableRow(tr1);

    const html2 = createSampleRowHtml('name2', [{text: 'result2', data: '"result2"'}]);
    const tr2 = htmlToElement(html2);
    const row2 = new TableRow(tr2);

    const collection = new RowCollection([row1, row2]);
    const wrapper = new ColumnObjectWrapper(collection, 0);
    assert.strictEqual(wrapper.name1.val(), 'result1', 'Gets result for name1');
    assert.strictEqual(wrapper.name2.val(), 'result2', 'Gets result for name2');
  });

  QUnit.test('get undefined if row not found', function(assert) {
    const collection = new RowCollection();
    const wrapper = new ColumnObjectWrapper(collection, 0);
    assert.strictEqual(wrapper.nonexistent, undefined, 'Undefined for missing row');
  });

  QUnit.test('set result by row name', function(assert) {
    const html = createSampleRowHtml('name1');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const collection = new RowCollection([row]);
    const wrapper = new ColumnObjectWrapper(collection, 0);
    const newData = new Data('new result', 'unit');
    wrapper.name1 = newData;
    assert.strictEqual(wrapper.name1.val(), 'new result', 'Sets and gets new result');
    assert.strictEqual(row.result(0).val(), 'new result', 'Updated in underlying row');
  });

  QUnit.test('set returns false if row not found', function(assert) {
    const collection = new RowCollection();
    const wrapper = new ColumnObjectWrapper(collection, 0);
    assert.throws(() => { wrapper.nonexistent = new Data('value'); },
      /trap returned falsish|Cannot set result/,  // Adjust regex for your error message
      'Throws for missing row');
    //const result = (wrapper.nonexistent = new Data('value'));
    //assert.false(result, 'Returns false for missing row');
  });

  QUnit.test('works with different columnIndex', function(assert) {
    const html = createExtraResultsRowHtml('name3');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const collection = new RowCollection([row]);
    const wrapper = new ColumnObjectWrapper(collection, 1);
    assert.strictEqual(wrapper.name3.val(), 'result3b', 'Gets result for column 1');
    const newData = new Data('new result b', 'unit');
    wrapper.name3 = newData;
    assert.strictEqual(wrapper.name3.val(), 'new result b', 'Sets and gets new');
  });

  QUnit.test('result access respects row max column', function(assert) {
    const html = createSampleRowHtml('name1');
    const tr = htmlToElement(html);
    const row = new TableRow(tr);

    const collection = new RowCollection([row]);
    const wrapper = new ColumnObjectWrapper(collection, 1);
    assert.throws(() => wrapper.name1, /Invalid result index/, 'Throws from underlying row.result');
  });

});