// scripts/generate-icon.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sharpIco = require('sharp-ico');

const SIZES = [256, 128, 64, 48, 32, 16];

const SVG_LOGO = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="45%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="arrowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <linearGradient id="arrowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base Rounded Card Container -->
  <rect x="12" y="12" width="232" height="232" rx="54" ry="54" fill="url(#bgGrad)" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>

  <!-- Orbit Guides -->
  <circle cx="128" cy="128" r="74" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="6" stroke-dasharray="12 8"/>

  <!-- Forward Conversion Arc & Arrow (Top) -->
  <path d="M 80 102 C 92 74 114 64 140 64 C 170 64 192 84 198 112" fill="none" stroke="url(#arrowGrad1)" stroke-width="16" stroke-linecap="round"/>
  <polygon points="210,110 188,96 190,124" fill="#38bdf8"/>

  <!-- Reverse Conversion Arc & Arrow (Bottom) -->
  <path d="M 176 154 C 164 182 142 192 116 192 C 86 192 64 172 58 144" fill="none" stroke="url(#arrowGrad2)" stroke-width="16" stroke-linecap="round"/>
  <polygon points="46,146 68,160 66,132" fill="#fb923c"/>

  <!-- Central Hub Orb -->
  <circle cx="128" cy="128" r="26" fill="#ffffff" filter="url(#glow)"/>
  <circle cx="128" cy="128" r="18" fill="#0f172a"/>
  <circle cx="128" cy="128" r="8" fill="#38bdf8"/>
</svg>`;

async function ensureIcon(force = false) {
  const buildDir = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const icoPath = path.join(buildDir, 'icon.ico');
  const pngPath = path.join(buildDir, 'icon.png');

  if (!force && fs.existsSync(icoPath) && fs.statSync(icoPath).size > 1000) {
    return { icoPath, pngPath, generated: false };
  }

  const svgBuffer = Buffer.from(SVG_LOGO, 'utf8');

  // إنشاء صورة الـ PNG الأساسية بحجم 256x256
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(pngPath);

  // إنشاء وتضمين كافة الأحجام القياسية لملف الـ ICO: (256, 128, 64, 48, 32, 16)
  const sharpInstances = SIZES.map(s => sharp(svgBuffer).resize(s, s));
  await sharpIco.sharpsToIco(sharpInstances, icoPath);

  return {
    icoPath,
    pngPath,
    generated: true,
    sizes: SIZES,
    icoSize: fs.statSync(icoPath).size
  };
}

if (require.main === module) {
  ensureIcon(true)
    .then((res) => {
      console.log('✓ Icon generated successfully at:', res.icoPath);
      console.log('  File size:', res.icoSize, 'bytes');
      console.log('  Embedded sizes:', res.sizes.join(', '));
    })
    .catch((err) => {
      console.error('✕ Failed to generate icon:', err);
      process.exit(1);
    });
}

module.exports = {
  ensureIcon,
  SIZES,
  SVG_LOGO
};
