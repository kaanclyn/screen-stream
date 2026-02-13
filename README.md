# 🖥️ Ekran Yayını - Screen Broadcasting Application

<div align="center">

![Version](https://img.shields.io/badge/version-4.2.2-blue.svg)
![License](https://img.shields.io/badge/license-Open%20Source-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

**Ekranınızı bir kamera gibi paylaşın!**

Profesyonel ekran yayını ve IP kamera entegrasyonu uygulaması. Bilgisayar ekranınızı RTSP/WebRTC protokolleri ile gerçek zamanlı olarak yayınlayın.

[Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [Lisanslama](#-lisanslama-ve-geliştirme) • [Katkıda Bulunma](#-katkıda-bulunma)

---

</div>

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Gereksinimler](#-gereksinimler)
- [Kurulum](#-kurulum)
  - [1. Depoyu Klonlayın](#1-depoyu-klonlayın)
  - [2. FFmpeg Kurulumu](#2-ffmpeg-kurulumu-zorunlu)
  - [3. Bağımlılıkları Yükleyin](#3-bağımlılıkları-yükleyin)
  - [4. Uygulamayı Başlatın](#4-uygulamayı-başlatın)
- [Kullanım](#-kullanım)
- [Paketleme ve Dağıtım](#-paketleme-ve-dağıtım)
- [Lisanslama ve Geliştirme](#-lisanslama-ve-geliştirme)
- [Teknik Detaylar](#-teknik-detaylar)
- [Sorun Giderme](#-sorun-giderme)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [İletişim](#-iletişim)
- [Lisans](#-lisans)

---

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Ekran Yayını**: Bilgisayar ekranınızı gerçek zamanlı RTSP stream olarak yayınlayın
- **IP Kamera Entegrasyonu**: ONVIF uyumlu IP kameraları bağlayın ve yönetin
- **Çoklu Protokol**: RTSP ve WebRTC desteği
- **Akıllı Ağ Yönetimi**: Otomatik port yönlendirme ve ağ optimizasyonu
- **Düşük Gecikme**: Optimize edilmiş streaming altyapısı

### 🔧 Gelişmiş Özellikler
- Çoklu kamera desteği
- Kayıt ve snapshot alma
- Otomatik bağlantı yönetimi
- Modern ve responsive kullanıcı arayüzü
- Dark/Light tema desteği
- Türkçe/İngilizce dil desteği

---

## 🔧 Gereksinimler

### Sistem Gereksinimleri
- **İşletim Sistemi**: Windows 10/11 (64-bit)
- **RAM**: Minimum 4 GB (8 GB önerilir)
- **İşlemci**: Intel i3 veya üzeri
- **Disk Alanı**: 500 MB (kurulum için)

### Yazılım Gereksinimleri
- **Node.js**: v16.0.0 veya üzeri ([İndir](https://nodejs.org/))
- **npm**: v8.0.0 veya üzeri (Node.js ile birlikte gelir)
- **FFmpeg**: v4.0 veya üzeri (detaylar aşağıda)
- **Git**: (opsiyonel, klonlama için)

---

## 📦 Kurulum

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/kaanclyn/ekran-yayini.git
cd ekran-yayini
```

Ya da ZIP olarak indirip çıkartın.

---

### 2. FFmpeg Kurulumu (ZORUNLU)

FFmpeg, video akışlarını işlemek için kritik öneme sahiptir. Uygulama çalışması için **mutlaka** kurulmalıdır.

#### Adım 1: FFmpeg'i İndirin

1. [FFmpeg Resmi Sitesi](https://www.gyan.dev/ffmpeg/builds/) adresine gidin
2. **ffmpeg-master-latest-win64-gpl-shared.zip** dosyasını indirin
3. ZIP dosyasını bilgisayarınızda uygun bir konuma çıkartın

**Örnek Dizinler:**
```
C:\Users\your-pc-name\Desktop\ffmpeg-master-latest-win64-gpl-shared
```
veya
```
C:\Users\your-pc-name\library\ffmpeg-master-latest-win64-gpl-shared
```

#### Adım 2: FFmpeg PATH'ini Ayarlayın

**Önemli**: `bin` klasörünün tam yolunu not alın. Örnek:

```
C:\Users\Kaan\Desktop\ffmpeg-master-latest-win64-gpl-shared\bin
```

**Windows PATH Ekleme Adımları:**

1. **Windows Arama** > "Ortam Değişkenlerini Düzenle" yazın
2. **Sistem özellikleri** penceresinde **"Ortam Değişkenleri"** butonuna tıklayın
3. **"Sistem değişkenleri"** bölümünde **"Path"** değişkenini bulun ve **"Düzenle"** deyin
4. **"Yeni"** butonuna tıklayın
5. FFmpeg'in `bin` klasörünün tam yolunu yapıştırın:
   ```
   C:\Users\your-pc-name\Desktop\ffmpeg-master-latest-win64-gpl-shared\bin
   ```
6. **Tamam** diyerek tüm pencereleri kapatın
7. **Komut İstemi** veya **PowerShell**'i yeniden başlatın

#### Adım 3: FFmpeg Kurulumunu Doğrulayın

Yeni bir komut istemi açın ve şu komutu çalıştırın:

```bash
ffmpeg -version
```

Eğer FFmpeg bilgileri görünüyorsa kurulum başarılıdır. Aksi halde PATH ayarlarını kontrol edin.

---

### 3. Bağımlılıkları Yükleyin

Proje dizininde aşağıdaki komutu çalıştırın:

```bash
npm install
```

Bu komut aşağıdaki paketleri yükleyecektir:
- `electron` - Desktop uygulama framework
- `fluent-ffmpeg` - FFmpeg wrapper
- `node-rtsp-stream` - RTSP streaming
- `onvif` - IP kamera yönetimi
- `csv-writer` - Veri kayıt
- Ve diğer bağımlılıklar...

**Not**: Kurulum sırasında `node-gyp` hatası alırsanız:
```bash
npm install --global windows-build-tools
```

---

### 4. Uygulamayı Başlatın

#### Geliştirme Modu:
```bash
npm start
```

#### Geliştirme Modu (Hot Reload):
```bash
npm run dev
```

Uygulama başarıyla açılmalıdır! 🎉

---

## 🚀 Kullanım

### İlk Başlatma

1. **Ekran Yayını** uygulamasını başlatın
2. **Intro** ekranında "Başlat" butonuna tıklayın
3. Ana ekranda **var olan ip seçme** butonuna tıklayın
4. ip arayüzünüzü seçin
5. Cihaz kartındaki **"Yayını Başlat"** butonuna tıklayın

RTSP URL'niz:
```
rtsp://localhost:8554/screen
```

WebRTC URL'niz:
```
http://localhost:8889/screen
```

### Stream'i İzleme (RTSP)

VLC Media Player veya başka bir RTSP client ile:
```
rtsp://localhost:8554/screen
```

### Stream'i İzleme (WebRTC)

WebRTC ile izlemek için tarayıcınızda:
```
http://localhost:8889/screen
```

---

## 📦 Paketleme ve Dağıtım

Windows kurulum dosyası (.exe) oluşturmak için:

```bash
npm run build
```

Build çıktısı `dist/` klasöründe oluşacaktır:
```
dist/
  └── Ekran Yayını Setup 4.2.2.exe
```

### Build Yapılandırması

`package.json` içinde build ayarları mevcuttur:
- **NSIS** kurulum formatı
- Yönetici yetkileri gerektirir
- Desktop ve Start Menu kısayolları
- Özelleştirilebilir kurulum dizini

---

## 📜 Lisanslama ve Geliştirme

### Açık Kaynak Proje

Bu proje **tamamen açık kaynak** ve **ücretsizdir**. Ancak, kendi ürününüz için lisanslama sistemi eklemek isterseniz:

**🔐 Lisans Entegrasyon Rehberi**

Uygulamanın sağ alt köşesindeki **ℹ️ İnfo** butonuna tıklayarak detaylı **Lisans Sistemi Entegrasyon Rehberi**ne ulaşabilirsiniz.

Rehberde şunlar yer alır:
- ⏰ **Zaman Geri Alma Koruması** - Time rollback detection
- 🗓️ **Süre Kontrolü (Expiry)** - Expiration date management
- 🎨 **UI Entegrasyonu** - Renderer integration
- 🚀 **İleri Seviye Güvenlik**:
  - Remote Validation (Çevrimiçi doğrulama)
  - Code Obfuscation (Kod karartma)
  - Machine ID Lock (Donanım kilidi)
  - RSA Encryption (Şifreleme)

**Önemli**: Lisanslama sistemi eklemek isteyen geliştiriciler için tüm kod örnekleri ve implementasyon detayları uygulama içinde mevcuttur!

---

## 🔬 Teknik Detaylar

### Teknoloji Stack

#### Frontend
- **HTML5/CSS3** - Modern UI
- **JavaScript (ES6+)** - İstemci mantığı
- **Responsive Design** - Tüm ekran boyutları

#### Backend
- **Electron.js** - Desktop framework
- **Node.js** - Runtime environment
- **FFmpeg** - Video processing
- **MediaMTX** - RTSP server

#### Protokoller ve Standartlar
- **RTSP** - Real Time Streaming Protocol
- **WebRTC** - Web Real-Time Communication

### Proje Yapısı

```
ekran-yayini/
├── main.js                 # Electron ana process
├── index.html              # Ana uygulama sayfası
├── intro.html              # Giriş sayfası
├── license.html            # Lisans sayfası (referans)
├── styles.css              # Ana stiller
├── intro.css               # Intro sayfası stilleri
├── guide-styles.css        # Rehber modal stilleri
├── script.js               # İstemci JavaScript
├── stream-handler.js       # Stream yönetimi
├── renderer.js             # Renderer process
├── mediamtx.exe            # RTSP server
├── mediamtx.yml            # RTSP yapılandırma
├── package.json            # Proje bağımlılıkları
├── LISANS_ENTEGRASYON.md   # Lisanslama dokümantasyonu
└── README.md               # Bu dosya
```

### Önemli Dosyalar

- **main.js**: Electron ana process, pencere yönetimi, IPC handlers
- **stream-handler.js**: FFmpeg stream oluşturma ve yönetimi
- **renderer.js**: ip seçme arayüzü, ip arayüzünden seçilen ip'yi rtsp'ye çevirme,webRTC bağlantısı
- **mediamtx.exe**: RTSP sunucu binary'si

---

## 🛠️ Sorun Giderme

### FFmpeg Bulunamıyor

**Hata**: `Error: ffmpeg not found`

**Çözüm**:
1. FFmpeg PATH ayarını kontrol edin
2. Komut istemini yeniden başlatın
3. `ffmpeg -version` komutuyla test edin

### Port Zaten Kullanımda

**Hata**: `Port 8554 already in use`

**Çözüm**:
- Başka bir port numarası seçin (örn: 8555, 8556)
- Veya portu kullanan uygulamayı kapatın

### Electron Başlatılamıyor

**Hata**: `Electron failed to start`

**Çözüm**:
```bash
# Node modüllerini temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

### IP Kamera Bağlanamıyor

**Çözüm**:
- Kamera IP adresinin doğru olduğunu kontrol edin
- Kullanıcı adı/şifre doğru mu?
- Kamera ONVIF destekliyor mu?
- Güvenlik duvarı kamera bağlantısını engelliyor olabilir

### Stream Donuyor veya Gecikiyor

**Çözüm**:
- Ağ bağlantınızı kontrol edin
- Düşük çözünürlük kullanmayı deneyin
- MediaMTX yapılandırmasını optimize edin

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Projeye katkıda bulunmak için:

1. Repo'yu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Geliştirme Kuralları

- Modern JavaScript (ES6+) kullanın
- Kod yorumlarını Türkçe yazın
- Commit mesajlarını anlamlı tutun
- Test edin ve hata ayıklayın

---

## 💼 İletişim

### Geliştirici: **PromSoftware**

- 🌐 **Website**: [promsoftware.com.tr](https://promsoftware.com.tr)
- 💻 **GitHub**: [github.com/kaanclyn](https://github.com/kaanclyn)
- 📧 **E-posta**: info@promsoftware.com.tr

### Hakkında

**PromSoftware**, profesyonel yazılım geliştirme ve danışmanlık hizmetleri sunan bir teknoloji şirketidir. Web uygulamaları, masaüstü yazılımlar, mobil uygulamalar ve IoT çözümleri geliştirmektedir.

**Uzmanlaştığımız Alanlar:**
- Desktop Applications (Electron, .NET)
- Web Development (React, Node.js, PHP)
- Mobile Apps (React Native, Flutter)
- IoT & Embedded Systems
- Video Streaming Solutions
- Network & Security

**Diğer Projeler**: [promsoftware.com.tr](https://promsoftware.com.tr) adresinden tüm projelerimizi inceleyebilirsiniz.

---

## 📄 Lisans

Bu proje **ISC Lisansı** ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

```
Copyright (c) 2021-2026 PromSoftware

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

---

## 🌟 Teşekkürler

Bu projeyi kullandığınız için teşekkürler! Projeye ⭐ vermeyi unutmayın.

**Özel Teşekkürler:**
- FFmpeg ekibine
- Electron.js topluluğuna
- MediaMTX geliştiricilerine
- Tüm katkıda bulunanlara

---

<div align="center">

**Made with ❤️ by [PromSoftware](https://promsoftware.com.tr)**

**v4.2.2** | © 2021-2026 PromSoftware | Tüm Hakları Saklıdır

[⬆ Başa Dön](#-ekran-yayını---screen-broadcasting-application)

</div>
