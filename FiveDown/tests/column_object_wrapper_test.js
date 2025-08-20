// tests/column_object_wrapper_test.js
// Test file for ColumnObjectWrapper using QUnit
// Assume this is run in a browser environment where QUnit is loaded via script.

// Import the classes (adjust path as needed, assuming row_collection.js is in the parent directory and exports the classes)
import { TableRow } from '../js/table_row_handler.js';
import { RowCollection, ColumnObjectWrapper } from '../js/row_collection.js';

QUnit.module('ColumnObjectWrapper');

const sampleRowHTML1 = `
  <tr>
    <td>drag handle</td>
    <td>desc1</td>
    <td>name1</td>
    <td>formula1</td>
    <td>result1</td>
    <td>add-results</td>
    <td>unit1</td>
    <td>close</td>
  </tr>
`;

const sampleRowHTML2 = `
  <tr>
    <td>drag handle</td>
    <td>desc2</td>
    <td>name2</td>
    <td>formula2</td>
    <td>result2</td>
    <td>add-results</td>
    <td>unit2</td>
    <td>close</td>
  </tr>
`;

const extraResultsHTML = `
  <tr>
    <td>drag handle</td>
    <td>desc3</td>
    <td>name3</td>
    <td>formula3</td>
    <td>result3a</td>
    <td>result3b</td>
    <td>add-results</td>
    <td>unit3</td>
    <td>close</td>
  </tr>
`;

QUnit.test('constructor with valid RowCollection and columnIndex', assert => {
  const row1 = new TableRow(sampleRowHTML1);
  const collection = new RowCollection([row1]);
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.ok(wrapper instanceof ColumnObjectWrapper, 'Instance created (proxied)');
});

QUnit.test('constructor throws if not RowCollection', assert => {
  assert.throws(() => new ColumnObjectWrapper({}, 0), new Error('Constructor requires a RowCollection instance.'), 'Throws error');
});

QUnit.test('constructor throws if invalid columnIndex', assert => {
  const collection = new RowCollection();
  assert.throws(() => new ColumnObjectWrapper(collection, -1), new Error('Column index must be a non-negative number.'), 'Throws for negative');
  assert.throws(() => new ColumnObjectWrapper(collection, 'invalid'), new Error('Column index must be a non-negative number.'), 'Throws for non-number');
});

QUnit.test('get result by row name', assert => {
  const row1 = new TableRow(sampleRowHTML1);
  const row2 = new TableRow(sampleRowHTML2);
  const collection = new RowCollection([row1, row2]);
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.strictEqual(wrapper.name1, 'result1', 'Gets result for name1');
  assert.strictEqual(wrapper.name2, 'result2', 'Gets result for name2');
});

QUnit.test('get throws if row not found', assert => {
  const collection = new RowCollection();
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.throws(() => wrapper.nonexistent, new Error('Row with name "nonexistent" not found.'), 'Throws error');
});

QUnit.test('set result by row name', assert => {
  const row1 = new TableRow(sampleRowHTML1);
  const collection = new RowCollection([row1]);
  const wrapper = new ColumnObjectWrapper(collection, 0);
  wrapper.name1 = 'new result';
  assert.strictEqual(wrapper.name1, 'new result', 'Sets and gets new result');
  assert.strictEqual(row1.result(0), 'new result', 'Updated in underlying row');
});

QUnit.test('set throws if row not found', assert => {
  const collection = new RowCollection();
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.throws(() => { wrapper.nonexistent = 'value'; }, new Error('Row with name "nonexistent" not found.'), 'Throws error');
});

QUnit.test('cannot set built-in properties', assert => {
  const collection = new RowCollection();
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.throws(() => { wrapper.rowCollection = 'invalid'; }, new Error('Cannot set built-in properties of ColumnObjectWrapper.'), 'Throws error');
});

QUnit.test('get built-in properties', assert => {
  const collection = new RowCollection();
  const wrapper = new ColumnObjectWrapper(collection, 0);
  assert.strictEqual(wrapper.columnIndex, 0, 'Gets columnIndex');
  assert.strictEqual(wrapper.rowCollection, collection, 'Gets rowCollection');
});

QUnit.test('works with different columnIndex', assert => {
  const row = new TableRow(extraResultsHTML);
  const collection = new RowCollection([row]);
  const wrapper = new ColumnObjectWrapper(collection, 1);
  assert.strictEqual(wrapper.name3, 'result3b', 'Gets result for column 1');
  wrapper.name3 = 'new result b';
  assert.strictEqual(wrapper.name3, 'new result b', 'Sets and gets new');
});

QUnit.test('result access respects row\'s max column', assert => {
  const row = new TableRow(extraResultsHTML);
  const collection = new RowCollection([row]);
  const wrapper = new ColumnObjectWrapper(collection, 2);
  assert.throws(() => wrapper.name3, new Error('Invalid result column: Maximum is 1.'), 'Throws from underlying row.result');
});