const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');
let autoUpdater;
let manualCheckInProgress = false;
try {
  // Intentar cargar solo si está instalado en el entorno (CI o local)
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  log.catchErrors();
} catch (e) {
  console.log('electron-updater no está instalado, update automático deshabilitado.');
  autoUpdater = null;
}

function createApplicationMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'Help',
      submenu: [
        {
          label: 'Buscar actualizaciones…',
          click: () => {
            if (process.env.NODE_ENV === 'development') {
              dialog.showMessageBox({
                type: 'info',
                title: 'Actualizar',
                message: 'Las comprobaciones de actualización están deshabilitadas en modo desarrollo.',
              });
              return;
            }
            if (!autoUpdater) {
              dialog.showMessageBox({
                type: 'warning',
                title: 'Actualizar',
                message: 'El módulo de auto-actualización no está disponible.',
              });
              return;
            }
            manualCheckInProgress = true;
            autoUpdater.checkForUpdates().catch((err) => {
              manualCheckInProgress = false;
              log.error('Manual update check failed', err);
              dialog.showMessageBox({
                type: 'error',
                title: 'Actualizar',
                message: 'No se pudo comprobar si hay actualizaciones.',
                detail: err?.message ?? String(err),
              });
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Habilitar webviewTag es crucial para nuestra app
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // En desarrollo, carga la URL del servidor de Vite.
  // En producción, carga el archivo HTML compilado.
  if (process.env.NODE_ENV === 'development') {
    const devUrl = process.env.DEV_SERVER_URL || 'http://localhost:5173';
    win.loadURL(devUrl);
    // Abrir las herramientas de desarrollo.
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  createApplicationMenu();
});

// Auto-update: sólo en producción y si electron-updater está disponible
app.whenReady().then(() => {
  if (process.env.NODE_ENV !== 'development' && autoUpdater) {
    try {
      // Configuración básica: comprobar actualizaciones y notificar
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error('autoUpdater check failed', err);
      });

      autoUpdater.on('checking-for-update', () => {
        log.info('autoUpdater: checking for update');
      });

      autoUpdater.on('update-available', (info) => {
        log.info('autoUpdater: update available', info.version);
        if (manualCheckInProgress) {
          dialog.showMessageBox({
            type: 'info',
            title: 'Actualizar',
            message: `Se encontró una actualización (${info.version}). Se descargará en segundo plano.`,
          });
        }
      });

      autoUpdater.on('update-not-available', () => {
        log.info('autoUpdater: no update available');
        if (manualCheckInProgress) {
          manualCheckInProgress = false;
          dialog.showMessageBox({
            type: 'info',
            title: 'Actualizar',
            message: 'No hay nuevas versiones disponibles.',
          });
        }
      });

      autoUpdater.on('download-progress', (progressInfo) => {
        log.info(
          'autoUpdater: download progress',
          JSON.stringify({
            percent: Math.round(progressInfo.percent),
            transferred: progressInfo.transferred,
            total: progressInfo.total,
            bytesPerSecond: progressInfo.bytesPerSecond,
          })
        );
      });

      autoUpdater.on('error', (error) => {
        log.error('autoUpdater error:', error);
        if (manualCheckInProgress) {
          manualCheckInProgress = false;
          dialog.showMessageBox({
            type: 'error',
            title: 'Actualizar',
            message: 'Ocurrió un error al comprobar actualizaciones.',
            detail: error?.message ?? String(error),
          });
        }
      });

      autoUpdater.on('update-downloaded', (info) => {
        if (manualCheckInProgress) {
          manualCheckInProgress = false;
        }
        // Notificar al usuario y ofrecer reiniciar
        const focused = BrowserWindow.getFocusedWindow();
        const choice = dialog.showMessageBoxSync(focused, {
          type: 'question',
          buttons: ['Reiniciar ahora', 'Después'],
          defaultId: 0,
          cancelId: 1,
          title: 'Actualización disponible',
          message: `Se ha descargado una nueva versión. ¿Deseas reiniciar para aplicar la actualización?`,
        });

        if (choice === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    } catch (err) {
      console.error('Error inicializando electron-updater:', err);
    }
  }
});

// IPC handlers para persistencia de pestañas
ipcMain.handle('read-tabs', async () => {
  try {
    const userPath = app.getPath('userData');
    const file = path.join(userPath, 'tabs.json');
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error leyendo tabs.json', err);
    return [];
  }
});

ipcMain.handle('write-tabs', async (event, tabs) => {
  try {
    const userPath = app.getPath('userData');
    const file = path.join(userPath, 'tabs.json');
    fs.writeFileSync(file, JSON.stringify(tabs, null, 2), 'utf8');
    return { ok: true };
  } catch (err) {
    console.error('Error escribiendo tabs.json', err);
    return { ok: false, error: err.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
