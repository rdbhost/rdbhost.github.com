// js/project_menu.js

import { setCurrentSheet, getCurrentSheet, touchSheetStatus } from './localstorage_db.js';
import { allSheetNames, getNextSheetName, loadSheet, scanSheet, saveSheet, retrieveSheet, removeStoredSheet } from './sheet_loader.js';

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
  let currentSheet = getCurrentSheet();
  if (!currentSheet || !sheetDict[currentSheet]) {
    currentSheet = entries.length > 0 ? entries[0].key : 'sheet01';
    setCurrentSheet(currentSheet);
  }

  // Ensure current sheet appears in top 4
  let top4 = entries.slice(0, 4);
  const currentInTop4 = top4.some(e => e.key === currentSheet);
  if (!currentInTop4 && entries.some(e => e.key === currentSheet)) {
    const currentEntry = entries.find(e => e.key === currentSheet);
    top4.pop();
    top4.unshift(currentEntry);
  }

  const top4Keys = top4.map(e => e.key);
  const top4Ids = top4.map(e => e.key.replace(/\s+/g, '_'));
  const top4Map = new Map(top4.map(e => [e.key, e]));

  // Get existing sheet-selecters
  const existing = Array.from(projectMenu.querySelectorAll('.sheet-selecter:not(#sheet-template)'));

  // Remove those not in top4
  existing.forEach(el => {
    if (!top4Ids.includes(el.id)) {
      el.remove();
    }
  });

  // Get existing after remove
  const existingAfterRemove = Array.from(projectMenu.querySelectorAll('.sheet-selecter:not(#sheet-template)'));

  // Update titles for remaining existing
  existingAfterRemove.forEach(el => {
    const key = el.id.replace(/_/g, ' ');
    const entry = top4Map.get(key);
    if (entry) {
      const currentTitle = el.querySelector('span').textContent;
      if (currentTitle !== entry.title) {
        el.querySelector('span').textContent = entry.title;
      }
    }
  });

  // Get missing entries
  const missingEntries = top4.filter(e => !existingAfterRemove.some(el => el.id === e.key.replace(/\s+/g, '_')));

  // Sort missing by lastAccessed desc (newest first)
  missingEntries.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  // Insert point for new additions (before first existing or dropdown)
  const insertBeforeEl = projectMenu.querySelector('#sheet-dropdown');
  const insertPoint = existingAfterRemove[0] || insertBeforeEl;

  // Add missing to the left in order
  missingEntries.forEach(entry => {
    const newSpan = templateSpan.cloneNode(true);
    newSpan.id = entry.key.replace(/\s+/g, '_');
    newSpan.style.display = '';
    newSpan.querySelector('span').textContent = entry.title;
    projectMenu.insertBefore(newSpan, insertPoint);
  });

  // Populate dropdown with the rest
  const rest = entries.filter(e => !top4Keys.includes(e.key));
  rest.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  const dropdown = projectMenu.querySelector('#sheet-dropdown');
  dropdown.innerHTML = '<option value="" disabled selected>More sheets...</option>';

  if (rest.length > 0) {
    rest.forEach(entry => {
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
  const currentSheet = getCurrentSheet();
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

  const current = getCurrentSheet()

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
    setupProjectMenu();
    table.pubsub.publish('recalculation', 'go');
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

    const key = getCurrentSheet();
    if (!key) return;

    removeStoredSheet(key).then(() => {

      // Rebuild menu and switch to another sheet
      setupProjectMenu();
      const newCurrent = getCurrentSheet();
      loadCurrentSheet();
    });

  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    const table = document.querySelector('table#main-sheet');
    const current = getCurrentSheet();
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

  saveSheet(newKey, emptyData); 
  touchSheetStatus(newKey);
  setCurrentSheet(newKey);
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

  const current = getCurrentSheet()

  // Save current sheet if exists
  if (current) {
    const currentData = scanSheet(table);
    const activeSpan = document.querySelector('.sheet-selecter.active span');
    if (activeSpan) 
      currentData.title = activeSpan.textContent.trim();
    saveSheet(current, currentData);
  }

  const save = () => {
    let text = label.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) text = label.dataset.original || 'Sheet';
    label.textContent = text;
    label.contentEditable = 'false';

    // Update stored title on next save
    const key = getCurrentSheet();
    if (key) {
      // Title will be picked up on next save (visibilitychange or switch)
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

export { setupProjectMenu, loadCurrentSheet, handleSheetSelect, handleNewSheetClick, handleVisibilityChange 
};