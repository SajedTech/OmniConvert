// scripts/preflight-build-check.js
/**
 * سكريبت الفحص الشامل المسبق لعملية البناء والتجميع (Pre-flight Build Check)
 * يتحقق من توافق إعدادات electron-builder، تكامل الأيقونات، سلامة ثنائيات ASAR،
 * صحة وحدات C++ الأصلية، وخلو الشيفرات من أي أخطاء بنية.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function logPass(msg) {
  console.log(`  \x1b[32m✔ PASS:\x1b[0m ${msg}`);
  passedTests++;
}

function logFail(msg, err) {
  console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${msg}`);
  if (err) console.error(`    -> ${err.message || err}`);
  failedTests++;
}

console.log('\n======================================================');
console.log('🚀 Open-UniConverter Pre-Flight Build Check');
console.log('======================================================\n');

// 1. فحص ملف إعدادات electron-builder.yml
console.log('1️⃣  فحص ملف إعدادات الحزم (electron-builder.yml)...');
try {
  const ymlPath = path.resolve(__dirname, '../electron-builder.yml');
  if (!fs.existsSync(ymlPath)) {
    throw new Error('ملف electron-builder.yml غير موجود!');
  }

  const content = fs.readFileSync(ymlPath, 'utf8');

  // فحص أهداف ويندوز nsis و portable
  const hasNsis = content.includes('target: nsis') || content.includes('- target: nsis');
  const hasPortable = content.includes('target: portable') || content.includes('- target: portable');
  if (hasNsis && hasPortable) {
    logPass('أهداف الحزم لويندوز تتضمن nsis و portable بنجاح.');
  } else {
    throw new Error(`أهداف ويندوز غير مكتملة: nsis=${hasNsis}, portable=${hasPortable}`);
  }

  // فحص deleteAppDataOnUninstall
  if (content.includes('deleteAppDataOnUninstall: false')) {
    logPass('حماية بيانات المستخدم عند إلغاء التثبيت مفعلة (deleteAppDataOnUninstall: false).');
  } else {
    throw new Error('خاصية deleteAppDataOnUninstall: false غير موجودة في قسم nsis.');
  }

  // فحص asarUnpack
  if (content.includes('asarUnpack')) {
    logPass('إعداد فك حزم الثنائيات asarUnpack موجود ومعرّف.');
  } else {
    throw new Error('إعداد asarUnpack غير موجود.');
  }
} catch (e) {
  logFail('فحص إعدادات electron-builder.yml فشل', e);
}

// 2. فحص أيقونة التطبيق (build/icon.ico)
console.log('\n2️⃣  فحص أيقونة التطبيق الرسمية (build/icon.ico)...');
try {
  const iconPath = path.resolve(__dirname, '../build/icon.ico');
  if (!fs.existsSync(iconPath)) {
    throw new Error(`ملف الأيقونة غير موجود في: ${iconPath}`);
  }

  const stats = fs.statSync(iconPath);
  if (stats.size < 10000) {
    throw new Error(`حجم ملف الأيقونة صغير جداً (${stats.size} bytes). قد لا يحتوي على كافة الأحجام.`);
  }

  // فحص ترويسة ملف ICO (Reserved: 0x0000, Type: 0x0001, Images Count: >= 4)
  const buf = fs.readFileSync(iconPath);
  const reserved = buf.readUInt16LE(0);
  const type = buf.readUInt16LE(2);
  const imageCount = buf.readUInt16LE(4);

  if (reserved === 0 && type === 1 && imageCount >= 4) {
    logPass(`ملف الأيقونة صالح (حجم: ${(stats.size / 1024).toFixed(1)} KB، عدد المقاسات المدمجة: ${imageCount}).`);
  } else {
    throw new Error(`ترويسة ملف ICO غير صالحة: reserved=${reserved}, type=${type}, count=${imageCount}`);
  }
} catch (e) {
  logFail('فحص أيقونة التطبيق فشل', e);
}

// 3. فحص منطق فك مسارات الثنائيات (ASAR Unpack Path Resolution)
console.log('\n3️⃣  فحص منطق مسارات ثنائيات FFmpeg و ASAR Unpack...');
try {
  const { getSafeBinaryPath, resolveBinaryPath } = require('../src/main/engines/media-engine');

  if (typeof getSafeBinaryPath !== 'function' || typeof resolveBinaryPath !== 'function') {
    throw new Error('دوال getSafeBinaryPath أو resolveBinaryPath غير مصدرة من media-engine.js');
  }

  // محاكاة مسار مجمع داخل ASAR
  const dummyAsarPath = 'C:\\Program Files\\OpenUniConverter\\resources\\app.asar\\node_modules\\ffmpeg-static\\ffmpeg.exe';
  const resolved = getSafeBinaryPath(dummyAsarPath);

  if (resolved.includes('app.asar.unpacked') && !resolved.includes('resources\\app.asar\\')) {
    logPass(`معالجة مسارات ASAR صحيحة: استبدال app.asar -> app.asar.unpacked`);
  } else {
    throw new Error(`لم يتم تحويل مسار ASAR كما ينبغي: ${resolved}`);
  }

  // اختبار كائن المسار (ffprobeStatic.path)
  const dummyObj = { path: 'D:\\Test\\app.asar\\vendor\\ffprobe.exe' };
  const resolvedObj = getSafeBinaryPath(dummyObj);
  if (resolvedObj.includes('app.asar.unpacked')) {
    logPass('معالجة كائنات المسارات ({ path: ... }) تعمل بصورة سليمة.');
  } else {
    throw new Error(`فشلت معالجة كائن المسار: ${resolvedObj}`);
  }
} catch (e) {
  logFail('فحص معالجة مسارات ASAR فشل', e);
}

// 4. فحص استقرار دورة حياة تصيير PDF في Document Engine
console.log('\n4️⃣  فحص دورة حياة مصير المستندات وتفادي تسرب الذاكرة (Memory Leaks)...');
try {
  const docEngineCode = fs.readFileSync(path.resolve(__dirname, '../src/main/engines/document-engine.js'), 'utf8');

  const hasTryFinally = docEngineCode.includes('try {') && docEngineCode.includes('} finally {');
  const hasWindowDestroy = docEngineCode.includes('printWindow.destroy()');
  const setsNull = docEngineCode.includes('printWindow = null');

  if (hasTryFinally && hasWindowDestroy && setsNull) {
    logPass('تم التحقق من وجود كتلة try / finally مع استدعاء printWindow.destroy() وتصفير المؤشرات.');
  } else {
    throw new Error('دورة حياة BrowserWindow في document-engine.js لا تلبي معايير إغلاق الذاكرة الآمن.');
  }
} catch (e) {
  logFail('فحص دورة حياة المستندات فشل', e);
}

// 5. فحص وحدات C++ الأصلية (better-sqlite3 & sharp) مع Electron ABI
console.log('\n5️⃣  فحص توافق وحدات C++ الأصلية مع بيئة Electron (ABI 121)...');
try {
  const { verifyUnderElectron } = require('./verify-native-modules');
  const result = verifyUnderElectron();

  if (result.success) {
    logPass(`الوحدات الأصلية تعمل بنجاح مع Electron ${result.electronVersion} (بدون أخطاء ABI mismatch).`);
  } else {
    throw new Error(`فشل تحميل إحدى الوحدات: Exit Code ${result.exitCode}\n${result.stderr || result.stdout}`);
  }
} catch (e) {
  logFail('فحص الوحدات الأصلية فشل', e);
}

// 6. فحص بنية الشيفرات البرمجية (Syntax Check)
console.log('\n6️⃣  فحص السلامة اللغوية والنحوية (Syntax Validation)...');
const filesToCheck = [
  'src/main/index.js',
  'src/main/engines/media-engine.js',
  'src/main/engines/image-engine.js',
  'src/main/engines/document-engine.js',
  'src/renderer/scripts/app.js',
  'src/renderer/scripts/ui-controller.js',
  'src/renderer/scripts/state.js'
];

let allSyntaxOk = true;
for (const file of filesToCheck) {
  const fullPath = path.resolve(__dirname, '..', file);
  try {
    execSync(`node -c "${fullPath}"`);
  } catch (err) {
    allSyntaxOk = false;
    logFail(`خطأ بنوي في الملف: ${file}`, err);
  }
}
if (allSyntaxOk) {
  logPass(`جميع ملفات النظام (${filesToCheck.length} ملفاً) سليمة نحوياً وخالية من أخطاء Syntax.`);
}

console.log('\n======================================================');
console.log(`📊 النتيجة النهائية: ${passedTests} ناجح | ${failedTests} فاشل`);
console.log('======================================================\n');

if (failedTests > 0) {
  console.error('❌ فشل فحص Pre-Flight. يرجى تصحيح الأخطاء قبل إطلاق البناء الإنتاجي.');
  process.exit(1);
} else {
  console.log('✅ جاهز للبناء الإنتاجي (Production Ready) بنجاح 100%!');
  process.exit(0);
}
