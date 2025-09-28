const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const log = require('electron-log');

const { initDatabase, closeDatabase } = require('./modules/database');

class UniSoundApp {
  constructor() {
    this.isDev = !app.isPackaged;
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    this.modules = new Map();
    
    this.setupLogging();
    this.setupCommandLineArgs();
    this.initializeApp();
  }

  setupLogging() {
    log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
    log.transports.file.level = this.isDev ? 'debug' : 'info';
    Object.assign(console, log.functions);
  }

  setupCommandLineArgs() {
    const switches = [
      'enable-transparent-visuals',
      'force-gpu-rasterization', 
      'ignore-gpu-blocklist',
      'enable-features=VaapiVideoDecoder,HardwareMediaKeyHandling,MediaSessionService'
    ];
    switches.forEach(sw => app.commandLine.appendSwitch(sw));
  }

  async loadModule(moduleName) {
    try {
      if (this.modules.has(moduleName)) return this.modules.get(moduleName);
      log.info(`[LOADING] ${moduleName}...`);
      const moduleExports = require(`./modules/${moduleName}`);
      this.modules.set(moduleName, moduleExports);
      log.info(`[OK] ${moduleName} loaded`);
      return moduleExports;
    } catch (error) {
      log.error(`[ERROR] Failed to load ${moduleName}:`, error);
      throw error;
    }
  }

  async initializeApp() {
    try {
      log.info("=== UniSound Application Starting ===");
      
      if (process.platform === 'win32') {
        app.setAppUserModelId("com.unisound.app");
      }
      
      if (!this.isDev) {
        app.setLoginItemSettings({ openAtLogin: true, args: process.argv.includes('--hidden') ? ['--hidden'] : [] });
      }

      this.handleSingleInstance();
      this.registerAppEvents();
      log.info("App initialization completed");
    } catch (error) {
      log.error("Fatal error during app initialization:", error);
      this.gracefulShutdown();
    }
  }

  handleSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
      log.info("Another instance is running. Exiting...");
      app.quit();
      return;
    }
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (!this.mainWindow.isVisible()) this.mainWindow.show();
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });
  }

  registerAppEvents() {
    protocol.registerSchemesAsPrivileged([
        { scheme: 'unisound-local', privileges: { standard: true, supportFetch: true, secure: true, stream: true } }
    ]);

    app.whenReady().then(() => this.onReady());
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) this.onReady();
    });
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') this.gracefulShutdown();
    });
    app.on('before-quit', () => { this.isQuitting = true; });
    app.on('will-quit', () => this.cleanup());
  }

  async onReady() {
    try {
      log.info("=== App Ready Event ===");
      
      initDatabase();
      log.info("[OK] Database initialized");

      protocol.registerFileProtocol('unisound-local', (request, callback) => {
        try {
            const url = request.url.substring('unisound-local://'.length);
            let decodedPath = decodeURI(url);
            
            if (process.platform === 'win32') {
                if (decodedPath.startsWith('/')) {
                    decodedPath = decodedPath.substring(1);
                }
                if (/^[a-zA-Z]\//.test(decodedPath)) {
                    decodedPath = decodedPath.charAt(0) + ':' + decodedPath.substring(1);
                }
            }
            
            const finalPath = path.normalize(decodedPath);
            return callback({ path: finalPath });

        } catch (error) {
            console.error(`[Protocol] Ошибка обработки URL '${request.url}':`, error);
            return callback({ error: -6 });
        }
      });
      
      const { createWindow } = await this.loadModule('main-window');
      
      const webPreferences = {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      };

      this.mainWindow = createWindow(this.isDev, webPreferences);
      log.info("[OK] Main window created. Initializing other modules...");
      
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }

      const [ { createTray }, { initUpdater }, { initIpcHandlers }, { registerShortcuts } ] = await Promise.all([
        this.loadModule('tray'),
        this.loadModule('app-updater'),
        this.loadModule('ipc-handlers'),
        this.loadModule('shortcuts')
      ]);
      
      this.tray = createTray(this.mainWindow, this.isDev);
      log.info("[OK] Tray created");
      
      initUpdater(this.mainWindow, this.isDev);
      log.info("[OK] Auto-updater initialized");
      
      initIpcHandlers(this.mainWindow);
      log.info("[OK] IPC handlers initialized");
      
      setTimeout(() => {
        registerShortcuts(this.mainWindow);
        log.info("[OK] Global shortcuts registered");
      }, 3000);

      log.info("=== Application Successfully Started ===");
    } catch (error) {
      log.error("Critical error during app ready:", error);
    }
  }

  async gracefulShutdown() {
    log.info("Starting graceful shutdown...");
    app.quit();
  }

  cleanup() {
    log.info("Cleaning up...");
    if (this.modules.has('shortcuts')) {
      const { unregisterShortcuts } = this.modules.get('shortcuts');
      unregisterShortcuts();
    }
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy();
    }
    
    closeDatabase();
    
    log.info("Cleanup completed");
  }
}

try {
  new UniSoundApp();
} catch (error) {
  log.error("Failed to create UniSound app instance:", error);
  process.exit(1);
}