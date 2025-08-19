// tests/test_sheet_interface.js

QUnit.module('Sheet Interface', function(hooks) {
  let table;
  let pubsub;
  let rowCollection;

  hooks.beforeEach(function() {
    // Create mock pubsub
    pubsub = {
      publish: function() {}
    };

    // Mock rowCollection
    rowCollection = new Map();

    // Create table structure based on index.html snippet
    table = document.createElement('table');
    table.id = 'main-sheet';
    table.pubsub = pubsub;
    table.row_collection = rowCollection;

    // Header row
    const headerTr = document.createElement('tr');
    ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'].forEach(cls => {
      const th = document.createElement('th');
      th.classList.add(cls);
      if (cls === 'add-result') {
        const btn = document.createElement('button');
        btn.textContent = '+';
        th.appendChild(btn);
      } else if (cls === 'result') {
        th.textContent = 'Result';
      }
      headerTr.appendChild(th);
    });
    table.appendChild(headerTr);

    // Data row
    const dataTr = document.createElement('tr');
    const tds = {};
    ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'].forEach(cls => {
      const td = document.createElement('td');
      td.classList.add(cls);
      td.contentEditable = true;
      if (cls === 'delete') {
        const btn = document.createElement('button');
        btn.textContent = 'x';
        td.appendChild(btn);
      }
      dataTr.appendChild(td);
      tds[cls] = td;
    });
    table.appendChild(dataTr);

    // Attach to body for events
    document.body.appendChild(table);

    // Manually attach event listeners as in sheet-interface.js
    table.addEventListener('focusin', focusinHandler);
    table.addEventListener('focusout', focusoutHandler);
    table.addEventListener('click', clickHandler);
  });

  hooks.afterEach(function() {
    document.body.removeChild(table);
    table = null;
  });

  // Define handlers as in the script
  function focusinHandler(e) {
    const td = e.target;
    if (td.tagName !== 'TD') return;

    if (td.classList.contains('formula') || td.classList.contains('result')) {
      if (td.hasAttribute('data-value')) {
        td.textContent = td.getAttribute('data-value');
      }
    }
  }

  function focusoutHandler(e) {
    const td = e.target;
    if (td.tagName !== 'TD') return;

    if (td.classList.contains('formula')) {
      const newRaw = td.textContent.trim();
      const oldRaw = td.getAttribute('data-value') || '';
      td.setAttribute('data-value', newRaw);
      const formatted = newRaw.replace(/@/g, '⋅').replace(/\*/g, '×');
      td.textContent = formatted;
      if (newRaw !== oldRaw) {
        pubsub.publish('recalculation', 'go');
      }
      if (newRaw !== '') {
        const tr = td.closest('tr');
        const resultTds = tr.querySelectorAll('td.result');
        for (let rtd of resultTds) {
          rtd.classList.add('readonly', 'output');
          rtd.contentEditable = false;
        }
      }
    } else if (td.classList.contains('result')) {
      const newRaw = td.textContent.trim();
      const oldRaw = td.getAttribute('data-value') || '';
      td.setAttribute('data-value', newRaw);
      const value = parseValue(newRaw);
      const formatted = formattedString(value);
      td.textContent = formatted;
      if (newRaw !== oldRaw) {
        pubsub.publish('recalc', 'go');
        const tr = td.closest('tr');
        const formulaTd = tr.querySelector('td.formula');
        formulaTd.textContent = '';
        formulaTd.contentEditable = false;
        const resultTds = tr.querySelectorAll('td.result');
        for (let rtd of resultTds) {
          rtd.contentEditable = true;
          rtd.classList.add('input');
          rtd.classList.remove('readonly', 'output');
        }
      }
    }
  }

  function clickHandler(e) {
    const target = e.target;

    if (target.tagName === 'BUTTON' && target.closest('th.add-result')) {
      const headerTr = table.querySelector('tr:first-child');
      const addResultTh = headerTr.querySelector('th.add-result');
      const position = Array.from(headerTr.children).indexOf(addResultTh);

      const currentResults = headerTr.querySelectorAll('th.result').length;

      const allTrs = table.querySelectorAll('tr');
      for (let tr of allTrs) {
        const isHeader = tr === headerTr;
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.classList.add('result');
        if (isHeader) {
          newCell.textContent = `Result ${currentResults}`;
        } else {
          newCell.contentEditable = true;
        }
        tr.insertBefore(newCell, tr.children[position]);
      }

      if (currentResults === 1) {
        const firstResultTh = headerTr.querySelector('th.result');
        if (firstResultTh) {
          firstResultTh.textContent = 'Result 0';
        }
      }
      return;
    }

    if (target.tagName === 'BUTTON' && target.closest('td.delete')) {
      const tr = target.closest('tr');
      const nameTd = tr.querySelector('td.name');
      const name = nameTd ? nameTd.textContent.trim() : '';
      tr.remove();
      if (table.row_collection && name) {
        table.row_collection.delete(name);
      }
      pubsub.publish('recalculation', 'go');
    }
  }

  // Formatting functions
  function formattedString(v) {
    if (typeof v === 'number') {
      if (Math.abs(v) < 0.01) return v.toExponential(3);
      else return v.toFixed(3);
    } else if (Array.isArray(v)) {
      return `[${v.map(x => {
        if (typeof x !== 'number') return x.toString();
        if (Math.abs(x) < 0.01) return x.toExponential(3);
        else return x.toFixed(3);
      }).join(', ')}]`;
    } else return String(v);
  }

  function parseValue(str) {
    if (str.startsWith('[') && str.endsWith(']'))
      return str.slice(1, -1).split(',').map(x => parseFloat(x.trim()));
    else if (str === 'true') return true;
    else if (str === 'false') return false;
    else if (!isNaN(parseFloat(str))) {
      const num = parseFloat(str);
      return Number.isInteger(num) ? Math.floor(num) : num;
    } else return str;
  }

  QUnit.test('formula focusin replaces with data-value', function(assert) {
    const formulaTd = table.querySelector('td.formula');
    formulaTd.setAttribute('data-value', 'a@b');
    formulaTd.textContent = 'a⋅b';

    formulaTd.focus();

    assert.strictEqual(formulaTd.textContent, 'a@b');
  });

  QUnit.test('formula focusout formats and publishes if changed', function(assert) {
    const formulaTd = table.querySelector('td.formula');
    let publishTopic, publishMsg;
    pubsub.publish = (topic, msg) => {
      publishTopic = topic;
      publishMsg = msg;
    };

    formulaTd.textContent = 'a@b*c';
    formulaTd.focus();
    formulaTd.blur();

    assert.strictEqual(formulaTd.getAttribute('data-value'), 'a@b*c');
    assert.strictEqual(formulaTd.textContent, 'a⋅b×c');
    assert.strictEqual(publishTopic, 'recalculation');
    assert.strictEqual(publishMsg, 'go');

    // Set results readonly
    const resultTd = table.querySelector('td.result');
    assert.true(resultTd.classList.contains('readonly'));
    assert.true(resultTd.classList.contains('output'));
    assert.strictEqual(resultTd.contentEditable, 'false');
  });

  QUnit.test('result focusin replaces with data-value', function(assert) {
    const resultTd = table.querySelector('td.result');
    resultTd.setAttribute('data-value', '1.23456');
    resultTd.textContent = '1.235';

    resultTd.focus();

    assert.strictEqual(resultTd.textContent, '1.23456');
  });

  QUnit.test('result focusout formats and publishes if changed', function(assert) {
    const resultTd = table.querySelector('td.result');
    let publishTopic, publishMsg;
    pubsub.publish = (topic, msg) => {
      publishTopic = topic;
      publishMsg = msg;
    };

    resultTd.textContent = '3.14159';
    resultTd.focus();
    resultTd.blur();

    assert.strictEqual(resultTd.getAttribute('data-value'), '3.14159');
    assert.strictEqual(resultTd.textContent, '3.142');
    assert.strictEqual(publishTopic, 'recalc');
    assert.strictEqual(publishMsg, 'go');

    // Clear formula
    const formulaTd = table.querySelector('td.formula');
    assert.strictEqual(formulaTd.textContent, '');
    assert.strictEqual(formulaTd.contentEditable, 'false');

    // Set results input
    assert.true(resultTd.classList.contains('input'));
    assert.strictEqual(resultTd.contentEditable, 'true');
    assert.false(resultTd.classList.contains('readonly'));
    assert.false(resultTd.classList.contains('output'));
  });

  QUnit.test('add-result click adds column and labels headers', function(assert) {
    const addButton = table.querySelector('th.add-result button');

    // Initial: 1 result
    assert.strictEqual(table.querySelectorAll('th.result').length, 1);
    assert.strictEqual(table.querySelector('th.result').textContent, 'Result');

    addButton.click();

    // Now 2 results
    const resultThs = table.querySelectorAll('th.result');
    assert.strictEqual(resultThs.length, 2);
    assert.strictEqual(resultThs[0].textContent, 'Result 0');
    assert.strictEqual(resultThs[1].textContent, 'Result 1');

    // Add another
    addButton.click();
    const newResultThs = table.querySelectorAll('th.result');
    assert.strictEqual(newResultThs.length, 3);
    assert.strictEqual(newResultThs[0].textContent, 'Result 0');
    assert.strictEqual(newResultThs[1].textContent, 'Result 1');
    assert.strictEqual(newResultThs[2].textContent, 'Result 2');

    // Check data rows have new td.result contenteditable
    const dataTr = table.querySelector('tr:nth-child(2)');
    const newTd = dataTr.querySelectorAll('td.result')[2];
    assert.strictEqual(newTd.contentEditable, 'true');
  });

  QUnit.test('delete click removes row and publishes', function(assert) {
    const deleteButton = table.querySelector('td.delete button');
    const nameTd = table.querySelector('td.name');
    nameTd.textContent = 'testName';
    rowCollection.set('testName', {});

    let publishTopic, publishMsg;
    pubsub.publish = (topic, msg) => {
      publishTopic = topic;
      publishMsg = msg;
    };

    deleteButton.click();

    assert.strictEqual(table.querySelectorAll('tr').length, 1); // Only header left
    assert.false(rowCollection.has('testName'));
    assert.strictEqual(publishTopic, 'recalculation');
    assert.strictEqual(publishMsg, 'go');
  });

  QUnit.test('dynamically added row has handlers', function(assert) {
    // Add new row dynamically
    const newTr = document.createElement('tr');
    const newFormulaTd = document.createElement('td');
    newFormulaTd.classList.add('formula');
    newFormulaTd.contentEditable = true;
    newTr.appendChild(newFormulaTd); // Simplified
    const newResultTd = document.createElement('td');
    newResultTd.classList.add('result');
    newResultTd.contentEditable = true;
    newTr.appendChild(newResultTd);
    table.appendChild(newTr);

    // Test formula on new row
    newFormulaTd.textContent = 'a@b';
    newFormulaTd.focus();
    newFormulaTd.blur();

    assert.strictEqual(newFormulaTd.textContent, 'a⋅b');
    assert.strictEqual(newFormulaTd.getAttribute('data-value'), 'a@b');
    assert.true(newResultTd.classList.contains('readonly'));
    assert.strictEqual(newResultTd.contentEditable, 'false');
  });
});