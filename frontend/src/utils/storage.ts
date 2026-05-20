export function saveProject<T>(key: string, project: T) {
  localStorage.setItem(key, JSON.stringify(project));
}

export function loadProject<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
