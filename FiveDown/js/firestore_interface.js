// js/firebase_interface.js

import { retrieveSheet, saveCredentials, retrieveCredentials } from './localstorage_db.js';

// Function to show the overlay and clear the message
function showFirebaseOverlay() {
  const overlay = document.querySelector('#firebase-overlay');
  const message = document.getElementById('firebase-message');
  if (overlay && message) {
    overlay.style.display = 'block';
    message.textContent = '';
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

// Click handler for the submit button
document.getElementById('firebase-submit').addEventListener('click', () => {
  const textarea = document.querySelector('#firebase-overlay textarea'); // Assuming there's a textarea in the overlay
  const message = document.getElementById('firebase-message');
  
  if (!textarea || !message) {
    console.error('Required elements not found');
    return;
  }
  
  const text = textarea.value.trim();
  
  if (text.length < 200 || text.length > 800 || !text.includes('apiKey')) {
    message.textContent = 'Input must be between 200 and 800 characters and include "apiKey".';
    return;
  }
  
  // Fields to extract (including email and password for auth)
  const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']; 
  //, 'email', 'password'];
  const creds = {};
  
  for (const field of fields) {
    const regex = new RegExp(`${field}:\\s*["']([^"']+)["']`);
    const match = text.match(regex);
    if (!match) {
      message.textContent = `Missing or invalid field: ${field}`;
      return;
    }
    creds[field] = match[1];
  }
  
  // Save to localStorage using the function from localstorage_db
  saveCredentials(creds);
  
  message.textContent = 'Credentials saved successfully!';
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const creds = await retrieveCredentials();
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