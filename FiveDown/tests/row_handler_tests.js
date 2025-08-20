
import { TableRow } from '../js/table_row.js';
import { Data } from '../js/dim_data.js'; // Adjust path if necessary

// tests/row_handler_tests.js
QUnit.module('TableRow', function() {
  function createSampleHtml(resultValues = ['5'], unit = 'unit') {
    let results = resultValues.map(val => `<td class="result">${val}</td>`).join('');
    return `
      <tr>
        <td class="handle">H</td>
        <td class="description">Desc</td>
        <td class="name">Name</td>
        <td class="formula">Form</td>
        ${results}
        <td class="add-result">Add</td>
        <td class="unit">${unit}</td>
        <td class="delete">Del</td>
      </tr>
    `;
  }

  QUnit.test('constructor validates minimal valid row', function(assert) {
    const html = createSampleHtml();
    const handler = new TableRow(html);
    assert.ok(handler.tr instanceof HTMLTableRowElement);
  });

  QUnit.test('constructor throws on too few columns', function(assert) {
    const invalidHtml = '<tr><td class="handle"></td><td class="description"></td></tr>';
    assert.throws(() => new TableRow(invalidHtml), /too few columns/);
  });

  QUnit.test('constructor throws on wrong class for fixed columns', function(assert) {
    let html = createSampleHtml().replace('class="name"', 'class="wrong"');
    assert.throws(() => new TableRow(html), /Column 3 does not have class "name"/);
  });

  QUnit.test('constructor throws on wrong class for end columns', function(assert) {
    let html = createSampleHtml().replace('class="unit"', 'class="wrong"');
    assert.throws(() => new TableRow(html), /does not have class "unit"/);
  });

  QUnit.test('constructor throws on non-result in results', function(assert) {
    let html = createSampleHtml(['5']).replace('class="result"', 'class="wrong"');
    assert.throws(() => new TableRow(html), /does not have class "result"/);
  });

  QUnit.test('constructor handles multiple results', function(assert) {
    const html = createSampleHtml(['5', '10']);
    const handler = new TableRow(html);
    assert.strictEqual(handler.resultTDs.length, 2);
  });

  QUnit.test('update replaces tr and revalidates', function(assert) {
    const originalHtml = createSampleHtml();
    const handler = new TableRow(originalHtml);
    const container = document.createElement('div');
    container.appendChild(handler.tr);

    const newHtml = createSampleHtml(['10']);
    handler.update(newHtml);

    assert.strictEqual(container.children[0], handler.tr);
    const resultData = handler.result(0);
    assert.strictEqual(resultData.val(), 10);
    assert.strictEqual(handler.unit(), 'unit');
  });

  QUnit.test('update throws on invalid new html', function(assert) {
    const handler = new TableRow(createSampleHtml());
    const invalidHtml = '<tr><td></td></tr>';
    assert.throws(() => handler.update(invalidHtml), /too few columns/);
  });

  QUnit.test('description getter', function(assert) {
    const handler = new TableRow(createSampleHtml());
    assert.strictEqual(handler.description(), 'Desc');
  });

  QUnit.test('name getter and setter', function(assert) {
    const handler = new TableRow(createSampleHtml());
    assert.strictEqual(handler.name(), 'Name');

    const old = handler.name('New Name');
    assert.strictEqual(old, 'Name');
    assert.strictEqual(handler.name(), 'New Name');

    assert.throws(() => handler.name(''), /Name cannot be blank/);
    assert.throws(() => handler.name('   '), /Name cannot be blank/);
    // assert.throws(() => handler.name(null), /Name cannot be blank/);
  });

  QUnit.test('formula getter', function(assert) {
    const handler = new TableRow(createSampleHtml());
    assert.strictEqual(handler.formula(), 'Form');
  });

  QUnit.test('unit getter', function(assert) {
    const handler = new TableRow(createSampleHtml());
    assert.strictEqual(handler.unit(), 'unit');
  });

  QUnit.test('result getter for different types', function(assert) {
    const htmlNum = createSampleHtml(['42']);
    const handlerNum = new TableRow(htmlNum);
    const dataNum = handlerNum.result(0);
    assert.strictEqual(dataNum.val(), 42);
    assert.strictEqual(dataNum.unit(), 'unit');
    assert.strictEqual(dataNum.type(), 'integer');

    const htmlFloat = createSampleHtml(['3.14']);
    const handlerFloat = new TableRow(htmlFloat);
    const dataFloat = handlerFloat.result(0);
    assert.strictEqual(dataFloat.val(), 3.14);
    assert.strictEqual(dataFloat.type(), 'float');

    const htmlVec = createSampleHtml(['[1, 2, 3]']);
    const handlerVec = new TableRow(htmlVec);
    const dataVec = handlerVec.result(0);
    assert.deepEqual(dataVec.val(), [1, 2, 3]);
    assert.strictEqual(dataVec.type(), 'vector');

    const htmlBool = createSampleHtml(['true']);
    const handlerBool = new TableRow(htmlBool);
    const dataBool = handlerBool.result(0);
    assert.strictEqual(dataBool.val(), true);
    assert.strictEqual(dataBool.type(), 'boolean');

    const htmlStr = createSampleHtml(['hello']);
    const handlerStr = new TableRow(htmlStr);
    const dataStr = handlerStr.result(0);
    assert.strictEqual(dataStr.val(), 'hello');
    assert.strictEqual(dataStr.type(), 'string');
  });

  QUnit.test('result setter invalid cases', function(assert) {
    const handler = new TableRow(createSampleHtml());
    assert.throws(() => handler.result(-1), /Invalid result index/);
    assert.throws(() => handler.result(1), /Invalid result index/);
    assert.throws(() => handler.result(0, {}), /newValue must be a Data instance/);
  });

  QUnit.test('result setter when unit empty', function(assert) {
    const html = createSampleHtml(['5'], '');
    const handler = new TableRow(html);
    assert.strictEqual(handler.unit(), '');

    const newData = new Data(100, 'cm');
    const oldData = handler.result(0, newData);
    assert.strictEqual(oldData.val(), 5);
    assert.strictEqual(oldData.unit(), '');
    assert.strictEqual(handler.result(0).val(), 100);
    assert.strictEqual(handler.unit(), 'cm');
    assert.false(handler.resultTDs[0].classList.contains('converted'));
  });

  QUnit.test('result setter when units match', function(assert) {
    const html = createSampleHtml(['5'], 'cm');
    const handler = new TableRow(html);

    const newData = new Data(100, 'cm');
    handler.result(0, newData);
    assert.strictEqual(handler.result(0).val(), 100);
    assert.strictEqual(handler.unit(), 'cm');
    assert.false(handler.resultTDs[0].classList.contains('converted'));
  });

  QUnit.test('result setter when units mismatch, converts', function(assert) {
    const html = createSampleHtml(['5'], 'm');
    const handler = new TableRow(html);

    const newData = new Data(100, 'cm');
    handler.result(0, newData);
    assert.strictEqual(handler.result(0).val(), 1);
    assert.strictEqual(handler.unit(), 'm');
    assert.true(handler.resultTDs[0].classList.contains('converted'));
  });

  QUnit.test('result setter throws on conversion failure', function(assert) {
    const html = createSampleHtml(['5'], 'kg');
    const handler = new TableRow(html);

    const newData = new Data(100, 'cm');
    assert.throws(() => handler.result(0, newData), /Unit conversion failed/);
  });

  QUnit.test('result setter for vector', function(assert) {
    const html = createSampleHtml(['[1,2]'], 'm');
    const handler = new TableRow(html);

    const newData = new Data([100, 200], 'cm');
    handler.result(0, newData);
    assert.deepEqual(handler.result(0).val(), [1, 2]);
    assert.strictEqual(handler.unit(), 'm');
    assert.true(handler.resultTDs[0].classList.contains('converted'));
  });

  QUnit.test('result setter for Error', function(assert) {
    const handler = new TableRow(createSampleHtml());
    const err = new Error('Test error');
    const oldData = handler.result(0, err);
    assert.strictEqual(oldData.val(), 5);
    assert.strictEqual(handler.resultTDs[0].textContent, 'Test error');
    assert.true(handler.resultTDs[0].classList.contains('error'));
    assert.false(handler.resultTDs[0].hasAttribute('data-value'));
    assert.false(handler.resultTDs[0].classList.contains('converted'));

    const current = handler.result(0);
    assert.ok(current instanceof Error);
    assert.strictEqual(current.message, 'Test error');
  });

  QUnit.test('result getter uses data-value if present', function(assert) {
    const handler = new TableRow(createSampleHtml());
    handler.resultTDs[0].textContent = '1.235';
    handler.resultTDs[0].setAttribute('data-value', '1.23456');

    const data = handler.result(0);
    assert.strictEqual(data.val(), 1.23456);
  });

  QUnit.test('result setter formats numbers correctly', function(assert) {
    const handler = new TableRow(createSampleHtml([''], ''));
    
    handler.result(0, new Data(1.23456, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '1.235');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '1.23456');
    assert.strictEqual(handler.result(0).val(), 1.23456);

    handler.result(0, new Data(0.001235, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '1.235e-3');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '0.001235');
    assert.strictEqual(handler.result(0).val(), 0.001235);

    handler.result(0, new Data(42, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '42.000');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '42');
    assert.strictEqual(handler.result(0).val(), 42);

    handler.result(0, new Data(0, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '0.000');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '0');
    assert.strictEqual(handler.result(0).val(), 0);

    handler.result(0, new Data(-0.00012345001, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '-1.235e-4');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '-0.00012345001');
    assert.strictEqual(handler.result(0).val(), -0.00012345001);
  });

  QUnit.test('result setter formats vectors correctly', function(assert) {
    const handler = new TableRow(createSampleHtml([''], ''));
    
    const vec = [1.23456, 0.001235, 42, 0];
    handler.result(0, new Data(vec, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, '[1.23, 1.23e-3, 42.00, 0.00]');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '[1.23456, 0.001235, 42, 0]');
    assert.deepEqual(handler.result(0).val(), vec);
  });

  QUnit.test('result setter for non-numeric types', function(assert) {
    const handler = new TableRow(createSampleHtml([''], ''));
    
    handler.result(0, new Data(true, ''));
    assert.strictEqual(handler.resultTDs[0].textContent, 'true');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), 'true');
    assert.strictEqual(handler.result(0).val(), true);

    handler.result(0, new Data('hello', ''));
    assert.strictEqual(handler.resultTDs[0].textContent, 'hello');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), 'hello');
    assert.strictEqual(handler.result(0).val(), 'hello');
  });

  QUnit.test('result setter switches from Error to Data and vice versa', function(assert) {
    const handler = new TableRow(createSampleHtml());
    
    handler.result(0, new Error('Error'));
    assert.true(handler.resultTDs[0].classList.contains('error'));
    assert.strictEqual(handler.resultTDs[0].textContent, 'Error');

    handler.result(0, new Data(10, 'unit'));
    assert.false(handler.resultTDs[0].classList.contains('error'));
    assert.strictEqual(handler.resultTDs[0].textContent, '10.000');
    assert.strictEqual(handler.resultTDs[0].getAttribute('data-value'), '10');

    handler.result(0, new Error('New Error'));
    assert.true(handler.resultTDs[0].classList.contains('error'));
    assert.strictEqual(handler.resultTDs[0].textContent, 'New Error');
    assert.false(handler.resultTDs[0].hasAttribute('data-value'));
  });
});