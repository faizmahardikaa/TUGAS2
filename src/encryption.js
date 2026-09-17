import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function encryptData(data, key) {
  const iv = randomBytes(12); // Fresh nonce per encryption under this key.
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return { algorithm: 'AES-256-GCM', encoding: 'base64', iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
}

// Local trusted client only. No public endpoint distributing the AES key.
export function decryptData(payload, key) {
  if (payload.algorithm !== 'AES-256-GCM' || payload.encoding !== 'base64')
    throw new Error('Format enkripsi tidak didukung');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.authTag, 'base64');
  if (iv.length !== 12 || tag.length !== 16) throw new Error('IV/tag tidak valid');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, 'base64')), decipher.final()]).toString('utf8'));
}
