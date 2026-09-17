import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';

// Public training credential, NOT a production password.
const password = 'Praktikum@2026';
const hash = await bcrypt.hash(password, 12);
const content = `HOST=127.0.0.1\nPORT=3000\nDEMO_USERNAME=mahasiswa\nPASSWORD_HASH=${hash}\nJWT_SECRET=${randomBytes(48).toString('hex')}\nAES_KEY_HEX=${randomBytes(32).toString('hex')}\n`;
try {
  writeFileSync('.env', content, { flag: 'wx', mode: 0o600 });
  console.log('Konfigurasi dibuat. Akun latihan: mahasiswa / Praktikum@2026');
  console.log('Jangan unggah .env. Kredensial latihan tidak untuk produksi.');
} catch (error) {
  if (error.code === 'EEXIST') console.log('.env sudah ada; tidak ditimpa.');
  else throw error;
}
