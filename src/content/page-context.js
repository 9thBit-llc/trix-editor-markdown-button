/**
 * Page Context Script
 * This script runs in the page's context (not content script isolation)
 * and can access Trix's JavaScript API directly.
 *
 * It communicates with the content script via CustomEvents on a bridge element.
 */

(function() {
  'use strict';

  // Find or create the bridge element
  const findBridge = () => {
    return document.querySelector('[id^="trix-markdown-bridge-"]');
  };

  // Handle requests from the content script
  const handleRequest = (event) => {
    const bridge = event.target;
    if (!bridge || !bridge.dataset) return;

    const { requestId, action, html, editorSelector } = bridge.dataset;

    if (action === 'insertHtml') {
      const result = insertHtmlIntoTrix(html, editorSelector);

      // Send response back
      bridge.dispatchEvent(new CustomEvent('trix-markdown-response', {
        detail: { requestId, ...result }
      }));
    }
  };

  // Insert HTML into Trix editor
  const insertHtmlIntoTrix = (html, editorSelector) => {
    try {
      // Find the editor element
      let editorElement = document.querySelector(editorSelector);
      if (!editorElement) {
        editorElement = document.querySelector('trix-editor');
      }

      if (!editorElement) {
        return { success: false, error: 'No trix-editor element found' };
      }

      // Access the Trix editor API
      const editor = editorElement.editor;
      if (!editor) {
        return { success: false, error: 'Trix editor API not available' };
      }

      // Insert at position 0
      editor.setSelectedRange([0, 0]);
      editor.insertHTML(html);

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Listen for requests on any bridge element
  document.addEventListener('trix-markdown-request', (event) => {
    handleRequest(event);
  }, true);

  // Also try to process any pending requests
  const bridge = findBridge();
  if (bridge && bridge.dataset.action && !bridge.dataset.processed) {
    bridge.dataset.processed = 'true';
    handleRequest({ target: bridge });
  }
})();
