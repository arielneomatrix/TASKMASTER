import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebaseConfig';
import { Task } from '../types';
import { sha256Polyfill } from './sha256';

export const cloudSync = {
    isValidSyncCode: (code: string): boolean => {
        return code && code.trim().length >= 4;
    },

    // Generates a deterministic Document ID from the passphrase
    // Falls back to JS implementation if Secure Context (crypto.subtle) is not available
    _getDocId: async (passphrase: string) => {
        const cleanPass = passphrase.trim().toLowerCase();

        // Try Native Crypto (Faster, but requires HTTPS/Localhost)
        if (window.crypto && window.crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(cleanPass);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                console.warn("Crypto API failed, falling back to polyfill", e);
            }
        }

        // Fallback for HTTP / Insecure Contexts
        return await sha256Polyfill(cleanPass);
    },

    saveTasks: async (syncCode: string, tasks: Task[]): Promise<boolean> => {
        if (!isFirebaseConfigured()) return false;
        try {
            const db = getDb();
            const docId = await cloudSync._getDocId(syncCode);
            const docRef = doc(db, 'user_tasks', docId);

            await setDoc(docRef, {
                tasks: tasks,
                lastUpdated: Timestamp.now()
            });
            return true;
        } catch (error) {
            console.error("Firebase Save Error:", error);
            return false;
        }
    },

    loadTasks: async (syncCode: string): Promise<Task[] | null> => {
        if (!isFirebaseConfigured()) return null;

        // Let errors propagate to the UI (e.g. Permission Denied, Network Error)
        const db = getDb();
        const docId = await cloudSync._getDocId(syncCode);
        const docRef = doc(db, 'user_tasks', docId);

        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            const data = snapshot.data();
            return Array.isArray(data.tasks) ? data.tasks : [];
        }
        return null; // Not found -> New User
    }
};
