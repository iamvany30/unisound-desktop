const { contextBridge, ipcRenderer } = require('electron');

const validInvokeChannels = [
    'window:minimize',
    'window:maximize',
    'window:close',
    'window:get-initial-state',
    'app:get-version',
    'theme:get-native-theme',
    'app:send-fake-update',
    'updater:start-download',
    'library:get-initial-tracks' 
];

const validSendChannels = [
  'quit-and-install',
  'karaoke:toggle',
  'karaoke:update-data',
  'media:update-controls',
  'library:start-smart-scan', 
  'library:force-rescan'      
];

const validReceiveChannels = [
  'update-message',
  'window-state-changed',
  'player-state-update',
  'karaoke-window-closed',
  'media-control-event',
  'native-theme-changed',
  'library-scan-status',    
  'library-tracks-added',  
  'library-tracks-removed'  
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
  onWindowStateChanged: (callback) => createEventHandler('window-state-changed', callback),
  getAppVersion: createInvokeHandler('app:get-version'),
  startDownload: createInvokeHandler('updater:start-download'),
  quitAndInstall: createSendHandler('quit-and-install'),
  onUpdateMessage: (callback) => createEventHandler('update-message', callback),
  sendFakeUpdate: createInvokeHandler('app:send-fake-update'),
  getNativeTheme: createInvokeHandler('theme:get-native-theme'),
  onThemeChanged: (callback) => createEventHandler('native-theme-changed', callback),
  getInitialTracks: createInvokeHandler('library:get-initial-tracks'),
  startSmartScan: createSendHandler('library:start-smart-scan'),
  forceRescan: createSendHandler('library:force-rescan'),
  onScanStatus: (callback) => createEventHandler('library-scan-status', callback),
  onTracksAdded: (callback) => createEventHandler('library-tracks-added', callback),
  onTracksRemoved: (callback) => createEventHandler('library-tracks-removed', callback),
  toggleKaraokeWindow: createSendHandler('karaoke:toggle'),
  updateKaraokeData: createSendHandler('karaoke:update-data'),
  onKaraokeWindowClosed: (callback) => createEventHandler('karaoke-window-closed', callback),
  updateMediaControls: createSendHandler('media:update-controls'),
  onMediaControlEvent: (callback) => createEventHandler('media-control-event', callback),
  onPlayerStateUpdate: (callback) => createEventHandler('player-state-update', callback),
});