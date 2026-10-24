// src/main/engines/media-engine.js
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

/**
 * فك مسارات الثنائيات بأمان عند تجميع التطبيق داخل ASAR والتحقق من وجودها في الحزم المفكوكة
 * @param {string|object} rawPath - مسار الملف التنفيذي أو كائن مسار ffprobe-static
 * @returns {string} - المسار الفعلي الصالح للملف التنفيذي
 */
function getSafeBinaryPath(rawPath) {
  if (!rawPath) return rawPath;
  let binPath = typeof rawPath === 'object' && rawPath.path ? rawPath.path : rawPath;
  if (typeof binPath !== 'string') return binPath;

  // 1) استبدال app.asar بـ app.asar.unpacked
  const unpackedPath = binPath.replace('app.asar', 'app.asar.unpacked');

  // 2) فحص وجود الملف في المسار المفكوك
  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }

  // إذا كان المسار الأصلي موجوداً (في بيئة التطوير المحلية دون حزم)
  if (fs.existsSync(binPath)) {
    return binPath;
  }

  // 3) البحث الذكي في المسارات المجاورة والأدلة الفرعية
  const exeName = path.basename(binPath);
  const dir = path.dirname(unpackedPath);

  const candidatePaths = [
    path.join(dir, exeName),
    path.join(dir, 'bin', exeName),
    path.join(dir, 'bin', process.platform, process.arch, exeName),
    path.join(dir, '..', exeName),
    path.join(dir, '..', 'bin', exeName),
    path.join(dir, '..', '..', exeName),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', exeName),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'ffprobe-static', 'bin', process.platform, process.arch, exeName)
  ];

  for (const candidate of candidatePaths) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (e) {}
  }

  return unpackedPath;
}

/**
 * دالة متوافقة مع الإصدارات السابقة
 */
function resolveBinaryPath(binPath) {
  return getSafeBinaryPath(binPath);
}

// ضبط مسارات ثنائيات FFmpeg وFFprobe بأمان تام
const resolvedFfmpegPath = getSafeBinaryPath(ffmpegStatic);
const resolvedFfprobePath = getSafeBinaryPath(ffprobeStatic && ffprobeStatic.path ? ffprobeStatic.path : ffprobeStatic);

if (resolvedFfmpegPath) ffmpeg.setFfmpegPath(resolvedFfmpegPath);
if (resolvedFfprobePath) ffmpeg.setFfprobePath(resolvedFfprobePath);

// خريطة لتتبع المهام الجارية لإتاحة الإلغاء الفوري
const activeTasks = new Map();

// ذاكرة تخزين مؤقت لنتيجة فحص كارت الشاشة (GPU Detection)
let gpuDetectionResult = null;
let gpuDetectionPromise = null;

/**
 * التحقق البرمجي السريع من دعم مشفرات NVIDIA NVENC العتادية
 */
async function detectGpuSupport() {
  if (gpuDetectionResult !== null) return gpuDetectionResult;
  if (gpuDetectionPromise) return gpuDetectionPromise;

  gpuDetectionPromise = new Promise((resolve) => {
    const fPath = resolvedFfmpegPath;
    if (!fPath) {
      gpuDetectionResult = { hasGpu: false, h264_nvenc: false, hevc_nvenc: false };
      return resolve(gpuDetectionResult);
    }

    // اختبار سريع لتشفير إطار تجريبي عبر h264_nvenc
    execFile(fPath, ['-f', 'lavfi', '-i', 'nullsrc=s=64x64:d=0.05', '-c:v', 'h264_nvenc', '-f', 'null', '-'], (err) => {
      const h264Nvenc = !err;
      if (!h264Nvenc) {
        gpuDetectionResult = { hasGpu: false, h264_nvenc: false, hevc_nvenc: false };
        return resolve(gpuDetectionResult);
      }

      // اختبار hevc_nvenc
      execFile(fPath, ['-f', 'lavfi', '-i', 'nullsrc=s=64x64:d=0.05', '-c:v', 'hevc_nvenc', '-f', 'null', '-'], (hevcErr) => {
        gpuDetectionResult = {
          hasGpu: true,
          h264_nvenc: true,
          hevc_nvenc: !hevcErr
        };
        resolve(gpuDetectionResult);
      });
    });
  });

  return gpuDetectionPromise;
}

// بدء الفحص مبكراً في الخلفية
detectGpuSupport().catch(() => {});

/**
 * فحص إمكانية النقل المباشر الفوري للتيارات (Ultra-Fast Stream Copy / Remuxing)
 * يتأكد من توافق كوديك الفيديو والصوت مع الحاوية المستهدفة وخلو العملية من طلبات إعادة التشفير
 */
function isStreamCopyPossible(sourceMeta, targetFormat, options = {}) {
  // إذا تم طلب فلاتر تحرير أو تقطيع أو تدوير أو دمج ترجمة أو قص حر
  const e = options.edits || {};
  const hasEdits = Boolean(
    e.crop || e.rotate || e.hflip || e.vflip || e.flip ||
    e.adjustments || e.preset || e.filterPreset ||
    e.subtitle || e.subtitlePath || options.subtitle || options.subtitlePath ||
    (e.audio && (e.audio.volume !== undefined || e.audio.denoise || e.audio.afftdn || e.audio.loudnorm)) ||
    e.loudnorm || e.playbackSpeed || e.speed ||
    options.loudnorm || (options.playbackSpeed && Number(options.playbackSpeed) !== 1) ||
    (options.audioTrackIndex !== undefined && options.audioTrackIndex !== null && options.audioTrackIndex !== '' && options.audioTrackIndex !== '0' && options.audioTrackIndex !== 0 && options.audioTrackIndex !== 'all') ||
    (options.subtitleTrackIndex !== undefined && options.subtitleTrackIndex !== null && options.subtitleTrackIndex !== 'none') ||
    (e.trim && (Array.isArray(e.trim) ? e.trim.length > 0 : (e.trim.end > e.trim.start))) ||
    options.crop || options.trim || options.startSec !== undefined || options.endSec !== undefined ||
    (options.aspectRatio === 'free-crop')
  );
  if (hasEdits) return false;

  // إذا تم تحديد دقة معينة أو نسبة أبعاد مختلفة عن الأصل أو معدل بت للفيديو
  if (options.resolution && options.resolution !== 'source' && options.resolution !== 'original') {
    return false;
  }
  if (options.aspectRatio && options.aspectRatio !== 'source' && options.aspectRatio !== 'original') {
    return false;
  }
  if (options.videoBitrate || options.fps) {
    return false;
  }

  const fmt = (targetFormat || '').toLowerCase().replace(/^\./, '');
  const vCodec = (sourceMeta.video?.codec || '').toLowerCase();
  const aCodec = (sourceMeta.audio?.codec || '').toLowerCase();

  // جدول توافق الحاويات القياسية مع كوديكات البث المباشر
  const containerSupport = {
    mp4: {
      video: ['h264', 'hevc', 'h265', 'av1', 'vp9', 'mpeg4'],
      audio: ['aac', 'mp3', 'opus', 'ac3', 'eac3', 'flac', 'alac']
    },
    mkv: {
      video: ['h264', 'hevc', 'h265', 'vp8', 'vp9', 'av1', 'mpeg4', 'mpeg2video', 'mjpeg', 'prores', 'vc1', 'theora'],
      audio: ['aac', 'mp3', 'flac', 'opus', 'vorbis', 'ac3', 'eac3', 'dts', 'pcm_s16le', 'pcm_s24le', 'alac']
    },
    webm: {
      video: ['vp8', 'vp9', 'av1'],
      audio: ['opus', 'vorbis']
    },
    avi: {
      video: ['h264', 'mpeg4', 'msmpeg4v3', 'mjpeg'],
      audio: ['mp3', 'pcm_s16le', 'ac3']
    },
    mov: {
      video: ['h264', 'hevc', 'h265', 'prores', 'mpeg4', 'mjpeg'],
      audio: ['aac', 'pcm_s16le', 'pcm_s24le', 'mp3', 'alac']
    }
  };

  const support = containerSupport[fmt];
  if (!support) return false;

  if (sourceMeta.hasVideo && vCodec) {
    if (!support.video.includes(vCodec)) return false;
  }

  if (sourceMeta.hasAudio && aCodec) {
    if (!support.audio.includes(aCodec)) return false;
  }

  return true;
}

