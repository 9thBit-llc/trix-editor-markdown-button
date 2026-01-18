/**
 * Markdown to HTML Converter
 * Uses the 'marked' library to convert Markdown to HTML
 * Note: HTML sanitization is handled by Trix Editor's insertHTML() method
 */

import { marked } from 'marked';

class MarkdownConverter {
  /**
   * Create a new MarkdownConverter instance
   * @param {object} options - Configuration options for marked
   */
  constructor(options = {}) {
    this.options = {
      gfm: true,           // GitHub Flavored Markdown
      breaks: true,        // Convert \n to <br>
      ...options
    };

    marked.setOptions(this.options);
  }

  /**
   * Convert Markdown to HTML
   * Note: Trix Editor's insertHTML() handles sanitization internally,
   * converting HTML to its internal document model and filtering
   * unsupported formatting.
   *
   * @param {string} markdown - The Markdown string to convert
   * @returns {string} - The converted HTML string
   */
  convert(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    return marked.parse(markdown);
  }

  /**
   * Convert Markdown to HTML synchronously (alias for convert)
   * @param {string} markdown - The Markdown string to convert
   * @returns {string} - The converted HTML string
   */
  parse(markdown) {
    return this.convert(markdown);
  }
}

export { MarkdownConverter };
export default MarkdownConverter;
