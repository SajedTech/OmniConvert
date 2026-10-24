// audit-test.js
/**
 * Automated E2E & Integrity Audit Test
 * Open-UniConverter - UI/UX & Backend Pipeline Verification
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    failedTests++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('========================================================');
console.log('   Open-UniConverter Automated E2E & Integrity Audit   ');
console.log('========================================================\n');

// -----------------------------------------------------------------------------
// 1. فحص سلامة عناصر الـ DOM والتكامل مع كود JavaScript (Static DOM Integrity)
// -----------------------------------------------------------------------------
console.log('[1/5] Checking DOM Element IDs & Script References...');

const htmlContent = fs.readFileSync(path.join(__dirname, 'src/renderer/index.html'), 'utf8');
const idMatches = htmlContent.match(/id=["']([^"']+)["']/g) || [];
const domIds = new Set(idMatches.map(m => m.replace(/id=["']/, '').replace(/["']/, '')));

const uiControllerCode = fs.readFileSync(path.join(__dirname, 'src/renderer/scripts/ui-controller.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, 'src/renderer/scripts/app.js'), 'utf8');

const idRefRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
const referencedIds = new Set();
let match;
while ((match = idRefRegex.exec(uiControllerCode)) !== null) {
  referencedIds.add(match[1]);
}
while ((match = idRefRegex.exec(appCode)) !== null) {
  referencedIds.add(match[1]);
}

// عناصر ديناميكية يتم إنشاؤها في وقت التشغيل داخل الـ Modal أو البطاقات
const dynamicRuntimeIds = new Set([
  'crfVal', 'advCrf', 'advVideoCodec', 'advResolution', 'advAudioBitrate',
  'advSampleRate', 'advQuality', 'qualityVal', 'advScale', 'advFit',
  'advImgPresetSize', 'advCustomDimsGroup', 'advImgWidth', 'advImgHeight',
  'advImgAspect', 'advImgDimPreview', 'advImgSharpen', 'btnFlipH', 'btnFlipV',
  'advImgPreviewStage', 'btnClearHistory', 'btnRefreshHistory', 'historyTableBody',
  'settingOutputPath', 'btnBrowseOutputFolder',
  'advVideoPreviewBox', 'advVideoPreviewFrame', 'advVideoAspectIndicator',
  'advVideoAspectGroup', 'advVideoDimPreview', 'advVideoPlayer',
  'cropperStage', 'cropBox', 'cropDimBadge', 'btnResetCrop',
  'cropBoxVideo', 'cropDimBadgeVideo', 'btnResetVideoCrop',
  'advTrimStart', 'advTrimEnd', 'advTrimDurationText',
  'btnTrimCurrentStart', 'btnTrimCurrentEnd',
  'advVideoFitModeGroup', 'btnFitLetterbox', 'btnFillCrop',
  'advCropLockRatioGroup', 'btnLockFree', 'btnLockShorts', 'btnLockYT', 'btnLockSquare',
  'advAudioTrackGroup', 'advAudioTrack', 'advSubtitleTrackGroup', 'advSubtitleTrack',
  'advSubtitleModeGroup', 'btnSubModeSoft', 'btnSubModeBurn', 'advLoudnorm', 'advPlaybackSpeed', 'btnSampleRender',
  'btnImportSubtitle', 'btnClearSubtitle', 'advSelectedSubBadge', 'advSelectedSubName',
  'advSubtitleStylePanel', 'advSubFontSize', 'subFontSizeVal', 'advSubPosition',
  'advSubtitlePreviewOverlay',
  'advVideoControls', 'advVideoControlsBox', 'advBtnPlayPause', 'advBtnSeekBack', 'advBtnSeekForward',
  'advBtnPrevFrame', 'advBtnNextFrame', 'btnVideoCustomDims', 'advVideoCustomDimsGroup',
  'advVideoCustomWidth', 'advVideoCustomHeight', 'btnLockVideoRatio',
  'advVideoTimeline', 'advVideoTimeDisplay',
  'advDocPageSize', 'advDocMargin', 'btnDocPortrait', 'btnDocLandscape',
  'aboutSection'
]);

for (const refId of referencedIds) {
  if (dynamicRuntimeIds.has(refId)) continue;
  assert(domIds.has(refId), `Referenced DOM ID '${refId}' exists in index.html`);
}

// -----------------------------------------------------------------------------
// محاكاة بيئة المتصفح الخفيفة لاختبار منطق UI Controller و State
// -----------------------------------------------------------------------------
class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.attributes = new Map();
    this.eventListeners = new Map();
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.title = '';
  }

  focus() {}
  blur() {}

  contains(node) {
    if (this === node) return true;
    for (const child of this.children) {
      if (child === node) return true;
      if (child.contains && child.contains(node)) return true;
    }
    return false;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    return child;
  }

  removeEventListener(evt, fn) {
    if (!this.eventListeners.has(evt)) return;
    const list = this.eventListeners.get(evt);
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    this.children = [];
  }

  setAttribute(k, v) {
    this.attributes.set(k, v);
  }

  getAttribute(k) {
    return this.attributes.get(k) || null;
  }

  addEventListener(evt, fn) {
    if (!this.eventListeners.has(evt)) this.eventListeners.set(evt, []);
    this.eventListeners.get(evt).push(fn);
  }

  dispatchEvent(evtName) {
    const list = this.eventListeners.get(evtName) || [];
    list.forEach(fn => fn({ target: this, preventDefault: () => {}, stopPropagation: () => {} }));
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  querySelector(sel) {
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      if (this.id === targetId) return this;
      if (this._innerHTML && this._innerHTML.includes(`id="${targetId}"`)) {
        return getOrCreateMockElement(targetId);
      }
      for (const ch of this.children) {
        const found = ch.querySelector ? ch.querySelector(sel) : null;
        if (found) return found;
      }
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) return this;
      if (this._innerHTML && (this._innerHTML.includes(`class="${cls}`) || this._innerHTML.includes(`class='${cls}`) || this._innerHTML.includes(cls))) {
        const mockEl = new MockElement();
        mockEl.classList.add(cls);
        const titleMatch = this._innerHTML.match(new RegExp(`<[^>]*class=["'][^"']*${cls}[^"']*["'][^>]*title=["']([^"']*)["']`));
        if (titleMatch) {
          mockEl.title = titleMatch[1];
          mockEl.setAttribute('title', titleMatch[1]);
        }
        return mockEl;
      }
      for (const ch of this.children) {
        const found = ch.querySelector ? ch.querySelector(sel) : null;
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(sel) {
    const results = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) results.push(this);
      for (const ch of this.children) {
        if (ch.querySelectorAll) results.push(...ch.querySelectorAll(sel));
      }
    }
    return results;
  }
}

const mockElementsMap = new Map();
function getOrCreateMockElement(id) {
  if (!mockElementsMap.has(id)) {
    mockElementsMap.set(id, new MockElement(id));
  }
  return mockElementsMap.get(id);
}

// إعداد بيئة window و document
const mockStorage = new Map();
const mockLocalStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};

const mockWindow = {
  ipcClient: {
    getGpuStatus: async () => ({ hasGpu: true, h264_nvenc: true })
  },
  localStorage: mockLocalStorage,
  appState: null,
  uiController: null
};

// إنشاء أزرار الشريط الجانبي في المودال
const sidebarBtns = ['video', 'audio', 'image', 'document'].map(cat => {
  const el = new MockElement('', 'button');
  el.classList.add('picker-nav-btn');
  el.setAttribute('data-category', cat);
  return el;
});

const mockDocument = {
  getElementById: (id) => getOrCreateMockElement(id),
  querySelectorAll: (sel) => {
    if (sel === '.picker-nav-btn') return sidebarBtns;
    if (sel === '.nav-item') {
      return ['universal', 'video', 'audio', 'image', 'document', 'compressor'].map(sec => {
        const el = getOrCreateMockElement(`nav${sec.charAt(0).toUpperCase() + sec.slice(1)}`);
        el.setAttribute('data-section', sec);
        el.classList.add('nav-item');
        return el;
      });
    }
    return [];
  },
  createElement: (tag) => new MockElement('', tag),
  addEventListener: () => {}
};

// تحميل وتشغيل state.js و ui-controller.js داخل سياق VM
const sandbox = {
  console,
  module: { exports: {} },
  window: mockWindow,
  document: mockDocument,
  localStorage: mockLocalStorage,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
vm.createContext(sandbox);

const stateCode = fs.readFileSync(path.join(__dirname, 'src/renderer/scripts/state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);
vm.runInContext(uiControllerCode, sandbox);

const appState = sandbox.window.appState;
const uiController = sandbox.window.uiController;
uiController.init();
appState.subscribe((state) => {
  uiController.render(state);
});

// -----------------------------------------------------------------------------
// 2. فحص نافذة اختيار الصيغ الحساسة للسياق (Context-Aware Format Picker)
// -----------------------------------------------------------------------------
console.log('\n[2/5] Testing Context-Aware Format Picker Modal...');

// حالة أ: إدخال صورة (Image Context)
const sampleImageTask = {
  taskId: 'task_img_test_1',
  name: 'camera_raw_shot.cr2',
  filePath: 'C:\\Users\\Photos\\camera_raw_shot.cr2',
  type: 'image-raw',
  extension: 'cr2',
  size: 25 * 1024 * 1024,
  dimensions: { width: 6000, height: 4000 },
  targetFormat: 'png',
  presetId: 'img-lossless-100',
  options: {},
  status: 'IDLE'
};
appState.tasks.push(sampleImageTask);

uiController.formatPicker.open(sampleImageTask);

const btnVideo = sidebarBtns.find(b => b.getAttribute('data-category') === 'video');
const btnAudio = sidebarBtns.find(b => b.getAttribute('data-category') === 'audio');
const btnImage = sidebarBtns.find(b => b.getAttribute('data-category') === 'image');
const btnDoc = sidebarBtns.find(b => b.getAttribute('data-category') === 'document');

assert(btnVideo.style.display === 'none', 'Image Task: Video category is completely hidden');
assert(btnAudio.style.display === 'none', 'Image Task: Audio category is completely hidden');
assert(btnImage.style.display === 'flex', 'Image Task: Image category is visible');
assert(btnDoc.style.display === 'flex', 'Image Task: Document category (PDF export option) is visible');
assert(uiController.formatPicker.currentCategory === 'image', 'Image Task: Automatically activates image tab');

// التحقق من خيارات تصدير الصور المتاحة الـ 9 (بما فيها TGA و GIF)
const gridContainer = mockDocument.getElementById('formatGridContainer');
const renderedFormats = gridContainer.children.map(ch => {
  const nameEl = ch.querySelector ? ch.querySelector('.fmt-card-name') : null;
  return ch.innerHTML.match(/<span class="fmt-card-name">([^<]+)<\/span>/)?.[1] || '';
});

const requiredImageFormats = ['PNG', 'JPG', 'WEBP', 'AVIF', 'BMP', 'ICO', 'TIFF', 'GIF', 'TGA'];
const uppercaseRendered = renderedFormats.map(f => f.toUpperCase());
for (const fmt of requiredImageFormats) {
  assert(uppercaseRendered.includes(fmt), `Image export targets contain format '${fmt}'`);
}

// التحقق من بطاقات الصيغ النظيفة (خلوها من فقرات النصوص الطويلة .fmt-card-desc)
for (const card of gridContainer.children) {
  assert(!card.innerHTML.includes('fmt-card-desc'), 'Format card is clean without long distracting text paragraphs');
  assert(card.title && card.title.length > 5, 'Detailed description is preserved in hover title tooltip');
}

// حالة ب: إدخال فيديو (Video Context)
const sampleVideoTask = {
  taskId: 'task_vid_test_1',
  name: 'movie_clip.mp4',
  filePath: 'C:\\Videos\\movie_clip.mp4',
  type: 'video',
  extension: 'mp4',
  size: 500 * 1024 * 1024,
  duration: 7200,
  dimensions: { width: 1920, height: 1080 },
  targetFormat: 'mp4',
  presetId: 'video-source',
  options: { resolution: 'source' },
  status: 'IDLE'
};
appState.tasks.push(sampleVideoTask);

uiController.formatPicker.open(sampleVideoTask);

assert(btnVideo.style.display === 'flex', 'Video Task: Video category is visible');
assert(btnAudio.style.display === 'flex', 'Video Task: Audio category (for extraction) is visible');
assert(btnImage.style.display === 'none', 'Video Task: Image category is hidden');
assert(btnDoc.style.display === 'none', 'Video Task: Document category is hidden');

// -----------------------------------------------------------------------------
// 3. فحص اتجاه السهم RTL وحساب الحجم التقديري في بطاقة الرتل
// -----------------------------------------------------------------------------
console.log('\n[3/5] Testing Queue Card RTL Arrow & Estimation Layout...');

const cardElement = uiController.createTaskCardElement(sampleVideoTask);
const cardHtml = cardElement.innerHTML;

// التحقق من اتجاه السهم
assert(cardHtml.includes('<span class="arrow-glyph">←</span>'), 'Comparison arrow points to the left (←) matching Arabic RTL flow');

// التحقق من الحساب التقديري وعلامة التقريب ~
const estOutput = uiController.calculateEstimatedOutput(sampleVideoTask);
assert(estOutput.size.startsWith('~ '), `Estimated size uses clean approximation symbol: ${estOutput.size}`);
assert(!estOutput.size.includes('تقديري'), 'Word "تقديري" is removed from size label');

// -----------------------------------------------------------------------------
// 4. فحص نافذة خيارات الصورة والفيديو المتقدمة، القص الحر ونسب الأبعاد
// -----------------------------------------------------------------------------
console.log('\n[4/5] Testing Image Cropper & Video Aspect Ratio Modals...');

// أ: فحص مودال الصورة والقص الحر التفاعلي
uiController.openAdvancedModal(sampleImageTask);

const modalBody = mockDocument.getElementById('modalBody');
const modalBodyHtml = modalBody.innerHTML;

// التحقق من مساحة المعاينة الحية وإطار الاقتصاص الحر
assert(modalBodyHtml.includes('id="advImgPreviewStage"'), 'Live preview stage image exists in modal');
assert(modalBodyHtml.includes('id="cropperStage"'), 'Interactive cropper stage container exists');
assert(modalBodyHtml.includes('id="cropBox"'), 'Crop box element exists in modal');
assert(modalBodyHtml.includes('id="cropDimBadge"'), 'Live floating crop dimension badge exists');
assert(modalBodyHtml.includes('class="crop-handle handle-nw"'), 'White corner bracket handles exist (NW/NE/SE/SW)');
assert(modalBodyHtml.includes('id="btnResetCrop"'), 'Reset crop button (إعادة تعيين القص) exists');
assert(modalBodyHtml.includes('media-stream://stream?path='), 'Preview image loads directly via media-stream:// protocol');

// التحقق من ربط النقر بزر حفظ الخيارات وتحديث الـ State
const modalSaveBtn = mockDocument.getElementById('modalSaveBtn');
assert(typeof modalSaveBtn.onclick === 'function', 'modalSaveBtn.onclick handler is successfully registered');

// محاكاة إعدادات في الـ DOM
const advQualityInput = new MockElement('advQuality');
advQualityInput.value = '72';
mockElementsMap.set('advQuality', advQualityInput);

const advPresetSizeSelect = new MockElement('advImgPresetSize');
advPresetSizeSelect.value = 'a4-print-300';
mockElementsMap.set('advImgPresetSize', advPresetSizeSelect);

const advSharpenCheckbox = new MockElement('advImgSharpen');
advSharpenCheckbox.checked = true;
mockElementsMap.set('advImgSharpen', advSharpenCheckbox);

// استدعاء الحفظ
modalSaveBtn.onclick();

// التأكد من تحديث المهمة داخل appState
const updatedTask = appState.tasks.find(t => t.taskId === sampleImageTask.taskId);
assert(updatedTask.options.quality === 72, 'Save updates task quality in state');
assert(updatedTask.options.presetSize === 'a4-print-300', 'Save updates presetSize in state');
assert(updatedTask.options.sharpen === true, 'Save updates sharpen filter in state');

// التحقق من حساب تقدير القص في البطاقة
const taskWithCrop = {
  ...sampleImageTask,
  options: {
    ...sampleImageTask.options,
    crop: { left: 40, top: 50, width: 600, height: 400 }
  }
};
const cropEst = uiController.calculateEstimatedOutput(taskWithCrop);
assert(cropEst.dim === '600×400 (مقصوص)', `Task card estimation reflects crop dimensions: ${cropEst.dim}`);

// ب: فحص مودال الفيديو ونسب الأبعاد الفورية (Aspect Ratio Preview)
uiController.openAdvancedModal(sampleVideoTask);
const vidModalHtml = modalBody.innerHTML;

assert(vidModalHtml.includes('id="advVideoPreviewBox"'), 'Video preview wrapper (#advVideoPreviewBox) exists');
assert(vidModalHtml.includes('id="advVideoPreviewFrame"'), 'Animated geometric frame (#advVideoPreviewFrame) exists');
assert(vidModalHtml.includes('id="advVideoAspectIndicator"'), 'Video aspect indicator badge exists');
assert(vidModalHtml.includes('data-aspect="16:9"'), '16:9 YouTube aspect ratio button exists');
assert(vidModalHtml.includes('data-aspect="9:16"'), '9:16 TikTok / Shorts aspect ratio button exists');
assert(vidModalHtml.includes('data-aspect="1:1"'), '1:1 Instagram Square aspect ratio button exists');
assert(vidModalHtml.includes('data-aspect="4:3"'), '4:3 Classic aspect ratio button exists');
assert(vidModalHtml.includes('data-aspect="free-crop"'), 'Free crop aspect ratio button exists');
assert(vidModalHtml.includes('id="cropBoxVideo"'), 'Video crop box element exists');
assert(vidModalHtml.includes('id="cropDimBadgeVideo"'), 'Video crop dimension badge exists');
assert(vidModalHtml.includes('id="btnResetVideoCrop"'), 'Reset video crop button exists');
assert(vidModalHtml.includes('id="advTrimStart"'), 'Trim start time input exists');
assert(vidModalHtml.includes('id="advTrimEnd"'), 'Trim end time input exists');
assert(vidModalHtml.includes('id="btnTrimCurrentStart"'), 'Current time capture button (Start) exists');
assert(vidModalHtml.includes('id="btnTrimCurrentEnd"'), 'Current time capture button (End) exists');
assert(vidModalHtml.includes('id="advTrimDurationText"'), 'Trimmed duration dynamic text element exists');
assert(vidModalHtml.includes('id="advVideoFitModeGroup"'), 'Fit/Fill mode toggle group container exists');
assert(vidModalHtml.includes('id="btnFitLetterbox"'), 'Fit/Letterbox button exists');
assert(vidModalHtml.includes('id="btnFillCrop"'), 'Fill/Crop button exists');
assert(vidModalHtml.includes('id="advCropLockRatioGroup"'), 'Crop lock ratio buttons container exists');
assert(vidModalHtml.includes('id="btnLockFree"'), 'Lock Free button exists');
assert(vidModalHtml.includes('id="btnLockShorts"'), 'Lock Shorts 9:16 button exists');
assert(vidModalHtml.includes('id="btnLockYT"'), 'Lock YouTube 16:9 button exists');
assert(vidModalHtml.includes('id="btnLockSquare"'), 'Lock Square 1:1 button exists');
assert(vidModalHtml.includes('id="advSubtitlePreviewOverlay"'), 'Subtitle live preview overlay (#advSubtitlePreviewOverlay) exists');
assert(vidModalHtml.includes('id="btnImportSubtitle"'), 'Import subtitle button (#btnImportSubtitle) exists');
assert(vidModalHtml.includes('id="btnClearSubtitle"'), 'Clear subtitle button (#btnClearSubtitle) exists');
assert(vidModalHtml.includes('id="advSelectedSubBadge"'), 'Selected subtitle badge (#advSelectedSubBadge) exists');
assert(vidModalHtml.includes('id="advSubtitleStylePanel"'), 'Subtitle style panel (#advSubtitleStylePanel) exists');
assert(vidModalHtml.includes('id="advSubFontSize"'), 'Subtitle font size slider (#advSubFontSize) exists');
assert(vidModalHtml.includes('id="advSubPosition"'), 'Subtitle position selector (#advSubPosition) exists');
assert(vidModalHtml.includes('id="advVideoControlsBox"'), 'Video player controls box (#advVideoControlsBox) exists');
assert(vidModalHtml.includes('class="timeline-row"'), 'Timeline row (.timeline-row) exists');
assert(vidModalHtml.includes('class="controls-button-row"'), 'Controls button row (.controls-button-row) exists');
assert(vidModalHtml.includes('id="advVideoControls"'), 'Video player controls (#advVideoControls) exists');
assert(vidModalHtml.includes('id="advBtnPlayPause"'), 'Play/Pause button (#advBtnPlayPause) exists');
assert(vidModalHtml.includes('id="advBtnSeekBack"'), 'Seek -5s button (#advBtnSeekBack) exists');
assert(vidModalHtml.includes('id="advBtnSeekForward"'), 'Seek +5s button (#advBtnSeekForward) exists');
assert(vidModalHtml.includes('id="advBtnPrevFrame"'), 'Previous frame button (#advBtnPrevFrame) exists');
assert(vidModalHtml.includes('id="advBtnNextFrame"'), 'Next frame button (#advBtnNextFrame) exists');
assert(vidModalHtml.includes('id="btnVideoCustomDims"'), 'Custom dimensions aspect button (#btnVideoCustomDims) exists');
assert(vidModalHtml.includes('id="advVideoCustomDimsGroup"'), 'Video custom dimensions group container exists');
assert(vidModalHtml.includes('id="advVideoCustomWidth"'), 'Video custom width input exists');
assert(vidModalHtml.includes('id="advVideoCustomHeight"'), 'Video custom height input exists');
assert(vidModalHtml.includes('id="btnLockVideoRatio"'), 'Video ratio lock button exists');
assert(vidModalHtml.includes('id="advVideoTimeline"'), 'Video timeline slider (#advVideoTimeline) exists');
assert(vidModalHtml.includes('id="advVideoTimeDisplay"'), 'Video time display (#advVideoTimeDisplay) exists');

// فحص قارئ ومحلل ملفات الترجمة (SRT / VTT Parser)
const sampleSrt = `1
00:00:01,500 --> 00:00:04,200
مرحبا بكم في التطبيق

2
00:00:05,000 --> 00:00:08,000
تحويل سريع وعالي الجودة`;
const srtCues = uiController.parseSubtitleContent(sampleSrt);
assert(srtCues.length === 2, 'Parsed 2 cues from sample SRT');
assert(srtCues[0].start === 1.5, `Cue 1 start time is 1.5s: ${srtCues[0].start}`);
assert(srtCues[0].end === 4.2, `Cue 1 end time is 4.2s: ${srtCues[0].end}`);
assert(srtCues[0].text === 'مرحبا بكم في التطبيق', `Cue 1 text parsed correctly: ${srtCues[0].text}`);
assert(srtCues[1].start === 5.0, `Cue 2 start time is 5.0s: ${srtCues[1].start}`);

const sampleVtt = `WEBVTT

00:02.000 --> 00:05.500
<i>تجربة VTT ناصعة</i>`;
const vttCues = uiController.parseSubtitleContent(sampleVtt);
assert(vttCues.length === 1, 'Parsed 1 cue from sample VTT');
assert(vttCues[0].start === 2.0, `VTT start time is 2.0s: ${vttCues[0].start}`);
assert(vttCues[0].text === 'تجربة VTT ناصعة', `VTT tags stripped and text parsed correctly: ${vttCues[0].text}`);

// محاكاة اختيار نسبة أبعاد 9:16 وحفظها
const advCrfInput = new MockElement('advCrf');
advCrfInput.value = '21';
mockElementsMap.set('advCrf', advCrfInput);

const advVideoCodecSelect = new MockElement('advVideoCodec');
advVideoCodecSelect.value = 'libx264';
mockElementsMap.set('advVideoCodec', advVideoCodecSelect);

const advResolutionSelect = new MockElement('advResolution');
advResolutionSelect.value = '1080p';
mockElementsMap.set('advResolution', advResolutionSelect);

const advAudioBitrateSelect = new MockElement('advAudioBitrate');
advAudioBitrateSelect.value = '256k';
mockElementsMap.set('advAudioBitrate', advAudioBitrateSelect);

// حفظ إعدادات الفيديو
modalSaveBtn.onclick();

const updatedVidTask = appState.tasks.find(t => t.taskId === sampleVideoTask.taskId);
assert(updatedVidTask.options.crf === 21, 'Save updates video CRF in state');
assert(updatedVidTask.options.resolution === '1080p', 'Save updates video resolution in state');
assert(updatedVidTask.options.aspectPreset === 'source' || updatedVidTask.options.aspectPreset, 'aspectPreset saved in state');
assert(updatedVidTask.options.fitMode === 'fit' || updatedVidTask.options.fitMode === 'fill', 'fitMode saved in state');

// التحقق من حساب تقدير نسبة أبعاد الفيديو في البطاقة بنمطي Fit و Fill
const taskWithAspectFit = {
  ...sampleVideoTask,
  options: {
    ...sampleVideoTask.options,
    aspectRatio: '9:16',
    resolution: '1080p',
    fitMode: 'fit'
  }
};
const vidAspectEstFit = uiController.calculateEstimatedOutput(taskWithAspectFit);
assert(vidAspectEstFit.dim.includes('9:16 TikTok'), `Card estimation accurately reflects 9:16 TikTok ratio: ${vidAspectEstFit.dim}`);
assert(vidAspectEstFit.dim.includes('حواف سوداء'), `Card estimation reflects fit mode [حواف سوداء]: ${vidAspectEstFit.dim}`);

const taskWithAspectFill = {
  ...sampleVideoTask,
  options: {
    ...sampleVideoTask.options,
    aspectRatio: '9:16',
    resolution: '1080p',
    fitMode: 'fill'
  }
};
const vidAspectEstFill = uiController.calculateEstimatedOutput(taskWithAspectFill);
assert(vidAspectEstFill.dim.includes('ملء وقص'), `Card estimation reflects fill mode [ملء وقص]: ${vidAspectEstFill.dim}`);

// فحص محرك التحويل الخلفي لنمطي Fit و Fill في FFmpeg
const mediaEngineAudit = require('./src/main/engines/media-engine');
class MockFfmpegCommandAudit {
  constructor() {
    this._videoFilters = [];
    this._outputOptions = [];
  }
  videoFilters(filters) {
    this._videoFilters.push(...filters);
    return this;
  }
  outputOptions(opts) {
    this._outputOptions.push(...opts);
    return this;
  }
  videoCodec() { return this; }
  audioCodec() { return this; }
  audioBitrate() { return this; }
  fps() { return this; }
}

const cmdFill = new MockFfmpegCommandAudit();
mediaEngineAudit.configureFfmpegOptions(cmdFill, 'mp4', {
  aspectRatio: '9:16',
  resolution: '1080p',
  fitMode: 'fill'
});
assert(cmdFill._videoFilters.some(f => f.includes('force_original_aspect_ratio=increase')), 'Fill mode uses force_original_aspect_ratio=increase');
assert(cmdFill._videoFilters.some(f => f.startsWith('crop=1080:1920')), 'Fill mode applies crop filter to dimensions');

const cmdFit = new MockFfmpegCommandAudit();
mediaEngineAudit.configureFfmpegOptions(cmdFit, 'mp4', {
  aspectRatio: '9:16',
  resolution: '1080p',
  fitMode: 'fit'
});
assert(cmdFit._videoFilters.some(f => f.includes('force_original_aspect_ratio=decrease')), 'Fit mode uses force_original_aspect_ratio=decrease');
assert(cmdFit._videoFilters.some(f => f.includes('pad=1080:1920')), 'Fit mode applies pad filter with letterboxing');

const cmdCustom = new MockFfmpegCommandAudit();
mediaEngineAudit.configureFfmpegOptions(cmdCustom, 'mp4', {
  aspectRatio: 'custom',
  customWidth: 1281,
  customHeight: 719
});
assert(cmdCustom._videoFilters.some(f => f.includes('scale=1280:718')), 'configureFfmpegOptions enforces even custom dimensions');

// فحص أداة توحيد مقاسات الصور الجماعية (Batch Image Resizer)
assert(typeof uiController.applyBatchImageResize === 'function', 'uiController.applyBatchImageResize is defined');
uiController.applyBatchImageResize('story-shorts');
const batchUpdatedImage = appState.tasks.find(t => t.taskId === sampleImageTask.taskId);
assert(batchUpdatedImage.options.presetSize === 'story-shorts', 'applyBatchImageResize updates presetSize to story-shorts');
assert(batchUpdatedImage.options.width === 1080, 'applyBatchImageResize sets width to 1080');
assert(batchUpdatedImage.options.height === 1920, 'applyBatchImageResize sets height to 1920');

// فحص بروفايل story-shorts في محرك الصور
const imageEngineAudit = require('./src/main/engines/image-engine');
assert(imageEngineAudit.IMAGE_PRESET_SIZES['story-shorts'], 'IMAGE_PRESET_SIZES contains story-shorts');
assert(imageEngineAudit.IMAGE_PRESET_SIZES['story-shorts'].width === 1080, 'story-shorts preset width is 1080');
assert(imageEngineAudit.IMAGE_PRESET_SIZES['story-shorts'].height === 1920, 'story-shorts preset height is 1920');

// فحص سلامة وتناسق الـ CSS لمنع تآكل العناصر والهيدر
const queueCssContent = fs.readFileSync(path.join(__dirname, 'src/renderer/styles/queue.css'), 'utf8');
assert(queueCssContent.includes('.top-header, .queue-header'), 'queue.css styles .top-header and .queue-header');
assert(queueCssContent.includes('padding: 16px 20px !important'), 'queue.css sets 16px 20px padding on header');
assert(queueCssContent.includes('flex-shrink: 0 !important'), 'queue.css ensures action buttons do not shrink');
assert(queueCssContent.includes('max-width: 280px'), 'queue.css caps profile select max-width to 280px');
assert(queueCssContent.includes('text-shadow: 2px 2px 4px #000, -2px -2px 4px #000'), 'queue.css sets high-contrast text-shadow for subtitles');
assert(queueCssContent.includes('.video-player-controls'), 'queue.css defines video player controls');
assert(queueCssContent.includes('.video-timeline-slider'), 'queue.css defines video timeline slider');
assert(queueCssContent.includes('direction: rtl'), 'queue.css ensures RTL direction for subtitle track select');

// ج: فحص حفظ خيارات الاقتصاص المكاني الحر والتقطيع الزمني (Free Crop & Trimming)
const sampleVideoWithCropAndTrim = {
  ...sampleVideoTask,
  options: {
    ...sampleVideoTask.options,
    aspectRatio: 'free-crop',
    crop: { x: 11, y: 21, width: 801, height: 601 }
  }
};
uiController.openAdvancedModal(sampleVideoWithCropAndTrim);

const trimStartInput = getOrCreateMockElement('advTrimStart');
trimStartInput.value = '00:00:10';
const trimEndInput = getOrCreateMockElement('advTrimEnd');
trimEndInput.value = '00:00:40';

modalSaveBtn.onclick();

const savedCropTrimTask = appState.tasks.find(t => t.taskId === sampleVideoTask.taskId);
assert(savedCropTrimTask.options.crop !== null, 'Free crop saved in state');
assert(savedCropTrimTask.options.crop.width % 2 === 0, `Crop width is even: ${savedCropTrimTask.options.crop.width}`);
assert(savedCropTrimTask.options.crop.height % 2 === 0, `Crop height is even: ${savedCropTrimTask.options.crop.height}`);
assert(savedCropTrimTask.options.crop.x % 2 === 0, `Crop x is even: ${savedCropTrimTask.options.crop.x}`);
assert(savedCropTrimTask.options.crop.y % 2 === 0, `Crop y is even: ${savedCropTrimTask.options.crop.y}`);
assert(savedCropTrimTask.options.crop.width === 800, `Crop width rounded to even: expected 800, got ${savedCropTrimTask.options.crop.width}`);
assert(savedCropTrimTask.options.crop.height === 600, `Crop height rounded to even: expected 600, got ${savedCropTrimTask.options.crop.height}`);
assert(savedCropTrimTask.options.startSec === 10, `Trim startSec is 10: ${savedCropTrimTask.options.startSec}`);
assert(savedCropTrimTask.options.endSec === 40, `Trim endSec is 40: ${savedCropTrimTask.options.endSec}`);
assert(savedCropTrimTask.options.trimmedDuration === 30, `Trimmed duration is 30: ${savedCropTrimTask.options.trimmedDuration}`);

const cropTrimEst = uiController.calculateEstimatedOutput(savedCropTrimTask);
assert(cropTrimEst.dim.includes('800×600 (قص حر)'), `Card estimation reflects free crop dimensions: ${cropTrimEst.dim}`);
assert(cropTrimEst.dur === '00:30', `Card estimation reflects trimmed duration 00:30: ${cropTrimEst.dur}`);

// -----------------------------------------------------------------------------
// 5. فحص زر "تطبيق على نفس النوع" وإعادة التحويل الجماعي (State & Batch Counter)
// -----------------------------------------------------------------------------
console.log('\n[5/7] Testing "Apply to Same Type" & Bulk Re-conversion...');

// تجهيز مهمتين فيديو: إحداهما مكتملة والأخرى فاشلة
appState.tasks = [];
const taskVid1 = {
  taskId: 'task_v1',
  name: 'episode1.mp4',
  filePath: 'C:\\Videos\\episode1.mp4',
  type: 'video',
  extension: 'mp4',
  size: 100 * 1024 * 1024,
  targetFormat: 'mp4',
  status: 'COMPLETED',
  progress: 100,
  finalSize: 95 * 1024 * 1024,
  outputPath: 'C:\\Videos\\episode1_converted.mp4',
  options: {}
};
const taskVid2 = {
  taskId: 'task_v2',
  name: 'episode2.mp4',
  filePath: 'C:\\Videos\\episode2.mp4',
  type: 'video',
  extension: 'mp4',
  size: 120 * 1024 * 1024,
  targetFormat: 'mp4',
  status: 'FAILED',
  progress: 45,
  errorMessage: 'Old Error',
  options: {}
};
appState.tasks.push(taskVid1, taskVid2);

// محاكاة اختيار صيغة mkv في القائمة العلوية
const globalSelect = mockDocument.getElementById('globalFormatSelect');
globalSelect.value = 'mkv';

// النقر على "تطبيق على نفس النوع"
uiController.applyFormatToSameType();

// 1) التحقق من تحديث targetFormat فعلياً داخل كائن كل مهمة في state.js
assert(taskVid1.targetFormat === 'mkv', 'Task 1: targetFormat updated to MKV in state');
assert(taskVid2.targetFormat === 'mkv', 'Task 2: targetFormat updated to MKV in state');

// 2) التحقق من إعادة تعيين حالة المهام المكتملة والفاشلة إلى READY تلقائياً
assert(taskVid1.status === 'READY', 'Completed task automatically reset to READY');
assert(taskVid2.status === 'READY', 'Failed task automatically reset to READY');

// 3) التحقق من تصفير أشرطة التقدم لتعود لوضع الاستعداد
assert(taskVid1.progress === 0, 'Task 1 progress reset to 0');
assert(taskVid1.finalSize === 0, 'Task 1 finalSize reset to 0');
assert(taskVid2.progress === 0, 'Task 2 progress reset to 0');
assert(taskVid2.errorMessage === '', 'Task 2 errorMessage cleared');

// 4) التحقق من تحديث عداد زر التحويل الجماعي ليظهر العدد الفعلي للمهام الجاهزة (2)
const btnStartAll = mockDocument.getElementById('btnStartAll');
assert(btnStartAll.innerHTML.includes('(2)'), `Bulk convert button shows exact count of ready tasks: ${btnStartAll.innerHTML}`);
assert(btnStartAll.disabled === false, 'Bulk convert button is enabled for ready tasks');

// -----------------------------------------------------------------------------
// 6. فحص التبديل بين العرض البسيط والعرض المفصل (Compact / Detailed View)
// -----------------------------------------------------------------------------
console.log('\n[6/7] Testing Compact / Detailed View Toggle...');

const toggleBtn = mockDocument.getElementById('toggleViewBtn');
const tasksListEl = mockDocument.getElementById('tasksList');

// في البداية: النمط البسيط افتراضياً
assert(tasksListEl.classList.contains('compact-view'), 'Initially in compact view mode by default');
assert(toggleBtn.innerHTML.includes('بسيط'), `Toggle button reflects initial compact mode: ${toggleBtn.innerHTML}`);

// التحقق من تشريح بطاقة المهمة في النمط البسيط (CloudConvert-like elements)
const sampleCard = uiController.createTaskCardElement(taskVid1);
assert(sampleCard.innerHTML.includes('compact-flow-arrow'), 'Card contains compact flow arrow (←)');
assert(sampleCard.innerHTML.includes('compact-status-badge'), 'Card contains compact status badge');
assert(sampleCard.innerHTML.includes('btn-adv-compact'), 'Card contains compact advanced options button');

// النقر للتبديل إلى النمط المفصل (Detailed View)
toggleBtn.dispatchEvent('click');
assert(!tasksListEl.classList.contains('compact-view'), 'Clicking toggle removes compact-view class to enter detailed mode');
assert(toggleBtn.innerHTML.includes('مفصل'), `Toggle button reflects detailed mode: ${toggleBtn.innerHTML}`);
assert(mockLocalStorage.getItem('open_uniconverter_view_mode') === 'detailed', 'Detailed mode preference saved in localStorage');

// النقر للعودة إلى النمط البسيط (Compact View)
toggleBtn.dispatchEvent('click');
assert(tasksListEl.classList.contains('compact-view'), 'Clicking again restores compact-view class');
assert(toggleBtn.innerHTML.includes('بسيط'), `Toggle button restores compact mode: ${toggleBtn.innerHTML}`);
assert(mockLocalStorage.getItem('open_uniconverter_view_mode') === 'compact', 'Compact mode preference saved in localStorage');

// -----------------------------------------------------------------------------
// 7. فحص قسم ضاغط الوسائط الذكي (Smart Media Compressor Section & UI)
// -----------------------------------------------------------------------------
console.log('\n[7/8] Testing Smart Media Compressor (ضاغط الوسائط الذكي)...');

// 1. فحص وجود زر التنقل #navCompressor في شريط التنقل
assert(domIds.has('navCompressor'), "Navigation item '#navCompressor' exists in index.html");
assert(htmlContent.includes('data-section="compressor"'), "Nav item has data-section='compressor'");

// 2. فحص التبديل لقسم الضاغط الذكي
appState.setSection('compressor');
assert(appState.currentSection === 'compressor', 'AppState current section updated to compressor');

uiController.render(appState);
const sectionTitleEl = mockDocument.getElementById('sectionTitle');
assert(sectionTitleEl.textContent.includes('ضاغط الوسائط الذكي'), `Section title updated to: ${sectionTitleEl.textContent}`);

const dropTitleEl = mockDocument.getElementById('dropZoneTitle');
const dropSubEl = mockDocument.getElementById('dropZoneSubtitle');
assert(dropTitleEl.textContent.includes('ضاغط الوسائط الذكي'), `Dropzone title reflects compressor: ${dropTitleEl.textContent}`);
assert(dropSubEl.textContent.includes('الحجم المستهدف'), `Dropzone subtitle reflects compressor: ${dropSubEl.textContent}`);

// 3. فحص حسابات شارة الجودة الديناميكية (Quality Rating Formula)
const testVidTask = {
  taskId: 'task_comp_vid',
  name: 'test_vid.mp4',
  type: 'video',
  size: 100 * 1024 * 1024, // 100 MB
  duration: 120 // 120 seconds
};

// Target 50MB: totalBitrate = (50 * 8192) / 120 = 3413k -> videoBitrate = 3285k >= 2400k (Green)
const qHigh = uiController.getQualityRating(testVidTask, 50);
assert(qHigh.level === 'high', `Quality rating for 50MB/120s is HIGH: ${qHigh.label}`);
assert(qHigh.badgeClass === 'badge-quality-high', 'Quality badge class is badge-quality-high (Green)');

// Target 25MB: totalBitrate = (25 * 8192) / 120 = 1706k -> videoBitrate = 1578k (Orange)
const qMed = uiController.getQualityRating(testVidTask, 25);
assert(qMed.level === 'medium', `Quality rating for 25MB/120s is MEDIUM: ${qMed.label}`);
assert(qMed.badgeClass === 'badge-quality-medium', 'Quality badge class is badge-quality-medium (Orange)');

// Target 8MB: totalBitrate = (8 * 8192) / 120 = 546k -> videoBitrate = 418k < 1000k (Red)
const qLow = uiController.getQualityRating(testVidTask, 8);
assert(qLow.level === 'low', `Quality rating for 8MB/120s is LOW: ${qLow.label}`);
assert(qLow.badgeClass === 'badge-quality-low', 'Quality badge class is badge-quality-low (Red)');

// فحص الصور:
const testImgTask = {
  taskId: 'task_comp_img',
  name: 'test_photo.jpg',
  type: 'image',
  size: 10 * 1024 * 1024 // 10 MB
};
const qImgHigh = uiController.getQualityRating(testImgTask, 7); // 70% >= 60%
assert(qImgHigh.level === 'high', `Image quality 70% is HIGH: ${qImgHigh.label}`);
const qImgMed = uiController.getQualityRating(testImgTask, 4); // 40% (30-59%)
assert(qImgMed.level === 'medium', `Image quality 40% is MEDIUM: ${qImgMed.label}`);
const qImgLow = uiController.getQualityRating(testImgTask, 1.5); // 15% < 30%
assert(qImgLow.level === 'low', `Image quality 15% is LOW: ${qImgLow.label}`);

// 4. فحص إضافة ملف في وضع الضغط وبناء بطاقة الضغط
appState.tasks = [];
appState.addFiles([{
  path: 'C:\\Videos\\presentation.mp4',
  name: 'presentation.mp4',
  size: 50 * 1024 * 1024, // 50 MB
  type: 'video',
  duration: 60
}]);

const compTasks = appState.getFilteredTasks();
assert(compTasks.length === 1, `1 compressor task in filtered tasks: ${compTasks.length}`);
const compTask = compTasks[0];
assert(compTask.isCompressor === true, 'Task flagged as isCompressor = true');
assert(compTask.options.isCompression === true, 'Task options contain isCompression = true');
assert(compTask.options.targetSizeMB === 25, `Default target size is 50% of 50MB (25MB): ${compTask.options.targetSizeMB}`);

// بناء البطاقة
const compCard = uiController.createTaskCardElement(compTask);
const compCardHtml = compCard.innerHTML;
assert(compCardHtml.includes('compress-orig-size-badge'), 'Card contains original size badge');
assert(compCardHtml.includes('compress-slider'), 'Card contains compression slider (10% to 90%)');
assert(compCardHtml.includes('compress-num-input'), 'Card contains target size number input');
assert(compCardHtml.includes('quality-badge'), 'Card contains dynamic quality badge');
assert(compCardHtml.includes('btn-compress-single'), 'Card contains single compress action button (بدء الضغط)');
assert(compCardHtml.includes('بدء الضغط 🗜️'), 'Action button text is "بدء الضغط 🗜️"');

// 5. فحص حالة الاكتمال وشارة توفير المساحة وزر فتح المجلد الموحد
compTask.status = 'COMPLETED';
compTask.finalSize = 10 * 1024 * 1024; // 10 MB (وفر 40 MB = 80%)
compTask.outputPath = 'C:\\Videos\\presentation_compressed.mp4';

const completedCompCard = uiController.createCompressorCardElement(compTask);
const completedHtml = completedCompCard.innerHTML;
assert(completedHtml.includes('savings-badge'), 'Completed card displays savings badge');
assert(completedHtml.includes('تم توفير 80%'), `Savings badge shows correct percentage: ${completedHtml}`);
assert(completedHtml.includes('btn-open-folder'), 'Completed card displays unified "فتح المجلد 📂" button');

// 6. التحقق من عزل رتل الضغط عن الرتل العام
appState.setSection('universal');
const universalTasks = appState.getFilteredTasks();
assert(universalTasks.length === 0, 'Universal queue correctly isolates compressor tasks');

appState.setSection('compressor');
const compTasksRestored = appState.getFilteredTasks();
assert(compTasksRestored.length === 1, 'Compressor queue retains compressor tasks');

// -----------------------------------------------------------------------------
// [Testing Full Sidebar Routing & Format Isolation Matrix]
// -----------------------------------------------------------------------------
console.log('\n[Testing Full Sidebar Routing & Format Isolation Matrix]...');

// تفريغ الرتل للبدء بمصفوفة اختبار نظيفة
appState.tasks = [];

// 1. اختبار قسم الفيديو (#navVideo)
const navVideoEl = mockDocument.getElementById('navVideo');
assert(navVideoEl !== null, 'Sidebar nav item #navVideo exists');

appState.setSection('video');
appState.addFiles([{
  path: 'C:\\Videos\\movie.mp4',
  name: 'movie.mp4',
  size: 100 * 1024 * 1024,
  extension: 'mp4',
  duration: 120
}]);

const videoTasksInVideo = appState.getFilteredTasks();
assert(videoTasksInVideo.some(t => t.name === 'movie.mp4'), 'movie.mp4 appears in section "video"');

appState.setSection('universal');
const videoTasksInUniversal = appState.getFilteredTasks();
assert(videoTasksInUniversal.some(t => t.name === 'movie.mp4'), 'movie.mp4 appears in section "universal"');

appState.setSection('audio');
assert(!appState.getFilteredTasks().some(t => t.name === 'movie.mp4'), 'movie.mp4 is hidden from section "audio"');

appState.setSection('image');
assert(!appState.getFilteredTasks().some(t => t.name === 'movie.mp4'), 'movie.mp4 is hidden from section "image"');

appState.setSection('document');
assert(!appState.getFilteredTasks().some(t => t.name === 'movie.mp4'), 'movie.mp4 is hidden from section "document"');


// 2. اختبار قسم الصوت (#navAudio)
const navAudioEl = mockDocument.getElementById('navAudio');
assert(navAudioEl !== null, 'Sidebar nav item #navAudio exists');

appState.setSection('audio');
appState.addFiles([{
  path: 'C:\\Music\\song.mp3',
  name: 'song.mp3',
  size: 8 * 1024 * 1024,
  extension: 'mp3',
  duration: 210
}]);

assert(appState.getFilteredTasks().some(t => t.name === 'song.mp3'), 'song.mp3 appears in section "audio"');

appState.setSection('universal');
assert(appState.getFilteredTasks().some(t => t.name === 'song.mp3'), 'song.mp3 appears in section "universal"');

appState.setSection('video');
assert(!appState.getFilteredTasks().some(t => t.name === 'song.mp3'), 'song.mp3 is hidden from section "video"');

appState.setSection('image');
assert(!appState.getFilteredTasks().some(t => t.name === 'song.mp3'), 'song.mp3 is hidden from section "image"');

appState.setSection('document');
assert(!appState.getFilteredTasks().some(t => t.name === 'song.mp3'), 'song.mp3 is hidden from section "document"');


// 3. اختبار قسم الصور (#navImage)
const navImageEl = mockDocument.getElementById('navImage');
assert(navImageEl !== null, 'Sidebar nav item #navImage exists');

appState.setSection('image');
appState.addFiles([{
  path: 'C:\\Pictures\\photo.png',
  name: 'photo.png',
  size: 2 * 1024 * 1024,
  extension: 'png'
}]);

assert(appState.getFilteredTasks().some(t => t.name === 'photo.png'), 'photo.png appears in section "image"');

appState.setSection('universal');
assert(appState.getFilteredTasks().some(t => t.name === 'photo.png'), 'photo.png appears in section "universal"');

appState.setSection('video');
assert(!appState.getFilteredTasks().some(t => t.name === 'photo.png'), 'photo.png is hidden from section "video"');

appState.setSection('audio');
assert(!appState.getFilteredTasks().some(t => t.name === 'photo.png'), 'photo.png is hidden from section "audio"');

appState.setSection('document');
assert(!appState.getFilteredTasks().some(t => t.name === 'photo.png'), 'photo.png is hidden from section "document"');


// 4. اختبار قسم المستندات (#navDocument)
const navDocEl = mockDocument.getElementById('navDocument');
assert(navDocEl !== null, 'Sidebar nav item #navDocument exists');

appState.setSection('document');
appState.addFiles([
  {
    path: 'C:\\Docs\\document.docx',
    name: 'document.docx',
    size: 150 * 1024,
    extension: 'docx'
  },
  {
    path: 'C:\\Docs\\Arab Open University.pdf',
    name: 'Arab Open University.pdf',
    size: 450 * 1024,
    extension: 'pdf'
  }
]);

const docxTask = appState.tasks.find(t => t.name === 'document.docx');
const pdfTask = appState.tasks.find(t => t.name === 'Arab Open University.pdf');

// 4.1 التحقق من قبول DOCX ورفض إضافة PDF لرتل المستندات
assert(docxTask && docxTask.type === 'document', 'document.docx classified as type: "document"');
assert(docxTask && docxTask.category === 'document', 'document.docx has category: "document"');
assert(!pdfTask, 'Arab Open University.pdf rejected from document queue as unsupported input');

// 4.2 التحقق من ظهور DOCX في قسم document وغياب PDF المرفوض
const docTasks = appState.getFilteredTasks();
assert(docTasks.some(t => t.name === 'document.docx'), 'document.docx appears inside active section "document"');
assert(!docTasks.some(t => t.name === 'Arab Open University.pdf'), 'Arab Open University.pdf does not appear inside active section "document"');

// 4.3 التحقق من أن الصيغة الافتراضية لـ DOCX هي PDF وليست MP4
assert(docxTask.targetFormat === 'pdf', `document.docx default target is PDF (actual: ${docxTask.targetFormat})`);

// 4.4 التحقق من الاختفاء التام لـ DOCX من أقسام الفيديو والصوت والصور
appState.setSection('video');
const videoFiltered = appState.getFilteredTasks();
assert(!videoFiltered.some(t => t.name === 'document.docx'), 'document.docx is completely hidden from section "video"');

appState.setSection('audio');
const audioFiltered = appState.getFilteredTasks();
assert(!audioFiltered.some(t => t.name === 'document.docx'), 'document.docx is completely hidden from section "audio"');

appState.setSection('image');
const imgFiltered = appState.getFilteredTasks();
assert(!imgFiltered.some(t => t.name === 'document.docx'), 'document.docx is completely hidden from section "image"');

// 5. اختبار قسم ضاغط الوسائط (#navCompressor)
const navCompEl = mockDocument.getElementById('navCompressor');
assert(navCompEl !== null, 'Sidebar nav item #navCompressor exists');

appState.setSection('compressor');
appState.addFiles([{
  path: 'C:\\Media\\clip.mp4',
  name: 'clip.mp4',
  size: 30 * 1024 * 1024,
  extension: 'mp4',
  duration: 45
}]);

const compTaskActive = appState.tasks.find(t => t.name === 'clip.mp4');
assert(compTaskActive && compTaskActive.isCompressor === true, 'Compressor task flagged as isCompressor');

// التحقق من ظهورها في قسم compressor
assert(appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 appears in section "compressor"');

// التحقق من عزلها عن الرتل العام وكافة الأقسام
appState.setSection('universal');
assert(!appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 is isolated and hidden from "universal" queue');

appState.setSection('video');
assert(!appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 is isolated and hidden from "video" queue');

appState.setSection('audio');
assert(!appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 is isolated and hidden from "audio" queue');

appState.setSection('image');
assert(!appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 is isolated and hidden from "image" queue');

appState.setSection('document');
assert(!appState.getFilteredTasks().some(t => t.name === 'clip.mp4'), 'clip.mp4 is isolated and hidden from "document" queue');

// 6. فحص نافذة اختيار الصيغ لمستند PDF
const samplePdfTask = {
  taskId: 'task_pdf_sample_1',
  name: 'Arab Open University.pdf',
  filePath: 'C:\\Docs\\Arab Open University.pdf',
  extension: 'pdf',
  type: 'document',
  category: 'document',
  targetFormat: 'png'
};
uiController.formatPicker.open(samplePdfTask);
const pickerNavBtns = Array.from(mockDocument.querySelectorAll('.picker-nav-btn'));
const videoNavBtn = pickerNavBtns.find(b => b.getAttribute('data-category') === 'video');
const audioNavBtn = pickerNavBtns.find(b => b.getAttribute('data-category') === 'audio');
const docNavBtn = pickerNavBtns.find(b => b.getAttribute('data-category') === 'document');

assert(docNavBtn && docNavBtn.style.display !== 'none', 'Format picker shows "document" tab for PDF');
assert(videoNavBtn && videoNavBtn.style.display === 'none', 'Format picker hides "video" tab for PDF (preventing MP4 suggestion)');
assert(audioNavBtn && audioNavBtn.style.display === 'none', 'Format picker hides "audio" tab for PDF');
assert(uiController.formatPicker.currentCategory === 'image', 'Format picker automatically activates "image" category for PDF extraction');
assert(samplePdfTask.targetFormat === 'png', 'PDF target format defaults to PNG');

// التحقق من أن خيارات استخراج PDF كصور تقدم حصرياً PNG, JPG, WebP بدون DOCX
const gridContainerAudit = mockDocument.getElementById('formatGridContainer');
const renderedFormatsForPdf = gridContainerAudit.children.map(ch => ch.innerHTML.match(/<span class="fmt-card-name">([^<]+)<\/span>/)?.[1] || '');
assert(renderedFormatsForPdf.includes('PNG'), 'PDF format options include PNG');
assert(renderedFormatsForPdf.includes('JPG'), 'PDF format options include JPG');
assert(renderedFormatsForPdf.includes('WebP'), 'PDF format options include WebP');
assert(!renderedFormatsForPdf.includes('DOCX'), 'PDF format options strictly exclude DOCX');
uiController.formatPicker.close();

// فحص نافذة اختيار الصيغ لمهمة صورة (image) - إخفاء DOCX تماماً والإبقاء حصرياً على PDF
uiController.formatPicker.open(sampleImageTask);
uiController.formatPicker.setCategory('document');
const renderedDocFormatsForImage = gridContainerAudit.children.map(ch => ch.innerHTML.match(/<span class="fmt-card-name">([^<]+)<\/span>/)?.[1] || '');
assert(renderedDocFormatsForImage.includes('PDF'), 'Image task document tab contains PDF');
assert(!renderedDocFormatsForImage.includes('DOCX'), 'Image task document tab hides DOCX completely');
uiController.formatPicker.close();

// 7. فحص نافذة الخيارات المتقدمة لمستند PDF
uiController.openAdvancedModal(samplePdfTask);
const advModalBody = mockDocument.getElementById('modalBody');
assert(advModalBody.innerHTML.includes('modal-doc-options'), 'Advanced modal displays document options (.modal-doc-options) for PDF');
assert(!advModalBody.innerHTML.includes('id="advVideoPlayer"'), 'Advanced modal does NOT render video player for PDF');
assert(!advModalBody.innerHTML.includes('id="advVideoTimeline"'), 'Advanced modal does NOT render video timeline for PDF');
assert(!advModalBody.innerHTML.includes('id="cropBoxVideo"'), 'Advanced modal does NOT render video crop box for PDF');
uiController.closeAdvancedModal();

// -----------------------------------------------------------------------------
// 8. فحص مسار تصدير TGA وفلتر الحدة المهذب مع الفحص الوقائي للصور الصغيرة
// -----------------------------------------------------------------------------
console.log('\n[8/8] Testing Backend Image Engine (TGA & Softened Sharpening & Compression)...');

async function testBackendEngine() {
  const imageEngine = require('./src/main/engines/image-engine');
  
  // أ: فحص مسار TGA
  const testPngBuffer = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 80, g: 180, b: 240 } }
  }).png().toBuffer();

  const tempIn = path.join(__dirname, 'test_audit_in.png');
  const tempOutTga = path.join(__dirname, 'test_audit_out.tga');
  fs.writeFileSync(tempIn, testPngBuffer);

  try {
    const res = await imageEngine.convertImage({
      taskId: 'audit_tga_test',
      inputPath: tempIn,
      outputPath: tempOutTga,
      targetFormat: 'tga',
      options: { quality: 90 }
    });

    assert(fs.existsSync(tempOutTga), 'Output TGA file was created on disk');
    const outStat = fs.statSync(tempOutTga);
    assert(outStat.size > 0, `Output TGA file has valid size (${outStat.size} bytes)`);
  } finally {
    if (fs.existsSync(tempOutTga)) fs.unlinkSync(tempOutTga);
  }

  // ب: فحص فلتر الحدة مع صورة صغيرة < 400x400 (يجب ألا يشوه الصورة ويعالج بأمان)
  const smallPngBuffer = await sharp({
    create: { width: 250, height: 250, channels: 3, background: { r: 255, g: 100, b: 50 } }
  }).png().toBuffer();

  const tempInSmall = path.join(__dirname, 'test_small_in.png');
  const tempOutSmall = path.join(__dirname, 'test_small_out.webp');
  fs.writeFileSync(tempInSmall, smallPngBuffer);

  try {
    await imageEngine.convertImage({
      taskId: 'audit_small_sharpen',
      inputPath: tempInSmall,
      outputPath: tempOutSmall,
      targetFormat: 'webp',
      options: { sharpen: true, quality: 85 }
    });
    assert(fs.existsSync(tempOutSmall), 'Small image (<400px) converted safely with small image guard');
    const statSmall = fs.statSync(tempOutSmall);
    assert(statSmall.size > 0, `Small image output size is valid (${statSmall.size} bytes)`);
  } finally {
    if (fs.existsSync(tempInSmall)) fs.unlinkSync(tempInSmall);
    if (fs.existsSync(tempOutSmall)) fs.unlinkSync(tempOutSmall);
  }

  // ج: فحص فلتر الحدة مع صورة كبيرة >= 400x400 (يطبق وسائط الحدة الناعمة sigma: 0.8)
  const largePngBuffer = await sharp({
    create: { width: 600, height: 600, channels: 3, background: { r: 50, g: 150, b: 255 } }
  }).png().toBuffer();

  const tempInLarge = path.join(__dirname, 'test_large_in.png');
  const tempOutLarge = path.join(__dirname, 'test_large_out.jpg');
  fs.writeFileSync(tempInLarge, largePngBuffer);

  try {
    await imageEngine.convertImage({
      taskId: 'audit_large_sharpen',
      inputPath: tempInLarge,
      outputPath: tempOutLarge,
      targetFormat: 'jpg',
      options: { sharpen: true, quality: 90 }
    });
    assert(fs.existsSync(tempOutLarge), 'Large image (>=400px) converted with softened sharpen parameters');
    const statLarge = fs.statSync(tempOutLarge);
    assert(statLarge.size > 0, `Large image output size is valid (${statLarge.size} bytes)`);
  } finally {
    if (fs.existsSync(tempInLarge)) fs.unlinkSync(tempInLarge);
    if (fs.existsSync(tempOutLarge)) fs.unlinkSync(tempOutLarge);
    if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
  }

  // د: فحص محرك القص المكاني للصور (Sharp Extract Crop Execution)
  const cropTestBuffer = await sharp({
    create: { width: 500, height: 400, channels: 3, background: { r: 120, g: 60, b: 200 } }
  }).png().toBuffer();

  const tempInCrop = path.join(__dirname, 'test_crop_in.png');
  const tempOutCrop = path.join(__dirname, 'test_crop_out.webp');
  fs.writeFileSync(tempInCrop, cropTestBuffer);

  try {
    await imageEngine.convertImage({
      taskId: 'audit_crop_test',
      inputPath: tempInCrop,
      outputPath: tempOutCrop,
      targetFormat: 'webp',
      options: {
        crop: { left: 50, top: 40, width: 300, height: 200 },
        quality: 90
      }
    });

    assert(fs.existsSync(tempOutCrop), 'Cropped image file created on disk');
    const cropBuffer = fs.readFileSync(tempOutCrop);
    const cropMeta = await sharp(cropBuffer).metadata();
    assert(cropMeta.width === 300, `Cropped image width matches extract spec: expected 300, got ${cropMeta.width}`);
    assert(cropMeta.height === 200, `Cropped image height matches extract spec: expected 200, got ${cropMeta.height}`);
  } finally {
    if (fs.existsSync(tempInCrop)) {
      try { fs.unlinkSync(tempInCrop); } catch (e) {}
    }
    if (fs.existsSync(tempOutCrop)) {
      try { fs.unlinkSync(tempOutCrop); } catch (e) {}
    }
  }

  // هـ: فحص حساب أبعاد نسب الفيديو في Media Engine
  const mediaEngine = require('./src/main/engines/media-engine');
  const dims916 = mediaEngine.getAspectRatioDimensions('9:16', '1080p');
  assert(dims916 && dims916.width === 1080 && dims916.height === 1920, `9:16 1080p maps to 1080x1920 (TikTok format): ${JSON.stringify(dims916)}`);

  const dims11 = mediaEngine.getAspectRatioDimensions('1:1', '1080p');
  assert(dims11 && dims11.width === 1080 && dims11.height === 1080, `1:1 1080p maps to 1080x1080 (Square Instagram): ${JSON.stringify(dims11)}`);

  const dims169 = mediaEngine.getAspectRatioDimensions('16:9', '4k');
  assert(dims169 && dims169.width === 3840 && dims169.height === 2160, `16:9 4k maps to 3840x2160 (Ultra HD YouTube): ${JSON.stringify(dims169)}`);

  const dims43 = mediaEngine.getAspectRatioDimensions('4:3', '720p');
  assert(dims43 && dims43.width === 960 && dims43.height === 720, `4:3 720p maps to 960x720 (Classic format): ${JSON.stringify(dims43)}`);

  // و: فحص محرك ضغط الصور الذكي (Smart Image Compression Task)
  const largeImgBuffer = await sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 50, g: 150, b: 250 } }
  }).png().toBuffer();

  const tempInCompImg = path.join(__dirname, 'test_comp_in.png');
  const tempOutCompImg = path.join(__dirname, 'test_comp_out.webp');
  fs.writeFileSync(tempInCompImg, largeImgBuffer);

  try {
    const origStat = fs.statSync(tempInCompImg);
    const resComp = await imageEngine.compressImageTask({
      taskId: 'audit_compress_img_test',
      inputPath: tempInCompImg,
      outputPath: tempOutCompImg,
      targetSizeMB: 0.03, // 30 KB
      onProgress: () => {}
    });

    assert(fs.existsSync(tempOutCompImg), 'Compressed image file created on disk');
    const outStat = fs.statSync(tempOutCompImg);
    assert(outStat.size > 0 && outStat.size < origStat.size, `Compressed image size (${outStat.size} bytes) is smaller than original (${origStat.size} bytes)`);
    assert(resComp.isCompression === true, 'compressImageTask returned isCompression: true');
  } finally {
    if (fs.existsSync(tempInCompImg)) {
      try { fs.unlinkSync(tempInCompImg); } catch (e) {}
    }
    if (fs.existsSync(tempOutCompImg)) {
      try { fs.unlinkSync(tempOutCompImg); } catch (e) {}
    }
  }

  // -----------------------------------------------------------------------------
  // [9/9] فحص تعدد المسارات الصوتية، الترجمات، موازنة الصوت، السرعة، وخنق العمليات
  // -----------------------------------------------------------------------------
  console.log('\n[9/9] Testing Video/Audio Streams, Sample Render, Throttling & Windows Integration...');

  const queueManager = require('./src/main/queue-manager');

  // 1. فحص تقييد التزامن (Concurrency Throttling) بـ MAX_CONCURRENT_TASKS = 2
  assert(queueManager.concurrencyVideo <= 2, `concurrencyVideo is throttled <= 2 (actual: ${queueManager.concurrencyVideo})`);
  assert(queueManager.maxConcurrentTasks === 2, 'maxConcurrentTasks is strictly defined as 2');
  const qStatus = queueManager.getStatus();
  assert(qStatus.maxConcurrentTasks === 2, 'queueManager.getStatus() reports maxConcurrentTasks: 2');

  // 2. فحص دوال العينة السريعة (Sample Test Render)
  assert(typeof mediaEngine.renderSampleClip === 'function', 'mediaEngine exports renderSampleClip function');

  // 3. فحص فلتر موازنة الصوت الذكي (Smart Loudnorm) في خط أنابيب التحرير
  const mockCommandLoudnorm = {
    vFilters: [],
    aFilters: [],
    videoFilters: function(f) { this.vFilters.push(...f); },
    audioFilters: function(f) { this.aFilters.push(...f); },
    outputOptions: function() {}
  };
  mediaEngine.applyEditingPipeline(mockCommandLoudnorm, { loudnorm: true }, { hasAudio: true, duration: 60 });
  const hasLoudnorm = mockCommandLoudnorm.aFilters.some(f => f.includes('loudnorm'));
  assert(hasLoudnorm, 'applyEditingPipeline inserts standard loudnorm filter into audioFilters');

  // 4. فحص سرعة العرض ومزامنة نبرة الصوت (Playback Speed: 1.5x)
  const mockCommandSpeed = {
    vFilters: [],
    aFilters: [],
    videoFilters: function(f) { this.vFilters.push(...f); },
    audioFilters: function(f) { this.aFilters.push(...f); },
    outputOptions: function() {}
  };
  const speedRes = mediaEngine.applyEditingPipeline(mockCommandSpeed, { playbackSpeed: 1.5 }, { hasAudio: true, duration: 60 });
  const hasSetpts = mockCommandSpeed.vFilters.some(f => f.includes('setpts') && f.includes('0.6667'));
  const hasAtempo = mockCommandSpeed.aFilters.some(f => f.includes('atempo=1.5'));
  assert(hasSetpts, 'Video speed 1.5x applies setpts=(1/1.5)*PTS filter');
  assert(hasAtempo, 'Audio speed 1.5x applies atempo=1.5 filter with pitch preservation');
  assert(Math.round(speedRes.effectiveDuration) === 40, `Effective duration correctly updated (60s / 1.5 = 40s, got ${speedRes.effectiveDuration})`);

  // 5. فحص سرعة العرض البطيئة (Playback Speed: 0.5x)
  const mockCommandSlow = {
    vFilters: [],
    aFilters: [],
    videoFilters: function(f) { this.vFilters.push(...f); },
    audioFilters: function(f) { this.aFilters.push(...f); },
    outputOptions: function() {}
  };
  const slowRes = mediaEngine.applyEditingPipeline(mockCommandSlow, { playbackSpeed: 0.5 }, { hasAudio: true, duration: 30 });
  const hasSlowSetpts = mockCommandSlow.vFilters.some(f => f.includes('setpts') && f.includes('2.0000'));
  const hasSlowAtempo = mockCommandSlow.aFilters.some(f => f.includes('atempo=0.5'));
  assert(hasSlowSetpts, 'Video speed 0.5x applies setpts=2.0000*PTS filter');
  assert(hasSlowAtempo, 'Audio speed 0.5x applies atempo=0.5 filter');
  assert(Math.round(slowRes.effectiveDuration) === 60, `Effective duration doubled (30s / 0.5 = 60s, got ${slowRes.effectiveDuration})`);

  // 6. فحص معامِلات FFmpeg لاختيار مسار صوتي محدد بدقة (-map 0:v:0 -map 0:a:INDEX)
  const capturedOutputOpts = [];
  const mockCommandFmt = {
    outputOpts: [],
    vFilters: [],
    videoCodec: function() {},
    audioCodec: function() {},
    audioBitrate: function() {},
    outputOptions: function(opts) { this.outputOpts.push(...opts); },
    videoFilters: function() {}
  };
  mediaEngine.configureFfmpegOptions(mockCommandFmt, 'mp4', {
    audioTrackIndex: 1
  });
  const hasAudioMap = mockCommandFmt.outputOpts.includes('-map') && mockCommandFmt.outputOpts.includes('0:a:1');
  assert(hasAudioMap, 'configureFfmpegOptions maps selected audio stream precisely (-map 0:a:1)');

  // 7. فحص معامِلات الترجمة المنفصلة (Soft Subtitle) في MKV
  const mockCommandMkv = {
    outputOpts: [],
    vFilters: [],
    videoCodec: function() {},
    audioCodec: function() {},
    audioBitrate: function() {},
    outputOptions: function(opts) { this.outputOpts.push(...opts); },
    videoFilters: function() {}
  };
  mediaEngine.configureFfmpegOptions(mockCommandMkv, 'mkv', {
    subtitleTrackIndex: 0,
    subtitleMode: 'soft'
  });
  const hasSubMap = mockCommandMkv.outputOpts.includes('0:s:0?') && mockCommandMkv.outputOpts.includes('-c:s') && mockCommandMkv.outputOpts.includes('copy');
  assert(hasSubMap, 'configureFfmpegOptions sets soft subtitle mapping (-map 0:s:0? -c:s copy)');

  // 8. فحص معامِلات حرق الترجمة المدمجة داخل الصورة (Burn-in Subtitles)
  const mockCommandBurn = {
    vFilters: [],
    aFilters: [],
    videoFilters: function(f) { this.vFilters.push(...f); },
    audioFilters: function(f) { this.aFilters.push(...f); },
    outputOptions: function() {}
  };
  // تجربة حرق ترجمة مدمجة مع مسار وهمي
  const dummyVidPath = path.join(__dirname, 'test_burn.mp4');
  fs.writeFileSync(dummyVidPath, 'dummy video data');
  try {
    mediaEngine.applyEditingPipeline(mockCommandBurn, { subtitleTrackIndex: 2, subtitleMode: 'burn' }, { inputPath: dummyVidPath, hasAudio: true, duration: 10 });
    const hasBurnFilter = mockCommandBurn.vFilters.some(f => f.includes('subtitles=') && f.includes(':si=2'));
    assert(hasBurnFilter, 'applyEditingPipeline inserts embedded subtitle burn-in filter (subtitles=...:si=2)');
  } finally {
    if (fs.existsSync(dummyVidPath)) {
      try { fs.unlinkSync(dummyVidPath); } catch (e) {}
    }
  }

  // 9. فحص تكامل ويندوز وشريط المهام (Windows Integration Integrity)
  const mainIndexCode = fs.readFileSync(path.join(__dirname, 'src/main/index.js'), 'utf8');
  assert(mainIndexCode.includes('powerSaveBlocker'), 'src/main/index.js integrates powerSaveBlocker');
  assert(mainIndexCode.includes('setProgressBar'), 'src/main/index.js integrates mainWindow.setProgressBar');
  assert(mainIndexCode.includes('Notification'), 'src/main/index.js integrates Windows Native Notification');
  assert(mainIndexCode.includes('setupWindowsIntegration'), 'src/main/index.js defines setupWindowsIntegration');
  assert(mainIndexCode.includes('autoHideMenuBar: true'), 'src/main/index.js sets autoHideMenuBar: true');
  assert(mainIndexCode.includes('mainWindow.removeMenu()'), 'src/main/index.js calls mainWindow.removeMenu() to remove native menu');
  assert(mainIndexCode.includes('mainWindow.setMenuBarVisibility(false)'), 'src/main/index.js hides menu bar visibility');

  // 10. فحص منظومة الترجمة الخارجية وتنسيق المظهر (Subtitles Suite & Styling)
  const mockCommandExternalBurn = {
    vFilters: [],
    aFilters: [],
    videoFilters: function(f) { this.vFilters.push(...f); },
    audioFilters: function(f) { this.aFilters.push(...f); },
    outputOptions: function() {}
  };
  const dummySrtPath = path.join(__dirname, 'test_sub.srt');
  fs.writeFileSync(dummySrtPath, '1\n00:00:01,000 --> 00:00:03,000\nHello');
  try {
    mediaEngine.applyEditingPipeline(mockCommandExternalBurn, {
      subtitlePath: dummySrtPath,
      subtitleMode: 'burn',
      subtitleFontSize: 28,
      subtitlePosition: 'top'
    }, { inputPath: dummyVidPath, hasAudio: true, duration: 10 });
    const hasExtBurnFilter = mockCommandExternalBurn.vFilters.some(f =>
      f.includes('subtitles=') && f.includes('force_style=') && f.includes('FontSize=28') && f.includes('Alignment=6')
    );
    assert(hasExtBurnFilter, 'applyEditingPipeline generates subtitles filter with force_style (FontSize=28, Alignment=6 for Top)');
  } finally {
    if (fs.existsSync(dummySrtPath)) {
      try { fs.unlinkSync(dummySrtPath); } catch (e) {}
    }
  }

  // 11. فحص معالجة الرينج والستريمينغ المباشر في media-stream لمنع RangeError
  assert(mainIndexCode.includes("protocol.handle('media-stream'"), 'src/main/index.js handles media-stream protocol');
  assert(mainIndexCode.includes('fs.createReadStream'), 'media-stream uses fs.createReadStream to stream chunks without buffering');
  assert(mainIndexCode.includes('Accept-Ranges'), 'media-stream responds with Accept-Ranges: bytes');
  assert(mainIndexCode.includes('Content-Range'), 'media-stream responds with HTTP 206 Partial Content Content-Range');

  // 12. فحص خيارات FFmpeg للترجمة الخارجية المنفصلة وحرق الترجمة (Soft Subtitle & Burn-in Options)
  const mockCommandExtSoftMkv = {
    outputOpts: [],
    videoCodec: function() {},
    audioCodec: function() {},
    audioBitrate: function() {},
    outputOptions: function(opts) { this.outputOpts.push(...opts); },
    videoFilters: function() {}
  };
  const dummyExtSrt = path.join(__dirname, 'test_ext.srt');
  fs.writeFileSync(dummyExtSrt, '1\n00:00:01,000 --> 00:00:03,000\nExternal');
  try {
    mediaEngine.configureFfmpegOptions(mockCommandExtSoftMkv, 'mkv', {
      subtitlePath: dummyExtSrt,
      subtitleMode: 'soft'
    });
    const hasMap1Mkv = mockCommandExtSoftMkv.outputOpts.includes('1:0');
    const hasSrtCodec = mockCommandExtSoftMkv.outputOpts.includes('srt');
    assert(hasMap1Mkv, 'MKV soft subtitle maps external input 1:0 (-map 1:0)');
    assert(hasSrtCodec, 'MKV soft subtitle applies -c:s srt');

    const mockCommandExtSoftMp4 = {
      outputOpts: [],
      videoCodec: function() {},
      audioCodec: function() {},
      audioBitrate: function() {},
      outputOptions: function(opts) { this.outputOpts.push(...opts); },
      videoFilters: function() {}
    };
    mediaEngine.configureFfmpegOptions(mockCommandExtSoftMp4, 'mp4', {
      subtitlePath: dummyExtSrt,
      subtitleMode: 'soft'
    });
    const hasMap1Mp4 = mockCommandExtSoftMp4.outputOpts.includes('1:0');
    const hasMovTextCodec = mockCommandExtSoftMp4.outputOpts.includes('mov_text');
    assert(hasMap1Mp4, 'MP4 soft subtitle maps external input 1:0 (-map 1:0)');
    assert(hasMovTextCodec, 'MP4 soft subtitle applies -c:s mov_text');

    const mockCommandExtBurnMp4 = {
      outputOpts: [],
      videoCodec: function() {},
      audioCodec: function() {},
      audioBitrate: function() {},
      outputOptions: function(opts) { this.outputOpts.push(...opts); },
      videoFilters: function() {}
    };
    mediaEngine.configureFfmpegOptions(mockCommandExtBurnMp4, 'mp4', {
      subtitlePath: dummyExtSrt,
      subtitleMode: 'burn'
    });
    const hasNoMap1InBurn = !mockCommandExtBurnMp4.outputOpts.includes('1:0');
    assert(hasNoMap1InBurn, 'Burn-in subtitle mode does NOT map external input (-map 1:0 omitted)');
  } finally {
    if (fs.existsSync(dummyExtSrt)) {
      try { fs.unlinkSync(dummyExtSrt); } catch (e) {}
    }
  }

  // 13. فحص معالجة التايم لاين والمدة الحقيقية realDuration في ui-controller.js
  const uiControllerCode = fs.readFileSync(path.join(__dirname, 'src/renderer/scripts/ui-controller.js'), 'utf8');
  assert(uiControllerCode.includes('realDuration'), 'ui-controller.js defines and utilizes realDuration');
  assert(uiControllerCode.includes('playerEl.loop = false'), 'ui-controller.js explicitly disables player looping');
  assert(uiControllerCode.includes("playerEl.addEventListener('ended'"), 'ui-controller.js handles video ended event to prevent restarts');
  assert(uiControllerCode.includes('timelineSlider.max = realDuration'), 'ui-controller.js locks slider max to realDuration');

  // 14. فحص تصنيف المستندات في ipc-handlers و queueManager
  const { extractFileMetadata } = require('./src/main/ipc-handlers');
  const dummyPdf = path.join(__dirname, 'Arab Open University.pdf');
  fs.writeFileSync(dummyPdf, '%PDF-1.4 dummy pdf content');
  try {
    const pdfMeta = await extractFileMetadata(dummyPdf);
    assert(pdfMeta && pdfMeta.type === 'unsupported', 'extractFileMetadata classifies PDF as type: "unsupported"');
    assert(pdfMeta && pdfMeta.isSupported === false, 'extractFileMetadata sets isSupported = false for PDF input');
    assert(pdfMeta && pdfMeta.isPdf === true, 'extractFileMetadata sets isPdf = true for PDF');
  } finally {
    if (fs.existsSync(dummyPdf)) {
      try { fs.unlinkSync(dummyPdf); } catch (e) {}
    }
  }

  // فحص queueManager.classifyTask
  const classifiedPdfIn = queueManager.classifyTask(null, 'pdf');
  assert(classifiedPdfIn === 'unsupported', `classifyTask(null, 'pdf') returns 'unsupported' (actual: ${classifiedPdfIn})`);
  const classifiedPdfToDocx = queueManager.classifyTask('docx', 'pdf');
  assert(classifiedPdfToDocx === 'unsupported', `classifyTask('docx', 'pdf') returns 'unsupported' (actual: ${classifiedPdfToDocx})`);
  const classifiedDocxToPdf = queueManager.classifyTask('pdf', 'docx');
  assert(classifiedDocxToPdf === 'document', `classifyTask('pdf', 'docx') returns 'document' (actual: ${classifiedDocxToPdf})`);

  // 15. فحص متغير منع التضارب أثناء السحب isUserSeeking وأزرار الفريم في ui-controller.js
  assert(uiControllerCode.includes('isUserSeeking'), 'ui-controller.js defines isUserSeeking to prevent timeline jitter');
  assert(uiControllerCode.includes('btnPrevFrame'), 'ui-controller.js attaches previous frame button listener');
  assert(uiControllerCode.includes('btnNextFrame'), 'ui-controller.js attaches next frame button listener');

  // 16. فحص عدم تقييد بث media-stream بـ 4MB في index.js لدعم كامل مدة الفيلم
  assert(!mainIndexCode.includes('CHUNK_SIZE = 4 * 1024 * 1024'), 'src/main/index.js eliminates 4MB chunk cap to support full movie seeking');
  assert(mainIndexCode.includes('fileSize - 1'), 'src/main/index.js sets end to requested value or fileSize - 1');

  // 17. فحص خطأ محرك المستندات التوضيحي عند تمرير PDF أو مدخل غير DOCX
  const documentEngineAudit = require('./src/main/engines/document-engine');
  const guardDummyPdf = path.join(__dirname, 'guard_test.pdf');
  fs.writeFileSync(guardDummyPdf, '%PDF-1.4 dummy file');
  let guardErrorCaught = false;
  try {
    await documentEngineAudit.convertDocument({
      taskId: 'guard_test_task',
      inputPath: guardDummyPdf,
      outputPath: path.join(__dirname, 'guard_out.pdf')
    });
  } catch (err) {
    guardErrorCaught = true;
    assert(err.message.includes('محرك المستندات المدمج مخصص لتحويل مستندات Word (DOCX / DOC) إلى PDF'), 'Descriptive error message thrown for PDF to PDF/document conversion');
  } finally {
    if (fs.existsSync(guardDummyPdf)) {
      try { fs.unlinkSync(guardDummyPdf); } catch (e) {}
    }
  }
  assert(guardErrorCaught, 'documentEngine rejects non-docx inputs with descriptive error');

  // 18. فحص أداة توحيد مقاسات وأبعاد الفيديو الجماعي (Batch Video Resolution Resizer)
  assert(typeof uiController.applyBatchVideoResize === 'function', 'uiController.applyBatchVideoResize is defined');
  const sampleVidTask = {
    taskId: 'vid_batch_test',
    name: 'test_vid.mp4',
    type: 'video',
    targetFormat: 'mp4',
    status: 'IDLE',
    options: { aspectRatio: 'source', resolution: 'source' }
  };
  appState.tasks.push(sampleVidTask);
  uiController.applyBatchVideoResize({ aspect: '9:16', res: '1080p', w: 1080, h: 1920, label: '9:16 تيك توك و Shorts (1080×1920)' });
  const updatedVid = appState.tasks.find(t => t.taskId === 'vid_batch_test');
  assert(updatedVid.options.aspectRatio === '9:16', 'applyBatchVideoResize sets aspectRatio to 9:16');
  assert(updatedVid.options.resolution === '1080p', 'applyBatchVideoResize sets resolution to 1080p');
  assert(updatedVid.options.customWidth === 1080, 'applyBatchVideoResize sets customWidth to 1080');
  assert(updatedVid.options.customHeight === 1920, 'applyBatchVideoResize sets customHeight to 1920');

  const estVideo = uiController.calculateEstimatedOutput(updatedVid);
  assert(estVideo.dim.includes('1080×1920 (9:16 TikTok)'), 'calculateEstimatedOutput accurately reflects batch video resize dimensions');

  // 19. فحص مشغل معاينة الصوت المباشر في بطاقة المهمة
  const sampleAudioTask = {
    taskId: 'aud_preview_test',
    name: 'sample_audio.mp3',
    type: 'audio',
    extension: 'mp3',
    filePath: 'C:\\Music\\sample_audio.mp3',
    targetFormat: 'mp3',
    status: 'IDLE',
    options: {}
  };
  const audioCardEl = uiController.createTaskCardElement(sampleAudioTask);
  const previewBtnEl = audioCardEl.querySelector('.btn-audio-preview');
  assert(previewBtnEl !== null, 'Audio task card renders .btn-audio-preview button');
  assert(audioCardEl.innerHTML.includes('title="معاينة الصوت"'), '.btn-audio-preview button has correct tooltip title');
  assert(audioCardEl.innerHTML.includes('▶'), '.btn-audio-preview button contains play icon');
  assert(typeof uiController.toggleAudioPreview === 'function', 'uiController.toggleAudioPreview is defined');
  assert(typeof uiController.stopAudioPreview === 'function', 'uiController.stopAudioPreview is defined');
  uiController.toggleAudioPreview(previewBtnEl, sampleAudioTask.filePath);
  assert(uiController.currentAudioPath === sampleAudioTask.filePath, 'toggleAudioPreview sets currentAudioPath');
  uiController.stopAudioPreview();
  assert(uiController.currentAudioPath === null, 'stopAudioPreview resets currentAudioPath');

  // 20. فحص تثبيت الهوية الرسمية OmniConvert وتوثيق حقوق المطور Sajed Tech وبيانات التواصل والترخيص
  console.log('\n[Brand & Developer Audit] Verifying OmniConvert Identity & Sajed Tech Developer Rights...');

  // فحص package.json
  const pkgData = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  assert(pkgData.name === 'omniconvert', 'package.json name is omniconvert');
  assert(pkgData.productName === 'OmniConvert', 'package.json productName is OmniConvert');
  assert(pkgData.author === 'Sajed Tech <sajedsupport@gmail.com>', 'package.json author matches Sajed Tech info');
  assert(pkgData.description && pkgData.description.includes('Sajed Tech'), 'package.json description includes Sajed Tech');
  assert(pkgData.repository && pkgData.repository.url === 'https://github.com/SajedPro1/OmniConvert.git', 'package.json repository matches OmniConvert repo');

  // فحص electron-builder.yml
  const builderYaml = fs.readFileSync(path.join(__dirname, 'electron-builder.yml'), 'utf8');
  assert(builderYaml.includes('appId: com.sajedpro.omniconvert'), 'electron-builder.yml appId is com.sajedpro.omniconvert');
  assert(builderYaml.includes('productName: OmniConvert'), 'electron-builder.yml productName is OmniConvert');
  assert(builderYaml.includes('copyright: Copyright © 2026 Sajed Tech. All rights reserved.'), 'electron-builder.yml copyright matches Sajed Tech 2026');
  assert(builderYaml.includes('companyName: "Sajed Tech"'), 'electron-builder.yml win companyName is Sajed Tech');
  assert(builderYaml.includes('fileDescription: "OmniConvert — High Performance Offline Media & Document Converter by Sajed Tech"'), 'electron-builder.yml win fileDescription matches Sajed Tech');

  // فحص قسم معلومات المطور في الواجهة (#aboutSection)
  assert(htmlContent.includes('id="aboutSection"'), 'index.html contains #aboutSection');
  assert(htmlContent.includes('OmniConvert v1.0.0'), 'index.html contains OmniConvert title and version');
  assert(htmlContent.includes('by Sajed Tech'), 'index.html contains by Sajed Tech badge');
  assert(htmlContent.includes('المطور:') && htmlContent.includes('Sajed Tech'), 'index.html contains developer Sajed Tech');
  assert(!htmlContent.includes('الترخيص (License)'), 'index.html does not contain merged (License) label');
  assert(htmlContent.includes('MIT License — Copyright (c) 2026 Sajed Tech'), 'index.html contains standard MIT license: MIT License — Copyright (c) 2026 Sajed Tech');
  assert(htmlContent.includes('data-url="https://github.com/SajedPro1/OmniConvert"'), 'index.html contains GitHub repo link');
  assert(htmlContent.includes('https://mail.google.com/mail/?view=cm') && htmlContent.includes('to=sajedsupport@gmail.com'), 'index.html contains Gmail direct support link');
  assert(htmlContent.includes('data-url="https://www.youtube.com/@SajedProyt"'), 'index.html contains YouTube channel link for SajedProyt');

  // فحص ربط قنوات فتح الروابط الخارجية بأمان (Preload, IPC Handlers, IPC Client)
  const ipcHandlersSrc = fs.readFileSync(path.join(__dirname, 'src/main/ipc-handlers.js'), 'utf8');
  assert(ipcHandlersSrc.includes("'system:open-external'"), 'ipc-handlers.js defines system:open-external channel');
  assert(ipcHandlersSrc.includes('/^(https?|mailto):/i'), 'system:open-external safely restricts protocols to https? and mailto');

  const preloadSrc = fs.readFileSync(path.join(__dirname, 'src/preload/index.js'), 'utf8');
  assert(preloadSrc.includes('openExternal:'), 'preload/index.js exposes openExternal');
  assert(preloadSrc.includes("'system:open-external'"), 'preload/index.js invokes system:open-external');

  const ipcClientSrc = fs.readFileSync(path.join(__dirname, 'src/renderer/scripts/ipc-client.js'), 'utf8');
  assert(ipcClientSrc.includes('openExternal(url)'), 'ipc-client.js implements openExternal method');

  // فحص تصيير شاشة الإعدادات برمجياً عبر uiController
  const mockSettingsView = new MockElement('settingsView', 'section');
  uiController.elements.settingsView = mockSettingsView;
  uiController.renderSettings(appState);
  assert(mockSettingsView.innerHTML.includes('id="aboutSection"'), 'renderSettings dynamically renders #aboutSection');
  assert(mockSettingsView.innerHTML.includes('by Sajed Tech'), 'renderSettings renders by Sajed Tech badge');
  assert(mockSettingsView.innerHTML.includes('https://github.com/SajedPro1/OmniConvert'), 'renderSettings renders GitHub repo link');
  assert(mockSettingsView.innerHTML.includes('https://mail.google.com/mail/?view=cm') && mockSettingsView.innerHTML.includes('to=sajedsupport@gmail.com'), 'renderSettings renders Gmail direct support link');
  assert(mockSettingsView.innerHTML.includes('https://www.youtube.com/@SajedProyt'), 'renderSettings renders YouTube channel link');
  assert(mockSettingsView.innerHTML.includes('MIT License — Copyright (c) 2026 Sajed Tech'), 'renderSettings renders standard MIT license: MIT License — Copyright (c) 2026 Sajed Tech');
}

testBackendEngine().then(() => {
  console.log('\n========================================================');
  console.log(`   AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('   ALL CHECKS & VERIFICATIONS COMPLETED SUCCESSFULLY!   ');
  console.log('========================================================\n');
  process.exit(0);
}).catch(err => {
  console.error('\n✕ Backend Audit Failed:', err);
  process.exit(1);
});
