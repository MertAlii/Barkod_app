import './style.css';
import { Html5Qrcode } from 'html5-qrcode';
import { db, checkFirebaseConnection } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, limit } from 'firebase/firestore';

// HTML elementlerini seçme
const appElement = document.getElementById('app');
const scannerTab = document.getElementById('scannerTab');
const historyTab = document.getElementById('historyTab');
const settingsTab = document.getElementById('settingsTab');

// Uygulama durumu
let currentTab = 'scanner';
let scanner = null;
let isScanning = false;
let firebaseConnected = false;

// Temel arayüz yapılandırması
const setupUI = async () => {
  console.log('Uygulama başlatılıyor...');
  
  try {
    // Firebase bağlantısını kontrol et
    firebaseConnected = await checkFirebaseConnection();
    console.log('Firebase bağlantısı:', firebaseConnected ? 'Başarılı' : 'Başarısız');

    // Sekme işaretlemek için olay dinleyicileri
    scannerTab.addEventListener('click', () => switchTab('scanner'));
    historyTab.addEventListener('click', () => switchTab('history'));
    settingsTab.addEventListener('click', () => switchTab('settings'));

    // Varsayılan sekme olarak tarayıcıyı göster
    switchTab('scanner');
  } catch (error) {
    console.error('Uygulama başlatma hatası:', error);
    appElement.innerHTML = `
      <div class="container">
        <div class="card">
          <div class="alert alert-danger">
            <p>Uygulama başlatma hatası!</p>
            <p>${error.message}</p>
          </div>
        </div>
      </div>
    `;
  }
};

// Sekme değiştirme
const switchTab = (tab) => {
  console.log('Sekme değiştiriliyor:', tab);
  
  // Önceki sekmeyi temizle
  if (currentTab === 'scanner' && isScanning && scanner) {
    scanner.stop();
    isScanning = false;
  }

  // Aktif sekmeyi güncelle
  currentTab = tab;
  
  // Menü sekmelerini güncelle
  scannerTab.classList.toggle('active', tab === 'scanner');
  historyTab.classList.toggle('active', tab === 'history');
  settingsTab.classList.toggle('active', tab === 'settings');
  
  // İçeriği güncelle
  switch (tab) {
    case 'scanner':
      renderScannerTab();
      break;
    case 'history':
      renderHistoryTab();
      break;
    case 'settings':
      renderSettingsTab();
      break;
  }
};

