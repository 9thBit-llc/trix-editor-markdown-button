/**
 * Icon Generator Script
 * Creates placeholder PNG icons for the extension
 *
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Minimal valid PNG files (1x1 pixel, purple #667eea)
// These are base64-encoded minimal PNGs
const pngData = {
  // 16x16 purple PNG
  16: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkYGD4z0ABYBw1YDQMRsMAwzAYDQMKAABqHgH/m7+q9QAAAABJRU5ErkJggg==',
    'base64'
  ),
  // 48x48 purple PNG
  48: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAALklEQVRoQ+3QMQEAAAjDMKhA/0Eq2EB1cG7bT3J3uwMECBAgQIAAAQIECBD4LXABmjAA/3yg3wkAAAAASUVORK5CYII=',
    'base64'
  ),
  // 128x128 purple PNG
  128: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAPklEQVR4Ae3BgQAAAADDoPlTH+EChQoVKlSoUKFChQoVKlSoUKFChQoVKlSoUKFChQoVKlSoUKFChQoVKlR4AcYgAP9STLGDAAAAASUVORK5CYII=',
    'base64'
  )
};

const iconsDir = path.resolve(__dirname, '../icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create PNG icons
[16, 48, 128].forEach(size => {
  const filename = `icon${size}.png`;
  const filepath = path.join(iconsDir, filename);

  console.log(`Creating: ${filename}`);
  fs.writeFileSync(filepath, pngData[size]);
});

console.log('\nPlaceholder icons created successfully!');
console.log('Note: These are simple purple placeholder icons.');
console.log('Replace with properly designed icons before release.');
