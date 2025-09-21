// js/row_collection.js

import { TableRow } from './table_row.js';
import { Data } from './dim_data.js'
import { parseFormula } from './parser/formula_parser.js';

const constants = {
  'pi': new Data(Math.PI,''),
  'e': new Data(Math.E, '')
}


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
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop in constants)
          return constants[prop];
        const row = this.getRow(prop);
        if (row) {
          return row.result(idx);
        }
        return undefined;
      },
      set: (target, prop, value) => {
        const row = this.getRow(prop);
        if (row) {
          row.result(idx, value);
          return true;
        }
        return false;
      }
    });
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
    if (!(row instanceof TableRow)) return [];
    const formula = row.formula();
    if (!formula) return [];
    try {
      const ast = parseFormula(formula);
      // Recursively collect all variable names from AST
      const deps = new Set();
      function walk(node) {
        if (!node) return;
        if (node.type.toLowerCase() === 'variable' && node.name !== row.name()) {
          deps.add(node.name);
        }
        if (node.args && Array.isArray(node.args)) {
          for (const arg of node.args) walk(arg);
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
  for (const name in rows) {
    const row = rows[name];
    if (!(row instanceof TableRow)) continue;
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
      node.dependencies = getDependencies(rows[name]);
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


document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) {
    table.row_collection = new RowCollection([]);
  }
});

export { RowCollection, constants, buildDependencyTree, dependencyOrder };