// src/preload/index.js
const { contextBridge, ipcRenderer, webUtils } = require('electron');

/**
 * جسر سياق آمن (PRD القسم 07 والقسم 09)
 * يعزل بيئة Node.js بالكامل عن الواجهة ويمرر فقط واجهات محددة ومفلترة
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 1. استخراج المسار الحقيقي للملف عند السحب والإفلات في بيئة الـ Sandbox
  getPathForFile: (file) => {
    if (webUtils && typeof webUtils.getPathForFile === 'function') {
      try {
        return webUtils.getPathForFile(file);
      } catch (err) {}
    }
    return file ? (file.path || '') : '';
  },

  // 2. استدعاءات الملفات والمجلدات
  selectFiles: (options = {}) => {
    return ipcRenderer.invoke('media:select-files', {
      type: options.type || 'all'
    });
  },

  selectFolder: () => {
    return ipcRenderer.invoke('media:select-folder');
  },

  dropFiles: (filePaths = []) => {
    return ipcRenderer.invoke('media:drop-files', { filePaths });
  },

  // 3. التحكم في التحويل ورتل المهام
  startConversion: (taskData = {}) => {
    return ipcRenderer.invoke('conversion:start', {
      taskId: taskData.taskId,
      inputPath: taskData.inputPath,
      targetFormat: taskData.targetFormat,
      options: taskData.options || {},
      outputFolder: taskData.outputFolder || null
    });
  },

  pauseConversion: (taskId) => {
    return ipcRenderer.invoke('conversion:pause', { taskId });
  },

  cancelConversion: (taskId) => {
    return ipcRenderer.invoke('conversion:cancel', { taskId });
  },

  cancelAll: () => {
    return ipcRenderer.invoke('queue:cancel-all');
  },

  // 5. مستكشف النظام وحالة العتاد
  openPath: (targetPath, isFolder = false) => {
    return ipcRenderer.invoke('system:open-path', { targetPath, isFolder });
  },

  openExternal: (url) => {
    return ipcRenderer.invoke('system:open-external', { url });
  },

  system: {
    openExternal: (url) => ipcRenderer.invoke('system:open-external', { url }),
    openPath: (targetPath, isFolder = false) => ipcRenderer.invoke('system:open-path', { targetPath, isFolder }),
    getGpuStatus: () => ipcRenderer.invoke('system:gpu-status')
  },

  getGpuStatus: () => {
    return ipcRenderer.invoke('system:gpu-status');
  },

  // 5. قاعدة البيانات وسجل التحويل
  getHistory: (options = {}) => {
    return ipcRenderer.invoke('history:get', {
      limit: options.limit || 50,
      offset: options.offset || 0,
      status: options.status || null,
      format: options.format || null
    });
  },

  deleteHistory: (options = {}) => {
    return ipcRenderer.invoke('history:delete', {
      id: options.id || null,
      clearAll: Boolean(options.clearAll)
    });
  },

  // 6. قنوات محرر الفيديو المتقدم (Advanced Video Editor)
  getVideoMeta: (filePath) => {
    return ipcRenderer.invoke('editor:get-video-meta', { filePath });
  },

  selectSubtitle: () => {
    return ipcRenderer.invoke('editor:select-subtitle');
  },

  readSubtitle: (filePath) => {
    return ipcRenderer.invoke('editor:read-subtitle', { filePath });
  },

  saveEdits: (taskId, edits) => {
    return ipcRenderer.invoke('editor:save-edits', { taskId, edits });
  },

  renderSample: (params = {}) => {
    return ipcRenderer.invoke('editor:render-sample', params);
  },

  // 7. الاستماع لأحداث البث من المسار الرئيسي مع إرجاع دالة لإلغاء الاشتراك
  onConversionProgress: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('conversion:progress', subscription);
    return () => ipcRenderer.removeListener('conversion:progress', subscription);
  },

  onConversionComplete: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('conversion:complete', subscription);
    return () => ipcRenderer.removeListener('conversion:complete', subscription);
  },

  onConversionError: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('conversion:error', subscription);
    return () => ipcRenderer.removeListener('conversion:error', subscription);
  }
});
