/**
 * Toolbar Injector
 * Injects a Markdown button into the Trix editor toolbar
 */

class ToolbarInjector {
  /**
   * Create a new ToolbarInjector instance
   * @param {HTMLElement} trixEditor - The trix-editor element
   */
  constructor(trixEditor) {
    /** @type {HTMLElement} */
    this.editor = trixEditor;
    /** @type {HTMLElement|null} */
    this.toolbar = null;
    /** @type {HTMLButtonElement|null} */
    this.button = null;
  }

  /**
   * Find the associated toolbar for the editor
   * @returns {HTMLElement|null} - The toolbar element or null
   */
  findToolbar() {
    // Method 1: Trix toolbar is referenced by ID in the toolbar attribute
    const toolbarId = this.editor.getAttribute('toolbar');
    if (toolbarId) {
      this.toolbar = document.getElementById(toolbarId);
      if (this.toolbar) {
        return this.toolbar;
      }
    }

    // Method 2: Find previous sibling trix-toolbar
    let sibling = this.editor.previousElementSibling;
    while (sibling) {
      if (sibling.matches && sibling.matches('trix-toolbar')) {
        this.toolbar = sibling;
        return this.toolbar;
      }
      sibling = sibling.previousElementSibling;
    }

    // Method 3: Look for trix-toolbar anywhere in the parent
    const parent = this.editor.parentElement;
    if (parent) {
      const toolbar = parent.querySelector('trix-toolbar');
      if (toolbar) {
        this.toolbar = toolbar;
        return this.toolbar;
      }
    }

    return null;
  }

  /**
   * Create the Markdown button element
   * @returns {HTMLButtonElement} - The button element
   */
  createButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trix-button trix-markdown-button';
    button.setAttribute('data-trix-markdown', 'true');
    button.setAttribute('title', 'Insert Markdown');
    button.setAttribute('tabindex', '-1');

    // Create button content with MD text and icon
    button.innerHTML = `
      <span class="trix-markdown-icon">MD</span>
    `;

    return button;
  }

  /**
   * Inject the button into the toolbar
   * @param {function} onClickCallback - Callback when button is clicked
   * @returns {boolean} - True if injection was successful
   */
  inject(onClickCallback) {
    if (!this.findToolbar()) {
      return false; // Toolbar not found, use popup fallback
    }

    // Check if button already exists
    if (this.toolbar.querySelector('.trix-markdown-button')) {
      return true; // Already injected
    }

    this.button = this.createButton();
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClickCallback();
    });

    // Try to find the best place to insert the button
    // Look for the last button group in the button row
    const buttonRow = this.toolbar.querySelector('.trix-button-row');
    if (buttonRow) {
      // Create a new button group for our markdown button
      const buttonGroup = document.createElement('span');
      buttonGroup.className = 'trix-button-group trix-button-group--markdown';
      buttonGroup.appendChild(this.button);
      buttonRow.appendChild(buttonGroup);
    } else {
      // Fallback: find any button group
      const existingGroup = this.toolbar.querySelector('.trix-button-group');
      if (existingGroup) {
        existingGroup.appendChild(this.button);
      } else {
        // Last resort: append directly to toolbar
        this.toolbar.appendChild(this.button);
      }
    }

    return true;
  }

  /**
   * Remove the button from the toolbar
   */
  remove() {
    if (this.button) {
      // Also remove the button group if it's empty after removal
      const parent = this.button.parentElement;
      this.button.remove();
      this.button = null;

      // Clean up empty button group
      if (parent && parent.classList.contains('trix-button-group--markdown')) {
        if (parent.children.length === 0) {
          parent.remove();
        }
      }
    }
  }

  /**
   * Check if the button is currently injected
   * @returns {boolean} - True if button exists in DOM
   */
  isInjected() {
    return this.button !== null && this.button.isConnected;
  }
}

export { ToolbarInjector };
export default ToolbarInjector;
