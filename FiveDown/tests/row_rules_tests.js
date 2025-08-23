// tests.js

// Paste the enforceRowRules function here for testing
function enforceRowRules(row) {
  const formulaTd = row.querySelector('.formula');
  const formulaData = formulaTd.getAttribute('data-value');
  const formulaText = formulaTd.textContent.trim();
  const isFormulaNonBlank = (formulaData !== null && formulaData.trim() !== '') || formulaText !== '';
  const resultTds = row.querySelectorAll('.result');
  const isAnyResultNonBlank = Array.from(resultTds).some(td => {
    const tdData = td.getAttribute('data-value');
    const tdText = td.textContent.trim();
    return (tdData !== null && tdData.trim() !== '') || tdText !== '';
  });

  if (isFormulaNonBlank) {
    resultTds.forEach(td => {
      td.contentEditable = 'false';
      td.tabIndex = -1;
      td.classList.add('readonly', 'output');
      td.classList.remove('input');
    });
    formulaTd.contentEditable = 'true';
    formulaTd.tabIndex = 0;
    formulaTd.classList.remove('readonly');
  } else {
    resultTds.forEach(td => {
      td.contentEditable = 'true';
      td.tabIndex = 0;
      td.classList.remove('readonly', 'output');
      td.classList.add('input');
    });
    if (isAnyResultNonBlank) {
      formulaTd.contentEditable = 'false';
      formulaTd.tabIndex = -1;
      formulaTd.classList.add('readonly');
    } else {
      formulaTd.contentEditable = 'true';
      formulaTd.tabIndex = 0;
      formulaTd.classList.remove('readonly');
    }
  }
}

function createTestRow(formulaText, formulaEditable, resultText, resultEditable) {
  const row = document.createElement('tr');
  const formula = document.createElement('td');
  formula.classList.add('formula');
  formula.textContent = formulaText;
  formula.contentEditable = formulaEditable ? 'true' : 'false';
  formula.tabIndex = formulaEditable ? 0 : -1;
  row.appendChild(formula);
  const result = document.createElement('td');
  result.classList.add('result');
  result.textContent = resultText;
  result.contentEditable = resultEditable ? 'true' : 'false';
  result.tabIndex = resultEditable ? 0 : -1;
  row.appendChild(result);
  return row;
}

QUnit.module('enforceRowRules');

QUnit.test('initial: formula b e, result b e -> expected: formula b e, result b e', function(assert) {
  const row = createTestRow('', true, '', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b e, result b n -> expected: formula b e, result b e', function(assert) {
  const row = createTestRow('', true, '', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b n, result b e -> expected: formula b e, result b e', function(assert) {
  const row = createTestRow('', false, '', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b n, result b n -> expected: formula b e, result b e', function(assert) {
  const row = createTestRow('', false, '', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula d e, result b e -> expected: formula d e, result b n', function(assert) {
  const row = createTestRow('a + b', true, '', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d e, result d e -> expected: formula d e, result d n', function(assert) {
  const row = createTestRow('a + b', true, '42', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d n, result b e -> expected: formula d e, result b n', function(assert) {
  const row = createTestRow('a + b', false, '', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d n, result d e -> expected: formula d e, result d n', function(assert) {
  const row = createTestRow('a + b', false, '42', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula b e, result d e -> expected: formula b n, result d e', function(assert) {
  const row = createTestRow('', true, '42', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'false', 'Formula is noneditable');
  assert.equal(formula.tabIndex, -1, 'Formula tabIndex is -1');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b e, result d n -> expected: formula b n, result d e', function(assert) {
  const row = createTestRow('', true, '42', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'false', 'Formula is noneditable');
  assert.equal(formula.tabIndex, -1, 'Formula tabIndex is -1');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b n, result d e -> expected: formula b n, result d e', function(assert) {
  const row = createTestRow('', false, '42', true);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'false', 'Formula is noneditable');
  assert.equal(formula.tabIndex, -1, 'Formula tabIndex is -1');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula b n, result d n -> expected: formula b n, result d e', function(assert) {
  const row = createTestRow('', false, '42', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'false', 'Formula is noneditable');
  assert.equal(formula.tabIndex, -1, 'Formula tabIndex is -1');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'true', 'Result is editable');
  assert.equal(result.tabIndex, 0, 'Result tabIndex is 0');
});

QUnit.test('initial: formula d e, result b n -> expected: formula d e, result b n', function(assert) {
  const row = createTestRow('a + b', true, '', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d e, result d n -> expected: formula d e, result d n', function(assert) {
  const row = createTestRow('a + b', true, '42', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d n, result b n -> expected: formula d e, result b n', function(assert) {
  const row = createTestRow('a + b', false, '', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.equal(result.textContent.trim(), '', 'Result is blank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('initial: formula d n, result d n -> expected: formula d e, result d n', function(assert) {
  const row = createTestRow('a + b', false, '42', false);

  enforceRowRules(row);
  const formula = row.querySelector('.formula');
  const result = row.querySelector('.result');

  assert.notEqual(formula.textContent.trim(), '', 'Formula is nonblank');
  assert.equal(formula.contentEditable, 'true', 'Formula is editable');
  assert.equal(formula.tabIndex, 0, 'Formula tabIndex is 0');
  assert.notEqual(result.textContent.trim(), '', 'Result is nonblank');
  assert.equal(result.contentEditable, 'false', 'Result is noneditable');
  assert.equal(result.tabIndex, -1, 'Result tabIndex is -1');
});

QUnit.test('multiple results, mixed blank and non-blank', function(assert) {
  const row = document.createElement('tr');
  const formula = document.createElement('td');
  formula.classList.add('formula');
  formula.textContent = '';
  row.appendChild(formula);
  const result1 = document.createElement('td');
  result1.classList.add('result');
  result1.textContent = '';
  row.appendChild(result1);
  const result2 = document.createElement('td');
  result2.classList.add('result');
  result2.textContent = '42';
  row.appendChild(result2);

  enforceRowRules(row);

  assert.equal(formula.textContent.trim(), '', 'Formula is blank');
  assert.equal(formula.contentEditable, 'false', 'Formula is not editable');
  assert.equal(formula.tabIndex, -1, 'Formula tabIndex is -1');
  assert.equal(result1.textContent.trim(), '', 'Result1 is blank');
  assert.equal(result1.contentEditable, 'true', 'Result1 is editable');
  assert.equal(result1.tabIndex, 0, 'Result1 tabIndex is 0');
  assert.notEqual(result2.textContent.trim(), '', 'Result2 is nonblank');
  assert.equal(result2.contentEditable, 'true', 'Result2 is editable');
  assert.equal(result2.tabIndex, 0, 'Result2 tabIndex is 0');
});