/**
 * Browser API abstraction layer
 * Provides a unified API for Chrome and Firefox extensions
 */

// Detect which browser API is available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Send a message to a specific tab
 * @param {number} tabId - The tab ID to send the message to
 * @param {object} message - The message object to send
 * @returns {Promise} - Resolves with the response
 */
export const sendMessage = (tabId, message) => {
  return browserAPI.tabs.sendMessage(tabId, message);
};

/**
 * Add a listener for runtime messages
 * @param {function} callback - The callback function to handle messages
 */
export const onMessage = (callback) => {
  browserAPI.runtime.onMessage.addListener(callback);
};

/**
 * Query tabs based on criteria
 * @param {object} query - Query parameters for tab search
 * @returns {Promise<Array>} - Resolves with matching tabs
 */
export const queryTabs = (query) => {
  return browserAPI.tabs.query(query);
};

/**
 * Get the current active tab
 * @returns {Promise<object>} - Resolves with the active tab
 */
export const getActiveTab = async () => {
  const tabs = await queryTabs({ active: true, currentWindow: true });
  return tabs[0];
};

export default browserAPI;
