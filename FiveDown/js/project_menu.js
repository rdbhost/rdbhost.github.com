// js/project_menu.js

import { setCurrentSheet } from './localstorage_db.js';
import { 
  allSheetNames, 
  getNextSheetName, 
  loadSheet, 
  scanSheet, 
  saveSheet, 
  retrieveSheet, 
  removeStoredSheet 
} from './sheet_loader.js';

/**
 * Sets up the project menu: up to 4 recent tabs + dropdown for the rest
 */
function setupProjectMenu() {
  const projectMenu = document.querySelector('.project-menu');
  const templateSpan = document.querySelector('#sheet-template');
  if (!templateSpan) {
    console.error('Sheet template not found');
    return;
  }

  // Clear existing visible tabs (keep template)
  projectMenu.querySelectorAll('.sheet-selecter').forEach(el => {
    if (el.id !== 'sheet-template') el.remove();
  });

  // Get full list with titles and optional timestamps
  const sheetDict = allSheetNames(); // → { sheet01: { title: "My Project", lastAccessed?: 1734023456789 }, ... }

  // Convert to array and sort by lastAccessed (most recent first)
  const entries = Object.keys(sheetDict).map(key => ({
    key,
    title: sheetDict[key].title || key,
    lastAccessed: sheetDict[key].lastAccessed || 0  // 0 for samples or old entries
  }));

  entries.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  // Determine current sheet (stored in localStorage as 'current-sheet')
  let currentSheet = localStorage.getItem('current-sheet');
  if (!currentSheet || !sheetDict[currentSheet]) {
    currentSheet = entries.length > 0 ? entries[0].key : 'sheet01';
    localStorage.setItem('current-sheet', currentSheet);
  }

  // Ensure current sheet appears in top 4
  const top4 = entries.slice(0, 4);
  const currentInTop4 = top4.some(e => e.key === currentSheet);
  if (!currentInTop4 && entries.some(e => e.key === currentSheet)) {
    const currentEntry = entries.find(e => e.key === currentSheet);
    top4.pop();
    top4.unshift(currentEntry);
  }

  // Insert top 4 tabs
  const insertBeforeEl = projectMenu.querySelector('#sheet-dropdown');

  top4.forEach(entry => {
    const newSpan = templateSpan.cloneNode(true);
    newSpan.id = entry.key.replace(/\s+/g, '_');
    newSpan.style.display = '';
    newSpan.querySelector('span').textContent = entry.title;
    projectMenu.insertBefore(newSpan, insertBeforeEl);
  });

  // Populate dropdown with the rest
  const dropdown = projectMenu.querySelector('#sheet-dropdown');
  dropdown.innerHTML = '<option value="" disabled selected>More sheets...</option>';

  if (entries.length > 4) {
    entries.slice(4).forEach(entry => {
      const opt = document.createElement('option');
      opt.value = entry.key;
      opt.textContent = entry.title;
      dropdown.appendChild(opt);
    });
    dropdown.style.display = 'inline-block';
  } else {
    dropdown.style.display = 'none';
  }

  // Activate current tab
  const activeSpan = projectMenu.querySelector(`#${currentSheet.replace(/\s+/g, '_')}`);
  activateSheetSpan(activeSpan);
}

function loadCurrentSheet() {
  const currentSheet = localStorage.getItem('current-sheet') || 'sheet01';
  const table = document.querySelector('table#main-sheet');
  if (!table?.pubsub) return;

  retrieveSheet(currentSheet).then(sheetData => {
    if (sheetData) {
      loadSheet(null, sheetData);
      table.pubsub.publish('recalculation', 'go');
    }
  });
}

/**
 * Handle click on sheet tab or dropdown selection
 */
function handleSheetSelect(event) {
  let key;
  if (event.target.closest('.sheet-selecter')) {
    const span = event.target.closest('.sheet-selecter');
    key = span.id.replace(/_/g, ' ');
  } else if (event.type === 'change' && event.target.id === 'sheet-dropdown') {
    key = event.target.value;
    event.target.selectedIndex = 0;
  } else {
    return;
  }

  const table = document.querySelector('table#main-sheet');
  if (!table?.pubsub) return;

  const current = localStorage.getItem('current-sheet');

  // Save current sheet if exists
  if (current && current !== key) {
    const currentData = scanSheet(table);
    const activeSpan = document.querySelector('.sheet-selecter.active span');
    if (activeSpan) currentData.title = activeSpan.textContent.trim();
    saveSheet(current, currentData);
  }

  // Switch to new sheet
  retrieveSheet(key).then(data => {
    if (data) loadSheet(null, data);
    setCurrentSheet(key);
    setupProjectMenu();  // Rebuild to update recency
    loadCurrentSheet();
  });
}

