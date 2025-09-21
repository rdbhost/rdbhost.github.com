// js/drag_drop.js

let draggedRow = null;
let draggedTh = null;

function setupDragDrop(table) {
  const tbody = table.tBodies[0];
  const thead = table.tHead;

  tbody.addEventListener('dragstart', (e) => {
    const td = e.target;
    if (td.tagName === 'TD' && td.classList.contains('handle')) {
      draggedRow = td.parentNode;
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  tbody.addEventListener('dragover', (e) => {
    const tr = e.target.closest('tr');
    if (tr) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  tbody.addEventListener('drop', (e) => {
    const targetRow = e.target.closest('tr');
    if (targetRow && draggedRow && targetRow !== draggedRow) {
      const rect = targetRow.getBoundingClientRect();
      const y = e.clientY - rect.top;
      if (y < rect.height / 2) {
        targetRow.before(draggedRow);
      } else {
        targetRow.after(draggedRow);
      }
      ensureBlankFive(table); // Assuming ensureBlankFive is available or imported
    }
  });

  tbody.addEventListener('dragend', () => {
    draggedRow = null;
  });

  thead.addEventListener('dragstart', (e) => {
    const th = e.target;
    if (th.tagName === 'TH' && th.classList.contains('result')) {
      draggedTh = th;
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  thead.addEventListener('dragover', (e) => {
    const th = e.target.closest('th');
    if (th && (th.classList.contains('formula') || th.classList.contains('result') || th.classList.contains('add-result'))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  thead.addEventListener('drop', (e) => {
    const targetTh = e.target.closest('th');
    if (targetTh && draggedTh && targetTh !== draggedTh) {
      const oldIndex = draggedTh.cellIndex;

      if (targetTh.classList.contains('formula')) {
        targetTh.after(draggedTh);
      } else if (targetTh.classList.contains('add-result')) {
        targetTh.before(draggedTh);
      } else if (targetTh.classList.contains('result')) {
        const rect = targetTh.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) {
          targetTh.before(draggedTh);
        } else {
          targetTh.after(draggedTh);
        }
      }

      const newIndex = draggedTh.cellIndex;

      // Move cells in tbody rows
      for (let r of tbody.rows) {
        // If row is a 4-column (title/subtitle) row, skip moving result columns
        if (r.cells.length === 4 && r.querySelector('.description') && r.querySelector('.description').hasAttribute('colspan')) {
          continue;
        }
        const cell = r.cells[oldIndex];
        if (oldIndex < newIndex) {
          r.insertBefore(cell, r.cells[newIndex + 1]);
        } else {
          r.insertBefore(cell, r.cells[newIndex]);
        }
      }

      // Move cell in blank_row
      const blank = table.blank_row;
      if (blank) {
        const blankCell = blank.cells[oldIndex];
        if (oldIndex < newIndex) {
          blank.insertBefore(blankCell, blank.cells[newIndex + 1]);
        } else {
          blank.insertBefore(blankCell, blank.cells[newIndex]);
        }
      }
    }
  });

  thead.addEventListener('dragend', () => {
    draggedTh = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (table) {
    setupDragDrop(table);
  }
});

export { setupDragDrop };