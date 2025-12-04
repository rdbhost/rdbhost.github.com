// js/sheet_loader.js

import { samples } from './samples.js';
import { TableRow, convertToTitle } from './table_row.js';
import { RowCollection } from './row_collection.js';
import { formatResult, formatFormula, Data } from './dim_data.js'
import { saveSheet as saveSheetLocal, retrieveSheet as retrieveSheetLocal, getLocalStorageSheetNames, removeStoredSheet as removeStoredSheetLocal } from './localstorage_db.js';


/**
 * Tests if the given data matches the expected JSON sheet structure.
 * @param {object} data - The JSON data to test.
 * @returns {string|null} Null if valid, or an error message string if invalid.
 */
function testSheetJson(data) {
  if (typeof data !== 'object' || data === null) return 'Data is not an object.';
  if (typeof data.title !== 'string') return 'Missing or invalid title (should be a string).';
  if (!Array.isArray(data.header)) return 'Missing or invalid header (should be an array).';
  if (!data.header.length) return 'Header must have length';
  if (!Array.isArray(data.rows)) return 'Missing or invalid rows (should be an array).';
  for (let i = 0; i < data.rows.length; i++) {
    const row = data.rows[i];
    if (row === null) continue;
    if (!Array.isArray(row) || row.length !== 4) return `Row ${i} is not an array of length 4.`;
    if (typeof row[0] !== 'string') return `Row ${i} description is not a string.`;
    if (typeof row[1] !== 'string') return `Row ${i} name is not a string.`;
    if (typeof row[2] !== 'string') return `Row ${i} unit is not a string.`;
    const val = row[3];
    if (!(val === null || typeof val === 'string' || Array.isArray(val))) 
      return `Row ${i} fourth element is not null, string, or array.`;
    if (val !== null && row[1] === '') 
      return `Row ${i} name cannot be empty string if formula or input is.`;
  }
  return null;
}

/**
 * Loads the table with specified header and rows data.
 * Adjusts the number of result columns, sets header texts, clears and
 * populates the tbody with rows.
 * Handles null rows as blank, string in row[3] as formula, array in row[3] as
 * results.
 * @param {HTMLTableElement} table - The table element to load data into.
 * @param {Object} data - The data object with title, header and rows.
 */
