// js/table_row.js

import { Data, formatResult } from './dim_data.js';

/**
 * Represents a table row with specific columns and validation.
 * Columns: handle, description, name, formula, result(s), add-result, unit, delete.
 * Each column <td> has a corresponding class.
 * @class
 */
class TableRow {
  
  /**
   * Creates a new TableRow instance from a <tr> HTMLElement.
   * @constructor
   * @param {HTMLElement} element - The <tr> element.
   * @throws {Error} If the element is invalid or does not meet column criteria.
   */
  constructor(element) {
    if (!element || element.tagName !== 'TR')
      throw new Error('Invalid table row element');
    this.row = element;
    this.validate();
    this._initializeUnitClass();
  }

  /**
   * Updates the row with a new <tr> element.
   * Replaces the current row element, including in the DOM if attached.
   * @param {HTMLElement} newElement - The new <tr> element.
   * @throws {Error} If the element is invalid or does not meet column criteria.
   */
  update(newElement) {
    if (!newElement || newElement.tagName !== 'TR')
      throw new Error('Invalid table row element');
    if (this.row.parentNode)
      this.row.parentNode.replaceChild(newElement, this.row);
    this.row = newElement;
    this.validate();
    this._initializeUnitClass();
  }

  /**
   * Initializes the unit-empty class based on unit content.
   * @private
   */
  _initializeUnitClass() {
    const unitTd = this.row.querySelector('td.unit');
    unitTd.classList.remove('unit-empty');
    if (unitTd.textContent.trim() === '')
      unitTd.classList.add('unit-empty');
  }

  /**
   * Validates the row structure and column classes.
   * @private
   * @throws {Error} If validation fails.
   */
  validate() {
    const tds = Array.from(this.row.querySelectorAll('td'));
    if (tds.length < 8)
      throw new Error('Insufficient columns (minimum 8 required)');
    let pos = 0;
    this._checkClass(tds[pos++], 'handle');
    this._checkClass(tds[pos++], 'description');
    this._checkClass(tds[pos++], 'name');
    this._checkClass(tds[pos++], 'formula');
    const resultEnd = tds.length - 3;
    if (resultEnd <= pos)
      throw new Error('At least one result column required');
    for (let i = pos; i < resultEnd; i++) {
      this._checkClass(tds[i], 'result');
    }
    this._checkClass(tds[resultEnd], 'add-result');
    this._checkClass(tds[resultEnd + 1], 'unit');
    this._checkClass(tds[resultEnd + 2], 'delete');
  }

  /**
   * Checks if a <td> has the expected class.
   * @private
   * @param {HTMLElement} td - The table cell element.
   * @param {string} cls - The expected class name.
   * @throws {Error} If the class is missing.
   */
  _checkClass(td, cls) {
    if (!td.classList.contains(cls))
      throw new Error(`Expected class "${cls}" on column`);
  }

  /**
   * Gets the description text.
   * @returns {string} The description.
   */
  description() {
    return this.row.querySelector('td.description').textContent.trim();
  }

  /**
   * Gets the formula from the data-value attribute.
   * @returns {string} The formula.
   */
  formula() {
    return this.row.querySelector('td.formula').getAttribute('data-value') || '';
  }

  /**
   * Gets the unit text.
   * @returns {string} The unit.
   */
  unit() {
    const unitTd = this.row.querySelector('td.unit');
    const text = unitTd.textContent.trim();
    if (text !== '')
      return text;
    return unitTd.getAttribute('data-computed-unit') || '';
  }

  /**
   * Getter/setter for the name.
   * @param {string} [new_name] - If provided, sets the new name (cannot be blank).
   * @returns {string} The prior/current name.
   * @throws {Error} If setting a blank name.
   */
  name(new_name) {
    const td = this.row.querySelector('td.name');
    const oldName = td.textContent.trim();
    if (new_name !== undefined) {
      if (typeof new_name !== 'string' || new_name.trim() === '')
        throw new Error('Name cannot be blank');
      td.textContent = new_name.trim();
    }
    return oldName;
  }

