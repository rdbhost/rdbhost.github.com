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
    if (!element || element.tagName !== 'TR') {
      throw new Error('Invalid table row element');
    }
    this.row = element;
    this.validate();
  }

  /**
   * Updates the row with a new <tr> element.
   * Replaces the current row element, including in the DOM if attached.
   * @param {HTMLElement} newElement - The new <tr> element.
   * @throws {Error} If the element is invalid or does not meet column criteria.
   */
  update(newElement) {
    if (!newElement || newElement.tagName !== 'TR') {
      throw new Error('Invalid table row element');
    }
    if (this.row.parentNode) {
      this.row.parentNode.replaceChild(newElement, this.row);
    }
    this.row = newElement;
    this.validate();
  }

  /**
   * Validates the row structure and column classes.
   * @private
   * @throws {Error} If validation fails.
   */
  validate() {
    const tds = Array.from(this.row.querySelectorAll('td'));
    if (tds.length < 8) {
      throw new Error('Insufficient columns (minimum 8 required)');
    }
    let pos = 0;
    this._checkClass(tds[pos++], 'handle');
    this._checkClass(tds[pos++], 'description');
    this._checkClass(tds[pos++], 'name');
    this._checkClass(tds[pos++], 'formula');
    const resultEnd = tds.length - 3;
    if (resultEnd <= pos) {
      throw new Error('At least one result column required');
    }
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
    if (!td.classList.contains(cls)) {
      throw new Error(`Expected class "${cls}" on column`);
    }
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
    return this.row.querySelector('td.unit').textContent.trim();
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
      if (typeof new_name !== 'string' || new_name.trim() === '') {
        throw new Error('Name cannot be blank');
      }
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
    if (idx < 0 || idx >= resultTds.length) {
      throw new Error('Invalid result index');
    }
    const td = resultTds[idx];
    if (new_value === undefined) {
      // Getter
      const dataValStr = td.getAttribute('data-value')
      if (!dataValStr) {
        return null;
      }
      let value = dataValStr;
      try {
        value = JSON.parse(dataValStr);
      } catch (e) {
        // If parse fails, treat as plain string
      }
      const data = new Data(value, this.unit())
      if (data.type() === 'unknown') {
        return null;
      }
      return data;
    } else {
      // Setter
      const prior = this.result(idx);
      if (!(new_value instanceof Data) && !(new_value instanceof Error)) {
        throw new Error('New value must be Data or Error instance');
      }
      td.classList.remove('converted', 'error');
      td.removeAttribute('data-convert-factor');
      if (new_value instanceof Error) {
        td.textContent = new_value.message;
        td.removeAttribute('data-value');
        td.classList.add('error');
        return prior;
      }
      // Handle Data
      const typ = new_value.type();
      if (typ === 'unknown') {
        throw new Error('Invalid value type: must be number, boolean, vector of numbers, or text');
      }
      let toSet = new_value;
      let currentUnit = this.unit();
      if (currentUnit === '') {
        const unitTd = this.row.querySelector('td.unit');
        unitTd.textContent = new_value.unit();
        currentUnit = new_value.unit();
      } else if (currentUnit !== new_value.unit() && new_value.unit() !== '') {
        const [converted, factor] = new_value.asGivenUnit(currentUnit);
        toSet = converted;
        td.classList.add('converted');
        td.setAttribute('data-convert-factor', factor.toString());
      }
      // Set display text and data-value
      const val = toSet.val();

      text = formatResult(val, typ)

      td.textContent = text;
      td.setAttribute('data-value', JSON.stringify(val));
      return prior;
    }
  }
}

export { TableRow };