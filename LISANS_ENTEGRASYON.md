# Lisans ve Erişim Kontrolü Entegrasyon Rehberi

Bu belge, bu projenin önceki sürümlerinde kullanılan lisanslama mantığını ve yeni bir lisanslama sistemi eklemek isteyen geliştiriciler için yol haritasını açıklar.

## 1. Mimari Genel Bakış

Uygulama **Electron.js** tabanlıdır, bu nedenle lisans kontrolü iki katmanda gerçekleştirilir:
- **Main Process (main.js)**: Sistemin kalbi. Dosya sistemi erişimi, zaman takibi ve uygulama yaşam döngüsü burada yönetilir.
- **Renderer Process (index.html, intro.html vb.)**: Kullanıcı arayüzü. Lisans durumuna göre kullanıcıyı engeller veya yönlendirir.

## 2. Zaman Geri Alma Koruması (Time Rollback Protection)

Kullanıcıların sistem saatini geri alarak lisans süresini uzatmasını engellemek için kullanılan yöntem:

### Mantık:
1. Uygulama her kapandığında veya belirli aralıklarla mevcut zaman bilgisini yerel bir dosyaya (`last_use.json`) kaydeder.
2. Uygulama bir sonraki açılışında, mevcut sistem saatini dosyada kayıtlı olan "Son Kullanım" zamanı ile karşılaştırır.
3. Eğer `Mevcut Zaman < Kayıtlı Zaman` ise, kullanıcının saati geri aldığı tespit edilir.

### Uygulama (Main Process):
```javascript
function checkTimeRollback() {
    const now = Date.now();
    const lastUse = readLastUseDate(); // Dosyadan oku
    if (now < lastUse) {
        return "ROLLBACK_DETECTED";
    }
    saveCurrentTime(now); // Dosyaya yaz
    return "OK";
}
```

## 3. Süre Sınırı (Expiry Check)

Belirli bir tarihten sonra uygulamanın çalışmasını durdurmak için:

1. **Hardcoded Tarih**: Kodun içine statik bir bitiş tarihi (`EXPIRY_ISO`) gömülür.
2. **Karşılaştırma**: Uygulama açılışında `new Date()` bu tarihle karşılaştırılır.

```javascript
const EXPIRY_DATE = new Date('2028-01-01');
if (new Date() > EXPIRY_DATE) {
    // Uygulamayı kilitle
}
```

## 4. Kullanıcı Arayüzü Entegrasyonu

Lisans kontrolü başarısız olduğunda kullanıcıyı karşılayan bir `license.html` dosyası oluşturulmalıdır. Bu sayfa:
- Kalan süreyi göstermeli.
- Hata durumunu (Süre doldu / Saat geri alındı) açıklamalı.
- Geçerli bir lisans olmadan "Devam Et" butonunu devre dışı bırakmalı.

## 5. Güvenlik Önerileri (Open Source Sonrası)

Eğer projeyi ticari olarak kullanacaksanız şu adımları eklemeniz önerilir:

1. **Remote Validation**: Lisans kontrolünü sadece yerel saatle değil, uzak bir API üzerinden yapın.
2. **Code Obfuscation**: JavaScript kodunuzu `javascript-obfuscator` gibi araçlarla karıştırarak deşifre edilmesini zorlaştırın.
3. **Machine ID**: Lisansı belirli bir bilgisayara kilitlemek için `node-machine-id` kütüphanesini kullanarak donanım kimliği alın.
4. **Asimetrik Şifreleme**: Lisans anahtarlarını RSA gibi yöntemlerle şifreleyerek manuel müdahaleyi engelleyin.

## 6. Adım Adım Entegrasyon Yol Haritası

1. `main.js` içinde `ipcMain.handle('check-license')` tanımlayın.
2. `intro.html` açıldığında bu kanalı çağırın.
3. Sonuç "INVALID" ise `window.location.href = 'license.html'` ile yönlendirin.
4. `license.html` sayfasında kullanıcıdan anahtar isteyin veya durumu gösterin.

---
*Bu proje şu anda tamamen açık kaynak ve lisanssız (ücretsiz) sürümündedir.*
