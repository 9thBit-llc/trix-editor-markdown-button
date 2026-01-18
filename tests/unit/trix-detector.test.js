/**
 * Unit tests for TrixDetector
 */

const { TrixDetector } = require('../../src/content/trix-detector.js');

describe('TrixDetector', () => {
  let detector;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    detector = new TrixDetector();
  });

  afterEach(() => {
    detector.disconnect();
    detector.clear();
  });

  describe('constructor', () => {
    it('should initialize with empty state', () => {
      expect(detector.editors.size).toBe(0);
      expect(detector.activeEditor).toBeNull();
      expect(detector.observer).toBeNull();
    });
  });

  describe('findEditors', () => {
    it('should return empty NodeList when no editors present', () => {
      const editors = detector.findEditors();
      expect(editors.length).toBe(0);
    });

    it('should return all trix-editor elements', () => {
      document.body.innerHTML = `
        <trix-editor id="editor1"></trix-editor>
        <trix-editor id="editor2"></trix-editor>
      `;

      const editors = detector.findEditors();
      expect(editors.length).toBe(2);
    });

    it('should not return non-trix elements', () => {
      document.body.innerHTML = `
        <trix-editor id="editor1"></trix-editor>
        <div id="not-editor"></div>
        <textarea id="also-not-editor"></textarea>
      `;

      const editors = detector.findEditors();
      expect(editors.length).toBe(1);
    });
  });

  describe('getEditors', () => {
    it('should return empty array initially', () => {
      expect(detector.getEditors()).toEqual([]);
    });

    it('should return tracked editors as array', () => {
      const editor1 = document.createElement('trix-editor');
      const editor2 = document.createElement('trix-editor');

      detector.addEditor(editor1);
      detector.addEditor(editor2);

      const editors = detector.getEditors();
      expect(editors.length).toBe(2);
      expect(editors).toContain(editor1);
      expect(editors).toContain(editor2);
    });
  });

  describe('getEditorByIndex', () => {
    it('should return editor at specified index', () => {
      const editor1 = document.createElement('trix-editor');
      const editor2 = document.createElement('trix-editor');

      detector.addEditor(editor1);
      detector.addEditor(editor2);

      expect(detector.getEditorByIndex(0)).toBe(editor1);
      expect(detector.getEditorByIndex(1)).toBe(editor2);
    });

    it('should return undefined for out of bounds index', () => {
      expect(detector.getEditorByIndex(0)).toBeUndefined();
      expect(detector.getEditorByIndex(5)).toBeUndefined();
    });
  });

  describe('getEditorCount', () => {
    it('should return 0 initially', () => {
      expect(detector.getEditorCount()).toBe(0);
    });

    it('should return correct count', () => {
      detector.addEditor(document.createElement('trix-editor'));
      detector.addEditor(document.createElement('trix-editor'));
      expect(detector.getEditorCount()).toBe(2);
    });
  });

  describe('addEditor', () => {
    it('should add editor to set', () => {
      const editor = document.createElement('trix-editor');
      detector.addEditor(editor);
      expect(detector.editors.has(editor)).toBe(true);
    });

    it('should not add duplicate editors', () => {
      const editor = document.createElement('trix-editor');
      detector.addEditor(editor);
      detector.addEditor(editor);
      expect(detector.editors.size).toBe(1);
    });

    it('should call onEditorFound callback', () => {
      const callback = jest.fn();
      detector.onEditorFound = callback;

      const editor = document.createElement('trix-editor');
      detector.addEditor(editor);

      expect(callback).toHaveBeenCalledWith(editor);
    });

    it('should not call callback for duplicate editors', () => {
      const callback = jest.fn();
      detector.onEditorFound = callback;

      const editor = document.createElement('trix-editor');
      detector.addEditor(editor);
      detector.addEditor(editor);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('observe', () => {
    it('should set up MutationObserver', () => {
      const callback = jest.fn();
      detector.observe(callback);

      expect(detector.observer).not.toBeNull();
      expect(detector.onEditorFound).toBe(callback);
    });

    it('should detect dynamically added editors', (done) => {
      const callback = jest.fn();
      detector.observe(callback);

      // Add a trix-editor dynamically
      const editor = document.createElement('trix-editor');
      document.body.appendChild(editor);

      // MutationObserver is async, so we wait
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(editor);
        done();
      }, 10);
    });

    it('should detect nested trix-editors', (done) => {
      const callback = jest.fn();
      detector.observe(callback);

      // Add a container with trix-editor inside
      const container = document.createElement('div');
      const editor = document.createElement('trix-editor');
      container.appendChild(editor);
      document.body.appendChild(container);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(editor);
        done();
      }, 10);
    });
  });

  describe('trackFocus', () => {
    it('should update activeEditor on trix-focus event', () => {
      const editor = document.createElement('trix-editor');
      detector.trackFocus(editor);

      // Dispatch trix-focus event
      editor.dispatchEvent(new Event('trix-focus'));

      expect(detector.activeEditor).toBe(editor);
    });

    it('should track multiple editors independently', () => {
      const editor1 = document.createElement('trix-editor');
      const editor2 = document.createElement('trix-editor');

      detector.trackFocus(editor1);
      detector.trackFocus(editor2);

      editor1.dispatchEvent(new Event('trix-focus'));
      expect(detector.activeEditor).toBe(editor1);

      editor2.dispatchEvent(new Event('trix-focus'));
      expect(detector.activeEditor).toBe(editor2);
    });
  });

  describe('getActiveEditor', () => {
    it('should return last focused editor', () => {
      const editor1 = document.createElement('trix-editor');
      const editor2 = document.createElement('trix-editor');

      detector.addEditor(editor1);
      detector.addEditor(editor2);
      detector.trackFocus(editor1);
      detector.trackFocus(editor2);

      editor2.dispatchEvent(new Event('trix-focus'));

      expect(detector.getActiveEditor()).toBe(editor2);
    });

    it('should fall back to first editor if none focused', () => {
      const editor1 = document.createElement('trix-editor');
      const editor2 = document.createElement('trix-editor');

      detector.addEditor(editor1);
      detector.addEditor(editor2);

      expect(detector.getActiveEditor()).toBe(editor1);
    });

    it('should return undefined if no editors', () => {
      expect(detector.getActiveEditor()).toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should stop MutationObserver', () => {
      detector.observe(jest.fn());
      expect(detector.observer).not.toBeNull();

      detector.disconnect();
      expect(detector.observer).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      detector.observe(jest.fn());
      detector.disconnect();
      detector.disconnect();
      expect(detector.observer).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all tracked editors', () => {
      detector.addEditor(document.createElement('trix-editor'));
      detector.addEditor(document.createElement('trix-editor'));

      detector.clear();

      expect(detector.editors.size).toBe(0);
      expect(detector.activeEditor).toBeNull();
    });
  });
});
