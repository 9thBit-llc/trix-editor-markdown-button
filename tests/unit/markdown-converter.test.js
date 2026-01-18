/**
 * Unit tests for MarkdownConverter
 */

// Mock the marked module
jest.mock('marked', () => ({
  marked: {
    parse: jest.fn((input) => {
      // Simple mock implementation for testing
      if (!input) return '';

      let result = input;

      // Bold
      result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Italic
      result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Headers
      result = result.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      result = result.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      result = result.replace(/^### (.+)$/gm, '<h3>$1</h3>');

      // Images (must be before links since they share similar syntax)
      result = result.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');

      // Links
      result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

      // Code blocks
      result = result.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

      // Inline code
      result = result.replace(/`(.+?)`/g, '<code>$1</code>');

      // Unordered lists
      result = result.replace(/^- (.+)$/gm, '<li>$1</li>');

      // Strikethrough
      result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

      // Wrap paragraphs (simplified)
      if (!result.startsWith('<')) {
        result = `<p>${result}</p>`;
      }

      return result;
    }),
    setOptions: jest.fn()
  }
}));

const { MarkdownConverter } = require('../../src/lib/markdown-converter.js');

describe('MarkdownConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new MarkdownConverter();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(converter).toBeInstanceOf(MarkdownConverter);
      expect(converter.options.gfm).toBe(true);
      expect(converter.options.breaks).toBe(true);
    });

    it('should accept custom options', () => {
      const customConverter = new MarkdownConverter({ gfm: false });
      expect(customConverter.options.gfm).toBe(false);
      expect(customConverter.options.breaks).toBe(true);
    });
  });

  describe('convert', () => {
    it('should return empty string for empty input', () => {
      expect(converter.convert('')).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(converter.convert(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(converter.convert(undefined)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(converter.convert(123)).toBe('');
      expect(converter.convert({})).toBe('');
      expect(converter.convert([])).toBe('');
    });

    it('should convert **bold** to <strong>', () => {
      const result = converter.convert('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert *italic* to <em>', () => {
      const result = converter.convert('*italic*');
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert # Heading to <h1>', () => {
      const result = converter.convert('# Heading');
      expect(result).toContain('<h1>Heading</h1>');
    });

    it('should convert ## Heading to <h2>', () => {
      const result = converter.convert('## Heading');
      expect(result).toContain('<h2>Heading</h2>');
    });

    it('should convert ### Heading to <h3>', () => {
      const result = converter.convert('### Heading');
      expect(result).toContain('<h3>Heading</h3>');
    });

    it('should convert links with href attribute', () => {
      const result = converter.convert('[Link Text](https://example.com)');
      expect(result).toContain('<a href="https://example.com">Link Text</a>');
    });

    it('should convert images with src and alt attributes', () => {
      const result = converter.convert('![Alt Text](https://example.com/image.png)');
      expect(result).toContain('<img src="https://example.com/image.png" alt="Alt Text">');
    });

    it('should convert inline code', () => {
      const result = converter.convert('Use `code` here');
      expect(result).toContain('<code>code</code>');
    });

    it('should convert code blocks', () => {
      const result = converter.convert('```js\nconst x = 1;\n```');
      expect(result).toContain('<pre><code>');
    });

    it('should convert unordered list items', () => {
      const result = converter.convert('- Item 1');
      expect(result).toContain('<li>Item 1</li>');
    });

    it('should convert strikethrough text', () => {
      const result = converter.convert('~~deleted~~');
      expect(result).toContain('<del>deleted</del>');
    });

    it('should handle complex nested markdown', () => {
      const markdown = '**bold *and italic***';
      const result = converter.convert(markdown);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });

  describe('parse', () => {
    it('should be an alias for convert', () => {
      const markdown = '# Test';
      expect(converter.parse(markdown)).toBe(converter.convert(markdown));
    });
  });
});
