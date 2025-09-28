
const { parentPort } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');
const musicMetadata = require('music-metadata');

/**
 * Извлекает полные метаданные для одного аудиофайла.
 * @param {string} filePath - Абсолютный путь к файлу.
 * @param {number} mtime - Дата последнего изменения файла (в миллисекундах).
 * @returns {Promise<object|null>} Объект с данными трека или null в случае ошибки.
 */
async function getTrackMetadata(filePath, mtime) {
    try {
        const metadata = await musicMetadata.parseFile(filePath);
        const cover = musicMetadata.selectCover(metadata.common.picture);
        
        
        const safePath = filePath.replace(/\\/g, '/');
        
        
        const encodedPath = encodeURI(safePath);
        
        
        const fileUrl = `unisound-local://${encodedPath}`;

        return {
            uuid: `local-${Buffer.from(filePath).toString('hex')}`,
            filePath: fileUrl,
            originalPath: filePath, 
            title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
            artist: metadata.common.artist || 'Неизвестный исполнитель',
            album: metadata.common.album || 'Неизвестный альбом',
            duration: metadata.format.duration,
            artwork: cover ? `data:${cover.format};base64,${cover.data.toString('base64')}` : null,
            isLocal: 1, 
            lastModified: mtime, 
        };
    } catch (error) {
        console.warn(`[Scanner Worker] Не удалось обработать метаданные для файла "${filePath}": ${error.message}`);
        return null;
    }
}

/**
 * Рекурсивно находит все поддерживаемые аудиофайлы и их дату изменения.
 * @param {string} directory - Директория для сканирования.
 * @returns {Promise<Array<{path: string, mtime: number}>>} Массив объектов с путем и mtime.
 */
async function findMusicFiles(directory) {
    let musicFiles = [];
    const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];
    try {
        const items = await fs.readdir(directory, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(directory, item.name);
            if (item.isDirectory()) {
                
                if (!item.name.startsWith('.')) {
                    musicFiles = musicFiles.concat(await findMusicFiles(fullPath));
                }
            } else if (supportedExtensions.includes(path.extname(item.name).toLowerCase())) {
                try {
                    const stats = await fs.stat(fullPath);
                    
                    musicFiles.push({ path: fullPath, mtime: stats.mtimeMs });
                } catch (e) {
                    
                }
            }
        }
    } catch (error) {
        
    }
    return musicFiles;
}


parentPort.on('message', async (message) => {
    
    if (message.type === 'find-all-files') {
        const filesWithMtime = await findMusicFiles(message.musicDir);
        parentPort.postMessage({ type: 'all-files-found', data: filesWithMtime });
    }

    
    if (message.type === 'process-metadata') {
        const tracks = [];
        for (const file of message.filesToProcess) {
            
            const trackData = await getTrackMetadata(file.path, file.mtime);
            if (trackData) {
                tracks.push(trackData);
                
                if (tracks.length >= 20) {
                    parentPort.postMessage({ type: 'metadata-processed', data: [...tracks] });
                    tracks.length = 0; 
                }
            }
        }
        
        if (tracks.length > 0) {
            parentPort.postMessage({ type: 'metadata-processed', data: tracks });
        }
        
        parentPort.postMessage({ type: 'processing-done' });
    }
});