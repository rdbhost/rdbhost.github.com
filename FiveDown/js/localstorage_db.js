// js/localstorage_db.js
// LocalStorage-backed sheet operations (legacy / migration support)

// localstorage_db.js intentionally does not reference `samples`.

/**
 * Saves the sheet object to localStorage if the name is not already in
 * samples. Returns a Promise for consistency with async storage backends.
 * @param {string} name - The name to save the sheet under.
 * @param {Object} object - The sheet object to save.
 * @returns {Promise<boolean>} Promise resolving to true if saved, false if name does not match pattern.
 */
function saveSheet(name, object) {
  return Promise.resolve().then(() => {
    if (!name.match(/^sheet\d+$/)) return false;
    if (!object.title) object.title = name;
    try {
      localStorage.setItem(name, JSON.stringify(object));
      // Update allSheets status object in localStorage
      try { updateSheetStatus(name, object.title); } catch (e) { }
      return true;
    } catch (e) {
      // If quota exceeded, try to delete oldest sheet and recurse
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const deleted = deleteOldestSheet(name);
        if (deleted) {
          // Recurse to retry the write after freeing space
          return saveSheet(name, object);
        }
        console.error('Could not free storage space:', e);
        return false;
      }
      // Non-quota error; return false
      console.error('Error saving sheet:', e);
      return false;
    }
  });
}

/**
 * Retrieves the sheet object from localStorage. Returns a Promise for
 * consistency with async storage backends.
 * @param {string} name - The name of the sheet to retrieve.
 * @returns {Promise<Object|null>} Promise resolving to the sheet object or null if not found.
 */
function retrieveSheet(name) {
  return Promise.resolve().then(() => {
    const stored = localStorage.getItem(name);
    if (stored) {
      // If stored value is not valid JSON, ignore it
      let object;
      try {
        object = JSON.parse(stored);
      } catch (e) {
        return null;
      }
      if (!object.title) object.title = name;
      // Update allSheets status object for this read
      try { updateSheetStatus(name, object.title); } catch (e) { }
      return object;
    }
    return null;
  });
}

/**
 * Update the top-level `allSheets` object in localStorage for `name`.
 * Creates or updates a status object with { ts: timestamp, title: title }.
 * Non-exported helper to centralize sheet status handling.
 * @param {string} name - Sheet name
 * @param {string} title - Sheet title
 */
function updateSheetStatus(name, title) {
  try {
    const allSheetsRaw = localStorage.getItem('allSheets');
    let allSheets = {};
    if (allSheetsRaw) {
      try { allSheets = JSON.parse(allSheetsRaw) || {}; } catch (e) { allSheets = {}; }
    }
    allSheets[name] = {
      ts: new Date().toISOString(),
      title: title || name
    };
    localStorage.setItem('allSheets', JSON.stringify(allSheets));
  } catch (e) {
    // ignore storage errors
  }
}

/**
 * Find and delete the oldest-timestamped sheet* (excluding the given name)
 * that actually exists in localStorage. The allSheets entry is left as-is.
 * Returns true if a sheet was deleted, false otherwise.
 * Non-exported helper.
 * @param {string} excludeName - Sheet name to exclude from deletion (the one we're trying to save).
 * @returns {boolean}
 */
function deleteOldestSheet(excludeName) {
  try {
    const allSheetsRaw = localStorage.getItem('allSheets');
    let allSheets = {};
    if (allSheetsRaw) {
      try { allSheets = JSON.parse(allSheetsRaw) || {}; } catch (e) { allSheets = {}; }
    }

    // Find the oldest timestamp among sheet* entries (excluding excludeName)
    // that actually exist in localStorage
    let oldest = null;
    let oldestKey = null;
    for (const key in allSheets) {
      if (/^sheet\d+$/.test(key) && key !== excludeName) {
        const status = allSheets[key];
        // Only consider if the sheet actually exists in storage
        if (localStorage.getItem(key) !== null) {
          const ts = status && status.ts ? status.ts : null;
          if (!oldest || (ts && ts < oldest)) {
            oldest = ts;
            oldestKey = key;
          }
        }
      }
    }

    if (oldestKey) {
      localStorage.removeItem(oldestKey);
      console.log('Deleted oldest sheet to free space:', oldestKey);
      return true;
    }
  } catch (e) {
    console.error('Error deleting oldest sheet:', e);
  }
  return false;
}

/**
 * Retrieves all sheet names from samples and localStorage, consolidated
 * uniquely.
 * @returns {Object} Dictionary with keys as sheet names and values as titles.
 */
/**
 * Reads sheet names from localStorage and returns a mapping of name -> title.
 * This isolates localStorage access so other modules can aggregate from multiple stores.
 * Returns a Promise for consistency with async storage backends.
 * @returns {Promise<Object>} Promise resolving to a dictionary with keys as sheet names and values as titles.
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
 * `deleted-sheet-01...` keys. Returns a Promise for consistency with async
 * storage backends.
 * @param {string} name - The name of the sheet to remove.
 * @returns {Promise<void>}
 */
function removeStoredSheet(name) {
  return Promise.resolve().then(() => {
    if (!name.match(/^sheet\d+$/)) return;
    // Simply remove the sheet key from localStorage. Deleted-sheet
    // archival is handled by IndexedDB (indexeddb_db.js).
    localStorage.removeItem(name);
  });
}

export { saveSheet, retrieveSheet, getLocalStorageSheetNames, removeStoredSheet };
