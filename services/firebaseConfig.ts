import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Interface for the config object
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// OPTIONAL: Paste your firebase config here to avoid typing it in the UI
const HARDCODED_CONFIG: FirebaseConfig | null = {
    apiKey: "AIzaSyDYxRsmcneZNmwBVF0W1BzJBjMdcjg0NEM",
    authDomain: "gestionador-de-tareas-b8cd3.firebaseapp.com",
    projectId: "gestionador-de-tareas-b8cd3",
    storageBucket: "gestionador-de-tareas-b8cd3.firebasestorage.app",
    messagingSenderId: "273235745820",
    appId: "1:273235745820:web:c627c0dbdfb1bfc1c413d9"
};
/* Example:
const HARDCODED_CONFIG = {
    apiKey: "AIza...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
*/

export const isFirebaseConfigured = (): boolean => {
    return !!HARDCODED_CONFIG || !!getStoredConfig();
};

export const getStoredConfig = (): FirebaseConfig | null => {
    if (HARDCODED_CONFIG) return HARDCODED_CONFIG;
    const stored = localStorage.getItem('tm_firebase_config');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const saveConfig = (config: FirebaseConfig) => {
    localStorage.setItem('tm_firebase_config', JSON.stringify(config));
    // Force reload to init firebase
    window.location.reload();
};

export const clearConfig = () => {
    localStorage.removeItem('tm_firebase_config');
    window.location.reload();
}

export const getDb = (): Firestore => {
    if (db) return db;

    const config = getStoredConfig();
    if (!config) {
        throw new Error("Firebase not configured");
    }

    if (!getApps().length) {
        app = initializeApp(config);
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    return db;
};