  /**
   * Getter/setter for a result at the given index.
   * On get: Returns Data instance from data-value and unit, or null if no data-value.
   * On set: Handles Data or Error, updates text, data-value, classes, and unit as needed.
   * Ensures value is number, boolean, vector of numbers, or text; no objects.
   * @param {number} idx - The result column index (0-based).
   * @param {Data|Error} [new_value] - If provided, sets the new value (Data or Error).
   * @returns {Data|null} The prior value (Data or null).
   * @throws {Error} If invalid index, type, or conversion issues.
   */
  result(idx, new_value) {
    const resultTds = this.row.querySelectorAll('td.result')
    const unitTd = this.row.querySelector('td.unit');
    if (idx < 0 || idx >= resultTds.length)
      throw new Error('Invalid result index');
    const td = resultTds[idx];
    if (new_value === undefined) {
      // Getter
      const dataValStr = td.getAttribute('data-value')
      if (!dataValStr)
        return null;
      let value = dataValStr;
      try {
        value = JSON.parse(dataValStr);
      } catch (e) {
        // If parse fails, treat as plain string
      }
      const data = new Data(value, this.unit())
      if (data.type() === 'unknown')
        return null;
      return data;
    } else {
      // Setter
      const prior = this.result(idx);
      if (!(new_value instanceof Data) && !(new_value instanceof Error))
        throw new Error('New value must be Data or Error instance');
      td.classList.remove('error');
      if (new_value instanceof Error) {
        td.textContent = new_value.message;
        td.removeAttribute('data-value');
        td.classList.add('error');
      } else {
        // Handle Data
        const typ = new_value.type();
        if (typ === 'unknown')
          throw new Error('Invalid value type: must be number, boolean, vector of numbers, or text');
        if (new_value.unit() != '')
          unitTd.setAttribute('data-computed-unit', new_value.unit());
        else
          unitTd.removeAttribute('data-computed-unit');
        let targetUnit;
        if (unitTd.hasAttribute('data-value')) {
          targetUnit = unitTd.getAttribute('data-value');
          unitTd.textContent = targetUnit;
          unitTd.classList.remove('unit-empty');
        } else {
          targetUnit = new_value.unit();
          // unitTd.textContent = targetUnit;
          unitTd.classList.add('unit-empty');
        }
        let toSet = new_value;
        if (targetUnit !== new_value.unit() && targetUnit !== '' && new_value.unit() !== '') {
          const [converted] = new_value.asGivenUnit(targetUnit);
          toSet = converted;
        }
        const val = toSet.val();
        const text = formatResult(val, typ)
        td.textContent = text;
        td.setAttribute('data-value', val === '' ? '' : JSON.stringify(val));
      }
      return prior;
    }
  }

  /**
   * Sets or queries the plot-checkbox in this row's add-result cell.
   * @param {'checked'|'cleared'|null|'show'|'hidden'} a - Action to perform on the checkbox.
   * @returns {boolean} The current checked state of the checkbox (true if checked, false otherwise).
   */
  plotCheckbox(a) {
    const addResultTd = this.row.querySelector('td.add-result');
    if (!addResultTd) return false;
    const checkbox = addResultTd.querySelector('input.plot-checkbox');
    if (!checkbox) return false;
    if (a === 'checked') {
      checkbox.checked = true;
      checkbox.style.display = 'inline';
    } else if (a === 'cleared') {
      checkbox.checked = false;
      checkbox.style.display = 'inline';
    } else if (a === 'hidden') {
      checkbox.style.display = 'none';
    } else if (a === 'show') {
      checkbox.style.display = 'inline';
    } else if (a == null) {
      // do not change state, just return
    } else 
      throw new Error('Invalid argument {a} for plotCheckbox');
    return !!checkbox.checked;
  }
}

/**
 * Converts a regular row to a 4-column title row with description spanning name, formula, result, and add-result columns.
 * @param {HTMLTableRowElement} row - The table row to convert.
 */
