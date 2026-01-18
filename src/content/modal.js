/**
 * Markdown Input Modal
 * Creates a shadow DOM isolated modal for Markdown input
 */

import { getModalStyles } from './modal-styles.js';

class MarkdownModal {
  constructor() {
    /** @type {HTMLElement|null} */
    this.shadowHost = null;
    /** @type {ShadowRoot|null} */
    this.shadowRoot = null;
    /** @type {boolean} */
    this.isOpen = false;
    /** @type {function|null} */
    this.onSubmit = null;
    /** @type {function|null} */
    this.escapeHandler = null;
  }

  /**
   * Create the modal with shadow DOM for style isolation
   */
  create() {
    // Don't create if already exists
    if (this.shadowHost) {
      return;
    }

    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'trix-markdown-modal-host';
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    this.shadowRoot.innerHTML = `
      <style>${getModalStyles()}</style>
      <div class="modal-overlay" hidden>
        <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title">Insert Markdown</h2>
            <button class="close-btn" aria-label="Close" type="button">&times;</button>
          </div>
          <div class="modal-body">
            <label for="markdown-textarea" class="sr-only">Markdown content</label>
            <textarea 
              id="markdown-textarea"
              placeholder="Paste your Markdown here..."
              rows="10"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" type="button">Cancel</button>
            <button class="submit-btn" type="button">Add to Trix Editor</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.shadowHost);
    this.attachEventListeners();
  }

  /**
   * Open the modal
   * @param {function} onSubmit - Callback function when content is submitted
   */
  open(onSubmit) {
    if (!this.shadowRoot) {
      this.create();
    }

    this.onSubmit = onSubmit;
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    overlay.hidden = false;
    this.isOpen = true;

    // Clear and focus textarea
    const textarea = this.shadowRoot.querySelector('textarea');
    textarea.value = '';

    // Use setTimeout to ensure the modal is visible before focusing
    setTimeout(() => {
      textarea.focus();
    }, 10);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.shadowRoot) {
      return;
    }

    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    overlay.hidden = true;
    this.isOpen = false;
    this.onSubmit = null;

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Get the current Markdown content from the textarea
   * @returns {string} - The textarea content
   */
  getContent() {
    if (!this.shadowRoot) {
      return '';
    }
    return this.shadowRoot.querySelector('textarea').value;
  }

  /**
   * Set the textarea content
   * @param {string} content - The content to set
   */
  setContent(content) {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.querySelector('textarea').value = content;
  }

  /**
   * Attach event listeners to modal elements
   */
  attachEventListeners() {
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');
    const textarea = this.shadowRoot.querySelector('textarea');

    // Close button
    closeBtn.addEventListener('click', () => this.close());

    // Cancel button
    cancelBtn.addEventListener('click', () => this.close());

    // Submit button
    submitBtn.addEventListener('click', () => {
      const content = this.getContent();
      if (this.onSubmit) {
        this.onSubmit(content);
      }
      this.close();
    });

    // Close on overlay click (not on modal content click)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Handle Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Handle Ctrl+Enter / Cmd+Enter to submit
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const content = this.getContent();
        if (this.onSubmit) {
          this.onSubmit(content);
        }
        this.close();
      }
    });
  }

  /**
   * Destroy the modal and clean up
   */
  destroy() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.shadowHost && this.shadowHost.parentNode) {
      this.shadowHost.parentNode.removeChild(this.shadowHost);
    }

    this.shadowHost = null;
    this.shadowRoot = null;
    this.isOpen = false;
    this.onSubmit = null;

    // Restore body scroll in case modal was open
    document.body.style.overflow = '';
  }
}

export { MarkdownModal };
export default MarkdownModal;
