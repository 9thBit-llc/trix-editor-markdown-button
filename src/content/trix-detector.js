/**
 * Trix Editor Detector
 * Detects Trix editors on the page and tracks focus state
 */

class TrixDetector {
  constructor() {
    /** @type {Set<HTMLElement>} */
    this.editors = new Set();
    /** @type {HTMLElement|null} */
    this.activeEditor = null;
    /** @type {MutationObserver|null} */
    this.observer = null;
    /** @type {function|null} */
    this.onEditorFound = null;
  }

  /**
   * Find all trix-editor elements currently on the page
   * @returns {NodeListOf<HTMLElement>} - List of trix-editor elements
   */
  findEditors() {
    return document.querySelectorAll('trix-editor');
  }

  /**
   * Get all tracked editors as an array
   * @returns {Array<HTMLElement>} - Array of tracked editors
   */
  getEditors() {
    return Array.from(this.editors);
  }

  /**
   * Get editor by index
   * @param {number} index - The index of the editor
   * @returns {HTMLElement|undefined} - The editor element or undefined
   */
  getEditorByIndex(index) {
    return this.getEditors()[index];
  }

  /**
   * Get the number of tracked editors
   * @returns {number} - Number of editors
   */
  getEditorCount() {
    return this.editors.size;
  }

  /**
   * Set up MutationObserver to detect dynamically added editors
   * @param {function} callback - Called when a new editor is found
   */
  observe(callback) {
    this.onEditorFound = callback;

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle mutations from the MutationObserver
   * @param {MutationRecord[]} mutations - List of mutations
   */
  handleMutations(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a trix-editor
          if (node.matches && node.matches('trix-editor')) {
            this.addEditor(node);
          }
          // Check for trix-editor elements within the added node
          if (node.querySelectorAll) {
            const editors = node.querySelectorAll('trix-editor');
            editors.forEach(editor => this.addEditor(editor));
          }
        }
      }
    }
  }

  /**
   * Add an editor to the tracked set
   * @param {HTMLElement} editor - The trix-editor element
   */
  addEditor(editor) {
    if (!this.editors.has(editor)) {
      this.editors.add(editor);
      if (this.onEditorFound) {
        this.onEditorFound(editor);
      }
    }
  }

  /**
   * Track focus changes on an editor
   * @param {HTMLElement} editor - The trix-editor element
   */
  trackFocus(editor) {
    editor.addEventListener('trix-focus', () => {
      this.activeEditor = editor;
    });

    editor.addEventListener('trix-blur', () => {
      // Only clear if this was the active editor
      if (this.activeEditor === editor) {
        // Keep reference to last focused editor
        // Don't clear activeEditor here to maintain last-focused behavior
      }
    });
  }

  /**
   * Get the currently active or last focused editor
   * @returns {HTMLElement|undefined} - The active editor or first available
   */
  getActiveEditor() {
    // Return last focused editor if available
    if (this.activeEditor && this.editors.has(this.activeEditor)) {
      return this.activeEditor;
    }
    // Fall back to first editor in the set
    return this.editors.values().next().value;
  }

  /**
   * Stop observing for new editors
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Clear all tracked editors
   */
  clear() {
    this.editors.clear();
    this.activeEditor = null;
  }
}

export { TrixDetector };
export default TrixDetector;
