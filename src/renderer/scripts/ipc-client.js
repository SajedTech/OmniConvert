// src/renderer/scripts/ipc-client.js

/**
 * عميل قنوات الاتصال IPC في الواجهة
 * يغلّف window.electronAPI ويوفر معالجة آمنة للأخطاء
 */
const ipcClient = {
  get isAvailable() {
    return typeof window.electronAPI !== 'undefined';
  },

  getPathForFile(file) {
    if (!this.isAvailable) return file ? (file.path || '') : '';
    if (typeof window.electronAPI.getPathForFile === 'function') {
      try {
        return window.electronAPI.getPathForFile(file);
      } catch (err) {
        return file ? (file.path || '') : '';
      }
    }
    return file ? (file.path || '') : '';
  },

  async selectFiles(type = 'all') {
    if (!this.isAvailable) return { canceled: true, filePaths: [] };
    return await window.electronAPI.selectFiles({ type });
  },

  async selectFolder() {
    if (!this.isAvailable) return { canceled: true, filePaths: [] };
    return await window.electronAPI.selectFolder();
  },

  async dropFiles(filePaths) {
    if (!this.isAvailable) return { success: false, files: [] };
    return await window.electronAPI.dropFiles(filePaths);
  },

  async startConversion(taskData) {
    if (!this.isAvailable) return { accepted: false, message: 'Electron API غير متوفر' };
    return await window.electronAPI.startConversion(taskData);
  },

  async pauseConversion(taskId) {
    if (!this.isAvailable) return { success: false };
    return await window.electronAPI.pauseConversion(taskId);
  },

  async cancelConversion(taskId) {
    if (!this.isAvailable) return { success: false };
    return await window.electronAPI.cancelConversion(taskId);
  },

  async cancelAll() {
    if (!this.isAvailable) return { cancelledCount: 0 };
    return await window.electronAPI.cancelAll();
  },

  async openPath(targetPath, isFolder = false) {
    if (!this.isAvailable) return { success: false };
    return await window.electronAPI.openPath(targetPath, isFolder);
  },

  async openExternal(url) {
    if (!this.isAvailable) return { success: false };
    if (window.electronAPI.system && typeof window.electronAPI.system.openExternal === 'function') {
      return await window.electronAPI.system.openExternal(url);
    }
    if (typeof window.electronAPI.openExternal === 'function') {
      return await window.electronAPI.openExternal(url);
    }
    return { success: false };
  },

  clipboard: {
    async readImage() {
      if (!window.electronAPI?.clipboard?.readImage) return { isEmpty: true, dataUrl: null };
      return await window.electronAPI.clipboard.readImage();
    },
    async saveTempImage(dataUrl) {
      if (!window.electronAPI?.clipboard?.saveTempImage) return null;
      return await window.electronAPI.clipboard.saveTempImage(dataUrl);
    }
  },

  async getGpuStatus() {
    if (!this.isAvailable) return { hasGpu: false, h264_nvenc: false, hevc_nvenc: false };
    return await window.electronAPI.getGpuStatus();
  },

  async getHistory(options = {}) {
    if (!this.isAvailable) return { records: [], total: 0 };
    return await window.electronAPI.getHistory(options);
  },

  async deleteHistory(options = {}) {
    if (!this.isAvailable) return { success: false, affectedRows: 0 };
    return await window.electronAPI.deleteHistory(options);
  },

  // قنوات محرر الفيديو المتقدم
  async getVideoMeta(filePath) {
    if (!this.isAvailable) return { success: false, error: 'Electron غير متوفر' };
    return await window.electronAPI.getVideoMeta(filePath);
  },

  async selectSubtitle() {
    if (!this.isAvailable) return { canceled: true, filePath: null };
    return await window.electronAPI.selectSubtitle();
  },

  async saveEdits(taskId, edits) {
    if (!this.isAvailable) return { success: false, error: 'Electron غير متوفر' };
    return await window.electronAPI.saveEdits(taskId, edits);
  },

  async renderSample(params) {
    if (!this.isAvailable) return { success: false, error: 'Electron غير متوفر' };
    return await window.electronAPI.renderSample(params);
  },

  onProgress(callback) {
    if (!this.isAvailable) return () => {};
    return window.electronAPI.onConversionProgress(callback);
  },

  onComplete(callback) {
    if (!this.isAvailable) return () => {};
    return window.electronAPI.onConversionComplete(callback);
  },

  onError(callback) {
    if (!this.isAvailable) return () => {};
    return window.electronAPI.onConversionError(callback);
  }
};

window.ipcClient = ipcClient;