function loadSheetOnEvent(table, data) {
  const tbody = table.tBodies[0];
  const theadRow = table.tHead.rows[0];
  const addTh = theadRow.querySelector('.add-result');
  let resultThs = theadRow.querySelectorAll('.result');
  const neededColumns = data.header.length;
  let currentColumns = resultThs.length;

  // Clear existing rows and row_collection
  tbody.innerHTML = '';
  table.row_collection = new RowCollection();

  // Adjust number of result columns
  while (currentColumns > neededColumns) {
    const lastResultTh = resultThs[resultThs.length - 1];
    const colIdx = Array.from(theadRow.cells).indexOf(lastResultTh);
    theadRow.removeChild(lastResultTh);
    table.blank_row.deleteCell(colIdx);
    resultThs = theadRow.querySelectorAll('.result');
    currentColumns--;
  }

  while (currentColumns < neededColumns) {
    // Inline add column logic
    const resultThsTemp = theadRow.querySelectorAll('.result');
    let numResults = resultThsTemp.length;
    let newN = numResults;

    if (numResults === 1 && resultThsTemp[0].querySelector('span').textContent.trim() === 'Result')
      resultThsTemp[0].querySelector('span').textContent = 'Result 0';

    const templateTh = resultThsTemp[0] ? resultThsTemp[0].cloneNode(true) : null;
    if (!templateTh) throw new Error('No result column to clone from');
    templateTh.querySelector('span').textContent = 'Result ' + newN;
    theadRow.insertBefore(templateTh, addTh);

    const templateTd = table.blank_row.querySelector('.result').cloneNode(true);
    templateTd.textContent = '';
    templateTd.setAttribute('data-value', '');

    const blankAddTd = table.blank_row.querySelector('.add-result');
    const blankNewTd = templateTd.cloneNode(true);
    table.blank_row.insertBefore(blankNewTd, blankAddTd);

    resultThs = theadRow.querySelectorAll('.result');
    currentColumns++;
  }

  // Set header texts
  resultThs.forEach((th, idx) => {
    const span = th.querySelector('span');
    span.textContent = data.header[idx] || 'Result ' + idx;
  });

  // Populate rows
  data.rows.forEach(rowData => {
    let newRow = table.blank_row.cloneNode(true);
    let needsConvertToTitle = false;
    if (rowData !== null) {
      const descriptionTd = newRow.querySelector('.description');
      const nameTd = newRow.querySelector('.name');
      const unitTd = newRow.querySelector('.unit');
      const formulaTd = newRow.querySelector('.formula');
      const resultTds = newRow.querySelectorAll('.result');

      descriptionTd.textContent = rowData[0] || '';
      let name = rowData[1] || '';
      unitTd.textContent = rowData[2] || '';
      if (rowData[2] && rowData[2].trim() !== '')
        unitTd.setAttribute('data-value', rowData[2].trim())

      const other = rowData[3];
      // Recognize 4-column (title/subtitle) rows: [desc, null, unit, null]
      if (!name && !other) {
        // This is a title/subtitle row, convert to 4-column
        // Set description and unit, then convert
        descriptionTd.textContent = rowData[0] || '';
        unitTd.textContent = rowData[2] || '';
        // Remove any data-value from nameTd and formulaTd
        if (nameTd) {
          nameTd.textContent = '';
          nameTd.removeAttribute('data-value');
        }
        if (formulaTd) {
          formulaTd.textContent = '';
          formulaTd.removeAttribute('data-value');
        }
        // Remove data-value from resultTds
        resultTds.forEach(td => {
          td.textContent = '';
          td.removeAttribute('data-value');
        });
        needsConvertToTitle = true;
      } else {
        if (typeof other === 'string') {
          // Formula
          formulaTd.textContent = other;
          formulaTd.setAttribute('data-value', other);
          formulaTd.textContent = formatFormula(other);
        } else if (Array.isArray(other)) {
          // Results
          other.forEach((val, idx) => {
            if (idx < resultTds.length) {
              const raw = JSON.stringify(val);
              resultTds[idx].setAttribute('data-value', raw);
              resultTds[idx].textContent = formatResult(val); 
            }
          });
        }

        // Add to row_collection if name is present
        if (name && name.trim() !== '') {
          let finalName = name;
          while (table.row_collection.getRow(finalName))
            finalName = finalName + '_';
          nameTd.setAttribute('data-value', finalName);
          nameTd.textContent = finalName;
          table.row_collection.addRow(finalName, new TableRow(newRow));
        }
      }
    }
    tbody.appendChild(newRow);
    if (needsConvertToTitle) {
      convertToTitle(newRow);
    }
  });

  table.pubsub.publish('enforce-row-rules');
  table.pubsub.publish('column-count-changed', resultThs.length);
  table.pubsub.publish('ensure-blank-five');
}

// `loadSample` removed — use `loadSheet` with data from samples or retrieveSheetLocal()/retrieveSheet()/getSheetSync() as appropriate.

/**
 * Scans the table and converts it into a samples-like structure.
 * @param {HTMLTableElement} table - The table element to scan.
 * @returns {{title: string, header: string[], rows: (null | [string, string,
 * string, (string | any[])])[]}} The scanned sheet structure.
 */
