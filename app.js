// --- Configuration ---
const CATEGORY_MAP = {
    'Images': {
        exts: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'heic', 'bmp', 'ico'],
        color: 'var(--cat-images)',
        icon: 'image'
    },
    'PDFs': {
        exts: ['pdf'],
        color: 'var(--cat-docs)',
        icon: 'file-text'
    },
    'Documents': {
        exts: ['doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'pages', 'numbers', 'key'],
        color: 'var(--cat-docs)',
        icon: 'file-type-2'
    },
    'Videos': {
        exts: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'],
        color: 'var(--cat-videos)',
        icon: 'video'
    },
    'Audio': {
        exts: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
        color: 'var(--cat-audio)',
        icon: 'music'
    },
    'Archives': {
        exts: ['zip', 'rar', '7z', 'tar', 'gz', 'dmg', 'iso'],
        color: 'var(--cat-archives)',
        icon: 'archive'
    },
    'Code': {
        exts: ['js', 'html', 'css', 'ts', 'py', 'java', 'cpp', 'h', 'json', 'xml', 'md', 'jsx', 'tsx', 'php', 'rb'],
        color: 'var(--cat-others)',
        icon: 'code'
    }
};

const DEFAULT_CATEGORY = {
    name: 'Others',
    color: 'var(--cat-others)',
    icon: 'file'
};

// --- State ---
let processedData = {
    categories: {},
    duplicates: [],
    totalFiles: 0,
    totalSize: 0
};
let appWorker = null;
let originalDownloadBtnHTML = '';

// --- DOM Elements ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadView = document.getElementById('uploadView');
const processingView = document.getElementById('processingView');
const dashboardView = document.getElementById('dashboardView');
const categoriesGrid = document.getElementById('categoriesGrid');
const summaryText = document.getElementById('summaryText');
const duplicatesCard = document.getElementById('duplicatesCard');
const duplicatesText = document.getElementById('duplicatesText');
const downloadBtn = document.getElementById('downloadBtn');
const startOverBtn = document.getElementById('startOverBtn');
const processingStatus = document.getElementById('processingStatus');
const processingProgressBar = document.getElementById('processingProgressBar');

// --- Initialization ---
function init() {
    setupTheme();
    setupEventListeners();
    initWorker();
}

function initWorker() {
    if (!appWorker) {
        appWorker = new Worker('worker.js');
        appWorker.onmessage = (e) => {
            const { type } = e.data;
            
            if (type === 'PROGRESS') {
                const { status, progress } = e.data;
                processingStatus.textContent = status;
                processingProgressBar.style.width = `${progress}%`;
            } else if (type === 'DONE') {
                processedData = e.data.processedData;
                renderDashboard();
                switchView(dashboardView);
            } else if (type === 'ZIP_PROGRESS') {
                downloadBtn.innerHTML = `<i data-lucide="loader"></i> ${Math.round(e.data.percent)}%`;
                lucide.createIcons();
            } else if (type === 'ZIP_DONE') {
                saveAs(e.data.blob, "Organized_Files.zip");
                downloadBtn.innerHTML = originalDownloadBtnHTML || '<i data-lucide="download"></i> Download Organized ZIP';
                downloadBtn.disabled = false;
                lucide.createIcons();
            } else if (type === 'ZIP_ERROR') {
                console.error("Error generating zip:", e.data.error);
                alert("There was an error creating the ZIP file. Please try again.");
                downloadBtn.innerHTML = originalDownloadBtnHTML || '<i data-lucide="download"></i> Download Organized ZIP';
                downloadBtn.disabled = false;
                lucide.createIcons();
            }
        };
    }
}

function setupTheme() {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
        themeIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
}

// --- Event Listeners ---
function setupEventListeners() {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            themeIcon.setAttribute('data-lucide', 'moon');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeIcon.setAttribute('data-lucide', 'sun');
        }
        lucide.createIcons();
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'), false);
    });

    uploadZone.addEventListener('drop', handleDrop, false);
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    });

    startOverBtn.addEventListener('click', resetApp);
    downloadBtn.addEventListener('click', generateAndDownloadZip);
}

// --- File Handling ---
function handleDrop(e) {
    const dt = e.dataTransfer;
    let files = Array.from(dt.files);
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    switchView(processingView);
    
    // Give UI a moment to transition, then start worker
    setTimeout(() => {
        appWorker.postMessage({ type: 'PROCESS_FILES', files });
    }, 400);
}

// --- UI Rendering ---
function switchView(viewElement) {
    document.querySelectorAll('.view').forEach(el => {
        if (el !== viewElement) {
            el.classList.remove('active');
            setTimeout(() => {
                // Ensure it wasn't made active again in the meantime
                if (!el.classList.contains('active')) {
                    el.classList.add('hidden');
                }
            }, 300); // Wait for fade out
        }
    });
    
    viewElement.classList.remove('hidden');
    void viewElement.offsetWidth;
    viewElement.classList.add('active');
}

function renderDashboard() {
    const sizeMB = (processedData.totalSize / (1024 * 1024)).toFixed(2);
    summaryText.textContent = `Organized ${processedData.totalFiles} files (${sizeMB} MB)`;

    if (processedData.duplicates.length > 0) {
        duplicatesCard.classList.remove('hidden');
        duplicatesText.textContent = `We found ${processedData.duplicates.length} duplicate files. They will be placed in a separate "Duplicates" folder.`;
    } else {
        duplicatesCard.classList.add('hidden');
    }

    categoriesGrid.innerHTML = '';
    
    const sortedCategories = Object.entries(processedData.categories)
        .sort((a, b) => b[1].length - a[1].length);

    sortedCategories.forEach(([catName, files]) => {
        const catConfig = CATEGORY_MAP[catName] || DEFAULT_CATEGORY;
        const catSize = files.reduce((acc, f) => acc + f.size, 0);
        const catSizeMB = (catSize / (1024 * 1024)).toFixed(2);

        const card = document.createElement('div');
        card.className = 'card category-card';
        card.innerHTML = `
            <div class="category-icon-wrapper" style="background-color: ${catConfig.color}">
                <i data-lucide="${catConfig.icon}"></i>
            </div>
            <div class="cat-info">
                <div class="cat-name">${catName}</div>
                <div class="cat-stats">
                    <span>${files.length} files</span>
                    <span>${catSizeMB} MB</span>
                </div>
            </div>
        `;
        categoriesGrid.appendChild(card);
    });

    lucide.createIcons();
}

function resetApp() {
    fileInput.value = '';
    processedData = { categories: {}, duplicates: [], totalFiles: 0, totalSize: 0 };
    switchView(uploadView);
}

// --- ZIP Generation ---
function generateAndDownloadZip() {
    originalDownloadBtnHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0; border-width: 2px;"></div> Zipping...';
    downloadBtn.disabled = true;

    appWorker.postMessage({ type: 'GENERATE_ZIP', processedData });
}

// Run
init();
