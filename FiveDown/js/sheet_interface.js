// js/sheet-interface.js

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table#main-sheet');
  if (!table) return;
  const pubsub = table.pubsub;

  // Formatting functions similar to TableRowHandler
  function formattedString(v) {
    if (typeof v === 'number') {
      if (Math.abs(v) < 0.01) return v.toExponential(3);
      else return v.toFixed(3);
    } else if (Array.isArray(v)) {
      return `[${v.map(x => {
        if (typeof x !== 'number') return x.toString();
        if (Math.abs(x) < 0.01) return x.toExponential(3);
        else return x.toFixed(3);
      }).join(', ')}]`;
    } else return String(v);
  }

  function parseValue(str) {
    if (str.startsWith('[') && str.endsWith(']'))
      return str.slice(1, -1).split(',').map(x => parseFloat(x.trim()));
    else if (str === 'true') return true;
    else if (str === 'false') return false;
    else if (!isNaN(parseFloat(str))) {
      const num = parseFloat(str);
      return Number.isInteger(num) ? Math.floor(num) : num;
    } else return str;
  }

  // Delegation for focusin (enter)
  table.addEventListener('focusin', (e) => {
    const td = e.target;
    if (td.tagName !== 'TD') return;

    if (td.classList.contains('formula') || td.classList.contains('result')) {
      if (td.hasAttribute('data-value')) {
        td.textContent = td.getAttribute('data-value');
      }
    }
    // For unit, nothing
    if (td.classList.contains('unit')) {
      // No action
    }
  });

  // Delegation for focusout (exit)
  table.addEventListener('focusout', (e) => {
    const td = e.target;
    if (td.tagName !== 'TD') return;

    if (td.classList.contains('formula')) {
      const newRaw = td.textContent.trim();
      const oldRaw = td.getAttribute('data-value') || '';
      td.setAttribute('data-value', newRaw);
      const formatted = newRaw.replace(/@/g, '⋅').replace(/\*/g, '×');
      td.textContent = formatted;
      if (newRaw !== oldRaw) {
        pubsub.publish('recalculation', 'go');
      }
      if (newRaw !== '') {
        const tr = td.closest('tr');
        const resultTds = tr.querySelectorAll('td.result');
        for (let rtd of resultTds) {
          rtd.classList.add('readonly', 'output');
          rtd.contentEditable = false;
        }
      }
    } else if (td.classList.contains('result')) {
      const newRaw = td.textContent.trim();
      const oldRaw = td.getAttribute('data-value') || '';
      td.setAttribute('data-value', newRaw);
      const value = parseValue(newRaw);
      const formatted = formattedString(value);
      td.textContent = formatted;
      if (newRaw !== oldRaw) {
        pubsub.publish('recalc', 'go');
        const tr = td.closest('tr');
        const formulaTd = tr.querySelector('td.formula');
        formulaTd.textContent = '';
        formulaTd.contentEditable = false;
        const resultTds = tr.querySelectorAll('td.result');
        for (let rtd of resultTds) {
          rtd.contentEditable = true;
          rtd.classList.add('input');
          rtd.classList.remove('readonly', 'output');
        }
      }
    }
  });

  // Delegation for click
  table.addEventListener('click', (e) => {
    const target = e.target;

    // Add-result button in header
    if (target.tagName === 'BUTTON' && target.closest('th.add-result')) {
      const headerTr = table.querySelector('tr:first-child');
      const addResultTh = headerTr.querySelector('th.add-result');
      const position = Array.from(headerTr.children).indexOf(addResultTh);

      // Find current number of result columns
      const currentResults = headerTr.querySelectorAll('th.result').length;

      // Add to all rows
      const allTrs = table.querySelectorAll('tr');
      for (let tr of allTrs) {
        const isHeader = tr === headerTr;
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.classList.add('result');
        if (isHeader) {
          newCell.textContent = `Result ${currentResults}`;
        } else {
          newCell.contentEditable = true;
          // Handlers are delegated, so no need to add here
        }
        tr.insertBefore(newCell, tr.children[position]);
      }

      // If this is the second result column, update the first one
      if (currentResults === 1) {
        const firstResultTh = headerTr.querySelector('th.result');
        if (firstResultTh) {
          firstResultTh.textContent = 'Result 0';
        }
      }

      return;
    }

    // Delete button
    if (target.tagName === 'BUTTON' && target.closest('td.delete')) {
      const tr = target.closest('tr');
      const nameTd = tr.querySelector('td.name');
      const name = nameTd ? nameTd.textContent.trim() : '';
      tr.remove();
      if (table.row_collection && name) {
        table.row_collection.delete(name);
      }
      pubsub.publish('recalculation', 'go');
    }
  });
});