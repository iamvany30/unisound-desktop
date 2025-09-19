const { app, BrowserWindow, Menu, ipcMain, Tray, globalShortcut, shell, nativeImage } = require("electron");
const path = require("path");
const { default: Store } = require("electron-store");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('force-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

const isDev = !app.isPackaged;
const store = new Store();
let mainWindow;
let tray;
let karaokeWindow;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

const createThumbarIcon = (iconName) => {
  const iconPath = path.join(__dirname, `../src/assets/icons/${iconName}.png`);
  
  try {
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
      console.error(`Icon loading error: ${iconName}. Path: ${iconPath}`);
      return null;
    }
    return image;
  } catch (error) {
    console.error(`Critical error loading icon "${iconName}":`, error);
    return null;
  }
};

const thumbarIcons = {
  play: createThumbarIcon('play'),
  pause: createThumbarIcon('pause'),
  next: createThumbarIcon('next'),
  prev: createThumbarIcon('prev')
};

function createKaraokeWindow() {
  if (karaokeWindow) {
    karaokeWindow.focus();
    return;
  }

  karaokeWindow = new BrowserWindow({
    width: 500,
    height: 650,
    minWidth: 320,
    minHeight: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    parent: mainWindow,
  });

  const startUrl = isDev 
    ? "http://localhost:3000/#/karaoke" 
    : `file://${path.join(__dirname, "../build/index.html")}#/karaoke`;
  karaokeWindow.loadURL(startUrl);

  karaokeWindow.on('closed', () => {
    karaokeWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('karaoke-window-closed');
    }
  });
}

function createWindow() {
  const savedWindowState = store.get('windowState', { width: 1280, height: 800 });

  mainWindow = new BrowserWindow({
    ...savedWindowState,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  const startUrl = isDev 
    ? "http://localhost:3000" 
    : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) {
      autoUpdater.checkForUpdates();
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  
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
    if (!app.isQuitting) { 
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

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    mainWindow.webContents.send('update-message', { msg: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
    mainWindow.webContents.send('update-message', { msg: 'available', info });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No updates found.');
    mainWindow.webContents.send('update-message', { msg: 'not-available' });
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
    mainWindow.webContents.send('update-message', { msg: 'error', error: err.message });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Downloaded ${progressObj.percent}%`);
    mainWindow.webContents.send('update-message', { msg: 'progress', progress: progressObj });
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded.');
    mainWindow.webContents.send('update-message', { msg: 'downloaded' });
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, isDev ? '../public/favicon.ico' : '../build/favicon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open UniSound', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Play/Pause', click: () => mainWindow?.webContents.send('media-control-event', 'play-pause') },
    { label: 'Next Track', click: () => mainWindow?.webContents.send('media-control-event', 'next') },
    { label: 'Previous Track', click: () => mainWindow?.webContents.send('media-control-event', 'prev') },
    { type: 'separator' },
    { label: 'Exit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('UniSound');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { 
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow.show(); 
  });
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('unisound', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('unisound');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const url = commandLine.pop().slice(0, -1);
      if (url.startsWith('unisound://')) {
        mainWindow.webContents.send('deep-link', url);
      }
    }
  });
}

app.on('ready', () => {
  setTimeout(createWindow, 100);
  createTray();
  
  globalShortcut.register('MediaPlayPause', () => mainWindow?.webContents.send('media-control-event', 'play-pause'));
  globalShortcut.register('MediaNextTrack', () => mainWindow?.webContents.send('media-control-event', 'next'));
  globalShortcut.register('MediaPreviousTrack', () => mainWindow?.webContents.send('media-control-event', 'prev'));
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') app.quit(); 
});

app.on('before-quit', () => app.isQuitting = true);
app.on('will-quit', () => globalShortcut.unregisterAll());

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
ipcMain.handle('app:get-gpu-status', () => app.getGPUFeatureStatus());

ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('close-window', () => mainWindow?.close());

ipcMain.on('start-download', () => autoUpdater.downloadUpdate());
ipcMain.on('quit-and-install', () => autoUpdater.quitAndInstall());
ipcMain.on('updater:restart-and-install', () => autoUpdater.quitAndInstall());

ipcMain.on('karaoke:toggle', (event, shouldBeVisible) => {
  if (shouldBeVisible) {
    if (!karaokeWindow) {
      createKaraokeWindow();
    }
    setTimeout(() => {
      karaokeWindow?.show();
    }, 150);
  } else {
    karaokeWindow?.close();
  }
});

ipcMain.on('karaoke:update-data', (event, data) => {
  if (karaokeWindow && !karaokeWindow.isDestroyed()) {
    karaokeWindow.webContents.send('player-state-update', data);
  }
});

ipcMain.on('media:update-controls', (event, data) => {
  if (!mainWindow) return;

  if (!data) {
    mainWindow.setTitle('UniSound');
    mainWindow.setThumbarButtons([]);
    return;
  }

  const { title, artist, isPlaying } = data;
  
  mainWindow.setTitle(`${title} - ${artist}`);
  
  const buttons = [
    {
      tooltip: 'Previous Track',
      icon: thumbarIcons.prev,
      click: () => mainWindow.webContents.send('media-control-event', 'prev'),
    },
    {
      tooltip: isPlaying ? 'Pause' : 'Play',
      icon: isPlaying ? thumbarIcons.pause : thumbarIcons.play,
      click: () => mainWindow.webContents.send('media-control-event', 'play-pause'),
    },
    {
      tooltip: 'Next Track',
      icon: thumbarIcons.next,
      click: () => mainWindow.webContents.send('media-control-event', 'next'),
    },
  ].filter(btn => btn.icon);

  if (buttons.length < 3) {
    mainWindow.setThumbarButtons([]);
  } else {
    try {
      mainWindow.setThumbarButtons(buttons);
    } catch (error) {
      console.error('Error setting thumbar buttons:', error);
    }
  }
});