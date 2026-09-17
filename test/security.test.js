import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createApp, issuer, audience } from '../src/app.js';
import { encryptData, decryptData } from '../src/encryption.js';
import { loadConfig } from '../src/config.js';

const password = 'Praktikum@2026';
const config = { username: 'mahasiswa', passwordHash: await bcrypt.hash(password, 12),
  jwtSecret: randomBytes(48).toString('hex'), aesKey: randomBytes(32) };
let server, base, token;
before(async () => {
  server = createApp(config).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const login = body => fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const get = value => fetch(`${base}/protected-data`, { headers: value ? { Authorization: value } : {} });
test('01 bcrypt: hash berbeda dari plaintext dan password cocok', async () => {
  assert.notEqual(config.passwordHash, password);
  assert.equal(await bcrypt.compare(password, config.passwordHash), true);
});
test('02 tanpa token ditolak 401', async () => assert.equal((await get()).status, 401));
test('03 token invalid ditolak 401', async () => assert.equal((await get('Bearer invalid.token.demo')).status, 401));
test('04 password salah ditolak 401', async () => assert.equal((await login({ username: config.username, password: 'salah' })).status, 401));
test('05 input kosong ditolak 400', async () => assert.equal((await login({})).status, 400));
test('06 login benar menghasilkan JWT dengan expiry 15 menit', async () => {
  const response = await login({ username: config.username, password });
  assert.equal(response.status, 200);
  token = (await response.json()).token;
  const claims = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer, audience });
  assert.equal(claims.exp - claims.iat, 900);
});
test('07 token valid menghasilkan ciphertext, tanpa plaintext dan tanpa kunci', async () => {
  const response = await get(`Bearer ${token}`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.encryptedData.algorithm, 'AES-256-GCM');
  assert.ok(!JSON.stringify(data).includes('DEMO-001'));
  assert.ok(!JSON.stringify(data).includes(config.aesKey.toString('hex')));
  assert.equal(decryptData(data.encryptedData, config.aesKey).studentId, 'DEMO-001');
});
test('08 token kedaluwarsa ditolak 401', async () => {
  const expired = jwt.sign({ username: config.username }, config.jwtSecret, { subject: 'user-001', issuer, audience, expiresIn: -1 });
  assert.equal((await get(`Bearer ${expired}`)).status, 401);
});
test('09 signature salah ditolak 401', async () => {
  const forged = jwt.sign({ username: config.username }, randomBytes(32), { issuer, audience, expiresIn: 900 });
  assert.equal((await get(`Bearer ${forged}`)).status, 401);
});
test('10 audience salah ditolak 401', async () => {
  const wrong = jwt.sign({ username: config.username }, config.jwtSecret, { issuer, audience: 'wrong', expiresIn: 900 });
  assert.equal((await get(`Bearer ${wrong}`)).status, 401);
});
test('11 ciphertext berubah setiap enkripsi dan manipulasi ditolak', () => {
  const first = encryptData({ secret: 'demo' }, config.aesKey);
  const second = encryptData({ secret: 'demo' }, config.aesKey);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  const altered = Buffer.from(first.ciphertext, 'base64'); altered[0] ^= 1;
  assert.throws(() => decryptData({ ...first, ciphertext: altered.toString('base64') }, config.aesKey));
  assert.throws(() => decryptData(second, randomBytes(32)));
});
test('12 konfigurasi kosong gagal secara aman', () => assert.throws(() => loadConfig({})));
test('13 malformed JSON ditolak 400', async () => {
  const response = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
});
test('14 password lebih dari 72 byte ditolak 400', async () => {
  assert.equal((await login({ username: config.username, password: 'a'.repeat(73) })).status, 400);
});
test('15 rate limiting login mengembalikan 429', async () => {
  const limited = createApp(config, { loginLimit: 1 }).listen(0, '127.0.0.1');
  await new Promise(resolve => limited.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${limited.address().port}/login`;
    const request = () => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal((await request()).status, 400);
    assert.equal((await request()).status, 429);
  } finally { await new Promise(resolve => limited.close(resolve)); }
});
