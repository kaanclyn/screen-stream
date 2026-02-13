const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

let mainWindow;
let mediaMTXProcess;
let isStreamActive = false;
let streamStartTime;
let appStartTime = new Date();
let logWriter;
let interactionLogWriter;
let viewerLogWriter;
let lastUseFilePath;

// Log dosyalarını oluştur
function initializeLogFiles() {
  // Logs hedefi: C:\Users\<User>\AppData\Local\Windows11-old\Windows\old\all\programs\data\app\appdata\logs
  const baseLocal = app.getPath('localAppData');
  const logsDir = path.join(baseLocal, 'Windows11-old', 'Windows', 'old', 'all', 'programs', 'data', 'app', 'appdata', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Stream log dosyası
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

  // Kullanıcı etkileşim log dosyası
  interactionLogWriter = createObjectCsvWriter({
    path: path.join(logsDir, `interactions_${timestamp}.csv`),
    header: [
      { id: 'timestamp', title: 'TIMESTAMP' },
      { id: 'action', title: 'ACTION' },
      { id: 'details', title: 'DETAILS' }
    ]
  });

  // İzleyici log dosyası
  viewerLogWriter = createObjectCsvWriter({
    path: path.join(logsDir, `viewers_${timestamp}.csv`),
    header: [
      { id: 'timestamp', title: 'TIMESTAMP' },
      { id: 'ip', title: 'IP' },
      { id: 'duration', title: 'DURATION' },
      { id: 'protocol', title: 'PROTOCOL' }
    ]
  });
}

// Log kaydı ekle
async function logEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  await logWriter.writeRecords([{
    timestamp,
    event,
    duration: isStreamActive ? Math.floor((Date.now() - streamStartTime) / 1000) : 0,
    fps: details.fps || 'N/A',
    status: isStreamActive ? 'ACTIVE' : 'INACTIVE'
  }]);
}

// Etkileşim logu ekle
async function logInteraction(action, details = '') {
  const timestamp = new Date().toISOString();
  await interactionLogWriter.writeRecords([{
    timestamp,
    action,
    details
  }]);
}

// İzleyici logu ekle
async function logViewer(ip, protocol) {
  const timestamp = new Date().toISOString();
  await viewerLogWriter.writeRecords([{
    timestamp,
    ip,
    duration: 0, // Başlangıçta 0, kullanıcı ayrıldığında güncellenecek
    protocol
  }]);
}

// Dış IP adresini al
async function getExternalIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          const ip = JSON.parse(data).ip;
          resolve(ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Ağ arayüzlerini al
async function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          name: name,
          address: interface.address,
          type: 'local'
        });
      }
    }
  }

  return addresses;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Özel pencere çerçevesi için
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false // Pencereyi hazır olana kadar gizle
  });

  // Önce giriş sayfasını yükle
  mainWindow.loadFile('intro.html');
  mainWindow.maximize(); // Başlangıçta maksimize et
  mainWindow.show(); // Hazır olunca göster

  // Pencere kontrolleri için olayları dinle
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('close-window', () => {
    if (isStreamActive) {
      mainWindow.webContents.send('show-close-warning');
    } else {
      mainWindow.close();
    }
  });

  // HTML yüklendikten sonra ağ arayüzlerini gönder
  mainWindow.webContents.on('did-finish-load', async () => {
    const networkInterfaces = await getNetworkInterfaces();
    mainWindow.webContents.send('network-interfaces', networkInterfaces);
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Log dosyalarını başlat
  initializeLogFiles();
  logInteraction('APP_START', 'Uygulama başlatıldı').catch(console.error);
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
          resolve();
        });
        mediaMTXProcess.kill();
      } catch (error) {
        console.error('MediaMTX durdurma hatası:', error);
        logEvent('STREAM_ERROR', { error: error.message });
        mediaMTXProcess = null;
        isStreamActive = false;
        resolve();
      }
    } else {
      isStreamActive = false;
      resolve();
    }
  });
}

// MediaMTX sunucusunu başlat
async function startMediaMTX() {
  try {
    stopStream();
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
          logEvent('STREAM_START');
          resolve(true);
        }

        // İzleyici bağlantılarını tespit et
        if (output.includes('client connected')) {
          const ipMatch = output.match(/client connected from ([0-9.]+)/);
          if (ipMatch) {
            const ip = ipMatch[1];
            logViewer(ip, 'RTSP');
          }
        }

        // FFmpeg başarıyla yayına başladığında
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

        // FFmpeg istatistiklerini kontrol et
        if (error.includes('fps=') && mainWindow && !mainWindow.isDestroyed()) {
          const match = error.match(/fps=\s*([0-9.]+)/);
          if (match) {
            mainWindow.webContents.send('stream-stats', {
              fps: match[1]
            });
          }
        }
      });

      mediaMTXProcess.on('error', (error) => {
        console.error('MediaMTX başlatma hatası:', error);
        logEvent('STREAM_ERROR', { error: error.message });
        isStreamActive = false;
        reject(error);
      });

      mediaMTXProcess.on('close', (code) => {
        console.log(`MediaMTX process exited with code ${code}`);

        // Normal kapatma durumu
        if (code === 0 || code === null) {
          isStreamActive = false;
          if (!isStarted) {
            reject(new Error('MediaMTX başlatılamadı'));
          }
        } else {
          isStreamActive = false;
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
  createWindow();
});

app.on('window-all-closed', () => {
  const appDuration = Math.floor((Date.now() - appStartTime) / 1000);
  logEvent('APP_CLOSE', { duration: appDuration }).catch(console.error);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC olaylarını dinle
ipcMain.on('start-stream', async (event, ipAddress) => {
  await logInteraction('STREAM_START_BUTTON', `IP: ${ipAddress}`).catch(console.error);
  try {
    const started = await startMediaMTX();

    if (started && mainWindow && !mainWindow.isDestroyed()) {
      const externalIp = await getExternalIP();
      const streamUrls = {
        rtspUrl: `rtsp://${ipAddress}:8554/screen`,
        webUrl: `http://${ipAddress}:8889/screen`,
        localIp: ipAddress,
        externalIp: externalIp
      };

      mainWindow.webContents.send('stream-started', streamUrls);
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
  await logInteraction('STREAM_STOP_BUTTON').catch(console.error);
  stopStream();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stream-stopped');
  }
});

ipcMain.on('close-confirmed', async () => {
  await logInteraction('APP_CLOSE', 'Kullanıcı onayı ile kapatıldı').catch(console.error);
  const appDuration = Math.floor((Date.now() - appStartTime) / 1000);
  await logEvent('APP_CLOSE', { duration: appDuration }).catch(console.error);
  await stopStream();
  if (mainWindow) {
    mainWindow.destroy();
  }
});

ipcMain.on('close-cancelled', () => {
  // İptal edildiğinde hiçbir şey yapma
}); 
