// js/sheet_interface.js

import { RowCollection } from './row_collection.js';
import { TableRow } from './table_row.js';
import { formatFormula, formatResult, Data } from './dim_data.js'

/**
 * Checks if a table row is blank based on its cell contents.
 * @param {HTMLTableRowElement} tr - The table row to check.
 * @returns {boolean} True if the row is blank, false otherwise.
 */
function isBlankRow(tr) {
  const desc = tr.querySelector('td.description')?.textContent.trim() === '';
  const name = tr.querySelector('td.name')?.textContent.trim() === '';
  const formula = tr.querySelector('td.formula')?.textContent.trim() === '';
  const unit = tr.querySelector('td.unit')?.textContent.trim() === '';
  const results = Array.from(tr.querySelectorAll('td.result')).every(td => td.textContent.trim() === '');
  return desc && name && formula && unit && results;
}

/**
 * Ensures that exactly the last five rows in the table are blank.
 * Removes extra blank rows or adds new ones as needed.
 * @param {HTMLTableElement} table - The table element.
 * @throws {Error} If no blank row template is available.
 */
function ensureBlankFive(table) {
  const tbody = table.querySelector('tbody');
  const allTrs = Array.from(tbody.querySelectorAll('tr'));
  let trailing = 0;
  for (let i = allTrs.length - 1; i >= 0; i--) {
    if (isBlankRow(allTrs[i])) {
      trailing++;
    } else {
      break;
    }
  }
  if (trailing > 5) {
    for (let i = 0; i < trailing - 5; i++) {
      tbody.lastChild.remove();
    }
  } else if (trailing < 5) {
    for (let i = 0; i < 5 - trailing; i++) {
      const newBlank = table.blank_row.cloneNode(true);
      tbody.appendChild(newBlank);
      enforceRowRules(newBlank);
    }
  }
}

/**
 * Enforces editing rules on a table row based on formula presence.
 * @param {HTMLTableRowElement} tr - The table row to enforce rules on.
 */
function enforceRowRules(tr) {
  const formulaTd = tr.querySelector('td.formula');
  const isFormula = formulaTd.dataset.value?.trim() !== '';
  formulaTd.contentEditable = isFormula;
  const resultTds = tr.querySelectorAll('td.result');
  for (const resTd of resultTds) {
    resTd.contentEditable = !isFormula;
    if (isFormula) {
      resTd.classList.add('readonly', 'output');
      resTd.classList.remove('input');
    } else {
      resTd.classList.remove('readonly', 'output');
      resTd.classList.add('input');
    }
  }
}

/**
 * Adds a new result column to the table.
 * @param {HTMLTableElement} table - The table element.
 */
function addNewResultColumn(table) {
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  const addTh = thead.querySelector('th.add-result');
  const headerRow = addTh.parentNode;
  const resultThs = thead.querySelectorAll('th.result');
  const numResults = resultThs.length;
  if (numResults === 1) {
    resultThs[0].textContent = 'Result 0';
  }
  const newTh = document.createElement('th');
  newTh.classList.add('result');
  newTh.draggable = true;
  newTh.textContent = `Result ${numResults}`;
  headerRow.insertBefore(newTh, addTh);
  for (const tr of tbody.querySelectorAll('tr')) {
    const newTd = document.createElement('td');
    newTd.classList.add('result');
    newTd.dataset.value = '';
    newTd.textContent = '';
    tr.insertBefore(newTd, tr.querySelector('td.add-result'));
    enforceRowRules(tr);
  }
  table.pubsub.publish('recalculation', 'go');
}

/**
 * Sets up event handlers and initial state for the table interface.
 * @param {HTMLTableElement} table - The table element to set up.
 * @throws {Error} If no blank row is found in the initial table.
 */
