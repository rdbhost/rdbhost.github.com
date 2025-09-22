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
        if (table && table.row_collection) {
          for (const [name, row] of table.row_collection.rows.entries()) {
            if (row.plotCheckbox()) {
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
        }
        plotBtn.textContent = 'Plot';
        confirmMode = false;
      }
    });
  }
});
