
// evaluator.js

import { evaluate } from './parser/formula_evaluator.js';
import { parseFormula } from './parser/formula_parser.js';
import { Data } from './dim_data.js';
import { TableRow } from './table_row.js';

const constants = {
  'pi': new Data(Math.PI,''),
  'e': new Data(Math.E, '')
};

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
      } catch (e) {
        row.result(idx, e);
      }
    }
  }
  const table = document.querySelector('table#main-sheet');
  table.pubsub.publish('enforce-row-rules');
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
  //const rowsObj = Object.fromEntries(Array.from(rowCollection.rows.entries()).map(([k, v]) => [k, v]));
  //const tree = buildDependencyTree(rowsObj);
  const tree = buildDependencyTree(rowCollection.rows); 
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
  const spaceLikeRegex = /[\u00A0\u2000-\u200A\u202F\u205F\u3000\s]/g;
  formula = formula.replace(spaceLikeRegex, ' ');
  try {
    const ast = parseFormula(formula);
    const data = evaluate(ast, dictionary);
    return (unit && data._unit) ? data.asGivenUnit(unit) : data;
  } catch (e) {
    return e;
  }
}

/**
 * Builds a dependency tree for the given row collection.
 * Input values are distant leaves, formulas are intermediate nodes.
 * Subtrees without formula interdependence are joined by a 'group' node.
 * Cycles are detected and marked as type 'cycle'.
 * @param {Object} rows - Object of rowName: rowObj (must have .formula and .name)
 * @returns {Object} The dependency tree.
 */
function buildDependencyTree(rows) {
  function getDependencies(row) {
    if (!row || typeof row.name !== 'function' || typeof row.formula !== 'function') return [];
    const formula = row.formula();
    if (!formula) return [];
    try {
      const ast = parseFormula(formula);
      // Recursively collect all variable names from AST
      const deps = new Set();
      function walk(node) {
        if (!node) return;
        if (typeof node.type === 'string' && node.type.toLowerCase() === 'variable' && node.name !== row.name()) {
          deps.add(node.name);
        }
        if (node.arguments && Array.isArray(node.arguments)) {
          for (const arg of node.arguments) walk(arg);
        }
        if (node.left) walk(node.left);
        if (node.right) walk(node.right);
        if (node.argument) walk(node.argument);
      }
      walk(ast.root);
      return Array.from(deps);
    } catch (e) {
      // If formula can't be parsed, treat as no dependencies
      return [];
    }
  }

  const nodes = {};
  for (const [name, row] of rows) {
    // const row = rows[name];
    if (!row || typeof row.name !== 'function' || typeof row.formula !== 'function') continue;
    nodes[name] = {
      name: row.name(),
      formula: row.formula(),
      dependencies: [],
      type: row.formula() ? 'formula' : 'input',
    };
  }

  for (const name in nodes) {
    const node = nodes[name];
    if (node.type === 'formula') {
      node.dependencies = getDependencies(rows.get(name));
    }
  }

  const referenced = new Set();
  for (const name in nodes) {
    for (const dep of nodes[name].dependencies) {
      referenced.add(dep);
    }
  }
  let roots = Object.keys(nodes).filter(name => !referenced.has(name));
  // If no roots (pure cycle), treat all nodes as roots
  if (roots.length === 0) {
    roots = Object.keys(nodes);
  }

  function buildSubtree(name, path = new Set()) {
    if (name in constants) {
      return { name, type: 'constant', dependencies: [] };
    }
    if (path.has(name)) {
      return { name, type: 'cycle', dependencies: [] };
    }
    path.add(name);
    const node = nodes[name];
    if (!node) {
      return { name, type: 'unknown', dependencies: [] };
    }
    const deps = node.dependencies.map(dep => buildSubtree(dep, new Set(path)));
    return {
      name: node.name,
      type: node.type,
      dependencies: deps,
    };
  }
  let tree;
  if (roots.length === 1) {
    tree = buildSubtree(roots[0]);
  } else {
    tree = {
      type: 'group',
      dependencies: roots.map(name => buildSubtree(name)),
    };
  }
  return tree;
}

/**
 * Returns a list of row names in dependency order (independent first, roots last).
 * @param {Object} tree - The dependency tree as returned by buildDependencyTree.
 * @returns {string[]} List of row names in dependency order.
 */
