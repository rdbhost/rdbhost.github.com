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
    plotBtn.addEventListener('click', () => {
      console.log('Plot button clicked');
      // Only unhide checkboxes for rows in row_collection
      const table = document.getElementById('main-sheet');
      if (table && table.row_collection) {
        for (const row of table.row_collection.rows.values()) {
          if (typeof row.plotCheckbox === 'function') {
            row.plotCheckbox('cleared'); // show and clear checkbox
          }
        }
      }
    });
  }
});
