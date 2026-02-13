const { ipcRenderer } = require('electron');

const networkSelect = document.getElementById('networkInterfaces');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const streamInfo = document.getElementById('stream-info');
const status = document.getElementById('status');
const routerInfoButton = document.getElementById('routerInfoButton');
const customAlert = document.getElementById('customAlert');
const closeModal = document.querySelector('.close');

let isStreaming = false;

const translations = {
    tr: {
        title: "Ekran Yayını",
        selectInterface: "Ağ Arayüzü Seçin",
        startStream: "Yayını Başlat",
        stopStream: "Yayını Durdur",
        routerSettings: "Router Ayarları",
        rtspUrl: "RTSP URL",
        webUrl: "WEB URL",
        streamStats: "Yayın İstatistikleri",
        copy: "Kopyala",
        copied: "Kopyalandı!",
        activeStream: "Aktif Yayın Var!",
        closeWarning: "Uygulamayı kapatmadan önce yayını durdurmak ister misiniz?",
        cancel: "İptal",
        stopAndClose: "Yayını Durdur ve Kapat",
        routerPortForwarding: "Router Port Yönlendirme",
        routerLogin: "Router Yönetim Paneline Giriş",
        routerLoginSteps: [
            "Tarayıcınızı açın ve adres çubuğuna router'ınızın IP adresini yazın (genellikle 192.168.1.1 veya 192.168.0.1)",
            "Kullanıcı adı ve şifrenizi girin (varsayılan olarak genellikle admin/admin)"
        ],
        portForwardingMenu: "Port Yönlendirme Menüsünü Bulun",
        portForwardingSteps: [
            "Genellikle \"Advanced Settings\", \"Gelişmiş Ayarlar\" veya \"Port Forwarding\" bölümünde bulunur",
            "Bazı router'larda \"NAT\", \"Virtual Server\" veya \"Port Mapping\" olarak da adlandırılabilir"
        ],
        addPortRules: "Port Yönlendirme Kurallarını Ekleyin",
        connectionInfo: "Bağlantı Bilgileri",
        portForwardingComplete: "Port yönlendirme işlemini tamamladıktan sonra, dışarıdan bağlanmak için:",
        externalPort: "Dış Port",
        internalPort: "İç Port",
        protocol: "Protokol",
        targetIP: "Hedef IP",
        selectInterfaceError: "Lütfen bir ağ arayüzü seçin",
        streamStarted: "Yayın başarıyla başlatıldı",
        streamStopped: "Yayın durduruldu",
        streamError: "Yayın başlatılamadı",
        streamActive: "Zaten aktif bir yayın var!",
        streamInfo: "Yayın bilgileri",
        streamDetails: "FFmpeg ekran görüntüsünü yakalıyor ve RTSP yayını yapıyor",
        streamUnexpectedClose: "MediaMTX beklenmedik şekilde kapandı",
        routerStep1: "Router Yönetim Paneline Giriş",
        routerStep2: "Port Yönlendirme Menüsünü Bulun",
        routerStep3: "Port Yönlendirme Kurallarını Ekleyin",
        routerStep4: "Bağlantı Bilgileri",
        routerStep1Desc: "Tarayıcınızı açın ve adres çubuğuna router'ınızın IP adresini yazın (genellikle 192.168.1.1 veya 192.168.0.1)",
        routerStep1Desc2: "Kullanıcı adı ve şifrenizi girin (varsayılan olarak genellikle admin/admin)",
        routerStep2Desc: "Genellikle \"Advanced Settings\", \"Gelişmiş Ayarlar\" veya \"Port Forwarding\" bölümünde bulunur",
        routerStep2Desc2: "Bazı router'larda \"NAT\", \"Virtual Server\" veya \"Port Mapping\" olarak da adlandırılabilir",
        routerStep3Desc: "Aşağıdaki port yönlendirme kurallarını ekleyin:",
        routerStep4Desc: "Port yönlendirme işlemini tamamladıktan sonra, dışarıdan bağlanmak için:",
        rtspPort: "RTSP Port (8554 TCP)",
        webRtcPort: "WebRTC Port (8889 TCP)",
        udpPort: "UDP Port (8189 UDP)",
        close: "Kapat",
        fps: "FPS",
        loading: "Yükleniyor...",
        error: "Hata",
        success: "Başarılı",
        warning: "Uyarı",
        info: "Bilgi",
        connection: "Bağlantı",
        settings: "Ayarlar",
        help: "Yardım",
        about: "Hakkında",
        exit: "Çıkış",
        minimize: "Küçült",
        maximize: "Büyüt",
        restore: "Geri Yükle"
    },
    en: {
        title: "Screen Stream",
        selectInterface: "Select Network Interface",
        startStream: "Start Stream",
        stopStream: "Stop Stream",
        routerSettings: "Router Settings",
        rtspUrl: "RTSP URL",
        webUrl: "WEB URL",
        streamStats: "Stream Statistics",
        copy: "Copy",
        copied: "Copied!",
        activeStream: "Active Stream Detected!",
        closeWarning: "Would you like to stop the stream before closing the application?",
        cancel: "Cancel",
        stopAndClose: "Stop Stream and Close",
        routerPortForwarding: "Router Port Forwarding",
        routerLogin: "Access Router Management Panel",
        routerLoginSteps: [
            "Open your browser and enter your router's IP address (usually 192.168.1.1 or 192.168.0.1)",
            "Enter your username and password (default is usually admin/admin)"
        ],
        portForwardingMenu: "Find Port Forwarding Menu",
        portForwardingSteps: [
            "Usually found under \"Advanced Settings\", \"Port Forwarding\" or similar sections",
            "May also be called \"NAT\", \"Virtual Server\" or \"Port Mapping\" on some routers"
        ],
        addPortRules: "Add Port Forwarding Rules",
        connectionInfo: "Connection Information",
        portForwardingComplete: "After completing port forwarding, use these URLs to connect from outside:",
        externalPort: "External Port",
        internalPort: "Internal Port",
        protocol: "Protocol",
        targetIP: "Target IP",
        selectInterfaceError: "Please select a network interface",
        streamStarted: "Stream started successfully",
        streamStopped: "Stream stopped",
        streamError: "Failed to start stream",
        streamActive: "There is already an active stream!",
        streamInfo: "Stream information",
        streamDetails: "FFmpeg is capturing screen and streaming via RTSP",
        streamUnexpectedClose: "MediaMTX closed unexpectedly",
        routerStep1: "Access Router Management Panel",
        routerStep2: "Find Port Forwarding Menu",
        routerStep3: "Add Port Forwarding Rules",
        routerStep4: "Connection Information",
        routerStep1Desc: "Open your browser and enter your router's IP address (usually 192.168.1.1 or 192.168.0.1)",
        routerStep1Desc2: "Enter your username and password (default is usually admin/admin)",
        routerStep2Desc: "Usually found under \"Advanced Settings\", \"Port Forwarding\" or similar sections",
        routerStep2Desc2: "May also be called \"NAT\", \"Virtual Server\" or \"Port Mapping\" on some routers",
        routerStep3Desc: "Add the following port forwarding rules:",
        routerStep4Desc: "After completing port forwarding, use these URLs to connect from outside:",
        rtspPort: "RTSP Port (8554 TCP)",
        webRtcPort: "WebRTC Port (8889 TCP)",
        udpPort: "UDP Port (8189 UDP)",
        close: "Close",
        fps: "FPS",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Info",
        connection: "Connection",
        settings: "Settings",
        help: "Help",
        about: "About",
        exit: "Exit",
        minimize: "Minimize",
        maximize: "Maximize",
        restore: "Restore"
    }
};

