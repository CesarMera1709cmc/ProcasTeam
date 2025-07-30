import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off, push, remove, update } from 'firebase/database';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCGDsjIoobNvtPLkoe0zqr6VUVBHx6z6GM",
  authDomain: "baseprocasteam.firebaseapp.com",
  databaseURL: "https://baseprocasteam-default-rtdb.firebaseio.com",
  projectId: "baseprocasteam",
  storageBucket: "baseprocasteam.firebasestorage.app",
  messagingSenderId: "838864503589",
  appId: "1:838864503589:web:98211e9f168019817250cc",
  measurementId: "G-0LY03GW4W3"
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