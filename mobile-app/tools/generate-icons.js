const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iconPaths = [
  path.join(root, 'assets', 'images', 'icon.png'),
  path.join(root, 'assets', 'images', 'icon-512x512.png'),
  path.join(root, 'assets', 'images', 'icon-384x384.png'),
  path.join(root, 'assets', 'images', 'icon-256x256.png')
];
const srcIcon = iconPaths.find((p) => fs.existsSync(p));
const srcSplash = path.join(root, 'assets', 'images', 'splash-icon.png');
const outDir = path.join(root, 'assets', 'images', 'generated');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

if (!srcIcon) {
  console.error('Source icon not found. Expected one of:');
  console.error(iconPaths.join('\n'));
  process.exit(1);
}

console.log('Using source icon:', srcIcon);

const iconSizes = [48, 72, 96, 144, 192, 256, 384, 512, 1024]; // android & web
const iosIconSizes = [20, 29, 40, 60, 76, 83.5, 1024];

async function generate() {
  console.log('Generating icons into', outDir);

  // Generate generic icons
  for (const size of iconSizes) {
    const out = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(srcIcon).resize(size, size, { fit: 'cover' }).toFile(out);
    console.log('wrote', out);
  }

  // iOS sizes with scale factors
  for (const base of iosIconSizes) {
    const rounded = Math.round(base * 3); // produce high-res @3x approx
    const out = path.join(outDir, `ios-icon-${base}x${base}@3x.png`);
    await sharp(srcIcon).resize(rounded, rounded, { fit: 'cover' }).toFile(out);
    console.log('wrote', out);
  }

  // Splash
  if (fs.existsSync(srcSplash)) {
    const splashOut = path.join(outDir, 'splash-2732x2732.png');
    await sharp(srcSplash).resize(2732, 2732, { fit: 'contain', background: { r:255, g:255, b:255, alpha:1 } }).toFile(splashOut);
    console.log('wrote', splashOut);
  } else {
    // Fallback: create a square splash from icon
    const splashOut = path.join(outDir, 'splash-from-icon-1200x1200.png');
    await sharp(srcIcon).resize(1200, 1200, { fit: 'contain', background: { r:255, g:255, b:255, alpha:1 } }).toFile(splashOut);
    console.log('wrote', splashOut);
  }

  console.log('Done.');
}

generate().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(2);
});