let currentLanguage = 'tr';

function toggleLanguage() {
    const langTr = document.querySelector('.lang-tr');
    const langEn = document.querySelector('.lang-en');

    if (currentLanguage === 'tr') {
        currentLanguage = 'en';
        langTr.style.display = 'none';
        langEn.style.display = 'block';
    } else {
        currentLanguage = 'tr';
        langTr.style.display = 'block';
        langEn.style.display = 'none';
    }

    updateLanguage();
}

function updateLanguage() {
    const lang = translations[currentLanguage];

    // Update window title
    document.querySelector('.titlebar-title').textContent = lang.title;

    // Update window control tooltips
    document.querySelector('.window-control.minimize').title = lang.minimize;
    document.querySelector('.window-control.close').title = lang.close;

    // Update all text elements
    document.querySelector('h1').textContent = lang.title;
    document.querySelector('#networkInterfaces option').textContent = lang.selectInterface;
    document.querySelector('#startButton').innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>${lang.startStream}`;
    document.querySelector('#stopButton').innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 6h12v12H6z"/></svg>${lang.stopStream}`;
    document.querySelector('#routerInfoButton').innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>${lang.routerSettings}`;

    // Update URL boxes
    document.querySelectorAll('.url-box h3')[0].innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4.5 4.5L6.5 6.5M17.5 17.5L19.5 19.5M12 2C17.5 2 22 6.5 22 12C22 17.5 17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2ZM12 5C8.7 5 6 7.7 6 11C6 14.3 8.7 17 12 17C15.3 17 18 14.3 18 11C18 7.7 15.3 5 12 5Z"/></svg>${lang.rtspUrl}`;
    document.querySelectorAll('.url-box h3')[1].innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20ZM12 7V13L16 15L15.3 16.3L10.3 13.7V7H12Z"/></svg>${lang.webUrl}`;

    // Update copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.textContent = lang.copy;
    });

    // Update FPS container
    document.querySelector('.fps-container h3').textContent = lang.streamStats;

    // Update alert content
    const alertContent = document.querySelector('.alert-content');
    if (alertContent) {
        alertContent.querySelector('h3').textContent = lang.activeStream;
        alertContent.querySelector('p').textContent = lang.closeWarning;
        alertContent.querySelector('.cancel').textContent = lang.cancel;
        alertContent.querySelector('.confirm').textContent = lang.stopAndClose;
    }

    // Update router modal content
    const routerModal = document.querySelector('.router-content');
    if (routerModal) {
        routerModal.querySelector('h2').textContent = lang.routerPortForwarding;

        // Update step headers
        const stepHeaders = routerModal.querySelectorAll('.step-header h3');
        stepHeaders[0].textContent = lang.routerStep1;
        stepHeaders[1].textContent = lang.routerStep2;
        stepHeaders[2].textContent = lang.routerStep3;
        stepHeaders[3].textContent = lang.routerStep4;

        // Update step content
        const stepContents = routerModal.querySelectorAll('.step-content');
        stepContents[0].querySelector('ul').innerHTML = `
                    <li>${lang.routerStep1Desc}</li>
                    <li>${lang.routerStep1Desc2}</li>
                `;
        stepContents[1].querySelector('ul').innerHTML = `
                    <li>${lang.routerStep2Desc}</li>
                    <li>${lang.routerStep2Desc2}</li>
                `;
        stepContents[2].querySelector('p').textContent = lang.routerStep3Desc;
        stepContents[3].querySelector('p').textContent = lang.routerStep4Desc;

        // Update port rule headers
        const portRuleHeaders = routerModal.querySelectorAll('.rule-header');
        portRuleHeaders[0].textContent = lang.rtspPort;
        portRuleHeaders[1].textContent = lang.webRtcPort;
        portRuleHeaders[2].textContent = lang.udpPort;

        // Update port rule labels
        document.querySelectorAll('.rule-item span').forEach((span, index) => {
            if (index % 2 === 0) {
                const labels = [lang.externalPort, lang.internalPort, lang.protocol, lang.targetIP];
                span.textContent = labels[Math.floor(index / 2) % 4];
            }
        });
    }

    // Update status messages
    const status = document.getElementById('status');
    if (status) {
        const statusText = status.textContent;
        if (statusText.includes('Yayın başarıyla başlatıldı')) {
            status.textContent = lang.streamStarted;
        } else if (statusText.includes('Yayın durduruldu')) {
            status.textContent = lang.streamStopped;
        } else if (statusText.includes('Yayın başlatılamadı')) {
            status.textContent = lang.streamError;
        } else if (statusText.includes('Zaten aktif bir yayın var')) {
            status.textContent = lang.streamActive;
        }
    }

    // Update port rule labels
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (lang[key]) {
            element.textContent = lang[key] + ':';
        }
    });
}

