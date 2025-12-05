// js/indexeddb_db.js
// IndexedDB-backed sheet operations

// DB name and stores
const DB_NAME = 'FiveDownDB';
const DB_VERSION = 1;
const STORE_SHEETS = 'sheets';
const STORE_DELETED = 'deletedSheets';

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(STORE_SHEETS)) {
        db.createObjectStore(STORE_SHEETS, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(STORE_DELETED)) {
        // store deleted entries keyed by 'deleted-sheet-##'
        db.createObjectStore(STORE_DELETED, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn('IndexedDB open blocked');
  });
  return _dbPromise;
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSheet(name, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SHEETS], 'readwrite');
    const store = tx.objectStore(STORE_SHEETS);
    const toPut = { name, data };
    const req = store.put(toPut);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function retrieveSheet(name) {
  const db = await openDB();
  const tx = db.transaction([STORE_SHEETS], 'readonly');
  const store = tx.objectStore(STORE_SHEETS);
  const req = store.get(name);
  const result = await reqToPromise(req);
  return result ? result.data : null;
}

// Helper to get a deleted entry by key
async function _getDeleted(key) {
  const db = await openDB();
  const tx = db.transaction([STORE_DELETED], 'readonly');
  const store = tx.objectStore(STORE_DELETED);
  const req = store.get(key);
  return await reqToPromise(req);
}

// Helper to put a deleted entry
async function _putDeleted(obj) {
  const db = await openDB();
  const tx = db.transaction([STORE_DELETED], 'readwrite');
  const store = tx.objectStore(STORE_DELETED);
  const req = store.put(obj);
  return await reqToPromise(req);
}

// Helper to delete a deleted entry key
async function _deleteDeletedKey(key) {
  const db = await openDB();
  const tx = db.transaction([STORE_DELETED], 'readwrite');
  const store = tx.objectStore(STORE_DELETED);
  const req = store.delete(key);
  return await reqToPromise(req);
}

/**
 * removeSheet(name)
 * Moves the named sheet into the deletedSheets store under keys like
 * 'deleted-sheet-01', shifting existing entries up (01->02, 02->03,...)
 * to maintain an ordered deletion archive similar to localStorage version.
 */
async function removeSheet(name) {
  const db = await openDB();
  // Get the sheet
  const txRead = db.transaction([STORE_SHEETS], 'readonly');
  const storeRead = txRead.objectStore(STORE_SHEETS);
  const getReq = storeRead.get(name);
  const rec = await reqToPromise(getReq);
  if (!rec) return false;

  // Shift deleted-sheet-09 -> deleted-sheet-10, ... deleted-sheet-01 -> deleted-sheet-02
  for (let i = 9; i >= 1; i--) {
    const fromKey = `deleted-sheet-${String(i).padStart(2, '0')}`;
    const toKey = `deleted-sheet-${String(i + 1).padStart(2, '0')}`;
    const fromObj = await _getDeleted(fromKey);
    if (fromObj !== undefined && fromObj !== null) {
      // write to toKey
      await _putDeleted({ key: toKey, value: fromObj.value });
    } else {
      // ensure toKey is removed
      await _deleteDeletedKey(toKey).catch(() => {});
    }
  }

  // Save the new deleted-sheet-01 entry
  const deletedObj = {
    key: 'deleted-sheet-01',
    value: {
      name: rec.name,
      data: rec.data,
      'deleted-timestamp': new Date().toISOString()
    }
  };
  await _putDeleted(deletedObj);

  // Remove the original sheet
  const txWrite = db.transaction([STORE_SHEETS], 'readwrite');
  const storeWrite = txWrite.objectStore(STORE_SHEETS);
  await reqToPromise(storeWrite.delete(name));
  return true;
}

/**
 * getDeletedInOrder()
 * Returns an array of deleted_sheet keys (e.g. ['deleted-sheet-10', ...])
 * including only keys that exist, ordered in reverse (newest first).
 */
async function getDeletedInOrder() {
  const db = await openDB();
  const tx = db.transaction([STORE_DELETED], 'readonly');
  const store = tx.objectStore(STORE_DELETED);
  const req = store.getAllKeys();
  const keys = await reqToPromise(req);
  // Filter keys matching pattern and sort descending
  const filtered = (keys || []).filter(k => /^deleted-sheet-\d{2}$/.test(k));
  filtered.sort((a, b) => (a < b ? 1 : -1));
  return filtered;
}

export { saveSheet, retrieveSheet, removeSheet, getDeletedInOrder };