/**
 * تطهير مسار ملف الترجمة لنظام ويندوز (Windows Subtitle Path Sanitizer)
 */
function sanitizeSubtitlePath(subPath) {
  if (!subPath) return '';
  let p = subPath.replace(/\\/g, '/');
  // الهروب البرمجي لجميع النقطتين الرأسيتين لضمان عدم اعتبارها وسائط فلاتر في FFmpeg
  p = p.replace(/:/g, '\\:');
  p = p.replace(/'/g, "'\\\\''");
  return p;
}

/**
 * تحويل نص Timemark (HH:MM:SS.ms) إلى ثوانٍ
 */
function timemarkToSeconds(timemark) {
  if (!timemark || typeof timemark !== 'string') return 0;
  const parts = timemark.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(timemark) || 0;
}

/**
 * تنسيق الثواني إلى صيغة (MM:SS) أو (HH:MM:SS)
 */
function formatEta(seconds) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '--:--';
  const s = Math.round(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * فحص الوسائط واستخراج الخصائص الفنية عبر ffprobe
 */
function probeMedia(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`الملف غير موجود: ${filePath}`));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const format = metadata.format || {};
      const streams = metadata.streams || [];

      const videoStream = streams.find(s => s.codec_type === 'video');
      const audioStream = streams.find(s => s.codec_type === 'audio');
      const subtitleStreams = streams.filter(s => s.codec_type === 'subtitle');

      let duration = parseFloat(format.duration);
      if (isNaN(duration) || duration <= 0) {
        if (videoStream && videoStream.duration) {
          duration = parseFloat(videoStream.duration);
        } else if (audioStream && audioStream.duration) {
          duration = parseFloat(audioStream.duration);
        } else {
          duration = 0;
        }
      }

      let fps = 0;
      if (videoStream && videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) !== 0) {
          fps = Math.round((parseFloat(parts[0]) / parseFloat(parts[1])) * 100) / 100;
        } else {
          fps = parseFloat(videoStream.r_frame_rate) || 0;
        }
      }

      const allAudioStreams = streams.filter(s => s.codec_type === 'audio').map((s, idx) => ({
        streamIndex: s.index,
        audioIndex: idx,
        codec: s.codec_name || '',
        channels: s.channels || 2,
        sampleRate: parseInt(s.sample_rate, 10) || 0,
        bitRate: parseInt(s.bit_rate, 10) || 0,
        language: (s.tags && (s.tags.language || s.tags.LANGUAGE)) || '',
        title: (s.tags && (s.tags.title || s.tags.TITLE)) || ''
      }));

      const allSubtitleStreams = streams.filter(s => s.codec_type === 'subtitle').map((s, idx) => ({
        streamIndex: s.index,
        subtitleIndex: idx,
        codec: s.codec_name || '',
        language: (s.tags && (s.tags.language || s.tags.LANGUAGE)) || '',
        title: (s.tags && (s.tags.title || s.tags.TITLE)) || ''
      }));

      resolve({
        filePath,
        inputPath: filePath,
        formatName: format.format_name || '',
        duration,
        bitRate: parseInt(format.bit_rate, 10) || 0,
        size: format.size || 0,
        hasVideo: Boolean(videoStream),
        hasAudio: Boolean(audioStream),
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps,
          bitRate: parseInt(videoStream.bit_rate, 10) || 0,
          aspectRatio: videoStream.display_aspect_ratio || ''
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          sampleRate: parseInt(audioStream.sample_rate, 10) || 0,
          channels: audioStream.channels || 0,
          bitRate: parseInt(audioStream.bit_rate, 10) || 0
        } : null,
        audioStreams: allAudioStreams,
        subtitleStreams: allSubtitleStreams,
        subtitlesCount: allSubtitleStreams.length
      });
    });
  });
}

/**
 * دقة الفيديو المستهدفة بناءً على الخيارات
 */
function applyResolutionOption(command, resolution) {
  if (!resolution || resolution === 'source' || resolution === 'original') return;

  const resolutionMap = {
    '4k': { width: 3840, height: 2160 },
    '2160p': { width: 3840, height: 2160 },
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 },
    '480p': { width: 854, height: 480 },
    '360p': { width: 640, height: 360 }
  };

  const target = resolutionMap[String(resolution).toLowerCase()];
  if (target) {
    command.size(`${target.width}x?`).autopad();
  }
}

/**
 * حساب أبعاد الفيديو المستهدفة بناءً على النسبة المطلوبة والدقة
 */
function getAspectRatioDimensions(aspectRatio, resolution = '1080p') {
  if (!aspectRatio || aspectRatio === 'source' || aspectRatio === 'original' || aspectRatio === 'free-crop' || aspectRatio === 'custom') return null;

  const res = String(resolution || '1080p').toLowerCase();

  const tables = {
    '16:9': {
      '4k': { width: 3840, height: 2160 },
      '2160p': { width: 3840, height: 2160 },
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      'default': { width: 1920, height: 1080 }
    },
    '9:16': {
      '4k': { width: 2160, height: 3840 },
      '2160p': { width: 2160, height: 3840 },
      '1080p': { width: 1080, height: 1920 },
      '720p': { width: 720, height: 1280 },
      '480p': { width: 480, height: 854 },
      'default': { width: 1080, height: 1920 }
    },
    '1:1': {
      '4k': { width: 2160, height: 2160 },
      '2160p': { width: 2160, height: 2160 },
      '1080p': { width: 1080, height: 1080 },
      '720p': { width: 720, height: 720 },
      '480p': { width: 480, height: 480 },
      'default': { width: 1080, height: 1080 }
    },
    '4:3': {
      '4k': { width: 2880, height: 2160 },
      '2160p': { width: 2880, height: 2160 },
      '1080p': { width: 1440, height: 1080 },
      '720p': { width: 960, height: 720 },
      '480p': { width: 640, height: 480 },
      'default': { width: 1440, height: 1080 }
    }
  };

  const group = tables[aspectRatio];
  if (!group) return null;
  return group[res] || group['default'];
}

