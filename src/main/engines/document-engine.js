// src/main/engines/document-engine.js
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const activeTasks = new Map();

/**
 * تحويل ملف DOCX إلى HTML مع تضمين الصور بترميز Base64
 */
async function docxToHtml(inputPath) {
  const options = {
    convertImage: mammoth.images.imgElement((image) => {
      return image.read("base64").then((imageBuffer) => {
        return {
          src: `data:${image.contentType};base64,${imageBuffer}`
        };
      });
    })
  };

  const result = await mammoth.convertToHtml({ path: inputPath }, options);
  return result.value || '';
}

/**
 * إنشاء صفحة HTML متكاملة مع CSS طباعي مخصص لـ A4 ودعم العربية
 */
function createPrintableHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="ar" dir="auto">
<head>
  <meta charset="utf-8">
  <title>Document</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Arabic", Tahoma, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
      background: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
      direction: auto;
      text-align: start;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      line-height: 1.3;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 0.8em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #bbb;
      padding: 8px 10px;
      text-align: inherit;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }
    pre, code {
      font-family: Consolas, "Courier New", monospace;
      background: #f7f7f7;
      border-radius: 3px;
      padding: 2px 4px;
    }
    blockquote {
      margin: 1em 20px;
      padding-left: 15px;
      border-left: 3px solid #ccc;
      color: #444;
    }
    ul, ol {
      padding-inline-start: 24px;
      margin-bottom: 0.8em;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * تحويل ملف مستند DOCX إلى PDF بدون إنترنت استناداً إلى PRD القسم 06
 */
async function convertDocument({ taskId, inputPath, outputPath, options = {}, onProgress = null }) {
  const startTime = Date.now();

  if (!fs.existsSync(inputPath)) {
    throw new Error(`ملف المستند غير موجود: ${inputPath}`);
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let isCancelled = false;
  let activeWin = null;

  activeTasks.set(taskId, {
    cancel: () => {
      isCancelled = true;
      if (activeWin && !activeWin.isDestroyed()) {
        try { activeWin.destroy(); } catch (e) {}
      }
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {}
    },
    outputPath
  });

  if (typeof onProgress === 'function') {
    onProgress({ taskId, percent: 15, speed: '1.0x', eta: '00:02', timemark: '00:00:00' });
  }

  try {
    // 1. استخراج HTML من DOCX أو تضمين الصورة في صفحة A4 طباعية
    let rawHtml = '';
    const inExt = path.extname(inputPath).toLowerCase().replace(/^\./, '');
    const isImageInput = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'gif', 'tiff', 'tga'].includes(inExt);
    const isDocxInput = ['docx', 'doc'].includes(inExt);

    if (!isImageInput && !isDocxInput) {
      if (inExt === 'pdf') {
        throw new Error('محرك المستندات المدمج مخصص لتحويل مستندات Word (DOCX / DOC) إلى PDF فقط. ملفات PDF غير مدعومة كمدخلات.');
      }
      throw new Error('محرك المستندات المدمج مخصص لتحويل مستندات Word (DOCX / DOC) إلى PDF فقط. صيغة هذا الملف غير مدعومة كمدخل.');
    }

    if (isImageInput) {
      const imgBuf = await fs.promises.readFile(inputPath);
      const mime = (inExt === 'jpg') ? 'jpeg' : inExt;
      const b64 = imgBuf.toString('base64');
      rawHtml = `<div style="text-align: center; margin: 0 auto; display: flex; align-items: center; justify-content: center; min-height: 80vh;">
        <img src="data:image/${mime};base64,${b64}" style="max-width: 100%; max-height: 90vh; height: auto; object-fit: contain; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
      </div>`;
    } else {
      try {
        rawHtml = await docxToHtml(inputPath);
      } catch (err) {
        if (err.message && err.message.includes('central directory')) {
          throw new Error('محرك المستندات المدمج مخصص لتحويل مستندات Word (DOCX / DOC) إلى PDF. لتحويل ملفات PDF يرجى اختيار استخراج الصور (PNG, JPG, WebP).');
        }
        throw new Error(`فشل استخراج محتوى المستند عبر محرك DOCX: ${err.message}`);
      }
    }

    if (isCancelled) throw new Error('تم إلغاء عملية تحويل المستند');

    if (typeof onProgress === 'function') {
      onProgress({ taskId, percent: 45, speed: '1.0x', eta: '00:01', timemark: '00:00:00' });
    }

    const fullHtml = createPrintableHtml(rawHtml);

    // 2. التحقق من توفر BrowserWindow (داخل بيئة Electron)
    let BrowserWindow = null;
    try {
      const electron = require('electron');
      BrowserWindow = electron.BrowserWindow;
    } catch (e) {
      // خارج بيئة Electron
    }

    if (!BrowserWindow) {
      // وضع الاختبار أو العمل خارج Electron: حفظ كـ HTML كبديل اختباري
      const fallbackHtmlPath = outputPath.replace(/\.pdf$/i, '.html');
      await fs.promises.writeFile(fallbackHtmlPath, fullHtml, 'utf8');
      activeTasks.delete(taskId);
      return {
        taskId,
        outputPath: fallbackHtmlPath,
        finalSize: fs.statSync(fallbackHtmlPath).size,
        duration: 0,
        conversionTimeMs: Date.now() - startTime,
        warning: 'Electron BrowserWindow is only available within running Electron runtime'
      };
    }

    // 3. إنشاء نافذة خفية لتصيير الـ HTML مع ضمان تدميرها في finally لتفادي تسريب الذاكرة
    let printWindow = null;
    try {
      printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      });
      activeWin = printWindow;

      if (isCancelled) {
        throw new Error('تم إلغاء عملية تحويل المستند');
      }

      // 4. تحميل محتوى الـ HTML عبر Data URL
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
      await printWindow.loadURL(dataUrl);

      if (isCancelled) {
        throw new Error('تم إلغاء عملية تحويل المستند');
      }

      if (typeof onProgress === 'function') {
        onProgress({ taskId, percent: 75, speed: '1.0x', eta: '00:01', timemark: '00:00:00' });
      }

      // 5. استدعاء printToPDF بمقاس A4 وخلفية مطبوعة
      const pdfBuffer = await printWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      });

      if (isCancelled) {
        throw new Error('تم إلغاء عملية تحويل المستند');
      }

      // 6. كتابة ملف الـ PDF الناتج
      await fs.promises.writeFile(outputPath, pdfBuffer);
    } finally {
      // إغلاق وتدمير النافذة الخفية فوراً لتحرير ذاكرة Chromium (RAM) ومنع تسرب الذاكرة
      if (printWindow && !printWindow.isDestroyed()) {
        try {
          printWindow.destroy();
        } catch (e) {}
      }
      printWindow = null;
      activeWin = null;
    }

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
    if (activeWin && !activeWin.isDestroyed()) {
      try { activeWin.destroy(); } catch (e) {}
    }
    activeTasks.delete(taskId);
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (e) {}
    throw err;
  }
}

/**
 * إلغاء تحويل مستند جاري
 */
function cancelDocumentTask(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) return false;
  if (typeof task.cancel === 'function') {
    task.cancel();
  }
  activeTasks.delete(taskId);
  return true;
}

module.exports = {
  convertDocument,
  cancelDocumentTask,
  docxToHtml,
  createPrintableHtml
};
