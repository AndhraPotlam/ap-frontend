const sharp = require('sharp');
const path = require('path');

const logoPath = path.join(__dirname, '../../public/andhrapotlamLogo.jpeg');
const publicDir = path.join(__dirname, '../../public');

async function generate() {
  try {
    // 1. apple-touch-icon.png (180x180) for iOS home screen
    await sharp(logoPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ Generated apple-touch-icon.png');

    // 2. icon-192.png (192x192) for manifest
    await sharp(logoPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ Generated icon-192.png');

    // 3. icon-512.png (512x512) for manifest
    await sharp(logoPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ Generated icon-512.png');
  } catch (err) {
    console.error('❌ Error generating icons:', err);
  }
}

generate();
