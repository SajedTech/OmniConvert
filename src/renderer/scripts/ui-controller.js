// src/renderer/scripts/ui-controller.js

/**
 * كتالوج الصيغ والتنسيقات العالمية المدعومة مع التصنيفات والأوصاف والشارات
 */
const FORMAT_CATALOG = {
  video: [
    { format: 'mp4', name: 'MP4', label: 'MPEG-4 Video (H.264 / HEVC)', desc: 'الأعلى توافقاً مع جميع الشاشات والهواتف وأنظمة التشغيل', badge: 'شائع وموصى به' },
    { format: 'mkv', name: 'MKV', label: 'Matroska Video Container', desc: 'يدعم مسارات صوت متعددة وترجمات مدمجة وفائقة النقاء', badge: 'عالي الدقة' },
    { format: 'webm', name: 'WebM', label: 'Google WebM Video (VP9 / Opus)', desc: 'صيغة جوجل المفتوحة والمثالية للمواقع وصفحات الويب', badge: 'HTML5 الويب' },
    { format: 'avi', name: 'AVI', label: 'Audio Video Interleave', desc: 'صيغة كلاسيكية متوافقة مع مشغلات التلفاز والأجهزة القديمة', badge: 'كلاسيكي' },
    { format: 'mov', name: 'MOV', label: 'Apple QuickTime Movie', desc: 'المعيار القياسي لأجهزة Apple Mac و iPhone وتطبيقات المونتاج', badge: 'Apple' },
    { format: 'wmv', name: 'WMV', label: 'Windows Media Video', desc: 'صيغة مايكروسوفت لنظام ويندوز ومشغلات الوسائط الكلاسيكية', badge: 'Windows' },
    { format: 'flv', name: 'FLV', label: 'Flash Video', desc: 'فيديو خفيف الوزن لمنصات البث القديمة والتطبيقات التراثية', badge: 'فلاش' },
    { format: 'm4v', name: 'M4V', label: 'iTunes Video Format', desc: 'صيغة الفيديو المتوافقة مع أجهزة Apple TV ومكتبة iTunes', badge: 'iTunes' },
    { format: 'ts', name: 'TS', label: 'MPEG Transport Stream', desc: 'بث القنوات الفضائية الرقمية وأجهزة التسجيل التلفزيوني', badge: 'بث رقمي' },
    { format: '3gp', name: '3GP', label: '3GPP Mobile Multimedia', desc: 'صيغة هواتف الجيل الثالث القديمة بحجم فائق الصغر', badge: 'مضغوط' }
  ],
  audio: [
    { format: 'mp3', name: 'MP3', label: 'MPEG Layer-3 Audio', desc: 'الصيغة الأكثر شعبية وتوافقاً مع كافة المشغلات وأنظمة السيارات', badge: 'شائع عالمياً' },
    { format: 'wav', name: 'WAV', label: 'Waveform Audio PCM', desc: 'صوت خام بدون ضغط بجودة استوديو أصلية 100% (16/24-bit)', badge: 'استوديو نقي' },
    { format: 'flac', name: 'FLAC', label: 'Free Lossless Audio Codec', desc: 'ضغط بدون أي فقدان لجودة الصوت إطلاقاً (Lossless Master)', badge: 'أعلى نقاء' },
    { format: 'aac', name: 'AAC', label: 'Advanced Audio Coding', desc: 'جودة صوت متفوقة بحجم أصغر - معيار منصات البث و YouTube', badge: 'عالي الكفاءة' },
    { format: 'ogg', name: 'OGG', label: 'Ogg Vorbis Audio', desc: 'صوت مفتوح المصدر عالي الكفاءة للألعاب والتطبيقات الحديثة', badge: 'مفتوح المصدر' },
    { format: 'm4a', name: 'M4A', label: 'Apple MPEG-4 Audio (ALAC/AAC)', desc: 'صوت عالي النقاء لأجهزة Apple Mac و iPhone ومكتبة الموسيقى', badge: 'Apple' },
    { format: 'opus', name: 'OPUS', label: 'Opus Interactive Audio Codec', desc: 'ترميز فائق الحداثة ومثالي للمحادثات الصوتية والإنترنت', badge: 'حديث ومرن' },
    { format: 'wma', name: 'WMA', label: 'Windows Media Audio', desc: 'صوت مايكروسوفت لنظام ويندوز ومشغل Windows Media Player', badge: 'Windows' },
    { format: 'aiff', name: 'AIFF', label: 'Audio Interchange File Format', desc: 'صوت احترافي غير مضغوط لأنظمة Mac واستوديوهات الإنتاج', badge: 'احترافي' }
  ],
  image: [
    { format: 'png', name: 'PNG', label: 'Portable Network Graphics', desc: 'يدعم الشفافية الكاملة بدون أي فقدان في الجودة (Lossless)', badge: 'شفافية ونقاء' },
    { format: 'jpg', name: 'JPG', label: 'JPEG Image', desc: 'الضغط القياسي للصور الفوتوغرافية وتوفير المساحة التخزينية', badge: 'شائع للصور' },
    { format: 'webp', name: 'WebP', label: 'Google Modern Web Image', desc: 'الجيل الجديد لصور الويب بضغط فائق يصل إلى 60% مع جودة عالية', badge: 'موصى به للويب' },
    { format: 'avif', name: 'AVIF', label: 'AV1 Image File Format', desc: 'أحدث صيغة صور في العالم بأعلى نسبة ضغط ممكنة ونقاء مذهل', badge: 'الجيل القادم' },
    { format: 'bmp', name: 'BMP', label: 'Windows Bitmap (24-bit)', desc: 'بكسلات خام غير مضغوطة متوافقة مع كافة أنظمة ويندوز القديمة', badge: 'خام وغير مضغوط' },
    { format: 'ico', name: 'ICO', label: 'Windows Icon Multi-Layer', desc: 'أيقونة ويندوز متعددة الأحجام حتى 256×256 للبرامج والمواقع', badge: 'أيقونة نظام' },
    { format: 'tiff', name: 'TIFF', label: 'Tagged Image File Format', desc: 'المعيار الطباعي الاحترافي لحفظ أدق التفاصيل وتدرجات الألوان', badge: 'طباعة احترافية' },
    { format: 'gif', name: 'GIF', label: 'Graphics Interchange Format', desc: 'رسوميات الويب الكلاسيكية للصور الثابتة أو البسيطة (8-bit)', badge: 'كلاسيكي' },
    { format: 'tga', name: 'TGA', label: 'Truevision Targa Graphic', desc: 'خامة ألعاب ورسوميات غير مضغوطة لمحركات 3D والألعاب', badge: 'خامات ألعاب' }
  ],
  document: [
    { format: 'pdf', name: 'PDF', label: 'Portable Document Format', desc: 'المستند القياسي العالمي للطباعة والمشاركة مع الحفاظ على التنسيق', badge: 'معياري عالمي' },
    { format: 'docx', name: 'DOCX', label: 'Microsoft Word Document', desc: 'مستند وورد قابل للتحرير والتعديل عبر برامج معالجة النصوص', badge: 'مستند وورد' }
  ]
};

/**
 * وحدة التحكم في واجهة المستخدم وعناصر الـ DOM
 */
