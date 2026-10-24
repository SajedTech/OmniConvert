// src/main/engines/image-engine.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const sharp = require('sharp');
const sharpIco = require('sharp-ico');
const ffmpegStatic = require('ffmpeg-static');
const { resolveBinaryPath } = require('./media-engine');

const resolvedFfmpegPath = resolveBinaryPath(ffmpegStatic);

// الامتدادات القياسية المدعومة مباشرة عبر محرك Sharp
const SHARP_STANDARD_EXTENSIONS = [
  'jpg', 'jpeg', 'jpe', 'jfif', 'pjpeg', 'pjp',
  'png', 'gif', 'webp', 'avif', 'tiff', 'tif',
  'svg', 'ico'
];

// الامتدادات الممتدة وصور الكاميرات الاحترافية RAW وخامات الألعاب (عبر خط أنابيب FFmpeg)
const EXTENDED_IMAGE_EXTENSIONS = [
  'raw', 'dng', 'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2',
  'raf', 'orf', 'rw2', 'pef', 'ptx', 'dcm', 'dicom', 'fits', 'fit',
  'tga', 'dds', 'psd', 'hdr', 'exr', 'pcx', 'ppm', 'pgm', 'pbm', 'pnm',
  'sgi', 'rgb', 'rgba', 'bw', 'xbm', 'xpm', 'qoi'
];

// خريطة لتتبع المهام الجارية لتمكين الإلغاء
const activeTasks = new Map();

/**
 * دالة مساعدة لترميز بكسلات الصورة الخام إلى ملف BMP قياسي (24 بت غير مضغوط)
 */
function encodeBmp(rawPixels, width, height, channels) {
  const bytesPerPixel = 3;
  const rowSize = Math.floor((bytesPerPixel * width + 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // رأس ملف BMP (14 بايت)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt16LE(0, 6);
  buf.writeUInt16LE(0, 8);
  buf.writeUInt32LE(54, 10);

  // رأس معلومات الصورة DIB (40 بايت)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // موجب = من الأسفل للأعلى
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28); // 24-bit BGR
  buf.writeUInt32LE(0, 30);  // BI_RGB غير مضغوط
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // 72 DPI أفقي
  buf.writeInt32LE(2835, 42); // 72 DPI رأسي
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = y * width * channels;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + x * channels;
      buf[offset++] = rawPixels[px + 2]; // Blue
      buf[offset++] = rawPixels[px + 1]; // Green
      buf[offset++] = rawPixels[px];     // Red
    }
    const padding = rowSize - (width * 3);
    for (let p = 0; p < padding; p++) {
      buf[offset++] = 0;
    }
  }

  return buf;
}

/**
 * استخراج الإطار الأول من الصور الممتدة والخام عبر FFmpeg في الذاكرة مباشرة (Memory Pipe)
 * ffmpeg -i inputPath -vframes 1 -f image2pipe -vcodec png -
 */
function extractFrameWithFfmpeg(inputPath, taskCancelRef = null) {
  return new Promise((resolve, reject) => {
    if (!resolvedFfmpegPath) {
      return reject(new Error('ثنائي FFmpeg غير متوفر لمعالجة الصور الممتدة'));
    }

    const args = ['-i', inputPath, '-vframes', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'];
    const proc = spawn(resolvedFfmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let errOutput = '';

    if (taskCancelRef) {
      taskCancelRef.currentProc = proc;
    }

    proc.stdout.on('data', chunk => chunks.push(chunk));
    proc.stderr.on('data', data => { errOutput += data.toString(); });

    proc.on('close', code => {
      if (taskCancelRef) taskCancelRef.currentProc = null;
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`فشل استخراج إطار الصورة عبر FFmpeg: ${errOutput || 'كود الخروج ' + code}`));
      }
    });

    proc.on('error', err => {
      if (taskCancelRef) taskCancelRef.currentProc = null;
      reject(err);
    });
  });
}

/**
 * فحص بيانات الصورة واستخراج أبعادها ونوعها مع دعم المحرك المزدوج (Sharp + FFmpeg)
 */
