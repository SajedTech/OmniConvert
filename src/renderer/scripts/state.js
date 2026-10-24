// src/renderer/scripts/state.js

/**
 * متجر الحالة المركزية لتطبيق Open-UniConverter
 * يتضمن المحول الذكي الشامل، والتعرف التلقائي، وإعادة التحويل، وتطبيق الصيغ
 */
class AppState {
  constructor() {
    // التبويب الافتراضي هو المحول الذكي الشامل (universal)
    this.currentSection = 'universal'; 
    this.tasks = [];
    this.outputFolder = '';
    this.globalTargetFormat = 'mp4';
    this.isProcessing = false;
    this.listeners = new Set();

    // النمط الافتراضي لعرض الرتل هو النمط البسيط (Compact View)
    let savedMode = 'compact';
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        savedMode = localStorage.getItem('open_uniconverter_view_mode') || 'compact';
      }
    } catch (e) {}
    this.viewMode = savedMode;

    // مصفوفة الصيغ والبروفايلات الاحترافية المتوافقة مع معايير برامج التحويل العالمية
    this.formatsMap = {
      video: {
        label: 'فيديو',
        targets: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'ts', '3gp', 'mp3', 'wav', 'aac', 'flac'],
        videoTargets: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'ts', '3gp'],
        audioTargets: ['mp3', 'wav', 'aac', 'flac'],
        defaultTarget: 'mp4',
        presets: [
          { id: 'video-source', label: 'الجودة الأصلية (Same as Source) - نسخ فوري', options: { resolution: 'source', crf: 23, audioBitrate: '192k' } },
          { id: 'video-4k', label: '4K Ultra HD (3840x2160)', options: { resolution: '4k', crf: 20, videoCodec: 'libx264', audioBitrate: '256k' } },
          { id: 'video-1080p', label: 'Full HD 1080p (1920x1080) - قياسي', options: { resolution: '1080p', crf: 23, videoCodec: 'libx264', audioBitrate: '192k' } },
          { id: 'video-720p', label: 'HD 720p (1280x720) - حجم أصغر', options: { resolution: '720p', crf: 23, videoCodec: 'libx264', audioBitrate: '128k' } },
          { id: 'video-480p', label: 'SD 480p (854x480) - للهواتف القديمة', options: { resolution: '480p', crf: 26, videoCodec: 'libx264', audioBitrate: '96k' } }
        ],
        audioExtractionPresets: [
          { id: 'extract-mp3-320', label: 'MP3: أعلى نقاء استوديو (320 kbps)', options: { audioBitrate: '320k', sampleRate: 48000 } },
          { id: 'extract-mp3-256', label: 'MP3: جودة فائقة (256 kbps)', options: { audioBitrate: '256k', sampleRate: 44100 } },
          { id: 'extract-mp3-192', label: 'MP3: جودة قياسية متوازنة (192 kbps)', options: { audioBitrate: '192k', sampleRate: 44100 } },
          { id: 'extract-mp3-128', label: 'MP3: جودة مضغوطة للمحادثات (128 kbps)', options: { audioBitrate: '128k', sampleRate: 44100 } },
          { id: 'extract-wav-16', label: 'WAV: غير مضغوط PCM 16-bit (CD Quality)', options: { bitDepth: 16, sampleRate: 44100 } },
          { id: 'extract-wav-24', label: 'WAV: استوديو احترافي PCM 24-bit', options: { bitDepth: 24, codec: 'pcm_s24le', sampleRate: 48000 } },
          { id: 'extract-flac', label: 'FLAC: ضغط فائق بدون فقدان للجودة (Lossless)', options: { sampleRate: 44100 } },
          { id: 'extract-aac-256', label: 'AAC: ترميز عالي الكفاءة (256 kbps)', options: { audioBitrate: '256k', sampleRate: 44100 } }
        ]
      },
      audio: {
        label: 'صوت',
        targets: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'wma', 'aiff'],
        defaultTarget: 'mp3',
        presets: [
          { id: 'audio-320k', label: 'أعلى نقاء استوديو (320 kbps)', options: { audioBitrate: '320k', sampleRate: 48000 } },
          { id: 'audio-256k', label: 'جودة فائقة (256 kbps)', options: { audioBitrate: '256k', sampleRate: 44100 } },
          { id: 'audio-192k', label: 'جودة قياسية متوازنة (192 kbps)', options: { audioBitrate: '192k', sampleRate: 44100 } },
          { id: 'audio-128k', label: 'جودة مضغوطة للمحادثات (128 kbps)', options: { audioBitrate: '128k', sampleRate: 44100 } },
          { id: 'audio-wav-24', label: 'WAV استوديو احترافي PCM 24-bit', options: { bitDepth: 24, codec: 'pcm_s24le', sampleRate: 48000 } }
        ]
      },
      image: {
        label: 'صورة',
        targets: ['png', 'jpg', 'webp', 'avif', 'bmp', 'ico', 'tiff', 'gif', 'tga'],
        defaultTarget: 'png',
        presets: [
          { id: 'img-lossless-100', label: 'الأبعاد والجودة الأصلية (100% Lossless)', options: { quality: 100, scale: 100, lossless: true } },
          { id: 'img-a4-print', label: 'A4: طباعة فائقة الدقة 300 DPI (2480x3508)', options: { presetSize: 'a4-print-300', quality: 95, sharpen: true } },
          { id: 'img-a4-screen', label: 'A4: شاشة ومستندات 150 DPI (1240x1754)', options: { presetSize: 'a4-screen-150', quality: 85 } },
          { id: 'img-a5-print', label: 'A5: طباعة 300 DPI (1748x2480)', options: { presetSize: 'a5-print-300', quality: 95, sharpen: true } },
          { id: 'img-fhd-1080p', label: 'Full HD 1080p (1920x1080)', options: { presetSize: 'fhd-1080p', quality: 90 } },
          { id: 'img-insta-sq', label: 'مربع Instagram (1:1 - 1080x1080)', options: { presetSize: 'insta-square', quality: 90 } },
          { id: 'img-web-85', label: 'محسّن للويب والمواقع (جودة 85%)', options: { quality: 85, scale: 100 } },
          { id: 'img-comp-70', label: 'ضغط عالي للحجم (جودة 70%)', options: { quality: 70, scale: 100 } },
          { id: 'img-scale-50', label: 'تصغير الأبعاد 50%', options: { scale: 50, quality: 85 } },
          { id: 'img-ico-multi', label: 'أيقونة Windows متعددة الطبقات (ICO)', options: { icoSizes: [16, 32, 48, 64, 128, 256] } }
        ]
      },
      document: {
        label: 'مستند',
        targets: ['pdf'],
        defaultTarget: 'pdf',
        presets: [
          { id: 'doc-a4-standard', label: 'مستند A4 طباعي (هوامش 20mm)', options: { pageSize: 'A4', margin: 20 } }
        ]
      },
      compressor: {
        label: 'ضاغط الوسائط',
        targets: ['mp4', 'mkv', 'webm', 'jpg', 'webp', 'png'],
        defaultTarget: 'mp4',
        presets: []
      }
    };

    // مشاركة نفس مصفوفة الصور للصور الخام وخامات الألعاب
    this.formatsMap['image-raw'] = this.formatsMap.image;
    this.formatsMap['image-gaming'] = this.formatsMap.image;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try { listener(this); } catch (e) { console.error('خطأ في معالج تحديث الحالة:', e); }
    }
  }

  setSection(sectionName) {
    if (this.currentSection === sectionName) return;
    this.currentSection = sectionName;
    if (this.formatsMap[sectionName]) {
      this.globalTargetFormat = this.formatsMap[sectionName].defaultTarget;
    } else if (sectionName === 'universal') {
      this.globalTargetFormat = 'mp4';
    }
    this.notify();
  }

  setOutputFolder(folder) {
    this.outputFolder = folder;
    this.notify();
  }

  /**
   * التعرف التلقائي الذكي على تصنيف الملف استناداً إلى امتداده (فيديو، صوت، صورة، صورة RAW، خامات ألعاب، مستند)
   */
  detectFileType(extension) {
    const ext = (extension || '').toLowerCase().replace(/^\./, '');
    if (ext === 'pdf') return 'unsupported';
    const videoExts = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'mts', 'm2ts', 'vob', 'ogv'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff', 'alac', 'ape', 'mid', 'midi'];
    const docExts = ['docx', 'doc'];
    const rawExts = ['raw', 'dng', 'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'raf', 'orf', 'rw2', 'pef', 'ptx', 'dcm', 'dicom'];
    const gamingExts = ['tga', 'dds', 'exr', 'hdr', 'pcx', 'sgi', 'rgb', 'rgba', 'bw', 'xbm', 'xpm', 'qoi'];
    const standardImageExts = ['jpg', 'jpeg', 'jpe', 'jfif', 'pjpeg', 'pjp', 'png', 'gif', 'webp', 'avif', 'tiff', 'tif', 'svg', 'ico', 'bmp', 'psd', 'fits', 'fit', 'ppm', 'pgm', 'pbm', 'pnm'];

    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (docExts.includes(ext)) return 'document';
    if (rawExts.includes(ext)) return 'image-raw';
    if (gamingExts.includes(ext)) return 'image-gaming';
    if (standardImageExts.includes(ext)) return 'image';
    return 'unknown';
  }

  /**
   * جلب قائمة البروفايلات المتوافقة لمهمة بناءً على نوعها وصيغتها الهدف
   */
  getPresetsForTask(task) {
    const sectionConfig = this.formatsMap[task.type] || this.formatsMap.video;

    // في حال كان الملف فيديو والمستخدم اختار صيغة صوتية (استخراج صوت)
    if (task.type === 'video' && sectionConfig.audioTargets.includes(task.targetFormat)) {
      return sectionConfig.audioExtractionPresets || this.formatsMap.audio.presets;
    }

    // في حال كان الملف مستند والمستخدم اختار صيغة صورة (استخراج صفحات كصور)
    if (task.type === 'document' && ['png', 'jpg', 'webp', 'avif'].includes(task.targetFormat)) {
      return this.formatsMap.image.presets;
    }

    return sectionConfig.presets;
  }

  /**
   * إضافة ملفات جديدة مع الكشف الذكي التلقائي وضبط المصفوفة الفردية
   */
  addFiles(filesMetadata = []) {
    let addedCount = 0;
    for (const file of filesMetadata) {
      if (!file || !file.path) continue;

      const ext = (file.extension || '').toLowerCase().replace(/^\./, '');
      if (ext === 'pdf') {
        if (typeof window !== 'undefined' && window.uiController && typeof window.uiController.showToast === 'function') {
          window.uiController.showToast('محول المستندات مخصص لتحويل ملفات Word (DOCX / DOC) إلى PDF فقط. ملفات PDF غير مدعومة كمدخلات.', 'error');
        }
        continue;
      }
      const type = file.type && file.type !== 'unknown' && file.type !== 'unsupported' ? file.type : this.detectFileType(ext);
      if (type === 'unsupported' || type === 'unknown') {
        continue;
      }
      const sectionConfig = this.formatsMap[type] || this.formatsMap.video;

      const isCompressor = (this.currentSection === 'compressor');
      const origMB = Math.max(0.1, Math.round(((file.size || 0) / (1024 * 1024)) * 10) / 10);
      const defaultTargetMB = Math.max(0.1, Math.round(origMB * 0.5 * 10) / 10);

      // اختيار الصيغة الافتراضية الذكية
      let defaultTarget = sectionConfig.defaultTarget;
      if (isCompressor) {
        if (type === 'video') {
          defaultTarget = ext === 'mkv' ? 'mkv' : (ext === 'webm' ? 'webm' : 'mp4');
        } else if (type.startsWith('image')) {
          defaultTarget = (ext === 'png' || ext === 'webp') ? 'webp' : 'jpg';
        } else {
          defaultTarget = 'mp4';
        }
      } else if (type === 'document') {
        defaultTarget = 'pdf';
      } else if (type === 'image' && (ext === 'png' || ext === 'ico')) {
        defaultTarget = 'png';
      }

      const defaultPreset = sectionConfig.presets ? sectionConfig.presets[0] : null;
      const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

      const taskOptions = isCompressor ? {
        isCompression: true,
        targetSizeMB: defaultTargetMB,
        targetRatio: 0.5
      } : (defaultPreset ? { ...defaultPreset.options } : {});

      const task = {
        taskId,
        filePath: file.path,
        name: file.name,
        size: file.size || 0,
        extension: ext,
        type,
        category: type,
        duration: file.duration || 0,
        dimensions: file.dimensions || null,
        bitRate: file.bitRate || 0,
        targetFormat: defaultTarget,
        presetId: defaultPreset ? defaultPreset.id : '',
        options: taskOptions,
        isCompressor,
        status: 'IDLE', // IDLE, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
        progress: 0,
        speed: '',
        eta: '',
        timemark: '',
        outputPath: '',
        errorMessage: '',
        finalSize: 0,
        conversionTimeMs: 0
      };

      this.tasks.push(task);
      addedCount++;
    }

    if (addedCount > 0) {
      this.checkProcessingState();
      this.notify();
    }
    return addedCount;
  }

  /**
   * تحديث خصائص مهمة مع إعادة التهيئة الذكية إذا تم تغيير الصيغة لملف منجز مسبقاً
   */
  updateTask(taskId, updates = {}) {
    const task = this.tasks.find(t => t.taskId === taskId);
    if (!task) return;

    // إذا غيّر المستخدم الصيغة الهدف Target Format
    if (updates.targetFormat && updates.targetFormat !== task.targetFormat) {
      // تعديل البروفايل تلقائياً ليتوافق مع الصيغة الجديدة
      const dummyTask = { ...task, targetFormat: updates.targetFormat };
      const compatiblePresets = this.getPresetsForTask(dummyTask);
      if (compatiblePresets && compatiblePresets.length > 0) {
        updates.presetId = compatiblePresets[0].id;
        updates.options = { ...compatiblePresets[0].options };
      }

      // إذا كانت المهمة مكتملة أو ملغاة أو فاشلة، إعادة تعيينها لتكون جاهزة للتحويل فوراً
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status)) {
        updates.status = 'READY';
        updates.progress = 0;
        updates.speed = '';
        updates.eta = '';
        updates.timemark = '';
        updates.errorMessage = '';
        updates.finalSize = 0;
        updates.outputPath = '';
      }
    }

    Object.assign(task, updates);
    this.checkProcessingState();
    this.notify();
  }

  /**
   * تعيين نمط عرض الرتل (بسيط compact أو مفصل detailed)
   */
  setViewMode(mode) {
    this.viewMode = mode;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('open_uniconverter_view_mode', mode);
      }
    } catch (e) {}
    this.notify();
  }

  /**
   * إعادة تهيئة المهمة يدوياً لتكون جاهزة للتحويل مجدداً
   */
  resetTaskToReady(taskId) {
    const task = this.tasks.find(t => t.taskId === taskId);
    if (!task) return;

    task.status = 'READY';
    task.progress = 0;
    task.speed = '';
    task.eta = '';
    task.timemark = '';
    task.errorMessage = '';
    task.finalSize = 0;
    task.outputPath = '';
    task.conversionTimeMs = 0;

    this.checkProcessingState();
    this.notify();
  }

  /**
   * تشغيل مهمة واحدة على الفور
   */
  async startSingleTask(taskId) {
    const task = this.tasks.find(t => t.taskId === taskId);
    if (!task || task.status === 'PROCESSING' || task.status === 'QUEUED') return;

    this.updateTask(taskId, {
      status: 'QUEUED',
      progress: 0,
      errorMessage: ''
    });

    if (window.ipcClient && window.ipcClient.isAvailable) {
      await window.ipcClient.startConversion({
        taskId: task.taskId,
        inputPath: task.filePath,
        targetFormat: task.targetFormat,
        options: task.options || {},
        outputFolder: this.outputFolder || null
      });
    }
  }

  /**
   * تطبيق الصيغة المختارة على جميع ملفات نفس النوع في الرتل (Apply to all of same type)
   */
  applyFormatToAllOfType(type, targetFormat) {
    let affected = 0;
    const isImageType = (type === 'image' || type === 'image-raw' || type === 'image-gaming');

    for (const task of this.tasks) {
      const match = isImageType ? task.type.startsWith('image') : (task.type === type);
      if (match && task.status !== 'PROCESSING' && task.status !== 'QUEUED') {
        const dummyTask = { ...task, targetFormat };
        const compatiblePresets = this.getPresetsForTask(dummyTask);
        const defaultPreset = compatiblePresets ? compatiblePresets[0] : null;

        // 1) تحديث targetFormat في كائن كل مهمة مطابقة داخل state.js فعلياً
        task.targetFormat = targetFormat;
        if (defaultPreset) {
          task.presetId = defaultPreset.id;
          task.options = { ...defaultPreset.options };
        }

        // 2) إعادة تعيين حالة المهام المكتملة وسائر المهام الجاهزة إلى READY تلقائياً
        task.status = 'READY';

        // 3) تصفير أشرطة التقدم للمهام لتعود لوضع الاستعداد
        task.progress = 0;
        task.speed = '';
        task.eta = '';
        task.timemark = '';
        task.errorMessage = '';
        task.finalSize = 0;
        task.outputPath = '';

        affected++;
      }
    }
    if (affected > 0) {
      this.checkProcessingState();
      this.notify();
    }
    return affected;
  }

  removeTask(taskId) {
    const idx = this.tasks.findIndex(t => t.taskId === taskId);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      this.checkProcessingState();
      this.notify();
    }
  }

  clearTasks() {
    this.tasks = [];
    this.isProcessing = false;
    this.notify();
  }

  checkProcessingState() {
    this.isProcessing = this.tasks.some(t => t.status === 'QUEUED' || t.status === 'PROCESSING');
  }

  getFilteredTasks() {
    if (this.currentSection === 'history' || this.currentSection === 'settings') {
      return [];
    }
    if (this.currentSection === 'compressor') {
      return this.tasks.filter(t => t.isCompressor || (t.options && t.options.isCompression));
    }
    if (this.currentSection === 'universal') {
      return this.tasks.filter(t => !(t.isCompressor || (t.options && t.options.isCompression)));
    }
    if (this.currentSection === 'image') {
      return this.tasks.filter(t => (t.type.startsWith('image') || t.category === 'image') && !(t.isCompressor || (t.options && t.options.isCompression)));
    }
    if (this.currentSection === 'document') {
      return this.tasks.filter(t => (t.type === 'document' || t.category === 'document' || t.extension === 'pdf' || t.extension === 'docx' || t.extension === 'doc') && !(t.isCompressor || (t.options && t.options.isCompression)));
    }
    if (this.currentSection === 'video') {
      return this.tasks.filter(t => (t.type === 'video' || t.category === 'video') && t.type !== 'document' && t.category !== 'document' && t.extension !== 'pdf' && t.extension !== 'docx' && t.extension !== 'doc' && !(t.isCompressor || (t.options && t.options.isCompression)));
    }
    if (this.currentSection === 'audio') {
      return this.tasks.filter(t => (t.type === 'audio' || t.category === 'audio') && !(t.isCompressor || (t.options && t.options.isCompression)));
    }
    return this.tasks.filter(t => t.type === this.currentSection && !(t.isCompressor || (t.options && t.options.isCompression)));
  }
}

window.appState = new AppState();
