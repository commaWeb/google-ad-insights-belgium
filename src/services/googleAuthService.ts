/// <reference types="vite/client" />

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Google OAuth Client ID/Secret are not set in environment variables.');
} 

const REDIRECT_URI = typeof window !== 'undefined' && window.location.origin
  ? `${window.location.origin}/oauth/callback`
  : 'https://google-ad-insights-belgium.vercel.app/';

const SCOPES = 'https://www.googleapis.com/auth/bigquery.readonly https://www.googleapis.com/auth/cloud-platform.read-only';

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function isAuthenticated() {
  const storedToken = localStorage.getItem('google_access_token');
  const storedExpiry = localStorage.getItem('google_token_expiry');
  if (!storedToken || !storedExpiry) return false;
  return Date.now() < parseInt(storedExpiry, 10);
}

export async function exchangeCodeForToken(code: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = {
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  };
  const body = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Failed to exchange code for token');
  const data = await res.json();
  const accessToken = data.access_token;
  const expiresIn = data.expires_in;
  const tokenExpiry = Date.now() + expiresIn * 1000;
  localStorage.setItem('google_access_token', accessToken);
  localStorage.setItem('google_token_expiry', tokenExpiry.toString());
  return accessToken;
}

export function getAccessToken() {
  const storedToken = localStorage.getItem('google_access_token');
  const storedExpiry = localStorage.getItem('google_token_expiry');
  if (!storedToken || !storedExpiry) return null;
  if (Date.now() > parseInt(storedExpiry, 10)) {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    return null;
  }
  return storedToken;
}

export function signOut() {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
}

export const logout = signOut;

export function initGoogleAuth() {
  // No-op: placeholder for future Google Auth initialization logic if needed
} 