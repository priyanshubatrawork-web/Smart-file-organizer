importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

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

self.onmessage = async (e) => {
    const { type } = e.data;

    if (type === 'PROCESS_FILES') {
        const { files } = e.data;
        let processedData = {
            categories: {},
            duplicates: [],
            totalFiles: 0,
            totalSize: 0
        };

        const seenFiles = new Map();
        let flatFiles = [];

        self.postMessage({ type: 'PROGRESS', status: "Extracting zip files (if any)...", progress: 10 });

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.toLowerCase().endsWith('.zip')) {
                try {
                    const zip = await JSZip.loadAsync(file);
                    const zipEntries = Object.values(zip.files);
                    
                    for (let j = 0; j < zipEntries.length; j++) {
                        const zipEntry = zipEntries[j];
                        if (!zipEntry.dir) {
                            const fileName = zipEntry.name.split('/').pop();
                            if (fileName.startsWith('.') || zipEntry.name.includes('__MACOSX')) continue;
                            
                            const blob = await zipEntry.async('blob');
                            const extFile = new File([blob], fileName, { 
                                type: blob.type,
                                lastModified: zipEntry.date.getTime() 
                            });
                            flatFiles.push(extFile);
                        }
                    }
                } catch (err) {
                    console.error("Worker unzipping error", err);
                    flatFiles.push(file);
                }
            } else {
                flatFiles.push(file);
            }
            
            const progress = 10 + Math.round(((i + 1) / files.length) * 40);
            self.postMessage({ type: 'PROGRESS', status: "Extracting zip files (if any)...", progress });
        }

        self.postMessage({ type: 'PROGRESS', status: "Categorizing and finding duplicates...", progress: 50 });

        const totalToProcess = flatFiles.length;
        for (let i = 0; i < totalToProcess; i++) {
            const file = flatFiles[i];
            if (file.name.startsWith('.')) continue;

            processedData.totalSize += file.size;
            processedData.totalFiles++;

            const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
            
            if (seenFiles.has(fileKey)) {
                processedData.duplicates.push(file);
            } else {
                seenFiles.set(fileKey, true);
                const ext = file.name.split('.').pop().toLowerCase();
                let matchedCategory = DEFAULT_CATEGORY.name;

                for (const [catName, catData] of Object.entries(CATEGORY_MAP)) {
                    if (catData.exts.includes(ext)) {
                        matchedCategory = catName;
                        break;
                    }
                }

                if (!processedData.categories[matchedCategory]) {
                    processedData.categories[matchedCategory] = [];
                }
                processedData.categories[matchedCategory].push(file);
            }

            if (i % 50 === 0) {
                const progress = 50 + Math.round(((i + 1) / totalToProcess) * 50);
                self.postMessage({ type: 'PROGRESS', status: "Categorizing and finding duplicates...", progress });
            }
        }

        self.postMessage({ type: 'PROGRESS', status: "Finishing up...", progress: 100 });
        self.postMessage({ type: 'DONE', processedData });
    } 
    else if (type === 'GENERATE_ZIP') {
        const { processedData } = e.data;
        try {
            const zip = new JSZip();

            // Add categorized files
            for (const [catName, files] of Object.entries(processedData.categories)) {
                const folder = zip.folder(catName);
                files.forEach(file => {
                    // Wrap in a new Blob to guarantee JSZip recognizes it in the worker context
                    // and doesn't accidentally coerce the cross-thread File object to a string!
                    folder.file(file.name, new Blob([file]));
                });
            }

            // Add duplicates
            if (processedData.duplicates.length > 0) {
                const dupFolder = zip.folder('Duplicates');
                processedData.duplicates.forEach((file, index) => {
                    const parts = file.name.split('.');
                    const ext = parts.pop();
                    const name = parts.join('.');
                    const newName = `${name}_copy_${index + 1}.${ext}`;
                    dupFolder.file(newName, new Blob([file]));
                });
            }

            const blob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            }, (metadata) => {
                if (metadata.percent) {
                    self.postMessage({ type: 'ZIP_PROGRESS', percent: metadata.percent });
                }
            });

            self.postMessage({ type: 'ZIP_DONE', blob });
        } catch (error) {
            self.postMessage({ type: 'ZIP_ERROR', error: error.message });
        }
    }
};