/**
 * بناء وتطبيق خط أنابيب المرشحات والتعديلات المتقدمة (Video Editing Pipeline)
 */
function applyEditingPipeline(command, edits = {}, sourceMeta = {}) {
  if (!edits || typeof edits !== 'object') {
    return { effectiveDuration: sourceMeta.duration || 0 };
  }

  let effectiveDuration = sourceMeta.duration || 0;

  // 1. فحص التقطيع الزمني (Trim)
  let trimSegments = [];
  if (edits.trim) {
    if (Array.isArray(edits.trim)) {
      trimSegments = edits.trim.filter(s => s && typeof (s.start ?? s.startSec) === 'number' && typeof (s.end ?? s.endSec) === 'number' && (s.end ?? s.endSec) > (s.start ?? s.startSec)).map(s => ({
        start: s.start !== undefined ? s.start : s.startSec,
        end: s.end !== undefined ? s.end : s.endSec
      }));
    } else if (typeof edits.trim === 'object') {
      const s = edits.trim.start !== undefined ? edits.trim.start : edits.trim.startSec;
      const e = edits.trim.end !== undefined ? edits.trim.end : edits.trim.endSec;
      if (typeof s === 'number' && typeof e === 'number' && e > s) {
        trimSegments = [{ start: s, end: e }];
      }
    }
  } else if (edits.startSec !== undefined || edits.endSec !== undefined) {
    const s = Number(edits.startSec) || 0;
    const e = Number(edits.endSec) || 0;
    if (e > s) {
      trimSegments = [{ start: s, end: e }];
    }
  }

  if (trimSegments.length > 0) {
    effectiveDuration = trimSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
  }

  const vFilters = [];
  const aFilters = [];

  // 2. الاقتصاص المكاني (Crop) مع فرض أبعاد زوجية
  if (edits.crop && typeof edits.crop === 'object') {
    let w = Math.round(Number(edits.crop.width ?? edits.crop.cropW ?? edits.crop.w ?? 0));
    let h = Math.round(Number(edits.crop.height ?? edits.crop.cropH ?? edits.crop.h ?? 0));
    let x = Math.round(Number(edits.crop.x ?? edits.crop.cropX ?? 0));
    let y = Math.round(Number(edits.crop.y ?? edits.crop.cropY ?? 0));

    // قيد الأرقام الزوجية الإلزامي
    w = Math.max(16, w - (w % 2));
    h = Math.max(16, h - (h % 2));
    x = Math.max(0, x - (x % 2));
    y = Math.max(0, y - (y % 2));

    if (w > 0 && h > 0) {
      vFilters.push(`crop=w=${w}:h=${h}:x=${x}:y=${y}`);
    }
  }

  // أبعاد مخصصة صريحة للفيديو (Custom Scale)
  if (edits.customWidth && edits.customHeight) {
    let sw = Math.round(Number(edits.customWidth));
    let sh = Math.round(Number(edits.customHeight));
    if (sw > 0 && sh > 0) {
      sw = Math.max(16, sw - (sw % 2));
      sh = Math.max(16, sh - (sh % 2));
      vFilters.push(`scale=${sw}:${sh}`);
    }
  }

  // 3. التدوير والقلب (Geometry)
  if (edits.rotate) {
    const rot = Number(edits.rotate);
    if (rot === 90) {
      vFilters.push('transpose=1');
    } else if (rot === 180) {
      vFilters.push('transpose=1,transpose=1');
    } else if (rot === 270) {
      vFilters.push('transpose=2');
    }
  }

  if (edits.hflip || edits.flip === 'horizontal' || edits.flip === 'both') {
    vFilters.push('hflip');
  }
  if (edits.vflip || edits.flip === 'vertical' || edits.flip === 'both') {
    vFilters.push('vflip');
  }

  // 4. ضبط الألوان (Adjustments) - فلتر eq
  if (edits.adjustments && typeof edits.adjustments === 'object') {
    const adj = edits.adjustments;
    const eqParts = [];
    if (adj.contrast !== undefined && Number(adj.contrast) !== 1) {
      eqParts.push(`contrast=${Number(adj.contrast)}`);
    }
    if (adj.brightness !== undefined && Number(adj.brightness) !== 0) {
      eqParts.push(`brightness=${Number(adj.brightness)}`);
    }
    if (adj.saturation !== undefined && Number(adj.saturation) !== 1) {
      eqParts.push(`saturation=${Number(adj.saturation)}`);
    }
    if (adj.gamma !== undefined && Number(adj.gamma) !== 1) {
      eqParts.push(`gamma=${Number(adj.gamma)}`);
    }
    if (eqParts.length > 0) {
      vFilters.push(`eq=${eqParts.join(':')}`);
    }
  }

  // الفلاتر اللونية المسبقة (Color Presets / Curves)
  if (edits.preset || edits.filterPreset) {
    const p = String(edits.preset || edits.filterPreset).toLowerCase();
    if (p === 'vintage') {
      vFilters.push('curves=preset=vintage');
    } else if (p === 'cross_process' || p === 'dramatic') {
      vFilters.push('curves=preset=cross_process');
    } else if (p === 'color_negative' || p === 'negative') {
      vFilters.push('curves=preset=color_negative');
    } else if (p === 'warm') {
      vFilters.push('colorbalance=rs=0.15:gs=0.05:bs=-0.15');
    } else if (p === 'cool') {
      vFilters.push('colorbalance=rs=-0.1:gs=0.0:bs=0.15');
    } else if (p === 'bw' || p === 'monochrome' || p === 'grayscale') {
      vFilters.push('hue=s=0');
    } else if (p.startsWith('curves=') || p.startsWith('colorbalance=') || p.startsWith('eq=')) {
      vFilters.push(p);
    }
  }

  // 5. الترجمة المدمجة والخارجية وتنسيق المظهر (Subtitles Suite & Styling)
  const subFile = edits.subtitlePath || edits.subPath || edits.subtitle;
  const isBurn = edits.subtitleMode === 'burn' || edits.burnSubtitles || (Boolean(subFile) && edits.subtitleMode !== 'soft');

  const fontSize = parseInt(edits.subtitleFontSize || edits.fontSize, 10) || 24;
  const subPos = (edits.subtitlePosition || edits.position || 'bottom').toLowerCase();

  let alignment = 2; // Bottom center
  let marginV = 25;
  if (subPos === 'top') {
    alignment = 6; // Top center
    marginV = 25;
  } else if (subPos === 'center') {
    alignment = 10; // Middle center
    marginV = 0;
  }

  const forceStyle = `force_style='FontSize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=${marginV},Alignment=${alignment}'`;

  if (subFile && fs.existsSync(subFile)) {
    if (isBurn) {
      const sanitizedSub = sanitizeSubtitlePath(subFile);
      vFilters.push(`subtitles='${sanitizedSub}':${forceStyle}`);
    }
  } else if (edits.subtitleTrackIndex !== undefined && edits.subtitleTrackIndex !== null && edits.subtitleTrackIndex !== 'none' && isBurn) {
    const srcInput = sourceMeta.inputPath || sourceMeta.filePath;
    if (srcInput && fs.existsSync(srcInput)) {
      const sanitizedSrc = sanitizeSubtitlePath(srcInput);
      vFilters.push(`subtitles='${sanitizedSrc}':si=${edits.subtitleTrackIndex}:${forceStyle}`);
    }
  }

  // 6. مرشحات الصوت (Volume, Noise Reduction & Smart Loudnorm)
  if (edits.audio && typeof edits.audio === 'object') {
    const aud = edits.audio;
    if (aud.volume !== undefined && Number(aud.volume) !== 1) {
      aFilters.push(`volume=${Number(aud.volume)}`);
    }
    if (aud.denoise || aud.afftdn) {
      aFilters.push('afftdn=nr=12:nf=-50:tn=1');
    }
    if (aud.loudnorm) {
      aFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
    }
  }
  if (edits.loudnorm) {
    aFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  }

  // 7. سرعة العرض ومزامنة نبرة الصوت (Playback Speed)
  const speed = parseFloat(edits.playbackSpeed || edits.speed);
  if (speed && speed > 0 && speed !== 1) {
    const vPtsMultiplier = (1 / speed).toFixed(4);
    vFilters.push(`setpts=${vPtsMultiplier}*PTS`);
    if (sourceMeta.hasAudio) {
      aFilters.push(`atempo=${speed}`);
    }
    effectiveDuration = effectiveDuration / speed;
  }

  // تطبيق التقطيع والدمج (Trim & Concat)
  if (trimSegments.length > 1) {
    const complex = [];
    const concatInputs = [];

    for (let i = 0; i < trimSegments.length; i++) {
      const seg = trimSegments[i];
      complex.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v_seg_${i}]`);
      if (sourceMeta.hasAudio) {
        complex.push(`[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a_seg_${i}]`);
        concatInputs.push(`[v_seg_${i}][a_seg_${i}]`);
      } else {
        concatInputs.push(`[v_seg_${i}]`);
      }
    }

    const aParam = sourceMeta.hasAudio ? ':a=1' : ':a=0';
    let vConcatOut = '[v_concat]';
    let aConcatOut = sourceMeta.hasAudio ? '[a_concat]' : '';

    complex.push(`${concatInputs.join('')}concat=n=${trimSegments.length}:v=1${aParam}${vConcatOut}${aConcatOut}`);

    let currentV = 'v_concat';
    if (vFilters.length > 0) {
      complex.push(`[${currentV}]${vFilters.join(',')}[v_final]`);
      currentV = 'v_final';
    }

    let currentA = sourceMeta.hasAudio ? 'a_concat' : null;
    if (currentA && aFilters.length > 0) {
      complex.push(`[${currentA}]${aFilters.join(',')}[a_final]`);
      currentA = 'a_final';
    }

    const outputMaps = [currentV];
    if (currentA) outputMaps.push(currentA);

    command.complexFilter(complex, outputMaps);
  } else {
    if (trimSegments.length === 1) {
      const seg = trimSegments[0];
      const startSec = Number(seg.start ?? seg.startSec ?? 0);
      const endSec = Number(seg.end ?? seg.endSec ?? 0);
      if (endSec > startSec) {
        // استخدام وسائط الاقتطاع السريع عبر FFmpeg: -ss ${startSec} -to ${endSec}
        command.outputOptions([
          '-ss', String(startSec),
          '-to', String(endSec)
        ]);
        // تصفير التوقيت setpts=PTS-STARTPTS و asetpts=PTS-STARTPTS لضمان أن يبدأ الفيديو من الثانية صفر بسلاسة
        vFilters.unshift('setpts=PTS-STARTPTS');
        if (sourceMeta.hasAudio) {
          aFilters.unshift('asetpts=PTS-STARTPTS');
        }
      }
    }

    if (vFilters.length > 0) {
      command.videoFilters(vFilters);
    }
    if (aFilters.length > 0) {
      command.audioFilters(aFilters);
    }
  }

  return { effectiveDuration };
}

/**
 * ضبط معايير FFmpeg للفيديو والصوت استناداً إلى كارت الشاشة والنسخ المباشر
 */
function configureFfmpegOptions(command, targetFormat, options = {}, gpuSupport = null) {
  const fmt = (targetFormat || '').toLowerCase().replace(/^\./, '');
  const isAudioOnly = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(fmt);

  // 1. ميزة النقل المباشر الفوري (Ultra-Fast Stream Copy)
  if (options.isStreamCopy) {
    command.outputOptions([
      '-c', 'copy',
      '-map', '0'
    ]);
    if (fmt === 'mp4' || fmt === 'mov') {
      command.outputOptions(['-movflags', '+faststart']);
    }
    return fmt;
  }

  // 2. مصفوفة استخراج الصوت
  if (isAudioOnly) {
    command.noVideo();

    switch (fmt) {
      case 'mp3':
        command.audioCodec('libmp3lame');
        // مصفوفة معدلات البت: 320 kbps Studio, 256 kbps High, 192 kbps Standard, 128 kbps Eco
        command.audioBitrate(options.audioBitrate || '192k');
        if (options.sampleRate) command.audioFrequency(Number(options.sampleRate));
        if (options.channels) command.audioChannels(Number(options.channels));
        break;

      case 'wav':
        // غير مضغوط PCM 16/24-bit
        if (options.bitDepth === 24 || options.codec === 'pcm_s24le') {
          command.audioCodec('pcm_s24le');
        } else {
          command.audioCodec('pcm_s16le');
        }
        if (options.sampleRate) command.audioFrequency(Number(options.sampleRate));
        if (options.channels) command.audioChannels(Number(options.channels));
        break;

      case 'flac':
        // ضغط فائق بدون فقدان للجودة (Lossless)
        command.audioCodec('flac');
        command.outputOptions(['-compression_level', '5']);
        if (options.sampleRate) command.audioFrequency(Number(options.sampleRate));
        break;

      case 'aac':
        // ترميز عالي الكفاءة 256 kbps
        command.audioCodec('aac');
        command.audioBitrate(options.audioBitrate || '256k');
        if (options.sampleRate) command.audioFrequency(Number(options.sampleRate));
        break;

      case 'ogg':
        if (options.codec === 'libopus') {
          command.audioCodec('libopus');
          command.audioFrequency(48000);
        } else {
          command.audioCodec('libvorbis');
          if (options.sampleRate) command.audioFrequency(Number(options.sampleRate));
        }
        command.audioBitrate(options.audioBitrate || '128k');
        break;
    }

    return fmt;
  }

  // 3. مصفوفة تحويل الفيديو مع دعم كارت الشاشة (NVIDIA NVENC) والعودة الذكية للـ CPU
  const aspectDims = getAspectRatioDimensions(options.aspectRatio || options.aspectPreset, options.resolution);
  if (options.aspectRatio === 'custom' || (options.customWidth && options.customHeight)) {
    let customW = parseInt(options.customWidth || options.width, 10);
    let customH = parseInt(options.customHeight || options.height, 10);
    if (customW > 0 && customH > 0) {
      customW = Math.max(16, customW - (customW % 2));
      customH = Math.max(16, customH - (customH % 2));
      command.videoFilters([`scale=${customW}:${customH}`]);
    }
  } else if (aspectDims) {
    let W = aspectDims.width;
    let H = aspectDims.height;
    W = W - (W % 2);
    H = H - (H % 2);
    const fitMode = options.fitMode || 'fit';
    if (fitMode === 'fill') {
      // نمط ملء الشاشة وقص الأطراف (Fill / Crop)
      command.videoFilters([
        `scale=${W}:${H}:force_original_aspect_ratio=increase`,
        `crop=${W}:${H}`
      ]);
    } else {
      // نمط حواف سوداء (Fit / Letterbox)
      command.videoFilters([
        `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`
      ]);
    }
  } else if (options.resolution && options.resolution !== 'source' && options.resolution !== 'original') {
    applyResolutionOption(command, options.resolution);
  } else {
    // تصحيح وقائي للأبعاد الفردية للأبعاد الزوجية لمنع انهيار ضواغط YUV420p (x264/x265)
    if (!options.isStreamCopy && !isAudioOnly) {
      command.videoFilters(['scale=trunc(iw/2)*2:trunc(ih/2)*2']);
    }
  }

  const hasNvenc = Boolean(gpuSupport && gpuSupport.h264_nvenc);
  const hasHevcNvenc = Boolean(gpuSupport && gpuSupport.hevc_nvenc);

  switch (fmt) {
    case 'mp4': {
      const wantHevc = (options.videoCodec === 'libx265' || options.videoCodec === 'hevc');
      if (wantHevc) {
        if (hasHevcNvenc) {
          command.videoCodec('hevc_nvenc');
          command.outputOptions(['-preset', 'p4', '-cq', String(options.crf !== undefined ? options.crf : 26)]);
        } else {
          command.videoCodec('libx265');
          command.outputOptions(['-preset', 'veryfast', '-threads', '0', '-crf', String(options.crf !== undefined ? options.crf : 26)]);
        }
      } else {
        if (hasNvenc) {
          command.videoCodec('h264_nvenc');
          command.outputOptions(['-preset', 'p4', '-cq', String(options.crf !== undefined ? options.crf : 23)]);
        } else {
          command.videoCodec('libx264');
          command.outputOptions(['-preset', 'veryfast', '-threads', '0', '-crf', String(options.crf !== undefined ? options.crf : 23)]);
        }
      }

      command.audioCodec('aac');
      command.audioBitrate(options.audioBitrate || '192k');
      command.outputOptions([
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      ]);
      if (options.videoBitrate) {
        command.outputOptions(['-b:v', options.videoBitrate]);
      }
      break;
    }

    case 'mkv': {
      const wantHevc = (options.videoCodec === 'libx265' || options.videoCodec === 'hevc');
      if (wantHevc) {
        if (hasHevcNvenc) {
          command.videoCodec('hevc_nvenc');
          command.outputOptions(['-preset', 'p4', '-cq', String(options.crf !== undefined ? options.crf : 24)]);
        } else {
          command.videoCodec('libx265');
          command.outputOptions(['-preset', 'veryfast', '-threads', '0', '-crf', String(options.crf !== undefined ? options.crf : 24)]);
        }
      } else {
        if (hasNvenc) {
          command.videoCodec('h264_nvenc');
          command.outputOptions(['-preset', 'p4', '-cq', String(options.crf !== undefined ? options.crf : 21)]);
        } else {
          command.videoCodec('libx264');
          command.outputOptions(['-preset', 'veryfast', '-threads', '0', '-crf', String(options.crf !== undefined ? options.crf : 21)]);
        }
      }

      command.audioCodec(options.audioCodec || 'aac');
      command.audioBitrate(options.audioBitrate || '192k');
      const hasSpecificAudio = (options.audioTrackIndex !== undefined && options.audioTrackIndex !== null && options.audioTrackIndex !== '' && options.audioTrackIndex !== 'all');
      if (!hasSpecificAudio) {
        command.outputOptions([
          '-map', '0',
          '-c:s', 'copy'
        ]);
      }
      break;
    }

    case 'webm': {
      command.videoCodec('libvpx-vp9');
      command.audioCodec('libopus');
      const crf = options.crf !== undefined ? options.crf : 30;
      const opts = [
        '-deadline', 'good',
        '-cpu-used', '2',
        '-row-mt', '1',
        '-threads', '0',
        '-crf', String(crf)
      ];
      if (options.videoBitrate) {
        opts.push('-b:v', options.videoBitrate);
      } else {
        opts.push('-b:v', '0');
      }
      command.outputOptions(opts);
      break;
    }

    case 'avi': {
      const vCodec = options.videoCodec === 'mpeg4' ? 'mpeg4' : 'libxvid';
      command.videoCodec(vCodec);
      command.audioCodec('libmp3lame');
      const bitrate = options.videoBitrate || '2500k';
      command.outputOptions([
        '-vtag', 'XVID',
        '-b:v', bitrate
      ]);
      break;
    }

    case 'mov': {
      if (options.videoCodec === 'prores' || options.videoCodec === 'prores_ks') {
        command.videoCodec('prores_ks');
        command.audioCodec('pcm_s16le');
        command.outputOptions([
          '-profile:v', '3',
          '-vendor', 'apl0'
        ]);
      } else {
        if (hasNvenc) {
          command.videoCodec('h264_nvenc');
          command.outputOptions(['-preset', 'p4', '-cq', String(options.crf !== undefined ? options.crf : 23)]);
        } else {
          command.videoCodec('libx264');
          command.outputOptions(['-preset', 'veryfast', '-threads', '0', '-crf', String(options.crf !== undefined ? options.crf : 23)]);
        }
        command.audioCodec('aac');
        command.audioBitrate(options.audioBitrate || '192k');
      }
      break;
    }

    default:
      break;
  }

  // 4. تطبيق اختيار مسار الصوت المحدد بدقة (-map 0:v:0 -map 0:a:INDEX)
  if (options.audioTrackIndex !== undefined && options.audioTrackIndex !== null && options.audioTrackIndex !== '' && options.audioTrackIndex !== 'all') {
    const aIdx = parseInt(options.audioTrackIndex, 10);
    if (!isNaN(aIdx) && aIdx >= 0) {
      if (isAudioOnly) {
        command.outputOptions(['-map', `0:a:${aIdx}`]);
      } else {
        command.outputOptions(['-map', '0:v:0', '-map', `0:a:${aIdx}`]);
      }
    }
  }

  // 5. تطبيق خيار حفظ الترجمة المنفصلة (Soft Subtitle عبر -c:s copy أو -c:s mov_text أو -c:s srt)
  const isSoftSub = options.subtitleMode === 'soft' || (options.edits && options.edits.subtitleMode === 'soft');
  const subPath = options.subtitlePath || options.subPath || options.subtitle || (options.edits && (options.edits.subtitlePath || options.edits.subPath || options.edits.subtitle));

  if (isSoftSub && (fmt === 'mkv' || fmt === 'mp4' || fmt === 'mov')) {
    if (subPath && typeof subPath === 'string' && fs.existsSync(subPath)) {
      // ملف ترجمة خارجي: تطبيق وسائط الخريطة مع مطابقة المدخل الثاني 1:0
      const hasVideoFilter = Boolean(
        options.crop ||
        (options.aspectRatio && options.aspectRatio !== 'source' && options.aspectRatio !== 'original') ||
        options.customWidth ||
        (options.playbackSpeed && options.playbackSpeed !== 1)
      );

      if (fmt === 'mkv') {
        const outOpts = ['-map', '0:v:0', '-map', '0:a:0?', '-map', '1:0'];
        if (!hasVideoFilter) {
          outOpts.push('-c:v', 'copy', '-c:a', 'copy');
        }
        outOpts.push('-c:s', 'srt');
        command.outputOptions(outOpts);
      } else if (fmt === 'mp4' || fmt === 'mov') {
        const outOpts = ['-map', '0:v:0', '-map', '0:a:0?', '-map', '1:0'];
        if (!hasVideoFilter) {
          outOpts.push('-c:v', 'copy', '-c:a', 'copy');
        }
        outOpts.push('-c:s', 'mov_text');
        command.outputOptions(outOpts);
      }
    } else if (options.subtitleTrackIndex !== undefined && options.subtitleTrackIndex !== null && options.subtitleTrackIndex !== 'none') {
      const sIdx = parseInt(options.subtitleTrackIndex, 10);
      if (!isNaN(sIdx) && sIdx >= 0) {
        command.outputOptions(['-map', `0:s:${sIdx}?`]);
        if (fmt === 'mkv') {
          command.outputOptions(['-c:s', 'copy']);
        } else if (fmt === 'mp4' || fmt === 'mov') {
          command.outputOptions(['-c:s', 'mov_text']);
        }
      }
    }
  }

  return fmt;
}

/**
 * تحويل ملف فيديو أو صوت مع دعم النقل المباشر والتسريع العتادي
 */
async function convertMedia({ taskId, inputPath, outputPath, targetFormat, options = {}, onProgress = null }) {
  // فحص واستخراج البيانات الفنية للمصدر
  const meta = await probeMedia(inputPath);

  // الكشف عن كارت الشاشة العتادي
  const gpuSupport = await detectGpuSupport();

  // فحص إمكانية النقل المباشر الفوري (Ultra-Fast Stream Copy)
  const hasCustomAspect = Boolean(options.aspectRatio && options.aspectRatio !== 'source' && options.aspectRatio !== 'original');
  const isSameAsSource = !hasCustomAspect && (
    options.presetId === 'video-source' ||
    options.resolution === 'source' ||
    options.resolution === 'original' ||
    !options.resolution
  );

  const canStreamCopy = isSameAsSource && isStreamCopyPossible(meta, targetFormat, options);
  if (canStreamCopy) {
    options.isStreamCopy = true;
  }

  // التأكد من وجود مجلد الإخراج
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let lastProgressEmit = 0;
    let isCancelled = false;

    const command = ffmpeg(inputPath);
    activeTasks.set(taskId, { command, outputPath });

    // استيراد ملف الترجمة الخارجي كمدخل منفصل إذا تم اختيار وضع Soft Subtitle
    const subPath = options.subtitlePath || options.subPath || options.subtitle || (options.edits && (options.edits.subtitlePath || options.edits.subPath || options.edits.subtitle));
    const isSoftSub = options.subtitleMode === 'soft' || (options.edits && options.edits.subtitleMode === 'soft');
    if (subPath && typeof subPath === 'string' && fs.existsSync(subPath) && isSoftSub) {
      command.input(subPath);
    }

    let totalDuration = meta.duration || 0;

    // تطبيق المرشحات فقط في حال لم يكن وضع النسخ المباشر مفعلاً
    if (!options.isStreamCopy) {
      const editsToApply = {
        ...(options.edits || {}),
        crop: options.crop || (options.edits && options.edits.crop),
        trim: options.trim || (options.edits && options.edits.trim),
        startSec: options.startSec !== undefined ? options.startSec : (options.edits && options.edits.startSec),
        endSec: options.endSec !== undefined ? options.endSec : (options.edits && options.edits.endSec),
        loudnorm: options.loudnorm !== undefined ? options.loudnorm : (options.edits && options.edits.loudnorm),
        playbackSpeed: options.playbackSpeed !== undefined ? options.playbackSpeed : (options.edits && (options.edits.playbackSpeed || options.edits.speed)),
        audioTrackIndex: options.audioTrackIndex !== undefined ? options.audioTrackIndex : (options.edits && options.edits.audioTrackIndex),
        subtitle: subPath,
        subtitlePath: subPath,
        subPath: subPath,
        subtitleTrackIndex: options.subtitleTrackIndex !== undefined ? options.subtitleTrackIndex : (options.edits && options.edits.subtitleTrackIndex),
        subtitleMode: options.subtitleMode !== undefined ? options.subtitleMode : (options.edits && options.edits.subtitleMode),
        burnSubtitles: options.burnSubtitles !== undefined ? options.burnSubtitles : (options.edits && options.edits.burnSubtitles),
        subtitleFontSize: options.subtitleFontSize !== undefined ? options.subtitleFontSize : (options.edits && options.edits.subtitleFontSize),
        subtitlePosition: options.subtitlePosition !== undefined ? options.subtitlePosition : (options.edits && options.edits.subtitlePosition)
      };
      const { effectiveDuration } = applyEditingPipeline(command, editsToApply, { ...meta, inputPath });
      if (effectiveDuration > 0) totalDuration = effectiveDuration;
    }

    // تطبيق معايير وخيارات الإخراج
    configureFfmpegOptions(command, targetFormat, options, gpuSupport);

    command.output(outputPath);

    // تسجيل بدء العملية وتتبع الـ PID لضمان السيطرة الكاملة على العمليات المنبثقة
    command.on('start', (commandLine) => {
      const tr = activeTasks.get(taskId);
      if (tr && command.ffmpegProc) {
        tr.pid = command.ffmpegProc.pid;
        tr.proc = command.ffmpegProc;
      }
    });

    // متابعة التقدم
    command.on('progress', (progress) => {
      if (isCancelled) return;

      const now = Date.now();
      if (now - lastProgressEmit < 450) return;
      lastProgressEmit = now;

      const currentSeconds = timemarkToSeconds(progress.timemark);
      let percent = 0;

      if (totalDuration > 0) {
        percent = Math.min(100.0, Math.max(0.0, (currentSeconds / totalDuration) * 100.0));
      } else if (progress.percent && isFinite(progress.percent)) {
        percent = Math.min(100.0, Math.max(0.0, progress.percent));
      }

      const elapsedSeconds = (now - startTime) / 1000;
      const remainingSeconds = (elapsedSeconds * (100.0 - percent)) / Math.max(percent, 0.001);

      let speed = options.isStreamCopy ? 'Stream Copy (Direct)' : '1.0x';
      if (progress.currentFps) {
        speed = `${progress.currentFps} fps`;
      } else if (elapsedSeconds > 0 && currentSeconds > 0) {
        speed = `${(currentSeconds / elapsedSeconds).toFixed(1)}x`;
      }

      if (typeof onProgress === 'function') {
        onProgress({
          taskId,
          percent: Math.round(percent * 10) / 10,
          speed,
          eta: formatEta(remainingSeconds),
          timemark: progress.timemark || '00:00:00'
        });
      }
    });

    command.on('error', (err) => {
      activeTasks.delete(taskId);
      try {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } catch (cleanupErr) {}

      if (isCancelled || (err && err.message && err.message.includes('SIGKILL'))) {
        const cancelErr = new Error('تم إلغاء عملية التحويل بواسطة المستخدم');
        cancelErr.isCancelled = true;
        return reject(cancelErr);
      }

      reject(new Error(`FFmpeg فشل: ${err ? err.message : 'خطأ غير معروف'}`));
    });

    command.on('end', () => {
      activeTasks.delete(taskId);
      const conversionTimeMs = Date.now() - startTime;

      let finalSize = 0;
      try {
        if (fs.existsSync(outputPath)) {
          finalSize = fs.statSync(outputPath).size;
        }
      } catch (e) {
        finalSize = 0;
      }

      if (typeof onProgress === 'function') {
        onProgress({
          taskId,
          percent: 100.0,
          speed: options.isStreamCopy ? 'Ultra-Fast Copy' : '1.0x',
          eta: '00:00',
          timemark: formatEta(totalDuration)
        });
      }

      resolve({
        taskId,
        outputPath,
        finalSize,
        duration: totalDuration,
        conversionTimeMs,
        isStreamCopy: options.isStreamCopy || false
      });
    });

    const taskRecord = activeTasks.get(taskId);
    if (taskRecord) {
      taskRecord.cancel = () => {
        isCancelled = true;
        try {
          command.kill('SIGKILL');
        } catch (e) {}
      };
    }

    command.run();
  });
}

/**
 * ضغط الفيديو الذكي بحجم مستهدف محسوب رياضياً (Smart Video Compressor)
 * Total_Bitrate = (targetSizeMB * 8192) / duration
 * Video_Bitrate = Math.max(Total_Bitrate - 128, 150)
 */
async function compressVideoTask({ taskId, inputPath, outputPath, targetSizeMB, options = {}, onProgress = null }) {
  const meta = await probeMedia(inputPath);
  const gpuSupport = await detectGpuSupport();

  const duration = (meta && meta.duration > 0) ? meta.duration : 60;
  const targetMB = Number(targetSizeMB) || 25;

  // تطبيق المعادلة الرياضية لمعدل البت الكلي والفيديو
  const totalBitrate = Math.round((targetMB * 8192) / duration);
  const videoBitrate = Math.round(Math.max(totalBitrate - 128, 150));
  const maxRate = Math.round(videoBitrate * 1.3);
  const bufSize = Math.round(videoBitrate * 2);

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let lastProgressEmit = 0;
    let isCancelled = false;

    const command = ffmpeg(inputPath);
    activeTasks.set(taskId, { command, outputPath });

    // اختيار الكوديك مع تفضيل تسريع كارت الشاشة h264_nvenc والعودة التلقائية لـ libx264
    const hasNvenc = Boolean(gpuSupport && gpuSupport.h264_nvenc);
    if (hasNvenc) {
      command.videoCodec('h264_nvenc');
      command.outputOptions([
        '-preset', 'p4',
        '-b:v', `${videoBitrate}k`,
        '-maxrate', `${maxRate}k`,
        '-bufsize', `${bufSize}k`
      ]);
    } else {
      command.videoCodec('libx264');
      command.outputOptions([
        '-preset', 'veryfast',
        '-threads', '0',
        '-b:v', `${videoBitrate}k`,
        '-maxrate', `${maxRate}k`,
        '-bufsize', `${bufSize}k`
      ]);
    }

    // ترميز الصوت المتوازن
    command.audioCodec('aac');
    command.audioBitrate('128k');

    // تصحيح الأبعاد الزوجية وتهيئة البث السريع
    command.outputOptions([
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart'
    ]);
    command.videoFilters(['scale=trunc(iw/2)*2:trunc(ih/2)*2']);

    command.output(outputPath);

    command.on('start', () => {
      const tr = activeTasks.get(taskId);
      if (tr && command.ffmpegProc) {
        tr.pid = command.ffmpegProc.pid;
        tr.proc = command.ffmpegProc;
      }
    });

    command.on('progress', (progress) => {
      if (isCancelled) return;
      const now = Date.now();
      if (now - lastProgressEmit < 450) return;
      lastProgressEmit = now;

      const currentSeconds = timemarkToSeconds(progress.timemark);
      let percent = 0;
      if (duration > 0) {
        percent = Math.min(100.0, Math.max(0.0, (currentSeconds / duration) * 100.0));
      } else if (progress.percent && isFinite(progress.percent)) {
        percent = Math.min(100.0, Math.max(0.0, progress.percent));
      }

      const elapsedSeconds = (now - startTime) / 1000;
      const remainingSeconds = (elapsedSeconds * (100.0 - percent)) / Math.max(percent, 0.001);

      let speed = '1.0x';
      if (progress.currentFps) {
        speed = `${progress.currentFps} fps`;
      } else if (elapsedSeconds > 0 && currentSeconds > 0) {
        speed = `${(currentSeconds / elapsedSeconds).toFixed(1)}x`;
      }

      if (typeof onProgress === 'function') {
        onProgress({
          taskId,
          percent: Math.round(percent * 10) / 10,
          speed,
          eta: formatEta(remainingSeconds),
          timemark: progress.timemark || '00:00:00'
        });
      }
    });

    command.on('error', (err) => {
      activeTasks.delete(taskId);
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {}

      if (isCancelled || (err && err.message && err.message.includes('SIGKILL'))) {
        const cancelErr = new Error('تم إلغاء عملية الضغط بواسطة المستخدم');
        cancelErr.isCancelled = true;
        return reject(cancelErr);
      }

      reject(new Error(`فشل ضغط الفيديو عبر FFmpeg: ${err ? err.message : 'خطأ غير معروف'}`));
    });

    command.on('end', () => {
      activeTasks.delete(taskId);
      const conversionTimeMs = Date.now() - startTime;
      let finalSize = 0;
      try {
        if (fs.existsSync(outputPath)) finalSize = fs.statSync(outputPath).size;
      } catch (e) {}

      if (typeof onProgress === 'function') {
        onProgress({ taskId, percent: 100.0, speed: '1.0x', eta: '00:00', timemark: formatEta(duration) });
      }

      resolve({
        taskId,
        outputPath,
        finalSize,
        duration,
        conversionTimeMs,
        isCompression: true,
        videoBitrate
      });
    });

    const taskRecord = activeTasks.get(taskId);
    if (taskRecord) {
      taskRecord.cancel = () => {
        isCancelled = true;
        try { command.kill('SIGKILL'); } catch (e) {}
      };
    }

    command.run();
  });
}

/**
 * إلغاء مهمة وسائط جارية وحذف الملف الناتج الجزئي
 */
function cancelMediaTask(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) return false;

  const targetPid = task.pid || (task.command && task.command.ffmpegProc ? task.command.ffmpegProc.pid : null);

  if (typeof task.cancel === 'function') {
    task.cancel();
  }

  // ضمان إرسال SIGKILL والقتل الجذري على ويندوز والأنظمة الأخرى لمنع العمليات الطفيلية
  if (targetPid) {
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(`taskkill /pid ${targetPid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(targetPid, 'SIGKILL');
      }
    } catch (e) {}
  }

  try {
    if (task.outputPath && fs.existsSync(task.outputPath)) {
      fs.unlinkSync(task.outputPath);
    }
  } catch (e) {}

  activeTasks.delete(taskId);
  return true;
}

