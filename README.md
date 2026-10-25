<div align="center">
  <img src="build/icon.png" width="120" height="120" alt="OmniConvert Logo" />
  <h1>OmniConvert</h1>
  <p><strong>Universal, High-Performance, Offline Media & Document Converter</strong></p>
  <p>Developed with passion by <strong>Sajed Tech</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0078D6.svg)](https://github.com/SajedTech/OmniConvert/releases)
  [![Node.js](https://img.shields.io/badge/Electron-29.4-47848F.svg)](https://electronjs.org)
</div>

---

## ⚡ Overview
**OmniConvert** is an offline-first desktop application designed for fast, private, and flexible file conversions across media and document formats without size limitations or internet dependency.

## 🛠️ Key Features
- **Instant Clipboard Paste (Ctrl+V):** Paste files directly from Windows Explorer or capture raw screenshots from your clipboard into the conversion queue.
- **Video Conversion:** MP4, MKV, WebM, AVI, MOV with CRF controls and NVENC hardware acceleration.
- **Audio Extraction:** High-bitrate multi-format conversion to MP3, WAV, FLAC, AAC, OGG.
- **Image Processing:** High-speed batch resizing and format conversion via Sharp.
- **Document Engine:** Safe Word (DOCX/DOC) to PDF generation without third-party dependencies.
- **Timeline & Player:** Built-in video preview with frame stepping and audio scrub.

## 📥 Installation
Download the latest pre-built Windows binaries from the [Releases Page](https://github.com/SajedTech/OmniConvert/releases/latest):
1. **Installer:** Run `OmniConvert Setup 1.0.0.exe` for automated installation.
2. **Portable:** Run `OmniConvert 1.0.0.exe` directly from any folder or USB drive.

## 💻 Tech Stack
- **Framework:** Electron.js (Isolated Preload Architecture)
- **Engines:** FFmpeg, FFprobe, Sharp (libvips), Mammoth
- **Database:** SQLite3 (`better-sqlite3` with WAL mode)

## 📜 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
