const { ipcRenderer, shell, clipboard } = require('electron');

let appVersion = '1.0.4';
try {
  const syncVer = ipcRenderer.sendSync('get-app-version-sync');
  if (syncVer) {
    appVersion = syncVer;
  }
} catch (e) {
  try {
    appVersion = require('./package.json').version;
  } catch (err) {}
}

window.electronAPI = {
  isElectron: true,
  appVersion: appVersion,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (options) => ipcRenderer.invoke('print-silent', options),
  selectDbFile: () => ipcRenderer.invoke('select-db-file'),
  openExternal: (url) => shell.openExternal(url),
  copyToClipboard: (filePath) => clipboard.writeText(filePath),
  openPath: (filePath) => shell.openPath(filePath),
  showItemInFolder: (filePath) => shell.showItemInFolder(filePath),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdateNow: () => ipcRenderer.invoke('install-update-now'),
  onAutoUpdaterEvent: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('auto-updater-event', handler);
    return () => ipcRenderer.removeListener('auto-updater-event', handler);
  }
};
