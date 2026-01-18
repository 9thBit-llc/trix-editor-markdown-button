/**
 * Main Content Script
 * Entry point for the Trix Editor Markdown extension content script
 */

import { TrixDetector } from './trix-detector.js';
import { ToolbarInjector } from './toolbar-injector.js';
import { MarkdownModal } from './modal.js';
import { MarkdownConverter } from '../lib/markdown-converter.js';
import { onMessage } from '../lib/browser-api.js';

// Browser API for getting extension URL
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Inject the page context script that can access Trix's API
 * This is CSP-compliant because we load an external script file from the extension
 */
let pageScriptInjected = false;
function injectPageContextScript() {
  if (pageScriptInjected) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('content/page-context.js');
      script.onload = () => {
        pageScriptInjected = true;
        resolve();
      };
      script.onerror = () => {
        resolve(); // Resolve anyway, we'll use fallback
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Insert HTML into Trix editor via the page context script
 */
function insertHtmlViaPageContext(html, editorSelector) {
  return new Promise((resolve) => {
    // Create a unique ID for this request
    const bridgeId = 'trix-markdown-bridge-' + Math.random().toString(36).substr(2, 9);
    const requestId = Math.random().toString(36).substr(2, 9);

    // Create bridge element
    const bridgeElement = document.createElement('div');
    bridgeElement.id = bridgeId;
    bridgeElement.style.display = 'none';
    bridgeElement.dataset.requestId = requestId;
    bridgeElement.dataset.action = 'insertHtml';
    bridgeElement.dataset.html = html;
    bridgeElement.dataset.editorSelector = editorSelector || 'trix-editor';
    document.documentElement.appendChild(bridgeElement);

    // Listen for response
    const responseHandler = (event) => {
      if (event.detail && event.detail.requestId === requestId) {
        bridgeElement.removeEventListener('trix-markdown-response', responseHandler);
        bridgeElement.remove();
        resolve(event.detail);
      }
    };
    bridgeElement.addEventListener('trix-markdown-response', responseHandler);

    // Dispatch request event
    bridgeElement.dispatchEvent(new CustomEvent('trix-markdown-request', {
      bubbles: true,
      detail: { requestId }
    }));

    // Timeout fallback
    setTimeout(() => {
      bridgeElement.removeEventListener('trix-markdown-response', responseHandler);
      bridgeElement.remove();
      resolve({ success: false, error: 'timeout', fallback: true });
    }, 1000);
  });
}

/**
 * Fallback: Try to insert HTML by focusing the editor and using execCommand
 * This works in some cases where the editor is contenteditable
 */
function insertHtmlFallback(html, editorSelector) {
  const editor = document.querySelector(editorSelector) || document.querySelector('trix-editor');
  if (!editor) {
    return { success: false, error: 'No editor found' };
  }

  // Find the contenteditable element inside trix-editor
  const editable = editor.querySelector('[contenteditable="true"]') ||
                   editor.shadowRoot?.querySelector('[contenteditable="true"]');

  if (editable) {
    // Focus the editable area
    editable.focus();

    // Move cursor to the beginning
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(true); // Collapse to start
    selection.removeAllRanges();
    selection.addRange(range);

    // Try to insert HTML using execCommand (deprecated but widely supported)
    try {
      const success = document.execCommand('insertHTML', false, html);
      if (success) {
        return { success: true, method: 'execCommand' };
      }
    } catch (e) {
      // execCommand failed, try next method
    }

    // Alternative: Insert as DOM nodes
    try {
      const template = document.createElement('template');
      template.innerHTML = html;
      const fragment = template.content.cloneNode(true);

      // Get fresh range after potential DOM changes
      const newRange = document.createRange();
      newRange.selectNodeContents(editable);
      newRange.collapse(true);
      newRange.insertNode(fragment);

      // Trigger input event to notify Trix of changes
      editable.dispatchEvent(new Event('input', { bubbles: true }));

      return { success: true, method: 'insertNode' };
    } catch (e) {
      // insertNode failed
    }
  }

  return { success: false, error: 'Could not insert HTML via fallback' };
}

class TrixMarkdownExtension {
  constructor() {
    /** @type {TrixDetector} */
    this.detector = new TrixDetector();
    /** @type {MarkdownModal} */
    this.modal = new MarkdownModal();
    /** @type {MarkdownConverter} */
    this.converter = new MarkdownConverter();
    /** @type {Map<HTMLElement, ToolbarInjector>} */
    this.injectors = new Map();
  }

  /**
   * Initialize the extension
   */
  init() {
    // Modal will be created lazily when first opened (in modal.open())

    // Listen for trix-initialize events to enhance editors when they're ready
    document.addEventListener('trix-initialize', (event) => {
      const editor = event.target;
      this.enhanceEditor(editor);
    });

    // Also check for existing editors that may already be initialized
    const editors = this.detector.findEditors();
    editors.forEach(editor => {
      // Only enhance if already initialized (has .editor property)
      if (editor.editor) {
        this.enhanceEditor(editor);
      }
      // If not initialized, the trix-initialize event listener will catch it
    });

    // Watch for dynamically added editors
    this.detector.observe((editor) => {
      // For dynamically added editors, they might not be initialized yet
      if (editor.editor) {
        this.enhanceEditor(editor);
      }
      // If not initialized, the trix-initialize event listener will catch it
    });

    // Listen for messages from popup
    this.setupMessageListener();
  }

  /**
   * Enhance a single Trix editor with Markdown support
   * @param {HTMLElement} editor - The trix-editor element
   */
  enhanceEditor(editor) {
    // Skip if already enhanced
    if (this.injectors.has(editor)) {
      return;
    }

    // Generate a unique identifier for this editor so we can find it later
    if (!editor.dataset.trixMarkdownId) {
      editor.dataset.trixMarkdownId = 'trix-md-' + Math.random().toString(36).substr(2, 9);
    }

    const injector = new ToolbarInjector(editor);
    const editorId = editor.dataset.trixMarkdownId;

    const injected = injector.inject(() => {
      // When button is clicked, find the editor fresh by its ID
      const freshEditor = document.querySelector(`[data-trix-markdown-id="${editorId}"]`);
      this.openModal(freshEditor || editor);
    });

    if (injected) {
      this.injectors.set(editor, injector);
    }

    // Track focus for this editor
    this.detector.trackFocus(editor);
    this.detector.addEditor(editor);
  }

  /**
   * Open the modal for a specific editor
   * @param {HTMLElement} editor - The trix-editor element that was clicked
   */
  openModal(editor) {
    // Store reference to the editor that triggered the modal
    this._currentEditor = editor;

    this.modal.open((markdown) => {

      // Use the stored editor reference, but fall back to active editor if needed
      const targetEditor = this._currentEditor || this.detector.getActiveEditor();
      this.insertMarkdown(targetEditor, markdown);
      this._currentEditor = null;
    });
  }

  /**
   * Convert Markdown and insert into the editor
   * @param {HTMLElement} editor - The trix-editor element
   * @param {string} markdown - The Markdown content to convert and insert
   */
  async insertMarkdown(editor, markdown) {
    if (!markdown || !markdown.trim()) {
      return;
    }

    const html = this.converter.convert(markdown);

    // Build a selector to find this specific editor in the page context
    let editorSelector = 'trix-editor';
    if (editor && editor.dataset && editor.dataset.trixMarkdownId) {
      editorSelector = `[data-trix-markdown-id="${editor.dataset.trixMarkdownId}"]`;
    } else if (editor && editor.id) {
      editorSelector = `#${editor.id}`;
    }

    // First, try to inject and use the page context script
    await injectPageContextScript();

    let result = await insertHtmlViaPageContext(html, editorSelector);

    if (result.success) {
      return;
    }

    // Fallback: Use DOM-based approach (CSP-compliant)
    result = insertHtmlFallback(html, editorSelector);

    if (result.success) {
      return;
    }

    // Last resort: try to update the hidden input element
    try {
      const targetEditor = document.querySelector(editorSelector) || document.querySelector('trix-editor');
      if (targetEditor) {
        const inputId = targetEditor.getAttribute('input');
        if (inputId) {
          const input = document.getElementById(inputId);
          if (input) {
            // Prepend to existing value
            const existingHtml = input.value || '';
            input.value = html + existingHtml;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        }
      }
    } catch (e) {
      // Hidden input method failed, silently continue
    }
  }

  /**
   * Set up message listener for communication with popup
   */
  setupMessageListener() {
    onMessage((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getEditors':
          // Return information about available editors
          const editors = this.detector.getEditors();
          sendResponse({
            editors: editors.map((editor, index) => ({
              index,
              hasToolbar: this.injectors.has(editor)
            })),
            count: editors.length
          });
          return true;

        case 'insertMarkdown':
          // Insert markdown into specified editor
          const { markdown, editorIndex } = message;
          const targetEditor = editorIndex !== undefined
            ? this.detector.getEditorByIndex(editorIndex)
            : this.detector.getActiveEditor();

          if (targetEditor) {
            this.insertMarkdown(targetEditor, markdown);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No editor found' });
          }
          return true;

        case 'ping':
          // Health check
          sendResponse({ status: 'ok', editorCount: this.detector.getEditorCount() });
          return true;

        default:
          return false;
      }
    });
  }
}

// Initialize on DOM ready
function initialize() {
  const extension = new TrixMarkdownExtension();
  extension.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

export { TrixMarkdownExtension };
