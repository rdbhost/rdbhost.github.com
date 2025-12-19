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
      // Update all-sheets status object in localStorage
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
        // Update all-sheets status object for this read
      try { updateSheetStatus(name, object.title); } catch (e) { }
      return object;
    }
    return null;
  });
}

/**
 * Update the top-level `all-sheets` object in localStorage for `name`.
 * Creates or updates a status object with { ts: timestamp, title: title }.
 * Non-exported helper to centralize sheet status handling.
 * @param {string} name - Sheet name
 * @param {string} title - Sheet title
 */
function updateSheetStatus(name, title=null) {
  try {
    const allSheetsRaw = localStorage.getItem('all-sheets');
    let allSheets = {};
    if (allSheetsRaw) {
      try { allSheets = JSON.parse(allSheetsRaw) || {}; } catch (e) { allSheets = {}; }
    }
    if (title === null) 
      title = allSheets[name] ? allSheets[name].title : name;
    allSheets[name] = {
      ts: new Date().toISOString(),
      title: title 
    };
    localStorage.setItem('all-sheets', JSON.stringify(allSheets));
  } catch (e) {
    // ignore storage errors
  }
}

/**
 * Find and delete the oldest-timestamped sheet* (excluding the given name)
 * that actually exists in localStorage. The all-sheets entry is left as-is.
 * Returns true if a sheet was deleted, false otherwise.
 * Non-exported helper.
 * @param {string} excludeName - Sheet name to exclude from deletion (the one we're trying to save).
 * @returns {boolean}
 */
function deleteOldestSheet(excludeName) {
  try {
    const allSheetsRaw = localStorage.getItem('all-sheets');
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
 * Returns an object mapping every sheet name that appears in the
 * top-level `all-sheets` index to its stored metadata (title + timestamp).
 * If you only need the names, use Object.keys(getAllSheetNames()).
 *
 * This is the most reliable way to know “which sheets we think exist”
 * because the `all-sheets` object is the single source of truth for the
 * sheet list (it is kept in sync by updateSheetStatus() on every save/read).
 *
 * @returns {{ [name: string]: { ts: string, title: string } }}
 *          An empty object if nothing is stored or on parse error.
 */
function getAllSheetNames() {
  try {
    const raw = localStorage.getItem('all-sheets');
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    // JSON.parse can return null or non-objects in edge cases – normalise to {}
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to read/parse all-sheets index:', e);
    return {};
  }
}

/* If you only want an array of the names (most callers do): */
function getAllSheetNameList() {
  return Object.keys(getAllSheetNames());
}

/**
 * Removes the stored sheet from localStorage. Returns a Promise for
 * consistency with async storage backends.
 * Note: deleted-sheet archival (the deletion history) is maintained in
 * IndexedDB (`indexeddb_db.js`) and not in localStorage.
 * @param {string} name - The name of the sheet to remove.
 * @returns {Promise<void>}
 */
function removeStoredSheet(name) {
  return Promise.resolve().then(() => {
    if (!name.match(/^sheet\d+$/)) return;
    // Simply remove the sheet key from localStorage. Deleted-sheet
    // archival is handled by IndexedDB (indexeddb_db.js).
    localStorage.removeItem(name);

    // Remove its entry from the 'all-sheets' index
    try {
      const allSheetsRaw = localStorage.getItem('all-sheets');
      if (allSheetsRaw) {
        let allSheets = {};
        try {
          allSheets = JSON.parse(allSheetsRaw) || {};
        } catch (e) {
          // corrupted → we'll just overwrite with empty
          allSheets = {};
        }

        if (name in allSheets) {
          delete allSheets[name];
          localStorage.setItem('all-sheets', JSON.stringify(allSheets));
          console.log(`Removed ${name} from all-sheets index`);
        }
      }
    } catch (e) {
      console.error('Failed to update all-sheets index during removal:', e);
    }
  });
}

/**
 * Get the currently selected sheet key from localStorage.
 * Synchronous helper.
 * @returns {string|null}
 */
function getCurrentSheet() {
  return localStorage.getItem('current-sheet');
}

/**
 * Set the currently selected sheet key in localStorage.
 * Synchronous helper.
 * @param {string} name
 */
function setCurrentSheet(name) {
  if (name === null || name === undefined) {
    localStorage.removeItem('current-sheet');
  } else {
    localStorage.setItem('current-sheet', name);
  }
}

/**
 * Touch the sheet status in `all-sheets` to update its read timestamp and title.
 * This is exported so callers (e.g., when reading a sample) can record access.
 * @param {string} name
 * @param {string} title
 */
function touchSheetStatus(name, title=null) {
  try { updateSheetStatus(name, title); } catch (e) { }
}

// New functions for Firestore credentials
/**
 * Saves Firestore credentials to localStorage.
 * @param {Object} creds - The credentials object to save.
 */
function saveCredentials(creds) {
  if (typeof creds !== 'object' || creds === null) {
    throw new Error('Credentials must be a non-null object');
  }
  localStorage.setItem('firestore_credentials', JSON.stringify(creds));
}

/**
 * Retrieves Firestore credentials from localStorage.
 * @returns {Object|null} The credentials object or null if not found.
 */
function retrieveCredentials() {
  const stored = localStorage.getItem('firestore_credentials');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing Firestore credentials:', e);
      return null;
    }
  }
  return null;
}

