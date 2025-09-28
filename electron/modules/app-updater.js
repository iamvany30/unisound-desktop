const { autoUpdater } = require("electron-updater");
const { Notification, app } = require('electron');
const path = require('path');
const log = require('electron-log');
const { EventEmitter } = require('events');

class AppUpdater extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.mainWindow = null;
    this.isDev = options.isDev || false;
    this.options = {
      autoDownload: options.autoDownload !== false,
      autoInstallOnAppQuit: options.autoInstallOnAppQuit || false,
      checkInterval: options.checkInterval || 15 * 60 * 1000,
      initialDelay: options.initialDelay || 60 * 1000, 
      allowPrerelease: options.allowPrerelease || false,
      allowDowngrade: options.allowDowngrade || false,
      ...options
    };
    
    this.state = {
      isChecking: false,
      isDownloading: false,
      lastCheck: null,
      updateAvailable: false,
      downloadProgress: 0,
      version: null,
      error: null
    };
    
    this.checkTimer = null;
    this.retryTimer = null;
    this.retryCount = 0;
    this.lastProgressNotificationPercentage = -1;
    
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = this.isDev ? 'debug' : 'info';
    autoUpdater.autoDownload = this.options.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.options.autoInstallOnAppQuit;
    autoUpdater.allowPrerelease = this.options.allowPrerelease;
    autoUpdater.allowDowngrade = this.options.allowDowngrade;
    if (this.isDev) {
      autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml');
      autoUpdater.forceDevUpdateConfig = true;
    }

    this.registerAutoUpdaterEvents();
  }

  registerAutoUpdaterEvents() {
    autoUpdater.on('checking-for-update', () => {
      this.state.isChecking = true;
      this.state.error = null;
      log.info('[Updater] Checking for updates...');
      this.emit('checking-for-update');
      this.sendToRenderer('update-message', { msg: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      this.state.isChecking = false;
      this.state.updateAvailable = true;
      this.state.version = info.version;
      this.state.lastCheck = new Date();
      this.resetRetry(); 
      
      log.info(`[Updater] Update available: ${info.version}`);
      this.emit('update-available', info);
      this.sendToRenderer('update-message', { msg: 'available', info });
      
      this.showUpdateNotification(
        'Доступно обновление!', 
        `Версия ${info.version} будет загружена в фоновом режиме.`,
        'info'
      );
    });

    autoUpdater.on('update-not-available', (info) => {
      this.state.isChecking = false;
      this.state.updateAvailable = false;
      this.state.lastCheck = new Date();
      this.resetRetry();
      
      log.info('[Updater] Update not available');
      this.emit('update-not-available', info);
      this.sendToRenderer('update-message', { msg: 'not-available', info });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.state.isDownloading = true;
      this.state.downloadProgress = progressObj.percent;
      
      log.debug(`[Updater] Download progress: ${progressObj.percent.toFixed(2)}%`);
      this.emit('download-progress', progressObj);
      this.sendToRenderer('update-message', { 
        msg: 'download-progress', 
        progress: progressObj 
      });

      const percent = Math.floor(progressObj.percent);
      if (percent > 0 && percent >= this.lastProgressNotificationPercentage + 25) {
        this.showUpdateNotification(
          'Загрузка обновления',
          `Загружено ${percent}%`,
          'info'
        );
        this.lastProgressNotificationPercentage = percent;
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.state.isDownloading = false;
      this.state.downloadProgress = 100;
      this.lastProgressNotificationPercentage = -1;
      
      log.info(`[Updater] Update downloaded: ${info.version}`);
      this.emit('update-downloaded', info);
      this.sendToRenderer('update-message', { msg: 'downloaded', info });
      
      this.showUpdateNotification(
        'Обновление готово к установке!',
        `Версия ${info.version} загружена. Перезапустите приложение для установки.`,
        'success'
      );
    });

    autoUpdater.on('error', (error) => {
      this.state.isChecking = false;
      this.state.isDownloading = false;
      this.state.error = error.message;
      this.lastProgressNotificationPercentage = -1;
      
      log.error('[Updater] Update error:', error);
      this.emit('error', error);
      this.sendToRenderer('update-message', { 
        msg: 'error', 
        error: error.message 
      });
      
      const isNetworkError = error.message.includes('net::') || error.message.includes('ENOTFOUND');
      
      if (isNetworkError) {
        log.warn('[Updater] Network error detected. Scheduling a retry...');
        this.scheduleRetry();
      } else {
        this.showUpdateNotification(
          'Ошибка обновления',
          'Не удалось проверить или загрузить обновление. Попробуем позже.',
          'error'
        );
      }
    });
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send(channel, data);
      } catch (error) {
        log.warn('[Updater] Failed to send message to renderer:', error);
      }
    }
  }

  showUpdateNotification(title, body, type = 'info', onClick = null) {
    if (!Notification.isSupported()) {
      return;
    }

    try {
      const iconPath = this.getIconPath();
      const notification = new Notification({
        title,
        body,
        icon: iconPath,
        silent: false,
        urgency: type === 'error' ? 'critical' : 'normal'
      });

      if (onClick && typeof onClick === 'function') {
        notification.on('click', onClick);
      } else {
        notification.on('click', () => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        });
      }

      notification.show();
      
      setTimeout(() => {
        if (!notification.isDestroyed) {
          notification.close();
        }
      }, 10000);

    } catch (error) {
      log.warn('[Updater] Failed to show notification:', error);
    }
  }

  getIconPath() {
    const iconName = process.platform === 'win32' ? 'favicon.ico' : 'favicon.png';
    return path.join(__dirname, this.isDev ? `../../public/${iconName}` : `../../build/${iconName}`);
  }

  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    
    if (this.isDev) {
      log.info('[Updater] Development mode - auto-updates disabled');
      return;
    }

    log.info('[Updater] Initializing update system...');
    
    setTimeout(() => {
      this.checkForUpdates();
    }, this.options.initialDelay);

    this.startPeriodicCheck();
    
    log.info('[Updater] Update system initialized');
  }

  startPeriodicCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(() => {
      if (!this.state.isChecking && !this.state.isDownloading) {
        this.checkForUpdates();
      }
    }, this.options.checkInterval);
  }

  stopPeriodicCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  scheduleRetry() {
    this.stopPeriodicCheck();
    if (this.retryTimer) clearTimeout(this.retryTimer);

    this.retryCount++;
    const delayMinutes = Math.min(30, Math.pow(2, this.retryCount));
    const delay = delayMinutes * 60 * 1000;

    log.info(`[Updater] Retrying update check in ${delayMinutes} minutes (attempt ${this.retryCount}).`);

    this.retryTimer = setTimeout(() => {
      log.info('[Updater] Executing scheduled retry check for updates...');
      this.checkForUpdates();
      this.startPeriodicCheck();
    }, delay);
  }

  resetRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.retryCount > 0) {
      log.info('[Updater] Update check successful, resetting retry counter.');
      this.retryCount = 0;
    }
  }

  async checkForUpdates(showNoUpdateNotification = false) {
    if (this.isDev) {
      log.info('[Updater] Skipping update check in development mode');
      return null;
    }

    if (this.state.isChecking || this.state.isDownloading) {
      log.info('[Updater] Update check or download already in progress');
      return null;
    }

    try {
      log.info('[Updater] Starting update check...');
      const result = await autoUpdater.checkForUpdates();
      
      if (result && !result.updateInfo.version && showNoUpdateNotification) {
        this.showUpdateNotification(
          'Обновлений нет',
          'Вы используете последнюю версию приложения.',
          'info'
        );
      }
      
      return result;
    } catch (error) {
      log.error('[Updater] Check failed during execution:', error);
      
      if (showNoUpdateNotification) {
        this.showUpdateNotification(
          'Ошибка проверки обновлений',
          'Не удалось проверить наличие обновлений.',
          'error'
        );
      }
      
      return null;
    }
  }

  async downloadUpdate() {
    if (this.isDev) {
      log.info('[Updater] Cannot download in development mode');
      return false;
    }

    if (this.state.isDownloading) {
      log.info('[Updater] Download already in progress');
      return false;
    }

    if (!this.state.updateAvailable) {
      log.info('[Updater] No update available to download');
      return false;
    }

    try {
      log.info('[Updater] Starting update download');
      await autoUpdater.downloadUpdate();
      return true;
    } catch (error) {
      log.error('[Updater] Download failed:', error);
      return false;
    }
  }

  quitAndInstall(isSilent = false, isForceRunAfter = true) {
    if (this.isDev) {
      log.info('[Updater] Cannot install in development mode');
      return false;
    }

    try {
      log.info('[Updater] Quitting and installing update');
      autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
      return true;
    } catch (error) {
      log.error('[Updater] Failed to quit and install:', error);
      return false;
    }
  }

  getState() {
    return {
      ...this.state,
      currentVersion: app.getVersion(),
      isDev: this.isDev,
      autoDownload: autoUpdater.autoDownload,
      lastCheckFormatted: this.state.lastCheck ? this.state.lastCheck.toLocaleString() : null
    };
  }

  getUpdateInfo() {
    return {
      available: this.state.updateAvailable,
      version: this.state.version,
      currentVersion: app.getVersion(),
      isDownloading: this.state.isDownloading,
      downloadProgress: this.state.downloadProgress,
      error: this.state.error
    };
  }

  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    autoUpdater.autoDownload = this.options.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.options.autoInstallOnAppQuit;
    autoUpdater.allowPrerelease = this.options.allowPrerelease;
    autoUpdater.allowDowngrade = this.options.allowDowngrade;
    if (newOptions.checkInterval) {
      this.startPeriodicCheck();
    }
  }

  cleanup() {
    this.stopPeriodicCheck();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.removeAllListeners();
    this.mainWindow = null;
    log.info('[Updater] Cleanup completed');
  }
}

