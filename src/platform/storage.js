const PREFIX = 'proforma:';

export function load(key, fallback) {
  try {
    const value = localStorage.getItem(`${PREFIX}${key}`);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(`${PREFIX}${key}`);
    return true;
  } catch {
    return false;
  }
}
