const { BrowserWindow, shell, nativeTheme } = require('electron');
const path = require('path');
const { default: Store } = require("electron-store");

const store = new Store();
let mainWindow;

function createMainWindow(isDev, webPreferences) {
  const savedWindowState = store.get('windowState', { width: 1280, height: 800 });
  const iconPath = path.join(__dirname, isDev ? '../../public/favicon.ico' : '../../build/favicon.ico');

  mainWindow = new BrowserWindow({
    ...savedWindowState,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    show: !process.argv.includes('--hidden'),
    webPreferences,
    icon: iconPath,
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../../build/index.html")}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    if (!process.argv.includes('--hidden')) {
      mainWindow.show();
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  nativeTheme.on('updated', () => {
    const mode = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow?.webContents.send('native-theme-changed', mode);
  });

  const saveBounds = () => store.set('windowState', mainWindow.getBounds());
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state-changed', { isMaximized: mainWindow.isMaximized() });
    }
  };
  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);

  mainWindow.on('close', (event) => {
    if (!require('electron').app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  return mainWindow;
}

function getMainWindow() {
    return mainWindow;
}

module.exports = { createMainWindow, getMainWindow };