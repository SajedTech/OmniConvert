// src/main/ipc-handlers.js
const fs = require('fs');
const path = require('path');
const { ipcMain, dialog, shell } = require('electron');
const db = require('./database');
const queueManager = require('./queue-manager');
const mediaEngine = require('./engines/media-engine');
const imageEngine = require('./engines/image-engine');

// قوائم الامتدادات المتخصصة للصور الفوتوغرافية الخام وخامات الألعاب
const RAW_IMAGE_EXTENSIONS = [
  'raw', 'dng', 'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2',
  'raf', 'orf', 'rw2', 'pef', 'ptx', 'dcm', 'dicom'
];

const GAMING_IMAGE_EXTENSIONS = [
  'tga', 'dds', 'exr', 'hdr', 'pcx', 'sgi', 'rgb', 'rgba', 'bw', 'xbm', 'xpm', 'qoi'
];

const SUPPORTED_EXTENSIONS = {
  video: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'vob', 'ogv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff', 'alac', 'ape', 'mid', 'midi'],
  image: Array.from(new Set([
    ...(imageEngine.SHARP_STANDARD_EXTENSIONS || []),
    ...(imageEngine.EXTENDED_IMAGE_EXTENSIONS || []),
    'bmp', 'avif'
  ])),
  document: ['docx', 'doc']
};

// مخزن مؤقت لحفظ كائنات التعديل المتقدمة لكل مهمة
const taskEditsStore = new Map();

/**
 * فحص بيانات الملف واستخراج مواصفاته (أبعاد، مدة، حجم، نوع)
 */
async function extractFileMetadata(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
    const baseName = path.basename(filePath);

    let type = 'unknown';
    if (ext === 'pdf') {
      type = 'unsupported';
    } else if (SUPPORTED_EXTENSIONS.video.includes(ext)) type = 'video';
    else if (SUPPORTED_EXTENSIONS.audio.includes(ext)) type = 'audio';
    else if (RAW_IMAGE_EXTENSIONS.includes(ext)) type = 'image-raw';
    else if (GAMING_IMAGE_EXTENSIONS.includes(ext)) type = 'image-gaming';
    else if (SUPPORTED_EXTENSIONS.image.includes(ext)) type = 'image';
    else if (SUPPORTED_EXTENSIONS.document.includes(ext)) type = 'document';

    const metadata = {
      name: baseName,
      path: filePath,
      size: stat.size,
      extension: ext,
      type,
      duration: 0,
      dimensions: null,
      bitRate: 0,
      hasVideo: false,
      hasAudio: false
    };

    if (ext === 'pdf') {
      metadata.isPdf = true;
      metadata.isSupported = false;
      metadata.unsupportedReason = 'محول المستندات مخصص لتحويل ملفات Word (DOCX / DOC) إلى PDF فقط. ملفات PDF غير مدعومة كمدخلات.';
      return metadata;
    }

    if (type === 'video' || type === 'audio') {
      try {
        const probed = await mediaEngine.probeMedia(filePath);
        metadata.duration = probed.duration || 0;
        metadata.bitRate = probed.bitRate || 0;
        metadata.hasVideo = probed.hasVideo;
        metadata.hasAudio = probed.hasAudio;
        if (probed.video) {
          metadata.dimensions = {
            width: probed.video.width,
            height: probed.video.height
          };
        }
      } catch (err) {
        // الاستمرار بالبيانات الأساسية إن تعذر فحص الوسائط
      }
    } else if (type === 'image' || type === 'image-raw' || type === 'image-gaming') {
      try {
        const imgMeta = await imageEngine.getImageMetadata(filePath);
        metadata.dimensions = {
          width: imgMeta.width,
          height: imgMeta.height
        };
      } catch (err) {
        // الاستمرار بالبيانات الأساسية
      }
    } else if (type === 'document') {
      metadata.isDocument = true;
      metadata.category = 'document';
      metadata.format = ext;
    }

    return metadata;
  } catch (err) {
    return null;
  }
}

/**
 * مسح مجلد واستخراج الملفات المتوافقة تكرارياً (Recursive)
 */
