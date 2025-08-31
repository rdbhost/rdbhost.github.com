// evaluator.js

import { evaluate } from './parser/formula_evaluator.js';
import { parseFormula } from './parser/formula_parser.js';

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
          } catch (e) {
            row.result(idx, e);
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', setupEvaluator);

export { setupEvaluator };