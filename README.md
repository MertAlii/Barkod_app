# Barkod Tarayıcı Uygulaması

Basit, mobil odaklı bir barkod tarama uygulaması. Taranan barkodlar Firebase Firestore veritabanında saklanır ve geçmiş taramalar görüntülenebilir.

## Özellikler

- Barkod tarama (kamera aracılığıyla)
- Ürün bilgisi girişi ve düzenleme
- Tarama geçmişi görüntüleme
- Firebase bağlantı durumu kontrolü
- Mobil uyumlu tasarım

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/MertAlii/barkod-app.git
   cd barkod-app
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

- TypeScript
- HTML5 ve CSS3
- Firebase (Firestore)
- html5-qrcode (barkod tarama kütüphanesi)

## Geliştirici

MertAlii - 2025 