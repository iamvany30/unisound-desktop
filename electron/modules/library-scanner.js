const fs = require('fs/promises');
const path = require('path');
const musicMetadata = require('music-metadata');
async function getTrackMetadata(filePath) {
    try {
        const metadata = await musicMetadata.parseFile(filePath);
        const cover = musicMetadata.selectCover(metadata.common.picture);
        
        return {
            uuid: `local-${Buffer.from(filePath).toString('hex')}`,
            filePath: filePath,
            title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
            artist: metadata.common.artist || 'Неизвестный исполнитель',
            album: metadata.common.album || 'Неизвестный альбом',
            year: metadata.common.year,
            duration: metadata.format.duration,
            artwork: cover ? `data:${cover.format};base64,${cover.data.toString('base64')}` : null,
            isLocal: true,
        };
    } catch (error) {
        console.warn(`Не удалось обработать файл "${filePath}":`, error.message);
        return null;
    }
}

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
                musicFiles.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`Ошибка при сканировании директории ${directory}:`, error.message);
    }
    return musicFiles;
}

async function scanMusicLibrary() {
    const { app } = require('electron');
    const musicDir = app.getPath('music');
    console.log(`[Offline Mode] Начинаем сканирование директории: ${musicDir}`);
    
    const filePaths = await findMusicFiles(musicDir);
    
    const tracksWithMetadata = await Promise.all(
        filePaths.map(filePath => getTrackMetadata(filePath))
    );
    
    const validTracks = tracksWithMetadata.filter(track => track !== null);
    console.log(`[Offline Mode] Сканирование завершено. Найдено ${validTracks.length} треков.`);
    return validTracks;
}

module.exports = { scanMusicLibrary };