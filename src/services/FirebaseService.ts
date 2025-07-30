import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off, push, remove, update } from 'firebase/database';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSGVlT9Gu9-uIIhkWJUL2y8KsFWJTtBkQ",
  authDomain: "procasteam-3ae58.firebaseapp.com",
  databaseURL: "https://procasteam-3ae58-default-rtdb.firebaseio.com",
  projectId: "procasteam-3ae58",
  storageBucket: "procasteam-3ae58.firebasestorage.app",
  messagingSenderId: "738064056308",
  appId: "1:738064056308:web:d75e2f5db05ac7e34b42db"
};

// Inicializar Firebase
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
}

// Verificar conexión
const testConnection = async () => {
  try {
    if (!database) {
      throw new Error('Database not initialized');
    }
    const testRef = ref(database, '.info/connected');
    onValue(testRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log('🔥 Connected to Firebase');
      } else {
        console.log('❌ Disconnected from Firebase');
      }
    });
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
};

// Ejecutar test de conexión
testConnection();

export { database, ref, set, get, onValue, off, push, remove, update };