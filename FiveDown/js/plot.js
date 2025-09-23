// js/plot.js

// Chart style state
let chartStyle = 'bar'; // 'bar', 'line', or 'scatter'
let lastSelectedRows = [];


document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('plot-overlay');
  const closeBtn = document.getElementById('plot-overlay-close');
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }
  // Chart style button handlers
  const barBtn = document.getElementById('bar-chart-btn');
  barBtn.classList.add('active'); // Default active
  const lineBtn = document.getElementById('line-chart-btn');
  const scatterBtn = document.getElementById('scatter-chart-btn');
  [barBtn, lineBtn, scatterBtn].forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      chartStyle = btn.id === 'bar-chart-btn' ? 'bar' : btn.id === 'line-chart-btn' ? 'line' : 'scatter';
      const po = document.getElementById('plot-overlay');
      if (po) po.dataset.chartStyle = chartStyle;
      renderCurrentChart();
      // Visually indicate selected
      [barBtn, lineBtn, scatterBtn].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Plot button click handler
  const plotBtn = document.getElementById('plot-btn');
  if (plotBtn) {
    plotBtn.addEventListener('click', handlePlotBtn);
  }
});// End of DOMContentLoaded listener


function handlePlotBtn(e) {
  const plotBtn = e.currentTarget;
  const table = document.getElementById('main-sheet');
  let confirmMode = plotBtn.dataset.confirmMode === 'true';
  if (!confirmMode) {
    plotBtn.textContent = 'Confirm Rows';
    plotBtn.dataset.confirmMode = 'true';
    // Only unhide checkboxes for rows in row_collection
    if (table && table.row_collection) {
      table.row_collection.showCheckboxes('show');
    }
  } else {
    // Gather names of rows with plotCheckbox set
    let selected = [];
    if (table) 
      table.row_collection.showCheckboxes('hide');

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
    lastSelectedRows = selectedRows;
    renderCurrentChart();
  
    plotBtn.textContent = 'Plot';
    plotBtn.dataset.confirmMode = 'false';
  }
}

function renderCurrentChart() {
  if (!lastSelectedRows || lastSelectedRows.length < 2) return;
  const args = lastSelectedRows.flatMap(({ name, rowObj }) => {
    const resultCells = rowObj.row.querySelectorAll('td.result');
    const values = Array.from(resultCells).map(cell => Number(cell.getAttribute('data-value')));
    return [name, values];
  });
  if (chartStyle === 'bar') {
    makeBarChart(...args);
  } else if (chartStyle === 'line') {
    makeLineChart(...args);
  } else if (chartStyle === 'scatter') {
    makeScatterChart(...args);
  }
}

// Helper to generate SVG bar chart for any number of series
function makeBarChart(...series) {
  // series: [name1, vals1, name2, vals2, ...]
  const names = [], values = [];
  for (let i = 0; i < series.length; i += 2) {
    names.push(series[i]);
    values.push(series[i + 1]);
  }
  // Use generic index labels for x-axis
  const labels = values[0].map((_, i) => (i + 1).toString());
  // Remove any previous canvas in the container
  const container = document.querySelector('.plot-svg-container');
  if (!container) return;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = '80%';
  container.appendChild(canvas);
  // Prepare datasets (plot all series)
  const datasets = [];
  const colors = ["#4a90e2", "#e94e77", "#f5a623", "#7ed957", "#b07cf7", "#f77c7c"];
  for (let i = 0; i < names.length; i++) {
    datasets.push({
      label: names[i],
      data: values[i],
      backgroundColor: colors[i % colors.length],
    });
  }
  // Chart.js config
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: false }
      },
      scales: {
        x: { title: { display: false } },
        y: { beginAtZero: true }
      }
    }
  };
  // eslint-disable-next-line no-undef
  new window.Chart(canvas.getContext('2d'), config);
  return '';
}

// Helper to generate SVG line chart for any number of series
function makeLineChart(...series) {
  // series: [name1, vals1, name2, vals2, ...]
  const names = [], values = [];
  for (let i = 0; i < series.length; i += 2) {
    names.push(series[i]);
    values.push(series[i + 1]);
  }
  if (values.length < 2) return;
  // Use the first value array as x values
  const xVals = values[0];
  // Remove any previous canvas in the container
  const container = document.querySelector('.plot-svg-container');
  if (!container) return;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = '80%';
  container.appendChild(canvas);
  // Prepare datasets (all after the first)
  const datasets = [];
  const colors = ["#4a90e2", "#e94e77", "#f5a623", "#7ed957", "#b07cf7", "#f77c7c"];
  for (let i = 1; i < names.length; i++) {
    datasets.push({
      label: names[i],
      data: values[i].map((y, idx) => ({ x: xVals[idx], y })),
      borderColor: colors[(i-1) % colors.length],
      backgroundColor: colors[(i-1) % colors.length],
      fill: false,
      tension: 0.2,
      pointRadius: 3,
      type: 'line',
    });
  }
  // Chart.js config
  const config = {
    type: 'line',
    data: {
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: false }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: names[0] || 'X' },
          ticks: { autoSkip: false }
        },
        y: { beginAtZero: true }
      }
    }
  };
  // eslint-disable-next-line no-undef
  new window.Chart(canvas.getContext('2d'), config);
  return '';
}

// Helper to generate a scatter chart for any number of series using Chart.js
function makeScatterChart(...series) {
  // series: [name1, vals1, name2, vals2, ...]
  const names = [], values = [];
  for (let i = 0; i < series.length; i += 2) {
    names.push(series[i]);
    values.push(series[i + 1]);
  }
  if (values.length < 2) return;
  // Use the first value array as x values
  const xVals = values[0];
  // Remove any previous canvas in the container
  const container = document.querySelector('.plot-svg-container');
  if (!container) return;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = '80%';
  container.appendChild(canvas);
  // Prepare datasets (all after the first)
  const datasets = [];
  const colors = ["#4a90e2", "#e94e77", "#f5a623", "#7ed957", "#b07cf7", "#f77c7c"];
  for (let i = 1; i < names.length; i++) {
    datasets.push({
      label: names[i],
      data: values[i].map((y, idx) => ({ x: xVals[idx], y })),
      borderColor: colors[(i-1) % colors.length],
      backgroundColor: colors[(i-1) % colors.length],
      showLine: false,
      pointRadius: 4,
      type: 'scatter',
    });
  }
  // Chart.js config
  const config = {
    type: 'scatter',
    data: {
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { display: false }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: names[0] || 'X' },
          ticks: { autoSkip: false }
        },
        y: { beginAtZero: true }
      }
    }
  };
  // eslint-disable-next-line no-undef
  new window.Chart(canvas.getContext('2d'), config);
  return '';
}

export { handlePlotBtn, makeBarChart, makeLineChart, makeScatterChart };