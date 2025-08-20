
// Module exporting ES classes for RowCollection and ColumnObjectWrapper
// Assuming TableRow is defined elsewhere; import if needed
import { TableRow } from './table_row_handler.js';

export class RowCollection {
  /**
   * Constructor taking a list of TableRow instances.
   * Tracks rows by their unique names in a Map.
   * @param {TableRow[]} tableRowHandlers - An array of TableRow objects.
   */
  constructor(tableRowHandlers = []) {
    if (!Array.isArray(tableRowHandlers)) {
      throw new Error('Constructor requires an array of TableRow instances.');
    }
    this.rowMap = new Map();
    tableRowHandlers.forEach(row => this.addRow(row));
  }

  /**
   * Adds a TableRow to the collection.
   * Ensures names are unique.
   * @param {TableRow} row - The TableRow to add.
   */
  addRow(row) {
    if (!(row instanceof TableRow)) {
      throw new Error('addRow requires a TableRow instance.');
    }
    const name = row.name().trim();
    if (!name) {
      throw new Error('Cannot add row with blank or undefined name.');
    }
    if (this.rowMap.has(name)) {
      throw new Error(`Row with name "${name}" already exists. Names must be unique.`);
    }
    this.rowMap.set(name, row);
  }

  /**
   * Removes a TableRow from the collection.
   * @param {TableRow} row - The TableRow to remove.
   */
  removeRow(row) {
    if (!(row instanceof TableRow)) {
      throw new Error('removeRow requires a TableRow instance.');
    }
    const name = row.name().trim();
    if (!this.rowMap.has(name)) {
      throw new Error('TableRow not found in the collection.');
    }
    this.rowMap.delete(name);
  }

  /**
   * Gets a TableRow by name.
   * @param {string} name - The name of the row to retrieve.
   * @returns {TableRow} The TableRow instance.
   */
  getRow(name) {
    const trimmedName = name.trim();
    if (!this.rowMap.has(trimmedName)) {
      throw new Error(`Row with name "${trimmedName}" not found.`);
    }
    return this.rowMap.get(trimmedName);
  }
}

export class ColumnObjectWrapper {
  /**
   * Constructor taking a RowCollection and a column index.
   * Returns a Proxy that allows object-like access to results by row name, with get and set support.
   * @param {RowCollection} rowCollection - The RowCollection instance.
   * @param {number} columnIndex - The 0-based column index for results.
   */
  constructor(rowCollection, columnIndex) {
    if (!(rowCollection instanceof RowCollection)) {
      throw new Error('Constructor requires a RowCollection instance.');
    }
    if (typeof columnIndex !== 'number' || columnIndex < 0) {
      throw new Error('Column index must be a non-negative number.');
    }
    this.rowCollection = rowCollection;
    this.columnIndex = columnIndex;

    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        // Attempt to get result from row by name
        const row = target.rowCollection.getRow(prop);
        return row.result(target.columnIndex);
      },
      set(target, prop, value) {
        if (prop in target) {
          throw new Error('Cannot set built-in properties of ColumnObjectWrapper.');
        }
        // Attempt to set result in row by name
        const row = target.rowCollection.getRow(prop);
        row.result(target.columnIndex, value);
        return true;
      }
    });
  }
}
