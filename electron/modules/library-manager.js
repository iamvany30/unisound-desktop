
const { app } = require('electron');
const path = require('path');
const { Worker } = require('worker_threads');
const log = require('electron-log');
const db = require('./database'); 

let isScanning = false;

function startSmartScan(mainWindow) {
    if (isScanning) {
        log.warn('[LibraryManager] Сканирование уже запущено.');
        return;
    }
    isScanning = true;
    log.info('[LibraryManager] Запуск умного сканирования (SQLite)...');
    mainWindow.webContents.send('library-scan-status', 'searching');

    const existingTracksMap = db.getAllTrackPathsAndMtimes();
    const musicDir = app.getPath('music');

    const worker = new Worker(path.join(__dirname, 'scanner-worker.js'));

    worker.on('message', async (message) => {
        if (message.type === 'all-files-found') {
            const filesOnDisk = message.data; 
            log.info(`[LibraryManager] На диске найдено ${filesOnDisk.length} файлов.`);

            const diskFilesMap = new Map(filesOnDisk.map(f => [f.path, f.mtime]));
            const dbFilesSet = new Set(existingTracksMap.keys());
            
            
            const filesToProcess = filesOnDisk.filter(file => {
                const dbMtime = existingTracksMap.get(file.path);
                return !dbMtime || dbMtime < file.mtime; 
            });
            log.info(`[LibraryManager] Найдено ${filesToProcess.length} новых/измененных файлов для обработки.`);
            
            
            const deletedFilePaths = [...dbFilesSet].filter(p => !diskFilesMap.has(p));
            log.info(`[LibraryManager] Найдено ${deletedFilePaths.length} удаленных файлов.`);

            if (deletedFilePaths.length > 0) {
                db.removeTracks(deletedFilePaths);
                mainWindow.webContents.send('library-tracks-removed', deletedFilePaths);
            }

            if (filesToProcess.length > 0) {
                mainWindow.webContents.send('library-scan-status', 'processing');
                
                worker.postMessage({ type: 'process-metadata', filesToProcess: filesToProcess });
            } else {
                isScanning = false;
                worker.terminate();
                mainWindow.webContents.send('library-scan-status', 'done');
                log.info('[LibraryManager] Умное сканирование завершено. Изменений не найдено.');
            }
        }

        if (message.type === 'metadata-processed') {
            const newTracks = message.data;
            db.addTracks(newTracks); 
            mainWindow.webContents.send('library-tracks-added', newTracks);
        }

        if (message.type === 'processing-done') {
            isScanning = false;
            worker.terminate();
            mainWindow.webContents.send('library-scan-status', 'done');
            log.info('[LibraryManager] Умное сканирование полностью завершено.');
        }
    });
     worker.on('error', (err) => { log.error('[LibraryManager] Ошибка воркера:', err); isScanning = false; });
     worker.postMessage({ type: 'find-all-files', musicDir });
}

async function getInitialLibrary() {
    return db.getAllTracks();
}

function forceRescan(mainWindow) {
    log.info("[LibraryManager] Запрошено принудительное полное пересканирование.");
    
    
    
    startSmartScan(mainWindow);
}

module.exports = { getInitialLibrary, startSmartScan, forceRescan };