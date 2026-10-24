// src/main/index.js
const { app, BrowserWindow, protocol, net, powerSaveBlocker, Notification } = require('electron');
const { pathToFileURL } = require('url');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const queueManager = require('./queue-manager');
const { registerIpcHandlers } = require('./ipc-handlers');

// خريطة أنواع MIME لملفات الوسائط لتوفير استجابة دقيقة للمتصفح
function getMediaMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
  const mimeMap = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    ts: 'video/mp2t',
    mts: 'video/mp2t',
    m2ts: 'video/mp2t',
    ogv: 'video/ogg',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    opus: 'audio/opus',
    wma: 'audio/x-ms-wma'
  };
  return mimeMap[ext] || 'video/mp4';
}

// معرف مانع وضع السكون في نظام ويندوز
let powerBlockerId = null;

// تسجيل بروتوكول البث المخصص قبل جاهزية التطبيق مع كامل الامتيازات (PRD Architecture)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media-stream',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#121316',
    title: 'Open-UniConverter',
    webPreferences: {
      nodeIntegration: false,   // حظر Node.js في الواجهة (PRD القسم 07)
      contextIsolation: true,   // فصل نطاق الواجهة عن preload
      sandbox: true,            // صندوق Chromium الرملي
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  // تسجيل قنوات IPC
  registerIpcHandlers(mainWindow);

  // تفعيل تكامل شريط المهام ومنع السكون وإشعارات ويندوز
  setupWindowsIntegration(mainWindow);

  // تحميل ملف الواجهة الرئيسي
  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.on('closed', () => {
    if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
      try { powerSaveBlocker.stop(powerBlockerId); } catch (e) {}
      powerBlockerId = null;
    }
    mainWindow = null;
  });
}

/**
 * تكامل شريط المهام ونظام ويندوز (Windows Native Integration)
 * - تحديث شريط التقدم على أيقونة البرنامج عبر mainWindow.setProgressBar(overallProgress)
 * - منع دخول الجهاز في وضع السكون أثناء استمرار التحويل عبر electron.powerSaveBlocker
 * - إرسال إشعار رسمي من ويندوز مصحوب بصوت خفيف عند اكتمال الرتل بالكامل
 */
function setupWindowsIntegration(targetWindow) {
  if (!targetWindow) return;

  function updateTaskbarProgress() {
    if (!targetWindow || targetWindow.isDestroyed()) return;
    const status = queueManager.getStatus();
    const totalActive = (status.mediaActive || 0) + (status.otherActive || 0);
    const totalWaiting = (status.mediaWaiting || 0) + (status.otherWaiting || 0);
    const totalPending = totalActive + totalWaiting;

    if (totalPending === 0) {
      try {
        targetWindow.setProgressBar(-1);
      } catch (e) {}

      // إيقاف مانع السكون عند فراغ الرتل
      if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
        try {
          powerSaveBlocker.stop(powerBlockerId);
        } catch (e) {}
        powerBlockerId = null;
      }
      return;
    }

    // تفعيل مانع السكون أثناء وجود مهام جارية
    if (powerBlockerId === null && powerSaveBlocker) {
      try {
        powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
      } catch (e) {}
    }

    // حساب متوسط التقدم الإجمالي لكافة المهام
    let sumProgress = 0;
    let count = 0;
    for (const task of queueManager.tasks.values()) {
      if (task.status === 'PROCESSING' || task.status === 'QUEUED' || task.status === 'COMPLETED') {
        count++;
        sumProgress += (task.progress && task.progress.percent) ? task.progress.percent : (task.status === 'COMPLETED' ? 100 : 0);
      }
    }
    const avg = count > 0 ? (sumProgress / (count * 100)) : 0.05;
    try {
      targetWindow.setProgressBar(Math.min(1.0, Math.max(0.01, avg)));
    } catch (e) {}
  }

  queueManager.on('task:progress', updateTaskbarProgress);
  queueManager.on('task:queued', updateTaskbarProgress);
  queueManager.on('task:started', updateTaskbarProgress);
  queueManager.on('task:cancelled', updateTaskbarProgress);
  queueManager.on('queue:cleared', () => {
    updateTaskbarProgress();
    if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
      try { powerSaveBlocker.stop(powerBlockerId); } catch (e) {}
      powerBlockerId = null;
    }
    if (targetWindow && !targetWindow.isDestroyed()) {
      try { targetWindow.setProgressBar(-1); } catch (e) {}
    }
  });

  queueManager.on('task:completed', () => {
    updateTaskbarProgress();
    const status = queueManager.getStatus();
    const totalActive = (status.mediaActive || 0) + (status.otherActive || 0);
    const totalWaiting = (status.mediaWaiting || 0) + (status.otherWaiting || 0);

    // إذا اكتمل الرتل بأكمله ولا توجد أي مهام قيد المعالجة أو الانتظار
    if (totalActive === 0 && totalWaiting === 0) {
      if (targetWindow && !targetWindow.isDestroyed()) {
        try { targetWindow.setProgressBar(-1); } catch (e) {}
      }
      if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
        try { powerSaveBlocker.stop(powerBlockerId); } catch (e) {}
        powerBlockerId = null;
      }

      // إرسال إشعار رسمي من ويندوز مصحوب بصوت خفيف
      try {
        if (Notification.isSupported()) {
          const iconPath = path.join(__dirname, '../../build/icon.ico');
          const notif = new Notification({
            title: 'Open-UniConverter',
            body: 'تم اكتمال تحويل جميع المهام في الرتل بنجاح 🎉',
            icon: fs.existsSync(iconPath) ? iconPath : undefined,
            silent: false
          });
          notif.show();
          notif.on('click', () => {
            if (targetWindow && !targetWindow.isDestroyed()) {
              if (targetWindow.isMinimized()) targetWindow.restore();
              targetWindow.focus();
            }
          });
        }
      } catch (err) {}
    }
  });
}

