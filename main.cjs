const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
// 1. استيراد مكتبة التحديث التلقائي
const { autoUpdater } = require('electron-updater');

let mainWindow;

// تكوين خيارات التحديث: التحميل التلقائي فور العثور عليه في الخلفية
autoUpdater.autoDownload = true;

// نظام القفل: التأكد من عدم فتح أكثر من نسخة من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // إذا حاول المستخدم فتح نسخة ثانية، نركز على النافذة المفتوحة حالياً
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const isDev = !app.isPackaged;
    if (isDev) {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      process.env.APP_ROOT = __dirname;
      process.env.NODE_ENV = 'production';
      
      const TARGET_PORT = 42405;
      process.env.PORT = TARGET_PORT;
      
      try {
        require(path.join(__dirname, 'dist', 'server.cjs'));
      } catch (e) {
        const os = require('os');
        fs.writeFileSync(path.join(os.homedir(), 'Desktop', 'electron_error.txt'), e.toString() + "\n" + e.stack);
      }
      
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:' + TARGET_PORT).catch(err => {
          console.error("Failed to load server window:", err);
          mainWindow.webContents.executeJavaScript(`document.body.innerHTML = "<pre>Failed to load server window: " + ${JSON.stringify(err.message)} + "</pre>";`);
        });
      }, 1500);
    }
    Menu.setApplicationMenu(null);
  }

  app.whenReady().then(() => {
    createWindow();

    // 2. فحص وجود تحديثات بمجرد تشغيل التطبيق وجاهزيته
    // يفضل التأكد من أن التطبيق في وضع الإنتاج وليس التطوير
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    ipcMain.handle('get-printers', async () => {
      try {
        return await mainWindow.webContents.getPrintersAsync();
      } catch (err) {
        return [];
      }
    });

    ipcMain.handle('print-silent', async (event, options) => {
      return new Promise((resolve) => {
        const printOptions = {
          silent: true,
          deviceName: options.printerName,
          copies: options.copies || 1,
          margins: { marginType: 'none' },
        };
        
        if (options.printMode === 'roll_gap' && options.width && options.height) {
          printOptions.pageSize = { width: options.width * 1000, height: options.height * 1000 };
        } else if (options.printMode === 'sheet' && options.paperWidth && options.paperHeight) {
          let pWidth = options.paperWidth;
          let pHeight = options.paperHeight;
          if (options.orientation === 'landscape' && pWidth < pHeight) {
            pWidth = options.paperHeight;
            pHeight = options.paperWidth;
          } else if (options.orientation === 'portrait' && pWidth > pHeight) {
            pWidth = options.paperHeight;
            pHeight = options.paperWidth;
          }
          printOptions.pageSize = { width: pWidth * 1000, height: pHeight * 1000 };
        }

        event.sender.print(printOptions, (success, failureReason) => {
          if (success) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: failureReason });
          }
        });
      });
    });

    ipcMain.handle('select-db-file', async () => {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'SQLite Databases', extensions: ['db', 'sqlite', 'sqlite3'] }]
      });
      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    ipcMain.on('get-app-version-sync', (event) => {
      event.returnValue = app.getVersion();
    });

    ipcMain.handle('get-app-version', async () => {
      return app.getVersion();
    });

    // ربط أحداث التحديث التلقائي مع واجهة المستخدم
    function sendUpdateStatus(status, data) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('auto-updater-event', { status, data });
      }
    }

    autoUpdater.on('checking-for-update', () => {
      sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      sendUpdateStatus('available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      sendUpdateStatus('up-to-date', info);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      sendUpdateStatus('downloading', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      sendUpdateStatus('downloaded', info);
    });

    autoUpdater.on('error', (err) => {
      sendUpdateStatus('error', err == null ? 'Unknown error' : (err.message || err.toString()));
    });

    ipcMain.handle('check-for-updates', async () => {
      if (app.isPackaged) {
        try {
          const res = await autoUpdater.checkForUpdates();
          return { success: true, updateInfo: res?.updateInfo };
        } catch (e) {
          return { success: false, error: e.message };
        }
      } else {
        return { success: true, isDev: true, message: 'التطبيق يعمل في بيئة التطوير' };
      }
    });

    ipcMain.handle('install-update-now', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
