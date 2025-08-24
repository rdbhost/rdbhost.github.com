// js/sheet_loader.js

import { TableRow } from './table_row.js';

/**
 * Loads the table with specified header and rows data.
 * Adjusts the number of result columns, sets header texts, clears and populates the tbody with rows.
 * Handles null rows as blank, string in row[3] as formula, array in row[3] as results.
 * @param {HTMLTableElement} table - The table element to load data into.
 * @param {string[]} header - Array of header texts for result columns.
 * @param {(null | [string, string, string, (string | any[])])[]} rows - Array of row data or null for blank rows.
 */
function loadSheet(table, header, rows) {
  const tbody = table.tBodies[0];
  const theadRow = table.tHead.rows[0];
  const addTh = theadRow.querySelector('.add-result');
  let resultThs = theadRow.querySelectorAll('.result');
  const neededColumns = header.length;
  let currentColumns = resultThs.length;

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

    if (numResults === 1 && resultThsTemp[0].querySelector('span').textContent.trim() === 'Result') {
      resultThsTemp[0].querySelector('span').textContent = 'Result 0';
    }

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
    span.textContent = header[idx] || 'Result ' + idx;
  });

  // Clear tbody
  tbody.innerHTML = '';

  // Populate rows
  rows.forEach(rowData => {
    let newRow = table.blank_row.cloneNode(true);
    if (rowData !== null) {
      const descriptionTd = newRow.querySelector('.description');
      const nameTd = newRow.querySelector('.name');
      const unitTd = newRow.querySelector('.unit');
      const formulaTd = newRow.querySelector('.formula');
      const resultTds = newRow.querySelectorAll('.result');

      descriptionTd.textContent = rowData[0] || '';
      let name = rowData[1] || '';
      unitTd.textContent = rowData[2] || '';

      const other = rowData[3];
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
            resultTds[idx].textContent = formatResult(raw);
          }
        });
      }

      // Add to row_collection if name is present
      if (name.trim() !== '') {
        let finalName = name;
        while (table.row_collection.getRow(finalName)) {
          finalName = '_' + finalName;
        }
        nameTd.setAttribute('data-value', finalName);
        nameTd.textContent = finalName;
        table.row_collection.addRow(finalName, new TableRow(newRow));
      }
    }
    tbody.appendChild(newRow);
    enforceRowRules(newRow);
  });
}

/**
 * Loads a predefined sample into the table by retrieving from the samples object and calling loadSheet.
 * @param {HTMLTableElement} table - The table element to load the sample into.
 * @param {Object} samples - The dictionary containing samples.
 * @param {string} sampleName - The name of the sample to load.
 */
function loadSample(table, samples, sampleName) {
  const sample = samples[sampleName];
  if (!sample) return;
  loadSheet(table, sample.header, sample.rows);
}

/**
 * Scans the table and converts it into a samples-like structure.
 * @param {HTMLTableElement} table - The table element to scan.
 * @returns {{header: string[], rows: (null | [string, string, string, (string | any[])])[]}} The scanned sheet structure.
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
    const description = tr.querySelector('.description').textContent.trim();
    const name = tr.querySelector('.name').textContent.trim();
    const unit = tr.querySelector('.unit').textContent.trim();
    const formulaTd = tr.querySelector('.formula');
    const formulaData = formulaTd.getAttribute('data-value');
    const formulaText = formulaTd.textContent.trim();
    const formula = formulaData !== null ? formulaData : formulaText;

    const resultTds = tr.querySelectorAll('.result');
    const results = [];
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

    const isBlank = !description && !name && !unit && !formula && results.every(r => r === '' || r === null);
    if (isBlank) {
      rows.push(null);
    } else {
      const other = formula ? formula : (results.length === 1 ? results[0] : results);
      rows.push([description || null, name || null, unit || null, other]);
    }
  }

  return { header, rows };
}

export { loadSheet, loadSample, scanSheet };