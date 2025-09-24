import { loadSheet, saveSheet, allSheetNames, scanSheet, getNextSheetName } from './sheet_loader.js';

// Show the import overlay
function showImportOverlay() {
  const overlay = document.getElementById('import-overlay');
  overlay.style.display = 'block';
  document.getElementById('import-message').textContent = '';
  document.getElementById('data-url-display').textContent = ''; // Clear data URL display
}

// Hide the import overlay
function hideImportOverlay() {
  document.getElementById('import-overlay').style.display = 'none';
  document.getElementById('import-file').value = '';
  document.getElementById('import-message').textContent = '';
  document.getElementById('data-url-display').textContent = ''; // Clear data URL display
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
    const baseUrl = window.location.origin + window.location.pathname || 'http://example.com/'; // Use origin + path or fallback
    return `${baseUrl}?in=${encodeURIComponent(encodedData)}`;
  } catch (e) {
    console.error('Error creating data URL:', e);
    return null;
  }
}

// Generate and display data URL for the current sheet
function generateDataUrl() {
  const table = document.getElementById('main-sheet');
  const messageDiv = document.getElementById('import-message');
  const dataUrlDiv = document.getElementById('data-url-display');
  
  try {
    const sheetData = scanSheet(table); // Get current sheet data
    const dataUrl = makeDataUrl(sheetData);
    if (dataUrl) {
      dataUrlDiv.textContent = dataUrl;
    } else {
      messageDiv.textContent = 'Failed to generate data URL.';
    }
  } catch (e) {
    messageDiv.textContent = 'Error generating data URL: ' + e.message;
  }
}


// Generate and trigger download of current sheet as JSON file
function downloadJson() {
  const table = document.getElementById('main-sheet');
  const messageDiv = document.getElementById('import-message');
  
  try {
    const sheetData = scanSheet(table);
    const activeSheet = document.querySelector('.project-menu .sheet-selecter.active > span');
    const sheetTitle = activeSheet ? activeSheet.textContent.trim() : 'sheet';
    const jsonString = JSON.stringify(sheetData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sheetTitle}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (e) {
    console.error('Error generating JSON download:', e);
    messageDiv.textContent = 'Error generating JSON download: ' + e.message;
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
    const savedSheetName = loadAndSaveData(data, 'URL');
    if (savedSheetName) {
      // Remove the 'in' parameter from the URL after successful processing
      window.history.replaceState(null, '', window.location.pathname);
    }
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
  document.getElementById('export-data-url').addEventListener('click', generateDataUrl);
  document.getElementById('download-json').addEventListener('click', downloadJson);
  loadSheetFromUrl(); // Check for 'in' parameter on load
});

export { showImportOverlay, hideImportOverlay, importFile, makeDataUrl, loadSheetFromUrl, generateDataUrl, downloadJson };