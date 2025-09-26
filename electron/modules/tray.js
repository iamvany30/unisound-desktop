const { Tray, Menu } = require('electron');
const path = require('path');

let tray;

function createTray(mainWindow, isDev) {
  const iconPath = path.join(__dirname, isDev ? '../../public/favicon.ico' : '../../build/favicon.ico');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть UniSound', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Воспроизвести/Пауза', click: () => mainWindow?.webContents.send('media-control-event', 'play-pause') },
    { label: 'Следующий трек', click: () => mainWindow?.webContents.send('media-control-event', 'next') },
    { label: 'Предыдущий трек', click: () => mainWindow?.webContents.send('media-control-event', 'prev') },
    { type: 'separator' },
    { label: 'Выход', click: () => {
        const { app } = require('electron');
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('UniSound');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  return tray;
}

module.exports = { createTray };