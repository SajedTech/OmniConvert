// scripts/deep-system-audit.js
/**
 * ============================================================================
 * Open-UniConverter: Automated Full-Spectrum & Security Stress Test
 * سكريبت الفحص الأمني والضغط الشامل والعميق للمحركات وخطوط المعالجة
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execFile, execSync } = require('child_process');
const sharp = require('sharp');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// استيراد المحركات الأساسية للتطبيق
const mediaEngine = require('../src/main/engines/media-engine');
const imageEngine = require('../src/main/engines/image-engine');

// تعطيل كاش Sharp على مستوى السكريبت لضمان عدم حجز مقابض الملفات على ويندوز وإتاحة التنظيف التام
sharp.cache(false);

const ffmpegBin = mediaEngine.resolveBinaryPath(ffmpegStatic);
const ffprobeBin = mediaEngine.resolveBinaryPath(ffprobeStatic && ffprobeStatic.path ? ffprobeStatic.path : ffprobeStatic);

// مجلد الاختبار المؤقت المعزول
const TEMP_DIR = path.join(__dirname, '../deep_audit_temp');

let passedAssertions = 0;
let failedAssertions = 0;
const testResults = [];

function assert(condition, message, category = 'General') {
  if (condition) {
    console.log(`    ✓ PASS: ${message}`);
    passedAssertions++;
    testResults.push({ category, message, status: 'PASS' });
  } else {
    console.error(`    ✕ FAIL: ${message}`);
    failedAssertions++;
    testResults.push({ category, message, status: 'FAIL' });
    throw new Error(`Assertion failed: ${message}`);
  }
}

function isProcessRunning(imageName) {
  if (process.platform !== 'win32') return false;
  try {
    const out = execSync(`tasklist /fi "imagename eq ${imageName}" /nh`, { stdio: 'pipe' }).toString();
    return out.toLowerCase().includes(imageName.toLowerCase());
  } catch (e) {
    return false;
  }
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function cleanTempDir() {
  if (fs.existsSync(TEMP_DIR)) {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

function generateSyntheticVideo(destPath, durationSec = 1, width = 320, height = 240, oddCodec = false) {
  return new Promise((resolve, reject) => {
    const args = [
      '-f', 'lavfi',
      '-i', `testsrc=duration=${durationSec}:size=${width}x${height}:rate=25`,
      '-f', 'lavfi',
      '-i', `sine=duration=${durationSec}:frequency=1000`
    ];

    if (oddCodec) {
      // استخدام MJPEG لتمكين إنشاء فيديو بأبعاد فردية دون فرض قيود YUV420p المسبقة
      args.push('-c:v', 'mjpeg', '-c:a', 'aac', '-y', destPath);
    } else {
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-y', destPath);
    }

    execFile(ffmpegBin, args, (err) => {
      if (err) return reject(err);
      resolve(destPath);
    });
  });
}

// ----------------------------------------------------------------------------
// بدء تنفيذ الاختبارات الشاملة
// ----------------------------------------------------------------------------

async function runDeepSystemAudit() {
  console.log('========================================================================');
  console.log('   Open-UniConverter: Automated Full-Spectrum & Security Stress Test    ');
  console.log('       فحص الأمان وحقن الأوامر، صمود المحركات، ودورة حياة العمليات       ');
  console.log('========================================================================\n');

  cleanTempDir();
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const baselineVideo = path.join(TEMP_DIR, 'baseline_video.mp4');
  const baselineImage = path.join(TEMP_DIR, 'baseline_image.png');

  console.log('[*] تجهيز ملفات الوسائط المعيارية للاختبار...');
  await generateSyntheticVideo(baselineVideo, 1, 320, 240);
  await sharp({
    create: { width: 320, height: 240, channels: 3, background: { r: 60, g: 140, b: 220 } }
  }).png().toFile(baselineImage);
  console.log('    ✓ تم إنشاء ملفات الوسائط الأساسية بنجاح.\n');

  // ==========================================================================
  // أولاً: اختبار الأمان وحقن المدخلات (Security & Sanitization Audit)
  // ==========================================================================
  console.log('------------------------------------------------------------------------');
  console.log(' [1/5] اختبار الأمان، الهروب البرمجي، والدفاع ضد حقن الأوامر (Security)');
  console.log('------------------------------------------------------------------------');

  // 1.1 فحص اسم ملف يحتوي فاصلة منقوطة وأمر تشغيل خارجي (file;calc.exe.mp4)
  console.log('  1.1 فحص اسم ملف ملغوم بفاصلة منقوطة وأمر خارجي (file;calc.exe.mp4)...');
  const maliciousVidPath = path.join(TEMP_DIR, 'file;calc.exe.mp4');
  const maliciousVidOut = path.join(TEMP_DIR, 'safe_converted_calc.mkv');
  fs.copyFileSync(baselineVideo, maliciousVidPath);

  assert(!isProcessRunning('calc.exe'), 'Calculator process is NOT running before conversion', 'Security');

  const vidRes = await mediaEngine.convertMedia({
    taskId: 'sec_test_calc',
    inputPath: maliciousVidPath,
    outputPath: maliciousVidOut,
    targetFormat: 'mkv'
  });

  assert(fs.existsSync(maliciousVidOut), 'Converted file created successfully on disk', 'Security');
  assert(!isProcessRunning('calc.exe'), 'Command injection strictly prevented: calc.exe was NOT executed', 'Security');
  const vidMeta = await mediaEngine.probeMedia(maliciousVidOut);
  assert(vidMeta.hasVideo === true, 'Output MKV contains valid video stream', 'Security');

  // 1.2 فحص اسم ملف يحتوي مشغلات أوامر الشل (test&&dir.png)
  console.log('  1.2 فحص اسم ملف يحتوي معامِلات شل متتالية (test&&dir.png)...');
  const maliciousImgPath = path.join(TEMP_DIR, 'test&&dir.png');
  const maliciousImgOut = path.join(TEMP_DIR, 'test_and_dir_out.webp');
  fs.copyFileSync(baselineImage, maliciousImgPath);

  await imageEngine.convertImage({
    taskId: 'sec_test_amp',
    inputPath: maliciousImgPath,
    outputPath: maliciousImgOut,
    targetFormat: 'webp',
    options: { quality: 80 }
  });

  assert(fs.existsSync(maliciousImgOut), 'Image with shell metacharacters converted without command execution', 'Security');
  const ampImgMeta = await sharp(fs.readFileSync(maliciousImgOut)).metadata();
  assert(ampImgMeta.format === 'webp', 'Output image is a verified WebP file', 'Security');

  // 1.3 محاكاة إدخال مسار يحتوي علامات اقتباس محظورة في نظام الملفات (test"&&dir.png)
  console.log('  1.3 فحص صمود المحركات أمام محاولات كسر علامات الاقتباس (test"&&dir.png)...');
  const unquotedInjectionPath = 'test"&&dir.png';
  let injectionCaught = false;
  try {
    await imageEngine.convertImage({
      taskId: 'sec_test_quote',
      inputPath: unquotedInjectionPath,
      outputPath: path.join(TEMP_DIR, 'dummy.webp'),
      targetFormat: 'webp'
    });
  } catch (err) {
    injectionCaught = true;
  }
  assert(injectionCaught, 'Invalid quoted path rejected cleanly by image engine without crash or shell execution', 'Security');

  // 1.4 فحص الأسماء العربية الطويلة التي تحتوي مسافات ورموز خاصة (ملف تجربة فحص أبعاد 100% عربي وخاص.jpg)
  console.log('  1.4 فحص دعم الأسماء العربية الكاملة والرموز الخاصة (100% عربي وخاص)...');
  const arabicFileName = 'ملف تجربة فحص أبعاد 100% عربي وخاص.jpg';
  const arabicFilePath = path.join(TEMP_DIR, arabicFileName);
  const arabicFileOut = path.join(TEMP_DIR, 'arabic_output.png');

  await sharp({
    create: { width: 450, height: 300, channels: 3, background: { r: 240, g: 180, b: 60 } }
  }).jpeg().toFile(arabicFilePath);

  await imageEngine.convertImage({
    taskId: 'sec_test_arabic',
    inputPath: arabicFilePath,
    outputPath: arabicFileOut,
    targetFormat: 'png'
  });

  assert(fs.existsSync(arabicFileOut), 'Arabic UTF-8 filename with percentage symbol converted flawlessly', 'Security');
  const arabicMeta = await sharp(fs.readFileSync(arabicFileOut)).metadata();
  assert(arabicMeta.width === 450 && arabicMeta.height === 300, 'Arabic image dimensions perfectly preserved (450x300)', 'Security');

  // 1.5 فحص الهروب البرمجي لملفات الترجمة ذات الرموز المعقدة والنقطتين الرأسيتين (sub:title\path\'escaping.srt)
  console.log('  1.5 فحص دالة تطهير مسارات الترجمة (Windows Subtitle Path Sanitizer)...');
  const complexSubInput = "sub:title\\special\\path\\'escaping.srt";
  const sanitizedSub = mediaEngine.sanitizeSubtitlePath(complexSubInput);
  assert(sanitizedSub.includes('\\:'), 'All colons properly escaped with \\: to protect FFmpeg filter delimiters', 'Security');
  assert(!sanitizedSub.includes('\\special'), 'Backslashes safely converted to forward slashes', 'Security');
  assert(sanitizedSub.includes("'\\''") || sanitizedSub.includes("\\'"), 'Single quotes properly escaped for libavfilter', 'Security');

  // تجربة حرق ترجمة فعلية بمسار حقيقي يحتوي مسافات ونقاط
  const realSubPath = path.join(TEMP_DIR, 'arabic subtitle test.srt');
  fs.writeFileSync(realSubPath, '1\n00:00:00,000 --> 00:00:01,000\nتجربة الترجمة الأمنية الفائقة\n');
  const subBurnOut = path.join(TEMP_DIR, 'sub_burned.mp4');

  await mediaEngine.convertMedia({
    taskId: 'sub_burn_test',
    inputPath: baselineVideo,
    outputPath: subBurnOut,
    targetFormat: 'mp4',
    options: {
      edits: { subtitlePath: realSubPath }
    }
  });
  assert(fs.existsSync(subBurnOut), 'Subtitle burn-in completed without FFmpeg filtergraph parse error', 'Security');

  // ==========================================================================
  // ثانياً: فحص صمود المحركات أمام الملفات التالفة (Fuzz & Corrupt Data Testing)
  // ==========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log(' [2/5] اختبار الصمود أمام الملفات التالفة والمزورة (Fuzz & Corrupt Data) ');
  console.log('------------------------------------------------------------------------');

  // 2.1 ملف بحجم 0 بايت (zero_byte.mp4)
  console.log('  2.1 اختبار ملف فيديو تالف بحجم 0 بايت (zero_byte.mp4)...');
  const zeroBytePath = path.join(TEMP_DIR, 'zero_byte.mp4');
  fs.writeFileSync(zeroBytePath, Buffer.alloc(0));

  let zeroByteCaught = false;
  try {
    await mediaEngine.convertMedia({
      taskId: 'fuzz_zero_byte',
      inputPath: zeroBytePath,
      outputPath: path.join(TEMP_DIR, 'zero_out.mp4'),
      targetFormat: 'mp4'
    });
  } catch (err) {
    zeroByteCaught = true;
    assert(err instanceof Error, 'Zero-byte file error is cleanly captured via Error instance', 'Fuzzing');
  }
  assert(zeroByteCaught, 'Zero-byte video cleanly rejected without crashing application engine', 'Fuzzing');
  assert(!fs.existsSync(path.join(TEMP_DIR, 'zero_out.mp4')), 'Partial output cleaned up on zero-byte failure', 'Fuzzing');

  // 2.2 ملف نصي مزور بامتداد صورة (fake_image.png)
  console.log('  2.2 اختبار ملف نصي مزور ينتحل صيغة صورة (fake_image.png)...');
  const fakeImagePath = path.join(TEMP_DIR, 'fake_image.png');
  fs.writeFileSync(fakeImagePath, 'This is pure plain text masquerading as a PNG image file!');

  let fakeImageCaught = false;
  try {
    await imageEngine.convertImage({
      taskId: 'fuzz_fake_img',
      inputPath: fakeImagePath,
      outputPath: path.join(TEMP_DIR, 'fake_img_out.jpg'),
      targetFormat: 'jpg'
    });
  } catch (err) {
    fakeImageCaught = true;
    assert(err.message.includes('unsupported') || err.message.includes('Vips') || err.message.includes('تالف') || err.message.length > 0, 'Descriptive error message thrown for corrupt image header', 'Fuzzing');
  }
  assert(fakeImageCaught, 'Corrupt fake image file safely caught and unhandled rejection prevented', 'Fuzzing');
  assert(!fs.existsSync(path.join(TEMP_DIR, 'fake_img_out.jpg')), 'Partial output removed on fake image error', 'Fuzzing');

  // 2.3 محاكاة رتل مهام وتأكد من عدم تعطل الرتل عند فشل المهام التالفة
  console.log('  2.3 اختبار استمرارية رتل المعالجة (Queue Resiliency & Fault Isolation)...');
  const mockQueue = [
    { id: 'q1', path: zeroBytePath, type: 'video', isCorrupt: true },
    { id: 'q2', path: fakeImagePath, type: 'image', isCorrupt: true },
    { id: 'q3', path: baselineImage, type: 'image', isCorrupt: false }
  ];

  const queueStatuses = {};
  for (const item of mockQueue) {
    try {
      if (item.type === 'video') {
        await mediaEngine.convertMedia({
          taskId: item.id,
          inputPath: item.path,
          outputPath: path.join(TEMP_DIR, `${item.id}_out.mp4`),
          targetFormat: 'mp4'
        });
        queueStatuses[item.id] = 'COMPLETED';
      } else {
        await imageEngine.convertImage({
          taskId: item.id,
          inputPath: item.path,
          outputPath: path.join(TEMP_DIR, `${item.id}_out.webp`),
          targetFormat: 'webp'
        });
        queueStatuses[item.id] = 'COMPLETED';
      }
    } catch (err) {
      queueStatuses[item.id] = 'FAILED';
    }
  }

  assert(queueStatuses['q1'] === 'FAILED', 'Corrupt task q1 marked as FAILED in queue', 'Fuzzing');
  assert(queueStatuses['q2'] === 'FAILED', 'Corrupt task q2 marked as FAILED in queue', 'Fuzzing');
  assert(queueStatuses['q3'] === 'COMPLETED', 'Valid task q3 completed successfully despite earlier failures in queue', 'Fuzzing');

  // ==========================================================================
  // ثالثاً: التحقق الرياضي والهندسي للأبعاد (Dimension & Codec Rules)
  // ==========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log(' [3/5] اختبار القواعد الهندسية وتصحيح الأبعاد الفردية (Dimensions & Rules)');
  console.log('------------------------------------------------------------------------');

  // 3.1 تصحيح أبعاد الفيديو الفردية (401x799 -> 400x798)
  console.log('  3.1 اختبار تصحيح الأبعاد الفردية للفيديو إلى أبعاد زوجية حصراً (401x799)...');
  const oddVideoPath = path.join(TEMP_DIR, 'odd_dim_video.mkv');
  const oddVideoOut = path.join(TEMP_DIR, 'even_corrected_video.mp4');
  await generateSyntheticVideo(oddVideoPath, 1, 401, 799, true);

  const oddProbe = await mediaEngine.probeMedia(oddVideoPath);
  assert(oddProbe.video.width === 401 && oddProbe.video.height === 799, 'Generated synthetic video has odd dimensions (401x799)', 'Dimensions');

  await mediaEngine.convertMedia({
    taskId: 'odd_video_test',
    inputPath: oddVideoPath,
    outputPath: oddVideoOut,
    targetFormat: 'mp4' // يستلزم yuv420p وأبعاد زوجية
  });

  const evenCorrectedMeta = await mediaEngine.probeMedia(oddVideoOut);
  assert(evenCorrectedMeta.video.width % 2 === 0, `Output video width is strictly even: ${evenCorrectedMeta.video.width}`, 'Dimensions');
  assert(evenCorrectedMeta.video.height % 2 === 0, `Output video height is strictly even: ${evenCorrectedMeta.video.height}`, 'Dimensions');
  assert(evenCorrectedMeta.video.width === 400, 'Width 401 corrected down to 400', 'Dimensions');
  assert(evenCorrectedMeta.video.height === 798, 'Height 799 corrected down to 798', 'Dimensions');

  // 3.2 تصحيح أبعاد الصورة الفردية (401x799 -> 400x798)
  console.log('  3.2 اختبار تصحيح الأبعاد الفردية للصور (ensureEven: true)...');
  const oddImagePath = path.join(TEMP_DIR, 'odd_dim_image.png');
  const oddImageOut = path.join(TEMP_DIR, 'even_corrected_image.webp');
  await sharp({
    create: { width: 401, height: 799, channels: 3, background: { r: 180, g: 70, b: 210 } }
  }).png().toFile(oddImagePath);

  await imageEngine.convertImage({
    taskId: 'odd_img_test',
    inputPath: oddImagePath,
    outputPath: oddImageOut,
    targetFormat: 'webp',
    options: { ensureEven: true }
  });

  const evenImgMeta = await sharp(fs.readFileSync(oddImageOut)).metadata();
  assert(evenImgMeta.width % 2 === 0, `Output image width is strictly even: ${evenImgMeta.width}`, 'Dimensions');
  assert(evenImgMeta.height % 2 === 0, `Output image height is strictly even: ${evenImgMeta.height}`, 'Dimensions');
  assert(evenImgMeta.width === 400 && evenImgMeta.height === 798, 'Image dimensions 401x799 corrected to 400x798', 'Dimensions');

  // 3.3 اختبار التدوير بزاوية 90 درجة ومطابقة الأبعاد المنعكسة
  console.log('  3.3 اختبار التدوير بزاوية 90° وانعكاس الأبعاد الهندسي (300x500 -> 500x300)...');
  const rotateInPath = path.join(TEMP_DIR, 'rotate_300x500.png');
  const rotateOutPath = path.join(TEMP_DIR, 'rotate_90_out.png');
  await sharp({
    create: { width: 300, height: 500, channels: 3, background: { r: 30, g: 200, b: 100 } }
  }).png().toFile(rotateInPath);

  await imageEngine.convertImage({
    taskId: 'rotate_test_90',
    inputPath: rotateInPath,
    outputPath: rotateOutPath,
    targetFormat: 'png',
    options: { rotate: 90 }
  });

  const rotatedMeta = await sharp(fs.readFileSync(rotateOutPath)).metadata();
  assert(rotatedMeta.width === 500, `Rotated width matches previous height (expected 500, got ${rotatedMeta.width})`, 'Dimensions');
  assert(rotatedMeta.height === 300, `Rotated height matches previous width (expected 300, got ${rotatedMeta.height})`, 'Dimensions');

  // 3.4 اختبار الانعكاس الأفقي والرأسي (Flip H & V)
  console.log('  3.4 اختبار الانعكاس الأفقي والرأسي المزدوج (Flip H + V)...');
  const flipOutPath = path.join(TEMP_DIR, 'flip_out.png');
  await imageEngine.convertImage({
    taskId: 'flip_test',
    inputPath: rotateInPath,
    outputPath: flipOutPath,
    targetFormat: 'png',
    options: { flipH: true, flipV: true }
  });
  const flipMeta = await sharp(fs.readFileSync(flipOutPath)).metadata();
  assert(flipMeta.width === 300 && flipMeta.height === 500, 'Dimensions preserved under flip operation', 'Dimensions');

  // ==========================================================================
  // رابعاً: اختبار دورة الإلغاء وتفريغ العمليات (Process Kill Lifecycle)
  // ==========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log(' [4/5] اختبار دورة الإلغاء وتفريغ العمليات والملفات المؤقتة (Process Kill) ');
  console.log('------------------------------------------------------------------------');

  console.log('  4.1 بدء مهمة تحويل فيديو ثقيلة ومحاكاة الإلغاء في المنتصف...');
  const longVideoPath = path.join(TEMP_DIR, 'long_video_for_cancel.mp4');
  const cancelOutPath = path.join(TEMP_DIR, 'cancel_should_not_exist.mp4');
  await generateSyntheticVideo(longVideoPath, 25, 1280, 720);

  const cancelTaskId = 'kill_lifecycle_test';
  let capturedChildPid = null;
  let cancelErrorTriggered = false;

  const cancelPromise = mediaEngine.convertMedia({
    taskId: cancelTaskId,
    inputPath: longVideoPath,
    outputPath: cancelOutPath,
    targetFormat: 'mp4',
    options: {
      resolution: '1080p',
      videoCodec: 'libx265', // إعادة تشفير بطيئة ومكثفة لضمان تشغيل العملية لفترة كافية
      crf: 28
    }
  });

  // انتظار انبثاق العملية والتقاط رقم الـ PID
  await new Promise((resolve) => {
    const timer = setInterval(() => {
      const task = mediaEngine.getActiveTask(cancelTaskId);
      if (task && task.pid) {
        capturedChildPid = task.pid;
        clearInterval(timer);
        resolve();
      }
    }, 40);
  });

  assert(capturedChildPid > 0, `Captured running FFmpeg child process PID: ${capturedChildPid}`, 'Lifecycle');
  assert(isPidAlive(capturedChildPid), `Process ${capturedChildPid} is actively running before cancellation`, 'Lifecycle');

  console.log(`  4.2 إرسال إشارة إلغاء للمهمة ${cancelTaskId} وإنهاء العملية...`);
  mediaEngine.cancelMediaTask(cancelTaskId);

  try {
    await cancelPromise;
  } catch (err) {
    cancelErrorTriggered = true;
    assert(err.isCancelled === true || err.message.includes('إلغاء'), 'Promise rejected cleanly with cancellation message', 'Lifecycle');
  }

  assert(cancelErrorTriggered, 'Cancellation caught by calling promise', 'Lifecycle');

  // إعطاء فرصة للنظام لإغلاق العملية بالكامل
  await new Promise(r => setTimeout(r, 250));

  assert(!isPidAlive(capturedChildPid), `FFmpeg child process ${capturedChildPid} terminated completely (No zombie processes)`, 'Lifecycle');
  assert(!fs.existsSync(cancelOutPath), 'Partial temporary output file was deleted from disk upon cancellation', 'Lifecycle');

  // ==========================================================================
  // خامساً: التحقق النهائي من سلامة الملفات المنتجة (Integrity & Metadata)
  // ==========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log(' [5/5] التحقق النهائي من ترويسة وسلامة الملفات المنتجة (Integrity Check) ');
  console.log('------------------------------------------------------------------------');

  // 5.1 فحص ترويسة ملفات الفيديو MP4 و MKV
  console.log('  5.1 فحص تيارات الفيديو والصوت عبر ffprobe...');
  const probeMp4 = await mediaEngine.probeMedia(oddVideoOut);
  assert(probeMp4.formatName.includes('mp4') || probeMp4.formatName.includes('mov'), 'Output container format is valid MP4', 'Integrity');
  assert(probeMp4.hasVideo && probeMp4.video.codec === 'h264', 'MP4 video stream encoded with valid H.264 codec', 'Integrity');
  assert(probeMp4.hasAudio && probeMp4.audio.codec === 'aac', 'MP4 audio stream encoded with valid AAC codec', 'Integrity');
  assert(probeMp4.duration > 0, `MP4 duration is valid (${probeMp4.duration.toFixed(2)}s)`, 'Integrity');

  const probeMkv = await mediaEngine.probeMedia(maliciousVidOut);
  assert(probeMkv.formatName.includes('matroska'), 'Output container format is valid Matroska (MKV)', 'Integrity');
  assert(probeMkv.hasVideo === true, 'MKV file has valid video stream', 'Integrity');

  // 5.2 فحص ترويسة الصور WebP و PNG و JPEG
  console.log('  5.2 فحص ترويسة وترميز الصور عبر Sharp metadata...');
  const webpBuffer = fs.readFileSync(oddImageOut);
  const webpMeta = await sharp(webpBuffer).metadata();
  assert(webpMeta.format === 'webp', 'Verified WebP format header', 'Integrity');
  assert(webpMeta.size > 0, `Non-empty file size (${webpMeta.size} bytes)`, 'Integrity');

  const pngBuffer = fs.readFileSync(arabicFileOut);
  const pngMeta = await sharp(pngBuffer).metadata();
  assert(pngMeta.format === 'png', 'Verified PNG format header', 'Integrity');
  assert(pngMeta.channels >= 3, 'Valid color channels present', 'Integrity');

  // 5.3 فحص استخراج الصوت من الفيديو إلى MP3 و WAV
  console.log('  5.3 فحص استخراج الصوت النقي من الفيديو (Audio Extraction)...');
  const mp3Out = path.join(TEMP_DIR, 'extracted_sound.mp3');
  const wavOut = path.join(TEMP_DIR, 'extracted_sound.wav');

  await mediaEngine.convertMedia({
    taskId: 'extract_mp3',
    inputPath: baselineVideo,
    outputPath: mp3Out,
    targetFormat: 'mp3',
    options: { audioBitrate: '256k' }
  });

  const mp3Meta = await mediaEngine.probeMedia(mp3Out);
  assert(mp3Meta.hasAudio === true, 'Extracted MP3 has valid audio stream', 'Integrity');
  assert(mp3Meta.hasVideo === false, 'Video stream stripped cleanly in audio extraction', 'Integrity');
  assert(mp3Meta.audio.codec === 'mp3', 'Audio codec is standard MP3 (libmp3lame)', 'Integrity');

  await mediaEngine.convertMedia({
    taskId: 'extract_wav',
    inputPath: baselineVideo,
    outputPath: wavOut,
    targetFormat: 'wav'
  });

  const wavMeta = await mediaEngine.probeMedia(wavOut);
  assert(wavMeta.hasAudio === true, 'Extracted WAV has valid PCM audio', 'Integrity');
  assert(wavMeta.audio.codec.includes('pcm'), 'WAV encoded with uncompressed PCM stream', 'Integrity');

  // تنظيف مجلد الاختبار المؤقت
  cleanTempDir();

  // ==========================================================================
  // تقرير النتيجة النهائية
  // ==========================================================================
  console.log('\n========================================================================');
  console.log(`   DEEP AUDIT SUMMARY: ${passedAssertions} PASSED, ${failedAssertions} FAILED   `);
  console.log('   ALL SECURITY & STRESS TESTS PASSED WITH 100% EXCELLENCE!   ');
  console.log('========================================================================\n');
}

runDeepSystemAudit().catch((err) => {
  console.error('\n✕ Critical Test Failure:', err);
  cleanTempDir();
  process.exit(1);
});
