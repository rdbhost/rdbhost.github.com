// evaluator.js

import { evaluate } from './parser/formula_evaluator.js';
import { parseFormula } from './parser/formula_parser.js';
import { enforceRowRules } from './sheet_interface.js';
import { Data } from './dim_data.js';

/**
 * Sets up the evaluator by subscribing to recalculation events.
 */
function setupEvaluator() {
  const table = document.querySelector('table#main-sheet');
  if (!table || !table.row_collection || !table.pubsub) {
    console.warn('Row collection or PubSub not available');
    return;
  }
  table.pubsub.subscribe('recalculation', (message) => {
    const rowCollection = table.row_collection;
    if (rowCollection.rows.size === 0) {
      return;
    }
    // Get number of result columns from first row
    const firstRow = rowCollection.rows.values().next().value;
    const numColumns = firstRow.row.querySelectorAll('td.result').length;

    for (let idx = 0; idx < numColumns; idx++) {
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
  });
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
  try {
    const ast = parseFormula(formula);
    const data = evaluate(ast, dictionary);
    return unit ? data.asGivenUnit(unit) : data;
  } catch (e) {
    return new Data(e);
  }
}

export { setupEvaluator, evaluateNow };