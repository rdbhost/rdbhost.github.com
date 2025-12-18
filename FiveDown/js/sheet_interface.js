
import { PubSub } from './pubsub.js';
import { formatResult, formatFormula } from './dim_data.js';
import { RowCollection, constants } from './row_collection.js';
import { TableRow, convertToTitle, convertFromTitle } from './table_row.js';
import { evaluateNow } from './evaluator.js';
import { default as unit } from './lib/UnitMath.js'; // Adjust path based on your setup (e.g., CDN or local file)


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
  if (nameTd && nameTd.textContent.trim() !== '') return false;
  if (formulaTd && formulaTd.textContent.trim() !== '') return false;
  if (unitTd.textContent.trim() !== '') return false;
  for (let td of resultTds) {
    if (td.textContent.trim() !== '') return false;
  }
  return true;
}

/**
 * Checks if a row is a 4-column row (handle, description with colspan, unit, delete).
 * @param {HTMLTableRowElement} row - The table row to check.
 * @returns {boolean} True if the row has 4 columns, false otherwise.
 */
function isFourColumnRow(row) {
  return row.cells.length === 4 && row.querySelector('.description').hasAttribute('colspan');
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
 * Applies title/subtitle/subsubtitle classes to the description cell based on '=' count in the unit column.
 * @param {HTMLTableRowElement} row - The table row to update.
 */
function setFourColumnClasses(row) {
  const unitTd = row.querySelector('.unit');
  const descTd = row.querySelector('.description');
  if (!unitTd || !descTd) return;
  descTd.classList.remove('title', 'subtitle', 'subsubtitle', 'title_c', 'subtitle_c', 'subsubtitle_c', 'title_l', 'subtitle_l', 'subsubtitle_l');
  const trimmed = unitTd.textContent.trim();
  if (/^=+$/.test(trimmed)) {
    let className = '';
    const n = trimmed.length;
    if (n === 1) className = 'title_l';
    else if (n === 2) className = 'title_c';
    else if (n === 3) className = 'subtitle_l';
    else if (n === 4) className = 'subtitle_c';
    else if (n === 5) className = 'subsubtitle_l';
    else if (n >= 6) className = 'subsubtitle_c';
    if (className) descTd.classList.add(className);
  }
}

/**
 * Enforces editing rules on a table row based on the content of formula and result cells.
 * @param {HTMLTableRowElement} row - The table row to enforce rules on.
 */
function enforceRowRules(row) {
  if (isFourColumnRow(row)) {
    const descriptionTd = row.querySelector('.description');
    const unitTd = row.querySelector('.unit');
    descriptionTd.contentEditable = 'true';
    descriptionTd.tabIndex = 0;
    descriptionTd.classList.remove('readonly');
    unitTd.contentEditable = 'true';
    unitTd.tabIndex = 0;
    unitTd.classList.remove('readonly');
    setFourColumnClasses(row);
    return;
  }

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

  // Check for unit conversion and apply 'converted' class
  const unitTd = row.querySelector('.unit');
  const unitText = unitTd.textContent.trim();
  const computedUnit = unitTd.getAttribute('data-computed-unit');
  if (isFormulaNonBlank && computedUnit !== null && computedUnit !== '' && unitText.trim() !== '' 
      && computedUnit.trim().toLowerCase() !== unitText.toLowerCase()) {
    formulaTd.classList.add('converted');
  } else {
    formulaTd.classList.remove('converted');
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
    if (isFourColumnRow(row)) {
      const descriptionTd = row.querySelector('.description');
      const currentColspan = parseInt(descriptionTd.getAttribute('colspan') || '1');
      descriptionTd.setAttribute('colspan', currentColspan + 1);
    } else {
      const addTd = row.querySelector('.add-result');
      const newTd = templateTd.cloneNode(true);
      // Copy nonblank value from rightmost existing result column
      const resultTds = row.querySelectorAll('.result');
      if (resultTds.length > 0) {
        const rightmost = resultTds[resultTds.length - 1];
        const val = rightmost.getAttribute('data-value');
        if (val && val.trim() !== '') {
          newTd.setAttribute('data-value', val);
          newTd.textContent = rightmost.textContent;
        }
      }
      row.insertBefore(newTd, addTd);
      enforceRowRules(row);
    }

    table.pubsub.publish('column-count-changed', row.querySelectorAll('.result').length);
  }

  const blankAddTd = table.blank_row.querySelector('.result');
  const blankNewTd = templateTd.cloneNode(true);
  table.blank_row.insertBefore(blankNewTd, blankAddTd);

  // Publish recalculation after adding the column
  if (table.pubsub && typeof table.pubsub.publish === 'function') {
    table.pubsub.publish('recalculation', 'go');
  }
}

/**
 * Sets up the table interface, including event listeners and initial configuration.
 * @param {HTMLTableElement} table - The table to set up.
 */
function setupTableInterface(table) {

  let blankRow = null;
  for (let tr of table.tBodies[0].rows) {
    if (isBlankRow(tr) && !isFourColumnRow(tr)) {
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
    if (raw !== null && (td.classList.contains('formula') || td.classList.contains('unit'))) {
      td.textContent = raw;
    }
    else if (td.classList.contains('result')) {
      td.textContent = JSON.parse(raw);
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
      // Replace invalid characters with underscores
      newName = newName.replace(/[^a-zA-Z0-9_]/g, '_');
      // Remove leading digits and underscores
      newName = newName.replace(/^[0-9_]+/, '');

      if (newName === '' && oldRaw !== '') {
        td.textContent = oldRaw;
        return;
      }
      if (newName !== oldRaw) {
        if (oldRaw !== '') 
          table.row_collection.removeRow(oldRaw);
        let finalName = newName;
        while (table.row_collection.getRow(finalName) || finalName in constants) 
          finalName = finalName + '_';
        td.setAttribute('data-value', finalName);
        td.textContent = finalName;
        if (finalName !== '') 
          table.row_collection.addRow(finalName, new TableRow(row));
        ensureBlankFive(table);
        table.pubsub.publish('recalculation', 'go');
      }
    } else if (td.classList.contains('formula')) {
      td.setAttribute('data-value', newRaw);
      const formatted = formatFormula(newRaw);
      td.textContent = formatted;
      if (newRaw !== oldRaw) {

        const resultTds = row.querySelectorAll('.result');
        for (let td of resultTds) {
          if (td.classList.contains('error')) {
            td.textContent = '';
            td.removeAttribute('data-value');
            td.classList.remove('error', 'output');
          }
        }
        table.pubsub.publish('recalculation', 'go');
      }
    } else if (td.classList.contains('result')) {
      if (newRaw === oldRaw) {
        let d;
        try {
          d = JSON.parse(oldRaw);
        } catch (e) {
          d = oldRaw;
        }
        td.textContent = formatResult(d);
      } else {
        const unitTd = row.querySelector('.unit');
        const unit = unitTd.textContent.trim() || unitTd.getAttribute('data-value') || '';
        const resultTds = Array.from(row.querySelectorAll('.result'));
        const colIdx = resultTds.indexOf(td);
        if (colIdx === -1) throw new Error('Result column index not found');
        const proxy = table.row_collection.getColumnProxy(colIdx);
        try {
          td.classList.remove('error');
          const data = evaluateNow(newRaw, proxy, unit);
          if (data instanceof Error) {
            if (data.stack.indexOf('a_parser') > -1)
              td.textContent = 'Parse Error';
            else
              td.textContent = data.message;
            td.removeAttribute('data-value');
            td.classList.add('error');
          }
          else {
            // td.setAttribute('data-value', data.val());
            td.setAttribute('data-value', JSON.stringify(data.val()));
            td.textContent = formatResult(data.val());
          }
        } catch (e) {
          td.setAttribute('data-value', newRaw);
          td.textContent = newRaw;
        }
        table.pubsub.publish('recalculation', 'go');
      }
    } else if (td.classList.contains('description')) {
        ensureBlankFive(table);
    } else if (td.classList.contains('unit')) {
      // Validation: blank, one or more '=', or valid UnitMath unit
      const trimmed = newRaw.trim();
      let valid = false;
      const wasEquals = /^=+$/.test(oldRaw.trim());
      const isEquals = /^=+$/.test(trimmed);
      if (trimmed === '') {
        valid = true;
        td.removeAttribute('data-value');
        td.textContent = '';
      } else if (isEquals) {
        valid = true;
        td.setAttribute('data-value', trimmed);
        // Convert to title row and set description class
        convertToTitle(row);
        setFourColumnClasses(row);
      } else {
        try {
          unit(1, trimmed); // throws if not valid
          valid = true;
          td.setAttribute('data-value', trimmed);
        } catch (e) {
          valid = false;
        }
      }
      // If it was a title row and is no longer, convert back
      if (wasEquals && !isEquals) {
        convertFromTitle(row);
      }
      if (!valid) {
        // Show error, keep bad value, then revert after timeout
        td.classList.add('input-error');
        const badValue = td.textContent;
        setTimeout(() => {
          td.textContent = oldRaw;
          td.setAttribute('data-value', oldRaw);
          td.classList.remove('input-error');
        }, 1500);
        return;
      }
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
    if (nameTd) {
      let name = nameTd.getAttribute('data-value') || nameTd.textContent.trim();
      let newName = name;
      while (table.row_collection.getRow(newName)) 
        newName = newName + '_';
      nameTd.setAttribute('data-value', newName);
      nameTd.textContent = newName;
      if (newName !== '') 
        table.row_collection.addRow(newName, new TableRow(copyRow));
      table.pubsub.publish('recalculation', 'go');
    }
    enforceRowRules(copyRow);
    ensureBlankFive(table);
  });

  tbody.addEventListener('click', (e) => {
    if (e.target.tagName !== 'TD') return;
    const td = e.target;
    if (!td.classList.contains('delete')) return;
    const row = td.parentNode;
    const nameTd = row.querySelector('.name');
    const name = nameTd ? (nameTd.getAttribute('data-value') || nameTd.textContent.trim()) : '';
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
      const colct = thead.rows[0].querySelectorAll('.result').length;
      table.pubsub.publish('column-count-changed', colct)
      for (let row of table.tBodies[0].rows) {
        if (isFourColumnRow(row)) {
          const descriptionTd = row.querySelector('.description');
          const currentColspan = parseInt(descriptionTd.getAttribute('colspan') || '1');
          if (currentColspan > 3) { // Ensure at least name, formula, and add-result are spanned
            descriptionTd.setAttribute('colspan', currentColspan - 1);
          }
        } else {
          row.deleteCell(colIdx);
        }
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

  table.pubsub.subscribe('ensure-blank-five', () => {
    ensureBlankFive(table);
  })
  table.pubsub.subscribe('enforce-row-rules', () => {
    for (let row of table.tBodies[0].rows) {
      enforceRowRules(row);
    } 
  })

} 

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) 
    setupTableInterface(table);
});

export { enforceRowRules, setupTableInterface, ensureBlankFive };