async function scanFolderRecursive(folderPath, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
  const allSupported = [
    ...SUPPORTED_EXTENSIONS.video,
    ...SUPPORTED_EXTENSIONS.audio,
    ...SUPPORTED_EXTENSIONS.image,
    ...SUPPORTED_EXTENSIONS.document
  ];

  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      const sub = await scanFolderRecursive(fullPath, maxDepth, currentDepth + 1);
      files = files.concat(sub);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase().replace(/^\./, '');
      if (allSupported.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * توليد مسار مخرج فريد لتفادي الكتابة فوق ملف موجود دون قصد
 */
function generateOutputPath(inputPath, targetFormat, customFolder = null, isCompression = false) {
  const dir = customFolder && fs.existsSync(customFolder)
    ? customFolder
    : path.dirname(inputPath);

  const ext = targetFormat.toLowerCase().replace(/^\./, '');
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const suffix = isCompression ? '_compressed' : '_converted';
  let candidate = path.join(dir, `${baseName}${suffix}.${ext}`);

  if (candidate === inputPath || fs.existsSync(candidate)) {
    let counter = 1;
    while (fs.existsSync(candidate)) {
      candidate = path.join(dir, `${baseName}${suffix}_${counter}.${ext}`);
      counter++;
    }
  }

  return candidate;
}

/**
 * تسجيل وربط جميع قنوات IPC المحددة في القسم 09 من وثيقة PRD وقنوات المحرر المتقدم
 * @param {import('electron').BrowserWindow} mainWindow
 */
function registerIpcHandlers(mainWindow) {
  // فحص حالة ودعم كارت الشاشة لتسريع العتاد
  ipcMain.handle('system:gpu-status', async () => {
    return await mediaEngine.detectGpuSupport();
  });

  // 1. media:select-files — اختيار الملفات عبر حوار النظام مع تصفية حسب القسم
  ipcMain.handle('media:select-files', async (event, { type = 'all' } = {}) => {
    const filters = [];

    if (type === 'video') {
      filters.push({ name: 'ملفات الفيديو', extensions: SUPPORTED_EXTENSIONS.video });
    } else if (type === 'audio') {
      filters.push({ name: 'ملفات الصوت', extensions: SUPPORTED_EXTENSIONS.audio });
    } else if (type === 'image') {
      filters.push({ name: 'ملفات الصور', extensions: SUPPORTED_EXTENSIONS.image });
    } else if (type === 'document') {
      filters.push({ name: 'ملفات المستندات (DOCX, DOC)', extensions: SUPPORTED_EXTENSIONS.document });
    } else if (type === 'compressor') {
      filters.push(
        { name: 'ملفات الفيديو والصور للضغط', extensions: [
          ...SUPPORTED_EXTENSIONS.video,
          ...SUPPORTED_EXTENSIONS.image
        ]},
        { name: 'فيديو', extensions: SUPPORTED_EXTENSIONS.video },
        { name: 'صور', extensions: SUPPORTED_EXTENSIONS.image }
      );
    } else {
      filters.push(
        { name: 'كافة الوسائط المدعومة', extensions: [
          ...SUPPORTED_EXTENSIONS.video,
          ...SUPPORTED_EXTENSIONS.audio,
          ...SUPPORTED_EXTENSIONS.image,
          ...SUPPORTED_EXTENSIONS.document
        ]},
        { name: 'فيديو', extensions: SUPPORTED_EXTENSIONS.video },
        { name: 'صوت', extensions: SUPPORTED_EXTENSIONS.audio },
        { name: 'صور', extensions: SUPPORTED_EXTENSIONS.image },
        { name: 'مستندات', extensions: SUPPORTED_EXTENSIONS.document },
        { name: 'كافة الملفات', extensions: ['*'] }
      );
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملفات للتحويل',
      properties: ['openFile', 'multiSelections'],
      filters
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true, filePaths: [] };
    }

    return { canceled: false, filePaths: result.filePaths };
  });

  // قناة مساعدة: اختيار مجلد كامل
  ipcMain.handle('media:select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر مجلد وسائط',
      properties: ['openDirectory']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true, filePaths: [] };
    }

    const folder = result.filePaths[0];
    const scanned = await scanFolderRecursive(folder);
    return { canceled: false, folder, filePaths: scanned };
  });

  // 2. media:drop-files — قراءة واستخراج مواصفات الملفات المسقطة
  ipcMain.handle('media:drop-files', async (event, { filePaths = [] } = {}) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return { success: false, files: [] };
    }

    const allPaths = [];
    for (const fPath of filePaths) {
      if (!fs.existsSync(fPath)) continue;
      const stat = await fs.promises.stat(fPath);
      if (stat.isDirectory()) {
        const subFiles = await scanFolderRecursive(fPath);
        allPaths.push(...subFiles);
      } else if (stat.isFile()) {
        allPaths.push(fPath);
      }
    }

    const metadataPromises = allPaths.map(extractFileMetadata);
    const resolved = await Promise.all(metadataPromises);
    const validFiles = resolved.filter(Boolean);

    return { success: true, files: validFiles };
  });

  // 3. conversion:start — تسجيل المهمة في الرتل وتخصيص الموارد مع دمج التعديلات المتقدمة
  ipcMain.handle('conversion:start', async (event, { taskId, inputPath, targetFormat, options = {}, outputFolder = null } = {}) => {
    if (!taskId || !inputPath || !targetFormat) {
      return { accepted: false, message: 'بيانات غير مكتملة لبدء التحويل' };
    }

    if (!fs.existsSync(inputPath)) {
      return { accepted: false, message: `الملف غير موجود: ${inputPath}` };
    }

    const stat = await fs.promises.stat(inputPath);
    const inExt = path.extname(inputPath).replace(/^\./, '');
    const outExt = targetFormat.replace(/^\./, '');
    const isCompression = Boolean(options && (options.isCompression || options.isCompressor));
    const outputPath = generateOutputPath(inputPath, outExt, outputFolder || options.outputFolder, isCompression);

    // دمج التعديلات المحفوظة للمهمة إن وجدت مع خيارات القص والتقطيع والصوت والترجمة
    const storedEdits = taskEditsStore.get(taskId) || {};
    const taskEdits = {
      ...storedEdits,
      ...(options.edits || {}),
      crop: options.crop || (options.edits && options.edits.crop) || storedEdits.crop,
      trim: options.trim || (options.edits && options.edits.trim) || storedEdits.trim,
      audioTrackIndex: options.audioTrackIndex !== undefined ? options.audioTrackIndex : ((options.edits && options.edits.audioTrackIndex) ?? storedEdits.audioTrackIndex),
      subtitleTrackIndex: options.subtitleTrackIndex !== undefined ? options.subtitleTrackIndex : ((options.edits && options.edits.subtitleTrackIndex) ?? storedEdits.subtitleTrackIndex),
      subtitleMode: options.subtitleMode !== undefined ? options.subtitleMode : ((options.edits && options.edits.subtitleMode) ?? storedEdits.subtitleMode),
      loudnorm: options.loudnorm !== undefined ? options.loudnorm : ((options.edits && options.edits.loudnorm) ?? storedEdits.loudnorm),
      playbackSpeed: options.playbackSpeed !== undefined ? options.playbackSpeed : ((options.edits && (options.edits.playbackSpeed || options.edits.speed)) ?? storedEdits.playbackSpeed)
    };
    const effectiveOptions = { ...options, edits: taskEdits };

    // توثيق المهمة في قاعدة بيانات SQLite
    try {
      db.insertTask({
        task_uid: taskId,
        original_name: path.basename(inputPath),
        original_path: inputPath,
        original_size: stat.size,
        input_format: inExt,
        output_format: outExt,
        file_path: outputPath,
        duration: options.duration || 0,
        status: 'PENDING'
      });
    } catch (e) {
      try {
        db.updateTaskProgress(taskId, { status: 'PENDING', error_message: null });
      } catch (err) {}
    }

    // إدراج المهمة في مدير الرتل
    queueManager.enqueue({
      taskId,
      inputPath,
      outputPath,
      targetFormat: outExt,
      inputFormat: inExt,
      options: effectiveOptions,
      onProgress: (prog) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('conversion:progress', prog);
        }
      },
      onComplete: (res) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('conversion:complete', {
            taskId,
            outputPath: res.outputPath,
            finalSize: res.finalSize,
            duration: res.duration
          });
        }
      },
      onError: (err) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('conversion:error', {
            taskId,
            errorMessage: err.message || 'فشل التحويل',
            code: err.code || 'CONVERSION_ERROR'
          });
        }
      }
    });

    return {
      accepted: true,
      message: 'تمت إضافة المهمة إلى قائمة الانتظار',
      taskId,
      outputPath
    };
  });

  // 4. conversion:pause — تعليق التنفيذ إن دعم النظام ذلك
  ipcMain.handle('conversion:pause', async (event, { taskId } = {}) => {
    return { success: true, message: 'Pause acknowledged' };
  });

  // 5. conversion:cancel — إلغاء المهمة فورياً وحذف الملفات الجزئية
  ipcMain.handle('conversion:cancel', async (event, { taskId } = {}) => {
    if (!taskId) return { success: false };
    const success = queueManager.cancelTask(taskId);
    return { success };
  });

  // 6. queue:cancel-all — إيقاف شامل وإفراغ الرتل وحذف الملفات الجزئية
  ipcMain.handle('queue:cancel-all', async () => {
    const result = queueManager.cancelAll();
    return result;
  });

  // 7. system:open-path — عرض الملف أو المجلد في مستكشف النظام
  ipcMain.handle('system:open-path', async (event, { targetPath, isFolder = false } = {}) => {
    if (!targetPath) return { success: false, error: 'المسار غير محدد' };

    try {
      if (isFolder) {
        await shell.openPath(targetPath);
      } else {
        if (fs.existsSync(targetPath)) {
          shell.showItemInFolder(targetPath);
        } else {
          const dir = path.dirname(targetPath);
          await shell.openPath(dir);
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 7.1 system:open-external — فتح الروابط الخارجية بأمان عبر المتصفح الافتراضي
  ipcMain.handle('system:open-external', async (event, { url } = {}) => {
    if (!url || typeof url !== 'string') return { success: false, error: 'الرابط غير صالح' };
    const trimmed = url.trim();
    if (/^(https?|mailto):/i.test(trimmed)) {
      try {
        await shell.openExternal(trimmed);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'بروتوكول غير مسموح' };
  });

  // 8. history:get — جلب السجل مع التقسيم الصفحي
  ipcMain.handle('history:get', async (event, { limit = 50, offset = 0, status = null, format = null } = {}) => {
    try {
      const data = db.fetchHistory({ limit, offset, status, format });
      return data;
    } catch (err) {
      return { records: [], total: 0, error: err.message };
    }
  });

  // 9. history:delete — حذف سجل محدد أو مسح السجل بالكامل
  ipcMain.handle('history:delete', async (event, { id = null, clearAll = false } = {}) => {
    try {
      const result = db.deleteHistory({ id, clearAll });
      return result;
    } catch (err) {
      return { success: false, affectedRows: 0, error: err.message };
    }
  });

  // --- قنوات محرر الفيديو المتقدم (Advanced Video Editor IPC Channels) ---

  // 10. editor:get-video-meta — قراءة أبعاد الملف ومدته وتردداته عبر ffprobe
  ipcMain.handle('editor:get-video-meta', async (event, { filePath } = {}) => {
    if (!filePath) {
      return { success: false, error: 'مسار الملف غير محدد' };
    }
    try {
      const metadata = await mediaEngine.probeMedia(filePath);
      return { success: true, metadata };
    } catch (err) {
      return { success: false, error: err.message || 'فشل فحص بيانات الفيديو' };
    }
  });

  // 11. editor:select-subtitle — فتح نافذة لاختيار ملفات الترجمة (.srt, .ass, .vtt)
  ipcMain.handle('editor:select-subtitle', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملف الترجمة المدمجة',
      properties: ['openFile'],
      filters: [
        { name: 'ملفات الترجمة (SRT, ASS, VTT)', extensions: ['srt', 'ass', 'ssa', 'vtt'] },
        { name: 'كافة الملفات', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true, filePath: null, content: '' };
    }

    const filePath = result.filePaths[0];
    let content = '';
    try {
      content = await fs.promises.readFile(filePath, 'utf8');
    } catch (e) {}

    return { canceled: false, filePath, content };
  });

  // 11.1 editor:read-subtitle — قراءة محتوى ملف الترجمة من القرص برمجياً
  ipcMain.handle('editor:read-subtitle', async (event, { filePath } = {}) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'ملف الترجمة غير موجود', content: '' };
    }
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message, content: '' };
    }
  });

  // 12. editor:save-edits — حفظ وتحديث كائن التعديلات للمهمة المحددة
  ipcMain.handle('editor:save-edits', async (event, { taskId, edits } = {}) => {
    if (!taskId) {
      return { success: false, error: 'معرف المهمة غير محدد' };
    }

    taskEditsStore.set(taskId, edits);

    // إذا كانت المهمة مدرجة بالفعل في رتل المهام، تحديث خياراتها فوراً
    const task = queueManager.getTask(taskId);
    if (task) {
      if (!task.options) task.options = {};
      task.options.edits = edits;
    }

    return { success: true, taskId, edits };
  });

  // 13. editor:render-sample — اقتطاع عينة 10 ثوانٍ وتطبيق الإعدادات وفتحها للمستخدم للمعاينة السريعة
  ipcMain.handle('editor:render-sample', async (event, { inputPath, targetFormat = 'mp4', options = {} } = {}) => {
    if (!inputPath) {
      return { success: false, error: 'مسار الملف غير محدد' };
    }
    try {
      const result = await mediaEngine.renderSampleClip({ inputPath, targetFormat, options });
      // فتح الملف فوراً للمستخدم عبر مشغل النظام الافتراضي لمعاينة الجودة
      if (result.samplePath && fs.existsSync(result.samplePath)) {
        await shell.openPath(result.samplePath);
      }
      return { success: true, samplePath: result.samplePath };
    } catch (err) {
      return { success: false, error: err.message || 'فشل توليد عينة المعاينة' };
    }
  });
}

module.exports = {
  registerIpcHandlers,
  extractFileMetadata,
  scanFolderRecursive,
  generateOutputPath
};
