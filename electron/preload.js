const { contextBridge, ipcRenderer } = require('electron');

const validSendChannels = [
  'minimize-window',
  'maximize-window',
  'close-window',
  'start-download',
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

const createEventHandler = (channel, callback) => {
  if (!validReceiveChannels.includes(channel)) return () => {};
  
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => {
    if (validSendChannels.includes('minimize-window')) {
      ipcRenderer.send('minimize-window');
    }
    return ipcRenderer.invoke('window:minimize');
  },
  
  maximizeWindow: () => {
    if (validSendChannels.includes('maximize-window')) {
      ipcRenderer.send('maximize-window');
    }
    return ipcRenderer.invoke('window:maximize');
  },
  
  closeWindow: () => {
    if (validSendChannels.includes('close-window')) {
      ipcRenderer.send('close-window');
    }
    return ipcRenderer.invoke('window:close');
  },
  
  getWindowState: () => ipcRenderer.invoke('window:get-initial-state'),
  getGpuStatus: () => ipcRenderer.invoke('app:get-gpu-status'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  
  startDownload: () => {
    if (validSendChannels.includes('start-download')) {
      ipcRenderer.send('start-download');
    }
  },
  
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
  
  onUpdateMessage: (callback) => createEventHandler('update-message', callback),
  onWindowStateChanged: (callback) => createEventHandler('window-state-changed', callback),
  onPlayerStateUpdate: (callback) => createEventHandler('player-state-update', callback),
  onKaraokeWindowClosed: (callback) => createEventHandler('karaoke-window-closed', callback),
  onMediaControlEvent: (callback) => createEventHandler('media-control-event', callback)
});