function scanSheet(table) {
  const header = [];
  const resultThs = table.tHead.rows[0].querySelectorAll('.result');
  resultThs.forEach(th => {
    const spanText = th.querySelector('span').textContent.trim();
    header.push(spanText || null);
  });

  const rows = [];
  const tbodyRows = table.tBodies[0].rows;
  for (let i = 0; i < tbodyRows.length; i++) {
    const tr = tbodyRows[i];
    // Check if this is a 4-column row (title/subtitle row)
    const isTitleRow = tr.cells.length === 4 && tr.querySelector('.description') && tr.querySelector('.description').hasAttribute('colspan');
    const description = tr.querySelector('.description').textContent.trim();
    const name = tr.querySelector('.name') ? tr.querySelector('.name').textContent.trim() : '';
    const unit = tr.querySelector('.unit') ? tr.querySelector('.unit').getAttribute('data-value') : '';
    let formula = '';
    let results = [];
    if (isTitleRow) {
      // Title/subtitle row: no formula or results, just description and unit
      formula = null;
      results = null;
    } else {
      const formulaTd = tr.querySelector('.formula');
      const formulaData = formulaTd ? formulaTd.getAttribute('data-value') : null;
      const formulaText = formulaTd ? formulaTd.textContent.trim() : '';
      formula = formulaData !== null ? formulaData : formulaText;
      const resultTds = tr.querySelectorAll('.result');
      results = [];
      resultTds.forEach(td => {
        const dataValue = td.getAttribute('data-value');
        const textValue = td.textContent.trim();
        let value = dataValue !== null ? dataValue : textValue;
        try {
          value = JSON.parse(value);
        } catch (e) {
          // If not parsable, keep as string
        }
        results.push(value);
      });
    }

    // For blank rows, keep as null
    const isBlank = !description && !name && !unit && (!formula || formula === null) && (!results || results.every(r => r === '' || r === null));
    if (isBlank) {
      rows.push(null);
    } else if (isTitleRow) {
      // For title/subtitle rows, store only description and unit
      rows.push([description || null, null, unit || null, null]);
    } else {
      const other = formula ? formula : results;
      rows.push([description || null, name || null, unit || null, other]);
    }
  }

  return { header, rows };
}

/**
 * Retrieves all sheet names from samples and localStorage, consolidated
 * uniquely.
 * @returns {Object} Dictionary with keys as sheet names and values as titles.
 */
function allSheetNames() {
  const nameDict = {};
  Object.keys(samples).forEach(key => {
    const obj = samples[key];
    nameDict[key] = obj.title || key;
  });

  const localNames = getLocalStorageSheetNames();
  for (const k in localNames) {
    nameDict[k] = localNames[k];
  }

  return nameDict;
}

// Get the next available sheet name (e.g., sheet01, sheet02, etc.)
function getNextSheetName() {
  const sheets = allSheetNames();
  let i = 1;
  while (sheets[`sheet${String(i).padStart(2, '0')}`]) i++;
  return `sheet${String(i).padStart(2, '0')}`;
}

// Delegate localStorage operations to `localstorage_db.js`
function saveSheet(name, object) {
  // Prefer built-in samples over writing to localStorage
  if (samples[name]) return false;
  if (!name.match(/^sheet\d+$/)) return false;
  if (!object.title) object.title = name;
  return saveSheetLocal(name, object);
}

function retrieveSheet(name) {
  // Return sample immediately if present, wrapped in a Promise for consistency
  if (samples[name]) return Promise.resolve(samples[name]);
  return retrieveSheetLocal(name);
}

function removeStoredSheet(name) {
  return removeStoredSheetLocal(name);
}

/**
 * Public loader wrapper.
 * - If called as `loadSheet(table, data)` it will directly invoke the
 *   internal loader (backwards-compatible).
 * - If called as `loadSheet(data)` it will emit a 'load-sheet' event on
 *   the main table's pubsub (preferred asynchronous path).
 */
function loadSheet(a, b) {
  const data = b;
  const table = document.querySelector('table#main-sheet');
  if (!table) return;
  const pubsub = table.pubsub;
  pubsub.publish('load-sheet', data);
}

/**
 * Sets up a pubsub handler that listens for a 'load-sheet' event and
 * invokes `loadSheet(table, data)` using the main sheet table.
 * The handler is registered after DOMContentLoaded (or immediately if
 * the document is already loaded).
 */
function setupLoadSheetPubsub() {
  const register = () => {
    const table = document.querySelector('table#main-sheet');
    if (!table || !table.pubsub) return;
    const pubsub = table.pubsub;
    const handler = (data) => {
      if (!data) return;
      try {
        loadSheetOnEvent(table, data);
      } catch (e) {
        console.error('Error in load-sheet pubsub handler:', e);
      }
    };

    pubsub.subscribe('load-sheet', handler);
  };

  document.addEventListener('DOMContentLoaded', register);
}
setupLoadSheetPubsub();


export { loadSheet, scanSheet, saveSheet, retrieveSheet, allSheetNames, getNextSheetName, removeStoredSheet, setupLoadSheetPubsub };