/**
 * اقتطاع عينة سريعة فائقة السرعة مدتها 10 ثوانٍ من منتصف الفيديو عبر Fast Input Seeking
 * @param {Object} params
 * @param {string} params.inputPath - مسار ملف الفيديو المصدر
 * @param {string} params.targetFormat - الصيغة الهدف (mp4, mkv, webm...)
 * @param {Object} params.options - الخيارات المتقدمة المختارة
 * @returns {Promise<{success: boolean, samplePath: string, sampleDuration: number, startSec: number}>}
 */
async function renderSampleClip({ inputPath, targetFormat = 'mp4', options = {} }) {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`الملف المصدر غير موجود: ${inputPath}`);
    }

    const meta = await probeMedia(inputPath);
    const totalDur = meta.duration || 30;
    // اقتطاع 10 ثوانٍ من منتصف مدة الفيديو
    const midPoint = Math.max(0, Math.floor(totalDur / 2) - 5);
    const sampleDuration = Math.min(10, Math.max(1, totalDur - midPoint));

    const outExt = (targetFormat || 'mp4').toLowerCase().replace(/^\./, '');
    const os = require('os');
    const tmpName = `sample_preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${outExt}`;
    const sampleOutputPath = path.join(os.tmpdir(), tmpName);

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // فحص ما إذا كانت هناك ترجمة مدمجة أو خارجية ونمط المعالجة
      const subPath = options.subtitlePath || options.subPath || options.subtitle || (options.edits && (options.edits.subtitlePath || options.edits.subPath || options.edits.subtitle));
      const hasExtSub = Boolean(subPath && typeof subPath === 'string' && fs.existsSync(subPath));
      const hasEmbeddedSub = (options.subtitleTrackIndex !== undefined && options.subtitleTrackIndex !== null && options.subtitleTrackIndex !== 'none');
      const hasAnySub = hasExtSub || hasEmbeddedSub;

      command.input(inputPath);

      // في العينة: نحرق الترجمة دائماً داخل الصورة (Burn-in) لكي تظهر فوراً للمستخدم، وتفادي أخطاء نسخ التيارات
      // ولا نستخدم أبداً -map 1 أو -c:s copy في ملف العينة
      if (hasAnySub) {
        command.outputOptions([
          '-ss', String(midPoint),
          '-t', String(sampleDuration),
          '-preset', 'ultrafast'
        ]);
        command.videoCodec('libx264');
      } else {
        // ميزة القفز المسبق فائق السرعة قبل ملف الإدخال (Fast Input Seeking) في حالة عدم وجود ترجمة
        command.inputOptions(['-ss', String(midPoint)]);
        command.outputOptions([
          '-t', String(sampleDuration),
          '-preset', 'ultrafast'
        ]);
      }

      // تطبيق الفلاتر والخيارات (crop, loudnorm, subtitles, playbackSpeed)
      const editsToApply = {
        ...(options.edits || {}),
        crop: options.crop || (options.edits && options.edits.crop),
        loudnorm: options.loudnorm !== undefined ? options.loudnorm : (options.edits && options.edits.loudnorm),
        playbackSpeed: options.playbackSpeed !== undefined ? options.playbackSpeed : (options.edits && (options.edits.playbackSpeed || options.edits.speed)),
        subtitle: hasExtSub ? subPath : null,
        subtitlePath: hasExtSub ? subPath : null,
        subPath: hasExtSub ? subPath : null,
        subtitleTrackIndex: hasEmbeddedSub ? options.subtitleTrackIndex : null,
        subtitleMode: hasAnySub ? 'burn' : 'none',
        burnSubtitles: hasAnySub,
        subtitleFontSize: options.subtitleFontSize || (options.edits && options.edits.subtitleFontSize),
        subtitlePosition: options.subtitlePosition || (options.edits && options.edits.subtitlePosition)
      };

      applyEditingPipeline(command, editsToApply, { ...meta, inputPath, duration: sampleDuration });
      configureFfmpegOptions(command, outExt, {
        ...options,
        subtitlePath: null,
        subPath: null,
        subtitle: null,
        subtitleTrackIndex: null,
        subtitleMode: hasAnySub ? 'burn' : 'none',
        burnSubtitles: hasAnySub,
        isStreamCopy: false
      }, null);

      command.output(sampleOutputPath);

      command.on('end', () => {
        resolve({
          success: true,
          samplePath: sampleOutputPath,
          sampleDuration,
          startSec: midPoint
        });
      });

      command.on('error', (err) => {
        try {
          if (fs.existsSync(sampleOutputPath)) fs.unlinkSync(sampleOutputPath);
        } catch (e) {}
        reject(new Error(`فشل توليد العينة السريعة: ${err ? err.message : 'خطأ غير معروف'}`));
      });

      command.run();
    });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  probeMedia,
  convertMedia,
  compressVideoTask,
  cancelMediaTask,
  renderSampleClip,
  getSafeBinaryPath,
  resolveBinaryPath,
  sanitizeSubtitlePath,
  applyEditingPipeline,
  configureFfmpegOptions,
  detectGpuSupport,
  isStreamCopyPossible,
  getAspectRatioDimensions,
  activeTasks,
  getActiveTask: (taskId) => activeTasks.get(taskId)
};