// Tarayıcı sekmesini render et
const renderScannerTab = () => {
  console.log('Tarayıcı sekmesi yükleniyor...');
  
  appElement.innerHTML = `
    <div class="container">
      <h1>Barkod Tarayıcı</h1>
      <div class="scanner-container">
        <div class="card">
          <div id="reader"></div>
          <div id="scanResult" style="display: none;" class="alert alert-success">
            <strong id="scannedBarcode"></strong>
            <div id="productInfo"></div>
          </div>
          <div class="form-group" id="productNameContainer" style="display: none; margin-top: 1rem;">
            <label for="productName" class="form-label">Ürün Adı:</label>
            <input type="text" id="productName" class="form-control">
          </div>
          <div id="scanControls" style="margin-top: 1rem;">
            <button id="startButton" class="btn btn-success" style="width: 100%;">Tarayıcıyı Başlat</button>
            <button id="stopButton" class="btn btn-danger" style="width: 100%; display: none;">Tarayıcıyı Durdur</button>
            <button id="saveButton" class="btn" style="width: 100%; margin-top: 0.5rem; display: none;">Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Butonları seç
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const saveButton = document.getElementById('saveButton');
  
  // Tarayıcıyı başlatma
  startButton.addEventListener('click', () => {
    if (!firebaseConnected) {
      console.warn('Firebase bağlantısı yok. Kayıt yapılamayabilir!');
      const useAnyway = confirm('Firebase bağlantısı yok! Taramalar kaydedilemeyebilir. Yine de devam etmek istiyor musunuz?');
      if (!useAnyway) {
        return;
      }
    }
    
    startScanner();
    startButton.style.display = 'none';
    stopButton.style.display = 'block';
  });
  
  // Tarayıcıyı durdurma
  stopButton.addEventListener('click', () => {
    stopScanner();
    stopButton.style.display = 'none';
    startButton.style.display = 'block';
  });
  
  // Tarama sonucunu kaydetme
  saveButton.addEventListener('click', saveScanResult);
};

// Tarayıcıyı başlatma
const startScanner = () => {
  console.log('Tarayıcı başlatılıyor...');
  
  const readerElement = document.getElementById('reader');
  const scanResultElement = document.getElementById('scanResult');
  const scannedBarcodeElement = document.getElementById('scannedBarcode');
  const productInfoElement = document.getElementById('productInfo');
  const productNameContainer = document.getElementById('productNameContainer');
  const saveButton = document.getElementById('saveButton');
  
  // Sonuçları gizle
  scanResultElement.style.display = 'none';
  productNameContainer.style.display = 'none';
  saveButton.style.display = 'none';
  
  try {
    // Scanner oluştur
    console.log('Html5Qrcode başlatılıyor...');
    scanner = new Html5Qrcode('reader');
    console.log('Html5Qrcode başlatıldı:', scanner);
    
    // Kamera yapılandırma
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Kamera cihazlarını listele
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        console.log('Kameralar bulundu:', devices);
        // Taramayı başlat
        scanner.start(
          { facingMode: "environment" }, // Mobil cihazlarda arka kamerayı kullan
          config,
          (decodedText) => {
            // Tarama başarılı olduğunda
            console.log('Barkod tarandı:', decodedText);
            isScanning = false;
            scanner?.stop();
            
            // Tarama sonuçlarını göster
            scanResultElement.style.display = 'block';
            scannedBarcodeElement.textContent = `Barkod: ${decodedText}`;
            
            // Daha önce kaydedilmiş ürünleri kontrol et
            checkExistingProduct(decodedText).then(existingProduct => {
              let productName = 'Bilinmeyen Ürün';
              
              if (existingProduct) {
                // Daha önce kaydedilmiş bir ürün bulundu
                productName = existingProduct.productName;
                productInfoElement.textContent = `Ürün: ${productName} (Daha önce kaydedilmiş)`;
              } else {
                // Basit ürün bilgisi - gerçekte bir API veya veritabanından sorgulayabilirsiniz
                if (decodedText.startsWith('200')) {
                  productName = 'Kola';
                } else if (decodedText.startsWith('400')) {
                  productName = 'Su';
                } else if (decodedText.startsWith('978')) {
                  productName = 'Kitap';
                }
                
                productInfoElement.textContent = `Ürün: ${productName}`;
              }
              
              // Ürün adı giriş alanını göster
              const productNameInput = document.getElementById('productName');
              productNameInput.value = productName;
              productNameContainer.style.display = 'block';
              
              // Kaydet butonunu göster
              saveButton.style.display = 'block';
            });
            
            // Stop butonunu gizle, start butonunu göster
            const stopButton = document.getElementById('stopButton');
            const startButton = document.getElementById('startButton');
            stopButton.style.display = 'none';
            startButton.style.display = 'block';
          },
          (errorMessage) => {
            // Hata durumunda
            console.error('Tarama hatası:', errorMessage);
          }
        ).catch((err) => {
          console.error(`Tarayıcı başlatma hatası:`, err);
          alert('Kameraya erişim sağlanamadı! Kamera izinlerini kontrol edin veya izin verildiğinden emin olun.');
          
          const stopButton = document.getElementById('stopButton');
          const startButton = document.getElementById('startButton');
          stopButton.style.display = 'none';
          startButton.style.display = 'block';
        });
        
        isScanning = true;
      } else {
        console.error('Kamera bulunamadı!');
        alert('Cihazınızda kamera bulunamadı!');
      }
    }).catch(err => {
      console.error('Kamera erişim hatası:', err);
      alert('Kameralara erişim sağlanamadı! Lütfen kamera izinlerini kontrol edin ve tarayıcının kameraya erişimine izin verin.');
      
      const stopButton = document.getElementById('stopButton');
      const startButton = document.getElementById('startButton');
      stopButton.style.display = 'none';
      startButton.style.display = 'block';
    });
  } catch (error) {
    console.error('Tarayıcı başlatma hatası:', error);
    alert(`Tarayıcı başlatılamadı: ${error.message}`);
    
    const stopButton = document.getElementById('stopButton');
    const startButton = document.getElementById('startButton');
    stopButton.style.display = 'none';
    startButton.style.display = 'block';
  }
};

// Daha önce kaydedilmiş ürünü kontrol et
const checkExistingProduct = async (barcode) => {
  console.log('Daha önce kaydedilmiş ürün kontrol ediliyor:', barcode);
  
  try {
    // Önce yerel veritabanında kontrol et
    const localScans = JSON.parse(localStorage.getItem('localScans') || '[]');
    const localProduct = localScans.find(scan => scan.barcode === barcode);
    
    if (localProduct) {
      console.log('Ürün yerel veritabanında bulundu:', localProduct);
      return localProduct;
    }
    
    // Firebase bağlantısı varsa Firestore'da kontrol et
    if (firebaseConnected) {
      console.log('Ürün Firestore\'da aranıyor...');
      const q = query(
        collection(db, 'scans'),
        where('barcode', '==', barcode),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const product = querySnapshot.docs[0].data();
        console.log('Ürün Firestore\'da bulundu:', product);
        return product;
      }
    }
    
    // Ürün bulunamadı
    console.log('Daha önce kaydedilmiş ürün bulunamadı');
    return null;
  } catch (error) {
    console.error('Ürün kontrolü sırasında hata:', error);
    return null;
  }
};

// Tarayıcıyı durdurma
const stopScanner = () => {
  console.log('Tarayıcı durduruluyor...');
  if (scanner && isScanning) {
    scanner.stop().then(() => {
      console.log('Tarayıcı durduruldu');
      isScanning = false;
    }).catch((err) => {
      console.error(`Tarayıcı durdurma hatası:`, err);
    });
  }
};

// Tarama sonucunu kaydetme
const saveScanResult = async () => {
  console.log('Tarama sonucu kaydediliyor...');
  
  const scannedBarcodeElement = document.getElementById('scannedBarcode');
  const productNameInput = document.getElementById('productName');
  const saveButton = document.getElementById('saveButton');
  
  // Değerleri al
  const barcode = scannedBarcodeElement.textContent?.replace('Barkod: ', '') || '';
  const productName = productNameInput.value || 'Bilinmeyen Ürün';
  
  if (!barcode) {
    alert('Barkod bulunamadı!');
    return;
  }
  
  // Yükleme durumunu göster
  saveButton.disabled = true;
  saveButton.textContent = 'Kaydediliyor...';
  
  try {
    if (!firebaseConnected) {
      console.warn('Firebase bağlantısı yok. Yerel olarak kaydediliyor.');
      
      // Yerel depolama kullanarak kaydet
      const localScans = JSON.parse(localStorage.getItem('localScans') || '[]');
      localScans.push({
        barcode,
        productName,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('localScans', JSON.stringify(localScans));
      
      alert('Barkod yerel olarak kaydedildi. İnternet bağlantısı geldiğinde Firebase\'e senkronize edilecek.');
    } else {
      // Firestore'a kaydet
      console.log('Firestore\'a kaydediliyor...', { barcode, productName });
      await addDoc(collection(db, 'scans'), {
        barcode,
        productName,
        timestamp: serverTimestamp()
      });
      
      console.log('Barkod başarıyla kaydedildi');
      // Başarı mesajı göster
      alert('Barkod başarıyla kaydedildi!');
    }
    
    // Ekranı sıfırla
    const scanResultElement = document.getElementById('scanResult');
    const productNameContainer = document.getElementById('productNameContainer');
    scanResultElement.style.display = 'none';
    productNameContainer.style.display = 'none';
    saveButton.style.display = 'none';
    
    // Butonları sıfırla
    saveButton.disabled = false;
    saveButton.textContent = 'Kaydet';
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    alert('Barkod kaydedilirken bir hata oluştu!');
    saveButton.disabled = false;
    saveButton.textContent = 'Kaydet';
  }
};

// Geçmiş sekmesini render et
const renderHistoryTab = async () => {
  console.log('Geçmiş sekmesi yükleniyor...');
  
  appElement.innerHTML = `
    <div class="container">
      <h1>Tarama Geçmişi</h1>
      <div id="historyList">
        <div class="card">
          <p>Geçmiş yükleniyor...</p>
        </div>
      </div>
    </div>
  `;
  
  const historyListElement = document.getElementById('historyList');
  
  try {
    // Önce yerel kayıtları kontrol et
    const localScans = JSON.parse(localStorage.getItem('localScans') || '[]');
    const hasLocalScans = localScans.length > 0;
    
    // Firebase bağlantı durumuna göre işlem yap
    if (!firebaseConnected) {
      if (!hasLocalScans) {
        historyListElement.innerHTML = `
          <div class="card">
            <div class="alert alert-warning">
              <p>Firebase bağlantısı yok ve henüz yerel tarama kaydı bulunmuyor.</p>
            </div>
          </div>
        `;
        return;
      }
      
      // Yerel kayıtları göster
      console.log('Yerel kayıtlar yükleniyor...', localScans);
      let historyHTML = `
        <div class="card">
          <div class="alert alert-warning">
            <p>Firebase bağlantısı yok! Yalnızca yerel kayıtlar gösteriliyor.</p>
          </div>
        </div>
      `;
      
      // Tarihe göre sıralama (en yeniden en eskiye)
      localScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      localScans.forEach((scan) => {
        const date = new Date(scan.timestamp);
        const formattedDate = formatDate(date);
        
        historyHTML += `
          <div class="history-item">
            <div>
              <div class="history-barcode">${scan.barcode}</div>
              <div class="history-product">${scan.productName}</div>
              <div class="history-date">${formattedDate}</div>
            </div>
          </div>
        `;
      });
      
      historyListElement.innerHTML = historyHTML;
      return;
    }
    
    // Firebase bağlantısı varsa, Firestore'dan verileri al
    console.log('Geçmiş veriler çekiliyor...');
    const q = query(collection(db, 'scans'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty && !hasLocalScans) {
      console.log('Geçmiş bulunamadı');
      historyListElement.innerHTML = `
        <div class="card">
          <p>Henüz hiç tarama yapılmamış.</p>
        </div>
      `;
      return;
    }
    
    // Verileri ekrana yazdır
    console.log('Geçmiş veriler yükleniyor...');
    let historyHTML = '';
    
    // Firebase'den gelen veriler
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      const date = timestamp ? new Date(timestamp.seconds * 1000) : new Date();
      const formattedDate = formatDate(date);
      
      historyHTML += `
        <div class="history-item">
          <div>
            <div class="history-barcode">${data.barcode}</div>
            <div class="history-product">${data.productName}</div>
            <div class="history-date">${formattedDate}</div>
          </div>
        </div>
      `;
    });
    
    // Yerel kayıtlar varsa onları da ekle
    if (hasLocalScans) {
      historyHTML += `
        <div class="card" style="margin-top: 1rem;">
          <div class="alert alert-info">
            <p>Aşağıdaki kayıtlar henüz Firebase'e senkronize edilmemiş yerel kayıtlardır.</p>
          </div>
        </div>
      `;
      
      localScans.forEach((scan) => {
        const date = new Date(scan.timestamp);
        const formattedDate = formatDate(date);
        
        historyHTML += `
          <div class="history-item" style="border-left: 3px solid var(--primary-color);">
            <div>
              <div class="history-barcode">${scan.barcode}</div>
              <div class="history-product">${scan.productName}</div>
              <div class="history-date">${formattedDate} (Yerel)</div>
            </div>
          </div>
        `;
      });
    }
    
    historyListElement.innerHTML = historyHTML;
  } catch (error) {
    console.error('Geçmiş yükleme hatası:', error);
    historyListElement.innerHTML = `
      <div class="card">
        <div class="alert alert-danger">
          <p>Geçmiş yüklenirken bir hata oluştu!</p>
          <p>${error.message}</p>
        </div>
      </div>
    `;
  }
};

// Ayarlar sekmesini render et
const renderSettingsTab = () => {
  console.log('Ayarlar sekmesi yükleniyor...');
  
  appElement.innerHTML = `
    <div class="container">
      <h1>Ayarlar</h1>
      
      <div class="card">
        <div class="settings-section">
          <h2>Firebase Bağlantısı</h2>
          <div id="connectionStatus">
            <p>Bağlantı durumu kontrol ediliyor...</p>
          </div>
          <button id="checkConnectionButton" class="btn" style="margin-top: 1rem;">Bağlantıyı Kontrol Et</button>
        </div>
        
        <div class="settings-section">
          <h2>Uygulama Bilgileri</h2>
          <p><strong>Sürüm:</strong> 1.0.0</p>
          <p><strong>Geliştirici:</strong> MertAlii</p>
          <p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
    </div>
  `;
  
  // Bağlantı durumunu güncelle
  updateConnectionStatus();
  
  // Bağlantı kontrolü butonu
  const checkConnectionButton = document.getElementById('checkConnectionButton');
  checkConnectionButton.addEventListener('click', async () => {
    checkConnectionButton.disabled = true;
    checkConnectionButton.textContent = 'Kontrol Ediliyor...';
    
    firebaseConnected = await checkFirebaseConnection();
    updateConnectionStatus();
    
    checkConnectionButton.disabled = false;
    checkConnectionButton.textContent = 'Bağlantıyı Kontrol Et';
  });
};

// Bağlantı durumunu güncelle
const updateConnectionStatus = () => {
  console.log('Bağlantı durumu güncelleniyor...');
  
  const connectionStatusElement = document.getElementById('connectionStatus');
  
  if (firebaseConnected) {
    connectionStatusElement.innerHTML = `
      <div class="alert alert-success">
        <p>Firebase bağlantısı aktif.</p>
        <p>Veritabanı: barkod-972a2</p>
      </div>
    `;
  } else {
    connectionStatusElement.innerHTML = `
      <div class="alert alert-danger">
        <p>Firebase bağlantısı yok!</p>
        <p>Olası nedenler:</p>
        <ul>
          <li>İnternet bağlantınızı kontrol edin</li>
          <li>Firewall veya güvenlik yazılımları bağlantıyı engelliyor olabilir</li>
          <li>Firebase projesinin doğru yapılandırıldığından emin olun</li>
          <li>Firebase projenizin aktif olduğundan emin olun</li>
        </ul>
        <p>Bağlantı olmadan da uygulamayı kullanabilirsiniz, ancak tarama sonuçları kaydedilemez.</p>
      </div>
    `;
  }
};

// Tarih formatlama
const formatDate = (date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Uygulamayı başlat
console.log('DOMContentLoaded bekleniyor...');
document.addEventListener('DOMContentLoaded', setupUI); 