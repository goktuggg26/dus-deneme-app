import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Resim yükleme servisi

// Senin GERÇEK Proje Anahtarların (Dosyalarından geri yükledim)
const firebaseConfig = {
  apiKey: "AIzaSyBGVlPsNhL5SKN9B6GsSl_4m7v8kJatpF0",
  authDomain: "dus-deneme-app.firebaseapp.com",
  projectId: "dus-deneme-app",
  storageBucket: "dus-deneme-app.firebasestorage.app",
  messagingSenderId: "839600248763",
  appId: "1:839600248763:web:ec0b91efceb9ffbd55d69e"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// Veritabanını dışarı aktar
export const db = getFirestore(app);

// Depolamayı dışarı aktar (Resimler için)
export const storage = getStorage(app);