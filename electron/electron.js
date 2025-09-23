const { app, BrowserWindow, Menu, ipcMain, Tray, globalShortcut, shell, nativeImage } = require("electron");
const path = require("path");
const { default: Store } = require("electron-store");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

// --- НАСТРОЙКА ---
// Включаем аппаратное ускорение и прозрачность
app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('force-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Определяем, запущено ли приложение в режиме разработки
const isDev = !app.isPackaged;
const store = new Store();
let mainWindow;
let tray;
let karaokeWindow;

// --- ЛОГИРОВАНИЕ ---
// Настраиваем логирование для electron-updater и основного процесса
log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);

// --- НАСТРОЙКА АВТООБНОВЛЕНИЯ ---
autoUpdater.logger = log;
// ИЗМЕНЕНИЕ: Включаем автоматическую фоновую загрузку обновлений
autoUpdater.autoDownload = true;
// ИЗМЕНЕНИЕ: Отключаем автоматическую установку при выходе, чтобы дать контроль пользователю
autoUpdater.autoInstallOnAppQuit = false;

// ИЗМЕНЕНИЕ: Добавляем приложение в автозапуск при старте системы
if (!isDev) {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: ['--hidden'] // Запускаем приложение в скрытом режиме (только трей)
  });
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
const createThumbarIcon = (iconName) => {
  const iconPath = path.join(__dirname, `../src/assets/icons/${iconName}.png`);
  try {
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
      console.error(`Ошибка загрузки иконки: ${iconName}. Путь: ${iconPath}`);
      return null;
    }
    return image;
  } catch (error) {
    console.error(`Критическая ошибка загрузки иконки "${iconName}":`, error);
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
  const startUrl = isDev ? "http://localhost:3000/#/karaoke" : `file://${path.join(__dirname, "../build/index.html")}#/karaoke`;
  karaokeWindow.loadURL(startUrl);
  karaokeWindow.on('closed', () => {
    karaokeWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('karaoke-window-closed');
    }
  });
}

// --- СОЗДАНИЕ ОСНОВНОГО ОКНА ---
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
    // ИЗМЕНЕНИЕ: Окно не будет показано, если приложение запущено с флагом --hidden
    show: !process.argv.includes('--hidden'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  const startUrl = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    // ИЗМЕНЕНИЕ: Показываем окно только если оно не должно быть скрытым
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

  // --- ОБРАБОТЧИКИ СОБЫТИЙ AUTOUPDATER ---
  autoUpdater.on('checking-for-update', () => {
    console.log('Проверка обновлений...');
    mainWindow.webContents.send('update-message', { msg: 'checking' });
  });
  autoUpdater.on('update-available', (info) => {
    console.log('Доступно обновление:', info);
    mainWindow.webContents.send('update-message', { msg: 'available', info });
  });
  autoUpdater.on('update-not-available', () => {
    console.log('Обновлений не найдено.');
    mainWindow.webContents.send('update-message', { msg: 'not-available' });
  });
  autoUpdater.on('error', (err) => {
    const errorMessage = err.message || 'Произошла неизвестная ошибка при попытке обновления.';
    console.error('Ошибка автообновления:', err);
    mainWindow.webContents.send('update-message', { msg: 'error', error: errorMessage });
  });
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Загружено ${progressObj.percent.toFixed(2)}%`);
    mainWindow.webContents.send('update-message', { msg: 'progress', progress: progressObj });
  });
  autoUpdater.on('update-downloaded', () => {
    console.log('Обновление загружено. Готово к установке.');
    mainWindow.webContents.send('update-message', { msg: 'downloaded' });
  });
}

// --- СОЗДАНИЕ ИКОНКИ В ТРЕЕ ---
function createTray() {
  tray = new Tray(path.join(__dirname, isDev ? '../public/favicon.ico' : '../build/favicon.ico'));
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

// --- ОБРАБОТКА ЗАПУСКА ПРИЛОЖЕНИЯ ---
// Защита от запуска нескольких копий приложения
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
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

  // ИЗМЕНЕНИЕ: Логика проверки обновлений перенесена сюда
  if (!isDev) {
    // Первая проверка через 1 минуту после старта, чтобы не нагружать систему сразу
    setTimeout(() => {
      console.log('Первоначальная проверка обновлений...');
      autoUpdater.checkForUpdates();
    }, 60 * 1000);

    // Устанавливаем интервал для периодической проверки каждые 15 минут
    setInterval(() => {
      console.log('Плановая проверка обновлений (каждые 15 минут)...');
      autoUpdater.checkForUpdates();
    }, 15 * 60 * 1000);
  }

  // Регистрация глобальных горячих клавиш
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

// --- ОБРАБОТЧИКИ IPC СОБЫТИЙ ОТ РЕНДЕР-ПРОЦЕССА ---
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

ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('close-window', () => mainWindow?.close());

ipcMain.on('quit-and-install', () => {
  console.log('Получена команда от React: перезапустить и установить.');
  autoUpdater.quitAndInstall();
});

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
    { tooltip: 'Предыдущий трек', icon: thumbarIcons.prev, click: () => mainWindow.webContents.send('media-control-event', 'prev') },
    { tooltip: isPlaying ? 'Пауза' : 'Воспроизвести', icon: isPlaying ? thumbarIcons.pause : thumbarIcons.play, click: () => mainWindow.webContents.send('media-control-event', 'play-pause') },
    { tooltip: 'Следующий трек', icon: thumbarIcons.next, click: () => mainWindow.webContents.send('media-control-event', 'next') },
  ].filter(btn => btn.icon);

  if (buttons.length < 3) {
    mainWindow.setThumbarButtons([]);
  } else {
    try {
      mainWindow.setThumbarButtons(buttons);
    } catch (error) {
      console.error('Ошибка установки кнопок панели задач:', error);
    }
  }
});