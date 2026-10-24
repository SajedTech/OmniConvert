// src/main/queue-manager.js
const os = require('os');
const { EventEmitter } = require('events');
const db = require('./database');
const mediaEngine = require('./engines/media-engine');
const imageEngine = require('./engines/image-engine');
const documentEngine = require('./engines/document-engine');

// الحد الأقصى للمهام المتزامنة للفيديو لتفادي تجميد المعالج والذاكرة
const MAX_CONCURRENT_TASKS = 2;

class QueueManager extends EventEmitter {
  constructor() {
    super();

    // حساب التزامن وفقاً لمعادلات PRD القسم 08 مع خنق المعالجة المتزامنة للفيديو (Concurrency Throttling)
    const numCores = os.cpus() && os.cpus().length ? os.cpus().length : 4;
    this.maxConcurrentTasks = MAX_CONCURRENT_TASKS;
    // تقييد المعالجة المتزامنة للفيديو بـ MAX_CONCURRENT_TASKS = 2 كحد أقصى لمنع تجميد المعالج والـ RAM
    this.concurrencyVideo = Math.min(MAX_CONCURRENT_TASKS, Math.max(1, Math.floor(numCores / 2)));
    // رتل الصور والمستندات بتزامن أوسع: ( Ncores - 1 )
    this.concurrencyOther = Math.max(1, numCores - 1);

    // رتل الوسائط (فيديو وصوت)
    this.mediaWaitingQueue = [];
    this.mediaActiveTasks = new Map();

    // رتل الصور والمستندات
    this.otherWaitingQueue = [];
    this.otherActiveTasks = new Map();

    // فهرس شامل لجميع المهام لمعرفة حالتها
    this.tasks = new Map();
  }

  /**
   * تحديد تصنيف المهمة ونوع الرتل المناسب
   */
  classifyTask(targetFormat, inputFormat) {
    const fmt = (targetFormat || '').toLowerCase().replace(/^\./, '');
    const inFmt = (inputFormat || '').toLowerCase().replace(/^\./, '');

    // قصر مدخلات محرك المستندات على ملفات Word واستبعاد مدخلات PDF صراحة لمنع الانهيارات
    if (inFmt === 'pdf') {
      return 'unsupported';
    }

    const videoFormats = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'vob', 'ogv'];
    const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff', 'alac', 'ape'];
    const docFormats = ['docx', 'doc'];

    const { SHARP_STANDARD_EXTENSIONS, EXTENDED_IMAGE_EXTENSIONS } = require('./engines/image-engine');
    const allImageFormats = [...SHARP_STANDARD_EXTENSIONS, ...EXTENDED_IMAGE_EXTENSIONS, 'bmp', 'avif'];

    if (inFmt === 'docx' || inFmt === 'doc' || docFormats.includes(inFmt)) {
      return 'document';
    }
    if (allImageFormats.includes(fmt) || allImageFormats.includes(inFmt)) {
      return 'image';
    }
    if (audioFormats.includes(fmt) || audioFormats.includes(inFmt)) {
      return 'audio';
    }
    if (videoFormats.includes(fmt) || videoFormats.includes(inFmt)) {
      return 'video';
    }

