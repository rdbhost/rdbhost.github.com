// js/row_collection.js

import { TableRow } from './table_row.js';

/**
 * A collection of TableRow instances, keyed by their names.
 * @class
 */
class RowCollection {
  /**
   * Creates a new RowCollection.
   * @constructor
   * @param {Array<TableRow>} [rows=[]] - Initial rows to add.
   */
  constructor(rows = []) {
    this.rows = new Map();
    for (const row of rows) {
      this.addRow(row.name(), row);
    }
  }

  /**
   * Adds a row to the collection.
   * @param {string} name - The name key for the row.
   * @param {TableRow} row - The TableRow instance to add.
   * @throws {Error} If row is not a TableRow instance.
   */
  addRow(name, row) {
    if (!(row instanceof TableRow)) {
      throw new Error('Row must be an instance of TableRow');
    }
    this.rows.set(name, row);
  }

  /**
   * Retrieves a row by name.
   * @param {string} name - The name key.
   * @returns {TableRow|undefined} The row or undefined if not found.
   */
  getRow(name) {
    return this.rows.get(name);
  }

  /**
   * Removes a row by name.
   * @param {string} name - The name key.
   */
  removeRow(name) {
    this.rows.delete(name);
  }

  /**
   * Audits the collection to ensure keys match row names.
   * @throws {Error} If any mismatch is found.
   */
  audit() {
    for (const [key, row] of this.rows) {
      if (key !== row.name()) {
        throw new Error(`Mismatch: key "${key}" does not match row name "${row.name()}"`);
      }
    }
  }

  /**
   * Returns a column-dictionary for given result column
   * @param {number} idx - the chosen column
   * @returns {ColumnObjectWrapper}
   */
  getColumnProxy(idx) {
    return new ColumnObjectWrapper(this.rows, idx)
  }

}

/**
 * A proxy wrapper for accessing a specific result column across rows.
 * @class
 */
class ColumnObjectWrapper {
  /**
   * Creates a new ColumnObjectWrapper.
   * @constructor
   * @param {RowCollection} rowCollection - The collection of rows.
   * @param {number} idx - The result column index.
   * @returns {Proxy} A proxy for keyword access to the column.
   */
  constructor(rowCollection, idx) {
    this.rowCollection = rowCollection;
    this.idx = idx;
    return new Proxy({}, {
      get: (target, prop) => {
        const row = this.rowCollection.getRow(prop);
        if (row) {
          return row.result(this.idx);
        }
        return undefined;
      },
      set: (target, prop, value) => {
        const row = this.rowCollection.getRow(prop);
        if (row) {
          row.result(this.idx, value);
          return true;
        }
        return false;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) {
    table.row_collection = new RowCollection([]);
  }
});

export { RowCollection, ColumnObjectWrapper };