
const { ipcMain, app, BrowserWindow, nativeTheme } = require('electron');

const libraryManager = require('./library-manager');
const { startDownload, quitAndInstall } = require('./app-updater');

function initIpcHandlers(mainWindow) {

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:get-initial-state', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return {};
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      isFullscreen: mainWindow.isFullScreen(),
      bounds: mainWindow.getBounds(),
    };
  });
  
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('library:get-initial-tracks', async () => {
    return await libraryManager.getInitialLibrary();
  });

  ipcMain.on('library:start-smart-scan', () => {
    libraryManager.startSmartScan(mainWindow);
  });
    
  ipcMain.on('library:force-rescan', () => {
    libraryManager.forceRescan(mainWindow);
  });

  ipcMain.handle('updater:start-download', async () => {
    console.log('[IPC] Получен запрос на начало загрузки обновления...');
    return await startDownload();
  });
  
  ipcMain.on('quit-and-install', () => {
    console.log('[IPC] Получен запрос на перезапуск и установку...');
    quitAndInstall();
  });
  
  ipcMain.handle('theme:get-native-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  nativeTheme.on('updated', () => {
    if(mainWindow && !mainWindow.isDestroyed()) {
        const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        mainWindow.webContents.send('native-theme-changed', theme);
    }
  });

  ipcMain.handle('app:send-fake-update', (event, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-message', payload);
    }
  });
  ipcMain.on('karaoke:toggle', (event, shouldBeVisible) => {});
  ipcMain.on('karaoke:update-data', (event, data) => {});
  ipcMain.on('media:update-controls', (event, data) => {});
}

module.exports = { initIpcHandlers };