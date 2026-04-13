// Session management — same pattern as thcv2
// localStorage = persists forever (survives browser close)
// sessionStorage = cleared when tab/browser closes

const SESSION_KEY = "q_session";

export interface AppSession {
  access_token: string;
  refresh_token: string;
  user_id: string;
  pseudo: string;
  role: string;
  expires_at: number;
}

/** Save session to the right storage based on "remember me" */
export function saveSession(session: AppSession, remember: boolean) {
  const data = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(SESSION_KEY, data);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, data);
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Read session from either storage */
export function getSession(): AppSession | null {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

/** Clear session from both storages */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/** Check if user has a valid session */
export function hasSession(): boolean {
  return getSession() !== null;
}
