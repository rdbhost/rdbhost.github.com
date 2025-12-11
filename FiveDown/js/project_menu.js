
// js/project_menu.js

import { getCurrentSheet, setCurrentSheet, getAllSheetNames } from './localstorage_db.js';  // only for metadata
import { allSheetNames, getNextSheetName, loadSheet, scanSheet, saveSheet, 
  retrieveSheet, removeStoredSheet } from './sheet_loader.js';

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
  // Save original template (we'll clone it for new tabs)
  projectMenu.setAttribute('data-orig', templateSpan);
  // Clear visible tabs (keep template and controls)
  projectMenu.querySelectorAll('.sheet-selecter').forEach(el => {
    if (el.id !== 'sheet-template') el.remove();
  });

  // === Get list of sheet keys from sheet_loader.js (authoritative source) ===
  const sheetDict = allSheetNames(); // e.g., { sheet00: "Sheet 00", sheet01: "My Calc", ... }

  // If no sheets, fallback to default
  if (Object.keys(sheetDict).length === 0) {
    sheetDict['sheet00'] = 'Sheet 00';
  }

  // Get metadata (timestamps + titles) from localstorage_db
  const sheetMeta = getAllSheetNames(); // { sheet00: { ts: "...", title: "..." }, ... }

  // Build full entries with fallback titles
  const entries = Object.keys(sheetDict).map(key => {
    const meta = sheetMeta[key] || {};
    return [
      key,
      {
        title: (meta.title || sheetDict[key] || key),
        ts: meta.ts || '1970-01-01T00:00:00Z' // old timestamp if missing
      }
    ];
  });

  // Sort by timestamp descending (most recent first)
  entries.sort((a, b) => (b[1].ts || '').localeCompare(a[1].ts || ''));

  // Determine current sheet
  let currentSheet = getCurrentSheet();
  if (!currentSheet || !sheetDict[currentSheet]) {
    currentSheet = entries[0][0];
    setCurrentSheet(currentSheet);
  }

  // Promote current sheet to top 4 if not already there
  const top4 = entries.slice(0, 4);
  const currentInTop4 = top4.some(([k]) => k === currentSheet);
  if (!currentInTop4) {
    const currentEntry = entries.find(([k]) => k === currentSheet);
    if (currentEntry) {
      top4.pop();
      top4.unshift(currentEntry);
    }
  }

  // === Insert the 4 most recent tabs BEFORE the dropdown ===
  const insertBeforeEl = projectMenu.querySelector('#sheet-dropdown');

  // First, clear any old visible tabs
  projectMenu.querySelectorAll('.sheet-selecter').forEach(el => {
    if (el.id !== 'sheet-template') el.remove();
  });

  top4.forEach(([key, data]) => {
    const newSpan = templateSpan.cloneNode(true);
    newSpan.id = key.replace(/\s+/g, '_');
    newSpan.style.display = '';
    newSpan.querySelector('span').textContent = data.title;
    projectMenu.insertBefore(newSpan, insertBeforeEl);
  });

  // === Populate dropdown with older sheets ===
  const dropdown = projectMenu.querySelector('#sheet-dropdown');
  dropdown.innerHTML = '<option value="" disabled selected>More sheets...</option>';

  if (entries.length > 4) {
    entries.slice(4).forEach(([key, data]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = data.title;
      dropdown.appendChild(opt);
    });
    dropdown.style.display = 'inline-block';
  } else {
    dropdown.style.display = 'none';
  }
}

function loadCurrentSheet() {

  let currentSheet = getCurrentSheet();
  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;

  // Load current sheet
  retrieveSheet(currentSheet).then(sheetData => {
    if (sheetData) loadSheet(null, sheetData);
    pubsub.publish('recalculation', 'go');    
  });

  const projectMenu = document.querySelector('.project-menu');

  // Activate current tab
  const currentSpan = projectMenu.querySelector(`#${currentSheet.replace(/\s+/g, '_')}`);
  activateSheetSpan(currentSpan);

}


/**
 * Handle click on sheet selector or dropdown change
 */
function handleSheetSelect(event) {
  let key;
  if (event.target.closest('.sheet-selecter')) {
    const span = event.target.closest('.sheet-selecter');
    key = span.id.replace(/_/g, ' ');
  } else if (event.type === 'change' && event.target.id === 'sheet-dropdown') {
    key = event.target.value;
    event.target.selectedIndex = 0; // reset dropdown
  } else {
    return;
  }

  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;

  // Save current
  const current = getCurrentSheet();
  if (current) {
    const currentData = scanSheet(table);
    const activeSpan = document.querySelector('.sheet-selecter.active span');
    if (activeSpan) currentData.title = activeSpan.textContent.trim();
    saveSheet(current, currentData);
  }

  // Load new
  retrieveSheet(key).then(newData => {
    if (newData) loadSheet(null, newData);

    setCurrentSheet(key);
    //rebuildMenu(); // ensures new sheet moves into recent tabs
    setupProjectMenu();
    loadCurrentSheet();
    // pubsub.publish('recalculation', 'go');
  });

}

/**
 * Handler for the delete-sheet button click event.
 */

let deleteSheetConfirmTimeout = null;

