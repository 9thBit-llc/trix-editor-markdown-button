/**
 * Unit tests for ToolbarInjector
 */

const { ToolbarInjector } = require('../../src/content/toolbar-injector.js');

describe('ToolbarInjector', () => {
  let injector;
  let mockEditor;
  let mockToolbar;

  beforeEach(() => {
    document.body.innerHTML = '';

    // Create mock toolbar
    mockToolbar = document.createElement('trix-toolbar');
    mockToolbar.id = 'test-toolbar';
    mockToolbar.innerHTML = `
      <div class="trix-button-row">
        <span class="trix-button-group">
          <button class="trix-button">B</button>
        </span>
      </div>
    `;

    // Create mock editor
    mockEditor = document.createElement('trix-editor');
    mockEditor.setAttribute('toolbar', 'test-toolbar');

    document.body.appendChild(mockToolbar);
    document.body.appendChild(mockEditor);

    injector = new ToolbarInjector(mockEditor);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with editor reference', () => {
      expect(injector.editor).toBe(mockEditor);
      expect(injector.toolbar).toBeNull();
      expect(injector.button).toBeNull();
    });
  });

  describe('findToolbar', () => {
    it('should find toolbar by ID attribute', () => {
      const toolbar = injector.findToolbar();
      expect(toolbar).toBe(mockToolbar);
      expect(injector.toolbar).toBe(mockToolbar);
    });

    it('should find toolbar as previous sibling', () => {
      // Remove the ID-based reference
      mockEditor.removeAttribute('toolbar');

      // Reorder so toolbar is sibling
      document.body.innerHTML = '';
      document.body.appendChild(mockToolbar);
      document.body.appendChild(mockEditor);

      const newInjector = new ToolbarInjector(mockEditor);
      const toolbar = newInjector.findToolbar();
      expect(toolbar).toBe(mockToolbar);
    });

    it('should return null if no toolbar found', () => {
      mockEditor.removeAttribute('toolbar');
      document.body.innerHTML = '';
      document.body.appendChild(mockEditor);

      const newInjector = new ToolbarInjector(mockEditor);
      const toolbar = newInjector.findToolbar();
      expect(toolbar).toBeNull();
    });

    it('should find toolbar in parent element', () => {
      mockEditor.removeAttribute('toolbar');

      const parent = document.createElement('div');
      parent.appendChild(mockToolbar);
      parent.appendChild(mockEditor);
      document.body.innerHTML = '';
      document.body.appendChild(parent);

      const newInjector = new ToolbarInjector(mockEditor);
      const toolbar = newInjector.findToolbar();
      expect(toolbar).toBe(mockToolbar);
    });
  });

  describe('createButton', () => {
    it('should create button with correct attributes', () => {
      const button = injector.createButton();

      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.className).toContain('trix-button');
      expect(button.className).toContain('trix-markdown-button');
      expect(button.getAttribute('data-trix-markdown')).toBe('true');
      expect(button.getAttribute('title')).toBe('Insert Markdown');
      expect(button.getAttribute('tabindex')).toBe('-1');
    });

    it('should contain MD icon', () => {
      const button = injector.createButton();
      expect(button.innerHTML).toContain('MD');
      expect(button.querySelector('.trix-markdown-icon')).not.toBeNull();
    });
  });

  describe('inject', () => {
    it('should inject button into toolbar', () => {
      const callback = jest.fn();
      const result = injector.inject(callback);

      expect(result).toBe(true);
      expect(injector.button).not.toBeNull();
      expect(mockToolbar.querySelector('.trix-markdown-button')).not.toBeNull();
    });

    it('should return false if toolbar not found', () => {
      mockEditor.removeAttribute('toolbar');
      document.body.innerHTML = '';
      document.body.appendChild(mockEditor);

      const newInjector = new ToolbarInjector(mockEditor);
      const result = newInjector.inject(jest.fn());

      expect(result).toBe(false);
    });

    it('should trigger callback on click', () => {
      const callback = jest.fn();
      injector.inject(callback);

      injector.button.click();

      expect(callback).toHaveBeenCalled();
    });

    it('should prevent default and stop propagation on click', () => {
      const callback = jest.fn();
      injector.inject(callback);

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      injector.button.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should not inject duplicate buttons', () => {
      injector.inject(jest.fn());
      const firstButton = injector.button;

      // Try to inject again
      const result = injector.inject(jest.fn());

      expect(result).toBe(true);
      // Should still be the same button (no duplicate)
      const buttons = mockToolbar.querySelectorAll('.trix-markdown-button');
      expect(buttons.length).toBe(1);
    });

    it('should create button group for markdown button', () => {
      injector.inject(jest.fn());

      const buttonGroup = mockToolbar.querySelector('.trix-button-group--markdown');
      expect(buttonGroup).not.toBeNull();
      expect(buttonGroup.contains(injector.button)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove button from DOM', () => {
      injector.inject(jest.fn());
      expect(mockToolbar.querySelector('.trix-markdown-button')).not.toBeNull();

      injector.remove();

      expect(injector.button).toBeNull();
      expect(mockToolbar.querySelector('.trix-markdown-button')).toBeNull();
    });

    it('should be safe to call when no button exists', () => {
      expect(() => injector.remove()).not.toThrow();
    });

    it('should clean up empty button group', () => {
      injector.inject(jest.fn());
      expect(mockToolbar.querySelector('.trix-button-group--markdown')).not.toBeNull();

      injector.remove();

      expect(mockToolbar.querySelector('.trix-button-group--markdown')).toBeNull();
    });
  });

  describe('isInjected', () => {
    it('should return false initially', () => {
      expect(injector.isInjected()).toBe(false);
    });

    it('should return true after injection', () => {
      injector.inject(jest.fn());
      expect(injector.isInjected()).toBe(true);
    });

    it('should return false after removal', () => {
      injector.inject(jest.fn());
      injector.remove();
      expect(injector.isInjected()).toBe(false);
    });
  });
});
