const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source image path
const sourceImage = path.join(__dirname, 'public', 'icons', 'ysp-192.png');
const outputDir = path.join(__dirname, 'public', 'icons');

// Icon sizes needed for PWA
const sizes = [
  { size: 72, name: 'ysp-72.png' },
  { size: 96, name: 'ysp-96.png' },
  { size: 128, name: 'ysp-128.png' },
  { size: 144, name: 'ysp-144.png' },
  { size: 152, name: 'ysp-152.png' },
  { size: 192, name: 'ysp-192-new.png' },
  { size: 384, name: 'ysp-384.png' },
  { size: 512, name: 'ysp-512-new.png' }
];

async function generateIcons() {
  console.log('🎨 Starting icon generation from YSP logo...\n');

  // Check if source exists
  if (!fs.existsSync(sourceImage)) {
    console.error('❌ Source image not found:', sourceImage);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Get source image info
    const metadata = await sharp(sourceImage).metadata();
    console.log(`📸 Source image: ${metadata.width}x${metadata.height}px\n`);

    // Generate each size
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${name} (${size}x${size}px)`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update manifest.webmanifest to use the new icon sizes');
    console.log('2. Test the PWA install prompt');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