let appUpdater = null;

function initUpdater(mainWindow, isDev = false, options = {}) {
  if (appUpdater) {
    log.warn('[Updater] Updater already initialized, cleaning up first...');
    appUpdater.cleanup();
  }

  appUpdater = new AppUpdater({ isDev, ...options });
  appUpdater.initialize(mainWindow);
  
  return appUpdater;
}

function getUpdater() {
  return appUpdater;
}

function checkForUpdates(showNotification = false) {
  if (appUpdater) {
    return appUpdater.checkForUpdates(showNotification);
  }
  return Promise.resolve(null);
}
function quitAndInstall() {
  if (appUpdater) {
    return appUpdater.quitAndInstall();
  }
  return false;
}

function getUpdateState() {
  if (appUpdater) {
    return appUpdater.getState();
  }
  return null;
}

function startDownload() {
  if (appUpdater) {
    return appUpdater.downloadUpdate();
  }
  return Promise.resolve(false);
}

function cleanupUpdater() {
  if (appUpdater) {
    appUpdater.cleanup();
    appUpdater = null;
  }
}

module.exports = {
  AppUpdater,
  initUpdater,
  getUpdater,
  checkForUpdates,
  quitAndInstall,
  getUpdateState,
  startDownload,
  cleanupUpdater
};