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
          // Extract and log result column values for each selected row in display order
          const selectedRows = [];
          const trs = table.querySelectorAll('tr');
          for (const tr of trs) {
            const nameCell = tr.querySelector('td.name');
            if (!nameCell) continue;
            const name = nameCell.textContent.trim();
            const row = table.row_collection.rows.get(name);
            if (row && row.plotCheckbox()) {
              selectedRows.push({ name, rowObj: row });
            }
          }
          const selectedNames = selectedRows.map(r => r.name);
          console.log(`Selected rows for plot: [${selectedNames.join(', ')}]`);
          for (const { name, rowObj } of selectedRows) {
            if (rowObj && rowObj.row) {
              const resultCells = rowObj.row.querySelectorAll('td.result');
              const values = Array.from(resultCells).map(cell => cell.getAttribute('data-value'));
              console.log(`Row ${name} result values: [${values.join(', ')}]`);
            }
          }
          // SVG bar chart for first two selected rows
          if (overlay && selectedRows.length >= 2) {
            // Use or create a container div for the SVG
            let svgContainer = overlay.querySelector('.plot-svg-container');
            svgContainer.innerHTML = '';
            const row1 = selectedRows[0];
            const row2 = selectedRows[1];
            const vals1 = Array.from(row1.rowObj.row.querySelectorAll('td.result')).map(cell => parseFloat(cell.getAttribute('data-value')) || 0);
            const vals2 = Array.from(row2.rowObj.row.querySelectorAll('td.result')).map(cell => parseFloat(cell.getAttribute('data-value')) || 0);
            const barCount = Math.min(vals1.length, vals2.length);
            const barWidth = 40;
            const barGap = 20;
            const chartHeight = 200;
            const chartWidth = barCount * (barWidth * 2 + barGap);
            const maxVal = Math.max(...vals1, ...vals2, 1);
            let svg = `<svg width="${chartWidth}" height="${chartHeight + 40}" style="background:#fff;">
              <text x="10" y="20" font-size="16" fill="#333">${row1.name}</text>
              <text x="10" y="${chartHeight + 30}" font-size="16" fill="#333">${row2.name}</text>`;
            for (let i = 0; i < barCount; i++) {
              const x1 = i * (barWidth * 2 + barGap) + barGap;
              const h1 = (vals1[i] / maxVal) * chartHeight;
              svg += `<rect x="${x1}" y="${chartHeight - h1 + 30}" width="${barWidth}" height="${h1}" fill="#4a90e2" />`;
              const x2 = x1 + barWidth;
              const h2 = (vals2[i] / maxVal) * chartHeight;
              svg += `<rect x="${x2}" y="${chartHeight - h2 + 30}" width="${barWidth}" height="${h2}" fill="#e94e77" />`;
            }
            svg += '</svg>';
            svgContainer.innerHTML = svg;
          }
        }
        plotBtn.textContent = 'Plot';
        confirmMode = false;
      }
    });
  }
});
