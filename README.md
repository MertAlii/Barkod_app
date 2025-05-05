# Barkod Tarayıcı Uygulaması

Basit, mobil odaklı bir barkod tarama uygulaması. Taranan barkodlar Firebase Firestore veritabanında saklanır ve geçmiş taramalar görüntülenebilir.

## Demo

Canlı demo: [https://mertalii.github.io/test.github.io](https://mertalii.github.io/test.github.io)

## Özellikler

- Barkod tarama (kamera aracılığıyla)
- Ürün bilgisi girişi ve düzenleme
- Tarama geçmişi görüntüleme
- Firebase bağlantı durumu kontrolü
- Mobil uyumlu tasarım
- Çevrimdışı kullanım için yerel depolama

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/MertAlii/test.github.io.git
   cd test.github.io
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda [http://localhost:5173](http://localhost:5173) adresine gidin.

## Kullanım

1. Uygulama açıldığında "Tara" sekmesini göreceksiniz.
2. "Tarayıcıyı Başlat" butonuna tıklayarak kamerayı etkinleştirin.
3. Bir barkodu tarayın.
4. Ürün adını düzenleyebilir ve "Kaydet" butonuna tıklayabilirsiniz.
5. Tarama geçmişini "Geçmiş" sekmesinden görüntüleyebilirsiniz.
6. "Ayarlar" sekmesinden Firebase bağlantı durumunu kontrol edebilirsiniz.

## Teknolojiler

- JavaScript
- HTML5 ve CSS3
- Firebase (Firestore)
- html5-qrcode (barkod tarama kütüphanesi)
- Vite (Derleme aracı)

## Geliştirici

MertAlii - 2025
