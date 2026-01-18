/**
 * Background Service Worker
 * Handles extension lifecycle and cross-component communication
 */

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Handle extension installation
 */
browserAPI.runtime.onInstalled.addListener((details) => {
  // Extension installed or updated - no action needed
});

/**
 * Handle messages from popup or content scripts
 */
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getStatus':
      sendResponse({
        status: 'ok',
        version: browserAPI.runtime.getManifest().version
      });
      return true;

    default:
      return false;
  }
});