function deleteSheetButtonHandler() {
  const deleteButton = document.querySelector('#delete-sheet');
  if (deleteButton.dataset.confirmMode !== 'true') {
    // First click: enter confirm mode
    deleteButton.dataset.confirmMode = 'true';
    deleteButton.textContent = 'Please Confirm';
    deleteButton.classList.add('confirm');
    // Set timeout to revert after 90 seconds
    deleteSheetConfirmTimeout = setTimeout(() => {
    deleteButton.dataset.confirmMode = 'false';
    deleteButton.textContent = 'Delete Sheet';
    deleteButton.classList.remove('confirm');
    }, 1500);

  } else {

    // Second click: actually delete
    if (deleteSheetConfirmTimeout) {
      clearTimeout(deleteSheetConfirmTimeout);
      deleteSheetConfirmTimeout = null;
    }
    deleteButton.dataset.confirmMode = 'false';
    deleteButton.textContent = 'Delete Sheet';
    deleteButton.classList.remove('confirm');

    // Get current sheet identity using helper
    let key = getCurrentSheet();
    const table = document.querySelector('table#main-sheet');
    const pubsub = table.pubsub;
    const projectMenu = document.querySelector('.project-menu');
    const span = document.querySelector('#'+key)
    
    // Remove from localStorage
    removeStoredSheet(key);

    // Remove the span from the project menu
    if (span) 
      span.parentElement.removeChild(span);

    // Choose first remaining
    const remainingSpans = projectMenu.querySelectorAll('.sheet-selecter');
    let newCurrent = remainingSpans.length > 0 ? remainingSpans[0].id : 'sheet00';

    // Load new current
    retrieveSheet(newCurrent).then(newData => {
      if (newData)
        loadSheet(null, newData);
    });

    // Save as current-sheet
    setCurrentSheet(newCurrent);

    // Activate the new current span
    const newSpan = projectMenu.querySelector(`#${newCurrent}`);
    activateSheetSpan(newSpan);

    // Publish recalc
    pubsub.publish('recalculation', 'go');
  }
}


/**
 * Handles visibility change to save current sheet.
 */
function handleVisibilityChange() {
  const table = document.querySelector('table#main-sheet');
  const current = getCurrentSheet();
  if (current) {
    const currentData = scanSheet(table);
    // Fetch the title from the active span.sheet-selecter
    const activeSpan = document.querySelector('.sheet-selecter.active span');
    if (activeSpan) 
      currentData.title = activeSpan.textContent.trim();
    saveSheet(current, currentData);
  }
}

/**
 * Removes 'active' class from all sheet-selecter spans and adds it to the
 * specified one.
 * @param {HTMLElement} activeSpan - The span to activate.
 */
function activateSheetSpan(activeSpan) {
  document.querySelectorAll('.sheet-selecter').forEach(span => {
    span.classList.remove('active');
  });
  if (activeSpan)
    activeSpan.classList.add('active');
}

/**
 * Handles click on new-sheet to create a new sheet.
 * @param {Event} event - The click event.
 */
function handleNewSheetClick(event) {
  const projectMenu = document.querySelector('.project-menu');
  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;

  // Get the hidden template
  const templateSpan = document.querySelector('#sheet-template');
  if (!templateSpan) {
    console.error('Sheet template not found');
    return;
  }

  // Generate new sheet key and default title
  const newKey = getNextSheetName();
  const defaultTitle = newKey.charAt(0).toUpperCase() + newKey.slice(1).replace(/\d+/g, ' $&').trim();

  // Clone the template for the new tab
  const newSpan = templateSpan.cloneNode(true);
  newSpan.id = newKey.replace(/\s+/g, '_');  // sanitized ID
  newSpan.style.display = '';                // make visible
  newSpan.querySelector('span').textContent = defaultTitle;

  // Insert the new tab before the dropdown (same position as recent tabs)
  const insertBeforeEl = projectMenu.querySelector('#sheet-dropdown');
  projectMenu.insertBefore(newSpan, insertBeforeEl);

  // Create empty sheet data
  const emptyData = {
    header: [null],
    rows: [],
    title: defaultTitle
  };

  // Save it immediately so it has a timestamp and appears in allSheetNames()
  saveSheet(newKey, emptyData);

  // Switch to the new sheet
  setCurrentSheet(newKey);
  loadSheet(null, emptyData);

  // Activate the new tab visually
  activateSheetSpan(newSpan);

  // Rebuild menu to ensure correct recency order and dropdown state
  setupProjectMenu();
  loadCurrentSheet()

  // Trigger recalculation
  // pubsub.publish('recalculation', 'go');
}

// Enable contenteditable on double-click for project-menu spans
function tabEditHandler(e) {
  const selecter = e.target.closest('.sheet-selecter');
  if (selecter) {
    // Find the child span (the label span inside .sheet-selecter)
    const labelSpan = selecter.querySelector('span');
    if (labelSpan) {
      labelSpan.contentEditable = 'true';
      labelSpan.focus();
      const removeEditable = () => {
        // Remove <br> tags and excess whitespace
        let text = labelSpan.innerText.replace(/\n/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        labelSpan.textContent = text;
        labelSpan.contentEditable = 'false';
        labelSpan.removeEventListener('focusout', removeEditable);
      };
      labelSpan.addEventListener('focusout', removeEditable);
  }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupProjectMenu();
  loadCurrentSheet();

  const projectMenu = document.querySelector('.project-menu');
  projectMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.sheet-selecter') && !target.closest('.sheet-delete'))
      handleSheetSelect(e);
    if (target.closest('#new-sheet'))
      handleNewSheetClick(e);
  });

  // --- CRITICAL FIX: Properly attach dropdown change handler ---
  const dropdown = document.querySelector('#sheet-dropdown');
  if (dropdown) 
    dropdown.addEventListener('change', handleSheetSelect);

  const deleteButton = document.querySelector('#delete-sheet');
  deleteButton.addEventListener('click', deleteSheetButtonHandler);

  const projectSpans = document.querySelector('div.project-menu');
  projectSpans.addEventListener('dblclick', tabEditHandler);

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

export { setupProjectMenu, handleSheetSelect, handleVisibilityChange, handleNewSheetClick, tabEditHandler };