function setupTableInterface(table) {
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  // Find blank row
  const initialTrs = tbody.querySelectorAll('tr');
  let blankTr = null;
  for (const tr of initialTrs) {
    if (isBlankRow(tr)) {
      blankTr = tr.cloneNode(true);
      break;
    }
  }
  if (!blankTr) {
    throw new Error('No blank row found');
  }
  table.blank_row = blankTr;

  // Delete all rows
  tbody.innerHTML = '';

  // Ensure five blanks
  ensureBlankFive(table);

  // Focusin handlers
  tbody.addEventListener('focusin', (e) => {
    const td = e.target;
    if (td.matches('td.formula') || td.matches('td.result')) {
      const dataVal = td.dataset.value || '';
      if (dataVal) {
        td.textContent = dataVal;
      }
    }
  });

  // Focusout handlers
  tbody.addEventListener('focusout', (e) => {
    const td = e.target;
    const tr = td.closest('tr');
    if (td.matches('td.name')) {
      const newName = td.textContent.trim();
      const oldName = td.dataset.value?.trim() || '';
      if (newName !== oldName) {
        if (newName === '' && oldName !== '') {
          td.textContent = oldName;
          return;
        }
        td.dataset.value = newName;
        if (oldName !== '') {
          table.row_collection.removeRow(oldName);
        }
        if (newName !== '') {
          let finalName = newName;
          while (table.row_collection.getRow(finalName)) {
            finalName = '_' + finalName;
          }
          td.dataset.value = finalName;
          td.textContent = finalName;
          table.row_collection.addRow(finalName, new TableRow(tr));
        }
      }
      ensureBlankFive(table)
    } else if (td.matches('td.formula')) {
      const newFormula = td.textContent;
      const oldFormula = td.dataset.value || '';
      td.dataset.value = newFormula;
      const formatted = formatFormula(newFormula)
      td.textContent = formatted;
      if (newFormula !== oldFormula) {
        table.pubsub.publish('recalculation', 'go');
      }
      enforceRowRules(tr);
    } else if (td.matches('td.result')) {
      const DT = new Data(td.textContent)
      const newVal = DT.val();
      const oldVal = td.dataset.value || '';
      td.dataset.value = newVal;
      const formatted = formatResult(newVal, DT.type());
      td.textContent = formatted;
      if (newVal !== oldVal) {
        table.pubsub.publish('recalculation', 'go');
        const formulaTd = tr.querySelector('td.formula');
        formulaTd.dataset.value = '';
        formulaTd.textContent = '';
        enforceRowRules(tr);
      }
    }
  });

  // Delete handler
  tbody.addEventListener('click', (e) => {
    if (e.target.matches('td.delete')) {
      const tr = e.target.closest('tr');
      const name = tr.querySelector('td.name').dataset.value?.trim() || '';
      if (name) {
        table.row_collection.removeRow(name);
      }
      tr.remove();
      table.pubsub.publish('recalculation', 'go');
      ensureBlankFive(table);
    }
  });

  // Duplicate handler
  tbody.addEventListener('dblclick', (e) => {
    if (e.target.matches('td.handle')) {
      const tr = e.target.closest('tr');
      const newTr = tr.cloneNode(true);
      tr.after(newTr);
      const nameTd = newTr.querySelector('td.name');
      let name = nameTd.dataset.value?.trim() || '';
      if (name) {
        let newName = name;
        while (table.row_collection.getRow(newName)) {
          newName = '_' + newName;
        }
        nameTd.dataset.value = newName;
        nameTd.textContent = newName;
        table.row_collection.addRow(newName, new TableRow(newTr));
      }
      enforceRowRules(newTr);
      ensureBlankFive(table);
    }
  });

  // Add result column handler
  thead.addEventListener('click', (e) => {
    if (e.target.matches('th.add-result button')) {
      addNewResultColumn(table);
    }
  });

  // Header rename handler
  thead.addEventListener('dblclick', (e) => {
    if (e.target.matches('span')) {
      const th = e.target;
      th.contentEditable = true;
      const onFocusout = () => {
        th.contentEditable = false;
      };
      th.addEventListener('focusout', onFocusout, { once: true });
    }
  });

  // Row drag handlers
  let draggingRow = null;
  tbody.addEventListener('dragstart', (e) => {
    if (e.target.matches('td.handle')) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      draggingRow = e.target.closest('tr');
      draggingRow.classList.add('dragging');
    }
  });
  tbody.addEventListener('dragover', (e) => {
    const tr = e.target.closest('tr');
    if (tr && tr !== draggingRow) {
      e.preventDefault();
    }
  });
  tbody.addEventListener('drop', (e) => {
    const tr = e.target.closest('tr');
    if (tr && tr !== draggingRow) {
      e.preventDefault();
      const rect = tr.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        tr.before(draggingRow);
      } else {
        tr.after(draggingRow);
      }
      draggingRow.classList.remove('dragging');
      ensureBlankFive(table);
    }
  });
  tbody.addEventListener('dragend', (e) => {
    if (e.target.matches('td.handle') && draggingRow) {
      draggingRow.classList.remove('dragging');
      draggingRow = null;
    }
  });

  // Column drag handlers
  let dragColIdx = -1;
  thead.addEventListener('dragstart', (e) => {
    if (e.target.matches('th.result')) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      dragColIdx = e.target.cellIndex;
      e.target.classList.add('dragging');
    }
  });
  thead.addEventListener('dragover', (e) => {
    if (e.target.matches('th.result')) {
      e.preventDefault();
    }
  });
  thead.addEventListener('drop', (e) => {
    if (e.target.matches('th.result')) {
      e.preventDefault();
      const dropTh = e.target;
      const rect = dropTh.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      let toIdx = (e.clientX < mid) ? dropTh.cellIndex : dropTh.cellIndex + 1;
      if (toIdx === dragColIdx || toIdx === dragColIdx + 1) {
        return;
      }
      const allRows = [thead.querySelector('tr'), ...tbody.querySelectorAll('tr')];
      for (const row of allRows) {
        const cell = row.children[dragColIdx];
        row.insertBefore(cell, row.children[toIdx]);
      }
      dropTh.classList.remove('dragging');
      dragColIdx = -1;
    }
  });
  thead.addEventListener('dragend', (e) => {
    if (e.target.matches('th.result')) {
      e.target.classList.remove('dragging');
      dragColIdx = -1;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) {
    setupTableInterface(table);
  }
});

export { enforceRowRules, setupTableInterface, ensureBlankFive, isBlankRow };