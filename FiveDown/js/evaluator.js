// evaluator.js

import { evaluate } from './parser/formula_evaluator.js';
import { parseFormula } from './parser/formula_parser.js';
import { enforceRowRules } from './sheet_interface.js';
import { Data } from './dim_data.js';
import { buildDependencyTree, dependencyOrder } from './row_collection.js';

/**
 * Recalculates all rows for a single result column.
 * @param {RowCollection} rowCollection - The row collection to recalculate.
 * @param {number} idx - The column index to recalculate.
 */
function recalculateColumn(rowCollection, idx) {
  if (!rowCollection || rowCollection.rows.size === 0) {
    return;
  }
  const proxy = rowCollection.getColumnProxy(idx);
  for (const row of rowCollection.rows.values()) {
    const formula = row.formula();
    if (formula) {
      try {
        const ast = parseFormula(formula);
        const value = evaluate(ast, proxy);
        row.result(idx, value);
        enforceRowRules(row.row);
      } catch (e) {
        row.result(idx, e);
        enforceRowRules(row.row);
      }
    }
  }
}

/**
 * Recalculates all rows for all columns in the table.
 * Intended as the event handler for recalculation events.
 */
function recalculateRows() {
  const table = document.querySelector('table#main-sheet');
  if (!table || !table.row_collection) {
    console.warn('Row collection not available');
    return;
  }
  const rowCollection = table.row_collection;
  if (rowCollection.rows.size === 0) {
    return;
  }
  // Reorder rows in dependency order
  const rowsObj = Object.fromEntries(Array.from(rowCollection.rows.entries()).map(([k, v]) => [k, v]));
  const tree = buildDependencyTree(rowsObj);
  const order = dependencyOrder(tree);
  // Create a new Map in dependency order
  const newRows = new Map();
  for (const name of order) {
    if (rowCollection.rows.has(name)) {
      newRows.set(name, rowCollection.rows.get(name));
    }
  }
  // Add any rows not in order (shouldn't happen, but for safety)
  for (const [name, row] of rowCollection.rows.entries()) {
    if (!newRows.has(name)) {
      newRows.set(name, row);
    }
  }
  rowCollection.rows = newRows;
  // Get number of result columns from first row
  const firstRow = rowCollection.rows.values().next().value;
  const numColumns = firstRow.row.querySelectorAll('td.result').length;
  for (let idx = 0; idx < numColumns; idx++) {
    recalculateColumn(rowCollection, idx);
  }
}

/**
 * Sets up the evaluator by subscribing to recalculation events.
 */
function setupEvaluator() {
  const table = document.querySelector('table#main-sheet');
  if (!table || !table.row_collection || !table.pubsub) {
    console.warn('Row collection or PubSub not available');
    return;
  }
  table.pubsub.subscribe('recalculation', recalculateRows);
}

document.addEventListener('DOMContentLoaded', setupEvaluator);


/**
 * Parses and evaluates a formula using a dictionary of named values, converts the result to the specified unit, and returns a Data instance.
 * @param {string} formula - The formula to parse and evaluate.
 * @param {Object} dictionary - An object mapping names to Data instances.
 * @param {string} unit - The target unit to convert the result to.
 * @returns {Data} The result of the evaluation as a Data instance, converted to the specified unit.
 */
function evaluateNow(formula, dictionary, unit) {
  if (formula === null || formula.trim() === '') 
    return new Data('');
  try {
    const ast = parseFormula(formula);
    const data = evaluate(ast, dictionary);
    return (unit && data._unit) ? data.asGivenUnit(unit) : data;
  } catch (e) {
    return new Data(e);
  }
}

export { setupEvaluator, evaluateNow, recalculateRows, recalculateColumn };