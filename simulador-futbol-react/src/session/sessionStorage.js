const STORAGE_KEY = 'simfut-session';

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('No se pudo leer la sesión almacenada', err);
    return null;
  }
}

export function persistSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('No se pudo guardar la sesión', err);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('No se pudo eliminar la sesión', err);
  }
}