const uiController = {
  elements: {},
  currentEditingTaskId: null,
  currentAudioPlayer: null,
  currentAudioBtn: null,
  currentAudioPath: null,

  init() {
    this.elements = {
      // الشريط الجانبي
      navItems: document.querySelectorAll('.nav-item'),
      gpuStatus: document.getElementById('gpuStatus'),
      outputFolderText: document.getElementById('outputFolderText'),
      btnChangeOutputFolder: document.getElementById('btnChangeOutputFolder'),

      // الشريط العلوي
      sectionTitle: document.getElementById('sectionTitle'),
      batchToolbar: document.getElementById('batchToolbar'),
      globalFormatSelect: document.getElementById('globalFormatSelect'),
      btnApplyToAllType: document.getElementById('btnApplyToAllType'),
      btnStartAll: document.getElementById('btnStartAll'),
      btnClearAll: document.getElementById('btnClearAll'),
      toggleViewBtn: document.getElementById('toggleViewBtn'),
      batchImageResizeContainer: document.getElementById('batchImageResizeContainer'),
      btnBatchImageResize: document.getElementById('btnBatchImageResize'),
      batchResizePanel: document.getElementById('batchResizePanel'),
      batchCustomW: document.getElementById('batchCustomW'),
      batchCustomH: document.getElementById('batchCustomH'),
      btnApplyBatchCustomDims: document.getElementById('btnApplyBatchCustomDims'),
      batchVideoResizeContainer: document.getElementById('batchVideoResizeContainer'),
      btnBatchVideoResize: document.getElementById('btnBatchVideoResize'),
      batchVideoResizePanel: document.getElementById('batchVideoResizePanel'),

      // الحاويات المركزية
      converterView: document.getElementById('converterView'),
      dropZone: document.getElementById('dropZone'),
      queueContainer: document.getElementById('queueContainer'),
      tasksList: document.getElementById('tasksList'),
      historyView: document.getElementById('historyView'),
      settingsView: document.getElementById('settingsView'),

      // أزرار إضافة الملفات
      btnSelectFiles: document.getElementById('btnSelectFiles'),
      btnSelectFolder: document.getElementById('btnSelectFolder'),
      btnAddMoreFiles: document.getElementById('btnAddMoreFiles'),

      // تراكب السحب
      dragOverlay: document.getElementById('dragOverlay'),

      // النوافذ المنبثقة
      advancedModal: document.getElementById('advancedModal'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalCancelBtn: document.getElementById('modalCancelBtn'),
      modalSaveBtn: document.getElementById('modalSaveBtn'),
      modalBody: document.getElementById('modalBody'),

      // التنبيهات
      toastContainer: document.getElementById('toastContainer')
    };

    let savedMode = 'compact';
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        savedMode = localStorage.getItem('open_uniconverter_view_mode') || 'compact';
      }
    } catch (e) {}
    this.viewMode = savedMode;

    this.bindEvents();
    this.checkGpuStatus();
    this.formatPicker.init();
    this.applyViewMode(this.viewMode);
  },

  setViewMode(mode) {
    this.viewMode = mode;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('open_uniconverter_view_mode', mode);
      }
    } catch (e) {}
    this.applyViewMode(mode);
    this.showToast(mode === 'compact' ? 'تم تفعيل النمط البسيط (Compact View)' : 'تم تفعيل النمط المفصل (Detailed View)', 'info');
  },

  applyViewMode(mode) {
    if (this.elements.tasksList) {
      if (mode === 'compact') {
        this.elements.tasksList.classList.add('compact-view');
      } else {
        this.elements.tasksList.classList.remove('compact-view');
      }
    }
    if (this.elements.toggleViewBtn) {
      if (mode === 'compact') {
        this.elements.toggleViewBtn.innerHTML = '📑 نمط العرض (بسيط)';
        this.elements.toggleViewBtn.classList.add('active');
        this.elements.toggleViewBtn.title = 'التبديل إلى العرض المفصل';
      } else {
        this.elements.toggleViewBtn.innerHTML = '📑 نمط العرض (مفصل)';
        this.elements.toggleViewBtn.classList.remove('active');
        this.elements.toggleViewBtn.title = 'التبديل إلى العرض البسيط';
      }
    }
    if (typeof window !== 'undefined' && window.appState && window.appState.viewMode !== mode) {
      window.appState.viewMode = mode;
    }
  },

  async checkGpuStatus() {
    try {
      if (window.ipcClient && typeof window.ipcClient.getGpuStatus === 'function') {
        const gpu = await window.ipcClient.getGpuStatus();
        if (this.elements.gpuStatus) {
          if (gpu && (gpu.h264_nvenc || gpu.hasGpu)) {
            this.elements.gpuStatus.innerHTML = `
              <span class="gpu-dot" style="background-color: #10b981; box-shadow: 0 0 10px #10b981;"></span>
              <span>تسريع العتاد NVIDIA (NVENC) ⚡</span>
            `;
            this.elements.gpuStatus.title = 'التشفير العتادي فائق السرعة عبر كارت الشاشة NVIDIA NVENC نشط';
          } else {
            this.elements.gpuStatus.innerHTML = `
              <span class="gpu-dot"></span>
              <span>تسريع المعالج CPU (Multi-core)</span>
            `;
            this.elements.gpuStatus.title = 'معالجة متوازنة السرعة عبر أنوية المعالج المركزي libx264';
          }
        }
      }
    } catch (e) {}
  },

  bindEvents() {
    if (this.elements.modalCloseBtn) {
      this.elements.modalCloseBtn.addEventListener('click', () => this.closeAdvancedModal());
    }
    if (this.elements.modalCancelBtn) {
      this.elements.modalCancelBtn.addEventListener('click', () => this.closeAdvancedModal());
    }
    if (this.elements.btnApplyToAllType) {
      this.elements.btnApplyToAllType.addEventListener('click', () => this.applyFormatToSameType());
    }
    if (this.elements.toggleViewBtn) {
      this.elements.toggleViewBtn.addEventListener('click', () => {
        const nextMode = (this.viewMode === 'compact') ? 'detailed' : 'compact';
        this.setViewMode(nextMode);
      });
    }

    if (this.elements.btnBatchImageResize && this.elements.batchResizePanel) {
      this.elements.btnBatchImageResize.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.elements.batchResizePanel.style.display === 'flex';
        this.elements.batchResizePanel.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', (e) => {
        if (this.elements.batchResizePanel && !this.elements.batchResizePanel.contains(e.target) && e.target !== this.elements.btnBatchImageResize) {
          this.elements.batchResizePanel.style.display = 'none';
        }
      });

      this.elements.batchResizePanel.querySelectorAll('.dropdown-item-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetKey = btn.getAttribute('data-preset');
          this.applyBatchImageResize(presetKey);
          this.elements.batchResizePanel.style.display = 'none';
        });
      });

      if (this.elements.btnApplyBatchCustomDims) {
        this.elements.btnApplyBatchCustomDims.addEventListener('click', () => {
          const w = parseInt(this.elements.batchCustomW?.value || '0', 10);
          const h = parseInt(this.elements.batchCustomH?.value || '0', 10);
          if (w > 0 && h > 0) {
            this.applyBatchImageResize('custom', w, h);
            this.elements.batchResizePanel.style.display = 'none';
          } else {
            this.showToast('يرجى إدخال أبعاد صحيحة (عرض وارتفاع بالبكسل)', 'error');
          }
        });
      }
    }

    if (this.elements.btnBatchVideoResize && this.elements.batchVideoResizePanel) {
      this.elements.btnBatchVideoResize.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.elements.batchVideoResizePanel.style.display === 'flex';
        this.elements.batchVideoResizePanel.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', (e) => {
        if (this.elements.batchVideoResizePanel && !this.elements.batchVideoResizePanel.contains(e.target) && e.target !== this.elements.btnBatchVideoResize) {
          this.elements.batchVideoResizePanel.style.display = 'none';
        }
      });

      this.elements.batchVideoResizePanel.querySelectorAll('.dropdown-item-btn[data-aspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          const aspect = btn.getAttribute('data-aspect');
          const res = btn.getAttribute('data-res');
          const w = parseInt(btn.getAttribute('data-w') || '1920', 10);
          const h = parseInt(btn.getAttribute('data-h') || '1080', 10);
          const label = btn.getAttribute('data-label') || `${w}×${h}`;
          this.applyBatchVideoResize({ aspect, res, w, h, label });
          this.elements.batchVideoResizePanel.style.display = 'none';
        });
      });
    }
  },

  // --- دوال المساعدة والتنسيق ---

  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '';
    const s = Math.round(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  formatBitrate(bps) {
    if (!bps || isNaN(bps) || bps <= 0) return '';
    if (bps >= 1000000) {
      return `${(bps / 1000000).toFixed(1)} Mbps`;
    }
    return `${Math.round(bps / 1000)} kbps`;
  },

  getCategoryInfo(type) {
    switch (type) {
      case 'video':
        return {
          label: 'فيديو 🎬',
          badgeClass: 'badge-cat-video',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`
        };
      case 'audio':
        return {
          label: 'صوت 🎵',
          badgeClass: 'badge-cat-audio',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`
        };
      case 'image':
        return {
          label: 'صورة 🖼️',
          badgeClass: 'badge-cat-image',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
        };
      case 'image-raw':
        return {
          label: 'صورة RAW 📷',
          badgeClass: 'badge-cat-image-raw',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`
        };
      case 'image-gaming':
        return {
          label: 'خامات ألعاب 🎮',
          badgeClass: 'badge-cat-image-gaming',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="6"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><circle cx="15" cy="11" r="1"></circle><circle cx="17" cy="13" r="1"></circle></svg>`
        };
      case 'document':
        return {
          label: 'مستند 📄',
          badgeClass: 'badge-cat-document',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
        };
      default:
        return {
          label: 'ملف 📦',
          badgeClass: 'badge-cat-default',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path></svg>`
        };
    }
  },

  // --- مشغل معاينة الصوت المباشر في بطاقة المهمة (Audio Preview Player) ---

  stopAudioPreview() {
    if (this.currentAudioPlayer) {
      try { this.currentAudioPlayer.pause(); } catch (e) {}
      this.currentAudioPlayer = null;
    }
    if (this.currentAudioBtn) {
      this.currentAudioBtn.textContent = '▶';
      this.currentAudioBtn.classList.remove('playing');
      this.currentAudioBtn = null;
    }
    this.currentAudioPath = null;
  },

  toggleAudioPreview(btn, filePath) {
    if (!filePath) return;
    const streamUrl = `media-stream://stream?path=${encodeURIComponent(filePath)}`;

    // إذا كان المقطع الحالي هو نفسه الذي يعمل حالياً
    if (this.currentAudioPlayer && this.currentAudioPath === filePath) {
      if (!this.currentAudioPlayer.paused) {
        this.currentAudioPlayer.pause();
        btn.textContent = '▶';
        btn.classList.remove('playing');
        return;
      } else {
        if (typeof this.currentAudioPlayer.play === 'function') {
          this.currentAudioPlayer.play().catch(e => console.error('Audio play error:', e));
        }
        btn.textContent = '⏸';
        btn.classList.add('playing');
        this.currentAudioBtn = btn;
        return;
      }
    }

    // إذا كان هناك مقطع آخر يعمل، نقوم بإيقافه واستعادة زره تلقائياً لتجنب تداخل الأصوات
    this.stopAudioPreview();

    // التحقق من توفر مشغل HTML5 Audio (في المتصفح أو محاكاة البيئة)
    if (typeof Audio === 'undefined') {
      btn.textContent = '⏸';
      btn.classList.add('playing');
      this.currentAudioBtn = btn;
      this.currentAudioPath = filePath;
      return;
    }

    try {
      const audio = new Audio(streamUrl);
      this.currentAudioPlayer = audio;
      this.currentAudioBtn = btn;
      this.currentAudioPath = filePath;

      btn.textContent = '⏸';
      btn.classList.add('playing');

      audio.addEventListener('ended', () => {
        btn.textContent = '▶';
        btn.classList.remove('playing');
        if (this.currentAudioPlayer === audio) {
          this.currentAudioPlayer = null;
          this.currentAudioBtn = null;
          this.currentAudioPath = null;
        }
      });

      audio.addEventListener('error', (err) => {
        console.error('فشل تشغيل المعاينة الصوتية:', err);
        btn.textContent = '▶';
        btn.classList.remove('playing');
        if (this.currentAudioPlayer === audio) {
          this.currentAudioPlayer = null;
          this.currentAudioBtn = null;
          this.currentAudioPath = null;
        }
      });

      audio.play().catch(err => {
        console.error('Audio play prevented:', err);
        btn.textContent = '▶';
        btn.classList.remove('playing');
      });
    } catch (err) {
      console.error('Failed to create Audio instance:', err);
      btn.textContent = '▶';
      btn.classList.remove('playing');
    }
  },

  // --- حساب البيانات التقديرية للناتج المتوقع (Before -> After Calculation) ---

  calculateEstimatedOutput(task) {
    let targetDim = 'نفس الأصل';
    let estimatedBytes = task.size || 0;
    let targetDur = task.duration ? this.formatDuration(task.duration) : '';
    const isCompleted = task.status === 'COMPLETED' && task.finalSize > 0;

    // في حال اكتمال المهمة بنجاح، نعرض الحجم الفعلي الحقيقي
    if (isCompleted) {
      return {
        dim: task.dimensions ? `${task.dimensions.width}×${task.dimensions.height}` : (task.targetFormat.toUpperCase()),
        size: `${this.formatBytes(task.finalSize)} (فعلي)`,
        dur: task.duration ? this.formatDuration(task.duration) : '',
        isActual: true
      };
    }

    const tgtFmt = (task.targetFormat || '').toLowerCase();
    const srcFmt = (task.extension || '').toLowerCase();
    const opt = task.options || {};
    const isVideoToAudio = task.type === 'video' && ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'opus', 'wma', 'aiff'].includes(tgtFmt);

    // 1. حساب الأبعاد المستهدفة والمدة (Target Dimensions & Duration)
    let trimDurSec = 0;
    if (task.type === 'video') {
      if (opt.trimmedDuration) {
        trimDurSec = opt.trimmedDuration;
      } else if (opt.trim) {
        const s = opt.trim.start !== undefined ? opt.trim.start : opt.trim.startSec;
        const e = opt.trim.end !== undefined ? opt.trim.end : opt.trim.endSec;
        if (typeof s === 'number' && typeof e === 'number' && e > s) {
          trimDurSec = e - s;
        }
      } else if (opt.startSec !== undefined || opt.endSec !== undefined) {
        const s = Number(opt.startSec) || 0;
        const e = Number(opt.endSec) || 0;
        if (e > s) {
          trimDurSec = e - s;
        }
      }

      const cropObj = opt.crop;
      const hasCrop = cropObj && (cropObj.width || cropObj.cropW) && (cropObj.height || cropObj.cropH);

      if (hasCrop) {
        const cw = Math.round(cropObj.width || cropObj.cropW);
        const ch = Math.round(cropObj.height || cropObj.cropH);
        targetDim = `${cw}×${ch} (قص حر)`;
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (isVideoToAudio) {
        targetDim = 'استخراج صوتي';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.aspectRatio && opt.aspectRatio !== 'source' && opt.aspectRatio !== 'original' && opt.aspectRatio !== 'free-crop' && opt.aspectRatio !== 'custom') {
        const aspectMap = {
          '16:9': (opt.resolution === '4k' || opt.resolution === '2160p') ? '3840×2160 (4K 16:9)' : ((opt.resolution === '720p') ? '1280×720 (HD 16:9)' : '1920×1080 (16:9 YT)'),
          '9:16': (opt.resolution === '4k' || opt.resolution === '2160p') ? '2160×3840 (4K 9:16)' : ((opt.resolution === '720p') ? '720×1280 (HD 9:16)' : '1080×1920 (9:16 TikTok)'),
          '1:1': (opt.resolution === '4k' || opt.resolution === '2160p') ? '2160×2160 (4K 1:1)' : ((opt.resolution === '720p') ? '720×720 (HD 1:1)' : '1080×1080 (1:1 مربع)'),
          '4:3': '1440×1080 (4:3 كلاسيكي)'
        };
        const baseDim = aspectMap[opt.aspectRatio] || (opt.customWidth && opt.customHeight ? `${opt.customWidth}×${opt.customHeight}` : opt.aspectRatio);
        const fitLabel = (opt.fitMode === 'fill') ? 'ملء وقص' : 'حواف سوداء';
        targetDim = `${baseDim} [${fitLabel}]`;
        if (opt.resolution && opt.resolution !== 'source' && opt.resolution !== 'original' && !baseDim.toUpperCase().includes(opt.resolution.toUpperCase())) {
          targetDim += ` · ${opt.resolution.toUpperCase()}`;
        }
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.aspectRatio === 'custom' || (opt.customWidth && opt.customHeight)) {
        const cw = opt.customWidth || opt.width;
        const ch = opt.customHeight || opt.height;
        targetDim = `${cw}×${ch} (مخصص)`;
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.resolution === '4k') {
        targetDim = '3840×2160 (4K)';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.resolution === '1080p') {
        targetDim = '1920×1080 (FHD)';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.resolution === '720p') {
        targetDim = '1280×720 (HD)';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (opt.resolution === '480p') {
        targetDim = '854×480 (SD)';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else if (task.dimensions && task.dimensions.width) {
        targetDim = `${task.dimensions.width}×${task.dimensions.height} (أصلي)`;
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      } else {
        targetDim = 'الدقة الأصلية';
        targetDur = trimDurSec > 0 ? this.formatDuration(trimDurSec) : (task.duration ? this.formatDuration(task.duration) : '');
      }
    } else if (task.type === 'audio') {
      const br = opt.audioBitrate || '192k';
      const sr = opt.sampleRate ? `${Math.round(opt.sampleRate / 1000)} kHz` : '44.1 kHz';
      targetDim = `${br} · ${sr}`;
      targetDur = task.duration ? this.formatDuration(task.duration) : '';
    } else if (task.type.startsWith('image')) {
      if (opt.crop && opt.crop.width && opt.crop.height) {
        targetDim = `${Math.round(opt.crop.width)}×${Math.round(opt.crop.height)} (مقصوص)`;
      } else if (opt.presetSize === 'a4-print-300') {
        targetDim = '2480×3508 (A4 300DPI)';
      } else if (opt.presetSize === 'a4-screen-150') {
        targetDim = '1240×1754 (A4 150DPI)';
      } else if (opt.presetSize === 'a5-print-300') {
        targetDim = '1748×2480 (A5 300DPI)';
      } else if (opt.presetSize === 'fhd-1080p') {
        targetDim = '1920×1080 (FHD)';
      } else if (opt.presetSize === 'insta-square') {
        targetDim = '1080×1080 (1:1)';
      } else if (opt.presetSize === 'story-shorts') {
        targetDim = '1080×1920 (9:16 ستوري)';
      } else if (opt.width && opt.height) {
        targetDim = `${opt.width}×${opt.height} (مخصص)`;
      } else if (opt.scale && opt.scale !== 100 && task.dimensions) {
        const f = opt.scale / 100;
        targetDim = `${Math.round(task.dimensions.width * f)}×${Math.round(task.dimensions.height * f)} (${opt.scale}%)`;
      } else if (task.dimensions && task.dimensions.width) {
        targetDim = `${task.dimensions.width}×${task.dimensions.height}`;
      } else {
        targetDim = 'الأبعاد الأصلية';
      }
      targetDur = '';
    } else if (task.type === 'document') {
      targetDim = 'صفحة A4 القياسية';
      targetDur = '';
    }

    // 2. تقدير الحجم المتوقع للناتج (Estimated Output Size)
    if (isVideoToAudio) {
      const durSec = task.duration || 180;
      let kbps = 192;
      if (opt.audioBitrate) kbps = parseInt(opt.audioBitrate, 10) || 192;
      estimatedBytes = Math.round((durSec * kbps * 1000) / 8);
    } else if (task.type === 'video') {
      const isStreamCopy = (opt.resolution === 'source' || !opt.resolution) &&
        ((srcFmt === 'mp4' && tgtFmt === 'mkv') || (srcFmt === 'mkv' && tgtFmt === 'mp4'));

      if (isStreamCopy) {
        estimatedBytes = task.size;
      } else if (opt.resolution === '4k') {
        estimatedBytes = Math.round(task.size * 1.75);
      } else if (opt.resolution === '1080p') {
        estimatedBytes = Math.round(task.size * 0.85);
      } else if (opt.resolution === '720p') {
        estimatedBytes = Math.round(task.size * 0.55);
      } else if (opt.resolution === '480p') {
        estimatedBytes = Math.round(task.size * 0.35);
      } else {
        estimatedBytes = Math.round(task.size * 0.9);
      }

      // ضبط تقدير الحجم عند اقتطاع مدة الفيديو
      if (trimDurSec > 0 && task.duration && task.duration > 0) {
        const factor = Math.min(1.0, Math.max(0.05, trimDurSec / task.duration));
        estimatedBytes = Math.round(estimatedBytes * factor);
      }
    } else if (task.type === 'audio') {
      if (task.duration && task.duration > 0) {
        let kbps = 192;
        if (opt.audioBitrate) kbps = parseInt(opt.audioBitrate, 10) || 192;
        if (tgtFmt === 'wav') {
          const bitDepth = opt.bitDepth || 16;
          const sRate = opt.sampleRate || 44100;
          estimatedBytes = Math.round(task.duration * sRate * 2 * (bitDepth / 8));
        } else if (tgtFmt === 'flac') {
          estimatedBytes = Math.round(task.duration * 44100 * 2 * 2 * 0.6);
        } else {
          estimatedBytes = Math.round((task.duration * kbps * 1000) / 8);
        }
      } else {
        estimatedBytes = Math.round(task.size * 0.8);
      }
    } else if (task.type.startsWith('image')) {
      const qual = (opt.quality || 85) / 100;
      let base = task.size || 500000;
      if (opt.presetSize === 'a4-print-300') {
        base = 2480 * 3508 * 0.25;
      } else if (opt.presetSize === 'a4-screen-150') {
        base = 1240 * 1754 * 0.2;
      }

      if (tgtFmt === 'webp') {
        estimatedBytes = Math.round(base * 0.45 * qual);
      } else if (tgtFmt === 'avif') {
        estimatedBytes = Math.round(base * 0.35 * qual);
      } else if (tgtFmt === 'jpg' || tgtFmt === 'jpeg') {
        estimatedBytes = Math.round(base * 0.6 * qual);
      } else if (tgtFmt === 'png') {
        estimatedBytes = Math.round(base * 1.1);
      } else if (tgtFmt === 'bmp') {
        estimatedBytes = task.dimensions ? (task.dimensions.width * task.dimensions.height * 3) : Math.round(base * 2.8);
      } else if (tgtFmt === 'ico') {
        estimatedBytes = 145000;
      } else {
        estimatedBytes = Math.round(base * qual);
      }
    } else if (task.type === 'document') {
      estimatedBytes = Math.round(task.size * 1.3);
    }

    return {
      dim: targetDim,
      size: `~ ${this.formatBytes(estimatedBytes)}`,
      dur: targetDur,
      isActual: false
    };
  },

  // --- تحديث قسم مقارنة البيانات في البطاقة آنياً دون إعادة بناء الـ DOM ---

  updateTaskComparisonDOM(task) {
    const card = document.getElementById(`card-${task.taskId}`);
    if (!card) return;

    const estimated = this.calculateEstimatedOutput(task);

    // تحديث نص زر الصيغة
    const btnFmtText = card.querySelector('.btn-format-picker .picker-btn-text');
    if (btnFmtText) btnFmtText.textContent = task.targetFormat.toUpperCase();

    // تحديث وسم الصيغة الهدف في المقارنة
    const targetTag = card.querySelector('.fmt-target-tag');
    if (targetTag) targetTag.textContent = task.targetFormat.toUpperCase();

    // تحديث الأبعاد والخصائص المستهدفة
    const targetDim = card.querySelector('.spec-target-dim');
    if (targetDim) targetDim.textContent = estimated.dim;

    // تحديث الحجم المتوقع
    const targetSize = card.querySelector('.spec-target-size');
    if (targetSize) {
      targetSize.textContent = estimated.size;
      if (estimated.isActual) {
        targetSize.classList.add('text-success');
      } else {
        targetSize.classList.remove('text-success');
      }
    }

    // تحديث المدة المستهدفة
    const targetDur = card.querySelector('.spec-target-dur');
    if (targetDur) targetDur.textContent = estimated.dur;

    // تحديث قائمة البروفايلات في البطاقة إذا تغيرت
    const presetSelect = card.querySelector('.select-target-preset');
    if (presetSelect) {
      const availablePresets = window.appState.getPresetsForTask(task);
      presetSelect.innerHTML = availablePresets.map(p => 
        `<option value="${p.id}" ${task.presetId === p.id ? 'selected' : ''}>${p.label}</option>`
      ).join('');
    }
  },

  // --- إدارة نافذة اختيار الصيغ الاحترافية الشاملة (Format Picker Modal) ---

  formatPicker: {
    currentTask: null,
    currentCategory: 'video',
    searchQuery: '',
    elements: {},

    init() {
      this.elements = {
        modal: document.getElementById('formatPickerModal'),
        searchInput: document.getElementById('formatPickerSearchInput'),
        clearSearchBtn: document.getElementById('pickerSearchClearBtn'),
        fileName: document.getElementById('pickerFileName'),
        closeBtn: document.getElementById('formatPickerCloseBtn'),
        sidebarNavBtns: document.querySelectorAll('.picker-nav-btn'),
        gridContainer: document.getElementById('formatGridContainer'),
        emptyState: document.getElementById('pickerEmptyState'),
        sectionTitle: document.getElementById('pickerSectionTitle'),
        countVideo: document.getElementById('countVideoFormats'),
        countAudio: document.getElementById('countAudioFormats'),
        countImage: document.getElementById('countImageFormats'),
        countDoc: document.getElementById('countDocFormats')
      };

      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => this.close());
      }

      if (this.elements.modal) {
        this.elements.modal.addEventListener('click', (e) => {
          if (e.target === this.elements.modal) this.close();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.elements.modal && this.elements.modal.classList.contains('open')) {
          this.close();
        }
      });

      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          if (this.elements.clearSearchBtn) {
            this.elements.clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
          }
          this.renderGrid();
        });
      }

      if (this.elements.clearSearchBtn) {
        this.elements.clearSearchBtn.addEventListener('click', () => {
          if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.searchQuery = '';
            this.elements.clearSearchBtn.style.display = 'none';
            this.renderGrid();
            this.elements.searchInput.focus();
          }
        });
      }

      if (this.elements.sidebarNavBtns) {
        this.elements.sidebarNavBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            if (cat) this.setCategory(cat);
          });
        });
      }

      this.updateCounts();
    },

    updateCounts() {
      if (this.elements.countVideo) this.elements.countVideo.textContent = FORMAT_CATALOG.video.length;
      if (this.elements.countAudio) this.elements.countAudio.textContent = FORMAT_CATALOG.audio.length;
      if (this.elements.countImage) this.elements.countImage.textContent = FORMAT_CATALOG.image.length;
      if (this.elements.countDoc) this.elements.countDoc.textContent = FORMAT_CATALOG.document.length;
    },

    open(task) {
      this.currentTask = task;
      if (this.elements.fileName) {
        this.elements.fileName.textContent = task.name;
      }
      this.searchQuery = '';
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      if (this.elements.clearSearchBtn) {
        this.elements.clearSearchBtn.style.display = 'none';
      }

      const ext = task ? (task.extension || '').toLowerCase().replace(/^\./, '') : '';
      if (ext === 'pdf' && (!task.targetFormat || task.targetFormat === 'docx')) {
        task.targetFormat = 'png';
        if (window.appState) {
          window.appState.updateTask(task.taskId, { targetFormat: 'png' });
        }
      }
      const isDoc = task && (task.type === 'document' || task.category === 'document' || ext === 'pdf' || ext === 'docx' || ext === 'doc');
      const isImage = task && !isDoc && task.type.startsWith('image');
      const isVideo = task && !isDoc && task.type === 'video';
      const isAudio = task && !isDoc && task.type === 'audio';

      // 1. تصفية حساسة لسياق الملف في الشريط الجانبي (Context-Aware Filtering)
      if (this.elements.sidebarNavBtns) {
        this.elements.sidebarNavBtns.forEach(btn => {
          const cat = btn.getAttribute('data-category');
          if (isDoc) {
            // للمستندات: إظهار قسم المستندات + خيارات الصور (لاستخراج الصور PNG/JPG/WEBP) وإخفاء الفيديو والصوت تماماً لمنع اقتراح MP4
            btn.style.display = (cat === 'document' || cat === 'image') ? 'flex' : 'none';
          } else if (isImage) {
            // للصور: إظهار قسم الصور + خيار تصدير PDF فقط وإخفاء الفيديو والصوت
            btn.style.display = (cat === 'image' || cat === 'document') ? 'flex' : 'none';
          } else if (isVideo) {
            // للفيديو: إظهار قسم الفيديو + قسم الصوت (لاستخراج الصوت) فقط وإخفاء الصور والمستندات
            btn.style.display = (cat === 'video' || cat === 'audio') ? 'flex' : 'none';
          } else if (isAudio) {
            // للصوت: إظهار قسم الصوت فقط
            btn.style.display = (cat === 'audio') ? 'flex' : 'none';
          } else {
            btn.style.display = 'flex';
          }
        });
      }

      // 2. تحديد التبويب الأولي الذكي استناداً إلى تصنيف المهمة وصيغتها المستهدفة
      let initialCat = 'video';
      if (isDoc) {
        initialCat = (task.targetFormat && ['png', 'jpg', 'webp', 'avif'].includes(task.targetFormat.toLowerCase())) ? 'image' : 'document';
      } else if (isImage) {
        initialCat = (task.targetFormat === 'pdf') ? 'document' : 'image';
      } else if (isVideo) {
        const isAudioTarget = FORMAT_CATALOG.audio.some(a => a.format === task.targetFormat);
        initialCat = isAudioTarget ? 'audio' : 'video';
      } else if (isAudio) {
        initialCat = 'audio';
      }

      this.setCategory(initialCat);

      if (this.elements.modal) {
        this.elements.modal.classList.add('open');
      }

      setTimeout(() => {
        if (this.elements.searchInput && typeof this.elements.searchInput.focus === 'function') {
          this.elements.searchInput.focus();
        }
      }, 50);
    },

    close() {
      if (this.elements.modal) {
        this.elements.modal.classList.remove('open');
      }
      this.currentTask = null;
    },

    setCategory(cat) {
      this.currentCategory = cat;
      if (this.elements.sidebarNavBtns) {
        this.elements.sidebarNavBtns.forEach(btn => {
          if (btn.getAttribute('data-category') === cat) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }

      const titles = {
        video: 'صيغ الفيديو المدعومة (Video Formats)',
        audio: 'صيغ الصوت المدعومة واستخراج الصوتيات (Audio Formats)',
        image: 'صيغ الصور ومعالجة الرسوميات (Image Formats)',
        document: 'صيغ المستندات المتاحة (Documents)'
      };
      if (this.elements.sectionTitle) {
        this.elements.sectionTitle.textContent = titles[cat] || 'الصيغ المدعومة';
      }

      this.renderGrid();
    },

    renderGrid() {
      const container = this.elements.gridContainer;
      const emptyState = this.elements.emptyState;
      if (!container) return;

      container.innerHTML = '';

      const task = this.currentTask;
      const ext = task ? (task.extension || '').toLowerCase().replace(/^\./, '') : '';
      if (ext === 'pdf' && (!task.targetFormat || task.targetFormat === 'docx')) {
        task.targetFormat = 'png';
        if (window.appState) {
          window.appState.updateTask(task.taskId, { targetFormat: 'png' });
        }
      }
      const isDoc = task && (task.type === 'document' || task.category === 'document' || ext === 'pdf' || ext === 'docx' || ext === 'doc');
      const isImage = task && !isDoc && task.type.startsWith('image');
      const isVideo = task && !isDoc && task.type === 'video';
      const isAudio = task && !isDoc && task.type === 'audio';

      // تحديد التصنيفات المسموح البحث أو التصفح فيها بحسب سياق الملف
      let allowedCategories = ['video', 'audio', 'image', 'document'];
      if (isDoc) allowedCategories = ['document', 'image'];
      else if (isImage) allowedCategories = ['image', 'document'];
      else if (isVideo) allowedCategories = ['video', 'audio'];
      else if (isAudio) allowedCategories = ['audio'];

      let formats = [];
      if (this.searchQuery) {
        const pool = [];
        for (const cat of allowedCategories) {
          if (FORMAT_CATALOG[cat]) pool.push(...FORMAT_CATALOG[cat]);
        }
        formats = pool.filter(f => 
          f.format.toLowerCase().includes(this.searchQuery) ||
          f.name.toLowerCase().includes(this.searchQuery) ||
          f.label.toLowerCase().includes(this.searchQuery) ||
          f.desc.toLowerCase().includes(this.searchQuery)
        );
      } else {
        const activeCat = allowedCategories.includes(this.currentCategory) ? this.currentCategory : allowedCategories[0];
        formats = FORMAT_CATALOG[activeCat] ? [...FORMAT_CATALOG[activeCat]] : [];
      }

      // تصفية خاصة بالصور والمستندات والـ PDF
      if (isImage) {
        // عند فتح النافذة لمهمة من نوع صورة: في تبويب المستند إخفاء بطاقة DOCX تماماً والإبقاء حصرياً على خيار [ PDF ]
        formats = formats.filter(f => f.format.toLowerCase() !== 'docx');
      } else if (isDoc && ext === 'pdf') {
        // عند فتح النافذة لملف PDF: منع اقتراح أو توجيه التحويل إلى DOCX وتقديم خيارات استخراج الصفحات كصور حصرياً: [ PNG, JPG, WebP ]
        formats = formats.filter(f => ['png', 'jpg', 'webp'].includes(f.format.toLowerCase()));
      }

      if (formats.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';

      const currentTargetFmt = task ? (task.targetFormat || '').toLowerCase() : '';

      for (const fmt of formats) {
        const isActive = (currentTargetFmt === fmt.format.toLowerCase());
        const cardBtn = document.createElement('button');
        cardBtn.type = 'button';
        cardBtn.className = `format-card-btn ${isActive ? 'active' : ''}`;
        cardBtn.title = `${fmt.name} (${fmt.label}): ${fmt.desc}`;

        // بطاقات أنيقة ونظيفة بدون فقرات نصوص طويلة ومشتتة
        cardBtn.innerHTML = `
          ${isActive ? `<div class="fmt-active-indicator" title="الصيغة المحددة حالياً">✓</div>` : ''}
          <div class="fmt-card-top">
            <span class="fmt-card-name">${fmt.name}</span>
            <span class="fmt-card-badge">${fmt.badge}</span>
          </div>
        `;

        cardBtn.addEventListener('click', () => {
          this.selectFormat(fmt.format);
        });

        container.appendChild(cardBtn);
      }
    },

    selectFormat(formatKey) {
      if (!this.currentTask) return;
      const task = this.currentTask;

      window.appState.updateTask(task.taskId, { targetFormat: formatKey });
      uiController.updateTaskComparisonDOM(task);

      this.close();
      uiController.showToast(`تم تعيين الصيغة إلى ${formatKey.toUpperCase()}`, 'success');
    }
  },

  // --- تصيير خيارات قائمة الصيغ (بما فيها استخراج الصوت للفيديو) ---

  renderTargetFormatOptions(task) {
    const config = window.appState.formatsMap[task.type] || window.appState.formatsMap.video;

    if (task.type === 'video') {
      return `
        <optgroup label="صيغ الفيديو">
          ${config.videoTargets.map(fmt => `<option value="${fmt}" ${task.targetFormat === fmt ? 'selected' : ''}>${fmt.toUpperCase()}</option>`).join('')}
        </optgroup>
        <optgroup label="استخراج الصوت من الفيديو">
          ${config.audioTargets.map(fmt => `<option value="${fmt}" ${task.targetFormat === fmt ? 'selected' : ''}>${fmt.toUpperCase()} (صوت)</option>`).join('')}
        </optgroup>
      `;
    }

    return config.targets.map(fmt => `<option value="${fmt}" ${task.targetFormat === fmt ? 'selected' : ''}>${fmt.toUpperCase()}</option>`).join('');
  },

  // --- حساب شارة الجودة الديناميكية للضغط ---
  getQualityRating(task, targetMB) {
    const origMB = Math.max(0.01, (task.size || 0) / (1024 * 1024));
    const target = Number(targetMB) || (origMB * 0.5);
    const ratio = Math.max(0.01, target / origMB);
    const ratioPercent = Math.round(ratio * 100);

    const isVideo = (task.type === 'video');
    if (isVideo && task.duration && task.duration > 0) {
      const totalBitrate = (target * 8192) / task.duration;
      const videoBitrate = Math.max(totalBitrate - 128, 150);

      if (videoBitrate >= 2400) {
        return {
          level: 'high',
          badgeClass: 'badge-quality-high',
          label: 'جودة ممتازة (HD+)',
          bitrate: Math.round(videoBitrate)
        };
      } else if (videoBitrate >= 1000) {
        return {
          level: 'medium',
          badgeClass: 'badge-quality-medium',
          label: 'جودة متوسطة (متوازنة)',
          bitrate: Math.round(videoBitrate)
        };
      } else {
        return {
          level: 'low',
          badgeClass: 'badge-quality-low',
          label: 'جودة منخفضة (ضغط مكثف)',
          bitrate: Math.round(videoBitrate)
        };
      }
    }

    // للصور أو الوسائط التي لا تملك مدة محددة
    if (ratioPercent >= 60) {
      return {
        level: 'high',
        badgeClass: 'badge-quality-high',
        label: 'جودة ممتازة (نقاء عالٍ)',
        ratio: ratioPercent
      };
    } else if (ratioPercent >= 30) {
      return {
        level: 'medium',
        badgeClass: 'badge-quality-medium',
        label: 'جودة متوسطة (متوازنة)',
        ratio: ratioPercent
      };
    } else {
      return {
        level: 'low',
        badgeClass: 'badge-quality-low',
        label: 'جودة منخفضة (ضغط مكثف)',
        ratio: ratioPercent
      };
    }
  },

  // --- بناء وتصيير بطاقة مهمة الضغط الذكي المخصصة ---
  createCompressorCardElement(task) {
    const card = document.createElement('div');
    card.className = `task-card task-card-compressor status-${task.status.toLowerCase()}`;
    card.id = `card-${task.taskId}`;

    const cat = this.getCategoryInfo(task.type);
    const isRunning = (task.status === 'PROCESSING' || task.status === 'QUEUED');

    // الحجم الأصلي بالميجابايت
    const origMB = Math.max(0.1, Math.round(((task.size || 0) / (1024 * 1024)) * 10) / 10);
    let currentTargetMB = task.options?.targetSizeMB || Math.max(0.1, Math.round(origMB * 0.5 * 10) / 10);
    currentTargetMB = Math.round(currentTargetMB * 10) / 10;
    let currentRatioPercent = Math.max(10, Math.min(90, Math.round((currentTargetMB / origMB) * 100)));

    const quality = this.getQualityRating(task, currentTargetMB);

    // سطر البيانات الوصفية (الأبعاد والمدة)
    const metaParts = [];
    if (task.dimensions) metaParts.push(`${task.dimensions.width}×${task.dimensions.height}`);
    const durStr = this.formatDuration(task.duration);
    if (durStr) metaParts.push(durStr);
    const sizeStr = task.size > 0 ? this.formatBytes(task.size) : '';
    const otherMetaText = metaParts.join(' · ');
    const metaText = [sizeStr, otherMetaText].filter(Boolean).join(' · ') || (task.extension || 'FILE').toUpperCase();

    // شارة التوفير بعد الاكتمال
    let savingsHtml = '';
    if (task.status === 'COMPLETED') {
      const origBytes = task.size || 1;
      const finalBytes = task.finalSize || 0;
      const savedBytes = Math.max(0, origBytes - finalBytes);
      const savedPercent = Math.max(0, Math.round((savedBytes / origBytes) * 100));
      const savedMB = (savedBytes / (1024 * 1024)).toFixed(1);
      savingsHtml = `
        <div class="savings-badge" id="savings-${task.taskId}">
          🎉 تم توفير ${savedPercent}% (وفرت ${savedMB} ميجابايت)
        </div>
      `;
    }

    // شارة وتسمية الحالة للنمط البسيط
    let statusLabel = 'جاهز';
    let statusBadgeClass = 'badge-ready';
    if (task.status === 'COMPLETED') {
      statusLabel = '✓ مكتمل';
      statusBadgeClass = 'badge-completed';
    } else if (task.status === 'PROCESSING') {
      statusLabel = `${Number(task.progress || 0).toFixed(0)}%`;
      statusBadgeClass = 'badge-processing';
    } else if (task.status === 'QUEUED') {
      statusLabel = 'في الانتظار';
      statusBadgeClass = 'badge-queued';
    } else if (task.status === 'FAILED') {
      statusLabel = '✕ فشل';
      statusBadgeClass = 'badge-failed';
    } else if (task.status === 'CANCELLED') {
      statusLabel = 'ملغي';
      statusBadgeClass = 'badge-cancelled';
    }

    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-category-pill ${cat.badgeClass}" title="تصنيف الملف: ${cat.label}">
          <span class="cat-icon">${cat.icon}</span>
          <span class="cat-name">${cat.label}</span>
        </div>

        <div class="task-info">
          <div class="task-name-row">
            ${task.type === 'audio' ? `<button type="button" class="btn-audio-preview" title="معاينة الصوت" data-task-id="${task.taskId}">▶</button>` : ''}
            <div class="task-name" title="${task.filePath}">${task.name}</div>
          </div>
          <div class="task-metadata">
            <span class="meta-size">${sizeStr || (task.extension || 'FILE').toUpperCase()}</span>
            ${otherMetaText ? `<span class="meta-details">${sizeStr ? ' · ' : ''}${otherMetaText}</span>` : ''}
          </div>
        </div>

        <!-- مؤشر الحجم الأصلي للملف -->
        <div class="compress-orig-size-badge" title="الحجم الأصلي للملف">
          <span class="badge-icon">📦</span>
          <span>الأصل: <strong>${this.formatBytes(task.size)}</strong></span>
        </div>

        <!-- شارة الحالة للنمط البسيط -->
        <span class="compact-status-badge ${statusBadgeClass}">${statusLabel}</span>

        <div class="task-actions card-actions task-actions-left">
          ${task.status === 'COMPLETED' ? `
            <button class="btn-action btn-open-folder" title="فتح موقع ومسار الملف المضغوط في مستكشف النظام">فتح المجلد 📂</button>
            <button class="btn-action btn-recompress" title="إعادة ضغط الملف بحجم مختلف">🔄 إعادة الضغط</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
          ` : ''}

          ${(task.status === 'IDLE' || task.status === 'READY') ? `
            <button class="btn-action btn-compress-single btn-primary-soft" title="بدء ضغط هذا الملف الآن">بدء الضغط 🗜️</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
          ` : ''}

          ${isRunning ? `
            <button class="btn-action btn-cancel-task" title="إلغاء عملية الضغط">✕ إلغاء</button>
          ` : ''}

          ${(task.status === 'FAILED' || task.status === 'CANCELLED') ? `
            <button class="btn-action btn-recompress" title="إعادة محاولة الضغط">🔄 إعادة المحاولة</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
          ` : ''}
        </div>
      </div>

      <!-- بطاقة تحكمات الضغط التفاعلية (السلايدر، الحجم الرقمي، شارة الجودة، الناتج المتوقع) -->
      <div class="compress-controls-card" id="compress-controls-${task.taskId}">
        <div class="compress-slider-group">
          <span class="compress-slider-label">نسبة الحجم:</span>
          <input type="range" class="compress-slider" id="slider-${task.taskId}" min="10" max="90" step="1" value="${currentRatioPercent}" ${isRunning ? 'disabled' : ''} title="اسحب لتغيير نسبة الحجم المستهدف (10% إلى 90%)">
          <span class="compress-slider-val" id="sliderval-${task.taskId}">${currentRatioPercent}%</span>
        </div>

        <div class="target-size-input-wrapper">
          <label for="numinput-${task.taskId}">الحجم المستهدف:</label>
          <div class="compress-num-input-box">
            <input type="number" class="compress-num-input" id="numinput-${task.taskId}" min="0.1" step="0.5" value="${currentTargetMB}" ${isRunning ? 'disabled' : ''}>
            <span class="input-unit">MB</span>
          </div>
        </div>

        <!-- شارة الجودة الديناميكية -->
        <div class="quality-badge ${quality.badgeClass}" id="quality-${task.taskId}" title="تقييم الجودة بناءً على معدل البت والحجم المستهدف">
          <span class="quality-dot"></span>
          <span class="quality-text">${quality.label}</span>
        </div>

        <!-- معاينة الحجم المتوقع -->
        <div class="compress-est-size" id="estsize-${task.taskId}">
          الناتج المتوقع: <strong>~ ${currentTargetMB.toFixed(1)} MB</strong>
        </div>

        ${savingsHtml}
      </div>

      <!-- شريط التقدم -->
      <div class="task-progress-block">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${(task.status === 'IDLE' || task.status === 'READY') ? 0 : (task.progress || (task.status === 'COMPLETED' ? 100 : 0))}%"></div>
        </div>

        <div class="progress-metrics">
          <span class="metric-percent">${task.status === 'COMPLETED' ? '100.0%' : (task.progress ? `${Number(task.progress).toFixed(1)}%` : (task.status === 'QUEUED' ? 'في الانتظار...' : 'جاهز للضغط'))}</span>

          ${task.status === 'PROCESSING' ? `
            <span class="metric-speed">${task.speed || '1.0x'}</span>
            <span class="metric-eta">${task.eta ? `ETA ${task.eta}` : ''}</span>
          ` : ''}

          ${task.status === 'COMPLETED' ? `
            <span class="metric-success">✓ تم الضغط بنجاح (${this.formatBytes(task.finalSize)})</span>
          ` : ''}

          ${task.status === 'FAILED' ? `
            <span class="metric-error" title="${task.errorMessage || 'حدث خطأ'}">✕ فشل: ${task.errorMessage || 'خطأ غير معروف'}</span>
          ` : ''}

          ${task.status === 'CANCELLED' ? `
            <span class="metric-cancelled">تم الإلغاء</span>
          ` : ''}
        </div>
      </div>
    `;

    // عناصر التحكم التفاعلية للربط المزدوج Two-way sync
    const slider = card.querySelector(`#slider-${task.taskId}`);
    const sliderVal = card.querySelector(`#sliderval-${task.taskId}`);
    const numInput = card.querySelector(`#numinput-${task.taskId}`);
    const qualityEl = card.querySelector(`#quality-${task.taskId}`);
    const estSizeEl = card.querySelector(`#estsize-${task.taskId}`);

    const syncQualityAndState = (newMB, newRatio) => {
      task.options = task.options || {};
      task.options.isCompression = true;
      task.options.targetSizeMB = newMB;
      task.options.targetRatio = newRatio;

      const q = this.getQualityRating(task, newMB);
      if (qualityEl) {
        qualityEl.className = `quality-badge ${q.badgeClass}`;
        const txt = qualityEl.querySelector('.quality-text');
        if (txt) txt.textContent = q.label;
      }
      if (estSizeEl) {
        estSizeEl.innerHTML = `الناتج المتوقع: <strong>~ ${newMB.toFixed(1)} MB</strong>`;
      }
    };

    if (slider && numInput) {
      // 1. تحريك شريط التمرير (Slider Input)
      slider.addEventListener('input', (e) => {
        const ratio = parseInt(e.target.value, 10);
        const calculatedMB = Math.max(0.1, Math.round(origMB * (ratio / 100) * 10) / 10);
        numInput.value = calculatedMB;
        if (sliderVal) sliderVal.textContent = `${ratio}%`;
        syncQualityAndState(calculatedMB, ratio / 100);
      });

      // 2. تعديل حقل الإدخال الرقمي (Number Input)
      numInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = 0.1;
        const calculatedRatio = Math.round((val / origMB) * 100);
        const clampedRatio = Math.max(10, Math.min(90, calculatedRatio));
        slider.value = clampedRatio;
        if (sliderVal) sliderVal.textContent = `${clampedRatio}%`;
        syncQualityAndState(val, val / origMB);
      });
    }

    // زر بدء الضغط المنفرد
    const btnCompressSingle = card.querySelector('.btn-compress-single');
    if (btnCompressSingle) {
      btnCompressSingle.addEventListener('click', () => {
        window.appState.startSingleTask(task.taskId);
      });
    }

    // زر معاينة الصوت
    const audioPreviewBtn = card.querySelector('.btn-audio-preview');
    if (audioPreviewBtn) {
      if (this.currentAudioPlayer && !this.currentAudioPlayer.paused && this.currentAudioPath === task.filePath) {
        audioPreviewBtn.textContent = '⏸';
        audioPreviewBtn.classList.add('playing');
        this.currentAudioBtn = audioPreviewBtn;
      }

      audioPreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAudioPreview(audioPreviewBtn, task.filePath);
      });
    }

    // زر إعادة الضغط / إعادة المحاولة
    const btnRecompress = card.querySelector('.btn-recompress');
    if (btnRecompress) {
      btnRecompress.addEventListener('click', () => {
        window.appState.resetTaskToReady(task.taskId);
        window.appState.startSingleTask(task.taskId);
      });
    }

    // زر الإلغاء
    const btnCancel = card.querySelector('.btn-cancel-task');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.ipcClient.cancelConversion(task.taskId);
        window.appState.updateTask(task.taskId, { status: 'CANCELLED' });
      });
    }

    // زر الحذف
    const btnDelete = card.querySelector('.btn-delete-task');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (this.currentAudioPath === task.filePath) {
          this.stopAudioPreview();
        }
        window.appState.removeTask(task.taskId);
      });
    }

    // زر فتح المجلد الموحد بعد الانتهاء
    const btnOpenFolder = card.querySelector('.btn-open-folder');
    if (btnOpenFolder && task.outputPath) {
      btnOpenFolder.addEventListener('click', () => {
        window.ipcClient.openPath(task.outputPath, false);
      });
    }

    return card;
  },

  // --- تحديث بطاقة الضغط المكتملة في الـ DOM ---
  updateCompressorTaskDOM(task) {
    const card = document.getElementById(`card-${task.taskId}`);
    if (!card) return;

    card.className = `task-card task-card-compressor status-completed`;

    // تحديث شريط التقدم
    const fill = card.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = '100%';

    const percentSpan = card.querySelector('.metric-percent');
    if (percentSpan) percentSpan.textContent = '100.0%';

    const metrics = card.querySelector('.progress-metrics');
    if (metrics) {
      metrics.innerHTML = `
        <span class="metric-percent">100.0%</span>
        <span class="metric-success">✓ تم الضغط بنجاح (${this.formatBytes(task.finalSize)})</span>
      `;
    }

    // إضافة أو تحديث شارة توفير المساحة
    const origBytes = task.size || 1;
    const finalBytes = task.finalSize || 0;
    const savedBytes = Math.max(0, origBytes - finalBytes);
    const savedPercent = Math.max(0, Math.round((savedBytes / origBytes) * 100));
    const savedMB = (savedBytes / (1024 * 1024)).toFixed(1);

    const controlsCard = card.querySelector('.compress-controls-card');
    if (controlsCard) {
      let savingsEl = card.querySelector(`#savings-${task.taskId}`);
      if (!savingsEl) {
        savingsEl = document.createElement('div');
        savingsEl.className = 'savings-badge';
        savingsEl.id = `savings-${task.taskId}`;
        controlsCard.appendChild(savingsEl);
      }
      savingsEl.innerHTML = `🎉 تم توفير ${savedPercent}% (وفرت ${savedMB} ميجابايت)`;
    }

    // تحديث شارة النمط البسيط
    const compactBadge = card.querySelector('.compact-status-badge');
    if (compactBadge) {
      compactBadge.className = 'compact-status-badge badge-completed';
      compactBadge.textContent = '✓ مكتمل';
    }

    // تحديث أزرار الإجراءات (زر فتح المجلد الموحد)
    const actions = card.querySelector('.task-actions');
    if (actions) {
      actions.innerHTML = `
        <button class="btn-action btn-open-folder" title="فتح موقع ومسار الملف المضغوط في مستكشف النظام">فتح المجلد 📂</button>
        <button class="btn-action btn-recompress" title="إعادة ضغط الملف">🔄 إعادة الضغط</button>
        <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
      `;

      const btnOpen = actions.querySelector('.btn-open-folder');
      if (btnOpen && task.outputPath) {
        btnOpen.addEventListener('click', () => {
          window.ipcClient.openPath(task.outputPath, false);
        });
      }

      const btnRe = actions.querySelector('.btn-recompress');
      if (btnRe) {
        btnRe.addEventListener('click', () => {
          window.appState.resetTaskToReady(task.taskId);
          window.appState.startSingleTask(task.taskId);
        });
      }

      const btnDel = actions.querySelector('.btn-delete-task');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          window.appState.removeTask(task.taskId);
        });
      }
    }
  },

  // --- تصيير بطاقة المهمة المنفردة مع بطاقة المقارنة وزر اختيار الصيغة ---

  createTaskCardElement(task) {
    if (task.isCompressor || (task.options && task.options.isCompression)) {
      return this.createCompressorCardElement(task);
    }
    const card = document.createElement('div');
    card.className = `task-card status-${task.status.toLowerCase()}`;
    card.id = `card-${task.taskId}`;

    // إعداد سطر البيانات الوصفية (الحجم · الدقة · معدل البت · المدة)
    const metaParts = [];
    if (task.dimensions) metaParts.push(`${task.dimensions.width}×${task.dimensions.height}`);
    if (task.bitRate > 0) metaParts.push(this.formatBitrate(task.bitRate));
    const durStr = this.formatDuration(task.duration);
    if (durStr) metaParts.push(durStr);
    const sizeStr = task.size > 0 ? this.formatBytes(task.size) : '';
    const otherMetaText = metaParts.join(' · ');
    const metaText = [sizeStr, otherMetaText].filter(Boolean).join(' · ') || (task.extension || 'FILE').toUpperCase();

    const cat = this.getCategoryInfo(task.type);
    const availablePresets = window.appState.getPresetsForTask(task);
    const isRunning = (task.status === 'PROCESSING' || task.status === 'QUEUED');
    const estimated = this.calculateEstimatedOutput(task);

    // حساب مواصفات المصدر
    const srcDimText = task.dimensions ? `${task.dimensions.width}×${task.dimensions.height}` : (task.bitRate > 0 ? this.formatBitrate(task.bitRate) : '');
    const srcDurText = task.duration > 0 ? this.formatDuration(task.duration) : '';

    // إعداد تسمية وشارة الحالة للنمط البسيط
    let statusLabel = 'جاهز';
    let statusBadgeClass = 'badge-ready';
    if (task.status === 'COMPLETED') {
      statusLabel = '✓ مكتمل';
      statusBadgeClass = 'badge-completed';
    } else if (task.status === 'PROCESSING') {
      statusLabel = `${Number(task.progress || 0).toFixed(0)}%`;
      statusBadgeClass = 'badge-processing';
    } else if (task.status === 'QUEUED') {
      statusLabel = 'في الانتظار';
      statusBadgeClass = 'badge-queued';
    } else if (task.status === 'FAILED') {
      statusLabel = '✕ فشل';
      statusBadgeClass = 'badge-failed';
    } else if (task.status === 'CANCELLED') {
      statusLabel = 'ملغي';
      statusBadgeClass = 'badge-cancelled';
    } else {
      statusLabel = 'جاهز';
      statusBadgeClass = 'badge-ready';
    }

    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-category-pill ${cat.badgeClass}" title="تصنيف الملف: ${cat.label}">
          <span class="cat-icon">${cat.icon}</span>
          <span class="cat-name">${cat.label}</span>
        </div>
        
        <div class="task-info">
          <div class="task-name-row">
            ${task.type === 'audio' ? `<button type="button" class="btn-audio-preview" title="معاينة الصوت" data-task-id="${task.taskId}">▶</button>` : ''}
            <div class="task-name" title="${task.filePath}">${task.name}</div>
          </div>
          <div class="task-metadata">
            <span class="meta-size">${sizeStr || (task.extension || 'FILE').toUpperCase()}</span>
            ${otherMetaText ? `<span class="meta-details">${sizeStr ? ' · ' : ''}${otherMetaText}</span>` : ''}
          </div>
        </div>

        <!-- سهم التدفق للنمط البسيط (CloudConvert-like flow) -->
        <span class="compact-flow-arrow" title="الصيغة المستهدفة">←</span>

        <div class="task-selectors">
          <!-- زر فتح نافذة اختيار الصيغة الاحترافية الشاملة -->
          <button class="btn-format-picker" id="btn-fmt-${task.taskId}" data-task-id="${task.taskId}" ${isRunning ? 'disabled' : ''} title="انقر لفتح نافذة اختيار الصيغ مع البحث والتصنيفات">
            <span class="picker-btn-icon">🎯</span>
            <span class="picker-btn-text">${task.targetFormat.toUpperCase()}</span>
            <span class="picker-btn-arrow">▼</span>
          </button>

          <!-- محدد البروفايل والجودة -->
          <select class="select-target-preset profile-select" ${isRunning ? 'disabled' : ''} title="البروفايل ومستوى الجودة">
            ${availablePresets.map(p => `<option value="${p.id}" ${task.presetId === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>

          <!-- زر الخيارات المتقدمة -->
          <button class="btn-advanced" title="خيارات المعالجة المتقدمة والمقاسات والفلاتر" ${isRunning ? 'disabled' : ''}>
            ⚙ متقدم
          </button>
        </div>

        <!-- شارة الحالة للنمط البسيط -->
        <span class="compact-status-badge ${statusBadgeClass}">${statusLabel}</span>

        <div class="task-actions card-actions task-actions-left">
          ${task.status === 'COMPLETED' ? `
            <button class="btn-action btn-reconvert" title="إعادة تحويل نفس الملف بصيغة أخرى">🔄 إعادة التحويل</button>
            <button class="btn-action btn-open-folder" title="فتح موقع ومسار الملف في مستكشف النظام">فتح المجلد 📂</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
          ` : ''}

          ${(task.status === 'IDLE' || task.status === 'READY') ? `
            <button class="btn-action btn-start-single btn-primary-soft" title="تحويل هذا الملف الآن">▶ تحويل</button>
            <button class="btn-action btn-advanced btn-adv-compact" title="خيارات المعالجة المتقدمة والمقاسات والفلاتر" ${isRunning ? 'disabled' : ''}>⚙️</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">✕</button>
          ` : ''}

          ${isRunning ? `
            <button class="btn-action btn-cancel-task" title="إلغاء التحويل">✕ إلغاء</button>
          ` : ''}

          ${(task.status === 'FAILED' || task.status === 'CANCELLED') ? `
            <button class="btn-action btn-reconvert" title="إعادة المحاولة">🔄 إعادة المحاولة</button>
            <button class="btn-action btn-delete-task" title="حذف من الرتل">🗑</button>
          ` : ''}
        </div>
      </div>

      <!-- بطاقة مقارنة البيانات (قبل وبعد التحويل Before -> After) -->
      <div class="comparison-row" id="comparison-${task.taskId}">
        <!-- قسم المصدر (الأصل) -->
        <div class="comparison-side source-side">
          <span class="comparison-side-label">الأصل:</span>
          <span class="spec-tag fmt-tag">${(task.extension || 'FILE').toUpperCase()}</span>
          ${srcDimText ? `<span class="spec-item spec-dim">${srcDimText}</span>` : ''}
          <span class="spec-item spec-size">${this.formatBytes(task.size)}</span>
          ${srcDurText ? `<span class="spec-item spec-dur">${srcDurText}</span>` : ''}
        </div>

        <!-- سهم التحويل المركزي المضيء - يشير لليسار باتجاه الناتج في نظام RTL العربي -->
        <div class="comparison-arrow" title="مسار التحويل إلى الناتج المتوقع">
          <span class="arrow-glyph">←</span>
        </div>

        <!-- قسم الناتج المتوقع (بعد التحويل) -->
        <div class="comparison-side output-side">
          <span class="comparison-side-label">الناتج:</span>
          <span class="spec-tag fmt-target-tag">${task.targetFormat.toUpperCase()}</span>
          <span class="spec-item spec-target-dim">${estimated.dim}</span>
          <span class="spec-item spec-target-size ${estimated.isActual ? 'text-success' : ''}">${estimated.size}</span>
          ${estimated.dur ? `<span class="spec-item spec-target-dur">${estimated.dur}</span>` : ''}
        </div>
      </div>

      <div class="task-progress-block">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${(task.status === 'IDLE' || task.status === 'READY') ? 0 : (task.progress || (task.status === 'COMPLETED' ? 100 : 0))}%"></div>
        </div>

        <div class="progress-metrics">
          <span class="metric-percent">${task.status === 'COMPLETED' ? '100.0%' : (task.progress ? `${Number(task.progress).toFixed(1)}%` : (task.status === 'QUEUED' ? 'في الانتظار...' : 'جاهز للتحويل'))}</span>
          
          ${task.status === 'PROCESSING' ? `
            <span class="metric-speed">${task.speed || '1.0x'}</span>
            <span class="metric-eta">${task.eta ? `ETA ${task.eta}` : ''}</span>
          ` : ''}

          ${task.status === 'COMPLETED' ? `
            <span class="metric-success">✓ تم التحويل بنجاح (${this.formatBytes(task.finalSize)})</span>
          ` : ''}

          ${task.status === 'FAILED' ? `
            <span class="metric-error" title="${task.errorMessage || 'حدث خطأ'}">✕ فشل: ${task.errorMessage || 'خطأ غير معروف'}</span>
          ` : ''}

          ${task.status === 'CANCELLED' ? `
            <span class="metric-cancelled">تم الإلغاء</span>
          ` : ''}
        </div>
      </div>
    `;

    // ربط الأحداث
    const audioPreviewBtn = card.querySelector('.btn-audio-preview');
    if (audioPreviewBtn) {
      if (this.currentAudioPlayer && !this.currentAudioPlayer.paused && this.currentAudioPath === task.filePath) {
        audioPreviewBtn.textContent = '⏸';
        audioPreviewBtn.classList.add('playing');
        this.currentAudioBtn = audioPreviewBtn;
      }

      audioPreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAudioPreview(audioPreviewBtn, task.filePath);
      });
    }

    const btnFormat = card.querySelector('.btn-format-picker');
    if (btnFormat) {
      btnFormat.addEventListener('click', () => {
        this.formatPicker.open(task);
      });
    }

    const presetSelect = card.querySelector('.select-target-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const selectedPreset = availablePresets.find(p => p.id === e.target.value);
        if (selectedPreset) {
          window.appState.updateTask(task.taskId, {
            presetId: selectedPreset.id,
            options: { ...task.options, ...selectedPreset.options }
          });
          this.updateTaskComparisonDOM(task);
        }
      });
    }

    const advButtons = card.querySelectorAll('.btn-advanced');
    advButtons.forEach(btnAdvanced => {
      btnAdvanced.addEventListener('click', () => {
        this.openAdvancedModal(task);
      });
    });

    const btnStartSingle = card.querySelector('.btn-start-single');
    if (btnStartSingle) {
      btnStartSingle.addEventListener('click', () => {
        window.appState.startSingleTask(task.taskId);
      });
    }

    const btnReconvert = card.querySelector('.btn-reconvert');
    if (btnReconvert) {
      btnReconvert.addEventListener('click', () => {
        window.appState.startSingleTask(task.taskId);
      });
    }

    const btnDelete = card.querySelector('.btn-delete-task');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (this.currentAudioPath === task.filePath) {
          this.stopAudioPreview();
        }
        window.appState.removeTask(task.taskId);
      });
    }

    const btnCancel = card.querySelector('.btn-cancel-task');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.ipcClient.cancelConversion(task.taskId);
        window.appState.updateTask(task.taskId, { status: 'CANCELLED' });
      });
    }

    // زر فتح المجلد الموحد الأنيق (يعرض الملف مظللاً داخل مجلده بنظام التشغيل)
    const btnOpenFolder = card.querySelector('.btn-open-folder');
    if (btnOpenFolder && task.outputPath) {
      btnOpenFolder.addEventListener('click', () => {
        window.ipcClient.openPath(task.outputPath, false);
      });
    }

    return card;
  },

  // --- تطبيق الصيغة المختارة على كل ملفات نفس النوع ---

  applyFormatToSameType() {
    const select = this.elements.globalFormatSelect;
    if (!select) return;
    const targetFormat = (select.value || '').toLowerCase().trim();
    if (!targetFormat) return;

    window.appState.globalTargetFormat = targetFormat;

    // تحديد التصنيف المستهدف بدقة بناءً على مصفوفة الصيغ أو القسم الحالي
    let targetType = null;
    for (const [catKey, conf] of Object.entries(window.appState.formatsMap)) {
      if (conf.targets && conf.targets.map(t => t.toLowerCase()).includes(targetFormat)) {
        targetType = catKey;
        break;
      }
    }

    if (!targetType) {
      const currentSection = window.appState.currentSection;
      targetType = currentSection !== 'universal' ? currentSection : 'video';
    }

    const count = window.appState.applyFormatToAllOfType(targetType, targetFormat);
    const catLabel = window.appState.formatsMap[targetType]?.label || 'الملفات';

    if (count > 0) {
      this.showToast(`تم تطبيق صيغة ${targetFormat.toUpperCase()} وتجهيز ${count} من ملفات الـ ${catLabel} للتحويل`, 'success');
    } else {
      this.showToast(`لا توجد ملفات ${catLabel} في الرتل لتطبيق الصيغة عليها`, 'info');
    }
  },

  // --- توحيد أبعاد الصور بالكامل دفعة واحدة (Batch Image Resizer) ---

  applyBatchImageResize(presetKey, customW, customH) {
    const tasks = (window.appState.tasks || []).filter(t => t.type && t.type.startsWith('image'));
    if (tasks.length === 0) {
      this.showToast('لا توجد ملفات صور في الرتل الحالي لتعديل أبعادها', 'info');
      return;
    }

    const PRESET_MAP = {
      'a4': { w: 2480, h: 3508, name: 'A4 (2480×3508)' },
      'a5': { w: 1748, h: 2480, name: 'A5 (1748×2480)' },
      'square-1080': { w: 1080, h: 1080, name: 'Instagram Square (1080×1080)' },
      'story-shorts': { w: 1080, h: 1920, name: 'Story / Shorts (1080×1920)' },
      'fhd': { w: 1920, h: 1080, name: 'Full HD (1920×1080)' }
    };

    let targetW = 0;
    let targetH = 0;
    let presetName = '';

    if (presetKey === 'custom') {
      targetW = parseInt(customW, 10);
      targetH = parseInt(customH, 10);
      presetName = `${targetW}×${targetH} px`;
    } else if (PRESET_MAP[presetKey]) {
      targetW = PRESET_MAP[presetKey].w;
      targetH = PRESET_MAP[presetKey].h;
      presetName = PRESET_MAP[presetKey].name;
    }

    if (!targetW || !targetH || isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) {
      this.showToast('يرجى تحديد أبعاد صحيحة للصور', 'error');
      return;
    }

    let count = 0;
    tasks.forEach(task => {
      const taskId = task.taskId || task.id;
      const currentOpts = task.options || {};
      window.appState.updateTask(taskId, {
        options: {
          ...currentOpts,
          presetSize: (presetKey === 'custom') ? 'custom' : presetKey,
          width: targetW,
          height: targetH,
          maintainAspectRatio: false
        }
      });
      count++;
    });

    this.render(window.appState);
    this.showToast(`تم توحيد أبعاد ${count} صورة بنجاح إلى [ ${presetName} ] 📐`, 'success');
  },

  // --- توحيد أبعاد ودقة مقاطع الفيديو دفعة واحدة (Batch Video Resolution Resizer) ---

  applyBatchVideoResize({ aspect, res, w, h, label }) {
    const tasks = (window.appState.tasks || []).filter(t => t.type === 'video');
    if (tasks.length === 0) {
      this.showToast('لا توجد مقاطع فيديو في الرتل الحالي لتعديل أبعادها', 'info');
      return;
    }

    let count = 0;
    tasks.forEach(task => {
      const taskId = task.taskId || task.id;
      const currentOpts = task.options || {};
      window.appState.updateTask(taskId, {
        options: {
          ...currentOpts,
          aspectRatio: aspect,
          aspectPreset: aspect,
          resolution: res,
          customWidth: w,
          customHeight: h,
          width: w,
          height: h,
          fitMode: currentOpts.fitMode || 'fit'
        }
      });
      count++;
    });

    this.render(window.appState);
    this.showToast(`تم توحيد أبعاد ${count} فيديو بنجاح إلى [ ${label || `${w}×${h}`} ] 🎬`, 'success');
  },

  // --- تحديث بطاقة جارية آنياً دون إعادة بناء الـ DOM ---

  updateTaskProgressDOM(progressData) {
    const card = document.getElementById(`card-${progressData.taskId}`);
    if (!card) return;

    card.className = 'task-card status-processing';

    const fill = card.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = `${progressData.percent}%`;

    const percentSpan = card.querySelector('.metric-percent');
    if (percentSpan) percentSpan.textContent = `${Number(progressData.percent).toFixed(1)}%`;

    let speedSpan = card.querySelector('.metric-speed');
    if (!speedSpan) {
      const metrics = card.querySelector('.progress-metrics');
      if (metrics) {
        speedSpan = document.createElement('span');
        speedSpan.className = 'metric-speed';
        metrics.appendChild(speedSpan);
      }
    }
    if (speedSpan) speedSpan.textContent = progressData.speed || '';

    let etaSpan = card.querySelector('.metric-eta');
    if (!etaSpan) {
      const metrics = card.querySelector('.progress-metrics');
      if (metrics) {
        etaSpan = document.createElement('span');
        etaSpan.className = 'metric-eta';
        metrics.appendChild(etaSpan);
      }
    }
    if (etaSpan) etaSpan.textContent = progressData.eta ? `ETA ${progressData.eta}` : '';
  },

  // --- تصيير الواجهة بالكامل استناداً إلى الحالة ---

  render(state) {
    const sectionTitles = {
      universal: 'المحول الذكي الشامل (Auto-Detect Hub)',
      video: 'محول الفيديو واستخراج الصوت',
      audio: 'محول ومستخرج الصوتيات',
      image: 'معالج ومحول الصور',
      document: 'محول المستندات (DOCX → PDF)',
      compressor: 'ضاغط الوسائط الذكي (Smart Compressor)',
      history: 'سجل عمليات التحويل',
      settings: 'إعدادات النظام والعتاد'
    };

    if (this.elements.sectionTitle) {
      this.elements.sectionTitle.textContent = sectionTitles[state.currentSection] || 'Open-UniConverter';
    }

    // تحديث فئة شاشة المحول لوضع الضغط الذكي
    if (this.elements.converterView) {
      if (state.currentSection === 'compressor') {
        this.elements.converterView.classList.add('smart-compressor-view');
      } else {
        this.elements.converterView.classList.remove('smart-compressor-view');
      }
    }

    // تحديث قائمة التنقل الجانبية
    this.elements.navItems.forEach(item => {
      const sec = item.getAttribute('data-section');
      if (sec === state.currentSection) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // تبديل الشاشات الأساسية
    if (state.currentSection === 'history') {
      this.elements.converterView.style.display = 'none';
      this.elements.settingsView.style.display = 'none';
      this.elements.historyView.style.display = 'block';
      this.renderHistory();
      return;
    }

    if (state.currentSection === 'settings') {
      this.elements.converterView.style.display = 'none';
      this.elements.historyView.style.display = 'none';
      this.elements.settingsView.style.display = 'block';
      this.renderSettings(state);
      return;
    }

    this.elements.historyView.style.display = 'none';
    this.elements.settingsView.style.display = 'none';
    this.elements.converterView.style.display = 'block';

    const tasks = state.getFilteredTasks();

    // ضبط قائمة الصيغ العامة بالشريط العلوي
    let availableGlobalFormats = [];
    if (state.currentSection === 'universal') {
      availableGlobalFormats = [
        { group: 'فيديو', items: state.formatsMap.video.targets },
        { group: 'صوت', items: state.formatsMap.audio.targets },
        { group: 'صور', items: state.formatsMap.image.targets },
        { group: 'مستندات', items: state.formatsMap.document.targets }
      ];
    } else {
      const conf = state.formatsMap[state.currentSection] || state.formatsMap.video;
      availableGlobalFormats = [{ group: conf.label, items: conf.targets }];
    }

    if (this.elements.globalFormatSelect) {
      const currentVal = this.elements.globalFormatSelect.value || state.globalTargetFormat;
      this.elements.globalFormatSelect.innerHTML = availableGlobalFormats.map(grp => `
        <optgroup label="${grp.group}">
          ${grp.items.map(f => `<option value="${f}" ${(currentVal === f || state.globalTargetFormat === f) ? 'selected' : ''}>${f.toUpperCase()}</option>`).join('')}
        </optgroup>
      `).join('');
      if (currentVal) {
        this.elements.globalFormatSelect.value = currentVal;
      }
    }

    // إظهار رتل المهام أو منطقة السحب والإفلات
    if (tasks.length === 0) {
      this.elements.dropZone.style.display = 'flex';
      this.elements.queueContainer.style.display = 'none';
      this.elements.batchToolbar.style.display = 'none';

      const dropTitle = document.getElementById('dropZoneTitle');
      const dropSub = document.getElementById('dropZoneSubtitle');
      if (dropTitle && dropSub) {
        if (state.currentSection === 'universal') {
          dropTitle.textContent = 'اسحب وأفلت الملفات هنا لبدء التحويل';
          dropSub.textContent = 'يدعم تحويل جميع صيغ الفيديو، الصوت، الصور، والمستندات دون إنترنت وبأمان تام.';
        } else if (state.currentSection === 'compressor') {
          dropTitle.textContent = 'ضاغط الوسائط الذكي: اسحب الفيديو أو الصور لتقليص الحجم';
          dropSub.textContent = 'تحكم ذكي في الحجم المستهدف مع الحفاظ على أعلى جودة ممكنة وحساب معدل البت تلقائياً.';
        } else {
          const conf = state.formatsMap[state.currentSection];
          dropTitle.textContent = `اسحب وأفلت ملفات ${conf ? conf.label : ''} هنا`;
          dropSub.textContent = `اختر الملفات للتحويل إلى صيغ ${conf ? conf.targets.map(t => t.toUpperCase()).join(' · ') : ''} بسرعة فائقة.`;
        }
      }
    } else {
      this.elements.dropZone.style.display = 'none';
      this.elements.queueContainer.style.display = 'block';
      this.elements.batchToolbar.style.display = 'flex';

      if (this.elements.batchImageResizeContainer) {
        const isImageSection = (state.currentSection === 'image') || (state.currentSection === 'universal' && tasks.some(t => t.type && t.type.startsWith('image')));
        this.elements.batchImageResizeContainer.style.display = isImageSection ? 'inline-flex' : 'none';
      }

      if (this.elements.batchVideoResizeContainer) {
        const isVideoSection = (state.currentSection === 'video') || (state.currentSection === 'universal' && tasks.some(t => t.type === 'video'));
        this.elements.batchVideoResizeContainer.style.display = isVideoSection ? 'inline-flex' : 'none';
      }

      // تخصيص شريط التحكم الجماعي بحسب القسم
      if (state.currentSection === 'compressor') {
        const fmtSelect = document.getElementById('globalFormatSelect');
        const fmtLabel = this.elements.batchToolbar ? this.elements.batchToolbar.querySelector('.batch-label') : null;
        const applyBtn = document.getElementById('btnApplyToAllType');
        if (fmtSelect) fmtSelect.style.display = 'none';
        if (fmtLabel) fmtLabel.style.display = 'none';
        if (applyBtn) applyBtn.style.display = 'none';

        if (this.elements.btnStartAll) {
          const readyCount = tasks.filter(t => t.status === 'READY' || t.status === 'IDLE').length;
          if (state.isProcessing) {
            this.elements.btnStartAll.disabled = true;
            this.elements.btnStartAll.innerHTML = `<span class="spinner-small"></span> جاري الضغط...`;
          } else {
            this.elements.btnStartAll.disabled = (readyCount === 0);
            this.elements.btnStartAll.innerHTML = `بدء الضغط (${readyCount}) 🗜️`;
          }
        }
      } else {
        const fmtSelect = document.getElementById('globalFormatSelect');
        const fmtLabel = this.elements.batchToolbar ? this.elements.batchToolbar.querySelector('.batch-label') : null;
        const applyBtn = document.getElementById('btnApplyToAllType');
        if (fmtSelect) fmtSelect.style.display = '';
        if (fmtLabel) fmtLabel.style.display = '';
        if (applyBtn) applyBtn.style.display = '';

        // تحديث زر البدء الجماعي
        if (this.elements.btnStartAll) {
          const readyCount = tasks.filter(t => t.status === 'READY' || t.status === 'IDLE').length;
          if (state.isProcessing) {
            this.elements.btnStartAll.disabled = true;
            this.elements.btnStartAll.innerHTML = `<span class="spinner-small"></span> جاري التحويل...`;
          } else {
            this.elements.btnStartAll.disabled = (readyCount === 0);
            this.elements.btnStartAll.innerHTML = `بدء التحويل (${readyCount}) ▶`;
          }
        }
      }

      // بناء وتحديث بطاقات المهام
      if (this.elements.tasksList) {
        this.elements.tasksList.innerHTML = '';
        for (const task of tasks) {
          const card = this.createTaskCardElement(task);
          this.elements.tasksList.appendChild(card);
        }
        this.applyViewMode(this.viewMode);
      }
    }
  },

  // --- تصيير شاشة السجل History ---

  async renderHistory() {
    const historyView = this.elements.historyView;
    if (!historyView) return;

    historyView.innerHTML = `
      <div class="history-header">
        <h3>سجل عمليات التحويل السابقة</h3>
        <div class="history-actions">
          <button id="btnClearHistory" class="btn-secondary">مسح السجل كاملاً</button>
          <button id="btnRefreshHistory" class="btn-secondary">تحديث</button>
        </div>
      </div>
      <div class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>الملف الأصلي</th>
              <th>الصيغة</th>
              <th>الحجم النهائي</th>
              <th>الحالة</th>
              <th>الوقت</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="historyTableBody">
            <tr><td colspan="6" style="text-align: center; padding: 30px;">جاري تحميل السجل...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnRefreshHistory')?.addEventListener('click', () => this.renderHistory());
    document.getElementById('btnClearHistory')?.addEventListener('click', async () => {
      if (confirm('هل أنت متأكد من رغبتك في حذف كامل سجل العمليات؟')) {
        await window.ipcClient.deleteHistory({ clearAll: true });
        this.showToast('تم مسح السجل بنجاح', 'success');
        this.renderHistory();
      }
    });

    const data = await window.ipcClient.getHistory({ limit: 100 });
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (!data.records || data.records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">لا توجد عمليات تحويل سابقة في السجل</td></tr>`;
      return;
    }

    tbody.innerHTML = data.records.map(rec => {
      const statusClass = `badge-${rec.status.toLowerCase()}`;
      return `
        <tr>
          <td title="${rec.original_path}"><strong>${rec.original_name}</strong></td>
          <td><span class="format-tag">${(rec.output_format || '').toUpperCase()}</span></td>
          <td>${rec.final_size > 0 ? this.formatBytes(rec.final_size) : '-'}</td>
          <td><span class="status-badge ${statusClass}">${rec.status}</span></td>
          <td>${new Date(rec.timestamp).toLocaleString('ar-SA')}</td>
          <td>
            ${rec.file_path ? `<button class="btn-small" onclick="window.ipcClient.openPath('${rec.file_path.replace(/\\/g, '\\\\')}', false)">فتح المجلد 📂</button>` : ''}
            <button class="btn-small btn-danger" onclick="uiController.deleteHistoryItem(${rec.id})">حذف</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async deleteHistoryItem(id) {
    await window.ipcClient.deleteHistory({ id });
    this.showToast('تم حذف السجل', 'info');
    this.renderHistory();
  },

  // --- تصيير شاشة الإعدادات Settings ---

  renderSettings(state) {
    const settingsView = this.elements.settingsView;
    if (!settingsView) return;

    settingsView.innerHTML = `
      <div class="settings-card">
        <h3>مسار الحفظ الافتراضي</h3>
        <p class="settings-desc">اختر المجلد الذي سيتم حفظ الملفات المحولة فيه تلقائياً</p>
        <div class="settings-row">
          <input type="text" id="settingOutputPath" class="input-text" readonly value="${state.outputFolder || 'مجلد الملف الأصلي نفسه'}" />
          <button id="btnBrowseOutputFolder" class="btn-primary">استعراض المجلد</button>
        </div>
      </div>

      <div class="settings-card">
        <h3>مواصفات المعالجة والتسريع</h3>
        <div class="settings-info-grid">
          <div class="info-box">
            <span class="info-label">المحول الذكي التلقائي</span>
            <span class="info-val text-success">مفعل (Auto-Detect Hub)</span>
          </div>
          <div class="info-box">
            <span class="info-label">تسريع GPU الرسومي</span>
            <span class="info-val text-success">مفعل (Hardware Acceleration)</span>
          </div>
          <div class="info-box">
            <span class="info-label">معالجة الفيديو المتزامنة</span>
            <span class="info-val">3 مهام كحد أقصى</span>
          </div>
          <div class="info-box">
            <span class="info-label">معالجة الصور والمستندات</span>
            <span class="info-val">متزامنة ومتعددة النوى</span>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>حول التطبيق</h3>
        <p><strong>Open-UniConverter</strong> — الإصدار v1.0.0</p>
        <p class="settings-desc">برمجية مفتوحة المصدر لتحويل الوسائط والمستندات بأعلى كفاءة وأمان، وتعمل بدون إنترنت 100%.</p>
      </div>
    `;

    document.getElementById('btnBrowseOutputFolder')?.addEventListener('click', async () => {
      const res = await window.ipcClient.selectFolder();
      if (!res.canceled && res.folder) {
        state.setOutputFolder(res.folder);
        if (this.elements.outputFolderText) {
          this.elements.outputFolderText.textContent = res.folder;
        }
        this.renderSettings(state);
        this.showToast('تم تحديث مسار الحفظ الافتراضي', 'success');
      }
    });
  },

  // --- محلل وقارئ ملفات الترجمة (SRT / VTT / ASS Parser) ---
  parseSubtitleContent(content) {
    if (!content || typeof content !== 'string') return [];
    const cues = [];
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const timeToSeconds = (tStr) => {
      if (!tStr) return 0;
      const clean = tStr.trim().replace(',', '.');
      const parts = clean.split(':');
      if (parts.length === 3) {
        return (parseFloat(parts[0]) * 3600) + (parseFloat(parts[1]) * 60) + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
      }
      return parseFloat(clean) || 0;
    };

    if (normalized.includes('[Events]') && normalized.includes('Dialogue:')) {
      const lines = normalized.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Dialogue:')) {
          const parts = trimmed.substring(9).split(',');
          if (parts.length >= 10) {
            const start = timeToSeconds(parts[1]);
            const end = timeToSeconds(parts[2]);
            let text = parts.slice(9).join(',').replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim();
            if (end > start && text) {
              cues.push({ start, end, text });
            }
          }
        }
      }
      return cues;
    }

    const blocks = normalized.split(/\n\s*\n/);
    const timeRegex = /((?:\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{2,3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{2,3})/;

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let timeIndex = -1;
      let match = null;

      for (let i = 0; i < lines.length; i++) {
        match = lines[i].match(timeRegex);
        if (match) {
          timeIndex = i;
          break;
        }
      }

      if (timeIndex !== -1 && match) {
        const start = timeToSeconds(match[1]);
        const end = timeToSeconds(match[2]);
        const textLines = lines.slice(timeIndex + 1)
          .filter(l => !l.startsWith('NOTE') && !l.startsWith('WEBVTT') && !l.startsWith('STYLE'))
          .map(l => l.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);

        const text = textLines.join('\n');
        if (end > start && text) {
          cues.push({ start, end, text });
        }
      }
    }

    return cues.sort((a, b) => a.start - b.start);
  },

  // --- نافذة الخيارات المتقدمة (Modal) مع أرقام قياسية وخيارات بت الصوت ---

  openAdvancedModal(task) {
    const modal = this.elements.advancedModal;
    const body = this.elements.modalBody;
    if (!modal || !body) return;

    this.currentEditingTaskId = task.taskId;
    modal.classList.add('open');

    const ext = (task.extension || '').toLowerCase().replace(/^\./, '');
    const isDoc = (task.type === 'document' || task.category === 'document' || ext === 'pdf' || ext === 'docx' || ext === 'doc');
    const isVideo = !isDoc && (task.type === 'video');
    const isAudio = !isDoc && (task.type === 'audio');
    const isImage = !isDoc && task.type.startsWith('image');

    let selectedRotate = (task.options && task.options.rotate) || 0;
    let flipH = Boolean(task.options && task.options.flipH);
    let flipV = Boolean(task.options && task.options.flipV);
    let selectedAspect = (task.options && (task.options.aspectRatio || task.options.aspectPreset)) || task.aspectPreset || 'source';
    let cropState = (task.options && task.options.crop) ? { ...task.options.crop } : null;
    let videoCropState = (isVideo && task.options && task.options.crop) ? { ...task.options.crop } : null;
    let fitMode = (task.options && task.options.fitMode) || task.fitMode || 'fit';
    let lockedRatio = 'free'; // 'free', '9:16', '16:9', '1:1'
    let currentSubMode = (task.options && task.options.subtitleMode) || 'soft';
    let externalSubPath = (task.options && (task.options.subtitlePath || task.options.subtitle)) || null;
    let subFontSizeVal = (task.options && (task.options.subtitleFontSize || task.options.fontSize)) || 24;
    let subPosVal = (task.options && (task.options.subtitlePosition || task.options.position)) || 'bottom';
    let docOrientationVal = (task.options && task.options.orientation) || 'portrait';

    const formatSecToHms = (sec) => {
      if (isNaN(sec) || sec < 0) sec = 0;
      const s = Math.floor(sec);
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const parseHmsToSec = (str) => {
      if (!str) return 0;
      const parts = String(str).trim().split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
      if (parts.length === 2) return (parts[0] * 60) + parts[1];
      if (parts.length === 1) return parts[0];
      return 0;
    };

    if (isDoc) {
      const pageSizeVal = (task.options && task.options.pageSize) || 'A4';
      const marginVal = (task.options && task.options.margin !== undefined) ? task.options.margin : 20;

      body.innerHTML = `
        <div class="modal-doc-options">
          <div class="form-group">
            <label>مقاس الصفحة المطبوعة (Page Size)</label>
            <select id="advDocPageSize" class="select-field">
              <option value="A4" ${pageSizeVal === 'A4' ? 'selected' : ''}>A4 قياسي (210 × 297 mm) - موصى به للطباعة</option>
              <option value="Letter" ${pageSizeVal === 'Letter' ? 'selected' : ''}>Letter أمريكي (8.5 × 11 in)</option>
              <option value="Legal" ${pageSizeVal === 'Legal' ? 'selected' : ''}>Legal مستند قانوني (8.5 × 14 in)</option>
              <option value="A3" ${pageSizeVal === 'A3' ? 'selected' : ''}>A3 حجم كبير (297 × 420 mm)</option>
              <option value="A5" ${pageSizeVal === 'A5' ? 'selected' : ''}>A5 حجم صغير (148 × 210 mm)</option>
            </select>
          </div>

          <div class="form-group">
            <label>هوامش الصفحة (Margins)</label>
            <select id="advDocMargin" class="select-field">
              <option value="20" ${marginVal === 20 ? 'selected' : ''}>هوامش قياسية متوازنة (20 mm)</option>
              <option value="10" ${marginVal === 10 ? 'selected' : ''}>هوامش ضيقة للمحتوى المكثف (10 mm)</option>
              <option value="30" ${marginVal === 30 ? 'selected' : ''}>هوامش عريضة رسمية (30 mm)</option>
              <option value="0" ${marginVal === 0 ? 'selected' : ''}>بدون هوامش (0 mm)</option>
            </select>
          </div>

          <div class="form-group">
            <label>توجيه المستند (Orientation)</label>
            <div class="action-btn-group">
              <button type="button" class="btn-pill ${docOrientationVal === 'portrait' ? 'active' : ''}" id="btnDocPortrait" data-orientation="portrait">عمودي (Portrait)</button>
              <button type="button" class="btn-pill ${docOrientationVal === 'landscape' ? 'active' : ''}" id="btnDocLandscape" data-orientation="landscape">أفقي (Landscape)</button>
            </div>
          </div>
        </div>
      `;

      const btnPortrait = document.getElementById('btnDocPortrait');
      const btnLandscape = document.getElementById('btnDocLandscape');
      if (btnPortrait && btnLandscape) {
        btnPortrait.addEventListener('click', () => {
          docOrientationVal = 'portrait';
          btnPortrait.classList.add('active');
          btnLandscape.classList.remove('active');
        });
        btnLandscape.addEventListener('click', () => {
          docOrientationVal = 'landscape';
          btnLandscape.classList.add('active');
          btnPortrait.classList.remove('active');
        });
      }
    } else if (isVideo) {
      const crfVal = task.options.crf !== undefined ? task.options.crf : 23;
      const audioBitrateVal = task.options.audioBitrate || '192k';
      let videoFps = (task.metadata && task.metadata.fps) || 24;
      let realDuration = task.duration || task.meta?.duration || (task.metadata && task.metadata.duration) || 0;
      let customWidthVal = (task.options && (task.options.customWidth || task.options.width)) || (task.dimensions && task.dimensions.width) || 1920;
      let customHeightVal = (task.options && (task.options.customHeight || task.options.height)) || (task.dimensions && task.dimensions.height) || 1080;
      customWidthVal = Math.max(16, customWidthVal - (customWidthVal % 2));
      customHeightVal = Math.max(16, customHeightVal - (customHeightVal % 2));
      let lockVideoRatio = true;
      let videoAspectRatioValue = (customHeightVal > 0) ? (customWidthVal / customHeightVal) : (16 / 9);

      if (videoCropState && (videoCropState.width || videoCropState.cropW)) {
        selectedAspect = 'free-crop';
      }

      // حساب التوقيت الابتدائي للاقتطاع
      let initialTrimStart = 0;
      let initialTrimEnd = realDuration || 0;
      if (task.options) {
        if (task.options.startSec !== undefined) {
          initialTrimStart = Number(task.options.startSec);
        } else if (task.options.trim && (task.options.trim.start !== undefined || task.options.trim.startSec !== undefined)) {
          initialTrimStart = Number(task.options.trim.start ?? task.options.trim.startSec);
        }
        if (task.options.endSec !== undefined) {
          initialTrimEnd = Number(task.options.endSec);
        } else if (task.options.trim && (task.options.trim.end !== undefined || task.options.trim.endSec !== undefined)) {
          initialTrimEnd = Number(task.options.trim.end ?? task.options.trim.endSec);
        }
      }

      body.innerHTML = `
        <!-- مساحة معاينة الفيديو الحية ونسب الأبعاد الهندسية -->
        <div class="video-preview-wrapper" id="advVideoPreviewBox">
          <div class="video-preview-canvas">
            <div class="video-preview-frame" id="advVideoPreviewFrame">
              <video id="advVideoPlayer" src="media-stream://stream?path=${encodeURIComponent(task.filePath)}" autoplay muted playsinline></video>
              <div class="video-aspect-indicator" id="advVideoAspectIndicator">أصلي (Same as Source)</div>
              <!-- طبقة المعاينة الحية للترجمة المحروقة فوق الفيديو -->
              <div id="advSubtitlePreviewOverlay" class="subtitle-overlay" style="display: none;">هذا نموذج لمعاينة حجم ومكان الترجمة</div>

              <!-- إطار الاقتصاص المكاني الحر التفاعلي للفيديو -->
              <div class="crop-box" id="cropBoxVideo" style="display: ${selectedAspect === 'free-crop' ? 'block' : 'none'};">
                <div class="crop-grid-h1"></div>
                <div class="crop-grid-h2"></div>
                <div class="crop-grid-v1"></div>
                <div class="crop-grid-v2"></div>
                <div class="crop-dimension-badge" id="cropDimBadgeVideo">0 × 0 px</div>
                <!-- مقابض الزوايا البيضاء الفاخرة Corner Brackets -->
                <div class="crop-handle handle-nw" data-handle="nw"></div>
                <div class="crop-handle handle-ne" data-handle="ne"></div>
                <div class="crop-handle handle-se" data-handle="se"></div>
                <div class="crop-handle handle-sw" data-handle="sw"></div>
                <!-- مقابض الحواف الأربعة Edge Handles -->
                <div class="crop-handle handle-n" data-handle="n"></div>
                <div class="crop-handle handle-s" data-handle="s"></div>
                <div class="crop-handle handle-e" data-handle="e"></div>
                <div class="crop-handle handle-w" data-handle="w"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- شريط التحكم التفاعلي والتايم لاين للمعاينة -->
        <div class="video-player-controls" id="advVideoControlsBox">
          <!-- السطر الأول: التايم لاين وعرض الوقت -->
          <div class="timeline-row">
            <div class="timeline-slider-wrapper">
              <input type="range" id="advVideoTimeline" min="0" max="${realDuration > 0 ? realDuration : 100}" value="0" step="0.04" class="video-timeline-slider" title="شريط التمرير الزمني">
            </div>
            <div id="advVideoTimeDisplay" class="video-time-display">00:00:00 / ${formatSecToHms(realDuration)}</div>
          </div>
          <!-- السطر الثاني: شريط أزرار التحكم المتناسق -->
          <div class="controls-button-row" id="advVideoControls">
            <button type="button" class="btn-player-ctrl btn-seek" id="advBtnNextFrame" title="إطار تالٍ">إطار تالٍ ⏭️</button>
            <button type="button" class="btn-player-ctrl btn-seek" id="advBtnSeekForward" title="تقديم 5 ثوانٍ">+5s ⏩</button>
            <button type="button" class="btn-player-ctrl btn-play-main" id="advBtnPlayPause" title="تشغيل / إيقاف مؤقت">▶</button>
            <button type="button" class="btn-player-ctrl btn-seek" id="advBtnSeekBack" title="رجوع 5 ثوانٍ">⏪ -5s</button>
            <button type="button" class="btn-player-ctrl btn-seek" id="advBtnPrevFrame" title="إطار سابق">⏮️ إطار سابق</button>
          </div>
        </div>

        <div class="form-group">
          <label>نسبة أبعاد الشاشة وملاءمة المنصة (Aspect Ratio Preset)</label>
          <div class="action-btn-group" id="advVideoAspectGroup">
            <button type="button" class="btn-pill ${selectedAspect === 'source' ? 'active' : ''}" data-aspect="source">أصلي (Same as Source)</button>
            <button type="button" class="btn-pill ${selectedAspect === '16:9' ? 'active' : ''}" data-aspect="16:9">🎬 16:9 يوتيوب وأفقي</button>
            <button type="button" class="btn-pill ${selectedAspect === '9:16' ? 'active' : ''}" data-aspect="9:16">📱 9:16 تيك توك و Shorts</button>
            <button type="button" class="btn-pill ${selectedAspect === '1:1' ? 'active' : ''}" data-aspect="1:1">⏹️ 1:1 انستغرام مربع</button>
            <button type="button" class="btn-pill ${selectedAspect === '4:3' ? 'active' : ''}" data-aspect="4:3">📺 4:3 كلاسيكي</button>
            <button type="button" class="btn-pill ${selectedAspect === 'custom' ? 'active' : ''}" data-aspect="custom" id="btnVideoCustomDims">📐 أبعاد مخصصة (Custom Dimensions)</button>
            <button type="button" class="btn-pill ${selectedAspect === 'free-crop' ? 'active' : ''}" data-aspect="free-crop" id="btnVideoFreeCrop">✂️ قص حر (Free Crop)</button>
          </div>

          <!-- مفتاح تبديل نمط الإطار (Fit vs Fill Mode) لنسب الأبعاد القياسية -->
          <div class="fit-mode-toggle-group" id="advVideoFitModeGroup" style="display: ${(['16:9', '9:16', '1:1', '4:3'].includes(selectedAspect)) ? 'flex' : 'none'};">
            <span class="fit-mode-label">نمط معالجة الإطار:</span>
            <div class="btn-toggle-pair">
              <button type="button" class="btn-toggle-option ${fitMode === 'fit' ? 'active' : ''}" data-fit="fit" id="btnFitLetterbox">⬛ حواف سوداء (Fit / Letterbox)</button>
              <button type="button" class="btn-toggle-option ${fitMode === 'fill' ? 'active' : ''}" data-fit="fill" id="btnFillCrop">✂️ ملء الشاشة وقص الأطراف (Fill / Crop)</button>
            </div>
          </div>

          <!-- لوحة إدخال الأبعاد المخصصة اليدوية للفيديو -->
          <div class="video-custom-dims-group" id="advVideoCustomDimsGroup" style="display: ${selectedAspect === 'custom' ? 'flex' : 'none'}; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px; color: var(--text-secondary);">العرض (W):</span>
              <input type="number" id="advVideoCustomWidth" class="input-text-sm" style="width: 90px; text-align: center;" value="${customWidthVal}" min="16" step="2" />
              <span style="color: var(--text-muted); font-size: 12px;">px</span>
            </div>
            <button type="button" id="btnLockVideoRatio" class="btn-secondary btn-sm ${lockVideoRatio ? 'active' : ''}" style="font-size: 12px; padding: 4px 10px;" title="قفل نسبة الأبعاد الحالية">🔒 حفظ النسبة</button>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px; color: var(--text-secondary);">الارتفاع (H):</span>
              <input type="number" id="advVideoCustomHeight" class="input-text-sm" style="width: 90px; text-align: center;" value="${customHeightVal}" min="16" step="2" />
              <span style="color: var(--text-muted); font-size: 12px;">px</span>
            </div>
          </div>

          <!-- أزرار قفل النسبة السريعة عند اختيار القص الحر (Smart Crop & Ratio Snapping) -->
          <div class="crop-lock-ratio-group" id="advCropLockRatioGroup" style="display: ${selectedAspect === 'free-crop' ? 'flex' : 'none'};">
            <span class="crop-lock-label">قفل أبعاد الإطار:</span>
            <div class="action-btn-group-sm">
              <button type="button" class="btn-pill-sm ${lockedRatio === 'free' ? 'active' : ''}" data-lock="free" id="btnLockFree">🔓 حر بالكامل</button>
              <button type="button" class="btn-pill-sm ${lockedRatio === '9:16' ? 'active' : ''}" data-lock="9:16" id="btnLockShorts">📱 9:16 شورتس</button>
              <button type="button" class="btn-pill-sm ${lockedRatio === '16:9' ? 'active' : ''}" data-lock="16:9" id="btnLockYT">🎬 16:9 يوتيوب</button>
              <button type="button" class="btn-pill-sm ${lockedRatio === '1:1' ? 'active' : ''}" data-lock="1:1" id="btnLockSquare">⏹️ 1:1 مربع</button>
            </div>
          </div>

          <button type="button" id="btnResetVideoCrop" class="btn-secondary btn-sm" style="display: ${selectedAspect === 'free-crop' ? 'inline-flex' : 'none'}; align-items: center; gap: 4px; margin-top: 6px;">↺ إعادة تعيين مساحة القص</button>
        </div>

        <div class="dimension-preview-box">
          <span>الأبعاد والدقة الناتجة المقدرة:</span>
          <strong id="advVideoDimPreview">1920 × 1080 px</strong>
        </div>

        <!-- التقطيع الزمني الدقيق للمدة (Video Duration Trimming) -->
        <div class="form-group video-trim-section">
          <label>التقطيع الزمني الدقيق للمدة (Video Duration Trimming)</label>
          <div class="trim-controls-row">
            <div class="trim-field">
              <span class="trim-label">وقت البداية (Start):</span>
              <div class="trim-input-group">
                <input type="text" id="advTrimStart" class="trim-time-input" value="${formatSecToHms(initialTrimStart)}" placeholder="00:00:00" />
                <button type="button" id="btnTrimCurrentStart" class="btn-secondary btn-sm trim-btn-curr" title="أخذ موضع المشغل الحالي لبدء المقطع">📌 الوقت الحالي</button>
              </div>
            </div>

            <div class="trim-field">
              <span class="trim-label">وقت النهاية (End):</span>
              <div class="trim-input-group">
                <input type="text" id="advTrimEnd" class="trim-time-input" value="${formatSecToHms(initialTrimEnd)}" placeholder="00:00:00" />
                <button type="button" id="btnTrimCurrentEnd" class="btn-secondary btn-sm trim-btn-curr" title="أخذ موضع المشغل الحالي لنهاية المقطع">📌 الوقت الحالي</button>
              </div>
            </div>
          </div>

          <div class="trim-summary-badge" id="advTrimSummaryBadge">
            المدة الناتجة المستهدفة: <strong id="advTrimDurationText">${this.formatDuration(Math.max(0, initialTrimEnd - initialTrimStart)) || '00:00'}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>معيار جودة الفيديو (CRF: 16 الأفضل جودة إلى 28 الأقل حجماً)</label>
          <div class="slider-row">
            <input type="range" id="advCrf" min="16" max="28" value="${crfVal}" />
            <span id="crfVal" class="slider-num">${crfVal}</span>
          </div>
        </div>

        <div class="form-group">
          <label>ترميز الفيديو (Video Codec)</label>
          <select id="advVideoCodec" class="input-select">
            <option value="libx264" ${task.options.videoCodec === 'libx264' ? 'selected' : ''}>H.264 (الأعلى توافقاً - x264)</option>
            <option value="libx265" ${task.options.videoCodec === 'libx265' ? 'selected' : ''}>H.265 / HEVC (أعلى ضغطاً - x265)</option>
          </select>
        </div>

        <div class="form-group">
          <label>الدقة المستهدفة (Resolution)</label>
          <select id="advResolution" class="input-select">
            <option value="source" ${task.options.resolution === 'source' ? 'selected' : ''}>الدقة الأصلية (Same as Source)</option>
            <option value="4k" ${task.options.resolution === '4k' ? 'selected' : ''}>4K Ultra HD (3840×2160)</option>
            <option value="1080p" ${task.options.resolution === '1080p' ? 'selected' : ''}>Full HD 1080p (1920×1080)</option>
            <option value="720p" ${task.options.resolution === '720p' ? 'selected' : ''}>HD 720p (1280×720)</option>
            <option value="480p" ${task.options.resolution === '480p' ? 'selected' : ''}>SD 480p (854×480)</option>
          </select>
        </div>

        <div class="form-group">
          <label>معدل بت الصوت المصاحب للفيديو (Audio Bitrate)</label>
          <select id="advAudioBitrate" class="input-select">
            <option value="320k" ${audioBitrateVal === '320k' ? 'selected' : ''}>320 kbps (نقاء استوديو فائق)</option>
            <option value="256k" ${audioBitrateVal === '256k' ? 'selected' : ''}>256 kbps (جودة فائقة)</option>
            <option value="192k" ${audioBitrateVal === '192k' ? 'selected' : ''}>192 kbps (قياسي متوازن)</option>
            <option value="128k" ${audioBitrateVal === '128k' ? 'selected' : ''}>128 kbps (اقتصادي)</option>
            <option value="96k" ${audioBitrateVal === '96k' ? 'selected' : ''}>96 kbps (حجم صغير)</option>
          </select>
        </div>

        <!-- تعدد مسارات الصوت وترجمات الفيديو المدمجة والخارجية -->
        <div class="form-group" id="advAudioTrackGroup">
          <label>مسار الصوت المختار (Audio Track)</label>
          <select id="advAudioTrack" class="input-select">
            <option value="0">المسار 1 (افتراضي)</option>
          </select>
        </div>

        <div class="form-group" id="advSubtitleTrackGroup">
          <label>مسار الترجمة (Subtitle Track)</label>
          <div class="subtitle-track-row" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="advSubtitleTrack" class="input-select select-field" style="flex: 1; min-width: 220px;">
              <option value="none">بدون ترجمة مدمجة (None)</option>
            </select>
            <button type="button" id="btnImportSubtitle" class="btn-secondary btn-sm" title="استيراد ملف ترجمة خارجي بتنسيق SRT أو ASS أو VTT">
              ➕ استيراد ترجمة خارجية (.srt, .ass, .vtt)
            </button>
          </div>

          <!-- شارة ملف الترجمة الخارجي المستورد -->
          <div id="advSelectedSubBadge" class="selected-sub-badge" style="display: ${externalSubPath ? 'inline-flex' : 'none'}; margin-top: 8px;">
            <span class="sub-badge-icon">📄</span>
            <span id="advSelectedSubName" class="sub-badge-name">${externalSubPath ? externalSubPath.split(/[\\/]/).pop() : ''}</span>
            <button type="button" id="btnClearSubtitle" class="btn-clear-sub" title="إلغاء واستبعاد ملف الترجمة">✕</button>
          </div>
        </div>

        <div class="form-group" id="advSubtitleModeGroup" style="display: ${(externalSubPath || (task.options && task.options.subtitleTrackIndex && task.options.subtitleTrackIndex !== 'none')) ? 'block' : 'none'};">
          <label>طريقة معالجة الترجمة (Subtitle Mode)</label>
          <div class="btn-toggle-pair">
            <button type="button" class="btn-toggle-option ${currentSubMode === 'soft' ? 'active' : ''}" data-submode="soft" id="btnSubModeSoft">🔘 ترجمة مدمجة قابلة للإيقاف والتشغيل (Soft Subtitle)</button>
            <button type="button" class="btn-toggle-option ${currentSubMode === 'burn' ? 'active' : ''}" data-submode="burn" id="btnSubModeBurn">🔥 حرق الترجمة داخل كادر الفيديو (Hardcode / Burn-in)</button>
          </div>
        </div>

        <!-- لوحة تنسيق مظهر الترجمة المحروقة (Subtitle Style Controls) -->
        <div class="subtitle-style-panel" id="advSubtitleStylePanel" style="display: ${currentSubMode === 'burn' && (externalSubPath || (task.options && task.options.subtitleTrackIndex && task.options.subtitleTrackIndex !== 'none')) ? 'block' : 'none'};">
          <div class="form-group">
            <label>حجم خط الترجمة المحروقة (Font Size: 14 إلى 40)</label>
            <div class="slider-row">
              <input type="range" id="advSubFontSize" min="14" max="40" value="${subFontSizeVal}" />
              <span id="subFontSizeVal" class="slider-num">${subFontSizeVal}px</span>
            </div>
          </div>

          <div class="form-group">
            <label>موضع ومحاذاة الترجمة الرأسية (Vertical Alignment / Margin)</label>
            <select id="advSubPosition" class="input-select">
              <option value="bottom" ${subPosVal === 'bottom' ? 'selected' : ''}>أسفل الكادر (Bottom)</option>
              <option value="top" ${subPosVal === 'top' ? 'selected' : ''}>أعلى الكادر (Top)</option>
              <option value="center" ${subPosVal === 'center' ? 'selected' : ''}>المنتصف (Center)</option>
            </select>
          </div>
        </div>

        <!-- موازنة الصوت الذكية وسرعة العرض ومزامنة النبرة -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="advLoudnorm" ${task.options && task.options.loudnorm ? 'checked' : ''} />
            <span>🔊 موازنة ورفع الصوت الذكي (Smart Audio Normalization - loudnorm)</span>
          </label>
        </div>

        <div class="form-group">
          <label>⚡ سرعة العرض ومزامنة النبرة (Playback Speed)</label>
          <select id="advPlaybackSpeed" class="input-select">
            <option value="1" ${(!task.options?.playbackSpeed || task.options.playbackSpeed === 1) ? 'selected' : ''}>1.0x (السرعة الطبيعية)</option>
            <option value="0.5" ${task.options?.playbackSpeed === 0.5 ? 'selected' : ''}>0.5x (حركة بطيئة للنصف)</option>
            <option value="0.75" ${task.options?.playbackSpeed === 0.75 ? 'selected' : ''}>0.75x (حركة بطيئة 0.75x)</option>
            <option value="1.25" ${task.options?.playbackSpeed === 1.25 ? 'selected' : ''}>1.25x (تسريع خفيف 1.25x)</option>
            <option value="1.5" ${task.options?.playbackSpeed === 1.5 ? 'selected' : ''}>1.5x (تسريع 1.5x)</option>
            <option value="2" ${task.options?.playbackSpeed === 2 ? 'selected' : ''}>2.0x (ضعف السرعة 2x)</option>
          </select>
        </div>

        <!-- عينة المعاينة السريعة 10 ثوانٍ -->
        <div class="form-group sample-render-row" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.12);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <button type="button" id="btnSampleRender" class="btn-sample-render" title="اقتطاع 10 ثوانٍ فقط من منتصف الفيديو وتطبيق الإعدادات لمعاينة النتيجة">
              <span>⏱️ تجربة عينة 10 ثوانٍ</span>
            </button>
            <span style="font-size: 0.8rem; color: #8b949e;">معاينة سريعة لجودة الصورة ومزامنة الصوت والترجمة قبل الرندر الكامل</span>
          </div>
        </div>
      `;

      let vNaturalW = (task.dimensions && task.dimensions.width) || 1920;
      let vNaturalH = (task.dimensions && task.dimensions.height) || 1080;
      let vCropRect = { x: 0, y: 0, w: 0, h: 0 };

      const frameEl = document.getElementById('advVideoPreviewFrame');
      const indicatorEl = document.getElementById('advVideoAspectIndicator');
      const dimPreviewEl = document.getElementById('advVideoDimPreview');
      const cropBoxVideoEl = document.getElementById('cropBoxVideo');
      const cropDimBadgeVideoEl = document.getElementById('cropDimBadgeVideo');
      const btnResetVideoCropEl = document.getElementById('btnResetVideoCrop');
      const playerEl = document.getElementById('advVideoPlayer');

      const renderVideoCropBox = () => {
        if (!cropBoxVideoEl || !cropDimBadgeVideoEl || !frameEl) return;
        const curFrameW = frameEl.offsetWidth || 340;
        const curFrameH = frameEl.offsetHeight || 170;

        if (vCropRect.w <= 0 || vCropRect.h <= 0) {
          if (videoCropState && videoCropState.width && videoCropState.height) {
            const sX = (vNaturalW > 0) ? (curFrameW / vNaturalW) : 1;
            const sY = (vNaturalH > 0) ? (curFrameH / vNaturalH) : 1;
            vCropRect = {
              x: (videoCropState.x || 0) * sX,
              y: (videoCropState.y || 0) * sY,
              w: (videoCropState.width) * sX,
              h: (videoCropState.height) * sY
            };
          } else {
            vCropRect = { x: 0, y: 0, w: curFrameW, h: curFrameH };
          }
        }

        cropBoxVideoEl.style.left = `${Math.round(vCropRect.x)}px`;
        cropBoxVideoEl.style.top = `${Math.round(vCropRect.y)}px`;
        cropBoxVideoEl.style.width = `${Math.round(vCropRect.w)}px`;
        cropBoxVideoEl.style.height = `${Math.round(vCropRect.h)}px`;

        const sX = (curFrameW > 0) ? (vNaturalW / curFrameW) : 1;
        const sY = (curFrameH > 0) ? (vNaturalH / curFrameH) : 1;

        let calcW = Math.round(vCropRect.w * sX);
        let calcH = Math.round(vCropRect.h * sY);
        let calcX = Math.round(vCropRect.x * sX);
        let calcY = Math.round(vCropRect.y * sY);

        calcW = Math.max(16, calcW - (calcW % 2));
        calcH = Math.max(16, calcH - (calcH % 2));
        calcX = Math.max(0, calcX - (calcX % 2));
        calcY = Math.max(0, calcY - (calcY % 2));

        videoCropState = {
          x: calcX,
          y: calcY,
          width: calcW,
          height: calcH,
          cropX: calcX,
          cropY: calcY,
          cropW: calcW,
          cropH: calcH
        };

        // احتساب النسبة الحالية ومؤشر الشورتس الذكي
        const r = (calcH > 0) ? (calcW / calcH) : 1;
        let snapBadge = '';
        if (Math.abs(r - (9 / 16)) <= 0.04) {
          snapBadge = ' (📱 متطابق مع Shorts/TikTok)';
        } else if (Math.abs(r - (16 / 9)) <= 0.05) {
          snapBadge = ' (🎬 متطابق مع YouTube)';
        } else if (Math.abs(r - 1.0) <= 0.04) {
          snapBadge = ' (⏹️ متطابق مع 1:1 مربع)';
        }

        cropDimBadgeVideoEl.textContent = `${calcW} × ${calcH} px${snapBadge}`;
        if (dimPreviewEl && selectedAspect === 'free-crop') {
          dimPreviewEl.textContent = `${calcW} × ${calcH} px (قص حر)${snapBadge}`;
        }
      };

      const snapCropToRatio = (targetRatio) => {
        if (!frameEl) return;
        const curFrameW = frameEl.offsetWidth || 340;
        const curFrameH = frameEl.offsetHeight || 170;
        if (curFrameW <= 0 || curFrameH <= 0) return;

        let boxW, boxH;
        if ((curFrameW / curFrameH) > targetRatio) {
          boxH = Math.round(curFrameH * 0.95);
          boxW = Math.round(boxH * targetRatio);
        } else {
          boxW = Math.round(curFrameW * 0.95);
          boxH = Math.round(boxW / targetRatio);
        }

        const boxX = Math.round((curFrameW - boxW) / 2);
        const boxY = Math.round((curFrameH - boxH) / 2);

        vCropRect = {
          x: Math.max(0, boxX),
          y: Math.max(0, boxY),
          w: boxW,
          h: boxH
        };
        renderVideoCropBox();
      };

      const updateVideoGeometry = () => {
        const resSelect = document.getElementById('advResolution');
        const currentRes = resSelect ? resSelect.value : (task.options?.resolution || 'source');

        const maxH = 170;
        const maxW = 340;
        let ratio = 16 / 9;
        let label = 'أصلي (Same as Source)';

        if (selectedAspect === 'free-crop') {
          if (task.dimensions?.width && task.dimensions?.height) {
            ratio = task.dimensions.width / task.dimensions.height;
          } else {
            ratio = 16 / 9;
          }
          label = '✂️ قص حر (Free Crop)';
        } else if (selectedAspect === '16:9') {
          ratio = 16 / 9;
          label = (fitMode === 'fill') ? '🎬 16:9 يوتيوب (ملء وقص Fill)' : '🎬 16:9 يوتيوب (حواف سوداء Fit)';
        } else if (selectedAspect === '9:16') {
          ratio = 9 / 16;
          label = (fitMode === 'fill') ? '📱 9:16 تيك توك و Shorts (ملء وقص Fill)' : '📱 9:16 تيك توك و Shorts (حواف سوداء Fit)';
        } else if (selectedAspect === '1:1') {
          ratio = 1;
          label = (fitMode === 'fill') ? '⏹️ 1:1 انستغرام مربع (ملء وقص Fill)' : '⏹️ 1:1 انستغرام مربع (حواف سوداء Fit)';
        } else if (selectedAspect === '4:3') {
          ratio = 4 / 3;
          label = (fitMode === 'fill') ? '📺 4:3 كلاسيكي (ملء وقص Fill)' : '📺 4:3 كلاسيكي (حواف سوداء Fit)';
        } else if (selectedAspect === 'custom') {
          const wInput = document.getElementById('advVideoCustomWidth');
          const hInput = document.getElementById('advVideoCustomHeight');
          let cw = wInput ? parseInt(wInput.value, 10) : customWidthVal;
          let ch = hInput ? parseInt(hInput.value, 10) : customHeightVal;
          if (!cw || isNaN(cw) || cw < 16) cw = 1920;
          if (!ch || isNaN(ch) || ch < 16) ch = 1080;
          cw = Math.max(16, cw - (cw % 2));
          ch = Math.max(16, ch - (ch % 2));
          ratio = cw / ch;
          label = `📐 أبعاد مخصصة (${cw}×${ch})`;
        } else if (selectedAspect === 'source') {
          if (task.dimensions?.width && task.dimensions?.height) {
            ratio = task.dimensions.width / task.dimensions.height;
            label = `أصلي (${task.dimensions.width}×${task.dimensions.height})`;
          } else {
            ratio = 16 / 9;
            label = 'أصلي (Same as Source)';
          }
        }

        let w = maxH * ratio;
        let h = maxH;
        if (w > maxW) {
          w = maxW;
          h = w / ratio;
        }
        if (frameEl) {
          frameEl.style.width = `${Math.round(w)}px`;
          frameEl.style.height = `${Math.round(h)}px`;
        }
        if (indicatorEl) {
          indicatorEl.textContent = label;
        }

        if (playerEl) {
          if (selectedAspect === 'free-crop' || selectedAspect === 'source' || selectedAspect === 'custom') {
            playerEl.style.objectFit = 'contain';
          } else {
            playerEl.style.objectFit = (fitMode === 'fill') ? 'cover' : 'contain';
          }
        }

        const fitModeGroup = document.getElementById('advVideoFitModeGroup');
        const cropLockGroup = document.getElementById('advCropLockRatioGroup');
        const customDimsGroup = document.getElementById('advVideoCustomDimsGroup');
        const isStandardAspect = ['16:9', '9:16', '1:1', '4:3'].includes(selectedAspect);
        if (fitModeGroup) fitModeGroup.style.display = isStandardAspect ? 'flex' : 'none';
        if (cropLockGroup) cropLockGroup.style.display = (selectedAspect === 'free-crop') ? 'flex' : 'none';
        if (customDimsGroup) customDimsGroup.style.display = (selectedAspect === 'custom') ? 'flex' : 'none';

        if (cropBoxVideoEl && btnResetVideoCropEl) {
          if (selectedAspect === 'free-crop') {
            cropBoxVideoEl.style.display = 'block';
            btnResetVideoCropEl.style.display = 'inline-flex';
            setTimeout(renderVideoCropBox, 50);
          } else {
            cropBoxVideoEl.style.display = 'none';
            btnResetVideoCropEl.style.display = 'none';
          }
        }

        const ASPECT_DIMS = {
          '16:9': { '4k': '3840 × 2160', '1080p': '1920 × 1080', '720p': '1280 × 720', '480p': '854 × 480' },
          '9:16': { '4k': '2160 × 3840', '1080p': '1080 × 1920', '720p': '720 × 1280', '480p': '480 × 854' },
          '1:1':  { '4k': '2160 × 2160', '1080p': '1080 × 1080', '720p': '720 × 720', '480p': '480 × 480' },
          '4:3':  { '4k': '2880 × 2160', '1080p': '1440 × 1080', '720p': '960 × 720', '480p': '640 × 480' }
        };

        if (dimPreviewEl) {
          if (selectedAspect === 'free-crop') {
            if (videoCropState && videoCropState.width) {
              const r = (videoCropState.height > 0) ? (videoCropState.width / videoCropState.height) : 1;
              let snapNote = '';
              if (Math.abs(r - (9 / 16)) <= 0.04) snapNote = ' (📱 متطابق مع Shorts/TikTok)';
              else if (Math.abs(r - (16 / 9)) <= 0.05) snapNote = ' (🎬 متطابق مع YouTube)';
              else if (Math.abs(r - 1.0) <= 0.04) snapNote = ' (⏹️ متطابق مع 1:1 مربع)';
              dimPreviewEl.textContent = `${videoCropState.width} × ${videoCropState.height} px (قص حر)${snapNote}`;
            } else {
              dimPreviewEl.textContent = 'تحديد مساحة القص بالماوس';
            }
          } else if (selectedAspect === 'custom') {
            const wInput = document.getElementById('advVideoCustomWidth');
            const hInput = document.getElementById('advVideoCustomHeight');
            let cw = wInput ? parseInt(wInput.value, 10) : customWidthVal;
            let ch = hInput ? parseInt(hInput.value, 10) : customHeightVal;
            cw = Math.max(16, cw - (cw % 2));
            ch = Math.max(16, ch - (ch % 2));
            dimPreviewEl.textContent = `${cw} × ${ch} px (أبعاد مخصصة)`;
          } else if (selectedAspect && selectedAspect !== 'source' && ASPECT_DIMS[selectedAspect]) {
            const resKey = (currentRes === 'source') ? '1080p' : currentRes;
            const dimStr = ASPECT_DIMS[selectedAspect][resKey] || '1920 × 1080';
            const modeText = (fitMode === 'fill') ? 'ملء وقص Fill' : 'حواف سوداء Fit';
            dimPreviewEl.textContent = `${dimStr} px (${selectedAspect} · ${modeText})`;
          } else if (currentRes === 'source') {
            if (task.dimensions?.width && task.dimensions?.height) {
              dimPreviewEl.textContent = `${task.dimensions.width} × ${task.dimensions.height} px (أصلي)`;
            } else {
              dimPreviewEl.textContent = 'الدقة الأصلية (Same as Source)';
            }
          } else {
            const STD = {
              '4k': '3840 × 2160',
              '1080p': '1920 × 1080',
              '720p': '1280 × 720',
              '480p': '854 × 480'
            };
            dimPreviewEl.textContent = `${STD[currentRes] || '1920 × 1080'} px`;
          }
        }
      };

      updateVideoGeometry();

      if (playerEl) {
        playerEl.addEventListener('loadedmetadata', () => {
          if (playerEl.videoWidth) vNaturalW = playerEl.videoWidth;
          if (playerEl.videoHeight) vNaturalH = playerEl.videoHeight;
          if (selectedAspect === 'free-crop') renderVideoCropBox();
        });
      }

      // أحداث السحب والتحجيم التفاعلي لمربع قص الفيديو
      if (cropBoxVideoEl) {
        const MIN_BOX = 16;
        let activeHandle = null;
        let startPos = { x: 0, y: 0 };
        let startRect = { x: 0, y: 0, w: 0, h: 0 };

        const getPointer = (e) => {
          if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          return { x: e.clientX, y: e.clientY };
        };

        const onPointerMove = (e) => {
          if (!activeHandle) return;
          if (e.cancelable) e.preventDefault();
          const p = getPointer(e);
          const dx = p.x - startPos.x;
          const dy = p.y - startPos.y;
          const rW = frameEl ? (frameEl.offsetWidth || 340) : 340;
          const rH = frameEl ? (frameEl.offsetHeight || 170) : 170;

          if (activeHandle === 'move') {
            const minX = -startRect.x;
            const maxX = rW - (startRect.x + startRect.w);
            const minY = -startRect.y;
            const maxY = rH - (startRect.y + startRect.h);
            vCropRect.x = startRect.x + Math.max(minX, Math.min(dx, maxX));
            vCropRect.y = startRect.y + Math.max(minY, Math.min(dy, maxY));
          } else {
            let targetRatio = null;
            if (lockedRatio === '9:16') targetRatio = 9 / 16;
            else if (lockedRatio === '16:9') targetRatio = 16 / 9;
            else if (lockedRatio === '1:1') targetRatio = 1;

            if (targetRatio) {
              switch (activeHandle) {
                case 'se': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  let newH = newW / targetRatio;
                  if (startRect.y + newH > rH) {
                    newH = rH - startRect.y;
                    newW = newH * targetRatio;
                  }
                  vCropRect.w = newW;
                  vCropRect.h = newH;
                  break;
                }
                case 'sw': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w - dx, startRect.x + startRect.w));
                  let newH = newW / targetRatio;
                  if (startRect.y + newH > rH) {
                    newH = rH - startRect.y;
                    newW = newH * targetRatio;
                  }
                  vCropRect.x = startRect.x + (startRect.w - newW);
                  vCropRect.w = newW;
                  vCropRect.h = newH;
                  break;
                }
                case 'ne': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  let newH = newW / targetRatio;
                  if (newH > startRect.y + startRect.h) {
                    newH = startRect.y + startRect.h;
                    newW = newH * targetRatio;
                  }
                  vCropRect.y = startRect.y + (startRect.h - newH);
                  vCropRect.w = newW;
                  vCropRect.h = newH;
                  break;
                }
                case 'nw': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w - dx, startRect.x + startRect.w));
                  let newH = newW / targetRatio;
                  if (newH > startRect.y + startRect.h) {
                    newH = startRect.y + startRect.h;
                    newW = newH * targetRatio;
                  }
                  vCropRect.x = startRect.x + (startRect.w - newW);
                  vCropRect.y = startRect.y + (startRect.h - newH);
                  vCropRect.w = newW;
                  vCropRect.h = newH;
                  break;
                }
                case 'e': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  let newH = newW / targetRatio;
                  if (newH <= rH) {
                    vCropRect.w = newW;
                    vCropRect.h = newH;
                    vCropRect.y = Math.max(0, Math.min(rH - newH, startRect.y + (startRect.h - newH) / 2));
                  }
                  break;
                }
                case 'w': {
                  let newW = Math.max(MIN_BOX, Math.min(startRect.w - dx, startRect.x + startRect.w));
                  let newH = newW / targetRatio;
                  if (newH <= rH) {
                    vCropRect.x = startRect.x + (startRect.w - newW);
                    vCropRect.w = newW;
                    vCropRect.h = newH;
                    vCropRect.y = Math.max(0, Math.min(rH - newH, startRect.y + (startRect.h - newH) / 2));
                  }
                  break;
                }
                case 's': {
                  let newH = Math.max(MIN_BOX, Math.min(startRect.h + dy, rH - startRect.y));
                  let newW = newH * targetRatio;
                  if (newW <= rW) {
                    vCropRect.h = newH;
                    vCropRect.w = newW;
                    vCropRect.x = Math.max(0, Math.min(rW - newW, startRect.x + (startRect.w - newW) / 2));
                  }
                  break;
                }
                case 'n': {
                  let newH = Math.max(MIN_BOX, Math.min(startRect.h - dy, startRect.y + startRect.h));
                  let newW = newH * targetRatio;
                  if (newW <= rW) {
                    vCropRect.y = startRect.y + (startRect.h - newH);
                    vCropRect.h = newH;
                    vCropRect.w = newW;
                    vCropRect.x = Math.max(0, Math.min(rW - newW, startRect.x + (startRect.w - newW) / 2));
                  }
                  break;
                }
              }
            } else {
              switch (activeHandle) {
                case 'se':
                  vCropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  vCropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, rH - startRect.y));
                  break;
                case 's':
                  vCropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, rH - startRect.y));
                  break;
                case 'e':
                  vCropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  break;
                case 'nw': {
                  const maxDx = startRect.w - MIN_BOX;
                  const maxDy = startRect.h - MIN_BOX;
                  const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                  const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                  vCropRect.x = startRect.x + cDx;
                  vCropRect.y = startRect.y + cDy;
                  vCropRect.w = startRect.w - cDx;
                  vCropRect.h = startRect.h - cDy;
                  break;
                }
                case 'n': {
                  const maxDy = startRect.h - MIN_BOX;
                  const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                  vCropRect.y = startRect.y + cDy;
                  vCropRect.h = startRect.h - cDy;
                  break;
                }
                case 'w': {
                  const maxDx = startRect.w - MIN_BOX;
                  const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                  vCropRect.x = startRect.x + cDx;
                  vCropRect.w = startRect.w - cDx;
                  break;
                }
                case 'ne': {
                  const maxDy = startRect.h - MIN_BOX;
                  const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                  vCropRect.y = startRect.y + cDy;
                  vCropRect.h = startRect.h - cDy;
                  vCropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, rW - startRect.x));
                  break;
                }
                case 'sw': {
                  const maxDx = startRect.w - MIN_BOX;
                  const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                  vCropRect.x = startRect.x + cDx;
                  vCropRect.w = startRect.w - cDx;
                  vCropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, rH - startRect.y));
                  break;
                }
              }
            }
          }
          renderVideoCropBox();
        };

        const onPointerUp = () => {
          activeHandle = null;
          window.removeEventListener('mousemove', onPointerMove);
          window.removeEventListener('mouseup', onPointerUp);
          window.removeEventListener('touchmove', onPointerMove);
          window.removeEventListener('touchend', onPointerUp);
        };

        const startInteraction = (handle, e) => {
          activeHandle = handle;
          startPos = getPointer(e);
          startRect = { ...vCropRect };
          window.addEventListener('mousemove', onPointerMove);
          window.addEventListener('mouseup', onPointerUp);
          window.addEventListener('touchmove', onPointerMove, { passive: false });
          window.addEventListener('touchend', onPointerUp);
        };

        cropBoxVideoEl.addEventListener('mousedown', (e) => {
          if (e.target && e.target.classList && e.target.classList.contains('crop-handle')) {
            const h = e.target.getAttribute('data-handle');
            if (h) {
              startInteraction(h, e);
              e.stopPropagation();
              return;
            }
          }
          startInteraction('move', e);
        });

        cropBoxVideoEl.addEventListener('touchstart', (e) => {
          if (e.target && e.target.classList && e.target.classList.contains('crop-handle')) {
            const h = e.target.getAttribute('data-handle');
            if (h) {
              startInteraction(h, e);
              e.stopPropagation();
              return;
            }
          }
          startInteraction('move', e);
        }, { passive: false });
      }

      if (btnResetVideoCropEl) {
        btnResetVideoCropEl.addEventListener('click', () => {
          const curFrameW = frameEl ? (frameEl.offsetWidth || 340) : 340;
          const curFrameH = frameEl ? (frameEl.offsetHeight || 170) : 170;
          vCropRect = { x: 0, y: 0, w: curFrameW, h: curFrameH };
          lockedRatio = 'free';
          document.querySelectorAll('#advCropLockRatioGroup [data-lock]').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-lock') === 'free');
          });
          renderVideoCropBox();
        });
      }

      document.querySelectorAll('#advVideoFitModeGroup [data-fit]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#advVideoFitModeGroup [data-fit]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          fitMode = btn.getAttribute('data-fit');
          updateVideoGeometry();
        });
      });

      document.querySelectorAll('#advCropLockRatioGroup [data-lock]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#advCropLockRatioGroup [data-lock]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          lockedRatio = btn.getAttribute('data-lock');
          if (lockedRatio === '9:16') {
            snapCropToRatio(9 / 16);
          } else if (lockedRatio === '16:9') {
            snapCropToRatio(16 / 9);
          } else if (lockedRatio === '1:1') {
            snapCropToRatio(1);
          }
        });
      });

      // معالجة التقطيع الزمني الدقيق وتزامن مشغل الفيديو
      const trimStartEl = document.getElementById('advTrimStart');
      const trimEndEl = document.getElementById('advTrimEnd');
      const trimDurTextEl = document.getElementById('advTrimDurationText');

      const updateTrimText = () => {
        if (!trimStartEl || !trimEndEl || !trimDurTextEl) return;
        const s = parseHmsToSec(trimStartEl.value);
        const e = parseHmsToSec(trimEndEl.value);
        const totalD = task.duration || 0;
        const effectiveD = (e > s) ? (e - s) : (totalD > s ? (totalD - s) : 0);
        trimDurTextEl.textContent = uiController.formatDuration(effectiveD) || '00:00';
      };

      document.getElementById('btnTrimCurrentStart')?.addEventListener('click', () => {
        if (playerEl && trimStartEl) {
          trimStartEl.value = formatSecToHms(playerEl.currentTime);
          updateTrimText();
        }
      });

      document.getElementById('btnTrimCurrentEnd')?.addEventListener('click', () => {
        if (playerEl && trimEndEl) {
          trimEndEl.value = formatSecToHms(playerEl.currentTime);
          updateTrimText();
        }
      });

      trimStartEl?.addEventListener('input', updateTrimText);
      trimEndEl?.addEventListener('input', updateTrimText);

      document.querySelectorAll('#advVideoAspectGroup [data-aspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#advVideoAspectGroup [data-aspect]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedAspect = btn.getAttribute('data-aspect');
          updateVideoGeometry();
        });
      });

      document.getElementById('advResolution')?.addEventListener('change', updateVideoGeometry);

      document.getElementById('advCrf')?.addEventListener('input', (e) => {
        document.getElementById('crfVal').textContent = String(e.target.value);
      });

      const vCustomW = document.getElementById('advVideoCustomWidth');
      const vCustomH = document.getElementById('advVideoCustomHeight');
      const btnLockRatio = document.getElementById('btnLockVideoRatio');

      if (btnLockRatio) {
        btnLockRatio.addEventListener('click', () => {
          lockVideoRatio = !lockVideoRatio;
          btnLockRatio.classList.toggle('active', lockVideoRatio);
          btnLockRatio.textContent = lockVideoRatio ? '🔒 حفظ النسبة' : '🔓 نسبة حرة';
          if (lockVideoRatio && vCustomW && vCustomH) {
            const w = parseInt(vCustomW.value, 10) || 1920;
            const h = parseInt(vCustomH.value, 10) || 1080;
            if (w > 0 && h > 0) videoAspectRatioValue = w / h;
          }
        });
      }

      if (vCustomW) {
        vCustomW.addEventListener('input', () => {
          let w = parseInt(vCustomW.value, 10);
          if (w > 0 && lockVideoRatio && videoAspectRatioValue > 0 && vCustomH) {
            let h = Math.round(w / videoAspectRatioValue);
            h = Math.max(16, h - (h % 2));
            vCustomH.value = h;
          }
          updateVideoGeometry();
        });
      }

      if (vCustomH) {
        vCustomH.addEventListener('input', () => {
          let h = parseInt(vCustomH.value, 10);
          if (h > 0 && lockVideoRatio && videoAspectRatioValue > 0 && vCustomW) {
            let w = Math.round(h * videoAspectRatioValue);
            w = Math.max(16, w - (w % 2));
            vCustomW.value = w;
          }
          updateVideoGeometry();
        });
      }

      // جلب وفحص مسارات الصوت والترجمة المتاحة داخل الفيديو عبر ffprobe
      currentSubMode = (task.options && task.options.subtitleMode) || 'soft';
      const audioTrackSelect = document.getElementById('advAudioTrack');
      const subtitleTrackSelect = document.getElementById('advSubtitleTrack');
      const subModeGroup = document.getElementById('advSubtitleModeGroup');
      const btnSubSoft = document.getElementById('btnSubModeSoft');
      const btnSubBurn = document.getElementById('btnSubModeBurn');
      const btnImportSub = document.getElementById('btnImportSubtitle');
      const btnClearSub = document.getElementById('btnClearSubtitle');
      const selectedSubBadge = document.getElementById('advSelectedSubBadge');
      const selectedSubName = document.getElementById('advSelectedSubName');
      const subStylePanel = document.getElementById('advSubtitleStylePanel');
      const subFontSizeInput = document.getElementById('advSubFontSize');
      const subFontSizeNum = document.getElementById('subFontSizeVal');
      const subPosSelect = document.getElementById('advSubPosition');
      const subPreviewOverlay = document.getElementById('advSubtitlePreviewOverlay');

      // شريط التحكم التفاعلي بالتايم لاين للمعاينة
      const btnPlayPause = document.getElementById('advBtnPlayPause');
      const btnSeekBack = document.getElementById('advBtnSeekBack');
      const btnSeekForward = document.getElementById('advBtnSeekForward');
      const btnPrevFrame = document.getElementById('advBtnPrevFrame');
      const btnNextFrame = document.getElementById('advBtnNextFrame');
      const timelineSlider = document.getElementById('advVideoTimeline');
      const timeDisplay = document.getElementById('advVideoTimeDisplay');
      let isUserSeeking = false;
      let isUserDraggingTimeline = false;
      let parsedSubCues = [];

      if (timelineSlider) {
        timelineSlider.min = 0;
        timelineSlider.max = realDuration > 0 ? realDuration : ((playerEl && playerEl.duration && isFinite(playerEl.duration) && playerEl.duration > 0) ? playerEl.duration : 100);
        timelineSlider.step = 0.04;
        timelineSlider.value = 0;
      }
      if (timeDisplay) {
        timeDisplay.textContent = `00:00:00 / ${formatSecToHms(realDuration)}`;
      }
      if (playerEl) {
        playerEl.loop = false;
        playerEl.addEventListener('ended', () => {
          playerEl.pause();
          const targetEnd = realDuration > 0 ? realDuration : ((playerEl.duration && isFinite(playerEl.duration) && playerEl.duration > 0) ? playerEl.duration : 0);
          playerEl.currentTime = targetEnd;
          if (timelineSlider) timelineSlider.value = targetEnd;
          if (timeDisplay) timeDisplay.textContent = `${formatSecToHms(targetEnd)} / ${formatSecToHms(realDuration)}`;
          if (btnPlayPause) {
            btnPlayPause.textContent = '▶';
            btnPlayPause.title = 'تشغيل';
          }
        });
      }

      const updateSubTextAtTime = (currentTime) => {
        if (!subPreviewOverlay) return;
        const hasExternalSub = Boolean(externalSubPath);
        const hasInternalSub = Boolean(subtitleTrackSelect && subtitleTrackSelect.value !== 'none');
        const hasSub = hasExternalSub || hasInternalSub;

        if (!hasSub || currentSubMode !== 'burn') {
          subPreviewOverlay.style.display = 'none';
          return;
        }

        if (parsedSubCues && parsedSubCues.length > 0) {
          const activeCue = parsedSubCues.find(c => currentTime >= c.start && currentTime <= c.end);
          if (activeCue) {
            subPreviewOverlay.textContent = activeCue.text;
            subPreviewOverlay.style.display = 'block';
            subPreviewOverlay.classList.remove('sub-silence');
          } else {
            subPreviewOverlay.textContent = '···';
            subPreviewOverlay.style.display = 'block';
            subPreviewOverlay.classList.add('sub-silence');
          }
        } else {
          subPreviewOverlay.textContent = 'هذا نموذج لمعاينة حجم ومكان الترجمة';
          subPreviewOverlay.style.display = 'block';
          subPreviewOverlay.classList.remove('sub-silence');
        }
      };

      const updateSubPreviewOverlay = () => {
        const hasExternalSub = Boolean(externalSubPath);
        const hasInternalSub = Boolean(subtitleTrackSelect && subtitleTrackSelect.value !== 'none');
        const hasSub = hasExternalSub || hasInternalSub;

        if (subModeGroup) {
          subModeGroup.style.display = hasSub ? 'block' : 'none';
        }

        if (subStylePanel) {
          subStylePanel.style.display = (hasSub && currentSubMode === 'burn') ? 'block' : 'none';
        }

        if (subPreviewOverlay) {
          if (hasSub && currentSubMode === 'burn') {
            const curSize = subFontSizeInput ? subFontSizeInput.value : subFontSizeVal;
            const curPos = subPosSelect ? subPosSelect.value : subPosVal;
            subPreviewOverlay.style.fontSize = `${curSize}px`;

            if (curPos === 'top') {
              subPreviewOverlay.style.top = '14px';
              subPreviewOverlay.style.bottom = 'auto';
              subPreviewOverlay.style.transform = 'none';
            } else if (curPos === 'center') {
              subPreviewOverlay.style.top = '50%';
              subPreviewOverlay.style.bottom = 'auto';
              subPreviewOverlay.style.transform = 'translateY(-50%)';
            } else {
              subPreviewOverlay.style.bottom = '14px';
              subPreviewOverlay.style.top = 'auto';
              subPreviewOverlay.style.transform = 'none';
            }

            const curTime = playerEl ? (playerEl.currentTime || 0) : 0;
            updateSubTextAtTime(curTime);
          } else {
            subPreviewOverlay.style.display = 'none';
          }
        }
      };

      // المزامنة اللحظية والتحكم في مشغل الفيديو وشريط التايم لاين
      const updatePlayerUi = () => {
        if (!playerEl) return;
        const curTime = playerEl.currentTime || 0;
        const totalDur = realDuration > 0
          ? realDuration
          : ((playerEl.duration && !isNaN(playerEl.duration) && isFinite(playerEl.duration) && playerEl.duration > 0)
            ? playerEl.duration
            : (task.duration || 0));

        if (!isUserSeeking && !isUserDraggingTimeline) {
          if (timeDisplay) {
            timeDisplay.textContent = `${formatSecToHms(curTime)} / ${formatSecToHms(totalDur)}`;
          }

          if (timelineSlider) {
            if (totalDur > 0 && Math.abs(parseFloat(timelineSlider.max || '0') - totalDur) > 0.5) {
              timelineSlider.min = 0;
              timelineSlider.max = totalDur;
              timelineSlider.step = 0.04;
            }
            timelineSlider.value = curTime;
          }
        }

        updateSubTextAtTime(curTime);
      };

      if (btnPlayPause && playerEl) {
        btnPlayPause.addEventListener('click', () => {
          if (playerEl.paused) {
            playerEl.play().catch(() => {});
            btnPlayPause.textContent = '⏸';
            btnPlayPause.title = 'إيقاف مؤقت';
          } else {
            playerEl.pause();
            btnPlayPause.textContent = '▶';
            btnPlayPause.title = 'تشغيل';
          }
        });
      }

      if (playerEl && btnPlayPause) {
        playerEl.addEventListener('play', () => {
          btnPlayPause.textContent = '⏸';
          btnPlayPause.title = 'إيقاف مؤقت';
        });
        playerEl.addEventListener('pause', () => {
          btnPlayPause.textContent = '▶';
          btnPlayPause.title = 'تشغيل';
        });
      }

      const effectiveFps = (task.metadata && task.metadata.fps) || (task.meta && task.meta.fps) || videoFps || 24;
      const frameStep = 1 / effectiveFps;
      const maxSeekLimit = realDuration > 0 ? realDuration : ((playerEl && playerEl.duration && isFinite(playerEl.duration)) ? playerEl.duration : 0);

      if (btnSeekBack && playerEl) {
        btnSeekBack.addEventListener('click', () => {
          playerEl.currentTime = Math.max(0, playerEl.currentTime - 5);
          updatePlayerUi();
        });
      }

      if (btnSeekForward && playerEl) {
        btnSeekForward.addEventListener('click', () => {
          playerEl.currentTime = Math.max(0, Math.min(maxSeekLimit, playerEl.currentTime + 5));
          updatePlayerUi();
        });
      }

      if (btnPrevFrame && playerEl) {
        btnPrevFrame.addEventListener('click', () => {
          playerEl.pause();
          playerEl.currentTime = Math.max(0, Math.min(maxSeekLimit, playerEl.currentTime - frameStep));
          updatePlayerUi();
        });
      }

      if (btnNextFrame && playerEl) {
        btnNextFrame.addEventListener('click', () => {
          playerEl.pause();
          playerEl.currentTime = Math.max(0, Math.min(maxSeekLimit, playerEl.currentTime + frameStep));
          updatePlayerUi();
        });
      }

      if (timelineSlider && playerEl) {
        timelineSlider.addEventListener('input', (e) => {
          isUserSeeking = true;
          isUserDraggingTimeline = true;
          const targetSec = parseFloat(e.target.value) || 0;
          const totalDur = realDuration > 0
            ? realDuration
            : ((playerEl.duration && !isNaN(playerEl.duration) && isFinite(playerEl.duration) && playerEl.duration > 0)
              ? playerEl.duration
              : (task.duration || 0));
          if (timeDisplay) {
            timeDisplay.textContent = `${formatSecToHms(targetSec)} / ${formatSecToHms(totalDur)}`;
          }
          updateSubTextAtTime(targetSec);
        });

        timelineSlider.addEventListener('change', (e) => {
          const targetSec = parseFloat(e.target.value) || 0;
          playerEl.currentTime = targetSec;
          isUserSeeking = false;
          isUserDraggingTimeline = false;
          updatePlayerUi();
        });
      }

      if (playerEl) {
        playerEl.addEventListener('timeupdate', updatePlayerUi);
        playerEl.addEventListener('seeked', () => {
          updatePlayerUi();
        });
        playerEl.addEventListener('loadedmetadata', () => {
          if (realDuration <= 0 && playerEl.duration && !isNaN(playerEl.duration) && isFinite(playerEl.duration) && playerEl.duration > 0 && timelineSlider) {
            timelineSlider.min = 0;
            timelineSlider.max = playerEl.duration;
            timelineSlider.step = 0.04;
          }
          updatePlayerUi();
        });
      }

      if (externalSubPath && window.ipcClient && typeof window.ipcClient.readSubtitle === 'function') {
        window.ipcClient.readSubtitle(externalSubPath).then((res) => {
          if (res && res.success && res.content) {
            parsedSubCues = this.parseSubtitleContent(res.content);
            updateSubPreviewOverlay();
          }
        }).catch(() => {});
      }

      if (subFontSizeInput && subFontSizeNum) {
        subFontSizeInput.addEventListener('input', (e) => {
          subFontSizeVal = parseInt(e.target.value, 10);
          subFontSizeNum.textContent = `${subFontSizeVal}px`;
          updateSubPreviewOverlay();
        });
      }

      if (subPosSelect) {
        subPosSelect.addEventListener('change', (e) => {
          subPosVal = e.target.value;
          updateSubPreviewOverlay();
        });
      }

      if (btnImportSub) {
        btnImportSub.addEventListener('click', async () => {
          if (window.ipcClient && typeof window.ipcClient.selectSubtitle === 'function') {
            try {
              const res = await window.ipcClient.selectSubtitle();
              if (res && !res.canceled && res.filePath) {
                externalSubPath = res.filePath;
                const fileName = externalSubPath.split(/[\\/]/).pop();
                if (selectedSubName) selectedSubName.textContent = fileName;
                if (selectedSubBadge) selectedSubBadge.style.display = 'inline-flex';

                if (res.content) {
                  parsedSubCues = this.parseSubtitleContent(res.content);
                } else if (typeof window.ipcClient.readSubtitle === 'function') {
                  const readRes = await window.ipcClient.readSubtitle(externalSubPath);
                  if (readRes && readRes.success && readRes.content) {
                    parsedSubCues = this.parseSubtitleContent(readRes.content);
                  }
                }
                updateSubPreviewOverlay();
                this.showToast(`تم استيراد ملف الترجمة: ${fileName}`, 'success');
              }
            } catch (err) {
              this.showToast(`تعذر استيراد ملف الترجمة: ${err.message}`, 'error');
            }
          }
        });
      }

      if (btnClearSub) {
        btnClearSub.addEventListener('click', () => {
          externalSubPath = null;
          parsedSubCues = [];
          if (selectedSubName) selectedSubName.textContent = '';
          if (selectedSubBadge) selectedSubBadge.style.display = 'none';
          updateSubPreviewOverlay();
          this.showToast('تم استبعاد ملف الترجمة الخارجي', 'info');
        });
      }

      if (btnSubSoft && btnSubBurn) {
        btnSubSoft.addEventListener('click', () => {
          currentSubMode = 'soft';
          btnSubSoft.classList.add('active');
          btnSubBurn.classList.remove('active');
          updateSubPreviewOverlay();
        });
        btnSubBurn.addEventListener('click', () => {
          currentSubMode = 'burn';
          btnSubBurn.classList.add('active');
          btnSubSoft.classList.remove('active');
          updateSubPreviewOverlay();
        });
      }

      if (subtitleTrackSelect) {
        subtitleTrackSelect.addEventListener('change', () => {
          updateSubPreviewOverlay();
        });
      }

      if (window.ipcClient && typeof window.ipcClient.getVideoMeta === 'function' && task.filePath) {
        window.ipcClient.getVideoMeta(task.filePath).then((res) => {
          if (!res || !res.success || !res.metadata) return;
          const meta = res.metadata;
          if (meta.duration && !isNaN(meta.duration) && isFinite(meta.duration) && meta.duration > 0) {
            realDuration = meta.duration;
            if (timelineSlider) {
              timelineSlider.max = realDuration;
            }
            updatePlayerUi();
          }
          if (meta.fps) videoFps = meta.fps;
          else if (meta.videoStreams && meta.videoStreams[0] && meta.videoStreams[0].fps) {
            videoFps = meta.videoStreams[0].fps;
          }

          if (audioTrackSelect && Array.isArray(meta.audioStreams) && meta.audioStreams.length > 0) {
            audioTrackSelect.innerHTML = '';
            meta.audioStreams.forEach((st) => {
              const opt = document.createElement('option');
              opt.value = String(st.audioIndex);
              const langStr = st.language ? ` - ${st.language.toUpperCase()}` : '';
              const titleStr = st.title ? ` (${st.title})` : '';
              opt.textContent = `المسار ${st.audioIndex + 1}${langStr}${titleStr} [${st.codec || 'audio'}]`;
              if (task.options && String(task.options.audioTrackIndex) === String(st.audioIndex)) {
                opt.selected = true;
              }
              audioTrackSelect.appendChild(opt);
            });
          }

          if (subtitleTrackSelect && Array.isArray(meta.subtitleStreams) && meta.subtitleStreams.length > 0) {
            meta.subtitleStreams.forEach((st) => {
              const opt = document.createElement('option');
              opt.value = String(st.subtitleIndex);
              const langStr = st.language ? ` - ${st.language.toUpperCase()}` : '';
              const titleStr = st.title ? ` (${st.title})` : '';
              opt.textContent = `ترجمة مدمجة ${st.subtitleIndex + 1}${langStr}${titleStr} [${st.codec || 'sub'}]`;
              if (task.options && String(task.options.subtitleTrackIndex) === String(st.subtitleIndex)) {
                opt.selected = true;
              }
              subtitleTrackSelect.appendChild(opt);
            });
            updateSubPreviewOverlay();
          }
        }).catch(() => {});
      }

      updateSubPreviewOverlay();

      // عينة المعاينة السريعة 10 ثوانٍ (Sample Test Render)
      const btnSampleRender = document.getElementById('btnSampleRender');
      if (btnSampleRender) {
        btnSampleRender.addEventListener('click', async () => {
          btnSampleRender.disabled = true;
          const origHtml = btnSampleRender.innerHTML;
          btnSampleRender.innerHTML = '<span>⏳ جاري معالجة العينة (10 ثوانٍ)...</span>';

          try {
            let sCustomW = null;
            let sCustomH = null;
            if (selectedAspect === 'custom') {
              const wEl = document.getElementById('advVideoCustomWidth');
              const hEl = document.getElementById('advVideoCustomHeight');
              let w = wEl ? parseInt(wEl.value, 10) : customWidthVal;
              let h = hEl ? parseInt(hEl.value, 10) : customHeightVal;
              sCustomW = Math.max(16, w - (w % 2));
              sCustomH = Math.max(16, h - (h % 2));
            }

            const currentOpts = {
              crf: parseInt(document.getElementById('advCrf')?.value || '23', 10),
              videoCodec: document.getElementById('advVideoCodec')?.value || 'libx264',
              resolution: document.getElementById('advResolution')?.value || 'source',
              audioBitrate: document.getElementById('advAudioBitrate')?.value || '192k',
              aspectRatio: selectedAspect,
              fitMode,
              customWidth: sCustomW,
              customHeight: sCustomH,
              width: sCustomW,
              height: sCustomH,
              crop: (selectedAspect === 'free-crop') ? videoCropState : null,
              audioTrackIndex: document.getElementById('advAudioTrack')?.value,
              subtitleTrackIndex: document.getElementById('advSubtitleTrack')?.value,
              subtitleMode: currentSubMode,
              subtitlePath: externalSubPath || null,
              subtitle: externalSubPath || null,
              subtitleFontSize: subFontSizeVal,
              subtitlePosition: subPosVal,
              loudnorm: Boolean(document.getElementById('advLoudnorm')?.checked),
              playbackSpeed: parseFloat(document.getElementById('advPlaybackSpeed')?.value || '1')
            };

            const res = await window.ipcClient.renderSample({
              inputPath: task.filePath,
              targetFormat: task.targetFormat || 'mp4',
              options: currentOpts
            });

            if (res && res.success) {
              this.showToast('تم تجهيز عينة المعاينة (10 ثوانٍ) وفتحها بنجاح 🎬', 'success');
            } else {
              this.showToast(`تعذر تجهيز العينة: ${res?.error || 'خطأ غير معروف'}`, 'error');
            }
          } catch (err) {
            this.showToast(`خطأ في معالجة العينة: ${err.message}`, 'error');
          } finally {
            btnSampleRender.disabled = false;
            btnSampleRender.innerHTML = origHtml;
          }
        });
      }
    } else if (isAudio) {
      const audioBitrateVal = task.options.audioBitrate || '192k';

      body.innerHTML = `
        <div class="form-group">
          <label>معدل بت الصوت (Audio Bitrate)</label>
          <select id="advAudioBitrate" class="input-select">
            <option value="320k" ${audioBitrateVal === '320k' ? 'selected' : ''}>320 kbps (أعلى نقاء استوديو)</option>
            <option value="256k" ${audioBitrateVal === '256k' ? 'selected' : ''}>256 kbps (جودة فائقة)</option>
            <option value="192k" ${audioBitrateVal === '192k' ? 'selected' : ''}>192 kbps (قياسي متوازن)</option>
            <option value="128k" ${audioBitrateVal === '128k' ? 'selected' : ''}>128 kbps (جودة مضغوطة)</option>
          </select>
        </div>

        <div class="form-group">
          <label>تردد العينات (Sample Rate)</label>
          <select id="advSampleRate" class="input-select">
            <option value="48000" ${task.options.sampleRate === 48000 ? 'selected' : ''}>48,000 Hz (جودة استوديو/فيديو)</option>
            <option value="44100" ${task.options.sampleRate === 44100 ? 'selected' : ''}>44,100 Hz (جودة أسطوانة CD)</option>
            <option value="96000" ${task.options.sampleRate === 96000 ? 'selected' : ''}>96,000 Hz (Hi-Res Audio)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="advLoudnorm" ${task.options && task.options.loudnorm ? 'checked' : ''} />
            <span>🔊 موازنة ورفع الصوت الذكي (Smart Audio Normalization - loudnorm)</span>
          </label>
        </div>

        <div class="form-group">
          <label>⚡ سرعة العرض ومزامنة النبرة (Playback Speed)</label>
          <select id="advPlaybackSpeed" class="input-select">
            <option value="1" ${(!task.options?.playbackSpeed || task.options.playbackSpeed === 1) ? 'selected' : ''}>1.0x (السرعة الطبيعية)</option>
            <option value="0.5" ${task.options?.playbackSpeed === 0.5 ? 'selected' : ''}>0.5x (حركة بطيئة للنصف)</option>
            <option value="0.75" ${task.options?.playbackSpeed === 0.75 ? 'selected' : ''}>0.75x (حركة بطيئة 0.75x)</option>
            <option value="1.25" ${task.options?.playbackSpeed === 1.25 ? 'selected' : ''}>1.25x (تسريع خفيف 1.25x)</option>
            <option value="1.5" ${task.options?.playbackSpeed === 1.5 ? 'selected' : ''}>1.5x (تسريع 1.5x)</option>
            <option value="2" ${task.options?.playbackSpeed === 2 ? 'selected' : ''}>2.0x (ضعف السرعة 2x)</option>
          </select>
        </div>
      `;
    } else if (isImage) {
      const qualityVal = task.options.quality !== undefined ? task.options.quality : 90;
      const currentPresetSize = task.options.presetSize || 'original';
      const isSharpen = Boolean(task.options.sharpen);
      const customW = task.options.width || (task.dimensions ? task.dimensions.width : '');
      const customH = task.options.height || (task.dimensions ? task.dimensions.height : '');
      const maintainAspect = task.options.maintainAspectRatio !== undefined ? task.options.maintainAspectRatio : true;
      selectedRotate = task.options.rotate || 0;
      flipH = Boolean(task.options.flipH);
      flipV = Boolean(task.options.flipV);

      cropState = (task.options && task.options.crop) ? { ...task.options.crop } : null;

      // دالة مساعدة لحساب أبعاد المعاينة الحية
      const getPreviewDim = (presetKey, w, h) => {
        const PRESETS = {
          'a4-print-300': '2480 × 3508 px (A4 300 DPI طباعة فائقة)',
          'a4-screen-150': '1240 × 1754 px (A4 150 DPI شاشة ومستندات)',
          'a5-print-300': '1748 × 2480 px (A5 300 DPI طباعة قياسية)',
          'fhd-1080p': '1920 × 1080 px (Full HD شاشة)',
          'insta-square': '1080 × 1080 px (Square 1:1 إنستغرام)',
          'story-shorts': '1080 × 1920 px (Story / Shorts 9:16)'
        };
        if (presetKey && PRESETS[presetKey]) return PRESETS[presetKey];
        if (presetKey === 'custom' && w && h) return `${w} × ${h} px (مخصص)`;
        if (cropState && cropState.width && cropState.height) return `${Math.round(cropState.width)} × ${Math.round(cropState.height)} px (مقصوص)`;
        if (task.dimensions && task.dimensions.width) return `${task.dimensions.width} × ${task.dimensions.height} px (أصلي)`;
        return 'الأبعاد الأصلية';
      };

      body.innerHTML = `
        <!-- مساحة المعاينة الحية وإطار الاقتصاص الحر التفاعلي -->
        <div class="image-cropper-wrapper image-preview-wrapper">
          <div class="image-preview-canvas">
            <div class="cropper-stage" id="cropperStage">
              <img id="advImgPreviewStage" src="media-stream://stream?path=${encodeURIComponent(task.filePath)}" alt="${task.name}" draggable="false" />
              <div class="crop-box" id="cropBox">
                <div class="crop-grid-h1"></div>
                <div class="crop-grid-h2"></div>
                <div class="crop-grid-v1"></div>
                <div class="crop-grid-v2"></div>
                <div class="crop-dimension-badge" id="cropDimBadge">0 × 0 px</div>
                <!-- مقابض الزوايا البيضاء الفاخرة Corner Brackets -->
                <div class="crop-handle handle-nw" data-handle="nw"></div>
                <div class="crop-handle handle-ne" data-handle="ne"></div>
                <div class="crop-handle handle-se" data-handle="se"></div>
                <div class="crop-handle handle-sw" data-handle="sw"></div>
                <!-- مقابض الحواف الأربعة Edge Handles -->
                <div class="crop-handle handle-n" data-handle="n"></div>
                <div class="crop-handle handle-s" data-handle="s"></div>
                <div class="crop-handle handle-e" data-handle="e"></div>
                <div class="crop-handle handle-w" data-handle="w"></div>
              </div>
            </div>
          </div>
          <div class="cropper-toolbar-footer">
            <button type="button" class="btn-crop-reset" id="btnResetCrop">↺ إعادة تعيين القص</button>
            <div class="image-preview-badge">قص حر تفاعلي (Interactive Cropper)</div>
          </div>
        </div>

        <div class="form-group">
          <label>المقاس المعياري والطباعة (Preset Sizes & Print Standards)</label>
          <select id="advImgPresetSize" class="input-select">
            <option value="original" ${currentPresetSize === 'original' ? 'selected' : ''}>الأبعاد الأصلية (Same as Source)</option>
            <option value="a4-print-300" ${currentPresetSize === 'a4-print-300' ? 'selected' : ''}>A4 (طباعة فائقة الدقة 300 DPI - 2480×3508)</option>
            <option value="a4-screen-150" ${currentPresetSize === 'a4-screen-150' ? 'selected' : ''}>A4 (شاشة ومستندات 150 DPI - 1240×1754)</option>
            <option value="a5-print-300" ${currentPresetSize === 'a5-print-300' ? 'selected' : ''}>A5 (طباعة 300 DPI - 1748×2480)</option>
            <option value="fhd-1080p" ${currentPresetSize === 'fhd-1080p' ? 'selected' : ''}>Full HD (1080p - 1920×1080)</option>
            <option value="insta-square" ${currentPresetSize === 'insta-square' ? 'selected' : ''}>مربع Instagram (1:1 - 1080×1080)</option>
            <option value="story-shorts" ${currentPresetSize === 'story-shorts' ? 'selected' : ''}>قصص وشورتس Story / Shorts (9:16 - 1080×1920)</option>
            <option value="custom" ${currentPresetSize === 'custom' ? 'selected' : ''}>أبعاد مخصصة صريحة (Custom Dimensions)...</option>
          </select>
        </div>

        <div id="advCustomDimsGroup" class="form-group" style="${currentPresetSize === 'custom' ? 'display: flex;' : 'display: none;'}">
          <label>الأبعاد المخصصة بالبكسل</label>
          <div class="custom-dims-row">
            <div>
              <span class="info-label">العرض (Width):</span>
              <input type="number" id="advImgWidth" class="input-text" min="1" max="16000" value="${customW}" placeholder="العرض بالبكسل" />
            </div>
            <div>
              <span class="info-label">الارتفاع (Height):</span>
              <input type="number" id="advImgHeight" class="input-text" min="1" max="16000" value="${customH}" placeholder="الارتفاع بالبكسل" />
            </div>
          </div>
          <label class="checkbox-label" style="margin-top: 8px;">
            <input type="checkbox" id="advImgAspect" ${maintainAspect ? 'checked' : ''} />
            <span>الحفاظ على نسبة التناسب (Maintain Aspect Ratio)</span>
          </label>
        </div>

        <div class="dimension-preview-box">
          <span>الأبعاد الناتجة المتوقعة:</span>
          <strong id="advImgDimPreview">${getPreviewDim(currentPresetSize, customW, customH)}</strong>
        </div>

        <div class="form-group">
          <label>جودة ضغط الصورة (1 - 100)</label>
          <div class="slider-row">
            <input type="range" id="advQuality" min="1" max="100" value="${qualityVal}" />
            <span id="qualityVal" class="slider-num">${qualityVal}%</span>
          </div>
        </div>

        <div class="form-group">
          <label>فلاتر تحسين الحدة وتفاصيل الطباعة</label>
          <label class="checkbox-label">
            <input type="checkbox" id="advImgSharpen" ${isSharpen ? 'checked' : ''} />
            <span>تفعيل فلتر تحسين الحدة والوضوح الفائق (Sharpness Filter)</span>
          </label>
        </div>

        <div class="form-group">
          <label>التدوير والانعكاس (Orientation & Flip)</label>
          <div class="action-btn-group">
            <button type="button" class="btn-pill ${selectedRotate === 0 ? 'active' : ''}" data-rotate="0">0° (عادي)</button>
            <button type="button" class="btn-pill ${selectedRotate === 90 ? 'active' : ''}" data-rotate="90">90° ↻</button>
            <button type="button" class="btn-pill ${selectedRotate === 180 ? 'active' : ''}" data-rotate="180">180° ↻</button>
            <button type="button" class="btn-pill ${selectedRotate === 270 ? 'active' : ''}" data-rotate="270">270° ↻</button>
            <button type="button" class="btn-pill ${flipH ? 'active' : ''}" id="btnFlipH">انعكاس أفقي ↔</button>
            <button type="button" class="btn-pill ${flipV ? 'active' : ''}" id="btnFlipV">انعكاس رأسي ↕</button>
          </div>
        </div>
      `;

      const presetSelectEl = document.getElementById('advImgPresetSize');
      const customGroupEl = document.getElementById('advCustomDimsGroup');
      const dimPreviewEl = document.getElementById('advImgDimPreview');
      const widthInput = document.getElementById('advImgWidth');
      const heightInput = document.getElementById('advImgHeight');

      const updateLiveDim = () => {
        const curPreset = presetSelectEl ? presetSelectEl.value : 'original';
        const w = widthInput ? widthInput.value : '';
        const h = heightInput ? heightInput.value : '';
        if (dimPreviewEl) dimPreviewEl.textContent = getPreviewDim(curPreset, w, h);
      };

      // تحديث المعاينة الحية للتدوير والانعكاس عبر CSS transform
      const updatePreviewTransform = () => {
        const previewImg = document.getElementById('advImgPreviewStage');
        if (!previewImg) return;
        const sx = flipH ? -1 : 1;
        const sy = flipV ? -1 : 1;
        previewImg.style.transform = `rotate(${selectedRotate}deg) scale(${sx}, ${sy})`;
      };

      // تطبيق التدوير فوراً عند فتح المودال
      updatePreviewTransform();

      // --- منطق الاقتصاص الحر التفاعلي (Interactive Free Cropper Logic) ---
      const previewImgEl = document.getElementById('advImgPreviewStage');
      const cropBoxEl = document.getElementById('cropBox');
      const cropDimBadgeEl = document.getElementById('cropDimBadge');
      const btnResetCropEl = document.getElementById('btnResetCrop');

      let cropRect = { x: 0, y: 0, w: 0, h: 0 };
      let renderedW = 0;
      let renderedH = 0;
      let naturalW = (task.dimensions && task.dimensions.width) || 0;
      let naturalH = (task.dimensions && task.dimensions.height) || 0;

      const renderCropBox = () => {
        if (!cropBoxEl || !cropDimBadgeEl) return;
        cropBoxEl.style.left = `${Math.round(cropRect.x)}px`;
        cropBoxEl.style.top = `${Math.round(cropRect.y)}px`;
        cropBoxEl.style.width = `${Math.round(cropRect.w)}px`;
        cropBoxEl.style.height = `${Math.round(cropRect.h)}px`;

        const sX = (renderedW > 0) ? (naturalW / renderedW) : 1;
        const sY = (renderedH > 0) ? (naturalH / renderedH) : 1;
        const natLeft = Math.max(0, Math.round(cropRect.x * sX));
        const natTop = Math.max(0, Math.round(cropRect.y * sY));
        const natW = Math.max(1, Math.round(cropRect.w * sX));
        const natH = Math.max(1, Math.round(cropRect.h * sY));

        cropDimBadgeEl.textContent = `${natW} × ${natH} px`;

        const isFull = (natLeft <= 1 && natTop <= 1 && (naturalW > 0 ? (natW >= naturalW - 2 && natH >= naturalH - 2) : true));
        if (!isFull) {
          cropState = { left: natLeft, top: natTop, width: natW, height: natH };
        } else {
          cropState = null;
        }
        updateLiveDim();
      };

      const initCropper = () => {
        if (!previewImgEl) return;
        renderedW = previewImgEl.clientWidth || previewImgEl.offsetWidth || 0;
        renderedH = previewImgEl.clientHeight || previewImgEl.offsetHeight || 0;

        if (previewImgEl.naturalWidth && previewImgEl.naturalHeight) {
          naturalW = previewImgEl.naturalWidth;
          naturalH = previewImgEl.naturalHeight;
        } else if (!naturalW || !naturalH) {
          naturalW = renderedW || 800;
          naturalH = renderedH || 600;
        }

        if (renderedW <= 0 || renderedH <= 0) return;

        const sX = naturalW / renderedW;
        const sY = naturalH / renderedH;

        if (cropState && cropState.width && cropState.height) {
          cropRect.x = Math.max(0, Math.min(Math.round(cropState.left / sX), renderedW - 20));
          cropRect.y = Math.max(0, Math.min(Math.round(cropState.top / sY), renderedH - 20));
          cropRect.w = Math.max(20, Math.min(Math.round(cropState.width / sX), renderedW - cropRect.x));
          cropRect.h = Math.max(20, Math.min(Math.round(cropState.height / sY), renderedH - cropRect.y));
        } else {
          cropRect = { x: 0, y: 0, w: renderedW, h: renderedH };
        }
        renderCropBox();
      };

      if (previewImgEl) {
        if (previewImgEl.complete && previewImgEl.naturalWidth > 0) {
          initCropper();
        } else {
          previewImgEl.addEventListener('load', initCropper);
        }
        setTimeout(initCropper, 60);
      }

      if (btnResetCropEl) {
        btnResetCropEl.addEventListener('click', () => {
          cropState = null;
          cropRect = { x: 0, y: 0, w: renderedW, h: renderedH };
          renderCropBox();
        });
      }

      // أحداث السحب والتحجيم التفاعلي بالماوس أو اللمس
      if (cropBoxEl) {
        const MIN_BOX = 16;
        let activeHandle = null;
        let startPos = { x: 0, y: 0 };
        let startRect = { x: 0, y: 0, w: 0, h: 0 };

        const getPointer = (e) => {
          if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
          return { x: e.clientX, y: e.clientY };
        };

        const onPointerMove = (e) => {
          if (!activeHandle) return;
          if (e.cancelable) e.preventDefault();
          const p = getPointer(e);
          const dx = p.x - startPos.x;
          const dy = p.y - startPos.y;

          if (activeHandle === 'move') {
            const minX = -startRect.x;
            const maxX = renderedW - (startRect.x + startRect.w);
            const minY = -startRect.y;
            const maxY = renderedH - (startRect.y + startRect.h);
            cropRect.x = startRect.x + Math.max(minX, Math.min(dx, maxX));
            cropRect.y = startRect.y + Math.max(minY, Math.min(dy, maxY));
          } else {
            switch (activeHandle) {
              case 'se': {
                cropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, renderedW - startRect.x));
                cropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, renderedH - startRect.y));
                break;
              }
              case 's': {
                cropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, renderedH - startRect.y));
                break;
              }
              case 'e': {
                cropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, renderedW - startRect.x));
                break;
              }
              case 'nw': {
                const maxDx = startRect.w - MIN_BOX;
                const maxDy = startRect.h - MIN_BOX;
                const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                cropRect.x = startRect.x + cDx;
                cropRect.y = startRect.y + cDy;
                cropRect.w = startRect.w - cDx;
                cropRect.h = startRect.h - cDy;
                break;
              }
              case 'n': {
                const maxDy = startRect.h - MIN_BOX;
                const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                cropRect.y = startRect.y + cDy;
                cropRect.h = startRect.h - cDy;
                break;
              }
              case 'w': {
                const maxDx = startRect.w - MIN_BOX;
                const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                cropRect.x = startRect.x + cDx;
                cropRect.w = startRect.w - cDx;
                break;
              }
              case 'ne': {
                const maxDy = startRect.h - MIN_BOX;
                const cDy = Math.max(-startRect.y, Math.min(dy, maxDy));
                cropRect.y = startRect.y + cDy;
                cropRect.h = startRect.h - cDy;
                cropRect.w = Math.max(MIN_BOX, Math.min(startRect.w + dx, renderedW - startRect.x));
                break;
              }
              case 'sw': {
                const maxDx = startRect.w - MIN_BOX;
                const cDx = Math.max(-startRect.x, Math.min(dx, maxDx));
                cropRect.x = startRect.x + cDx;
                cropRect.w = startRect.w - cDx;
                cropRect.h = Math.max(MIN_BOX, Math.min(startRect.h + dy, renderedH - startRect.y));
                break;
              }
            }
          }
          renderCropBox();
        };

        const onPointerUp = () => {
          activeHandle = null;
          window.removeEventListener('mousemove', onPointerMove);
          window.removeEventListener('mouseup', onPointerUp);
          window.removeEventListener('touchmove', onPointerMove);
          window.removeEventListener('touchend', onPointerUp);
        };

        const startInteraction = (handle, e) => {
          activeHandle = handle;
          startPos = getPointer(e);
          startRect = { ...cropRect };
          window.addEventListener('mousemove', onPointerMove);
          window.addEventListener('mouseup', onPointerUp);
          window.addEventListener('touchmove', onPointerMove, { passive: false });
          window.addEventListener('touchend', onPointerUp);
        };

        cropBoxEl.addEventListener('mousedown', (e) => {
          if (e.target && e.target.classList && e.target.classList.contains('crop-handle')) {
            const h = e.target.getAttribute('data-handle');
            if (h) {
              e.stopPropagation();
              startInteraction(h, e);
              return;
            }
          }
          startInteraction('move', e);
        });

        cropBoxEl.addEventListener('touchstart', (e) => {
          if (e.target && e.target.classList && e.target.classList.contains('crop-handle')) {
            const h = e.target.getAttribute('data-handle');
            if (h) {
              e.stopPropagation();
              startInteraction(h, e);
              return;
            }
          }
          startInteraction('move', e);
        }, { passive: true });
      }

      if (presetSelectEl) {
        presetSelectEl.addEventListener('change', () => {
          if (customGroupEl) {
            customGroupEl.style.display = (presetSelectEl.value === 'custom') ? 'flex' : 'none';
          }
          updateLiveDim();
        });
      }

      if (widthInput) {
        widthInput.addEventListener('input', () => {
          const maintainAspectEl = document.getElementById('advImgAspect');
          const aspect = (naturalW && naturalH) ? (naturalW / naturalH) : (renderedW && renderedH ? (renderedW / renderedH) : 1);
          if (maintainAspectEl && maintainAspectEl.checked && aspect > 0) {
            const w = parseInt(widthInput.value, 10);
            if (w > 0 && heightInput) {
              heightInput.value = Math.round(w / aspect);
            }
          }
          updateLiveDim();
        });
      }

      if (heightInput) {
        heightInput.addEventListener('input', () => {
          const maintainAspectEl = document.getElementById('advImgAspect');
          const aspect = (naturalW && naturalH) ? (naturalW / naturalH) : (renderedW && renderedH ? (renderedW / renderedH) : 1);
          if (maintainAspectEl && maintainAspectEl.checked && aspect > 0) {
            const h = parseInt(heightInput.value, 10);
            if (h > 0 && widthInput) {
              widthInput.value = Math.round(h * aspect);
            }
          }
          updateLiveDim();
        });
      }

      document.querySelectorAll('[data-rotate]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-rotate]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedRotate = parseInt(btn.getAttribute('data-rotate'), 10) || 0;
          updatePreviewTransform();
        });
      });

      const btnFlipHEl = document.getElementById('btnFlipH');
      if (btnFlipHEl) {
        btnFlipHEl.addEventListener('click', () => {
          flipH = !flipH;
          btnFlipHEl.classList.toggle('active', flipH);
          updatePreviewTransform();
        });
      }

      const btnFlipVEl = document.getElementById('btnFlipV');
      if (btnFlipVEl) {
        btnFlipVEl.addEventListener('click', () => {
          flipV = !flipV;
          btnFlipVEl.classList.toggle('active', flipV);
          updatePreviewTransform();
        });
      }

      document.getElementById('advQuality')?.addEventListener('input', (e) => {
        document.getElementById('qualityVal').textContent = `${e.target.value}%`;
      });
    } else {
      body.innerHTML = `<p style="padding: 10px 0; color: var(--text-secondary);">لا توجد خيارات متقدمة إضافية لهذا النوع من المستندات.</p>`;
    }

    // حفظ التعديلات
    this.elements.modalSaveBtn.onclick = () => {
      const taskIdToUpdate = this.currentEditingTaskId || task.taskId;
      const taskRecord = window.appState.tasks.find(t => t.taskId === taskIdToUpdate);
      if (!taskRecord) {
        this.closeAdvancedModal();
        return;
      }

      const updates = {};
      if (isDoc) {
        const pageSizeEl = document.getElementById('advDocPageSize');
        const marginEl = document.getElementById('advDocMargin');
        if (pageSizeEl) updates.pageSize = pageSizeEl.value;
        if (marginEl) updates.margin = parseInt(marginEl.value, 10);
        updates.orientation = docOrientationVal;
      } else if (isVideo) {
        const crf = document.getElementById('advCrf');
        const vCodec = document.getElementById('advVideoCodec');
        const res = document.getElementById('advResolution');
        const aBitrate = document.getElementById('advAudioBitrate');
        if (crf) updates.crf = parseInt(crf.value, 10);
        if (vCodec) updates.videoCodec = vCodec.value;
        if (res) updates.resolution = res.value;
        if (aBitrate) updates.audioBitrate = aBitrate.value;
        updates.aspectRatio = selectedAspect;
        updates.aspectPreset = selectedAspect;
        updates.fitMode = fitMode;

        if (selectedAspect === 'custom') {
          const wEl = document.getElementById('advVideoCustomWidth');
          const hEl = document.getElementById('advVideoCustomHeight');
          let w = wEl ? parseInt(wEl.value, 10) : customWidthVal;
          let h = hEl ? parseInt(hEl.value, 10) : customHeightVal;
          w = Math.max(16, w - (w % 2));
          h = Math.max(16, h - (h % 2));
          updates.customWidth = w;
          updates.customHeight = h;
          updates.width = w;
          updates.height = h;
        } else {
          updates.customWidth = null;
          updates.customHeight = null;
        }

        // 1. الاقتصاص المكاني الحر للفيديو
        if (selectedAspect === 'free-crop' && videoCropState) {
          const safeW = Math.max(16, videoCropState.width - (videoCropState.width % 2));
          const safeH = Math.max(16, videoCropState.height - (videoCropState.height % 2));
          const safeX = Math.max(0, videoCropState.x - (videoCropState.x % 2));
          const safeY = Math.max(0, videoCropState.y - (videoCropState.y % 2));
          updates.crop = {
            x: safeX,
            y: safeY,
            width: safeW,
            height: safeH,
            cropX: safeX,
            cropY: safeY,
            cropW: safeW,
            cropH: safeH
          };
        } else if (selectedAspect !== 'free-crop') {
          updates.crop = null;
        }

        // 2. التقطيع الزمني الدقيق للمدة
        const trimStartEl = document.getElementById('advTrimStart');
        const trimEndEl = document.getElementById('advTrimEnd');
        if (trimStartEl && trimEndEl) {
          const s = parseHmsToSec(trimStartEl.value);
          const e = parseHmsToSec(trimEndEl.value);
          const totalD = task.duration || 0;
          if (e > s && (s > 0 || (totalD > 0 && e < totalD))) {
            updates.startSec = s;
            updates.endSec = e;
            updates.trim = { start: s, end: e, startSec: s, endSec: e };
            updates.trimmedDuration = Math.round(e - s);
          } else {
            updates.startSec = null;
            updates.endSec = null;
            updates.trim = null;
            updates.trimmedDuration = null;
          }
        }

        // 3. مسارات الصوت والترجمة المدمجة والخارجية وموازنة الصوت وسرعة العرض
        const aTrack = document.getElementById('advAudioTrack');
        const subTrack = document.getElementById('advSubtitleTrack');
        const loudnormEl = document.getElementById('advLoudnorm');
        const speedEl = document.getElementById('advPlaybackSpeed');
        const subFontSizeEl = document.getElementById('advSubFontSize');
        const subPosEl = document.getElementById('advSubPosition');

        if (aTrack && aTrack.value !== undefined) updates.audioTrackIndex = aTrack.value;
        if (subTrack && subTrack.value !== undefined) {
          updates.subtitleTrackIndex = subTrack.value;
        }
        updates.subtitleMode = currentSubMode;
        updates.subtitlePath = externalSubPath || null;
        updates.subtitle = externalSubPath || null;
        updates.subtitleFontSize = subFontSizeEl ? parseInt(subFontSizeEl.value, 10) : subFontSizeVal;
        updates.subtitlePosition = subPosEl ? subPosEl.value : subPosVal;
        if (loudnormEl) updates.loudnorm = Boolean(loudnormEl.checked);
        if (speedEl) updates.playbackSpeed = parseFloat(speedEl.value) || 1;
      } else if (isAudio) {
        const aBitrate = document.getElementById('advAudioBitrate');
        const sRate = document.getElementById('advSampleRate');
        const loudnormEl = document.getElementById('advLoudnorm');
        const speedEl = document.getElementById('advPlaybackSpeed');
        if (aBitrate) updates.audioBitrate = aBitrate.value;
        if (sRate) updates.sampleRate = parseInt(sRate.value, 10);
        if (loudnormEl) updates.loudnorm = Boolean(loudnormEl.checked);
        if (speedEl) updates.playbackSpeed = parseFloat(speedEl.value) || 1;
      } else if (isImage) {
        const qual = document.getElementById('advQuality');
        const pSize = document.getElementById('advImgPresetSize');
        const wInput = document.getElementById('advImgWidth');
        const hInput = document.getElementById('advImgHeight');
        const aspect = document.getElementById('advImgAspect');
        const sharpen = document.getElementById('advImgSharpen');

        if (qual) updates.quality = parseInt(qual.value, 10);
        if (pSize) {
          updates.presetSize = pSize.value;
          if (pSize.value !== 'custom' && pSize.value !== 'original') {
            const PRESET_DIMS = {
              'a4-print-300': { w: 2480, h: 3508 },
              'a4-screen-150': { w: 1240, h: 1754 },
              'a5-print-300': { w: 1748, h: 2480 },
              'fhd-1080p': { w: 1920, h: 1080 },
              'insta-square': { w: 1080, h: 1080 },
              'story-shorts': { w: 1080, h: 1920 }
            };
            if (PRESET_DIMS[pSize.value]) {
              updates.width = PRESET_DIMS[pSize.value].w;
              updates.height = PRESET_DIMS[pSize.value].h;
            }
          } else if (pSize.value === 'original') {
            updates.width = null;
            updates.height = null;
          }
        }
        if (pSize && pSize.value === 'custom') {
          if (wInput && wInput.value) updates.width = parseInt(wInput.value, 10);
          if (hInput && hInput.value) updates.height = parseInt(hInput.value, 10);
          if (aspect) updates.maintainAspectRatio = Boolean(aspect.checked);
        }
        if (sharpen) updates.sharpen = Boolean(sharpen.checked);
        updates.rotate = selectedRotate;
        updates.flipH = flipH;
        updates.flipV = flipV;
        updates.crop = cropState;
      }

      window.appState.updateTask(taskIdToUpdate, {
        options: { ...taskRecord.options, ...updates },
        aspectPreset: updates.aspectPreset,
        fitMode: updates.fitMode
      });
      if (updates.aspectPreset !== undefined) taskRecord.aspectPreset = updates.aspectPreset;
      if (updates.fitMode !== undefined) taskRecord.fitMode = updates.fitMode;
      this.updateTaskComparisonDOM(taskRecord);

      this.closeAdvancedModal();
      this.showToast('تم حفظ الخيارات المتقدمة بنجاح ✓', 'success');
    };
  },

  closeAdvancedModal() {
    if (this.elements.advancedModal) {
      this.elements.advancedModal.classList.remove('open');
    }
    this.currentEditingTaskId = null;
  },

  // --- رسائل التنبيهات المنبثقة (Toasts) ---

  showToast(message, type = 'info') {
    const container = this.elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
      }, 300);
    }, 3500);
  }
};

window.uiController = uiController;
