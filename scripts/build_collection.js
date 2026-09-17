import { mkdirSync, writeFileSync } from 'node:fs';
const scenarios = [
  ['01 Tanpa token', 'GET', '/protected-data', null, null, 401],
  ['02 Token invalid', 'GET', '/protected-data', 'invalid.token.demo', null, 401],
  ['03 Password salah', 'POST', '/login', null, { username: '{{username}}', password: 'salah' }, 401],
  ['04 Login berhasil', 'POST', '/login', null, { username: '{{username}}', password: '{{password}}' }, 200],
  ['05 Token valid', 'GET', '/protected-data', '{{token}}', null, 200]
];
const collection = {
  info: { name: 'Tugas 2 - JWT bcrypt AES-256', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: 'Jalankan urut 01-05. Login menyimpan token otomatis. Akun latihan lokal saja.' },
  variable: [{ key: 'baseUrl', value: 'http://127.0.0.1:3000' }, { key: 'username', value: 'mahasiswa' },
    { key: 'password', value: 'Praktikum@2026' }, { key: 'token', value: '' }],
  item: scenarios.map(([name, method, path, token, body, status]) => {
    const checks = [`pm.test('Status HTTP ${status}', () => pm.response.to.have.status(${status}));`];
    if (name.startsWith('04')) checks.push("if (pm.response.code === 200) { pm.collectionVariables.set('token', pm.response.json().token); } else { pm.collectionVariables.unset('token'); }", "pm.test('JWT diterima', () => pm.expect(pm.response.json().token).to.be.a('string'));");
    if (name.startsWith('05')) checks.push("pm.test('Payload AES-256-GCM', () => { const p = pm.response.json().encryptedData; pm.expect(p.algorithm).to.eql('AES-256-GCM'); ['iv','authTag','ciphertext'].forEach(k => pm.expect(p[k]).to.be.a('string')); });");
    const request = { method, auth: { type: 'noauth' }, header: [], url: '{{baseUrl}}' + path };
    if (token) request.header.push({ key: 'Authorization', value: 'Bearer ' + token });
    if (body) { request.header.push({ key: 'Content-Type', value: 'application/json' }); request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } }; }
    return { name, request, event: [{ listen: 'test', script: { type: 'text/javascript', exec: checks } }] };
  })
};
mkdirSync('postman', { recursive: true });
writeFileSync('postman/Tugas2.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
