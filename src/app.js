import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encryptData } from './encryption.js';

export const issuer = 'tugas2-auth';
export const audience = 'tugas2-api';

export function createApp(config, { loginLimit = 10 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  const limiter = rateLimit({ windowMs: 60_000, limit: loginLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Terlalu banyak percobaan login. Tunggu satu menit.' } });

  app.post('/login', limiter, async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' ||
        !username || !password || username.length > 100 || Buffer.byteLength(password) > 72)
      return res.status(400).json({ error: 'Username/password wajib valid; password maksimal 72 byte.' });
    const match = await bcrypt.compare(password, config.passwordHash);
    if (!match || username !== config.username)
      return res.status(401).json({ error: 'Username atau password salah.' });
    const token = jwt.sign({ username }, config.jwtSecret, {
      algorithm: 'HS256', expiresIn: '15m', issuer, audience, subject: 'user-001'
    });
    return res.json({ message: 'Login berhasil.', tokenType: 'Bearer', expiresIn: 900, token });
  });

  function authenticate(req, res, next) {
    const header = req.get('Authorization');
    if (!header) return res.status(401).json({ error: 'Token diperlukan.' });
    const match = /^Bearer ([^\s]+)$/i.exec(header);
    if (!match) return res.status(401).json({ error: 'Format Authorization harus Bearer <token>.' });
    try {
      const claims = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'], issuer, audience });
      if (claims.sub !== 'user-001' || claims.username !== config.username || !Number.isInteger(claims.exp))
        throw new Error('Klaim tidak valid');
      req.user = claims;
      next();
    } catch {
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }
  }
  app.get('/protected-data', authenticate, (req, res) => {
    const data = { owner: req.user.username, studentId: 'DEMO-001',
      note: 'Data akademik rahasia untuk simulasi praktikum.' };
    res.json({ message: 'Akses diberikan.', encryptedData: encryptData(data, config.aesKey) });
  });
  app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON tidak valid.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Payload terlalu besar.' });
    res.status(500).json({ error: 'Kesalahan internal server.' });
  });
  return app;
}
