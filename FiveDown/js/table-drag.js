// js/table-drag.js
import { PubSub } from './lib/pubsub.js';

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('#main-sheet');
  if (!table) return;

  // Find column indices
  const headerRow = table.rows[0];
  const headers = Array.from(headerRow.cells);
  const indices = {
    desc: headers.findIndex(th => th.textContent.trim().toLowerCase() === 'description'),
    name: headers.findIndex(th => th.textContent.trim().toLowerCase() === 'name'),
    formula: headers.findIndex(th => th.textContent.trim().toLowerCase() === 'formula'),
    unit: headers.findIndex(th => th.textContent.trim().toLowerCase() === 'unit'),
    results: headers.reduce((acc, th, i) => {
      if (th.classList.contains('result')) acc.push(i);
      return acc;
    }, [])
  };
  table.indices = indices;

  // 2. Setup drag handlers
  // Column dragging (only among .result columns)
  let draggedColIndex = -1;
  table.addEventListener('dragstart', e => {
    if (e.target.tagName === 'TH' && e.target.classList.contains('result')) {
      draggedColIndex = e.target.cellIndex;
      e.target.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    }
  });

  table.addEventListener('dragover', e => {
    if (e.target.tagName === 'TH' && e.target.classList.contains('result')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  table.addEventListener('drop', e => {
    if (e.target.tagName === 'TH' && e.target.classList.contains('result') && e.target.cellIndex !== draggedColIndex) {
      e.preventDefault();
      const targetIndex = e.target.cellIndex;
      const bounding = e.target.getBoundingClientRect();
      const offset = e.clientX - bounding.left;
      const isAfter = offset > bounding.width / 2;
      let toIndex = isAfter ? targetIndex + 1 : targetIndex;

      // Move columns across all rows
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.cells.length <= Math.max(draggedColIndex, toIndex)) continue;
        const cellToMove = row.cells[draggedColIndex];
        const refCell = (toIndex < row.cells.length) ? row.cells[toIndex] : null;
        row.insertBefore(cellToMove, refCell);
      }
    }
  });

  table.addEventListener('dragend', e => {
    if (e.target.tagName === 'TH' && e.target.classList.contains('result')) {
      e.target.style.opacity = '1';
      draggedColIndex = -1;
    }
  });

  // Row dragging (using left column as handle)
  let draggedRow = null;
  table.addEventListener('dragstart', e => {
    if (e.target.tagName === 'TD' && e.target.cellIndex === 0) {
      draggedRow = e.target.parentNode;
      e.target.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    }
  });

  table.addEventListener('dragover', e => {
    if (e.target.tagName === 'TD' && e.target.cellIndex === 0) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  table.addEventListener('drop', e => {
    if (e.target.tagName === 'TD' && e.target.cellIndex === 0 && e.target.parentNode !== draggedRow) {
      e.preventDefault();
      const targetRow = e.target.parentNode;
      const bounding = e.target.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      const isAfter = offset > bounding.height / 2;
      const toRow = isAfter ? targetRow.nextSibling : targetRow;
      table.tBodies[0].insertBefore(draggedRow, toRow);
    }
  });

  table.addEventListener('dragend', e => {
    if (e.target.tagName === 'TD' && e.target.cellIndex === 0) {
      e.target.style.opacity = '1';
      draggedRow = null;
    }
  });

  // 3. Delete all rows
  const tbody = table.tBodies[0];
  while (tbody.rows.length > 0) {
    tbody.deleteRow(0);
  }

  // 4. Run ensure_blank_five
  table.pubsub.publish('ensure-blank-five');
});

