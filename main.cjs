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

function openDownloadsHistoryWindow() {
  const historyWin = new BrowserWindow({
    width: 600,
    height: 400,
    title: 'Historial de Descargas',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Leer historial directamente
  try {
    const userPath = app.getPath('userData');
    const file = path.join(userPath, 'downloads_history.json');
    let history = [];
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      history = JSON.parse(content);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Historial de Descargas</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          h2 { color: #333; margin-bottom: 20px; text-align: center; }
          ul { list-style: none; padding: 0; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          li { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
          li:last-child { border-bottom: none; }
          .info { flex: 1; }
          .label { font-weight: bold; font-size: 1.1em; color: #007bff; margin-bottom: 5px; }
          .url { color: #666; font-size: 0.9em; margin-bottom: 3px; word-break: break-all; }
          .path { color: #999; font-size: 0.8em; margin-bottom: 3px; }
          .timestamp { color: #999; font-size: 0.8em; }
          .empty { text-align: center; color: #999; padding: 40px; font-style: italic; }
          button { background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
          button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <h2>Historial de Páginas Guardadas</h2>
        ${history.length === 0 ? '<p class="empty">No hay descargas aún.</p>' : `
        <ul>
          ${history.map((item, index) => `
            <li>
              <div class="info">
                <div class="label">${item.label || 'Sin etiqueta'}</div>
                <div class="url">${item.url}</div>
                <div class="path">Guardado en: ${item.path}</div>
                <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
              </div>
              <button onclick="openFolder('${item.path.replace(/\\/g, '\\\\')}')">Abrir carpeta</button>
            </li>
          `).join('')}
        </ul>
        `}
        <script>
          const { shell } = require('electron');
          function openFolder(filePath) {
            const dir = require('path').dirname(filePath);
            shell.openPath(dir);
          }
        </script>
      </body>
      </html>
    `;
    historyWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  } catch (err) {
    console.error('Error cargando historial:', err);
    historyWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent('<h2>Error cargando historial</h2>')}`);
  }
}

function createApplicationMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva pestaña',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            // Enviar mensaje al renderer para agregar pestaña
            const focused = BrowserWindow.getFocusedWindow();
            if (focused) {
              focused.webContents.send('new-tab');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Historial de descargas',
          click: () => {
            openDownloadsHistoryWindow();
          },
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Ayuda',
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
            // Mostrar popup inicial
            dialog.showMessageBox({
              type: 'info',
              title: 'Buscando actualizaciones',
              message: 'Estamos buscando actualizaciones...',
            });
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
        { type: 'separator' },
        {
          label: 'Acerca de ChaseBrowse',
          click: () => {
            const version = require('./package.json').version;
            dialog.showMessageBox({
              type: 'info',
              title: 'Acerca de ChaseBrowse',
              message: `ChaseBrowse v${version}`,
              detail: 'Navegador multiplataforma desarrollado con Electron y React.\n\nCreado por IDellamea.',
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
    icon: path.join(__dirname, 'public', 'logo.ico'),
    webPreferences: {
      // Habilitar webviewTag es crucial para nuestra app
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Maximizar la ventana al abrir
  win.maximize();

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
      autoUpdater.allowPrerelease = true; // Permite versiones beta/alpha
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error('autoUpdater check failed', err);
      });

      autoUpdater.on('checking-for-update', () => {
        log.info('autoUpdater: checking for update');
      });

      autoUpdater.on('update-available', (info) => {
        log.info('autoUpdater: update available', info.version);
        if (manualCheckInProgress) {
          const currentVersion = require('./package.json').version;
          const choice = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: 'question',
            buttons: ['Actualizar ahora', 'Después'],
            defaultId: 0,
            cancelId: 1,
            title: 'Actualización disponible',
            message: `Versión actual: ${currentVersion}\nVersión nueva: ${info.version}\n\n¿Deseas descargar e instalar la actualización ahora?`,
          });
          if (choice === 0) {
            // Continuar con la descarga automática
          } else {
            manualCheckInProgress = false;
          }
        }
      });

      autoUpdater.on('update-not-available', () => {
        log.info('autoUpdater: no update available');
        if (manualCheckInProgress) {
          manualCheckInProgress = false;
          const currentVersion = require('./package.json').version;
          dialog.showMessageBox({
            type: 'info',
            title: 'Sin actualizaciones',
            message: `Estás usando la versión más reciente (${currentVersion}).`,
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

// Handlers para historial de descargas
ipcMain.handle('read-downloads-history', async () => {
  try {
    const userPath = app.getPath('userData');
    const file = path.join(userPath, 'downloads_history.json');
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error leyendo downloads_history.json', err);
    return [];
  }
});

ipcMain.handle('write-downloads-history', async (event, history) => {
  try {
    const userPath = app.getPath('userData');
    const file = path.join(userPath, 'downloads_history.json');
    fs.writeFileSync(file, JSON.stringify(history, null, 2), 'utf8');
    return { ok: true };
  } catch (err) {
    console.error('Error escribiendo downloads_history.json', err);
    return { ok: false, error: err.message };
  }
});

// Handler para guardar página usando single-file-cli
ipcMain.handle('save-page', async (event, { url, label }) => {
  const { exec } = require('child_process');

  // Mostrar diálogo para elegir ubicación y nombre del archivo
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Guardar página como',
    defaultPath: `pagina_guardada_${Date.now()}.html`,
    filters: [
      { name: 'Archivos HTML', extensions: ['html'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return { success: false, error: 'Operación cancelada por el usuario' };
  }

  const fullPath = result.filePath;
  const outputDir = path.dirname(fullPath);
  const filename = path.basename(fullPath);

  const command = `single-file "${url}" --output-directory "${outputDir}" --filename-template "${filename}"`;

  return new Promise(async (resolve) => {
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Error ejecutando single-file-cli:', error);
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
          type: 'error',
          title: 'Error al guardar página',
          message: 'No se pudo guardar la página.',
          detail: error.message,
        });
        resolve({ success: false, error: error.message });
      } else {
        console.log('Página guardada exitosamente:', fullPath);

        // Añadir al historial
        try {
          const userPath = app.getPath('userData');
          const histFile = path.join(userPath, 'downloads_history.json');
          let history = [];
          if (fs.existsSync(histFile)) {
            const content = fs.readFileSync(histFile, 'utf8');
            history = JSON.parse(content);
          }
          history.unshift({
            url,
            label,
            path: fullPath,
            timestamp: new Date().toISOString(),
            filename: path.basename(fullPath)
          });
          // Mantener solo las últimas 50 entradas
          if (history.length > 50) history.splice(50);
          fs.writeFileSync(histFile, JSON.stringify(history, null, 2), 'utf8');
        } catch (histErr) {
          console.error('Error guardando en historial:', histErr);
        }

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
          type: 'info',
          title: 'Página guardada',
          message: 'La página se ha guardado exitosamente.',
          detail: `Archivo guardado en: ${fullPath}`,
        });
        resolve({ success: true, path: fullPath });
      }
    });
  });
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
