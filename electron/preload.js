
const { contextBridge, ipcRenderer } = require('electron');

const validSendChannels = [
  'minimize-window',
  'maximize-window',
  'close-window',
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
  'media-control-event'
];

const validInvokeChannels = [
    'window:minimize',
    'window:maximize',
    'window:close',
    'window:get-initial-state',
    'app:get-version',
    'scan-music-library' 
];

const createEventHandler = (channel, callback) => {
  if (!validReceiveChannels.includes(channel)) return () => {};
  
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  getWindowState: () => ipcRenderer.invoke('window:get-initial-state'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  
  quitAndInstall: () => {
    if (validSendChannels.includes('quit-and-install')) {
      ipcRenderer.send('quit-and-install');
    }
  },

  toggleKaraokeWindow: (shouldBeVisible) => {
    if (validSendChannels.includes('karaoke:toggle')) {
      ipcRenderer.send('karaoke:toggle', shouldBeVisible);
    }
  },
  updateKaraokeData: (data) => {
    if (validSendChannels.includes('karaoke:update-data')) {
      ipcRenderer.send('karaoke:update-data', data);
    }
  },
  updateMediaControls: (data) => {
    if (validSendChannels.includes('media:update-controls')) {
      ipcRenderer.send('media:update-controls', data);
    }
  },

  scanMusicLibrary: () => {
    if (validInvokeChannels.includes('scan-music-library')) {
      return ipcRenderer.invoke('scan-music-library');
    }
    console.warn('IPC канал "scan-music-library" не разрешен.');
    return Promise.resolve([]); 
  },
  
  onUpdateMessage: (callback) => createEventHandler('update-message', callback),
  onWindowStateChanged: (callback) => createEventHandler('window-state-changed', callback),
  onPlayerStateUpdate: (callback) => createEventHandler('player-state-update', callback),
  onKaraokeWindowClosed: (callback) => createEventHandler('karaoke-window-closed', callback),
  onMediaControlEvent: (callback) => createEventHandler('media-control-event', callback)
});