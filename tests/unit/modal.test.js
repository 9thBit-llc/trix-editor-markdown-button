/**
 * Unit tests for MarkdownModal
 */

// Mock the modal-styles module
jest.mock('../../src/content/modal-styles.js', () => ({
  getModalStyles: () => '.modal-overlay { display: flex; }'
}));

const { MarkdownModal } = require('../../src/content/modal.js');

describe('MarkdownModal', () => {
  let modal;

  beforeEach(() => {
    document.body.innerHTML = '';
    modal = new MarkdownModal();
  });

  afterEach(() => {
    modal.destroy();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with null state', () => {
      expect(modal.shadowHost).toBeNull();
      expect(modal.shadowRoot).toBeNull();
      expect(modal.isOpen).toBe(false);
      expect(modal.onSubmit).toBeNull();
    });
  });

  describe('create', () => {
    it('should create shadow DOM host element', () => {
      modal.create();

      expect(modal.shadowHost).not.toBeNull();
      expect(modal.shadowHost.id).toBe('trix-markdown-modal-host');
      expect(document.body.contains(modal.shadowHost)).toBe(true);
    });

    it('should create shadow root', () => {
      modal.create();

      expect(modal.shadowRoot).not.toBeNull();
    });

    it('should not create duplicate modals', () => {
      modal.create();
      const firstHost = modal.shadowHost;

      modal.create();

      expect(modal.shadowHost).toBe(firstHost);
      expect(document.querySelectorAll('#trix-markdown-modal-host').length).toBe(1);
    });

    it('should contain modal overlay element', () => {
      modal.create();

      const overlay = modal.shadowRoot.querySelector('.modal-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay.hidden).toBe(true);
    });

    it('should contain textarea', () => {
      modal.create();

      const textarea = modal.shadowRoot.querySelector('textarea');
      expect(textarea).not.toBeNull();
    });

    it('should contain submit button', () => {
      modal.create();

      const submitBtn = modal.shadowRoot.querySelector('.submit-btn');
      expect(submitBtn).not.toBeNull();
      expect(submitBtn.textContent).toBe('Add to Trix Editor');
    });
  });

  describe('open', () => {
    beforeEach(() => {
      modal.create();
    });

    it('should show modal overlay', () => {
      modal.open(jest.fn());

      const overlay = modal.shadowRoot.querySelector('.modal-overlay');
      expect(overlay.hidden).toBe(false);
    });

    it('should set isOpen to true', () => {
      modal.open(jest.fn());

      expect(modal.isOpen).toBe(true);
    });

    it('should store onSubmit callback', () => {
      const callback = jest.fn();
      modal.open(callback);

      expect(modal.onSubmit).toBe(callback);
    });

    it('should clear textarea content', () => {
      const textarea = modal.shadowRoot.querySelector('textarea');
      textarea.value = 'previous content';

      modal.open(jest.fn());

      expect(textarea.value).toBe('');
    });

    it('should create modal if not already created', () => {
      const newModal = new MarkdownModal();
      expect(newModal.shadowRoot).toBeNull();

      newModal.open(jest.fn());

      expect(newModal.shadowRoot).not.toBeNull();
      newModal.destroy();
    });
  });

  describe('close', () => {
    beforeEach(() => {
      modal.create();
      modal.open(jest.fn());
    });

    it('should hide modal overlay', () => {
      modal.close();

      const overlay = modal.shadowRoot.querySelector('.modal-overlay');
      expect(overlay.hidden).toBe(true);
    });

    it('should set isOpen to false', () => {
      modal.close();

      expect(modal.isOpen).toBe(false);
    });

    it('should clear onSubmit callback', () => {
      modal.close();

      expect(modal.onSubmit).toBeNull();
    });

    it('should be safe to call when not created', () => {
      const newModal = new MarkdownModal();
      expect(() => newModal.close()).not.toThrow();
    });
  });

  describe('getContent', () => {
    beforeEach(() => {
      modal.create();
    });

    it('should return textarea value', () => {
      const textarea = modal.shadowRoot.querySelector('textarea');
      textarea.value = 'Test Markdown';

      expect(modal.getContent()).toBe('Test Markdown');
    });

    it('should return empty string when not created', () => {
      const newModal = new MarkdownModal();
      expect(newModal.getContent()).toBe('');
    });
  });

  describe('setContent', () => {
    beforeEach(() => {
      modal.create();
    });

    it('should set textarea value', () => {
      modal.setContent('New Content');

      const textarea = modal.shadowRoot.querySelector('textarea');
      expect(textarea.value).toBe('New Content');
    });

    it('should be safe to call when not created', () => {
      const newModal = new MarkdownModal();
      expect(() => newModal.setContent('test')).not.toThrow();
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      modal.create();
    });

    it('should close on close button click', () => {
      modal.open(jest.fn());

      const closeBtn = modal.shadowRoot.querySelector('.close-btn');
      closeBtn.click();

      expect(modal.isOpen).toBe(false);
    });

    it('should close on cancel button click', () => {
      modal.open(jest.fn());

      const cancelBtn = modal.shadowRoot.querySelector('.cancel-btn');
      cancelBtn.click();

      expect(modal.isOpen).toBe(false);
    });

    it('should trigger callback and close on submit button click', () => {
      const callback = jest.fn();
      modal.open(callback);

      const textarea = modal.shadowRoot.querySelector('textarea');
      textarea.value = 'Test Content';

      const submitBtn = modal.shadowRoot.querySelector('.submit-btn');
      submitBtn.click();

      expect(callback).toHaveBeenCalledWith('Test Content');
      expect(modal.isOpen).toBe(false);
    });

    it('should close on overlay click', () => {
      modal.open(jest.fn());

      const overlay = modal.shadowRoot.querySelector('.modal-overlay');
      // Simulate click on overlay (not on modal container)
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(modal.isOpen).toBe(false);
    });

    it('should not close when clicking modal container', () => {
      modal.open(jest.fn());

      const container = modal.shadowRoot.querySelector('.modal-container');
      container.click();

      expect(modal.isOpen).toBe(true);
    });

    it('should close on Escape key', () => {
      modal.open(jest.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(modal.isOpen).toBe(false);
    });

    it('should not close on Escape when modal is closed', () => {
      modal.open(jest.fn());
      modal.close();

      // This should not throw
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should submit on Ctrl+Enter', () => {
      const callback = jest.fn();
      modal.open(callback);

      const textarea = modal.shadowRoot.querySelector('textarea');
      textarea.value = 'Test';
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true
      }));

      expect(callback).toHaveBeenCalledWith('Test');
      expect(modal.isOpen).toBe(false);
    });

    it('should submit on Cmd+Enter (Mac)', () => {
      const callback = jest.fn();
      modal.open(callback);

      const textarea = modal.shadowRoot.querySelector('textarea');
      textarea.value = 'Test Mac';
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true
      }));

      expect(callback).toHaveBeenCalledWith('Test Mac');
    });
  });

  describe('destroy', () => {
    it('should remove modal from DOM', () => {
      modal.create();
      expect(document.body.contains(modal.shadowHost)).toBe(true);

      modal.destroy();

      expect(modal.shadowHost).toBeNull();
      expect(modal.shadowRoot).toBeNull();
    });

    it('should clean up escape handler', () => {
      modal.create();
      modal.open(jest.fn());

      modal.destroy();

      // Should not throw when Escape is pressed after destroy
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      modal.create();
      modal.destroy();

      expect(() => modal.destroy()).not.toThrow();
    });

    it('should restore body overflow', () => {
      modal.create();
      modal.open(jest.fn());
      expect(document.body.style.overflow).toBe('hidden');

      modal.destroy();

      expect(document.body.style.overflow).toBe('');
    });
  });
});
