// src/renderer/scripts/app.js

/**
 * نقطة انطلاق الواجهة وتفعيل السحب والإفلات والتحكم بالرتل
 */
document.addEventListener('DOMContentLoaded', () => {
  // تهيئة وحدة التحكم بالواجهة
  window.uiController.init();

  // الاشتراك في تحديثات متجر الحالة
  window.appState.subscribe((state) => {
    window.uiController.render(state);
  });

  // العرض الأولي
  window.uiController.render(window.appState);

  // 1. ربط أزرار التنقل في الشريط الجانبي
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.getAttribute('data-section');
      if (section) {
        if (window.uiController && typeof window.uiController.stopAudioPreview === 'function') {
          window.uiController.stopAudioPreview();
        }
        window.appState.setSection(section);
      }
    });
  });

  // 2. إصلاح ومعالجة السحب والإفلات الشامل (Drag & Drop Fix)
  const preventDragDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDragDefaults, false);
    document.addEventListener(eventName, preventDragDefaults, false);
    document.body.addEventListener(eventName, preventDragDefaults, false);
  });

  const dragOverlay = document.getElementById('dragOverlay');
  const dropZone = document.getElementById('dropZone');

  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    preventDragDefaults(e);
    dragCounter++;
    if (dragOverlay) {
      dragOverlay.classList.add('active');
    }
  }, false);

  window.addEventListener('dragleave', (e) => {
    preventDragDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (dragOverlay) {
        dragOverlay.classList.remove('active');
      }
    }
  }, false);

  window.addEventListener('dragover', (e) => {
    preventDragDefaults(e);
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, false);

  const showToast = (msg, type = 'info') => {
    if (window.uiController && typeof window.uiController.showToast === 'function') {
      window.uiController.showToast(msg, type);
    }
  };

  /**
   * تسجيل وإدراج حزمة مسارات ملفات في رتل المهام والتحقق من صلاحيتها
   */
  const handleFileBatchAddition = async (filePaths = []) => {
    if (!filePaths || filePaths.length === 0) return 0;
    const res = await window.ipcClient.dropFiles(filePaths);
    if (res && res.success && res.files && res.files.length > 0) {
      let filesToAdd = res.files;
      const pdfFiles = res.files.filter(f => (f.extension || '').toLowerCase().replace(/^\./, '') === 'pdf');
      if (pdfFiles.length > 0) {
        showToast('محول المستندات مخصص لتحويل ملفات Word (DOCX / DOC) إلى PDF فقط. ملفات PDF غير مدعومة كمدخلات.', 'error');
        filesToAdd = res.files.filter(f => (f.extension || '').toLowerCase().replace(/^\./, '') !== 'pdf');
      }
      if (filesToAdd.length > 0) {
        const added = window.appState.addFiles(filesToAdd);
        return added;
      }
    }
    return 0;
  };
  window.handleFileBatchAddition = handleFileBatchAddition;

  /**
   * استخراج المسارات الحقيقية للملفات المسقطة عبر webUtils.getPathForFile
   */
  const handleDrop = async (e) => {
    preventDragDefaults(e);
    dragCounter = 0;
    if (dragOverlay) {
      dragOverlay.classList.remove('active');
    }

    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;

    const filePaths = [];

    for (let i = 0; i < dt.files.length; i++) {
      const file = dt.files[i];
      let realPath = '';

      // استخراج المسار عبر دالة getPathForFile الممررة من preload
      if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
        try {
          realPath = window.electronAPI.getPathForFile(file);
        } catch (err) {
          console.warn('فشل getPathForFile:', err);
        }
      }

      // Fallback في حال كانت الخاصية متاحة مباشرة
      if (!realPath && file.path) {
        realPath = file.path;
      }

      if (realPath) {
        filePaths.push(realPath);
      }
    }

    if (filePaths.length === 0) return;

    const added = await handleFileBatchAddition(filePaths);
    if (added > 0) {
      showToast(`تم التعرف على وإضافة ${added} ملف إلى رتل المعالجة`, 'info');
    }
  };

  window.addEventListener('drop', handleDrop, false);
  if (dragOverlay) dragOverlay.addEventListener('drop', handleDrop, false);
  if (dropZone) dropZone.addEventListener('drop', handleDrop, false);

  // 2.1 دعم اللصق السريع من الحافظة (Clipboard Paste Support via Ctrl+V)
  window.addEventListener('paste', async (e) => {
    // عدم اعتراض اللصق العادي إذا كان التركيز في حقل إدخال نصي
    const activeEl = document.activeElement;
    const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeEl?.isContentEditable) {
      if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) {
        return;
      }
    }

    // الحالة 1: لصق ملفات تم نسخها من مستكشف ويندوز (Windows Explorer Files)
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const paths = Array.from(e.clipboardData.files).map(f => {
        let p = '';
        if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
          try { p = window.electronAPI.getPathForFile(f); } catch (err) {}
        }
        return p || f.path || '';
      }).filter(Boolean);

      if (paths.length > 0) {
        const added = await handleFileBatchAddition(paths);
        if (added > 0) {
          showToast(`تم لصق وإضافة ${paths.length} ملف بنجاح!`, 'success');
        }
        return;
      }
    }

    // الحالة 2: لصق صورة خام (Raw Image/Screenshot من الحافظة)
    if (window.electronAPI?.clipboard?.readImage) {
      const clipboardImage = await window.electronAPI.clipboard.readImage();
      if (clipboardImage && !clipboardImage.isEmpty) {
        e.preventDefault();
        const tempFilePath = await window.electronAPI.clipboard.saveTempImage(clipboardImage.dataUrl);
        if (tempFilePath) {
          await handleFileBatchAddition([tempFilePath]);
          showToast('تم إدراج لقطة الشاشة من الحافظة وجاهزة للتحويل!', 'success');
        }
      }
    }
  });

  // 3. أزرار اختيار الملفات والمجلدات
  const handleSelectFiles = async () => {
    // في المحول الشامل نطلب 'all'، وفي الأقسام المتخصصة نحدد النوع
    const reqType = window.appState.currentSection === 'universal' ? 'all' : window.appState.currentSection;
    const res = await window.ipcClient.selectFiles(reqType);
    if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
      const probed = await window.ipcClient.dropFiles(res.filePaths);
      if (probed.success && probed.files && probed.files.length > 0) {
        let filesToAdd = probed.files;
        const pdfFiles = probed.files.filter(f => (f.extension || '').toLowerCase().replace(/^\./, '') === 'pdf');
        if (pdfFiles.length > 0) {
          window.uiController.showToast('محول المستندات مخصص لتحويل ملفات Word (DOCX / DOC) إلى PDF فقط. ملفات PDF غير مدعومة كمدخلات.', 'error');
          filesToAdd = probed.files.filter(f => (f.extension || '').toLowerCase().replace(/^\./, '') !== 'pdf');
        }
        if (filesToAdd.length > 0) {
          const added = window.appState.addFiles(filesToAdd);
          if (added > 0) {
            window.uiController.showToast(`تمت إضافة ${added} ملف بنجاح`, 'info');
          }
        }
      }
    }
  };

  const handleSelectFolder = async () => {
    const res = await window.ipcClient.selectFolder();
    if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
      const probed = await window.ipcClient.dropFiles(res.filePaths);
      if (probed.success && probed.files && probed.files.length > 0) {
        const added = window.appState.addFiles(probed.files);
        window.uiController.showToast(`تم مسح المجلد وإضافة ${added} ملف متوافق`, 'info');
      }
    }
  };

  document.getElementById('btnSelectFiles')?.addEventListener('click', handleSelectFiles);
  document.getElementById('btnSelectFolder')?.addEventListener('click', handleSelectFolder);
  document.getElementById('btnAddMoreFiles')?.addEventListener('click', handleSelectFiles);

  // 4. تغيير مجلد الإخراج
  document.getElementById('btnChangeOutputFolder')?.addEventListener('click', async () => {
    const res = await window.ipcClient.selectFolder();
    if (!res.canceled && res.folder) {
      window.appState.setOutputFolder(res.folder);
      const textEl = document.getElementById('outputFolderText');
      if (textEl) textEl.textContent = res.folder;
      window.uiController.showToast('تم تحديث مجلد الحفظ الافتراضي', 'success');
    }
  });

  // 5. شريط التحكم الجماعي
  document.getElementById('globalFormatSelect')?.addEventListener('change', (e) => {
    window.appState.globalTargetFormat = e.target.value;
  });

  document.getElementById('btnClearAll')?.addEventListener('click', async () => {
    if (window.uiController && typeof window.uiController.stopAudioPreview === 'function') {
      window.uiController.stopAudioPreview();
    }
    if (window.appState.isProcessing) {
      await window.ipcClient.cancelAll();
    }
    window.appState.clearTasks();
    window.uiController.showToast('تم إفراغ رتل المعالجة', 'info');
  });

  document.getElementById('btnStartAll')?.addEventListener('click', async () => {
    const readyTasks = window.appState.getFilteredTasks().filter(t => t.status === 'READY' || t.status === 'IDLE');
    if (readyTasks.length === 0) {
      const msg = window.appState.currentSection === 'compressor' ? 'لا توجد ملفات جديدة بحاجة للضغط' : 'لا توجد ملفات جديدة بحاجة للتحويل';
      window.uiController.showToast(msg, 'info');
      return;
    }

    window.appState.isProcessing = true;
    window.uiController.render(window.appState);

    for (const task of readyTasks) {
      // قراءة الصيغة المحدثة لكل بطاقة أثناء الإرسال للمحرك
      const currentTask = window.appState.tasks.find(t => t.taskId === task.taskId) || task;
      window.appState.updateTask(currentTask.taskId, { status: 'QUEUED' });
      await window.ipcClient.startConversion({
        taskId: currentTask.taskId,
        inputPath: currentTask.filePath,
        targetFormat: currentTask.targetFormat,
        options: currentTask.options || {},
        outputFolder: window.appState.outputFolder || null
      });
    }
  });

  // 6. الاستماع لأحداث البث من المسار الرئيسي (IPC Events)
  window.ipcClient.onProgress((data) => {
    window.uiController.updateTaskProgressDOM(data);

    const task = window.appState.tasks.find(t => t.taskId === data.taskId);
    if (task) {
      task.status = 'PROCESSING';
      task.progress = data.percent;
      task.speed = data.speed;
      task.eta = data.eta;
      task.timemark = data.timemark;
    }
  });

  window.ipcClient.onComplete((data) => {
    window.appState.updateTask(data.taskId, {
      status: 'COMPLETED',
      progress: 100,
      outputPath: data.outputPath,
      finalSize: data.finalSize,
      duration: data.duration
    });
    const task = window.appState.tasks.find(t => t.taskId === data.taskId);
    if (task) {
      if (task.isCompressor || task.options?.isCompression) {
        window.uiController.updateCompressorTaskDOM(task);
      } else {
        window.uiController.updateTaskComparisonDOM(task);
      }
    }
    const successMsg = (task && (task.isCompressor || task.options?.isCompression))
      ? 'اكتمل ضغط الملف بنجاح ✓'
      : 'اكتمل تحويل ملف بنجاح ✓';
    window.uiController.showToast(successMsg, 'success');
  });

  window.ipcClient.onError((data) => {
    window.appState.updateTask(data.taskId, {
      status: 'FAILED',
      errorMessage: data.errorMessage
    });
    window.uiController.showToast(`خطأ في التحويل: ${data.errorMessage}`, 'error');
  });
});
