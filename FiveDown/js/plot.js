// js/plot.js

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('plot-overlay');
  const closeBtn = document.getElementById('plot-overlay-close');
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }
  // Plot button click handler
  const plotBtn = document.getElementById('plot-btn');
  if (plotBtn) {
    let confirmMode = false;
    plotBtn.addEventListener('click', () => {
      const table = document.getElementById('main-sheet');
      if (!confirmMode) {
        plotBtn.textContent = 'Confirm Rows';
        confirmMode = true;
        // Only unhide checkboxes for rows in row_collection
        if (table && table.row_collection) {
          for (const row of table.row_collection.rows.values()) {
            // Show and clear or check checkbox based on residual value
            row.plotCheckbox('show');
          }
        }
      } else {
        // Gather names of rows with plotCheckbox set
        let selected = [];
        if (table) {
          // Iterate over table rows in display order
          const trs = table.querySelectorAll('tr');
          for (const tr of trs) {
            const nameCell = tr.querySelector('td.name');
            if (!nameCell) continue;
            const name = nameCell.textContent.trim();
            const row = table.row_collection.rows.get(name);
            if (row && row.plotCheckbox()) {
              selected.push(name);
            }
          }
          // Rehide all checkboxes
          for (const row of table.row_collection.rows.values()) {
            row.plotCheckbox('hidden');
          }
        }
        // You can use 'selected' as needed here (e.g., pass to plot function)
        console.log('Selected rows for plot:', selected);
        if (selected.length >= 2) {
          const overlay = document.getElementById('plot-overlay');
          if (overlay) overlay.classList.add('active');
          // Extract and log result column values for each selected row
          if (table && table.row_collection) {
            console.log(`Selected rows for plot: [${selected.join(', ')}]`);
            for (const name of selected) {
              const rowObj = table.row_collection.rows.get(name);
              if (rowObj && rowObj.row) {
                // Find all result columns in this row
                const resultCells = rowObj.row.querySelectorAll('td.result');
                const values = Array.from(resultCells).map(cell => cell.textContent.trim());
                console.log(`Row ${name} result values: [${values.join(', ')}]`);
              }
            }
          }
        }
        plotBtn.textContent = 'Plot';
        confirmMode = false;
      }
    });
  }
});
