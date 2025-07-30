import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, get, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCGDsjIoobNvtPLkoe0zqr6VUVBHx6z6GM",
  authDomain: "baseprocasteam.firebaseapp.com",
  databaseURL: "https://baseprocasteam-default-rtdb.firebaseio.com/",
  projectId: "baseprocasteam",
  storageBucket: "baseprocasteam.firebasestorage.app",
  messagingSenderId: "838864503589",
  appId: "1:838864503589:web:98211e9f168019817250cc",
  measurementId: "G-0LY03GW4W3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('🔥 Firebase inicializado correctamente');

// Exportar push también
export { database, ref, set, onValue, off, get, push };