async function getImageMetadata(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`الملف غير موجود: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');

  // 1. إذا كان الملف ينتمي للمجموعة القياسية
  if (SHARP_STANDARD_EXTENSIONS.includes(ext)) {
    try {
      const meta = await sharp(filePath).metadata();
      return {
        width: meta.width || 0,
        height: meta.height || 0,
        format: (meta.format || ext).toLowerCase(),
        channels: meta.channels || 0,
        hasAlpha: Boolean(meta.hasAlpha),
        space: meta.space || '',
        size: stat.size
      };
    } catch (sharpErr) {
      // محاولة العودة لـ FFmpeg في حال فشل Sharp في قراءة امتداد قياسي غير نمطي
    }
  }

  // 2. معالجة الصور الممتدة / RAW / BMP عبر FFmpeg في الذاكرة
  try {
    const pngBuffer = await extractFrameWithFfmpeg(filePath);
    const meta = await sharp(pngBuffer).metadata();
    return {
      width: meta.width || 0,
      height: meta.height || 0,
      format: ext,
      channels: meta.channels || 0,
      hasAlpha: Boolean(meta.hasAlpha),
      space: meta.space || '',
      size: stat.size
    };
  } catch (err) {
    return {
      width: 0,
      height: 0,
      format: ext,
      channels: 3,
      hasAlpha: false,
      space: 'srgb',
      size: stat.size
    };
  }
}

// المقاسات المعيارية والطباعة القياسية (A4, A5, FHD, Instagram)
const IMAGE_PRESET_SIZES = {
  'a4-print-300': { width: 2480, height: 3508, label: 'A4 (طباعة فائقة الدقة 300 DPI)' },
  'a4-screen-150': { width: 1240, height: 1754, label: 'A4 (شاشة ومستندات 150 DPI)' },
  'a5-print-300': { width: 1748, height: 2480, label: 'A5 (طباعة 300 DPI)' },
  'fhd-1080p': { width: 1920, height: 1080, label: 'Full HD (1080p)' },
  'insta-square': { width: 1080, height: 1080, label: 'مربع Instagram (1:1)' },
  'story-shorts': { width: 1080, height: 1920, label: 'Story / Shorts (9:16)' }
};

/**
 * تطبيق خيارات التحجيم على كائن Sharp
 */
function applyResize(pipeline, options, originalMeta) {
  const { width, height, scale, presetSize, maintainAspectRatio = true, fit } = options || {};

  // 1. فحص المقاسات الجاهزة (A4, A5, 1080p, Instagram)
  if (presetSize && IMAGE_PRESET_SIZES[presetSize]) {
    const pSize = IMAGE_PRESET_SIZES[presetSize];
    const fitMode = fit || (maintainAspectRatio ? 'inside' : 'fill');
    return pipeline.resize(pSize.width, pSize.height, {
      fit: fitMode,
      withoutEnlargement: false
    });
  }

  // 2. التحجيم بنسبة مئوية (Scale %)
  if (scale && Number(scale) > 0 && Number(scale) !== 100 && originalMeta.width && originalMeta.height) {
    const factor = Number(scale) / 100;
    const newW = Math.max(1, Math.round(originalMeta.width * factor));
    const newH = Math.max(1, Math.round(originalMeta.height * factor));
    return pipeline.resize(newW, newH, { fit: fit || 'inside' });
  }

  // 3. أبعاد مخصصة صريحة (Custom Dimensions)
  if (width || height) {
    let w = width ? parseInt(width, 10) : null;
    let h = height ? parseInt(height, 10) : null;
    if (options.ensureEven || options.forceEvenDimensions) {
      if (w && w % 2 !== 0) w -= 1;
      if (h && h % 2 !== 0) h -= 1;
    }
    const fitMode = fit || (maintainAspectRatio ? 'inside' : 'fill');
    return pipeline.resize(w, h, {
      fit: fitMode,
      withoutEnlargement: options.withoutEnlargement || false
    });
  }

  // 4. تصحيح الأبعاد الفردية للأبعاد الزوجية الصريحة عند طلب ذلك
  if (options.ensureEven || options.forceEvenDimensions) {
    const curW = (originalMeta && originalMeta.width) || 0;
    const curH = (originalMeta && originalMeta.height) || 0;
    if (curW && curH && (curW % 2 !== 0 || curH % 2 !== 0)) {
      const evenW = curW - (curW % 2);
      const evenH = curH - (curH % 2);
      return pipeline.resize(evenW, evenH, { fit: 'fill' });
    }
  }

  return pipeline;
}

/**
 * تطبيق فلاتر تحسين الوضوح والحدة والتدوير والانعكاس
 */
function applyEnhancements(pipeline, options = {}, meta = null) {
  // زيادة حدة وتفاصيل الصورة (Sharpening)
  if (options.sharpen) {
    const origWidth = meta?.width || 0;
    const origHeight = meta?.height || 0;
    const targetWidth = Number(options.width) || origWidth;
    const targetHeight = Number(options.height) || origHeight;

    // فحص وقائي للأبعاد: إذا كانت أبعاد الصورة أقل من 400x400 بكسل، يتم تعطيل الـ Sharpening العنيف تلقائياً لمنع بكسلة وتشويه الصور الصغيرة المأخوذة من الويب
    const isSmall = (origWidth > 0 && origWidth < 400) ||
                    (origHeight > 0 && origHeight < 400) ||
                    (targetWidth > 0 && targetWidth < 400) ||
                    (targetHeight > 0 && targetHeight < 400);

    if (!isSmall) {
      // تخفيف وسائط فلتر الحدة ليكون ناعماً وطبيعياً لتجنب تضخيم تشوهات الضغط (Halo Artifacts)
      pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 1.0 });
    }
  }

  // التدوير
  if (options.rotate) {
    const rot = Number(options.rotate) % 360;
    if (rot !== 0) {
      pipeline = pipeline.rotate(rot);
    }
  }

  // الانعكاس الأفقي (Horizontal Flip)
  if (options.flipH || options.flip === 'horizontal' || options.flip === 'both') {
    pipeline = pipeline.flop();
  }

  // الانعكاس الرأسي (Vertical Flip)
  if (options.flipV || options.flip === 'vertical' || options.flip === 'both') {
    pipeline = pipeline.flip();
  }

  return pipeline;
}

/**
 * تطبيق الاقتصاص المكاني للصور (Interactive Crop / Extract)
 */
function applyCrop(pipeline, options = {}, meta = null) {
  const crop = options.crop || options.extract;
  if (!crop || typeof crop !== 'object') return pipeline;

  let left = Math.round(Number(crop.left) || 0);
  let top = Math.round(Number(crop.top) || 0);
  let width = Math.round(Number(crop.width) || 0);
  let height = Math.round(Number(crop.height) || 0);

  if (width <= 0 || height <= 0) return pipeline;

  // فحص وقائي للحدود مع أبعاد الصورة الأصلية
  if (meta && meta.width && meta.height) {
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left >= meta.width || top >= meta.height) return pipeline;
    if (left + width > meta.width) width = meta.width - left;
    if (top + height > meta.height) height = meta.height - top;
    if (width <= 0 || height <= 0) return pipeline;
  }

  return pipeline.extract({ left, top, width, height });
}

/**
 * تجهيز مسار المعالجة مع دمج الاقتصاص والتحجيم والتحسينات
 */
function prepareImagePipeline(sourceInput, options, meta) {
  let pipeline = sharp(sourceInput);
  pipeline = applyCrop(pipeline, options, meta);

  // تحديث الأبعاد الوصفية بعد الاقتصاص إن وجد لمراعاة المقاسات التالية
  const crop = options.crop || options.extract;
  let effectiveMeta = meta;
  if (crop && Number(crop.width) > 0 && Number(crop.height) > 0) {
    const croppedW = Math.round(Number(crop.width));
    const croppedH = Math.round(Number(crop.height));
    effectiveMeta = { ...meta, width: croppedW, height: croppedH };
  }

  pipeline = applyResize(pipeline, options, effectiveMeta);
  pipeline = applyEnhancements(pipeline, options, effectiveMeta);
  return pipeline;
}

/**
 * دالة مساعدة لتصدير خامات TGA عبر تمرير بكسلات PNG إلى FFmpeg في الذاكرة
 */
function convertPngBufferToTga(pngBuffer, outputPath, taskCancelRef = null) {
  return new Promise((resolve, reject) => {
    if (!resolvedFfmpegPath) {
      return reject(new Error('ثنائي FFmpeg غير متوفر لتصدير خامات TGA'));
    }

    const args = ['-i', 'pipe:0', '-y', outputPath];
    const proc = spawn(resolvedFfmpegPath, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let errOutput = '';

    if (taskCancelRef) {
      taskCancelRef.currentProc = proc;
    }

    proc.stderr.on('data', data => { errOutput += data.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`فشل تصدير خامة TGA عبر FFmpeg (كود ${code}): ${errOutput}`));
    });

    proc.stdin.write(pngBuffer);
    proc.stdin.end();
  });
}

/**
 * تحويل الصور عبر المحرك المزدوج (Sharp + FFmpeg Fallback)
 * يدعم الحاويات العالمية القياسية الست: [PNG, JPG, WebP, AVIF, BMP, ICO]
 */
async function convertImage({ taskId, inputPath, outputPath, targetFormat, options = {}, onProgress = null }) {
  const startTime = Date.now();
  const ext = (targetFormat || path.extname(outputPath)).toLowerCase().replace(/^\./, '');
  const inputExt = path.extname(inputPath).toLowerCase().replace(/^\./, '');

  // التأكد من وجود مجلد الإخراج
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let isCancelled = false;
  const taskCancelRef = { currentProc: null };

  activeTasks.set(taskId, {
    cancel: () => {
      isCancelled = true;
      if (taskCancelRef.currentProc) {
        try { taskCancelRef.currentProc.kill('SIGKILL'); } catch (e) {}
      }
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {}
    },
    outputPath
  });

  if (typeof onProgress === 'function') {
    onProgress({ taskId, percent: 15, speed: '1.0x', eta: '00:01', timemark: '00:00:00' });
  }

  try {
    let sourceInput = inputPath;

    // فحص ما إذا كان الملف يحتاج خط أنابيب FFmpeg (Extended / RAW / Gaming / BMP)
    const isExtended = EXTENDED_IMAGE_EXTENSIONS.includes(inputExt) || inputExt === 'bmp';

    if (isExtended) {
      sourceInput = await extractFrameWithFfmpeg(inputPath, taskCancelRef);
    }

    if (isCancelled) throw new Error('تم إلغاء عملية تحويل الصورة');

    let initialSharp;
    try {
      initialSharp = sharp(sourceInput);
    } catch (e) {
      // محاولة بديلة عبر FFmpeg إذا فشل Sharp مع المدخل المباشر
      sourceInput = await extractFrameWithFfmpeg(inputPath, taskCancelRef);
      initialSharp = sharp(sourceInput);
    }

    const meta = await initialSharp.metadata();

    if (isCancelled) throw new Error('تم إلغاء عملية تحويل الصورة');

    if (typeof onProgress === 'function') {
      onProgress({ taskId, percent: 45, speed: '1.0x', eta: '00:01', timemark: '00:00:00' });
    }

    // 1. تحويل إلى ICO (Sharp + sharp-ico)
    if (ext === 'ico') {
      const targetSizes = options.icoSizes && Array.isArray(options.icoSizes) && options.icoSizes.length > 0
        ? options.icoSizes
        : [16, 32, 48, 64, 128, 256];

      const imageList = targetSizes.map(sz => {
        let p = sharp(sourceInput);
        p = applyCrop(p, options, meta);
        p = applyEnhancements(p, options, meta);
        return p.resize(sz, sz, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      });

      await sharpIco.sharpsToIco(imageList, outputPath);
    }
    // 2. تحويل إلى BMP (24-bit غير مضغوط)
    else if (ext === 'bmp') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);
      pipeline = pipeline.flatten({ background: '#ffffff' });

      const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
      if (isCancelled) throw new Error('تم إلغاء عملية تحويل الصورة');

      const bmpBuf = encodeBmp(data, info.width, info.height, info.channels);
      await fs.promises.writeFile(outputPath, bmpBuf);
    }
    // 3. تحويل إلى JPG / JPEG
    else if (ext === 'jpg' || ext === 'jpeg') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);
      pipeline = pipeline.flatten({ background: '#ffffff' });

      const quality = Math.max(1, Math.min(100, Number(options.quality) || 85));
      await pipeline.jpeg({
        quality,
        mozjpeg: true,
        progressive: true
      }).toFile(outputPath);
    }
    // 4. تحويل إلى PNG
    else if (ext === 'png') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);

      const compressionLevel = Math.max(0, Math.min(9, options.compressionLevel !== undefined ? Number(options.compressionLevel) : 6));
      await pipeline.png({
        compressionLevel,
        palette: Boolean(options.palette)
      }).toFile(outputPath);
    }
    // 5. تحويل إلى WebP
    else if (ext === 'webp') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);

      const isLossless = Boolean(options.lossless);
      const quality = Math.max(1, Math.min(100, Number(options.quality) || 80));

      await pipeline.webp({
        lossless: isLossless,
        quality
      }).toFile(outputPath);
    }
    // 6. تحويل إلى AVIF (ضغط فائق عالي الجودة)
    else if (ext === 'avif') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);

      const isLossless = Boolean(options.lossless);
      const quality = Math.max(1, Math.min(100, Number(options.quality) || 80));

      await pipeline.avif({
        lossless: isLossless,
        quality
      }).toFile(outputPath);
    }
    // 7. تحويل إلى TIFF
    else if (ext === 'tiff' || ext === 'tif') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);

      await pipeline.tiff({
        quality: Math.max(1, Math.min(100, Number(options.quality) || 85))
      }).toFile(outputPath);
    }
    // 8. تحويل إلى GIF
    else if (ext === 'gif') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);
      await pipeline.gif().toFile(outputPath);
    }
    // 9. تحويل إلى TGA (خامات الألعاب) عبر FFmpeg
    else if (ext === 'tga') {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);
      const pngBuf = await pipeline.png().toBuffer();
      if (isCancelled) throw new Error('تم إلغاء عملية تحويل الصورة');
      await convertPngBufferToTga(pngBuf, outputPath, taskCancelRef);
    }
    // صيغ أخرى عامة
    else {
      let pipeline = prepareImagePipeline(sourceInput, options, meta);
      await pipeline.toFile(outputPath);
    }

    if (isCancelled) throw new Error('تم إلغاء عملية تحويل الصورة');

    const conversionTimeMs = Date.now() - startTime;
    const finalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;

    if (typeof onProgress === 'function') {
      onProgress({ taskId, percent: 100.0, speed: '1.0x', eta: '00:00', timemark: '00:00:00' });
    }

    activeTasks.delete(taskId);

    return {
      taskId,
      outputPath,
      finalSize,
      duration: 0,
      conversionTimeMs
    };
  } catch (err) {
    activeTasks.delete(taskId);
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (e) {}
    throw err;
  }
}

/**
 * ضغط الصورة الذكي للوصول إلى الحجم المستهدف المطلوب تلقائياً (Smart Image Compressor)
 * ضبط معاملات جودة MozJPEG / WebP تلقائياً لتناسب الحجم المستهدف
 */
async function compressImageTask({ taskId, inputPath, outputPath, targetSizeMB, options = {}, onProgress = null }) {
  const startTime = Date.now();
  const targetBytes = Math.max(1024, Math.round((Number(targetSizeMB) || 0.5) * 1024 * 1024));
  const ext = (path.extname(outputPath) || path.extname(inputPath) || '.webp').toLowerCase().replace(/^\./, '');

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const stat = fs.statSync(inputPath);
  const origSize = stat.size || 1024;
  const ratio = Math.min(1.0, targetBytes / origSize);

  // حساب جودة البداية الذكية
  let quality = Math.max(15, Math.min(92, Math.round(ratio * 90)));
  const meta = await sharp(inputPath).metadata();

  let finalBuffer = null;
  const useWebp = (ext === 'webp' || ext === 'png');

  // حلقة تقارب ذكية سريعة (Max 3 محاولات)
  for (let attempt = 0; attempt < 3; attempt++) {
    let pipeline = sharp(inputPath);

    // إذا كان الحجم المستهدف صغيراً جداً بالنسبة للأبعاد الأصلية، نقوم بتصغير الأبعاد تدريجياً
    if (ratio < 0.35 && meta.width && meta.height) {
      const scaleFactor = Math.max(0.4, Math.min(1.0, Math.sqrt(ratio * 1.5)));
      const newW = Math.round(meta.width * scaleFactor);
      const newH = Math.round(meta.height * scaleFactor);
      pipeline = pipeline.resize(newW - (newW % 2), newH - (newH % 2), { fit: 'inside' });
    }

    if (useWebp) {
      pipeline = pipeline.webp({ quality, effort: 4 });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const testBuf = await pipeline.toBuffer();
    finalBuffer = testBuf;

    if (testBuf.length <= targetBytes || quality <= 20) {
      break;
    }

    // تعديل الجودة وفق نسبة التجاوز
    const overRatio = targetBytes / testBuf.length;
    quality = Math.max(12, Math.round(quality * Math.sqrt(overRatio)));
  }

  if (finalBuffer) {
    fs.writeFileSync(outputPath, finalBuffer);
  } else {
    await sharp(inputPath).jpeg({ quality: 50, mozjpeg: true }).toFile(outputPath);
  }

  const conversionTimeMs = Date.now() - startTime;
  const finalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;

  if (typeof onProgress === 'function') {
    onProgress({ taskId, percent: 100.0, speed: '1.0x', eta: '00:00', timemark: '00:00:00' });
  }

  return {
    taskId,
    outputPath,
    finalSize,
    duration: 0,
    conversionTimeMs,
    isCompression: true
  };
}

/**
 * إلغاء مهمة معالجة صورة جارية
 */
function cancelImageTask(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) return false;
  if (typeof task.cancel === 'function') {
    task.cancel();
  }
  activeTasks.delete(taskId);
  return true;
}

module.exports = {
  getImageMetadata,
  convertImage,
  compressImageTask,
  cancelImageTask,
  IMAGE_PRESET_SIZES,
  SHARP_STANDARD_EXTENSIONS,
  EXTENDED_IMAGE_EXTENSIONS
};