let deleteSheetConfirmTimeout = null;

function deleteSheetButtonHandler() {
  const deleteButton = document.querySelector('#delete-sheet');
  if (deleteButton.dataset.confirmMode !== 'true') {
    deleteButton.dataset.confirmMode = 'true';
    deleteButton.textContent = 'Confirm Delete';
    deleteButton.classList.add('confirm');

    deleteSheetConfirmTimeout = setTimeout(() => {
      deleteButton.dataset.confirmMode = 'false';
      deleteButton.textContent = 'Delete Sheet';
      deleteButton.classList.remove('confirm');
    }, 5000);
  } else {
    clearTimeout(deleteSheetConfirmTimeout);
    deleteButton.dataset.confirmMode = 'false';
    deleteButton.textContent = 'Delete Sheet';
    deleteButton.classList.remove('confirm');

    const key = localStorage.getItem('current-sheet');
    if (!key) return;

    removeStoredSheet(key);

    // Rebuild menu and switch to another sheet
    setupProjectMenu();
    const newCurrent = localStorage.getItem('current-sheet') || 'sheet01';
    loadCurrentSheet();
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    const table = document.querySelector('table#main-sheet');
    const current = localStorage.getItem('current-sheet');
    if (current && table) {
      const data = scanSheet(table);
      const activeSpan = document.querySelector('.sheet-selecter.active span');
      if (activeSpan) data.title = activeSpan.textContent.trim();
      saveSheet(current, data);
    }
  }
}

function activateSheetSpan(activeSpan) {
  document.querySelectorAll('.sheet-selecter').forEach(el => {
    el.classList.remove('active');
  });
  if (activeSpan) activeSpan.classList.add('active');
}

function handleNewSheetClick() {
  const newKey = getNextSheetName();
  const defaultTitle = newKey.charAt(0).toUpperCase() + newKey.slice(1).replace(/(\d+)/, ' $1');

  const emptyData = {
    title: defaultTitle,
    header: ['Result'],
    rows: []
  };

  saveSheet(newKey, emptyData); // This triggers timestamp via touchSheetStatus internally

  localStorage.setItem('current-sheet', newKey);
  loadSheet(null, emptyData);
  setupProjectMenu();
}

// Allow inline editing of tab titles
function tabEditHandler(e) {
  const selecter = e.target.closest('.sheet-selecter');
  if (!selecter) return;
  const label = selecter.querySelector('span');
  if (!label) return;

  label.contentEditable = 'true';
  label.focus();

  const save = () => {
    let text = label.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) text = label.dataset.original || 'Sheet';
    label.textContent = text;
    label.contentEditable = 'false';

    // Update stored title on next save
    const key = localStorage.getItem('current-sheet');
    if (key) {
      // Title will be picked up on next save (visibilitychange or switch)
      label.dataset.dirtyTitle = text;
    }
  };

  label.addEventListener('blur', save, { once: true });
  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      label.blur();
    }
  });
}

// === DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
  setupProjectMenu();
  loadCurrentSheet();

  const projectMenu = document.querySelector('.project-menu');
  projectMenu.addEventListener('click', (e) => {
    if (e.target.closest('.sheet-selecter') && !e.target.closest('.sheet-delete')) {
      handleSheetSelect(e);
    }
    if (e.target.closest('#new-sheet')) {
      handleNewSheetClick();
    }
  });

  const dropdown = document.querySelector('#sheet-dropdown');
  if (dropdown) dropdown.addEventListener('change', handleSheetSelect);

  const deleteBtn = document.querySelector('#delete-sheet');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteSheetButtonHandler);

  projectMenu.addEventListener('dblclick', tabEditHandler);

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

export { 
  setupProjectMenu, 
  loadCurrentSheet, 
  handleSheetSelect, 
  handleNewSheetClick, 
  handleVisibilityChange 
};