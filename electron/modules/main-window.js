

const { BrowserWindow, app } = require('electron'); 
const path = require('path');
const url = require('url');

function createWindow(isDev, webPreferences) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: '#0a0e13',
    webPreferences: webPreferences,

    
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0, 0, 0, 0)',
      symbolColor: '#c9d1d9',
      height: 40,
    }
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        
        pathname: path.join(__dirname, '../../build/index.html'), 
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  
  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('window-state-changed', {
            isMaximized: mainWindow.isMaximized(),
            isMinimized: mainWindow.isMinimized(),
            isFullscreen: mainWindow.isFullScreen(),
        });
    }
  };
  
  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);
  mainWindow.on('minimize', sendWindowState);
  mainWindow.on('restore', sendWindowState);
  mainWindow.on('enter-full-screen', sendWindowState);
  mainWindow.on('leave-full-screen', sendWindowState);

  return mainWindow;
}

module.exports = { createWindow };