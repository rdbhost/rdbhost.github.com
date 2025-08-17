// Test file for TableRowHandler using QUnit
// Assume this is run in a browser environment where QUnit is loaded via script,
// e.g., <script src="https://code.jquery.com/qunit/qunit-2.20.0.js"></script>
// Then load the TableRowHandler module and this test file with type="module".
// The HTML would have <div id="qunit"></div> and <div id="qunit-fixture"></div>.

// Import the class (adjust path as needed)
import { TableRowHandler } from '../table_row_handler.js';

QUnit.module('TableRowHandler');

const sampleHTML = `
  <tr>
    <td>drag handle</td>
    <td>initial description</td>
    <td>initial name</td>
    <td>formula</td>
    <td>initial result</td>
    <td>add-results-column</td>
    <td>initial unit</td>
    <td>close button</td>
  </tr>
`;

const extraResultsHTML = `
  <tr>
    <td>drag handle</td>
    <td>initial description</td>
    <td>initial name</td>
    <td>formula</td>
    <td>initial result 1</td>
    <td>initial result 2</td>
    <td>add-results-column</td>
    <td>initial unit</td>
    <td>close button</td>
  </tr>
`;

QUnit.test('constructor creates instance with valid HTML and at least 8 cells', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.ok(handler instanceof TableRowHandler, 'Instance created');
  assert.strictEqual(handler.cells.length, 8, '8 cells');
});

QUnit.test('constructor throws error if no <tr> element', assert => {
  const invalidHTML = '<div>invalid</div>';
  assert.throws(() => new TableRowHandler(invalidHTML), new Error('Invalid HTML segment: No <tr> element found.'), 'Throws error');
});

QUnit.test('constructor throws error if fewer than 8 cells', assert => {
  const shortHTML = `
    <tr>
      <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td>
    </tr>
  `;
  assert.throws(() => new TableRowHandler(shortHTML), new Error('Table row must have at least 8 cells.'), 'Throws error');
});

QUnit.test('constructor throws error if name is blank', assert => {
  const blankNameHTML = `
    <tr>
      <td>drag handle</td>
      <td>description</td>
      <td> </td>
      <td>formula</td>
      <td>result</td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `;
  assert.throws(() => new TableRowHandler(blankNameHTML), new Error('Name cannot be blank or undefined.'), 'Throws error');
});

QUnit.test('description gets and sets correctly', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.strictEqual(handler.description(), 'initial description', 'Gets initial');
  handler.description('new description');
  assert.strictEqual(handler.description(), 'new description', 'Sets and gets new');
});

QUnit.test('name gets and sets correctly', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.strictEqual(handler.name(), 'initial name', 'Gets initial');
  handler.name('new name');
  assert.strictEqual(handler.name(), 'new name', 'Sets and gets new');
});

QUnit.test('unit gets and sets correctly', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.strictEqual(handler.unit(), 'initial unit', 'Gets initial');
  handler.unit('new unit');
  assert.strictEqual(handler.unit(), 'new unit', 'Sets and gets new');
});

QUnit.test('result gets and sets for column 0', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.strictEqual(handler.result(0), 'initial result', 'Gets initial');
  handler.result(0, 'new result');
  assert.strictEqual(handler.result(0), 'new result', 'Sets and gets new');
});

QUnit.test('result throws for negative column', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.throws(() => handler.result(-1), new Error('Column must be a non-negative number.'), 'Throws error');
});

QUnit.test('result throws for non-number column', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.throws(() => handler.result('invalid'), new Error('Column must be a non-negative number.'), 'Throws error');
});

QUnit.test('result throws for column exceeding max in 8-cell row', assert => {
  const handler = new TableRowHandler(sampleHTML);
  assert.throws(() => handler.result(1), new Error('Invalid result column: Maximum is 0.'), 'Throws error');
});

QUnit.test('result with extra results', assert => {
  const handler = new TableRowHandler(extraResultsHTML);
  assert.strictEqual(handler.cells.length, 9, '9 cells');
  assert.strictEqual(handler.result(0), 'initial result 1', 'Column 0');
  assert.strictEqual(handler.result(1), 'initial result 2', 'Column 1');
  assert.throws(() => handler.result(2), new Error('Invalid result column: Maximum is 1.'), 'Throws for exceeding max');
});

QUnit.test('update replaces the row', assert => {
  const handler = new TableRowHandler(sampleHTML);
  const newHTML = `
    <tr>
      <td>new drag</td>
      <td>new desc</td>
      <td>new name</td>
      <td>new formula</td>
      <td>new result</td>
      <td>new add</td>
      <td>new unit</td>
      <td>new close</td>
    </tr>
  `;
  handler.update(newHTML);
  assert.strictEqual(handler.description(), 'new desc', 'Updated description');
  assert.strictEqual(handler.name(), 'new name', 'Updated name');
  assert.strictEqual(handler.result(0), 'new result', 'Updated result');
  assert.strictEqual(handler.unit(), 'new unit', 'Updated unit');
});

QUnit.test('update throws if invalid new HTML', assert => {
  const handler = new TableRowHandler(sampleHTML);
  const invalidNewHTML = '<div>invalid</div>';
  assert.throws(() => handler.update(invalidNewHTML), new Error('Invalid HTML segment: No <tr> element found.'), 'Throws error');
});