    return 'unknown';
  }

  /**
   * تسجيل مهمة جديدة وإضافتها إلى الرتل المناسب
   */
  enqueue(task) {
    const taskId = task.taskId || task.task_uid;
    const category = task.category || this.classifyTask(task.targetFormat, task.inputFormat || task.extension);

    const taskRecord = {
      ...task,
      taskId,
      task_uid: taskId,
      category,
      status: 'QUEUED',
      enqueuedAt: Date.now(),
      progress: { percent: 0, speed: '0x', eta: '--:--', timemark: '00:00:00' }
    };

    this.tasks.set(taskId, taskRecord);
    this.emit('task:queued', taskRecord);

    const isMedia = (category === 'video' || category === 'audio');
    if (isMedia) {
      this.mediaWaitingQueue.push(taskRecord);
      this.pumpMediaQueue();
    } else {
      this.otherWaitingQueue.push(taskRecord);
      this.pumpOtherQueue();
    }

    return taskRecord;
  }

  /**
   * معالجة رتل الوسائط (فيديو وصوت) وفق حد التزامن Cvideo
   */
  async pumpMediaQueue() {
    if (this.mediaActiveTasks.size >= this.concurrencyVideo) return;
    if (this.mediaWaitingQueue.length === 0) return;

    const task = this.mediaWaitingQueue.shift();
    if (!task || task.status === 'CANCELLED') {
      return this.pumpMediaQueue();
    }

    this.mediaActiveTasks.set(task.taskId, task);
    this.runTask(task, () => {
      this.mediaActiveTasks.delete(task.taskId);
      this.pumpMediaQueue();
    });
  }

  /**
   * معالجة رتل الصور والمستندات وفق حد التزامن Cother
   */
  async pumpOtherQueue() {
    if (this.otherActiveTasks.size >= this.concurrencyOther) return;
    if (this.otherWaitingQueue.length === 0) return;

    const task = this.otherWaitingQueue.shift();
    if (!task || task.status === 'CANCELLED') {
      return this.pumpOtherQueue();
    }

    this.otherActiveTasks.set(task.taskId, task);
    this.runTask(task, () => {
      this.otherActiveTasks.delete(task.taskId);
      this.pumpOtherQueue();
    });
  }

  /**
   * تشغيل المهمة وتوجيهها للمحرك المختص وتحديث قاعدة البيانات
   */
  async runTask(task, onFinished) {
    task.status = 'PROCESSING';
    task.startedAt = Date.now();
    this.emit('task:started', task);

    try {
      db.updateTaskProgress(task.taskId, { status: 'PROCESSING' });
    } catch (e) {
      // تجاهل أخطاء التحديث غير الحرجة
    }

    const onProgress = (prog) => {
      task.progress = prog;
      this.emit('task:progress', prog);
      if (typeof task.onProgress === 'function') {
        task.onProgress(prog);
      }
    };

    try {
      let result = null;

      if (task.category === 'video' || task.category === 'audio') {
        if (task.options && task.options.isCompression) {
          result = await mediaEngine.compressVideoTask({
            taskId: task.taskId,
            inputPath: task.inputPath,
            outputPath: task.outputPath,
            targetSizeMB: task.options.targetSizeMB,
            options: task.options || {},
            onProgress
          });
        } else {
          result = await mediaEngine.convertMedia({
            taskId: task.taskId,
            inputPath: task.inputPath,
            outputPath: task.outputPath,
            targetFormat: task.targetFormat,
            options: task.options || {},
            onProgress
          });
        }
      } else if (task.category === 'image') {
        if (task.options && task.options.isCompression) {
          result = await imageEngine.compressImageTask({
            taskId: task.taskId,
            inputPath: task.inputPath,
            outputPath: task.outputPath,
            targetSizeMB: task.options.targetSizeMB,
            options: task.options || {},
            onProgress
          });
        } else {
          result = await imageEngine.convertImage({
            taskId: task.taskId,
            inputPath: task.inputPath,
            outputPath: task.outputPath,
            targetFormat: task.targetFormat,
            options: task.options || {},
            onProgress
          });
        }
      } else if (task.category === 'document') {
        result = await documentEngine.convertDocument({
          taskId: task.taskId,
          inputPath: task.inputPath,
          outputPath: task.outputPath,
          options: task.options || {},
          onProgress
        });
      } else {
        throw new Error(`تصنيف غير معروف للمهمة: ${task.category}`);
      }

      task.status = 'COMPLETED';
      task.result = result;
      this.emit('task:completed', { task, result });

      try {
        db.completeTask(task.taskId, {
          final_size: result.finalSize,
          file_path: result.outputPath,
          conversion_time_ms: result.conversionTimeMs,
          duration: result.duration
        });
      } catch (e) {
        console.error('فشل توثيق إكمال المهمة في قاعدة البيانات:', e);
      }

      if (typeof task.onComplete === 'function') {
        task.onComplete(result);
      }
    } catch (err) {
      if (task.status === 'CANCELLED' || err.isCancelled) {
        task.status = 'CANCELLED';
        this.emit('task:cancelled', { taskId: task.taskId });
        try {
          db.cancelTask(task.taskId);
        } catch (e) {}
      } else {
        task.status = 'FAILED';
        task.error = err.message;
        this.emit('task:failed', { taskId: task.taskId, error: err.message });
        try {
          db.failTask(task.taskId, err.message);
        } catch (e) {}
        if (typeof task.onError === 'function') {
          task.onError(err);
        }
      }
    } finally {
      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  }

  /**
   * إلغاء مهمة محددة
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'CANCELLED';

    // 1. التحقق إن كانت في قائمة الانتظار
    const mediaIdx = this.mediaWaitingQueue.findIndex(t => t.taskId === taskId);
    if (mediaIdx !== -1) {
      this.mediaWaitingQueue.splice(mediaIdx, 1);
      this.emit('task:cancelled', { taskId });
      try { db.cancelTask(taskId); } catch (e) {}
      return true;
    }

    const otherIdx = this.otherWaitingQueue.findIndex(t => t.taskId === taskId);
    if (otherIdx !== -1) {
      this.otherWaitingQueue.splice(otherIdx, 1);
      this.emit('task:cancelled', { taskId });
      try { db.cancelTask(taskId); } catch (e) {}
      return true;
    }

    // 2. التحقق إن كانت قيد التنفيذ النشط
    if (this.mediaActiveTasks.has(taskId)) {
      mediaEngine.cancelMediaTask(taskId);
    } else if (this.otherActiveTasks.has(taskId)) {
      if (task.category === 'image') {
        imageEngine.cancelImageTask(taskId);
      } else if (task.category === 'document') {
        documentEngine.cancelDocumentTask(taskId);
      }
    }

    this.emit('task:cancelled', { taskId });
    try { db.cancelTask(taskId); } catch (e) {}
    return true;
  }

  /**
   * إلغاء جميع المهام النشطة والمجدولة وتفريغ الرتل
   */
  cancelAll() {
    let cancelledCount = 0;

    // إلغاء قوائم الانتظار
    for (const t of this.mediaWaitingQueue) {
      t.status = 'CANCELLED';
      try { db.cancelTask(t.taskId); } catch (e) {}
      cancelledCount++;
    }
    this.mediaWaitingQueue = [];

    for (const t of this.otherWaitingQueue) {
      t.status = 'CANCELLED';
      try { db.cancelTask(t.taskId); } catch (e) {}
      cancelledCount++;
    }
    this.otherWaitingQueue = [];

    // إلغاء المهام النشطة
    for (const [taskId] of this.mediaActiveTasks) {
      mediaEngine.cancelMediaTask(taskId);
      try { db.cancelTask(taskId); } catch (e) {}
      cancelledCount++;
    }

    for (const [taskId, task] of this.otherActiveTasks) {
      if (task.category === 'image') {
        imageEngine.cancelImageTask(taskId);
      } else if (task.category === 'document') {
        documentEngine.cancelDocumentTask(taskId);
      }
      try { db.cancelTask(taskId); } catch (e) {}
      cancelledCount++;
    }

    this.emit('queue:cleared', { cancelledCount });
    return { cancelledCount };
  }

  /**
   * جلب معلومات مهمة
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * جلب حالة الرتل العامة
   */
  getStatus() {
    return {
      mediaWaiting: this.mediaWaitingQueue.length,
      mediaActive: this.mediaActiveTasks.size,
      concurrencyVideo: this.concurrencyVideo,
      maxConcurrentTasks: this.maxConcurrentTasks,
      otherWaiting: this.otherWaitingQueue.length,
      otherActive: this.otherActiveTasks.size,
      concurrencyOther: this.concurrencyOther,
      totalTracked: this.tasks.size
    };
  }
}

// تصدير نسخة عامة مفردة (Singleton) لإدارة الرتل في التطبيق
const queueManagerInstance = new QueueManager();

module.exports = queueManagerInstance;
module.exports.QueueManager = QueueManager;
module.exports.MAX_CONCURRENT_TASKS = MAX_CONCURRENT_TASKS;
