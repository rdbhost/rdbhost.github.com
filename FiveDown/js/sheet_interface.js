// js/sheet_interface.js

import { formatResult, formatFormula } from './dim_data.js'
import { RowCollection } from './row_collection.js';
import { TableRow } from './table_row.js';

/**
 * Checks if a table row is blank by examining the content of specific cells.
 * @param {HTMLTableRowElement} tr - The table row to check.
 * @returns {boolean} True if the row is blank, false otherwise.
 */
function isBlankRow(tr) {
  const descriptionTd = tr.querySelector('.description');
  const nameTd = tr.querySelector('.name');
  const formulaTd = tr.querySelector('.formula');
  const unitTd = tr.querySelector('.unit');
  const resultTds = tr.querySelectorAll('.result');
  if (descriptionTd.textContent.trim() !== '') return false;
  if (nameTd.textContent.trim() !== '') return false;
  if (formulaTd.textContent.trim() !== '') return false;
  if (unitTd.textContent.trim() !== '') return false;
  for (let td of resultTds) {
    if (td.textContent.trim() !== '') return false;
  }
  return true;
}

/**
 * Ensures that exactly the last five rows in the table are blank, adding or removing rows as necessary.
 * @param {HTMLTableElement} table - The table to adjust.
 */
function ensureBlankFive(table) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  let blankCount = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (isBlankRow(rows[i])) {
      blankCount++;
    } else {
      break;
    }
  }
  if (blankCount > 5) {
    for (let i = 0; i < blankCount - 5; i++) {
      tbody.removeChild(tbody.lastChild);
    }
  } else if (blankCount < 5) {
    for (let i = 0; i < 5 - blankCount; i++) {
      if (!table.blank_row) throw new Error('No blank row available');
      const newRow = table.blank_row.cloneNode(true);
      tbody.appendChild(newRow);
      enforceRowRules(newRow);
    }
  }
}

/**
 * Checks if a string represents a valid number.
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is a valid number, false otherwise.
 */
function isNumberString(str) {
  return /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(str);
}

/**
 * Checks if a string represents a boolean value.
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is 'true' or 'false' (case-insensitive), false otherwise.
 */
function isBooleanString(str) {
  str = str.toLowerCase();
  return str === 'true' || str === 'false';
}

/**
 * Enforces editing rules on a table row based on the content of formula and result cells.
 * @param {HTMLTableRowElement} row - The table row to enforce rules on.
 */
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

/**
 * Adds a new result column to the table, updating headers and rows accordingly.
 * @param {HTMLTableElement} table - The table to add the column to.
 */
function addResultColumn(table) {
  const theadRow = table.tHead.rows[0];
  const addTh = theadRow.querySelector('.add-result');
  const resultThs = theadRow.querySelectorAll('.result');
  let numResults = resultThs.length;
  let newN = numResults;

  if (numResults === 1 && resultThs[0].querySelector('span').textContent.trim() === 'Result') {
    resultThs[0].querySelector('span').textContent = 'Result 0';
  }

  if (numResults === 0) throw new Error('No result column to clone from');

  const templateTh = resultThs[0].cloneNode(true);
  templateTh.querySelector('span').textContent = 'Result ' + newN;
  theadRow.insertBefore(templateTh, addTh);

  const templateTd = table.blank_row.querySelector('.result').cloneNode(true);
  templateTd.textContent = '';
  templateTd.setAttribute('data-value', '');

  for (let row of table.tBodies[0].rows) {
    const addTd = row.querySelector('.add-result');
    const newTd = templateTd.cloneNode(true);
    row.insertBefore(newTd, addTd);
    enforceRowRules(row);
  }

  const blankAddTd = table.blank_row.querySelector('.add-result');
  const blankNewTd = templateTd.cloneNode(true);
  table.blank_row.insertBefore(blankNewTd, blankAddTd);
}

/**
 * Sets up the table interface, including event listeners and initial configuration.
 * @param {HTMLTableElement} table - The table to set up.
 */
