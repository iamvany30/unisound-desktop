const { globalShortcut } = require('electron');

function registerShortcuts(mainWindow) {
  globalShortcut.register('MediaPlayPause', () => mainWindow?.webContents.send('media-control-event', 'play-pause'));
  globalShortcut.register('MediaNextTrack', () => mainWindow?.webContents.send('media-control-event', 'next'));
  globalShortcut.register('MediaPreviousTrack', () => mainWindow?.webContents.send('media-control-event', 'prev'));
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { registerShortcuts, unregisterShortcuts };