// js/firestore_db.js
// Firestore-backed sheet operations, patterned after indexeddb_db.js

// Import the core app module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
// Import the auth module (add others as needed, e.g., firestore)
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, Timestamp, deleteDoc } from "firebase/firestore";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, Timestamp, deleteDoc } 
       from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Cache for initialized DB (per credentials, but since credentials are app-wide, simple cache)
let _dbPromiseCache = new Map(); // Keyed by JSON.stringify(credentials)

// Module-level variables for current watcher and sheet data
let currentUnsubscribe = null;
let currentSheetData = null;

/**
 * Initializes and returns the Firestore DB instance using provided credentials.
 * Handles authentication with email/password.
 * @param {Object} credentials - Firebase config and auth details.
 * @returns {Promise<Firestore>} The Firestore instance.
 * @throws {Error} If credentials are invalid or auth fails.
 */
async function getDb(credentials) {
  if (typeof credentials !== 'object' || credentials === null) {
    throw new Error('Credentials must be provided as an object');
  }
  const credKey = JSON.stringify(credentials); // Simple key for cache
  if (_dbPromiseCache.has(credKey)) {
    return _dbPromiseCache.get(credKey);
  }

  const app = initializeApp({
    apiKey: credentials.apiKey,
    authDomain: credentials.authDomain,
    projectId: credentials.projectId,
    storageBucket: credentials.storageBucket,
    messagingSenderId: credentials.messagingSenderId,
    appId: credentials.appId
  });

  if (credentials.email && credentials.password) {
  const auth = getAuth(app);
  try {
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (e) {
    throw new Error(`Authentication failed: ${e.message}`);
    }
  }

  const db = getFirestore(app);
  _dbPromiseCache.set(credKey, db);
  return db;
}

/**
 * Recursively transforms data to avoid nested arrays by converting arrays to maps with numeric keys.
 * @param {*} data - The data to transform.
 * @returns {*} Transformed data.
 */
function transformForSave(data) {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      const map = {};
      data.forEach((v, i) => {
        map[i] = transformForSave(v);
      });
      return map;
    } else {
      const map = {};
      for (const [k, v] of Object.entries(data)) {
        map[k] = transformForSave(v);
      }
      return map;
    }
  }
  return data;
}

/**
 * Recursively transforms retrieved data back to original structure with arrays.
 * @param {*} data - The retrieved data.
 * @returns {*} Original data.
 */
function transformForRetrieve(data) {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // Check if it's a transformed array (keys are '0', '1', ...)
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
      const maxKey = Math.max(...keys.map(k => parseInt(k)));
      const arr = new Array(maxKey + 1);
      for (const k of keys) {
        arr[parseInt(k)] = transformForRetrieve(data[k]);
      }
      return arr;
    } else {
      const obj = {};
      for (const [k, v] of Object.entries(data)) {
        obj[k] = transformForRetrieve(v);
      }
      return obj;
    }
  }
  return data;
}

/**
 * Saves a sheet to Firestore.
 * @param {string} name - The name to save the sheet under.
 * @param {Object} data - The sheet data object to save.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<boolean>} True if saved successfully.
 */
async function saveSheet(name, data, credentials) {
  const db = await getDb(credentials);
  const sheetRef = doc(collection(db, 'sheets'), name);
  const transformedData = transformForSave(data);
  await setDoc(sheetRef, {
    data: transformedData,
    timestamp: Timestamp.now()
  });
  return true;
}

/**
 * Retrieves and monitors a sheet from Firestore using onSnapshot.
 * Returns a Promise resolving with the initial data, and calls onUpdate on changes.
 * Manages only one watcher at a time.
 * @param {string} name - The name of the sheet to retrieve/monitor.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @param {Function} onUpdate - Callback for data updates (receives transformed data or null; called on changes after initial).
 * @returns {Promise<Object|null>} Promise resolving with initial sheet data (or null if not found).
 */
async function retrieveSheet(name, credentials, onUpdate) {
  const db = await getDb(credentials);
  const sheetRef = doc(collection(db, 'sheets'), name);

  // Unsubscribe from any previous watcher
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
    currentSheetData = null;
  }

  return new Promise((resolve, reject) => {
    let isInitial = true;
    const unsubscribe = onSnapshot(sheetRef, (snap) => {
      let data = null;
      if (snap.exists()) {
        const retrieved = snap.data().data;
        data = transformForRetrieve(retrieved);
      }

      // Save copy for later diffing
      currentSheetData = data;

      if (isInitial) {
        // Resolve Promise with initial data
        resolve(data);
        isInitial = false;
      } else {
        // Call user-provided callback for subsequent updates
        if (typeof onUpdate === 'function') {
          onUpdate(data);
        }
      }
    }, (error) => {
      if (isInitial) {
        reject(error);
      } else {
        console.error('Snapshot error:', error);
      }
    });

    // Store the current unsubscribe
    currentUnsubscribe = unsubscribe;
  });
}

/**
 * Removes (deletes) a sheet from Firestore.
 * Note: Unlike indexeddb_db, this permanently deletes; no 'deleted' archive.
 * @param {string} name - The name of the sheet to remove.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<boolean>} True if removed successfully.
 */
async function removeSheet(name, credentials) {
  const db = await getDb(credentials);
  const sheetRef = doc(collection(db, 'sheets'), name);
  await deleteDoc(sheetRef);
  return true;
}

/**
 * Retrieves metadata for all sheets in Firestore, similar to getAllSheetNames in localstorage_db.
 * @param {Object} credentials - Firebase config and auth details.
 * @returns {Promise<Object>} Dict of {name: {title: string, lastAccessed: number}}.
 */
async function getAllSheetNames(credentials) {
  const db = await getDb(credentials);
  const q = query(collection(db, 'sheets'));
  const snaps = await getDocs(q);
  const dict = {};
  snaps.forEach(snap => {
    const sheetData = transformForRetrieve(snap.data().data);
    dict[snap.id] = {
      title: sheetData.title || snap.id,
      lastAccessed: snap.data().timestamp.toDate().getTime()
    };
  });
  return dict;
}

/**
 * Retrieves new sheets added/modified after the given last-accessed timestamp.
 * @param {string|number} lastAccessed - Timestamp (ms or ISO string) to filter after.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<Object>} Dict of {name: data} for new/updated sheets.
 */
async function getNewSheets(lastAccessed, credentials) {
  const db = await getDb(credentials);
  const ts = typeof lastAccessed === 'string' ? Timestamp.fromDate(new Date(lastAccessed)) : Timestamp.fromMillis(parseInt(lastAccessed));
  const q = query(collection(db, 'sheets'), where('timestamp', '>', ts));
  const snaps = await getDocs(q);
  const sheets = {};
  snaps.forEach(snap => {
    const retrieved = snap.data().data;
    sheets[snap.id] = transformForRetrieve(retrieved);
  });
  return sheets;
}


// Export currentSheetData for later diffing (if needed externally)
export { currentSheetData };

export { saveSheet, retrieveSheet, removeSheet, getAllSheetNames, getNewSheets };