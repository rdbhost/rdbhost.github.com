// js/localstorage_db.js
// LocalStorage-backed sheet operations (legacy / migration support)

// localstorage_db.js intentionally does not reference `samples`.

/**
 * Saves the sheet object to localStorage if the name is not already in
 * samples.
 * @param {string} name - The name to save the sheet under.
 * @param {Object} object - The sheet object to save.
 * @returns {boolean} True if saved, false if name exists in samples.
 */
function saveSheet(name, object) {
  if (!name.match(/^sheet\d+$/)) return false;
  if (!object.title) object.title = name;
  localStorage.setItem(name, JSON.stringify(object));
  return true;
}

/**
 * Retrieves the sheet object from samples or localStorage.
 * @param {string} name - The name of the sheet to retrieve.
 * @returns {Object|null} The sheet object or null if not found.
 */
function retrieveSheet(name) {
  const stored = localStorage.getItem(name);
  if (stored) {
    const object = JSON.parse(stored);
    if (!object.title) object.title = name;
    return object;
  }
  return null;
}

/**
 * Retrieves all sheet names from samples and localStorage, consolidated
 * uniquely.
 * @returns {Object} Dictionary with keys as sheet names and values as titles.
 */
/**
 * Reads sheet names from localStorage and returns a mapping of name -> title.
 * This isolates localStorage access so other modules can aggregate from multiple stores.
 * @returns {Object} Dictionary with keys as sheet names and values as titles.
 */
function getLocalStorageSheetNames() {
  const nameDict = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (/^sheet\d+$/.test(key)) {
      const stored = localStorage.getItem(key);
      try {
        const obj = JSON.parse(stored);
        nameDict[key] = obj.title || key;
      } catch (e) {
        nameDict[key] = key;
      }
    }
  }
  return nameDict;
}

/**
 * Removes the stored sheet from localStorage and archives it using
 * `deleted-sheet-01...` keys.
 * @param {string} name - The name of the sheet to remove.
 */
function removeStoredSheet(name) {
  if (!name.match(/^sheet\d+$/)) return;
  const sheetData = localStorage.getItem(name);
  if (!sheetData) {
    localStorage.removeItem(name);
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(sheetData);
  } catch (e) {
    parsed = { raw: sheetData };
  }
  parsed['deleted-timestamp'] = new Date().toISOString();
  // Shift deleted-sheet-09 to deleted-sheet-10, ..., deleted-sheet-01 to deleted-sheet-02
  for (let i = 9; i >= 1; i--) {
    const fromKey = `deleted-sheet-${String(i).padStart(2, '0')}`;
    const toKey = `deleted-sheet-${String(i+1).padStart(2, '0')}`;
    const val = localStorage.getItem(fromKey);
    if (val !== null) {
      localStorage.setItem(toKey, val);
    } else {
      localStorage.removeItem(toKey);
    }
  }
  // Save the new deleted sheet to deleted-sheet-01
  localStorage.setItem('deleted-sheet-01', JSON.stringify(parsed));
  // Remove the original sheet
  localStorage.removeItem(name);
}

export { saveSheet, retrieveSheet, getLocalStorageSheetNames, removeStoredSheet };
