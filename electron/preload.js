const { contextBridge, ipcRenderer } = require('electron');
const validInvokeChannels = [
    'window:minimize',
    'window:maximize',
    'window:close',
    'window:get-initial-state',
    'app:get-version',
    'scan-music-library',
    'theme:get-native-theme',
];

const validSendChannels = [
  'quit-and-install',
  'karaoke:toggle',
  'karaoke:update-data',
  'media:update-controls'
];

const validReceiveChannels = [
  'update-message',
  'window-state-changed',
  'player-state-update',
  'karaoke-window-closed',
  'media-control-event',
  'native-theme-changed',
];

const createInvokeHandler = (channel) => {
    if (validInvokeChannels.includes(channel)) {
        return (...args) => ipcRenderer.invoke(channel, ...args);
    }
    return () => {
        console.warn(`[Preload] Попытка вызова незарегистрированного канала: ${channel}`);
        return Promise.resolve(null);
    };
};


const createEventHandler = (channel, callback) => {
  if (validReceiveChannels.includes(channel)) {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  }
  return () => {};
};

const createSendHandler = (channel) => {
    if (validSendChannels.includes(channel)) {
        return (...args) => ipcRenderer.send(channel, ...args);
    }
    return () => {
        console.warn(`[Preload] Попытка отправки в незарегистрированный канал: ${channel}`);
    };
};


contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: createInvokeHandler('window:minimize'),
  maximizeWindow: createInvokeHandler('window:maximize'),
  closeWindow: createInvokeHandler('window:close'),
  getWindowState: createInvokeHandler('window:get-initial-state'),
  getAppVersion: createInvokeHandler('app:get-version'),
  quitAndInstall: createSendHandler('quit-and-install'),
  onUpdateMessage: (callback) => createEventHandler('update-message', callback),
  toggleKaraokeWindow: createSendHandler('karaoke:toggle'),
  updateKaraokeData: createSendHandler('karaoke:update-data'),
  onKaraokeWindowClosed: (callback) => createEventHandler('karaoke-window-closed', callback),
  updateMediaControls: createSendHandler('media:update-controls'),
  onMediaControlEvent: (callback) => createEventHandler('media-control-event', callback),
  onPlayerStateUpdate: (callback) => createEventHandler('player-state-update', callback),
  scanMusicLibrary: createInvokeHandler('scan-music-library'),
  getNativeTheme: createInvokeHandler('theme:get-native-theme'),
  onThemeChanged: (callback) => createEventHandler('native-theme-changed', callback),
  onWindowStateChanged: (callback) => createEventHandler('window-state-changed', callback),
});