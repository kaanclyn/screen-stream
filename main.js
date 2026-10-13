const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

let mainWindow;
let tray = null;
let mediaMTXProcess;
let isStreamActive = false;
let isQuitting = false;
let streamStartTime;
let appStartTime = new Date();
let logWriter;
let interactionLogWriter;
let viewerLogWriter;

function resolveLocalAppData() {
  try {
    return app.getPath('localAppData');
  } catch (_) {
    // Electron bazen yol çözümleyemez (özel karakterli dizinler vb.)
  }
  if (process.env.LOCALAPPDATA) {
    return process.env.LOCALAPPDATA;
  }
  return path.join(os.homedir(), 'AppData', 'Local');
}

function initializeLogFiles() {
  try {
    const baseLocal = resolveLocalAppData();
    const logsDir = path.join(
      baseLocal,
      'Windows11-old',
      'Windows',
      'old',
      'all',
      'programs',
      'data',
      'app',
      'appdata',
      'logs'
    );

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    logWriter = createObjectCsvWriter({
      path: path.join(logsDir, `stream_log_${timestamp}.csv`),
      header: [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'event', title: 'EVENT' },
        { id: 'duration', title: 'DURATION' },
        { id: 'fps', title: 'FPS' },
        { id: 'status', title: 'STATUS' }
      ]
    });

    interactionLogWriter = createObjectCsvWriter({
      path: path.join(logsDir, `interactions_${timestamp}.csv`),
      header: [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'action', title: 'ACTION' },
        { id: 'details', title: 'DETAILS' }
      ]
    });

    viewerLogWriter = createObjectCsvWriter({
      path: path.join(logsDir, `viewers_${timestamp}.csv`),
      header: [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'ip', title: 'IP' },
        { id: 'duration', title: 'DURATION' },
        { id: 'protocol', title: 'PROTOCOL' }
      ]
    });
  } catch (error) {
    console.error('Log dosyaları oluşturulamadı:', error.message);
    logWriter = null;
    interactionLogWriter = null;
    viewerLogWriter = null;
  }
}

async function logEvent(event, details = {}) {
  if (!logWriter) return;
  try {
    await logWriter.writeRecords([{
      timestamp: new Date().toISOString(),
      event,
      duration: isStreamActive ? Math.floor((Date.now() - streamStartTime) / 1000) : 0,
      fps: details.fps || 'N/A',
      status: isStreamActive ? 'ACTIVE' : 'INACTIVE'
    }]);
  } catch (error) {
    console.error('logEvent hatası:', error.message);
  }
}

async function logInteraction(action, details = '') {
  if (!interactionLogWriter) return;
  try {
    await interactionLogWriter.writeRecords([{
      timestamp: new Date().toISOString(),
      action,
      details
    }]);
  } catch (error) {
    console.error('logInteraction hatası:', error.message);
  }
}

async function logViewer(ip, protocol) {
  if (!viewerLogWriter) return;
  try {
    await viewerLogWriter.writeRecords([{
      timestamp: new Date().toISOString(),
      ip,
      duration: 0,
      protocol
    }]);
  } catch (error) {
    console.error('logViewer hatası:', error.message);
  }
}

async function getExternalIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          resolve(JSON.parse(data).ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
          type: 'local'
        });
      }
    }
  }

  return addresses;
}

function getTrayIcon() {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createEmpty();
}

function createTray() {
  if (tray) return;

  tray = new Tray(getTrayIcon());
  tray.setToolTip('Ekran Yayını');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Göster',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: isStreamActive ? 'Yayın aktif' : 'Yayın kapalı',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: async () => {
        isQuitting = true;
        await logInteraction('APP_QUIT', 'Sistem tepsisinden çıkış');
        const appDuration = Math.floor((Date.now() - appStartTime) / 1000);
        await logEvent('APP_CLOSE', { duration: appDuration });
        await stopStream();
        if (tray) {
          tray.destroy();
          tray = null;
        }
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function refreshTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Göster',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: isStreamActive ? '● Yayın aktif' : '○ Yayın kapalı',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: async () => {
        isQuitting = true;
        await logInteraction('APP_QUIT', 'Sistem tepsisinden çıkış');
        const appDuration = Math.floor((Date.now() - appStartTime) / 1000);
        await logEvent('APP_CLOSE', { duration: appDuration });
        await stopStream();
        if (tray) {
          tray.destroy();
          tray = null;
        }
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(isStreamActive ? 'Ekran Yayını — Yayın aktif' : 'Ekran Yayını');
}

