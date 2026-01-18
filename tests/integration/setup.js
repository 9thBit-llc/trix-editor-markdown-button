/**
 * Integration test setup for Puppeteer E2E tests
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '../../dist/chrome');

/**
 * Launch browser with extension loaded
 */
async function launchBrowserWithExtension() {
  return puppeteer.launch({
    headless: false, // Extensions require headed mode
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
}

/**
 * Create a test page with Trix editor
 */
function createTrixTestPage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Trix Editor Test Page</title>
      <link rel="stylesheet" href="https://unpkg.com/trix@2.0.0/dist/trix.css">
      <script src="https://unpkg.com/trix@2.0.0/dist/trix.umd.min.js"></script>
    </head>
    <body>
      <h1>Trix Editor Test</h1>
      <form>
        <input id="content" type="hidden" name="content">
        <trix-editor input="content"></trix-editor>
      </form>
    </body>
    </html>
  `;
}

module.exports = {
  launchBrowserWithExtension,
  createTrixTestPage,
  EXTENSION_PATH
};
