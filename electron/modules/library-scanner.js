
const { app } = require('electron');
const { Worker } = require('worker_threads');
const path = require('path');
const log = require('electron-log');

let worker;

async function scanMusicLibrary() {
  return new Promise((resolve, reject) => {
    
    if (worker) {
        log.warn('[Scanner] Сканирование уже запущено.');
        return reject(new Error('Сканирование уже запущено.'));
    }

    worker = new Worker(path.join(__dirname, 'scanner-worker.js'));
    const musicDir = app.getPath('music');
    const allTracks = [];

    worker.on('message', (message) => {
      switch (message.type) {
        case 'status':
          log.info(`[Scanner Worker] ${message.data}`);
          break;
        case 'progress':
          allTracks.push(...message.data);
          break;
        case 'error':
          log.warn(`[Scanner Worker] ${message.data}`);
          break;
        case 'done':
          log.info(`[Scanner] Сканирование завершено. Найдено ${allTracks.length} треков.`);
          resolve(allTracks);
          worker.terminate();
          worker = null;
          break;
      }
    });

    worker.on('error', (error) => {
      log.error('[Scanner] Ошибка воркера:', error);
      reject(error);
      worker = null;
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        log.error(`[Scanner] Воркер остановлен с кодом выхода ${code}`);
        reject(new Error(`Воркер остановлен с кодом выхода ${code}`));
      }
      worker = null;
    });

    worker.postMessage({ type: 'start-scan', musicDir });
  });
}

module.exports = { scanMusicLibrary };