function hideToTray() {
  if (!mainWindow) return;
  createTray();
  refreshTrayMenu();
  mainWindow.hide();
  if (tray && process.platform === 'win32') {
    try {
      tray.displayBalloon({
        title: 'Ekran Yayını',
        content: 'Uygulama arka planda çalışmaya devam ediyor. Tamamen kapatmak için tepsi menüsünden Çıkış seçin.'
      });
    } catch (_) {
      // Balloon desteklenmeyebilir
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });

  mainWindow.loadFile('intro.html');
  mainWindow.maximize();
  mainWindow.show();

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideToTray();
    }
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    const networkInterfaces = await getNetworkInterfaces();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('network-interfaces', networkInterfaces);
    }
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function stopStream() {
  return new Promise((resolve) => {
    if (mediaMTXProcess) {
      try {
        const streamDuration = Math.floor((Date.now() - streamStartTime) / 1000);
        logEvent('STREAM_STOP', { duration: streamDuration });

        mediaMTXProcess.on('close', () => {
          mediaMTXProcess = null;
          isStreamActive = false;
          refreshTrayMenu();
          resolve();
        });
        mediaMTXProcess.kill();
      } catch (error) {
        console.error('MediaMTX durdurma hatası:', error);
        logEvent('STREAM_ERROR', { error: error.message });
        mediaMTXProcess = null;
        isStreamActive = false;
        refreshTrayMenu();
        resolve();
      }
    } else {
      isStreamActive = false;
      refreshTrayMenu();
      resolve();
    }
  });
}

async function startMediaMTX() {
  try {
    await stopStream();
    streamStartTime = Date.now();

    return new Promise((resolve, reject) => {
      mediaMTXProcess = spawn('./mediamtx.exe', ['mediamtx.yml'], {
        stdio: 'pipe'
      });

      let isStarted = false;
      let errorOutput = '';

      mediaMTXProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`MediaMTX stdout: ${output}`);

        if (output.includes('listener opened on :8554')) {
          isStarted = true;
          isStreamActive = true;
          refreshTrayMenu();
          logEvent('STREAM_START');
          resolve(true);
        }

        if (output.includes('client connected')) {
          const ipMatch = output.match(/client connected from ([0-9.]+)/);
          if (ipMatch) {
            logViewer(ipMatch[1], 'RTSP');
          }
        }

        if (output.includes('is publishing to path')) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('stream-info', {
              message: 'Yayın başarıyla başlatıldı',
              details: 'FFmpeg ekran görüntüsünü yakalıyor ve RTSP yayını yapıyor'
            });
          }
        }
      });

      mediaMTXProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`MediaMTX stderr: ${error}`);
        errorOutput += error;

        if (error.includes('fps=') && mainWindow && !mainWindow.isDestroyed()) {
          const match = error.match(/fps=\s*([0-9.]+)/);
          if (match) {
            mainWindow.webContents.send('stream-stats', { fps: match[1] });
          }
        }
      });

      mediaMTXProcess.on('error', (error) => {
        console.error('MediaMTX başlatma hatası:', error);
        logEvent('STREAM_ERROR', { error: error.message });
        isStreamActive = false;
        refreshTrayMenu();
        reject(error);
      });

      mediaMTXProcess.on('close', (code) => {
        console.log(`MediaMTX process exited with code ${code}`);

        if (code === 0 || code === null) {
          isStreamActive = false;
          refreshTrayMenu();
          if (!isStarted) {
            reject(new Error('MediaMTX başlatılamadı'));
          }
        } else {
          isStreamActive = false;
          refreshTrayMenu();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('stream-error', {
              message: 'MediaMTX beklenmedik şekilde kapandı',
              details: errorOutput
            });
          }
        }
      });

      setTimeout(() => {
        if (!isStarted) {
          reject(new Error('MediaMTX başlatma zaman aşımı'));
        }
      }, 5000);
    });
  } catch (error) {
    console.error('MediaMTX başlatma hatası:', error);
    logEvent('STREAM_ERROR', { error: error.message });
    return false;
  }
}

app.whenReady().then(() => {
  initializeLogFiles();
  createWindow();
  createTray();
  logInteraction('APP_START', 'Uygulama başlatıldı').catch(console.error);
});

app.on('window-all-closed', (e) => {
  // X ile kapanınca arka planda devam et; gerçek çıkış tray'den
  if (!isQuitting) {
    e.preventDefault();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
  hideToTray();
});

ipcMain.on('start-stream', async (event, ipAddress) => {
  await logInteraction('STREAM_START_BUTTON', `IP: ${ipAddress}`);
  try {
    const started = await startMediaMTX();

    if (started && mainWindow && !mainWindow.isDestroyed()) {
      let externalIp = '';
      try {
        externalIp = await getExternalIP();
      } catch (_) {
        externalIp = 'N/A';
      }

      mainWindow.webContents.send('stream-started', {
        rtspUrl: `rtsp://${ipAddress}:8554/screen`,
        webUrl: `http://${ipAddress}:8889/screen`,
        localIp: ipAddress,
        externalIp
      });
    }
  } catch (error) {
    console.error('Yayın başlatma hatası:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('stream-error', {
        message: 'Yayın başlatılamadı',
        details: error.message
      });
    }
  }
});

ipcMain.on('stop-stream', async () => {
  await logInteraction('STREAM_STOP_BUTTON');
  await stopStream();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stream-stopped');
  }
});

ipcMain.on('close-confirmed', async () => {
  isQuitting = true;
  await logInteraction('APP_CLOSE', 'Kullanıcı onayı ile kapatıldı');
  const appDuration = Math.floor((Date.now() - appStartTime) / 1000);
  await logEvent('APP_CLOSE', { duration: appDuration });
  await stopStream();
  if (tray) {
    tray.destroy();
    tray = null;
  }
  if (mainWindow) {
    mainWindow.destroy();
  }
  app.quit();
});

ipcMain.on('close-cancelled', () => {
  // no-op
});
