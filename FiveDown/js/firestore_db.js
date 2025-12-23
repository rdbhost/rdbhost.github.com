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
 * Saves a sheet to Firestore.
 * @param {string} name - The name to save the sheet under.
 * @param {Object} data - The sheet data object to save.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<boolean>} True if saved successfully.
 */
async function saveSheet(name, data, credentials) {
  const db = await getDb(credentials);
  const sheetRef = doc(collection(db, 'sheets'), name);
  await setDoc(sheetRef, {
    data,
    timestamp: Timestamp.now()
  });
  return true;
}

/**
 * Retrieves a sheet from Firestore.
 * @param {string} name - The name of the sheet to retrieve.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<Object|null>} The sheet data or null if not found.
 */
async function retrieveSheet(name, credentials) {
  const db = await getDb(credentials);
  const sheetRef = doc(collection(db, 'sheets'), name);
  const snap = await getDoc(sheetRef);
  if (snap.exists()) {
    return snap.data().data;
  }
  return null;
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
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Promise<Object>} Dict of {name: {title: string, lastAccessed: number}}.
 */
async function getAllSheetNames(credentials) {
  const db = await getDb(credentials);
  const q = query(collection(db, 'sheets'));
  const snaps = await getDocs(q);
  const dict = {};
  snaps.forEach(snap => {
    const sheetData = snap.data();
    dict[snap.id] = {
      title: sheetData.data.title || snap.id,
      lastAccessed: sheetData.timestamp.toDate().getTime()
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
    sheets[snap.id] = snap.data().data;
  });
  return sheets;
}

/**
 * Sets up a real-time listener for changes in the 'sheets' collection.
 * Calls the callback with an array of changes: [{type: 'added'|'modified'|'removed', name: string, data?: Object}, ...]
 * @param {Function} callback - Function to call on changes.
 * @param {Object} credentials - Firebase credentials for auth and config.
 * @returns {Function} Unsubscribe function to stop listening.
 */
async function watchChanges(callback, credentials) {
  const db = await getDb(credentials);
  const col = collection(db, 'sheets');
  const unsubscribe = onSnapshot(col, (snapshot) => {
    const changes = [];
    snapshot.docChanges().forEach((change) => {
      const changeObj = {
        type: change.type,
        name: change.doc.id
      };
      if (change.type !== 'removed') {
        changeObj.data = change.doc.data().data;
      }
      changes.push(changeObj);
    });
    callback(changes);
  });
  return unsubscribe;
}

export { saveSheet, retrieveSheet, removeSheet, getAllSheetNames, getNewSheets, watchChanges };