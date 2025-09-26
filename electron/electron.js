const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const log = require('electron-log');

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
        { scheme: 'unisound-local', privileges: { standard: true, supportFetch: true, secure: true } }
    ]);

    app.whenReady().then(() => this.onReady());
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createMainWindow();
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

      protocol.registerFileProtocol('unisound-local', (request, callback) => {
          const url = request.url.replace('unisound-local://', '');
          try {
              return callback(decodeURI(url));
          }
          catch (error) {
              console.error('Не удалось обработать unisound-local URL', error);
          }
      });
      
      const [ { createMainWindow }, { createTray }, { initUpdater }, { initIpcHandlers }, { registerShortcuts } ] = await Promise.all([
        this.loadModule('main-window'),
        this.loadModule('tray'),
        this.loadModule('app-updater'),
        this.loadModule('ipc-handlers'),
        this.loadModule('shortcuts')
      ]);
      
      const webPreferences = {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      };

      this.mainWindow = createMainWindow(this.isDev, webPreferences);
      log.info("[OK] Main window created with correct webPreferences");

      this.tray = createTray(this.mainWindow, this.isDev);
      log.info("[OK] Tray created");
      
      initUpdater(this.mainWindow, this.isDev);
      log.info("[OK] Auto-updater initialized");
      
      initIpcHandlers(this.mainWindow);
      log.info("[OK] IPC handlers initialized");
      
      registerShortcuts(this.mainWindow);
      log.info("[OK] Global shortcuts registered");

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
    log.info("Cleanup completed");
  }
}

try {
  new UniSoundApp();
} catch (error) {
  log.error("Failed to create UniSound app instance:", error);
  process.exit(1);
} 