# Trix Editor Markdown Button

A cross-browser extension (Chrome & Firefox) that adds Markdown support to [Trix editors](https://trix-editor.org/). Paste Markdown content and convert it to HTML with a single click.

## Features

- 🔍 **Auto-detection**: Automatically detects Trix editors on any webpage
- 📝 **Toolbar Integration**: Adds a "MD" button directly to the Trix toolbar
- 🎨 **Modal Input**: Clean modal dialog for pasting Markdown content
- 🔄 **Markdown Conversion**: Uses the `marked` library for accurate Markdown-to-HTML conversion
- 🌐 **Cross-browser**: Works on both Chrome and Firefox
- 🎯 **Multi-editor Support**: Handles multiple Trix editors on the same page (tracks last focused)
- 📦 **Popup Fallback**: Browser action popup for pages where toolbar injection fails

## Installation

### From Source

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build          # Build for all browsers
   npm run build:chrome   # Build for Chrome only
   npm run build:firefox  # Build for Firefox only
   ```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` folder

### Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `dist/firefox` folder

## Usage

1. Navigate to a page with a Trix editor
2. Click the **MD** button in the Trix toolbar (or the extension icon)
3. Paste your Markdown content in the modal
4. Click **"Add to Trix Editor"** (or press `Ctrl/Cmd + Enter`)
5. The Markdown is converted to HTML and inserted at the beginning of the editor

---

## Architecture

### Overview

The extension consists of several components that work together to detect Trix editors, provide a Markdown input UI, and inject converted HTML into the editor.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser Extension                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  Content Script  │    │  Page Context    │    │  Popup (Fallback)│  │
│  │  (Isolated)      │◄──►│  Script          │    │                  │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                        │            │
│           ▼                       ▼                        │            │
│  ┌──────────────────────────────────────────┐              │            │
│  │              Web Page DOM                 │◄─────────────┘            │
│  │  ┌─────────────┐  ┌─────────────────┐    │                           │
│  │  │ trix-editor │  │ trix-toolbar    │    │                           │
│  │  │  .editor    │  │  [MD Button]    │    │                           │
│  │  └─────────────┘  └─────────────────┘    │                           │
│  └──────────────────────────────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Content Script Isolation Problem

Browser extensions run content scripts in an **isolated world** - a separate JavaScript execution context from the page. This means:

- ✅ Content scripts CAN access and modify the DOM
- ❌ Content scripts CANNOT access JavaScript objects created by the page's scripts

Trix Editor attaches its API (`.editor` property with methods like `insertHTML()` and `setSelectedRange()`) to the `<trix-editor>` DOM element via JavaScript. Since this happens in the page's context, our content script cannot see or use these methods directly.

```javascript
// This works in the page's console, but NOT in a content script:
const editor = document.querySelector('trix-editor');
editor.editor.insertHTML('<strong>Hello</strong>');  // .editor is undefined!
```

### Solution: Page Context Script Injection

To access Trix's JavaScript API, we inject a separate script file (`page-context.js`) that runs in the page's context:

```
┌─────────────────────┐         ┌─────────────────────┐
│   Content Script    │         │  Page Context       │
│   (Isolated World)  │         │  (Page's World)     │
│                     │         │                     │
│  1. Detect editor   │         │                     │
│  2. Inject button   │         │                     │
│  3. Show modal      │         │                     │
│  4. Convert MD→HTML │         │                     │
│         │           │         │                     │
│         ▼           │         │                     │
│  5. Create bridge   │ ──────► │  6. Listen for      │
│     element with    │   DOM   │     requests        │
│     data attrs      │  Event  │         │           │
│         │           │         │         ▼           │
│         │           │ ◄────── │  7. Access Trix API │
│         ▼           │   DOM   │     editor.editor   │
│  8. Read response   │  Event  │     .insertHTML()   │
│                     │         │                     │
└─────────────────────┘         └─────────────────────┘
```

#### Why Not Inline Scripts?

Many websites (like OpenCollective) have strict **Content Security Policy (CSP)** headers that block inline scripts:

```
Content-Security-Policy: script-src 'self' ...
```

Our solution uses an **external script file** loaded via `<script src="...">`, which is CSP-compliant because:
1. The script is loaded from the extension's origin (declared in `web_accessible_resources`)
2. It's not inline JavaScript

### Component Details

#### 1. Content Script (`main.js`)

The main entry point that orchestrates everything:

- **TrixDetector**: Finds `<trix-editor>` elements and monitors for dynamically added ones using `MutationObserver`
- **ToolbarInjector**: Locates the `<trix-toolbar>` and injects the "MD" button
- **MarkdownModal**: Creates a Shadow DOM-isolated modal for Markdown input
- **MarkdownConverter**: Uses `marked` library to convert Markdown to HTML

```javascript
// Simplified flow
class TrixMarkdownExtension {
  init() {
    // Listen for trix-initialize events (editor ready)
    document.addEventListener('trix-initialize', (event) => {
      this.enhanceEditor(event.target);
    });
  }
  
  enhanceEditor(editor) {
    // Inject MD button into toolbar
    const injector = new ToolbarInjector(editor);
    injector.inject(() => this.openModal(editor));
  }
  
  openModal(editor) {
    this.modal.open((markdown) => {
      this.insertMarkdown(editor, markdown);
    });
  }
  
  async insertMarkdown(editor, markdown) {
    const html = this.converter.convert(markdown);
    // Use page context script to access Trix API
    await injectPageContextScript();
    await insertHtmlViaPageContext(html, editorSelector);
  }
}
```

#### 2. Page Context Script (`page-context.js`)

Runs in the page's JavaScript context where it can access Trix's API:

```javascript
// Listens for requests from content script
document.addEventListener('trix-markdown-request', (event) => {
  const bridge = event.target;
  const { html, editorSelector } = bridge.dataset;
  
  // Now we CAN access editor.editor!
  const editorElement = document.querySelector(editorSelector);
  const editor = editorElement.editor;
  
  editor.setSelectedRange([0, 0]);
  editor.insertHTML(html);
  
  // Send response back
  bridge.dispatchEvent(new CustomEvent('trix-markdown-response', {
    detail: { success: true }
  }));
});
```

#### 3. Communication Bridge

Content script and page context script communicate via DOM elements and CustomEvents:

```javascript
// Content script creates a bridge element
const bridge = document.createElement('div');
bridge.dataset.html = '<h1>Hello</h1>';
bridge.dataset.editorSelector = '[data-trix-markdown-id="..."]';
document.documentElement.appendChild(bridge);

// Dispatch request
bridge.dispatchEvent(new CustomEvent('trix-markdown-request'));

// Listen for response
bridge.addEventListener('trix-markdown-response', (e) => {
  console.log(e.detail.success);
});
```

#### 4. Fallback Methods

If the page context approach fails, we try alternative methods:

1. **execCommand**: `document.execCommand('insertHTML', false, html)` - deprecated but widely supported
2. **DOM Insertion**: Directly insert HTML nodes into the contenteditable area
3. **Hidden Input**: Update the hidden `<input>` element that Trix uses for form submission

### Shadow DOM for Modal

The modal uses Shadow DOM to ensure styles don't leak in or out:

```javascript
const shadowHost = document.createElement('div');
const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
shadowRoot.innerHTML = `
  <style>/* Encapsulated styles */</style>
  <div class="modal-overlay">...</div>
`;
```

This prevents:
- Page styles from affecting the modal appearance
- Modal styles from affecting the page

### Focus Tracking

When multiple Trix editors exist on a page, we track which one was last focused:

```javascript
editor.addEventListener('trix-focus', () => {
  this.activeEditor = editor;
});
```

This ensures Markdown is inserted into the correct editor.

### Manifest Configuration

The extension requires `web_accessible_resources` to allow the page to load our script:

```json
// Chrome (Manifest v3)
{
  "web_accessible_resources": [{
    "resources": ["content/page-context.js"],
    "matches": ["<all_urls>"]
  }]
}

// Firefox (Manifest v2)
{
  "web_accessible_resources": [
    "content/page-context.js"
  ]
}
```

---

## Project Structure

```
trix-editor-markdown-button/
├── src/
│   ├── background/
│   │   └── service-worker.js      # Extension lifecycle management
│   ├── content/
│   │   ├── main.js                # Main content script entry point
│   │   ├── trix-detector.js       # Detect Trix editors on page
│   │   ├── toolbar-injector.js    # Inject MD button into toolbar
│   │   ├── modal.js               # Shadow DOM modal component
│   │   ├── modal-styles.js        # Modal CSS (injected into Shadow DOM)
│   │   └── page-context.js        # Runs in page context for Trix API
│   ├── popup/
│   │   ├── popup.html             # Fallback popup UI
│   │   ├── popup.js               # Popup logic
│   │   └── popup.css              # Popup styles
│   ├── lib/
│   │   ├── browser-api.js         # Chrome/Firefox API abstraction
│   │   └── markdown-converter.js  # Markdown to HTML (uses marked)
│   └── styles/
│       └── modal.css              # Toolbar button styles
├── manifests/
│   ├── chrome/
│   │   └── manifest.json          # Manifest v3 for Chrome
│   ├── firefox/
│   │   └── manifest.json          # Manifest v2 for Firefox (stable)
│   └── firefox-v3/
│       └── manifest.json          # Manifest v3 for Firefox (experimental)
├── tests/
│   ├── unit/                      # Jest unit tests
│   │   ├── markdown-converter.test.js
│   │   ├── trix-detector.test.js
│   │   ├── toolbar-injector.test.js
│   │   └── modal.test.js
│   ├── integration/               # Puppeteer E2E tests
│   │   ├── setup.js
│   │   └── extension.test.js
│   └── setup.js                   # Jest setup with browser API mocks
├── icons/                         # Extension icons
├── scripts/
│   └── generate-icons.js          # Icon generation helper
├── dist/                          # Built extensions (gitignored)
│   ├── chrome/
│   └── firefox/
├── package.json
├── webpack.config.js
├── jest.config.js
├── babel.config.js
└── README.md
```

---

## Scripts

```bash
npm run build           # Build for Chrome and Firefox
npm run build:chrome    # Build Chrome extension
npm run build:firefox   # Build Firefox extension (Manifest v2)
npm run build:firefox-v3 # Build Firefox extension (Manifest v3)
npm run dev:chrome      # Build Chrome with watch mode
npm run dev:firefox     # Build Firefox with watch mode
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:integration # Run E2E tests (requires built extension)
```

---

## Supported Markdown

The extension uses [marked](https://marked.js.org/) with GitHub Flavored Markdown (GFM) enabled:

- **Bold** (`**text**`)
- *Italic* (`*text*`)
- Links (`[text](url)`)
- Ordered Lists
- Unordered Lists
- > Blockquotes
- Strikethrough (`~~text~~`)

### Partially Supported Markdown

- Code blocks (GFM)
  - fenced with triple backticks
  - but for some reason, all lines of the code block get smashed into a single line
  - effectively this means only single line code blocks work properly
- Headers
  - `### H3` - Works
  - None of the other levels work (`#`, `##`, `####`, `#####`, `######`)

### Unsupported Markdown

- Images (`![alt](url)`)
- Tables (GFM)
- `inline code`
- Horizontal Rules (`---`)

> **Note**: Trix Editor's `insertHTML()` method handles sanitization by converting HTML to its internal document model. Any formatting that Trix doesn't support will be automatically filtered out.

---

## Browser Compatibility

| Browser      | Manifest | Status          |
|--------------|----------|-----------------|
| Chrome 100+  | v3       | ✅ Stable        |
| Firefox 109+ | v2       | ✅ Stable        |
| Firefox 109+ | v3       | ⚠️ Experimental |

---

## Technical Decisions

### Markdown Library: `marked`
- **Rationale**: Fast, well-maintained, small bundle size (~12KB gzip)
- **Alternative considered**: `markdown-it` (more extensible but larger)

### HTML Sanitization: Delegated to Trix Editor
- **Rationale**: Trix Editor's `insertHTML()` method converts HTML into its internal document model, automatically filtering out any formatting it cannot represent
- **Benefit**: No redundant sanitization, smaller bundle size, consistent behavior with Trix's native HTML handling

### Shadow DOM for Modal
- **Rationale**: Ensures modal styles don't conflict with host page styles
- **Benefit**: Consistent appearance across all websites

### Page Context Script for Trix API Access
- **Rationale**: Content scripts run in an isolated world and cannot access JavaScript properties attached to DOM elements by page scripts
- **Solution**: Inject a separate script file that runs in the page's context
- **CSP Compliance**: Uses external script file (not inline) declared in `web_accessible_resources`

### Focus Tracking via `trix-focus` Event
- **Rationale**: Handles multiple Trix editors on same page
- **Implementation**: Listen to `trix-focus` event to track the last-focused editor

---

## Trix Editor API Reference

### Inserting HTML

```javascript
var element = document.querySelector("trix-editor");
element.editor.setSelectedRange([0, 0]); // Position at start
element.editor.insertHTML("<strong>Hello</strong>");
```

### Events

- `trix-initialize`: Editor is ready (use this to enhance editors)
- `trix-focus`: Editor received focus
- `trix-blur`: Editor lost focus
- `trix-change`: Content changed

### Toolbar Structure

```html
<trix-toolbar id="toolbar-id">
  <div class="trix-button-row">
    <span class="trix-button-group">
      <!-- Text formatting buttons -->
    </span>
    <span class="trix-button-group">
      <!-- Block formatting buttons -->
    </span>
  </div>
</trix-toolbar>
<trix-editor toolbar="toolbar-id"></trix-editor>
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -am 'Add my feature'`
6. Push: `git push origin feature/my-feature`
7. Submit a Pull Request

---

## Testing

The project includes 96 unit tests covering all major components:

```bash
npm test
```

**Test Coverage:**

| Component         | Tests | Coverage                                           |
|-------------------|-------|----------------------------------------------------|
| MarkdownConverter | 18    | Input validation, MD→HTML conversion               |
| TrixDetector      | 25    | Editor detection, MutationObserver, focus tracking |
| ToolbarInjector   | 20    | Toolbar finding, button injection, events          |
| MarkdownModal     | 33    | Shadow DOM, open/close, keyboard shortcuts         |

---

## License

A public LICENSE that makes software free for noncommercial and small-business use,
with a guarantee that fair, reasonable, and nondiscriminatory paid-license terms will be available for everyone else.

[Big Time License v2.0.2](https://bigtimelicense.com/versions/2.0.2)

### Paid licenses

See the [Big Time License v2.0.2](https://bigtimelicense.com/versions/2.0.2) 
for what circumstances require a paid license.

$0.25 USD per employee per year for qualifying "[Big Business](LICENSE.md#big-business)" commercial use, as defined above.
If you're interested in licensing `trix-editor-markdown-button` for your business,
please contact [peter@9thbit.net](mailto:peter@9thbit.net),
and join the Official Discord 👉️ [![Live Chat on Discord][✉️discord-invite-img]][✉️discord-invite].

> 40 employees = $10 USD per year

Payments are accepted via any of the following:

- 💌 [![GitHub Sponsors][🖇sponsor-bottom-img]][🖇sponsor]
- 💌 [![Liberapay][⛳liberapay-bottom-img]][⛳liberapay]
- 💌 [![PayPal][🖇paypal-bottom-img]][🖇paypal]

#### How to Request

Request a fair commercial license by sending an email to [peter@9thbit.net](mailto:peter@9thbit.net) _and_ messaging
the `#usr-pboling` channel on the Official Discord 👉️ [![Live Chat on Discord][✉️discord-invite-img]][✉️discord-invite].
If both of your contact attempts fail to elicit a response within the time period allotted in [Big Business](LICENSE.md#big-business)
the licensor will consider that equivalent to a fair commercial license under [Big Business](LICENSE.md#big-business).

[⛳liberapay-img]: https://img.shields.io/liberapay/goal/pboling.svg?logo=liberapay&color=a51611&style=flat
[⛳liberapay]: https://liberapay.com/pboling/donate
[🖇sponsor-img]: https://img.shields.io/badge/Sponsor_Me!-pboling.svg?style=social&logo=github
[🖇sponsor]: https://github.com/sponsors/pboling
[🖇polar-img]: https://img.shields.io/badge/polar-donate-a51611.svg?style=flat
[🖇polar]: https://polar.sh/pboling
[🖇kofi-img]: https://img.shields.io/badge/ko--fi-%E2%9C%93-a51611.svg?style=flat
[🖇kofi]: https://ko-fi.com/O5O86SNP4
[🖇patreon-img]: https://img.shields.io/badge/patreon-donate-a51611.svg?style=flat
[🖇patreon]: https://patreon.com/galtzo
[🖇buyme-small-img]: https://img.shields.io/badge/buy_me_a_coffee-%E2%9C%93-a51611.svg?style=flat
[🖇buyme]: https://www.buymeacoffee.com/pboling
[🖇paypal-img]: https://img.shields.io/badge/donate-paypal-a51611.svg?style=flat&logo=paypal
[🖇paypal]: https://www.paypal.com/paypalme/peterboling
[✉️discord-invite]: https://discord.gg/3qme4XHNKN
[✉️discord-invite-img]: https://img.shields.io/discord/1373797679469170758?style=flat
[⛳liberapay-bottom-img]: https://img.shields.io/liberapay/goal/pboling.svg?style=for-the-badge&logo=liberapay&color=a51611
[🖇sponsor-bottom-img]: https://img.shields.io/badge/Sponsor_Me!-pboling-blue?style=for-the-badge&logo=github
[🖇buyme-img]: https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20latte&emoji=&slug=pboling&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff
[🖇paypal-bottom-img]: https://img.shields.io/badge/donate-paypal-a51611.svg?style=for-the-badge&logo=paypal&color=0A0A0A
[🖇floss-funding.dev]: https://floss-funding.dev
[🖇floss-funding-gem]: https://github.com/galtzo-floss/floss_funding
[✉️discord-invite-img-ftb]: https://img.shields.io/discord/1373797679469170758?style=for-the-badge

---

## Acknowledgments

- [Trix Editor](https://trix-editor.org/) by Basecamp
- [marked](https://marked.js.org/) for Markdown parsing
