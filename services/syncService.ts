
import { Task } from '../types';

const API_URL = 'https://jsonblob.com/api/jsonBlob';

// Implementación simple de SHA-256 en JS puro como fallback si crypto no está disponible
// Esto asegura que funcione en todos los navegadores y contextos (http/https)
async function sha256(message: string): Promise<string> {
  // Si tenemos crypto nativo, lo usamos (más rápido)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple (no criptográficamente fuerte pero consistente para IDs)
  // Utiliza un algoritmo de mezcla de bits para generar una cadena "hash" determinista
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < message.length; i++) {
    let ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  
  // Extendemos la longitud artificialmente para llenar el UUID
  let hex = val.toString(16);
  while (hex.length < 64) hex += hex; // Repetir patrón
  return hex.substring(0, 64);
}

// Genera un UUID v4 VÁLIDO a partir de la clave.
// El servidor rechaza IDs que no tengan los bits de versión y variante correctos.
async function generateDeterministicId(key: string): Promise<string> {
  const hashHex = await sha256(key.trim().toLowerCase());
  
  // Formato UUID: 8-4-4-4-12 chars
  const p1 = hashHex.substring(0, 8);
  const p2 = hashHex.substring(8, 12);
  const p3Raw = hashHex.substring(12, 16);
  const p4Raw = hashHex.substring(16, 20);
  const p5 = hashHex.substring(20, 32);

  // Truco crítico: Forzar bits de versión (4) y variante (8, 9, a, b)
  // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const p3 = '4' + p3Raw.substring(1); // Forzar versión 4
  const p4 = (parseInt(p4Raw.charAt(0), 16) & 0x3 | 0x8).toString(16) + p4Raw.substring(1); // Forzar variante (8,9,a,b)

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export const getAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
};

export const cloudSync = {
  isValidSyncCode: (code: string): boolean => {
    return code && code.trim().length >= 4;
  },

  login: async (passphrase: string): Promise<{id: string, tasks: Task[]} | null> => {
    try {
      const id = await generateDeterministicId(passphrase);
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return { id, tasks: Array.isArray(data) ? data : [] };
      }
      return null;
    } catch (e) {
      console.error("Login fail:", e);
      return null;
    }
  },

  register: async (passphrase: string, initialTasks: Task[] = []): Promise<string | "EXISTS" | null> => {
    try {
      const id = await generateDeterministicId(passphrase);
      
      // 1. Verificar existencia
      try {
        const check = await fetch(`${API_URL}/${id}`, { method: 'GET' });
        if (check.ok) return "EXISTS";
      } catch (e) { /* Si falla la red en el check, seguimos intentando crear */ }

      // 2. Intentar crear (POST a la URL base devolviendo ubicación NO sirve para ID custom).
      // Usamos POST directo al ID específico o PUT.
      // JsonBlob a veces requiere que el ID no exista para aceptar un POST a una ruta específica.
      
      const payload = JSON.stringify(initialTasks);
      const headers = { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      };

      // Intento Principal: POST al ID específico (Creación explícita)
      const postResponse = await fetch(`${API_URL}/${id}`, {
        method: 'POST',
        headers: headers,
        body: payload
      });

      if (postResponse.ok || postResponse.status === 201) return id;

      // Intento Secundario: PUT al ID específico (Upsert/Actualización forzada)
      // Si el servidor rechazó el POST por "Method Not Allowed", el PUT suele funcionar.
      const putResponse = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: headers,
        body: payload
      });

      if (putResponse.ok || putResponse.status === 201) return id;
      
      console.error("Falló el registro:", postResponse.status, putResponse.status);
      return null;
    } catch (e) {
      console.error("Error crítico en registro:", e);
      return null;
    }
  },

  saveTasks: async (syncCode: string, tasks: Task[]): Promise<boolean> => {
    if (!syncCode) return false;
    try {
      const response = await fetch(`${API_URL}/${syncCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(tasks)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  loadTasks: async (syncCode: string): Promise<Task[] | null> => {
    if (!syncCode) return null;
    try {
      const response = await fetch(`${API_URL}/${syncCode}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return null;
    }
  }
};
