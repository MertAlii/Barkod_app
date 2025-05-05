import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, doc, deleteDoc } from 'firebase/firestore';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyDrYamdOOrA4bcLO-a2qitsInPtnmSuVXY",
  authDomain: "barkod-972a2.firebaseapp.com",
  projectId: "barkod-972a2",
  storageBucket: "barkod-972a2.appspot.com",
  messagingSenderId: "662732273124",
  appId: "1:662732273124:web:28d791618f911df75e03f1",
  measurementId: "G-JJWE1LYX1K"
};

// Firebase uygulamasını başlatma
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firebase bağlantısını kontrol etme
export const checkFirebaseConnection = async () => {
  try {
    console.log('Firebase bağlantısı kontrol ediliyor...');
    
    // Zaman aşımı kontrolü
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Zaman aşımı: Firebase yanıt vermedi')), 10000);
    });
    
    // Basit bir okuma işlemi deneyelim
    const testQuery = async () => {
      // Firestore'dan verileri getirmeyi deneyelim
      const querySnapshot = await getDocs(collection(db, 'scans'), limit(1));
      // Eğer buraya kadar gelebildiysek, bağlantı var demektir
      console.log('Firebase bağlantısı başarılı');
      return true;
    };
    
    // İki promise'i yarıştır
    const result = await Promise.race([testQuery(), timeoutPromise]);
    return result === true;
  } catch (error) {
    console.error('Firebase bağlantı hatası:', error);
    
    // Firebase yapılandırma bilgilerini kontrol edelim
    console.log('Firebase yapılandırması:', {
      apiKey: firebaseConfig.apiKey ? 'Mevcut' : 'Eksik',
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId ? 'Mevcut' : 'Eksik'
    });
    
    return false;
  }
};

// Firestore'dan barkod silme
export const deleteBarcode = async (docId) => {
  try {
    console.log('Barkod siliniyor:', docId);
    await deleteDoc(doc(db, 'scans', docId));
    console.log('Barkod başarıyla silindi');
    return true;
  } catch (error) {
    console.error('Barkod silme hatası:', error);
    return false;
  }
}; 