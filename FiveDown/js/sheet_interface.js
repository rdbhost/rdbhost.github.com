// js/sheet_interface.js
// Handles event delegation for the table columns, integrating with TableRow and RowCollection
// Uses table.pubsub for publishing events

import { TableRow } from './table_row_handler.js';
import { RowCollection } from './row_collection.js';
import { Data } from './dim_data.js';

// Function to enforce rules for a row
function enforceRowRules(row) {
  const formulaTd = row.querySelector('td.formula');
  const formulaValue = (formulaTd.dataset.value || '').trim();
  const resultTds = row.querySelectorAll('td.result');

  if (formulaValue !== '') {
    // Rule 1: results non-editable
    resultTds.forEach(td => {
      td.contentEditable = false;
      td.classList.add('readonly', 'output');
      td.classList.remove('input');
    });
    formulaTd.contentEditable = true;
  } else {
    // Rule 2: formula blank and non-editable, results editable
    resultTds.forEach(td => {
      td.contentEditable = true;
      td.classList.add('input');
      td.classList.remove('readonly', 'output');
    });
    formulaTd.contentEditable = false;
  }
}

// Function to set up all event handlers for the table
function setupTableInterface(table) {
  const tbody = table.querySelector('tbody');
  const thead = table.querySelector('thead');

  // Assuming table.row_collection is initialized as new RowCollection([...]) elsewhere
  // Assuming table.pubsub is set by pubsub.js

  // Double-click on row: duplicate
  tbody.addEventListener('dblclick', (e) => {
    const tr = e.target.closest('tr');
    if (tr) {
      const clone = tr.cloneNode(true);
      tr.after(clone);

      // Get old name
      const oldNameTd = tr.querySelector('td.name');
      const oldName = (oldNameTd.dataset.value || oldNameTd.textContent.trim());

      // Set new name with prefixes if needed
      let newName = oldName;
      let prefix = '_';
      while (table.row_collection.rowMap.has(newName)) {
        newName = prefix + oldName;
        prefix += '_';
      }

      const newNameTd = clone.querySelector('td.name');
      newNameTd.textContent = newName;
      newNameTd.dataset.value = newName;

      // Create new handler for clone
      const newRowHandler = new TableRow(clone.outerHTML);
      // Replace clone with parsed tr
      clone.parentNode.replaceChild(newRowHandler.tr, clone);
      table.row_collection.addRow(newRowHandler);
    }
  });

  // Double-click on result column header
  thead.addEventListener('dblclick', (e) => {
    const th = e.target.closest('th.result');
    if (th) {
      th.contentEditable = true;
      th.focus();
      const onFocusout = () => {
        th.contentEditable = false;
        th.removeEventListener('focusout', onFocusout);
      };
      th.addEventListener('focusout', onFocusout);
    }
  });

  // Name column on-exit (blur)
  tbody.addEventListener('blur', (e) => {
    if (!e.target.matches('td.name')) return;

    const td = e.target;
    const row = td.closest('tr');
    const oldValue = td.dataset.value || '';
    const newContent = td.textContent.trim();

    if (newContent === oldValue) return;

    if (newContent === '' && oldValue !== '') {
      // Revert if new blank but old not
      td.textContent = oldValue;
      return;
    }

    // Temporarily revert textContent to oldValue for consistent name during removal
    td.textContent = oldValue;

    // Get handler with old name
    const oldRowHandler = table.row_collection.getRow(oldValue);

    // Remove from collection using old name
    table.row_collection.removeRow(oldRowHandler);

    // Update textContent and data-value
    td.textContent = newContent;
    td.dataset.value = newContent;

    // Add back with new name
    table.row_collection.addRow(oldRowHandler);
  }, true);

  // Formula column handlers
  tbody.addEventListener('focus', (e) => {
    if (!e.target.matches('td.formula')) return;

    const td = e.target;
    if (td.dataset.value !== undefined) {
      td.textContent = td.dataset.value;
    }
  }, true);

  tbody.addEventListener('blur', (e) => {
    if (!e.target.matches('td.formula')) return;

    const td = e.target;
    const row = td.closest('tr');
    const newContent = td.textContent;
    const oldValue = td.dataset.value || '';

    td.dataset.value = newContent;

    // Format display
    const formatted = newContent.replace(/@/g, '⋅').replace(/\*/g, '×');
    td.textContent = formatted;

    if (newContent.trim() !== oldValue.trim()) {
      table.pubsub.publish('recalculation', 'go');
    }

    enforceRowRules(row);
  }, true);

  // Results columns handlers
  tbody.addEventListener('focus', (e) => {
    if (!e.target.matches('td.result')) return;

    const td = e.target;
    if (td.dataset.value !== undefined) {
      td.textContent = td.dataset.value;
    }
  }, true);

  tbody.addEventListener('blur', (e) => {
    if (!e.target.matches('td.result')) return;

    const td = e.target;
    const row = td.closest('tr');
    const newContent = td.textContent.trim();
    const oldValue = td.dataset.value || '';

    if (newContent === oldValue) return;

    // Get handler
    const nameTd = row.querySelector('td.name');
    const name = (nameTd.dataset.value || nameTd.textContent.trim());
    const rowHandler = table.row_collection.getRow(name);

    // Find result index
    const resultTds = row.querySelectorAll('td.result');
    const resultIndex = Array.from(resultTds).indexOf(td);

    // Parse new value
    const value = rowHandler.parseValue(newContent);
    const unit = rowHandler.unit();
    const data = new Data(value, unit);

    // Set result
    try {
      rowHandler.result(resultIndex, data);
      // rowHandler.result sets td.textContent to formatted and td.dataset.value to string value
    } catch (error) {
      rowHandler.result(resultIndex, error);
    }

    table.pubsub.publish('recalculation', 'go');

    // Ensure formula blank and non-editable
    const formulaTd = row.querySelector('td.formula');
    formulaTd.textContent = '';
    formulaTd.dataset.value = '';
    formulaTd.contentEditable = false;

    // Enforce rules (results editable)
    enforceRowRules(row);
  }, true);

  // Add-result column header button click
  thead.addEventListener('click', (e) => {
    const button = e.target.closest('th.add-result button');
    if (!button) return;

    // Find position
    const ths = Array.from(thead.rows[0].cells);
    const addThIndex = ths.findIndex(th => th.classList.contains('add-result'));
    const resultThs = ths.filter(th => th.classList.contains('result'));
    const newIndex = resultThs.length;

    // Update first result header if adding second
    if (newIndex === 1) {
      const firstResultTh = resultThs[0];
      firstResultTh.textContent = 'Result 0';
    }

    // Create new th
    const newTh = document.createElement('th');
    newTh.classList.add('result');
    newTh.textContent = `Result ${newIndex}`;
    thead.rows[0].insertBefore(newTh, ths[addThIndex]);

    // Add new td to each row
    tbody.querySelectorAll('tr').forEach(tr => {
      const newTd = document.createElement('td');
      newTd.classList.add('result');
      newTd.dataset.value = '';
      newTd.textContent = '';

      // Insert before add-result td
      const addTd = tr.querySelector('td.add-result');
      tr.insertBefore(newTd, addTd);

      // Set editable based on mode
      const formulaTd = tr.querySelector('td.formula');
      const formulaValue = (formulaTd.dataset.value || '').trim();
      if (formulaValue !== '') {
        newTd.contentEditable = false;
        newTd.classList.add('readonly', 'output');
      } else {
        newTd.contentEditable = true;
        newTd.classList.add('input');
      }
    });

    // Update all handlers to recognize new resultTDs
    for (let rowHandler of table.row_collection.rowMap.values()) {
      rowHandler.initTDs();
    }
  });

  // Delete row button click
  tbody.addEventListener('click', (e) => {
    const button = e.target.closest('td.delete button');
    if (!button) return;

    const tr = button.closest('tr');
    const nameTd = tr.querySelector('td.name');
    const name = (nameTd.dataset.value || nameTd.textContent.trim());
    const rowHandler = table.row_collection.getRow(name);

    table.row_collection.removeRow(rowHandler);
    tr.remove();

    table.pubsub.publish('recalculation', 'go');
  });
}

// Attach setup to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('main-sheet');
  if (table) {
    setupTableInterface(table);
  }
});

export { enforceRowRules, setupTableInterface };