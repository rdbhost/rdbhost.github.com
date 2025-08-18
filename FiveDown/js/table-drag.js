// js/table-drag.js

const table = document.querySelector('#main-sheet');
if (!table) throw new Error("Table #main-sheet not found");

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

// Function to check if a row is blank
function isBlank(row) {
  const cells = row.cells;
  if (indices.desc > -1 && cells[indices.desc].textContent.trim() !== '') return false;
  if (indices.name > -1 && cells[indices.name].textContent.trim() !== '') return false;
  if (indices.formula > -1 && cells[indices.formula].textContent.trim() !== '') return false;
  if (indices.unit > -1 && cells[indices.unit].textContent.trim() !== '') return false;
  for (let idx of indices.results) {
    if (cells[idx] && cells[idx].textContent.trim() !== '') return false;
  }
  return true;
}

// 1. Find a blank row and save its HTML as data attribute
let blankRowHtml = null;
for (let i = 1; i < table.rows.length; i++) {
  if (isBlank(table.rows[i])) {
    blankRowHtml = table.rows[i].outerHTML;
    break;
  }
}
if (!blankRowHtml) {
  throw new Error("No blank row found");
}
table.setAttribute('data-blank-row', blankRowHtml);

// Set draggable on existing row handles (first td in each body row)
Array.from(table.tBodies[0].rows).forEach(row => {
  const handle = row.cells[0];
  if (handle) handle.draggable = true;
});

// Set draggable on existing result th (though assumption is additions handle it, but for init)
headers.forEach(th => {
  if (th.classList.contains('result')) th.draggable = true;
});

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

// 3. Run ensure_blank_five
ensureBlankFive();

function ensureBlankFive() {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  let blankCount = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (isBlank(rows[i])) {
      blankCount++;
    } else {
      break;
    }
  }

  const blankHtml = table.getAttribute('data-blank-row');
  if (!blankHtml) {
    throw new Error("data-blank-row not available");
  }

  if (blankCount > 5) {
    for (let i = 0; i < blankCount - 5; i++) {
      tbody.removeChild(tbody.lastChild);
    }
  } else if (blankCount < 5) {
    for (let i = 0; i < 5 - blankCount; i++) {
      const tempTbody = document.createElement('tbody');
      tempTbody.innerHTML = blankHtml;
      const newRow = tempTbody.firstChild;
      if (newRow) {
        tbody.appendChild(newRow);
        const handle = newRow.cells[0];
        if (handle) handle.draggable = true;
      }
    }
  }
}

export { ensureBlankFive, isBlank };