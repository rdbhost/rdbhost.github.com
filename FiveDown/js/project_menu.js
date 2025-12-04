
// js/project_menu.js

import { allSheetNames, getNextSheetName, loadSheet, scanSheet, saveSheet, 
  retrieveSheet, removeStoredSheet } from './sheet_loader.js';

/**
 * Sets up the project menu by populating sheet selectors and loading the
 * current sheet.
 */
function setupProjectMenu() {
  const projectMenu = document.querySelector('.project-menu');
  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;

  // Save original sheet-selecter span
  const sheetSelecters = projectMenu.querySelectorAll('.sheet-selecter');
  const origSpan = sheetSelecters[0].cloneNode(true);
  projectMenu.setAttribute('data-orig', origSpan.outerHTML);

  // Remove all sheet-selecter spans
  sheetSelecters.forEach(span => span.remove());

  // Get all sheet names as dictionary
  let sheetDict = allSheetNames();
  if (Object.keys(sheetDict).length === 0)
    sheetDict = { 'sheet00': 'Sheet 00' };

  // Add spans for each sheet entry
  Object.entries(sheetDict).forEach(([key, title]) => {
    const newSpan = origSpan.cloneNode(true);
    newSpan.querySelector('span').textContent = title;
    newSpan.id = key.replace(/\s+/g, '_'); // Sanitize id
    projectMenu.insertBefore(newSpan, projectMenu.querySelector('#new-sheet'));
  });

  // Retrieve current-sheet from localStorage
  let currentSheet = localStorage.getItem('current-sheet') || 'sheet00';
  if (!Object.keys(sheetDict).includes(currentSheet))
    currentSheet = Object.keys(sheetDict)[0];

  // Load the current sheet
  retrieveSheet(currentSheet).then(sheetData => {
    if (sheetData)
      loadSheet(null, sheetData);
  });

  // Move current span to leftmost and activate
  const currentSpan = projectMenu.querySelector(`#${currentSheet}`);
  if (currentSpan) {
    projectMenu.insertBefore(currentSpan, projectMenu.firstChild);
    activateSheetSpan(currentSpan);
  }

  // Publish recalc
  pubsub.publish('recalculation', 'go');
}

/**
 * Handles click on sheet selector to switch sheets.
 * @param {Event} event - The click event.
 */
function handleSheetSelectClick(event) {
  const span = event.target.closest('.sheet-selecter');
  const key = span.id.replace(/_/g, ' '); // Restore key from id
  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;

  // Save current sheet
  const current = localStorage.getItem('current-sheet');
  if (current) {
    const currentData = scanSheet(table);
    // Fetch the title from the active span.sheet-selecter
    const activeSpan = document.querySelector('.sheet-selecter.active span');
    if (activeSpan) 
      currentData.title = activeSpan.textContent.trim();
    saveSheet(current, currentData);
  }

  // Load new sheet
  retrieveSheet(key).then(newData => {
    if (newData)
      loadSheet(null, newData);
  });

  // Save as current-sheet
  localStorage.setItem('current-sheet', key);

  // Activate the selected span
  activateSheetSpan(span);

  // Publish recalc
  pubsub.publish('recalculation', 'go');
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

    // Get current sheet identity from localStorage (assume a key like 'currentSheet' or similar is used)
    let key = localStorage.getItem('current-sheet');
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
    localStorage.setItem('current-sheet', newCurrent);

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
  const current = localStorage.getItem('current-sheet');
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

  // Get next id
  let newKey = getNextSheetName();

  // Create new span
  const origHTML = projectMenu.getAttribute('data-orig');
  const origSpan = new DOMParser().parseFromString(origHTML, 'text/html').body.firstChild;
  const newSpan = origSpan.cloneNode(true);
  newSpan.querySelector('span').textContent = `${newKey.charAt(0).toUpperCase() + newKey.slice(1)}`;
  newSpan.id = newKey;
  projectMenu.insertBefore(newSpan, projectMenu.querySelector('#new-sheet'));

  // Clear sheet (load empty data)
  loadSheet(table, {header: [null], rows: []});

  // Save as current-sheet
  localStorage.setItem('current-sheet', newKey);

  // Activate new span
  activateSheetSpan(newSpan);

  // Publish recalc
  pubsub.publish('recalculation', 'go');
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

  const projectMenu = document.querySelector('.project-menu');
  projectMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.sheet-selecter') && !target.closest('.sheet-delete'))
      handleSheetSelectClick(e);
    if (target.closest('#new-sheet'))
      handleNewSheetClick(e);
  });

  const deleteButton = document.querySelector('#delete-sheet');
  deleteButton.addEventListener('click', deleteSheetButtonHandler);

  const projectSpans = document.querySelector('div.project-menu');
  projectSpans.addEventListener('dblclick', tabEditHandler);

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

export { setupProjectMenu, handleSheetSelectClick, handleVisibilityChange, handleNewSheetClick, tabEditHandler };