const { ipcMain, app, BrowserWindow, nativeTheme } = require('electron');
const { scanMusicLibrary } = require('./library-scanner');

function initIpcHandlers() {
  ipcMain.handle('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
  
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.isMaximized() ? win.unmaximize() : win?.maximize();
  });
  
  ipcMain.handle('window:close', () => BrowserWindow.getFocusedWindow()?.close());
  
  ipcMain.handle('window:get-initial-state', (e) => ({
    isMaximized: BrowserWindow.fromWebContents(e.sender)?.isMaximized() || false
  }));

  ipcMain.handle('app:get-version', () => app.getVersion());

  ipcMain.on('quit-and-install', () => {
    require('electron-updater').autoUpdater.quitAndInstall();
  });

  ipcMain.handle('scan-music-library', async () => {
      const tracks = await scanMusicLibrary();
      return tracks;
  });
  
  ipcMain.handle('theme:get-native-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.on('karaoke:toggle', (event, shouldBeVisible) => {
  });

  ipcMain.on('karaoke:update-data', (event, data) => {
  });
  
  ipcMain.on('media:update-controls', (event, data) => {
  });
}

module.exports = { initIpcHandlers };