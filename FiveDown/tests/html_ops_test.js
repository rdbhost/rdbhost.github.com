// html_ops_test.js
// Test file for html_ops using QUnit
// Assume this is run in a browser environment where QUnit is loaded via script.

// Import the functions (adjust path as needed, assuming html_ops.js is in the parent directory)
import { validateRowHtml, addColumnToRow, moveColumnInRow, removeColumnFromRow } from '../html_ops.js';

QUnit.module('html_ops');

const validMinimalHTML = `
  <tr>
    <td>drag</td>
    <td>desc</td>
    <td>name</td>
    <td>formula</td>
    <td>result1</td>
    <td>add-results</td>
    <td>unit</td>
    <td>close</td>
  </tr>
`;

const validExtraHTML = `
  <tr>
    <td>drag</td>
    <td>desc</td>
    <td>name</td>
    <td>formula</td>
    <td>result1</td>
    <td>result2</td>
    <td>result3</td>
    <td>add-results</td>
    <td>unit</td>
    <td>close</td>
  </tr>
`;

const invalidNoTr = '<div>invalid</div>';

const invalidFewerCells = `
  <tr>
    <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td>
  </tr>
`;

const invalidBlankName = `
  <tr>
    <td>drag</td>
    <td>desc</td>
    <td> </td>
    <td>formula</td>
    <td>result</td>
    <td>add-results</td>
    <td>unit</td>
    <td>close</td>
  </tr>
`;

QUnit.test('validateRowHtml returns true for valid minimal HTML', assert => {
  assert.true(validateRowHtml(validMinimalHTML));
});

QUnit.test('validateRowHtml returns true for valid extra HTML', assert => {
  assert.true(validateRowHtml(validExtraHTML));
});

QUnit.test('validateRowHtml returns false for no <tr>', assert => {
  assert.false(validateRowHtml(invalidNoTr));
});

QUnit.test('validateRowHtml returns false for fewer cells', assert => {
  assert.false(validateRowHtml(invalidFewerCells));
});

QUnit.test('validateRowHtml returns false for blank name', assert => {
  assert.false(validateRowHtml(invalidBlankName));
});

QUnit.test('validateRowHtml returns true for blank name when ignored', assert => {
  assert.true(validateRowHtml(invalidBlankName, true));
});


QUnit.test('addColumnToRow adds column before add-results in minimal row', assert => {
  const result = addColumnToRow(validMinimalHTML);
  const expected = `
    <tr>
      <td>drag</td>
      <td>desc</td>
      <td>name</td>
      <td>formula</td>
      <td>result1</td>
      <td></td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `.replace(/\s+/g, ''); // Normalize whitespace
  assert.strictEqual(result.replace(/\s+/g, ''), expected);
});

QUnit.test('addColumnToRow adds column before add-results in extra row', assert => {
  const result = addColumnToRow(validExtraHTML);
  const expected = `
    <tr>
      <td>drag</td>
      <td>desc</td>
      <td>name</td>
      <td>formula</td>
      <td>result1</td>
      <td>result2</td>
      <td>result3</td>
      <td></td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `.replace(/\s+/g, '');
  assert.strictEqual(result.replace(/\s+/g, ''), expected);
});

QUnit.test('addColumnToRow throws for invalid HTML', assert => {
  assert.throws(() => addColumnToRow(invalidFewerCells), new Error('Invalid row HTML'));
});

QUnit.test('moveColumnInRow moves result column within range', assert => {
  // Move result index 1 (result2) to position 0 (before result1)
  const result = moveColumnInRow(validExtraHTML, 1, 0);
  const expected = `
    <tr>
      <td>drag</td>
      <td>desc</td>
      <td>name</td>
      <td>formula</td>
      <td>result2</td>
      <td>result1</td>
      <td>result3</td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `.replace(/\s+/g, '');
  assert.strictEqual(result.replace(/\s+/g, ''), expected);
});

QUnit.test('moveColumnInRow moves to end of results', assert => {
  // Move result index 0 (result1) to position 3 (end)
  const result = moveColumnInRow(validExtraHTML, 0, 3);
  const expected = `
    <tr>
      <td>drag</td>
      <td>desc</td>
      <td>name</td>
      <td>formula</td>
      <td>result2</td>
      <td>result3</td>
      <td>result1</td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `.replace(/\s+/g, '');
  assert.strictEqual(result.replace(/\s+/g, ''), expected);
});

QUnit.test('moveColumnInRow throws for invalid indices', assert => {
  assert.throws(() => moveColumnInRow(validExtraHTML, -1, 0), new Error('Invalid results indices'));
  assert.throws(() => moveColumnInRow(validExtraHTML, 3, 0), new Error('Invalid results indices')); // Out of range from
  assert.throws(() => moveColumnInRow(validExtraHTML, 0, 4), new Error('Invalid results indices')); // Out of range to
});

QUnit.test('moveColumnInRow throws for invalid HTML', assert => {
  assert.throws(() => moveColumnInRow(invalidFewerCells, 0, 1), new Error('Invalid row HTML'));
});

QUnit.test('removeColumnFromRow removes result column in extra row', assert => {
  // Remove result index 1 (result2)
  const result = removeColumnFromRow(validExtraHTML, 1);
  const expected = `
    <tr>
      <td>drag</td>
      <td>desc</td>
      <td>name</td>
      <td>formula</td>
      <td>result1</td>
      <td>result3</td>
      <td>add-results</td>
      <td>unit</td>
      <td>close</td>
    </tr>
  `.replace(/\s+/g, '');
  assert.strictEqual(result.replace(/\s+/g, ''), expected);
});

QUnit.test('removeColumnFromRow throws for minimal row', assert => {
  assert.throws(() => removeColumnFromRow(validMinimalHTML, 0), new Error('Cannot remove column: Row at minimum cells'));
});

QUnit.test('removeColumnFromRow throws for invalid index', assert => {
  assert.throws(() => removeColumnFromRow(validExtraHTML, -1), new Error('Invalid result index'));
  assert.throws(() => removeColumnFromRow(validExtraHTML, 3), new Error('Invalid result index')); // Out of range
});

QUnit.test('removeColumnFromRow throws for invalid HTML', assert => {
  assert.throws(() => removeColumnFromRow(invalidFewerCells, 0), new Error('Invalid row HTML'));
});