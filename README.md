# Smart File Organizer

A beautiful, modern, and lightning-fast web-based utility tool that automatically organizes messy files and folders. Designed with a premium startup-quality SaaS aesthetic, it does all the heavy lifting right in your browser.

## ✨ Features

- **100% Client-Side Processing**: No files are ever uploaded to a server. Everything happens securely and instantly in your browser.
- **Intelligent Categorization**: Automatically detects file extensions and groups them logically (Images, PDFs, Documents, Videos, Audio, Archives, Code, etc.).
- **Smart Duplicate Detection**: Identifies duplicate files (by comparing name, size, and modification date) and neatly isolates them to prevent clutter.
- **One-Click Download**: Generates a clean, categorized ZIP file ready for download.
- **Premium UI/UX**: Built with a calm, minimalist aesthetic featuring glassmorphism, soft gradients, smooth animations, and a responsive layout.
- **Dark & Light Mode**: Seamlessly toggle between beautifully crafted light and dark themes.

## 🛠️ Tech Stack

This project deliberately avoids heavy Node.js frameworks to remain lightweight and universally accessible.

- **Frontend**: Vanilla HTML5, CSS3 (with CSS Variables for theming), and ES6+ JavaScript.
- **Compression**: [JSZip](https://stuk.github.io/jszip/) for fast, local ZIP generation.
- **File Saving**: [FileSaver.js](https://github.com/eligrey/FileSaver.js) to handle the ZIP download securely.
- **Icons**: [Lucide Icons](https://lucide.dev/) for crisp, modern SVG iconography.
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts.

## 🚀 Getting Started

Since this is a client-side only application, getting it running is extremely simple:

### Option 1: Direct File Open (Easiest)
1. Download or clone this repository.
2. Double-click the `index.html` file to open it in any modern web browser (Chrome, Edge, Safari, Firefox).

### Option 2: Local Web Server (Recommended)
If you prefer running it on a local server (useful for certain browser security policies during drag-and-drop):
1. Open your terminal in the project directory.
2. Run a simple HTTP server. For example, if you have Python installed:
   ```bash
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000` in your web browser.

## 💡 How to Use

1. **Upload**: Drag and drop a messy folder or a selection of files directly into the dashed upload zone on the main screen, or click the zone to open your file browser.
2. **Review**: The system will instantly scan the files and display a dashboard summarizing the contents, categories, and any duplicates found.
3. **Download**: Click the "Download Organized ZIP" button to save your cleanly categorized files locally.

---

*Designed and built with an emphasis on automation, utility, and elegant product experiences.*
