export function loadConfig(env = process.env) {
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32)
    throw new Error('JWT_SECRET harus minimal 32 byte. Jalankan npm run setup.');
  if (!/^[a-fA-F0-9]{64}$/.test(env.AES_KEY_HEX || ''))
    throw new Error('AES_KEY_HEX harus 64 karakter hexadecimal.');
  if (!/^\$2[ab]\$12\$[./A-Za-z0-9]{53}$/.test(env.PASSWORD_HASH || ''))
    throw new Error('PASSWORD_HASH harus bcrypt cost 12 dari npm run setup.');
  return { jwtSecret: env.JWT_SECRET, aesKey: Buffer.from(env.AES_KEY_HEX, 'hex'),
    passwordHash: env.PASSWORD_HASH, username: env.DEMO_USERNAME || 'mahasiswa' };
}
