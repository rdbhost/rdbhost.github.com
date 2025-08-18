// tests/row_collection_test.js
// Test file for RowCollection using QUnit
// Assume this is run in a browser environment where QUnit is loaded via script.

// Import the classes (adjust path as needed, assuming row_collection.js is in the parent directory and exports both classes)
import { TableRowHandler} from '../js/table_row_handler.js';
import { RowCollection } from '../js/row_collection.js';

QUnit.module('RowCollection');

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

const duplicateNameHTML = `
  <tr>
    <td>drag handle</td>
    <td>desc</td>
    <td>name1</td>
    <td>formula</td>
    <td>result</td>
    <td>add-results</td>
    <td>unit</td>
    <td>close</td>
  </tr>
`;

const blankNameHTML = `
  <tr>
    <td>drag handle</td>
    <td>desc</td>
    <td> </td>
    <td>formula</td>
    <td>result</td>
    <td>add-results</td>
    <td>unit</td>
    <td>close</td>
  </tr>
`;

QUnit.test('constructor with empty array', assert => {
  const collection = new RowCollection();
  assert.ok(collection instanceof RowCollection, 'Instance created');
  assert.strictEqual(collection.rowMap.size, 0, 'Empty map');
});

QUnit.test('constructor with valid array', assert => {
  const row1 = new TableRowHandler(sampleRowHTML1);
  const row2 = new TableRowHandler(sampleRowHTML2);
  const collection = new RowCollection([row1, row2]);
  assert.strictEqual(collection.rowMap.size, 2, 'Two rows added');
  assert.strictEqual(collection.getRow('name1').name(), 'name1', 'Row1 by name');
  assert.strictEqual(collection.getRow('name2').name(), 'name2', 'Row2 by name');
});

QUnit.test('constructor throws if not array', assert => {
  assert.throws(() => new RowCollection('invalid'), new Error('Constructor requires an array of TableRowHandler instances.'), 'Throws error');
});

QUnit.test('constructor throws if items not TableRowHandler', assert => {
  assert.throws(() => new RowCollection([{}]), new Error('addRow requires a TableRowHandler instance.'), 'Throws error');
});

QUnit.test('constructor throws on duplicate names', assert => {
  const row1 = new TableRowHandler(sampleRowHTML1);
  const duplicateRow = new TableRowHandler(duplicateNameHTML);
  assert.throws(() => new RowCollection([row1, duplicateRow]), new Error('Row with name "name1" already exists. Names must be unique.'), 'Throws error');
});

QUnit.test('addRow adds valid row', assert => {
  const collection = new RowCollection();
  const row = new TableRowHandler(sampleRowHTML1);
  collection.addRow(row);
  assert.strictEqual(collection.rowMap.size, 1, 'Row added');
  assert.strictEqual(collection.getRow('name1').name(), 'name1', 'Row by name');
});

QUnit.test('addRow throws if not TableRowHandler', assert => {
  const collection = new RowCollection();
  assert.throws(() => collection.addRow({}), new Error('addRow requires a TableRowHandler instance.'), 'Throws error');
});

//QUnit.test('addRow throws if blank name', assert => {
//  const collection = new RowCollection();
//  const blankRow = new TableRowHandler(blankNameHTML);
//  assert.throws(() => collection.addRow(blankRow), new Error('Cannot add row with blank or undefined name.'), 'Throws error');
//});

QUnit.test('addRow throws on duplicate name', assert => {
  const row1 = new TableRowHandler(sampleRowHTML1);
  const duplicateRow = new TableRowHandler(duplicateNameHTML);
  const collection = new RowCollection([row1]);
  assert.throws(() => collection.addRow(duplicateRow), new Error('Row with name "name1" already exists. Names must be unique.'), 'Throws error');
});

QUnit.test('removeRow removes existing row', assert => {
  const row1 = new TableRowHandler(sampleRowHTML1);
  const row2 = new TableRowHandler(sampleRowHTML2);
  const collection = new RowCollection([row1, row2]);
  collection.removeRow(row1);
  assert.strictEqual(collection.rowMap.size, 1, 'One row removed');
  assert.throws(() => collection.getRow('name1'), new Error('Row with name "name1" not found.'), 'Row1 removed');
  assert.strictEqual(collection.getRow('name2').name(), 'name2', 'Row2 remains');
});

QUnit.test('removeRow throws if not TableRowHandler', assert => {
  const collection = new RowCollection();
  assert.throws(() => collection.removeRow({}), new Error('removeRow requires a TableRowHandler instance.'), 'Throws error');
});

QUnit.test('removeRow throws if row not found', assert => {
  const row1 = new TableRowHandler(sampleRowHTML1);
  const row2 = new TableRowHandler(sampleRowHTML2);
  const collection = new RowCollection([row1]);
  assert.throws(() => collection.removeRow(row2), new Error('TableRowHandler not found in the collection.'), 'Throws error');
});

QUnit.test('getRow throws if not found', assert => {
  const collection = new RowCollection();
  assert.throws(() => collection.getRow('nonexistent'), new Error('Row with name "nonexistent" not found.'), 'Throws error');
});

QUnit.test('getRow handles trimmed names', assert => {
  const row = new TableRowHandler(sampleRowHTML1);
  const collection = new RowCollection([row]);
  assert.strictEqual(collection.getRow(' name1 ').name(), 'name1', 'Gets with trimmed name');
});