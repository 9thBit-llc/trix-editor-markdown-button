/**
 * Popup Script
 * Handles the browser action popup UI for the Trix Markdown extension
 */

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

class Popup {
  constructor() {
    /** @type {Array} */
    this.editors = [];
    /** @type {number} */
    this.selectedEditorIndex = 0;
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      // Get the active tab
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        this.showNoEditor();
        return;
      }

      // Query content script for editors
      const response = await browserAPI.tabs.sendMessage(tab.id, {
        action: 'getEditors'
      });

      this.editors = response.editors || [];
      this.updateUI();
    } catch (error) {
      this.showNoEditor();
    }

    this.attachListeners();
  }

  /**
   * Update the UI based on detected editors
   */
  updateUI() {
    const loading = document.getElementById('loading');
    const noEditor = document.getElementById('no-editor');
    const editorFound = document.getElementById('editor-found');

    loading.hidden = true;

    if (this.editors.length === 0) {
      this.showNoEditor();
      return;
    }

    noEditor.hidden = true;
    editorFound.hidden = false;

    // Show editor selector if multiple editors
    if (this.editors.length > 1) {
      const selector = document.getElementById('editor-selector');
      const select = document.getElementById('editor-select');

      // Clear existing options
      select.innerHTML = '';

      this.editors.forEach((editor, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Editor ${index + 1}${editor.hasToolbar ? ' (with toolbar button)' : ''}`;
        select.appendChild(option);
      });

      selector.hidden = false;
    }

    // Focus the textarea
    setTimeout(() => {
      document.getElementById('markdown-input').focus();
    }, 50);
  }

  /**
   * Show the "no editor found" message
   */
  showNoEditor() {
    document.getElementById('loading').hidden = true;
    document.getElementById('no-editor').hidden = false;
    document.getElementById('editor-found').hidden = true;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    const insertBtn = document.getElementById('insert-btn');
    const textarea = document.getElementById('markdown-input');
    const select = document.getElementById('editor-select');

    // Editor selector change
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectedEditorIndex = parseInt(e.target.value, 10);
      });
    }

    // Insert button click
    insertBtn.addEventListener('click', () => this.handleInsert());

    // Keyboard shortcut: Ctrl+Enter to submit
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.handleInsert();
      }
    });
  }

  /**
   * Handle the insert action
   */
  async handleInsert() {
    const textarea = document.getElementById('markdown-input');
    const markdown = textarea.value;

    if (!markdown.trim()) {
      textarea.focus();
      return;
    }

    const insertBtn = document.getElementById('insert-btn');
    insertBtn.disabled = true;
    insertBtn.textContent = 'Inserting...';

    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      await browserAPI.tabs.sendMessage(tab.id, {
        action: 'insertMarkdown',
        markdown: markdown,
        editorIndex: this.selectedEditorIndex
      });

      // Close popup after successful insertion
      window.close();
    } catch (error) {
      insertBtn.disabled = false;
      insertBtn.textContent = 'Add to Trix Editor';

      // Show error to user
      alert('Failed to insert Markdown. Please try again.');
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popup = new Popup();
  popup.init();
});