// Also add last-accessed handling
/**
 * Saves the last-accessed timestamp to localStorage.
 * @param {string} ts - The timestamp (ISO string or milliseconds).
 */
function saveLastAccessed(ts) {
  localStorage.setItem('firestore_last_accessed', ts);
}

/**
 * Retrieves the last-accessed timestamp from localStorage.
 * @returns {string} The timestamp or '0' if not found.
 */
function retrieveLastAccessed() {
  return localStorage.getItem('firestore_last_accessed') || '0';
}

/**
 * Comprehensive legacy storage cleanup – run once at app startup.
 * Removes all historical garbage keys that are no longer used:
 *   • Any key starting with 'deleted-sheet'
 *   • The legacy 'allSheets' index (migrating valid sheets first)
 *   • The obsolete 'timestamps' key
 *
 * Fully synchronous, safe, idempotent, and valid JavaScript.
 */
function cleanupLegacyStorage() {
  let changes = 0;

  // ------------------------------------------------------------
  // 1. Remove all stray 'deleted-sheet*' keys (top-level)
  // ------------------------------------------------------------
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('deleted-sheet')) {
      localStorage.removeItem(key);
      changes++;
      console.log('Removed legacy deleted-sheet key:', key);
    }
  }

  // ------------------------------------------------------------
  // 2. Remove the obsolete 'timestamps' key
  // ------------------------------------------------------------
  if (localStorage.getItem('timestamps') !== null) {
    localStorage.removeItem('timestamps');
    changes++;
    console.log('Removed obsolete timestamps key');
  }

  // ------------------------------------------------------------
  // 3. Migrate legacy 'allSheets' → 'all-sheets' (if it exists)
  // ------------------------------------------------------------
  const legacyRaw = localStorage.getItem('allSheets');
  if (legacyRaw !== null) {
    let legacyData = {};
    try {
      legacyData = JSON.parse(legacyRaw) || {};
    } catch (e) {
      console.warn('Legacy allSheets corrupted – skipping migration', e);
    }

    // Load current canonical index
    let currentData = {};
    const currentRaw = localStorage.getItem('all-sheets');
    if (currentRaw) {
      try {
        const parsed = JSON.parse(currentRaw);
        if (parsed && typeof parsed === 'object') currentData = parsed;
      } catch (e) {
        console.warn('Current all-sheets corrupted – starting fresh', e);
        currentData = {};
      }
    }

    // Migrate any missing valid sheets
    let migrated = 0;
    for (const [name, meta] of Object.entries(legacyData)) {
      if (/^sheet\d+$/.test(name) && !(name in currentData)) {
        currentData[name] = {
          ts: meta.ts || new Date().toISOString(),
          title: meta.title || name
        };
        migrated++;
        changes++;
      }
    }

    // Write back only if we added something
    if (migrated > 0) {
      try {
        localStorage.setItem('all-sheets', JSON.stringify(currentData));
      } catch (e) {
        console.error('Failed to save migrated all-sheets', e);
        return; // abort cleanup of legacy key if write fails
      }
    }

    // Finally remove the old key
    try {
      localStorage.removeItem('allSheets');
      console.log('Removed legacy allSheets key');
    } catch (e) { /* ignore */ }
  }

  if (changes > 0) {
    console.log(`Legacy storage cleanup complete – ${changes} item(s) removed/migrated`);
  }
}
cleanupLegacyStorage();

export { saveSheet, retrieveSheet, getAllSheetNames, removeStoredSheet, getCurrentSheet, setCurrentSheet, touchSheetStatus,
  saveCredentials, retrieveCredentials, saveLastAccessed, retrieveLastAccessed };
