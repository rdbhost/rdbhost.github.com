import { buildDependencyTree, dependencyOrder, getRootNodes, getLeafNodes, getInputNodes } from '../js/evaluator.js';
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
  QUnit.test('buildDependencyTree handles formulas with functions', function(assert) {
    // Test formulas that use functions like sin(), cos(), etc.
    const rows = new Map([
      ['A', makeTableRow('A', 'sin(B)')],
      ['B', makeTableRow('B', '42')],
      ['C', makeTableRow('C', 'cos(A) + B')],
      ['D', makeTableRow('D', 'C + 1')]
    ]);
    const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // B is a simple value, A depends on B, C depends on A and B, D depends on C
    assert.ok(order.indexOf('B') < order.indexOf('A'), 'B before A');
    assert.ok(order.indexOf('A') < order.indexOf('C'), 'A before C');
    assert.ok(order.indexOf('C') < order.indexOf('D'), 'C before D');
  });

  QUnit.test('buildDependencyTree handles formulas with simple values', function(assert) {
    // Test formulas that are just simple values (numbers, strings)
    const rows = new Map([
      ['A', makeTableRow('A', '123')],
      ['B', makeTableRow('B', 'hello')],
      ['C', makeTableRow('C', 'A + 1')],
      ['D', makeTableRow('D', 'B')]
    ]);
    const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // A and B are simple values, C depends on A, D depends on B
    assert.ok(order.indexOf('A') < order.indexOf('C'), 'A before C');
    assert.ok(order.indexOf('B') < order.indexOf('D'), 'B before D');
  });
  hooks.beforeEach(function() {
    // Use real TableRow for test rows
    this.mockRows = new Map([
      ['A', makeTableRow('A', '')],
      ['B', makeTableRow('B', '')],
      ['C', makeTableRow('C', 'A+B')],
      ['D', makeTableRow('D', 'C')],
      ['E', makeTableRow('E', '')],
      ['F', makeTableRow('F', 'E')]
    ]);
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
    const rows = new Map([
      ['A', makeTableRow('A', 'B')],
      ['B', makeTableRow('B', 'A')]
    ]);
  const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // Should not infinite loop, and should not include cycle nodes
    assert.ok(Array.isArray(order), 'Order is an array');
    assert.deepEqual(order.sort(), ['A','B'].sort(), 'Order includes all nodes');
  });

  QUnit.test('dependencyOrder tolerates complex cycles', function(assert) {
    // More complex cycle: A = B, B = C, C = A
    const rows = new Map([
      ['A', makeTableRow('A', 'B')],
      ['B', makeTableRow('B', 'C')],
      ['C', makeTableRow('C', 'A')]
    ]);
  const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    assert.ok(Array.isArray(order), 'Order is an array');
    assert.deepEqual(order.sort(), ['A','B','C'].sort(), 'Order includes all nodes in the cycle');
  });

  QUnit.test('dependencyOrder with group roots', function(assert) {
    // Disconnected subgraphs
    const rows = new Map([
      ['A', makeTableRow('A', '')],
      ['B', makeTableRow('B', '')],
      ['C', makeTableRow('C', 'A')],
      ['D', makeTableRow('D', '')]
    ]);
  const tree = buildDependencyTree(rows);
    const order = dependencyOrder(tree);
    // D is independent, A and B are independent, C depends on A
    assert.ok(order.includes('D'), 'D is included');
    assert.ok(order.indexOf('C') > order.indexOf('A'), 'C after A');
  });
});

// Test getRootNodes and getLeafNodes using QUnit
QUnit.module('Dependency Roots and Leafs');

QUnit.test('getInputNodes returns correct input leaf nodes', function(assert) {
  // A and B are inputs (no formula), C depends on A, D is a leaf but has a formula
  const rows = new Map([
    ['A', { name: () => 'A', formula: () => '' }],
    ['B', { name: () => 'B', formula: () => '' }],
    ['C', { name: () => 'C', formula: () => 'A' }],
    ['D', { name: () => 'D', formula: () => '1' }],
    ['E', { name: () => 'E', formula: () => 'C + D' }]
  ]);
  const tree = buildDependencyTree(rows);
  const inputs = getInputNodes(tree, rows);
  // Only A and B are leafs with no formula
  assert.deepEqual(inputs.sort(), ['A'].sort(), 'A is input leaf nodes');
});

QUnit.test('getRootNodes returns correct root nodes', function(assert) {
  const rows = new Map([
    ['A', { name: () => 'A', formula: () => '' }],
    ['B', { name: () => 'B', formula: () => 'A' }],
    ['C', { name: () => 'C', formula: () => 'B' }],
    ['D', { name: () => 'D', formula: () => 'B' }],
    ['E', { name: () => 'E', formula: () => 'A' }],
    ['F', { name: () => 'F', formula: () => 'D + E' }]
  ]);
  const tree = buildDependencyTree(rows);
  const roots = getRootNodes(tree);
  // Roots: nobody depends on them (C and F)
  assert.deepEqual(roots.sort(), ['C', 'F'].sort(), 'C and F are root nodes (nobody depends on them)');
});


QUnit.test('getRootNodes ignores orphans', function(assert) {
  const rows = new Map([
    ['A', { name: () => 'A', formula: () => '' }],
    ['B', { name: () => 'B', formula: () => 'A' }],
    ['C', { name: () => 'C', formula: () => '' }],
    ['D', { name: () => 'D', formula: () => 'B' }],
    ['E', { name: () => 'E', formula: () => 'A' }],
    ['F', { name: () => 'F', formula: () => 'D + E' }]
  ]);
  const tree = buildDependencyTree(rows);
  const roots = getRootNodes(tree);
  // Roots: nobody depends on them (C and F)
  assert.deepEqual(roots.sort(), ['F'].sort(), 'C and F are root nodes, C is orphan');
});

QUnit.test('getLeafNodes returns correct leaf nodes', function(assert) {
  const rows = new Map([
    ['A', { name: () => 'A', formula: () => '' }],
    ['B', { name: () => 'B', formula: () => 'A' }],
    ['C', { name: () => 'C', formula: () => 'B' }],
    ['D', { name: () => 'D', formula: () => 'B' }],
    ['E', { name: () => 'E', formula: () => 'A' }],
    ['F', { name: () => 'F', formula: () => 'D + E' }]
  ]);
  const tree = buildDependencyTree(rows);
  const leafs = getLeafNodes(tree);
  // Leafs: depend on nothing (A)
  assert.deepEqual(leafs.sort(), ['A'].sort(), 'A is a leaf node (depends on nothing)');
});

QUnit.test('getLeafNodes ignores orphans', function(assert) {
  const rows = new Map([
    ['A', { name: () => 'A', formula: () => '' }],
    ['B', { name: () => 'B', formula: () => 'A' }],
    ['C', { name: () => 'C', formula: () => 'B' }],
    ['D', { name: () => 'D', formula: () => '' }],
    ['E', { name: () => 'E', formula: () => '' }],
    ['F', { name: () => 'F', formula: () => 'D + A' }]
  ]);
  const tree = buildDependencyTree(rows);
  const leafs = getLeafNodes(tree);
  // Leafs: depend on nothing (A)
  assert.deepEqual(leafs.sort(), ['A','D'].sort(), 'A, D are leaf nodes (depend on nothing)');
});