function setupTableInterface(table) {
  let blankRow = null;
  for (let tr of table.tBodies[0].rows) {
    if (isBlankRow(tr)) {
      blankRow = tr.cloneNode(true);
      break;
    }
  }
  if (!blankRow) throw new Error('No blank row found');
  table.blank_row = blankRow;

  table.tBodies[0].innerHTML = '';

  ensureBlankFive(table);

  const tbody = table.tBodies[0];
  const thead = table.tHead;

  tbody.addEventListener('focusin', (e) => {
    if (e.target.tagName !== 'TD') return;
    const td = e.target;
    if (td.contentEditable !== 'true') return;
    const raw = td.getAttribute('data-value');
    if (raw !== null && (td.classList.contains('formula') || td.classList.contains('result'))) {
      td.textContent = raw;
    }
  });

  tbody.addEventListener('focusout', (e) => {
    if (e.target.tagName !== 'TD') return;
    const td = e.target;
    if (td.contentEditable !== 'true') return;
    const row = td.parentNode;
    const currentText = td.textContent;
    const oldRaw = td.getAttribute('data-value') || '';
    const newRaw = currentText;
    if (td.classList.contains('name')) {
      let newName = currentText.trim();
      if (newName === '' && oldRaw !== '') {
        td.textContent = oldRaw;
        return;
      }
      if (newName !== oldRaw) {
        if (oldRaw !== '') 
          table.row_collection.removeRow(oldRaw);
        let finalName = newName;
        while (table.row_collection.getRow(finalName)) 
          finalName = '_' + finalName;
        td.setAttribute('data-value', finalName);
        td.textContent = finalName;
        if (finalName !== '') 
          table.row_collection.addRow(finalName, new TableRow(row));
        ensureBlankFive(table);
      }
    } else if (td.classList.contains('formula')) {
      td.setAttribute('data-value', newRaw);
      const formatted = formatFormula(newRaw);
      td.textContent = formatted;
      if (newRaw !== oldRaw) 
         table.pubsub.publish('recalculation', 'go');
    } else if (td.classList.contains('result')) {
      td.setAttribute('data-value', newRaw);
      const formatted = formatResult(newRaw);
      td.textContent = formatted;
      if (newRaw !== oldRaw) 
        table.pubsub.publish('recalculation', 'go');
    } else if (td.classList.contains('description')) {
        ensureBlankFive(table);
    } else if (td.classList.contains('unit')) {
      td.setAttribute('data-value', newRaw);
      if (newRaw !== oldRaw) 
        table.pubsub.publish('recalculation', 'go');
      ensureBlankFive(table);
    }
    enforceRowRules(row);
  });

  tbody.addEventListener('dblclick', (e) => {
    if (e.target.tagName !== 'TD') return;
    const td = e.target;
    if (!td.classList.contains('handle')) return;
    const originalRow = td.parentNode;
    const copyRow = originalRow.cloneNode(true);
    originalRow.after(copyRow);
    const nameTd = copyRow.querySelector('.name');
    let name = nameTd.getAttribute('data-value') || nameTd.textContent.trim();
    let newName = name;
    while (table.row_collection.getRow(newName)) 
      newName = '_' + newName;
    nameTd.setAttribute('data-value', newName);
    nameTd.textContent = newName;
    if (newName !== '') 
      table.row_collection.addRow(newName, new TableRow(copyRow));
    enforceRowRules(copyRow);
    ensureBlankFive(table);
  });

  tbody.addEventListener('click', (e) => {
    if (e.target.tagName !== 'TD') return;
    const td = e.target;
    if (!td.classList.contains('delete')) return;
    const row = td.parentNode;
    const nameTd = row.querySelector('.name');
    const name = nameTd.getAttribute('data-value') || nameTd.textContent.trim();
    if (name !== '') 
      table.row_collection.removeRow(name);
    row.parentNode.removeChild(row);
    table.pubsub.publish('recalculation', 'go');
    ensureBlankFive(table);
  });

  thead.addEventListener('click', (e) => {
    const button = e.target;
    if (button.tagName !== 'BUTTON') return;
    const th = button.parentNode;
    if (th.classList.contains('add-result')) {
      addResultColumn(table);
    } else if (th.classList.contains('result') && button.classList.contains('close-res')) {
      const colIdx = Array.from(thead.rows[0].cells).indexOf(th);
      const theadRow = th.parentNode;
      theadRow.removeChild(th);
      for (let row of table.tBodies[0].rows) {
        row.deleteCell(colIdx);
      }
      table.blank_row.deleteCell(colIdx);
    }
  });

  thead.addEventListener('dblclick', (e) => {
    const th = e.target.closest('th');
    if (!th) return;
    if (!th.classList.contains('result')) return;
    const span = th.querySelector('span');
    if (span) {
      span.contentEditable = 'true';
      span.focus();
      const onFocusOut = () => {
        span.contentEditable = 'false';
        span.removeEventListener('focusout', onFocusOut);
      };
      span.addEventListener('focusout', onFocusOut);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) 
    setupTableInterface(table);
});

export { enforceRowRules, setupTableInterface, ensureBlankFive };