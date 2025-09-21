import { buildDependencyTree, dependencyOrder } from '../js/row_collection.js';
import { TableRow } from '../js/table_row.js';

// Helper: create a TableRow from name and formula
function makeTableRow(name, formula) {
  const tr = document.createElement('tr');
  // 8 columns: handle, description, name, formula, result, add-result, unit, delete
  const classes = ['handle', 'description', 'name', 'formula', 'result', 'add-result', 'unit', 'delete'];
  for (let i = 0; i < 8; i++) {
    const td = document.createElement('td');
    td.classList.add(classes[i]); 
    tr.appendChild(td);
  }
  tr.querySelector('td.name').textContent = name;
  const formulaTd = tr.querySelector('td.formula');
  formulaTd.textContent = formula || '';
  formulaTd.setAttribute('data-value', formula || '');
  return new TableRow(tr);
}

QUnit.module('Dependency Tree and Order', hooks => {
  hooks.beforeEach(function() {
    // Use real TableRow for test rows
    this.mockRows = {
      A: makeTableRow('A', ''),
      B: makeTableRow('B', ''),
      C: makeTableRow('C', 'A+B'),
      D: makeTableRow('D', 'C'),
      E: makeTableRow('E', ''),
      F: makeTableRow('F', 'E')
    };
  });

  QUnit.test('buildDependencyTree creates correct structure', function(assert) {
    const tree = buildDependencyTree(this.mockRows);
    assert.ok(tree, 'Tree is created');
    // Should have a group node at the top
    assert.equal(tree.type, 'group', 'Top node is group');
    // Should have two subtrees (one for A-B-C-D, one for E-F)
    assert.equal(tree.dependencies.length, 2, 'Two independent subtrees');
    // Check that D is a root in one subtree
    const dSubtree = tree.dependencies.find(sub => dependencyOrder(sub).includes('D'));
    assert.ok(dSubtree, 'D subtree exists');
    // Check that F is a root in the other
    const fSubtree = tree.dependencies.find(sub => dependencyOrder(sub).includes('F'));
    assert.ok(fSubtree, 'F subtree exists');
  });

  QUnit.test('dependencyOrder returns correct order', function(assert) {
    const tree = buildDependencyTree(this.mockRows);
    const order = dependencyOrder(tree);
    // A and B and E are independent, C depends on A+B, D on C, F on E
    // So valid order: A, B, E, C, D, F (roots last)
    assert.deepEqual(order, ['A', 'B', 'E', 'C', 'D', 'F'], 'Order is correct');
  });

  QUnit.test('dependencyOrder tolerates simple cycles', function(assert) {
    // Cyclic graph: A = B, B = A
    const rows = {
      A: makeTableRow('A', 'B'),
      B: makeTableRow('B', 'A')
    };
    const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // Should not infinite loop, and should not include cycle nodes
    assert.ok(Array.isArray(order), 'Order is an array');
    assert.deepEqual(order.sort(), ['A','B'].sort(), 'Order includes all nodes');
  });

  QUnit.test('dependencyOrder tolerates complex cycles', function(assert) {
    // More complex cycle: A = B, B = C, C = A
    const rows = {
      A: makeTableRow('A', 'B'),
      B: makeTableRow('B', 'C'),
      C: makeTableRow('C', 'A')
    };
    const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    assert.ok(Array.isArray(order), 'Order is an array');
    assert.deepEqual(order.sort(), ['A','B','C'].sort(), 'Order includes all nodes in the cycle');
  });

  QUnit.test('dependencyOrder with group roots', function(assert) {
    // Disconnected subgraphs
    const rows = {
      A: makeTableRow('A', ''),
      B: makeTableRow('B', ''),
      C: makeTableRow('C', 'A'),
      D: makeTableRow('D', '')
    };
    const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // D is independent, A and B are independent, C depends on A
    assert.ok(order.includes('D'), 'D is included');
    assert.ok(order.indexOf('C') > order.indexOf('A'), 'C after A');
  });
});