// تهيئة قاعدة البيانات والتطبيق
app.whenReady().then(() => {
  // تفعيل بروتوكول media-stream لدعم البث التدفقي المجزأ (HTTP 206 Partial Content / Range Requests)
  // لمنع انهيار الذاكرة (RangeError: Array buffer allocation failed) عند استعراض ملفات الفيديو الضخمة
  protocol.handle('media-stream', async (request) => {
    try {
      const urlObj = new URL(request.url);
      let targetPath = '';

      if (urlObj.searchParams.has('path')) {
        targetPath = urlObj.searchParams.get('path');
      } else {
        let raw = decodeURIComponent(urlObj.pathname);
        // في نظام Windows: إزالة الشرطة المائلة الأولى إذا كان المسار مثل /C:/...
        if (/^\/[a-zA-Z]:/.test(raw)) {
          raw = raw.slice(1);
        }
        targetPath = raw;
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        return new Response('Media file not found', { status: 404 });
      }

      const stat = fs.statSync(targetPath);
      const fileSize = stat.size;
      const mimeType = getMediaMimeType(targetPath);
      const rangeHeader = request.headers.get('range');

      // معالجة طلبات البث الجزئي HTTP 206 (Partial Content / Seeking)
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (isNaN(end) || end >= fileSize) {
          end = fileSize - 1;
        }

        if (start >= fileSize || start < 0) {
          return new Response(null, {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`
            }
          });
        }

        const chunkSize = (end - start) + 1;
        const nodeStream = fs.createReadStream(targetPath, { start, end });
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
          }
        });
      }

      // إذا لم يحدد المتصفح Range: إرجاع تدفق كامل للملف بحجمه الأصلي مع ترويسة قبول التجزئة
      const nodeStream = fs.createReadStream(targetPath);
      const webStream = Readable.toWeb(nodeStream);

      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes',
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache'
        }
      });
    } catch (err) {
      return new Response(`Streaming error: ${err.message}`, { status: 500 });
    }
  });

  try {
    db.initDatabase();
  } catch (err) {
    console.error('فشل تهيئة قاعدة البيانات:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إغلاق كافة المهام وقاعدة البيانات بأمان عند الخروج
app.on('window-all-closed', () => {
  try {
    if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
      powerSaveBlocker.stop(powerBlockerId);
      powerBlockerId = null;
    }
    queueManager.cancelAll();
    db.closeDatabase();
  } catch (e) {}

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    if (powerBlockerId !== null && powerSaveBlocker && powerSaveBlocker.isStarted(powerBlockerId)) {
      powerSaveBlocker.stop(powerBlockerId);
      powerBlockerId = null;
    }
    queueManager.cancelAll();
    db.closeDatabase();
  } catch (e) {}
});
