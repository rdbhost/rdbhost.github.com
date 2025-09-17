// js/project_menu.js

import { allSheetNames, loadSheet, scanSheet, saveSheet, 
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
    sheetDict = { 'sheet_00': 'Sheet 00' };

  // Add spans for each sheet entry
  Object.entries(sheetDict).forEach(([key, title]) => {
    const newSpan = origSpan.cloneNode(true);
    newSpan.querySelector('span').textContent = title;
    newSpan.id = key.replace(/\s+/g, '_'); // Sanitize id
    projectMenu.insertBefore(newSpan, projectMenu.querySelector('#new-sheet'));
  });

  // Retrieve current-sheet from localStorage
  let currentSheet = localStorage.getItem('current-sheet') || 'sheet_00';
  if (!Object.keys(sheetDict).includes(currentSheet))
    currentSheet = Object.keys(sheetDict)[0];

  // Load the current sheet
  const sheetData = retrieveSheet(currentSheet);
  if (sheetData)
    loadSheet(table, sheetData);

  // Move current span to leftmost and add active class
  const currentSpan = projectMenu.querySelector(`#${currentSheet.replace(/\s+/g, '_')}`);
  if (currentSpan) {
    projectMenu.insertBefore(currentSpan, projectMenu.firstChild);
    currentSpan.classList.add('active');
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
    saveSheet(current, currentData);
  }

  // Load new sheet
  const newData = retrieveSheet(key);
  if (newData)
    loadSheet(table, newData);

  // Save as current-sheet
  localStorage.setItem('current-sheet', key);

  // Activate the selected span
  activateSheetSpan(span);

  // Publish recalc
  pubsub.publish('recalculation', 'go');
}

/**
 * Handles click on sheet delete button.
 * @param {Event} event - The click event.
 */
function handleSheetDeleteClick(event) {
  event.stopPropagation(); // Prevent triggering sheet select
  const span = event.target.closest('.sheet-selecter');
  const key = span.id.replace(/_/g, ' '); // Restore key from id
  const table = document.querySelector('table#main-sheet');
  const pubsub = table.pubsub;
  const projectMenu = document.querySelector('.project-menu');

  // Remove from storage
  removeStoredSheet(key);

  // Remove span
  span.remove();

  // Choose first remaining
  const remainingSpans = projectMenu.querySelectorAll('.sheet-selecter');
  let newCurrent = remainingSpans.length > 0 ? remainingSpans[0].id.replace(
/_/g, ' ') : 'sheet_00';

  // Load new current
  const newData = retrieveSheet(newCurrent);
  if (newData)
    loadSheet(table, newData);

  // Save as current-sheet
  localStorage.setItem('current-sheet', newCurrent);

  // Activate the new current span
  const newSpan = projectMenu.querySelector(`#${newCurrent.replace(/\s+/g, '_')}`);
  activateSheetSpan(newSpan);

  // Publish recalc
  pubsub.publish('recalculation', 'go');
}

/**
 * Handles visibility change to save current sheet.
 */
function handleVisibilityChange() {
  const table = document.querySelector('table#main-sheet');
  const current = localStorage.getItem('current-sheet');
  if (current) {
    const currentData = scanSheet(table);
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

  // Get current names
  const sheetDict = allSheetNames();
  let newNum = 0;
  let newKey;
  do {
    newNum++;
    newKey = `sheet${newNum.toString().padStart(2, '0')}`;
  } while (Object.keys(sheetDict).includes(newKey));

  // Create new span
  const origHTML = projectMenu.getAttribute('data-orig');
  const origSpan = new DOMParser().parseFromString(origHTML, 'text/html').body
.firstChild;
  const newSpan = origSpan.cloneNode(true);
  newSpan.querySelector('span').textContent = `Sheet ${newNum.toString()
.padStart(2, '0')}`;
  newSpan.id = newKey.replace(/\s+/g, '_');
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

document.addEventListener('DOMContentLoaded', () => {
  setupProjectMenu();

  const projectMenu = document.querySelector('.project-menu');
  projectMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.sheet-selecter') && !target.closest('.sheet-delete'))
      handleSheetSelectClick(e);
    if (target.closest('.sheet-delete'))
      handleSheetDeleteClick(e);
    if (target.closest('#new-sheet'))
      handleNewSheetClick(e);
  });

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

export { setupProjectMenu, handleSheetSelectClick, handleSheetDeleteClick,
handleVisibilityChange, handleNewSheetClick };