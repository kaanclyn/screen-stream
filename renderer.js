const { ipcRenderer } = require('electron');

const networkSelect = document.getElementById('networkInterfaces');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const streamInfo = document.getElementById('stream-info');
const status = document.getElementById('status');

let isStreaming = false;
let fpsInterval = 0;
let lastFpsUpdate = 0;

// Theme handling
function toggleTheme() {
    document.documentElement.classList.toggle('dark-theme');
}

// Status update function
function updateStatus(message, type = 'success') {
    const statusElement = document.getElementById('status');
    statusElement.className = 'status ' + type;
    statusElement.innerHTML = `<span class="pulse" style="background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}"></span>${message}`;
}

// Stream control
startButton.addEventListener('click', () => {
    if (isStreaming) {
        // Yayın zaten aktifse uyarı ver
        updateStatus('Zaten aktif bir yayın var!', 'error');
        
        // Butonu görsel olarak devre dışı bırak
        startButton.style.opacity = '0.5';
        startButton.style.cursor = 'not-allowed';
        
        // 2 saniye sonra normal görünüme dön
        setTimeout(() => {
            startButton.style.opacity = '1';
            startButton.style.cursor = 'pointer';
        }, 2000);
        
        return; // Fonksiyonu burada sonlandır
    }

    const selectedInterface = networkSelect.value;
    if (!selectedInterface) {
        updateStatus('Lütfen bir ağ arayüzü seçin', 'error');
        networkSelect.style.border = '2px solid var(--error-color)';
        setTimeout(() => {
            networkSelect.style.border = '1px solid var(--border-color)';
        }, 2000);
        return;
    }

    ipcRenderer.send('start-stream', selectedInterface);
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    ipcRenderer.send('stop-stream');
    startButton.disabled = false;
    stopButton.disabled = true;
    streamInfo.style.display = 'none';
    isStreaming = false;
    updateStatus('Yayın durduruldu');
});

// Network interface handling
ipcRenderer.on('network-interfaces', (event, interfaces) => {
    interfaces.forEach(interface => {
        const option = document.createElement('option');
        option.value = interface.address;
        option.textContent = `${interface.name} (${interface.address})`;
        networkSelect.appendChild(option);
    });
});

// Stream status handling
ipcRenderer.on('stream-started', (event, urls) => {
    document.getElementById('rtspUrl').value = urls.rtspUrl;
    document.getElementById('webUrl').value = urls.webUrl;
    streamInfo.style.display = 'grid';
    isStreaming = true;
    updateStatus('Yayın başarıyla başlatıldı');

    // Başlat butonunu devre dışı bırak
    startButton.disabled = true;
    startButton.style.opacity = '0.5';
    startButton.style.cursor = 'not-allowed';
    
    // Router modal için IP'leri güncelle
    document.getElementById('localIpDisplay').textContent = urls.localIp;
    document.getElementById('localIpDisplay2').textContent = urls.localIp;
    document.getElementById('localIpDisplay3').textContent = urls.localIp;
    document.getElementById('externalRtspUrl').textContent = `rtsp://${urls.externalIp}:8554/screen`;
    document.getElementById('externalWebUrl').textContent = `http://${urls.externalIp}:8889/screen`;
});

ipcRenderer.on('stream-error', (event, error) => {
    startButton.disabled = false;
    stopButton.disabled = true;
    streamInfo.style.display = 'none';
    isStreaming = false;
    updateStatus(error.message, 'error');
});

// FPS counter
ipcRenderer.on('stream-stats', (event, stats) => {
    if (isStreaming) {
        document.getElementById('fpsValue').textContent = `${stats.fps} FPS`;
    }
});

// Copy to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    
    const button = element.nextElementSibling;
    const originalText = button.textContent;
    button.textContent = 'Kopyalandı!';
    button.style.background = 'var(--success-color)';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

// Close warning handling
ipcRenderer.on('show-close-warning', () => {
    const customAlert = document.getElementById('customAlert');
    const sound = document.getElementById('notificationSound');
    
    customAlert.style.display = 'block';
    sound.play().catch(() => {});

    const confirmBtn = customAlert.querySelector('.confirm');
    const cancelBtn = customAlert.querySelector('.cancel');

    confirmBtn.onclick = () => {
        ipcRenderer.send('close-confirmed');
        customAlert.style.display = 'none';
    };

    cancelBtn.onclick = () => {
        ipcRenderer.send('close-cancelled');
        customAlert.style.display = 'none';
    };
});

// Router modal handling
function showRouterModal() {
    document.getElementById('routerModal').style.display = 'block';
}

function closeRouterModal() {
    document.getElementById('routerModal').style.display = 'none';
}

// Initialize
ipcRenderer.send('get-network-interfaces'); 
 