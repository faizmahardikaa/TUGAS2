import { loadConfig } from '../src/config.js';
import { decryptData } from '../src/encryption.js';
const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
const login = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: process.env.DEMO_USERNAME || 'mahasiswa', password: 'Praktikum@2026' }) });
const session = await login.json();
if (!login.ok) throw new Error(session.error);
const response = await fetch(`${base}/protected-data`, { headers: { Authorization: `Bearer ${session.token}` } });
const payload = await response.json();
if (!response.ok) throw new Error(payload.error);
console.log('RESPONS TERENKRIPSI:', JSON.stringify(payload, null, 2));
console.log('DEKRIPSI LOKAL:', decryptData(payload.encryptedData, loadConfig().aesKey));
