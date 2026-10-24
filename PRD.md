U

# Open-UniConverter

وثيقة المتطلبات البرمجية والمواصفات المعمارية\
استنساخ محرك وبرمجية تحويل الوسائط المتعددة — تطبيق مكتبي مجاني، مفتوح المصدر، ويعمل دون إنترنت

ElectronNode.jsFFmpegSQLiteSharp

**الإصدار:** v1.0.0 Architecture Spec\
**التاريخ:** 23 أكتوبر 2026

[**01**هندسة واجهة وتجربة المستخدم](#s1) [**02**الحالات التفاعلية للواجهة](#s2) [**03**مصفوفة تحويل الفيديو](#s3) [**04**مصفوفة تحويل الصوت](#s4) [**05**مصفوفة تحويل الصور](#s5) [**06**تحويل المستندات دون إنترنت](#s6) [**07**المعمارية التقنية وتدفق البيانات](#s7) [**08**إدارة ثنائيات FFmpeg والتقدم والتزامن](#s8) [**09**خريطة قنوات IPC](#s9) [**10**قاعدة البيانات والسجلات](#s10) [**11**توجيهات التنفيذ والمراحل](#s11)

## 01 · هندسة واجهة وتجربة المستخدم

تعتمد الواجهة نمط التطبيق أحادي الصفحة (SPA) داخل إطار مكتبي، بنسق داكن عالي التباين مبني على متغيرات CSS، لخفض استهلاك المعالجة الرسومية وإجهاد العين، مع تخطيط شبكات مرنة يثبّت العناصر عند تغيير أبعاد النافذة.

### الشريط الجانبي الثابت (240px)

شعار التطبيق ومؤشر تسريع GPU، ثم قائمة التنقل: محول الفيديو، محول الصوت، معالج الصور، محول المستندات، سجل العمليات، إعدادات النظام. في أسفله لوحة السعة المتبقية لمجلد الإخراج مع زر لتغيير مسار الحفظ.

### منطقة السحب والإفلات (≥ 360px)

حدود متقطعة مرنة وأيقونة إيداع ونص بالصيغ المقبولة، وزران: اختيار ملفات متعددة، واختيار مجلد كامل (مسح تكراري يستخرج الملفات المتوافقة ويتجاهل الباقي). تُمنع الإجراءات الافتراضية لـ Chromium عند الإفلات.

### حاوية قائمة الانتظار

تحلّ محل منطقة الإفلات عند تسجيل ملف واحد على الأقل، وتستخدم التمرير الافتراضي (Virtual Scrolling) لمئات الملفات. شريط تحكم جماعي: الصيغة المستهدفة، إفراغ الرتل، بدء التحويل الجماعي، مسار التصدير.

الشكل 1 — مخطط الواجهة: الشريط الجانبي 240px (يمين) ومنطقة الإفلات المركزية.

### تشريح بطاقة المعالجة (task_id فريد)

▶

**Holiday_Clip_final_v2.mkv**

1.42 GB · 3840×2160 · 18.4 Mbps · 00:04:05

MP4 ▾1080p · CRF 23 ▾

⚙ متقدم

62.0%1.8xETA 01:34

✕ إلغاء🗑 حذف📂 فتح الموقع (عند النجاح)

الشكل 2 — بطاقة المهمة: كتلة بيانات المدخل · محدد الصيغة · شريط التقدم والقياسات · أزرار التحكم.

- **كتلة بيانات المدخل:** أيقونة النوع، الاسم مع اقتطاع `text-overflow: ellipsis`، الحجم (MB/GB)، الدقة ومعدل البت، المدة.
- **محدد الهدف:** قائمة هرمية (الحاوية ثم الـ Preset) وزر المعايير المتقدمة.
- **التقدم والقياسات:** نسبة بدقة أحادية، السرعة قياساً للزمن الحقيقي (مثل 1.8x)، والوقت المتبقي ETA.
- **التحكم:** إلغاء فوري مع إشارة مقاطعة للعملية، حذف البطاقة، وفتح الموقع عند النجاح.

## 02 · الحالات التفاعلية للواجهة

| الحالة | المحفز التقني | السلوك البصري / DOM | الإجراءات المتاحة |
| --- | --- | --- | --- |
| فارغة (Empty) | `tasks.length === 0` | إخفاء جدول البطاقات، إظهار منطقة الإفلات، تعطيل زر التحويل الجماعي. | فتح منتقي الملفات/المجلدات أو الإفلات مباشرة. |
| التحليق (Drag-Over) | `dragenter`/`dragover` مع ملفات متوافقة | تراكب زجاجي شفاف، توهج حدود المنطقة، نص «أفلت الملفات». | الإفلات للتسجيل، أو الخروج لإلغاء التراكب. |
| المعالجة (Processing) | إرسال أمر البدء وتنشيط المعالجة الخلفية | تجميد القوائم، زر البدء يتحول لمؤشر تحميل، بث التقدم آنياً. | إيقاف مؤقت، إلغاء فردي قسري، أو إلغاء الكل. |
| النجاح (Success) | حدث الاكتمال دون أخطاء | شريط أخضر مصمت، علامة اكتمال، زر استعراض المجلد. | فتح الملف، فتح المجلد، تنظيف السجل. |
| الفشل (Error) | استثناء أو خروج بكود غير صفري | شريط أحمر، شارة خطأ، تفعيل زر سجل الاستثناء. | فحص السجل، تعديل البارامترات، إعادة المحاولة. |

## 03 · مصفوفة تحويل الفيديو (FFmpeg)

المدخلات المدعومة لكل الصيغ: MP4, MKV, AVI, WebM, MOV (مع اختلاف مصادر الحالات الخاصة أدناه).

| الإخراج | Codecs | الدقة | معدل البت | وسائط FFmpeg الإلزامية |
| --- | --- | --- | --- | --- |
| MP4 | libx264, libx265 · aac | المصدر، 4K، 1080p، 720p، 480p | CRF (18–28) أو VBR مع Maxrate | `-pix_fmt yuv420p -movflags +faststart` |
| MKV | libx264, libx265, libvpx-vp9 · aac, flac, ac3 | المصدر، 4K، 1080p، 720p | CRF (16–26) أو Two-pass CBR/VBR | `-map 0 -c:s copy` (الاحتفاظ بكل مسارات الترجمة) |
| WebM | libvpx-vp9 · libopus | المصدر، 1080p، 720p، 480p | VBR مقيد بـ `-b:v` مع `-crf 30` | `-deadline good -cpu-used 2 -row-mt 1` |
| AVI | mpeg4, libxvid · libmp3lame | المصدر، 1080p، 720p | CBR ثابت (1500k–6000k) | `-vtag XVID` للتوافق مع المشغلات القديمة (المدخل: MP4, MKV, WebM, MOV) |
| MOV | prores_ks, libx264 · pcm_s16le, aac | المصدر، 4K، 1080p | بروفايل ProRes (0–3) أو H.264 High | `-profile:v 3 -vendor apl0` (المدخل: MP4, MKV, AVI, WebM) |

## 04 · مصفوفة تحويل واستخراج الصوت

مسارا العمل: تحويل مباشر بين الصيغ الصوتية، واستخراج الصوت من الفيديو بتجريد تدفقات الصورة. المدخلات: وسائط فيديو أو ملفات صوت.

| الإخراج | المرماز | معدلات البت | معدلات العينات | سياسة القنوات والمعالجة |
| --- | --- | --- | --- | --- |
| MP3 | libmp3lame | CBR: 128k/192k/256k/320k · VBR: V0, V2 | 44100, 48000 Hz | Stereo أو Mono عبر `-ac 2` / `-ac 1` |
| WAV | pcm_s16le, pcm_s24le | PCM خام غير مضغوط | 44100, 48000, 96000 Hz | الحفاظ على العمق البتي للمصدر وتردد القنوات الأصلي |
| FLAC | flac | غير فاقد (المستويات 0–8) | حتى 96000 Hz (24-bit) | `-compression_level 5` |
| AAC | aac | 96k/128k/192k/256k/320k | 44100, 48000 Hz | LC-AAC عبر حاوية ADTS |
| OGG | libvorbis / libopus | 64k/128k/192k/256k | 48000 Hz إلزامي لـ Opus | ترميز منخفض البيانات عالي الكفاءة |

## 05 · مصفوفة تحويل الصور (Sharp / libvips)

| المدخل → الإخراج | الأبعاد | الجودة والضغط | الشفافية واللون |
| --- | --- | --- | --- |
| JPG, PNG, WebP, BMP, TIFF → JPG | مخصصة، نسبة مئوية، أو الأصل | الجودة 1–100، MozJPEG، تدريجي | إزالة ألفا ودمجها فوق خلفية بيضاء |
| JPG, PNG, WebP, BMP → PNG | `fit: inside/cover/fill` | الضغط 0–9، ألوان اللوحة (Palette) | حفظ الشفافية وتصحيح حدود ألفا |
| JPG, PNG, BMP → WebP | مع الحفاظ على النسبة | Lossy (1–100) أو Lossless | شفافية كاملة وضغط عالي الكفاءة |
| JPG, PNG, WebP → BMP | إعادة تحجيم إجباري | غير مضغوط (Raw 24/32-bit) | تسطيح الألوان وفق التنسيق التقليدي |
| JPG, PNG, WebP, BMP → ICO (Sharp + sharp-ico) | 16, 32, 48, 64, 128, 256 بكسل | دمج أحجام متعددة في حاوية واحدة | شفافية PNG داخل ICO |

## 06 · تحويل المستندات دون إنترنت (DOCX → PDF)

يُتجنب استخدام واجهات سحابية أو حزم مثل `docx-pdf` التي تحتاج برمجيات مثبتة. يعتمد النظام آلية هجينة محلية (mammoth + محرك الطباعة في Chromium):

1. قراءة ملف `.docx` (OpenXML) عبر mammoth واستخراج النصوص والجداول والتنسيقات، مع تحويل الصور إلى `data:image/...;base64`.
2. إنشاء `BrowserWindow` خفية (Headless / Offscreen) بلا إطارات.
3. حقن HTML الناتج عبر data URL مع CSS طباعي: `@page`، هوامش 20mm، وخطوط مفتوحة مضمنة محلياً لسلامة العربية واللاتينية.
4. استدعاء `webContents.printToPDF` بخيارات `pageSize: 'A4', printBackground: true` وحفظ الناتج في مسار الهدف.

## 07 · المعمارية التقنية وتدفق البيانات

فصل صارم بين العمليات في Electron.js: مسار العرض (Renderer) في صندوق Chromium الرملي معزول عن المسار الرئيسي (Main) صاحب صلاحيات النظام. الوصل بينهما عبر `contextBridge` و`preload.js`.

RendererVanilla JS · HTML5 · CSS

PreloadcontextBridge · electronAPI

Main Processipc-handlers · queue-manager

Queue ManagerSemaphore

▼ توجيه الأوامر إلى وحدات المعالجة ▼

FFmpeg PoolSubprocess · fluent-ffmpeg

Sharp Enginelibvips

Mammoth PrintprintToPDF

SQLitebetter-sqlite3 · WAL

الشكل 3 — مسار البيانات من الواجهة إلى Preload ثم Main والعمليات الفرعية.

### تقنيات الواجهة وتأمين البيئة

Vanilla JavaScript (ES2022+) مع HTML5 دلالي وModern CSS دون أطر ثقيلة. إعدادات `BrowserWindow` الأمنية الإلزامية:

```
webPreferences: {
  nodeIntegration: false,   // حظر Node.js في الواجهة
  contextIsolation: true,   // فصل نطاق الواجهة عن preload
  sandbox: true             // صندوق Chromium الرملي
}
```

## 08 · FFmpeg: التجميع والتقدم والتزامن

### ثنائيات FFmpeg وحزم التوزيع

حزم `fluent-ffmpeg` داخل `app.asar` يمنع `child_process.spawn` من تنفيذ الثنائيات. الحل: إخراجها خارج الأرشيف:

```
"build": {
  "asar": true,
  "asarUnpack": [
    "node_modules/ffmpeg-static/bin/**/*",
    "node_modules/ffprobe-static/bin/**/*"
  ]
}
```

```
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

function resolveBinaryPath(binPath) {
  if (!binPath) return binPath;
  return binPath.replace('app.asar', 'app.asar.unpacked');
}

ffmpeg.setFfmpegPath(resolveBinaryPath(ffmpegStatic));
ffmpeg.setFfprobePath(resolveBinaryPath(ffprobeStatic.path));
```

### خوارزمية التقدم والزمن المتبقي

تُرجع `fluent-ffmpeg` القيمة `undefined` لـ `progress.percent` إن لم تُقرأ المدة من الترويسة؛ لذا يُجرى فحص `ffprobe` إلزامي لاستخراج المدة الكلية *D*total بالثواني، ثم تُحوَّل `timemark` (HH:MM:SS.ms) إلى *T*current:

P = min( 100.0 , ( Tcurrent / Dtotal ) × 100.0 )

Tremaining = ( Telapsed × (100.0 − P) ) / max( P , 0.001 )

### تزامن الرتل والتحكم بالعتاد

يستخدم مدير الرتل خوارزمية Semaphore؛ والمهام الفائضة تدخل حالة `QUEUED` وتُعالج فور تحرر مقعد. *N*cores مأخوذ من `os.cpus().length`:

Cvideo = max( 1 , min( 3 , ⌊ Ncores / 2 ⌋ ) )

مهام الصور والمستندات تُدار برتل منفصل بتزامن أوسع (*N*cores − 1) لانخفاض زمن تنفيذها واعتمادها على الذاكرة السريعة.

## 09 · خريطة قنوات الاتصال البيني (IPC)

جميع الاتصالات عبر واجهة `electronAPI` الممررة من `preload.js`.

| القناة | الاتجاه | حمولة الطلب | الاستجابة / الحدث | الوظيفة |
| --- | --- | --- | --- | --- |
| media:select-files | R→M · invoke | { type: 'video'\|'audio'\|'image'\|'all' } | { canceled, filePaths\[\] } | منتقي الملفات بمرشحات القسم النشط. |
| media:drop-files | R→M · invoke | { filePaths\[\] } | { success, files: FileMetadata\[\] } | قراءة مواصفات الملفات المسقطة (الحجم، الامتداد، الأبعاد). |
| conversion:start | R→M · invoke | { taskId, inputPath, targetFormat, options } | { accepted, message } | تسجيل المهمة في الرتل وتخصيص الموارد. |
| conversion:pause | R→M · invoke | { taskId } | { success } | تعليق التنفيذ إن دعم النظام ذلك. |
| conversion:cancel | R→M · invoke | { taskId } | { success } | إنهاء العملية وحذف الملفات المؤقتة. |
| conversion:progress | M→R · send | — (بث أحادي) | { taskId, percent, speed, eta, timemark } | بث مرتين/ثانية لتحديث شريط التقدم. |
| conversion:complete | M→R · send | — (بث أحادي) | { taskId, outputPath, finalSize, duration } | اكتمال التحويل وتوثيقه في القاعدة وتحويل البطاقة إلى نجاح. |
| conversion:error | M→R · send | — (بث أحادي) | { taskId, errorMessage, code } | إعلام الواجهة بالإخفاق وتفاصيله. |
| queue:cancel-all | R→M · invoke | {} | { cancelledCount } | إيقاف شامل وإفراغ الرتل وحذف الملفات الجزئية. |
| system:open-path | R→M · invoke | { targetPath, isFolder } | { success, error? } | عرض الملف أو المجلد في مستكشف النظام عبر `shell`. |
| history:get | R→M · invoke | { limit, offset } | { records\[\], total } | جلب السجل مع تصفح مقسم. |
| history:delete | R→M · invoke | { id?, clearAll? } | { success, affectedRows } | حذف سجل أو مسح التاريخ بالكامل. |

## 10 · هيكل قاعدة البيانات وإدارة السجلات

SQLite 3 مدمج عبر `better-sqlite3` (عمليات متزامنة عالية الأداء) في المسار:

```
path.join(app.getPath('userData'), 'database', 'history.db')
```

```
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS conversion_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_uid TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    original_path TEXT NOT NULL,
    original_size INTEGER NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    final_size INTEGER DEFAULT 0,
    file_path TEXT NOT NULL,
    duration REAL DEFAULT 0.0,
    conversion_time_ms INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_timestamp ON conversion_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_history_status ON conversion_history(status);
CREATE INDEX IF NOT EXISTS idx_history_format ON conversion_history(output_format);
```

الرموز: مفتاح أساسي · إلزامي (NOT NULL) · يقبل الإلغاء (Nullable).

| الحقل | النوع | القيود | الوصف | مثال |
| --- | --- | --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | المعرف التسلسلي التلقائي للسجل. | 1 |
| task_uid | TEXT | UNIQUE NOT NULL | معرف المهمة (UUID v4) المولد في الواجهة. | a8098c1a-f86e-11da-bd1a |
| original_name | TEXT | NOT NULL | اسم الملف المدخل مع الامتداد. | Project_Brief.docx |
| original_path | TEXT | NOT NULL | المسار المطلق للمصدر عند التحميل. | C:\\Users\\Admin\\Docs\\Brief.docx |
| original_size | INTEGER | NOT NULL | حجم المصدر بالبايتات. | 15482930 (14.76 MB) |
| input_format | TEXT | NOT NULL | امتداد المدخل بلا نقطة وبأحرف صغيرة. | docx |
| output_format | TEXT | NOT NULL | الصيغة المستهدفة للناتج. | pdf |
| final_size | INTEGER | DEFAULT 0 | حجم الناتج بالبايتات بعد الاكتمال. | 1298412 (1.24 MB) |
| file_path | TEXT | NOT NULL | المسار المطلق للملف النهائي. | D:\\Converted\\Brief.pdf |
| duration | REAL | DEFAULT 0.0 | مدة الوسائط المدخلة بالثواني. | 245.54 |
| conversion_time_ms | INTEGER | DEFAULT 0 | زمن المعالجة الفعلي بالمللي ثانية. | 8420 (8.42 s) |
| status | TEXT | CHECK ENUM | الحالة: PENDING / PROCESSING / COMPLETED / FAILED / CANCELLED. | COMPLETED |
| error_message | TEXT | — | تفاصيل الخطأ عند الفشل. | ffmpeg exited with code 1 |
| timestamp | DATETIME | DEFAULT CURRENT_TIMESTAMP | وقت تسجيل المعالجة بتوقيت UTC. | 2026-10-23 15:40:12 |

## 11 · توجيهات التنفيذ للمطور الآلي

### شجرة المشروع

```
open-uniconverter/
├─ package.json
├─ electron-builder.yml
└─ src/
   ├─ main/
   │  ├─ index.js
   │  ├─ ipc-handlers.js
   │  ├─ queue-manager.js
   │  ├─ database.js
   │  └─ engines/
   │     ├─ media-engine.js
   │     ├─ image-engine.js
   │     └─ document-engine.js
   ├─ preload/index.js
   └─ renderer/
      ├─ index.html
      ├─ styles/  main.css · sidebar.css · queue.css
      └─ scripts/ app.js · state.js · ui-controller.js · ipc-client.js
```

### المراحل المتسلسلة

1. **المرحلة 1 — تهيئة الحزم والبناء:** إنشاء `package.json` وتثبيت better-sqlite3, fluent-ffmpeg, ffmpeg-static, ffprobe-static, sharp, sharp-ico, mammoth، وتبعيات التطوير electron وelectron-builder؛ وضبط `electron-builder.yml` لتفكيك ثنائيات ffmpeg/ffprobe وNode الخاصة بـ sharp وbetter-sqlite3 خارج ASAR.
2. **المرحلة 2 — طبقة النظام ومحركات المعالجة:** `database.js` (الجداول والفهارس وWAL والدوال insertTask, updateTaskProgress, completeTask, failTask, fetchHistory)؛ `media-engine.js` (فحص ffprobe ومعادلة P)؛ `image-engine.js` (Sharp وsharp-ico)؛ `document-engine.js` (mammoth ثم نافذة `show:false, offscreen:true` ثم printToPDF)؛ `queue-manager.js` (معادلة Cvideo)؛ `ipc-handlers.js` (ربط القنوات وإدارة الاستثناءات).
3. **المرحلة 3 — جسر السياق:** `contextBridge.exposeInMainWorld('electronAPI', {…})` مع تغليف `invoke` و`on` وتصفية المعاملات لمنع تسريب كائنات النظام الأصلية.
4. **المرحلة 4 — الواجهة والتفاعل:** الهيكل الدلالي وCSS المتغيرات للنمط الداكن؛ `state.js` لإدارة الرتل ومزامنته مع أحداث IPC؛ أحداث `dragover/dragleave/drop` مع تعطيل السلوك الافتراضي؛ `ui-controller.js` لإنشاء البطاقات ومزامنة التقدم عند `conversion:progress`؛ وأزرار التحكم الفردي والجماعي (بدء، إيقاف، حذف).