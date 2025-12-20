// js/firebase_interface.js

import { retrieveSheet } from './localstorage_db.js';

function showFirebaseOverlay() {
  const overlay = document.querySelector('#firebase-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    const closeBtn = document.querySelector('#firebase-overlay-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideFirebaseOverlay, { once: true });
    }
  }
}

function hideFirebaseOverlay() {
  const overlay = document.querySelector('#firebase-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const creds = await retrieveSheet('firebase-config');
    const fbButton = document.querySelector('#firebase-btn');
    if (fbButton) {
      fbButton.disabled = !!creds; // Disable if credentials found, enable if not
      fbButton.addEventListener('click', showFirebaseOverlay);
    }
  } catch (e) {
    console.error('Error checking Firebase credentials:', e);
  }
});

export {};