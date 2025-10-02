const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
let autoUpdater;
try {
  // Intentar cargar solo si está instalado en el entorno (CI o local)
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  console.log('electron-updater no está instalado, update automático deshabilitado.');
  autoUpdater = null;
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

app.whenReady().then(createWindow);

// Auto-update: sólo en producción y si electron-updater está disponible
app.whenReady().then(() => {
  if (process.env.NODE_ENV !== 'development' && autoUpdater) {
    try {
      // Configuración básica: comprobar actualizaciones y notificar
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error('autoUpdater check failed', err);
      });

      autoUpdater.on('update-available', () => {
        console.log('Update available');
      });

      autoUpdater.on('update-downloaded', (info) => {
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