function dependencyOrder(tree) {
  const order = [];
  const seen = new Set();
  const inputNodes = [];
  function collectInputs(node) {
    if (!node || seen.has(node.name)) return;
    seen.add(node.name);
    if (node.type === 'group') {
      for (const dep of node.dependencies) {
        collectInputs(dep);
      }
    } else if (node.type === 'cycle') {
      inputNodes.push(node.name);
      return;
    } else if (node.type === 'input') {
      inputNodes.push(node.name);
      for (const dep of (node.dependencies || [])) {
        collectInputs(dep);
      }
    } else {
      for (const dep of (node.dependencies || [])) {
        collectInputs(dep);
      }
    }
  }
  collectInputs(tree);

  const formulaSeen = new Set();
  function visitFormulas(node, path = new Set()) {
    if (!node || path.has(node.name)) return;
    if (node.type === 'group') {
      for (const dep of node.dependencies) {
        visitFormulas(dep, path);
      }
    } else if (node.type === 'cycle') {
      if (!formulaSeen.has(node.name)) {
        formulaSeen.add(node.name);
        order.push(node.name);
      }
      return;
    } else if (node.type === 'formula') {
      for (const dep of (node.dependencies || [])) {
        visitFormulas(dep, new Set([...path, node.name]));
      }
      if (!formulaSeen.has(node.name)) {
        formulaSeen.add(node.name);
        order.push(node.name);
      }
    } else {
      for (const dep of (node.dependencies || [])) {
        visitFormulas(dep, new Set([...path, node.name]));
      }
    }
  }
  visitFormulas(tree);

  // Remove any duplicates between inputNodes and order, preserving order
  const result = [...inputNodes];
  for (const name of order) {
    if (!inputNodes.includes(name)) {
      result.push(name);
    }
  }
  return result;
}

// Returns a list of leaf node names (depends on nothing)
function getLeafNodes(tree) {
  // Traverse the tree and collect names of nodes with no dependencies
  const leafs = [];
  function visit(node, top=true) {
    if (!node) return;
    if (node.type === 'group' && node.dependencies) {
      for (const child of node.dependencies) visit(child);
    } else if (node.type && node.dependencies !== undefined) {
      if (!top && (!node.dependencies || node.dependencies.length === 0)) {
        leafs.push(node.name);
      }
      if (Array.isArray(node.dependencies)) {
        for (const child of node.dependencies) visit(child, false);
      }
    }
  }
  visit(tree);
  // Remove duplicates
  return Array.from(new Set(leafs));
}

// Returns a list of input node names: leaf nodes with no formula (inputs)
function getInputNodes(tree) {
  // Traverse the tree and collect names of nodes with no dependencies
  const leafs = [];
  function visit(node, top=true) {
    if (!node) return;
    if (node.type === 'group' && node.dependencies) {
      for (const child of node.dependencies) visit(child);
    } else if (node.type && node.dependencies !== undefined) {
      if (!top && (!node.dependencies || node.dependencies.length === 0)) {
        if (!top && (node.type == 'input'))
          leafs.push(node.name);
      }
      if (Array.isArray(node.dependencies)) {
        for (const child of node.dependencies) visit(child, false);
      }
    }
  }
  visit(tree);
  // Remove duplicates
  return Array.from(new Set(leafs));
}

// Returns a list of root node names (nobody depends on them)
function getRootNodes(tree) {
  // Traverse the tree and collect names of nodes with no dependencies
  const roots = [];
  function visit(node, top=true) {
    if (!node) return;
    if (node.type === 'group' && node.dependencies) {
      for (const child of node.dependencies) visit(child);
    } else if (node.type && node.dependencies !== undefined) {
      if (top && node.dependencies.length > 0) {
        roots.push(node.name);
      }
      return;
      //if (Array.isArray(node.dependencies)) {
      //  for (const child of node.dependencies) visit(child, false);
      //}
    }
  }
  visit(tree);
  // Remove duplicates
  return Array.from(new Set(roots));
}

export { setupEvaluator, evaluateNow, recalculateRows, recalculateColumn, buildDependencyTree, dependencyOrder, getRootNodes, getLeafNodes, getInputNodes };