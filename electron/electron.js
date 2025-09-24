
const { app, BrowserWindow, Menu, ipcMain, Tray, globalShortcut, shell, nativeImage, Notification } = require("electron");
const path = require("path");
const fs = require('fs/promises');
const musicMetadata = require('music-metadata');
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

const iconPath = path.join(__dirname, isDev ? '../public/favicon.ico' : '../build/favicon.ico');

log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);

autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

if (!isDev) {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: ['--hidden']
  });
}


function showUpdateNotification(title, body) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: iconPath,
      silent: false
    });
    notification.on('click', () => {
      if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    notification.show();
  }
}

async function scanForMusic(directory) {
    let musicFiles = [];
    const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];
    try {
        const items = await fs.readdir(directory, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(directory, item.name);
            if (item.isDirectory()) {
                if (!item.name.startsWith('.')) {
                    musicFiles = musicFiles.concat(await scanForMusic(fullPath));
                }
            } else if (supportedExtensions.includes(path.extname(item.name).toLowerCase())) {
                musicFiles.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`Ошибка при сканировании директории ${directory}:`, error.message);
    }
    return musicFiles;
}


function createWindow() {
  console.log('Создание главного окна приложения...');
  const savedWindowState = store.get('windowState', { width: 1280, height: 800 });

  mainWindow = new BrowserWindow({
    ...savedWindowState,
    minWidth: 940,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    backgroundColor: '#00000000',
    show: !process.argv.includes('--hidden'),
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    icon: iconPath,
  });

  const startUrl = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    if (!process.argv.includes('--hidden')) {
        mainWindow.show();
    }
    console.log('Окно готово к показу.');
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

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-message', { msg: 'available', info });
    showUpdateNotification('Доступно обновление!', `Версия ${info.version} будет загружена в фоновом режиме.`);
  });
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-message', { msg: 'downloaded' });
    showUpdateNotification('Обновление готово!', 'Новая версия загружена. Перезапустите приложение, чтобы ее установить.');
  });
}

function createTray() {
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть UniSound', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Воспроизвести/Пауза', click: () => mainWindow?.webContents.send('media-control-event', 'play-pause') },
    { label: 'Следующий трек', click: () => mainWindow?.webContents.send('media-control-event', 'next') },
    { label: 'Предыдущий трек', click: () => mainWindow?.webContents.send('media-control-event', 'prev') },
    { type: 'separator' },
    { label: 'Выход', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('UniSound');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('ready', () => {
  setTimeout(createWindow, 100);
  createTray();
  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdates(), 60 * 1000);
    setInterval(() => autoUpdater.checkForUpdates(), 15 * 60 * 1000);
  }
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

ipcMain.on('quit-and-install', () => {
  console.log('Получена команда: перезапустить и установить.');
  autoUpdater.quitAndInstall();
});

ipcMain.handle('scan-music-library', async () => {
    const musicDir = app.getPath('music');
    console.log(`[Offline Mode] Начинаем сканирование директории: ${musicDir}`);
    
    const filePaths = await scanForMusic(musicDir);
    
    const tracksWithMetadata = await Promise.all(
        filePaths.map(async (filePath) => {
            try {
                const metadata = await musicMetadata.parseFile(filePath);
                const cover = musicMetadata.selectCover(metadata.common.picture);
                
                return {
                    uuid: `local-${Buffer.from(filePath).toString('hex')}`,
                    filePath: filePath,
                    title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
                    artist: metadata.common.artist || 'Неизвестный исполнитель',
                    album: metadata.common.album || 'Неизвестный альбом',
                    year: metadata.common.year,
                    duration: metadata.format.duration,
                    artwork: cover ? `data:${cover.format};base64,${cover.data.toString('base64')}` : null,
                    isLocal: true,
                };
            } catch (error) {
                console.warn(`Не удалось обработать файл ${filePath}:`, error.message);
                return null;
            }
        })
    );
    
    const validTracks = tracksWithMetadata.filter(track => track !== null);
    console.log(`[Offline Mode] Сканирование завершено. Найдено ${validTracks.length} треков.`);
    return validTracks;
});