// Initialize language
document.addEventListener('DOMContentLoaded', () => {
    updateLanguage();
});

function toggleTheme() {
    const html = document.documentElement;
    const sunIcon = document.querySelector('.sun');
    const moonIcon = document.querySelector('.moon');

    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        html.setAttribute('data-theme', 'light');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

function updateStatus(message, type = 'success', title = '') {
    const statusElement = document.getElementById('status');
    const currentLang = translations[currentLanguage];

    // Varsayılan başlıkları ayarla
    const defaultTitles = {
        success: currentLang.success || 'Başarılı',
        error: currentLang.error || 'Hata',
        warning: currentLang.warning || 'Uyarı'
    };

    // HTML içeriğini oluştur
    statusElement.innerHTML = `
                <div class="status-content">
                    <div class="status-icon ${type}">
                        ${getStatusIcon(type)}
                    </div>
                    <h3>${title || defaultTitles[type]}</h3>
                    <p>${message}</p>
                    <div class="status-buttons">
                        <button class="status-button primary" onclick="closeStatus()">${currentLang.close || 'Tamam'}</button>
                    </div>
                </div>
            `;

    // Status'u göster
    statusElement.classList.add('show');
}

function getStatusIcon(type) {
    switch (type) {
        case 'success':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <path d="M22 4L12 14.01l-3-3"></path>
                    </svg>`;
        case 'error':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>`;
        case 'warning':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>`;
        default:
            return '';
    }
}

function closeStatus() {
    const statusElement = document.getElementById('status');
    statusElement.classList.remove('show');
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');

    const button = element.nextElementSibling;
    const originalText = button.textContent;
    const lang = translations[currentLanguage];
    button.textContent = lang.copied;
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

startButton.addEventListener('click', () => {
    const selectedInterface = networkSelect.value;
    const lang = translations[currentLanguage];
    if (!selectedInterface) {
        updateStatus(lang.selectInterfaceError, 'error');
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
    const lang = translations[currentLanguage];
    ipcRenderer.send('stop-stream');
    startButton.disabled = false;
    stopButton.disabled = true;
    streamInfo.style.display = 'none';
    routerInfoButton.style.display = 'none';
    isStreaming = false;
    updateStatus(lang.streamStopped);
});

ipcRenderer.on('network-interfaces', (event, interfaces) => {
    interfaces.forEach(interface => {
        const option = document.createElement('option');
        option.value = interface.address;
        option.textContent = `${interface.name} (${interface.address})`;
        networkSelect.appendChild(option);
    });
});

ipcRenderer.on('stream-started', (event, urls) => {
    const lang = translations[currentLanguage];
    document.getElementById('rtspUrl').value = urls.rtspUrl;
    document.getElementById('webUrl').value = urls.webUrl;
    streamInfo.style.display = 'grid';
    routerInfoButton.style.display = 'block';
    isStreaming = true;
    updateStatus(lang.streamStarted);

    // Router modal için IP'leri ve metinleri güncelle
    document.querySelectorAll('.port-rule .rule-item').forEach(item => {
        const label = item.querySelector('span:first-child');
        if (label) {
            const labelText = label.textContent.trim();
            switch (labelText) {
                case 'Dış Port':
                    label.textContent = lang.externalPort;
                    break;
                case 'İç Port':
                    label.textContent = lang.internalPort;
                    break;
                case 'Protokol':
                    label.textContent = lang.protocol;
                    break;
                case 'Hedef IP':
                    label.textContent = lang.targetIP;
                    break;
            }
        }
    });

    // Connection Information başlığını güncelle
    const connectionInfoTitle = document.querySelector('.router-steps h3');
    if (connectionInfoTitle) {
        connectionInfoTitle.textContent = lang.connectionInfo;
    }

    // Port yönlendirme tamamlama mesajını güncelle
    const portForwardingMessage = document.querySelector('.router-steps p');
    if (portForwardingMessage) {
        portForwardingMessage.textContent = lang.portForwardingComplete;
    }

    document.getElementById('localIpDisplay').textContent = urls.localIp;
    document.getElementById('localIpDisplay2').textContent = urls.localIp;
    document.getElementById('localIpDisplay3').textContent = urls.localIp;
    document.getElementById('externalRtspUrl').textContent = `rtsp://${urls.externalIp}:8554/screen`;
    document.getElementById('externalWebUrl').textContent = `http://${urls.externalIp}:8889/screen`;

    // Animasyon için class ekle
    setTimeout(() => {
        streamInfo.classList.add('visible');
    }, 100);
});

ipcRenderer.on('stream-error', (event, error) => {
    startButton.disabled = false;
    stopButton.disabled = true;
    streamInfo.style.display = 'none';
    routerInfoButton.style.display = 'none';
    isStreaming = false;
    updateStatus(error.message, 'error');
});

ipcRenderer.on('stream-stats', (event, stats) => {
    if (isStreaming) {
        document.getElementById('fpsValue').textContent = `${stats.fps} FPS`;
    }
});

ipcRenderer.on('show-close-warning', () => {
    const customAlert = document.getElementById('customAlert');
    const sound = document.getElementById('notificationSound');

    customAlert.style.display = 'block';
    sound.play().catch(() => { });

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

// Router modal işlemleri
routerInfoButton.addEventListener('click', () => {
    const routerModal = document.getElementById('routerModal');
    routerModal.style.display = 'block';
});

function closeRouterModal() {
    const routerModal = document.getElementById('routerModal');
    routerModal.style.display = 'none';
}

// Advanced Guide Functions
function toggleInfoGuide() {
    const modal = document.getElementById('infoGuideModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
}

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Activate button
    event.target.classList.add('active');
}

function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    if (!codeElement) return;

    const code = codeElement.textContent;

    // Modern clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            // Show success feedback
            const btn = event.target.closest('.copy-code-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
            btn.style.background = 'rgba(16, 185, 129, 0.4)';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = 'rgba(16, 185, 129, 0.2)';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('Code copied!');
        } catch (err) {
            console.error('Copy failed:', err);
        }
        document.body.removeChild(textArea);
    }
}

window.addEventListener('click', (event) => {
    const routerModal = document.getElementById('routerModal');
    const infoModal = document.getElementById('infoGuideModal');
    if (event.target === routerModal) {
        routerModal.style.display = 'none';
    }
    if (event.target === infoModal) {
        infoModal.style.display = 'none';
    }
});

// Sayfa yüklendiğinde tema kontrolü
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('.sun').style.display = 'none';
    document.querySelector('.moon').style.display = 'block';
}