function convertToTitle(row) {
  if (row.cells.length === 4 && row.querySelector('.description') && row.querySelector('.description').hasAttribute('colspan')) {
    return; // Already a 4-column row, no changes needed
  }

  const table = row.closest('table');
  const resultThs = table.tHead.rows[0].querySelectorAll('.result');
  const numResults = resultThs.length;

  // Calculate colspan: name (1) + formula (1) + result columns + add-result (1)
  // Fix: add 1 more to colspan to match the number of columns
  const colspan = 2 + numResults + 2;

  // Get existing cells
  const handleTd = row.querySelector('.handle');
  const descriptionTd = row.querySelector('.description');
  const unitTd = row.querySelector('.unit');
  const deleteTd = row.querySelector('.delete');

  // Remove all cells
  while (row.cells.length > 0) {
    row.deleteCell(0);
  }

  // Rebuild row with 4 columns: handle, description (with colspan), unit, delete
  row.appendChild(handleTd);
  descriptionTd.setAttribute('colspan', colspan);
  row.appendChild(descriptionTd);
  row.appendChild(unitTd);
  row.appendChild(deleteTd);

  // Remove from row_collection if it had a name
  const nameTd = row.querySelector('.name');
  if (nameTd) {
    const name = nameTd.getAttribute('data-value') || nameTd.textContent.trim();
    if (name !== '') {
      table.row_collection.removeRow(name);
      table.pubsub.publish('recalculation', 'go');
    }
  }
}


/**
 * Reverses a 4-column title row back to a normal row with name, formula, and result columns.
 * @param {HTMLTableRowElement} row - The table row to convert back.
 */
function convertFromTitle(row) {
  if (!(row.cells.length === 4 && row.querySelector('.description') && row.querySelector('.description').hasAttribute('colspan'))) {
    return; // Not a 4-column title row
  }

  const table = row.closest('table');
  const resultThs = table.tHead.rows[0].querySelectorAll('.result');
  const numResults = resultThs.length;

  // Save references to existing cells
  const handleTd = row.querySelector('.handle');
  const descriptionTd = row.querySelector('.description');
  const unitTd = row.querySelector('.unit');
  const deleteTd = row.querySelector('.delete');

  // Remove all cells
  while (row.cells.length > 0) {
    row.deleteCell(0);
  }

  // Rebuild row: handle, description, name, formula, result(s), add-result, unit, delete
  row.appendChild(handleTd);

  // Description cell (restore as normal cell, not spanning)
  descriptionTd.removeAttribute('colspan');
  descriptionTd.classList.remove(
    'title', 'subtitle', 'subsubtitle',
    'title_c', 'subtitle_c', 'subsubtitle_c',
    'title_l', 'subtitle_l', 'subsubtitle_l'
  );
  descriptionTd.contentEditable = 'true';
  descriptionTd.tabIndex = 0;
  row.appendChild(descriptionTd);

  // Name cell
  const nameTd = document.createElement('td');
  nameTd.className = 'name';
  nameTd.contentEditable = 'true';
  nameTd.tabIndex = 0;
  row.appendChild(nameTd);

  // Formula cell
  const formulaTd = document.createElement('td');
  formulaTd.className = 'formula';
  formulaTd.contentEditable = 'true';
  formulaTd.tabIndex = 0;
  row.appendChild(formulaTd);

  // Result cells
  for (let i = 0; i < numResults; i++) {
    const resultTd = document.createElement('td');
    resultTd.className = 'result';
    resultTd.contentEditable = 'true';
    resultTd.tabIndex = 0;
    row.appendChild(resultTd);
  }

  // Add-result cell
  const addResultTd = document.createElement('td');
  addResultTd.className = 'add-result';
  row.appendChild(addResultTd);

  // Unit cell (reuse existing)
  row.appendChild(unitTd);

  // Delete cell (reuse existing)
  row.appendChild(deleteTd);
}

export { TableRow, convertToTitle, convertFromTitle };
