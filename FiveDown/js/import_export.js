import { loadSheet, saveSheet, allSheetNames } from './sheet_loader.js';

// Show the import overlay
function showImportOverlay() {
  const overlay = document.getElementById('import-overlay');
  overlay.style.display = 'block';
  document.getElementById('import-message').textContent = '';
}

// Hide the import overlay
function hideImportOverlay() {
  document.getElementById('import-overlay').style.display = 'none';
  document.getElementById('import-file').value = '';
  document.getElementById('import-message').textContent = '';
}

// Get the next available sheet name (e.g., sheet01, sheet02, etc.)
function getNextSheetName() {
  const sheets = allSheetNames();
  let i = 1;
  while (sheets[`sheet${String(i).padStart(2, '0')}`]) {
    i++;
  }
  return `sheet${String(i).padStart(2, '0')}`;
}

// Load data into table and save to localStorage
function loadAndSaveData(data, source = 'file') {
  const table = document.getElementById('main-sheet');
  const sheetName = getNextSheetName();
  loadSheet(table, data);
  const saved = saveSheet(sheetName, data);
  const messageDiv = document.getElementById('import-message');
  if (saved) {
    // Update project menu
    const projectMenu = document.querySelector('.project-menu');
    const newSheetSpan = document.createElement('span');
    newSheetSpan.id = sheetName;
    newSheetSpan.className = 'sheet-selecter';
    newSheetSpan.innerHTML = `<span>${sheetName}</span>`;
    projectMenu.insertBefore(newSheetSpan, document.getElementById('new-sheet'));
    // Set as active sheet
    document.querySelectorAll('.sheet-selecter').forEach(span => span.classList.remove('active'));
    newSheetSpan.classList.add('active');
    messageDiv.textContent = `${source} loaded into table and saved as "${sheetName}" in localStorage.`;
  } else {
    messageDiv.textContent = `Failed to save ${source}: "${sheetName}" already exists.`;
  }
  return saved ? sheetName : null;
}

// Handle file import and save to localStorage
function importFile() {
  const fileInput = document.getElementById('import-file');
  const messageDiv = document.getElementById('import-message');

  const file = fileInput.files[0];
  if (!file) {
    messageDiv.textContent = 'Please select a JSON file.';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      loadAndSaveData(data, 'File');
    } catch (e) {
      messageDiv.textContent = 'Error parsing JSON file: ' + e.message;
    }
  };
  reader.onerror = function() {
    messageDiv.textContent = 'Error reading file.';
  };
  reader.readAsText(file);
}

// Create a data URL for JSON worksheet data
function makeDataUrl(jsonData) {
  try {
    const jsonString = JSON.stringify(jsonData);
    const encodedData = btoa(jsonString); // Encode to Base64
    const domain = window.location.origin || 'http://example.com'; // Use current domain or fallback
    return `${domain}?in=${encodeURIComponent(encodedData)}`;
  } catch (e) {
    console.error('Error creating data URL:', e);
    return null;
  }
}

// Load sheet from URL parameter 'in'
function loadSheetFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('in');
  if (!encodedData) return;

  try {
    const jsonString = atob(decodeURIComponent(encodedData)); // Decode Base64
    const data = JSON.parse(jsonString);
    loadAndSaveData(data, 'URL');
  } catch (e) {
    console.error('Error loading sheet from URL:', e);
    document.getElementById('import-message').textContent = 'Error loading sheet from URL: ' + e.message;
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('import-btn').addEventListener('click', showImportOverlay);
  document.getElementById('import-overlay-close').addEventListener('click', hideImportOverlay);
  document.getElementById('import-submit').addEventListener('click', importFile);
  loadSheetFromUrl(); // Check for 'in' parameter on load
});

export { showImportOverlay, hideImportOverlay, importFile, makeDataUrl, loadSheetFromUrl };