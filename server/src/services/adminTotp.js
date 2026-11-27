const crypto = require('node:crypto');
const { JWT_SECRET } = require('../config/sessionSecret');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const key = crypto.createHmac('sha256', JWT_SECRET).update('advait-admin-totp-encryption-v1').digest();

function enrollmentSecret() {
  const bytes = crypto.randomBytes(20);
  let value = 0;
  let bits = 0;
  let secret = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      secret += alphabet[(value >>> bits) & 31];
    }
  }
  return secret;
}

function decode(secret) {
  let value = 0;
  let bits = 0;
  const bytes = [];
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}

function encryptSecret(secret, adminId) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(Buffer.from(adminId));
  const encrypted = Buffer.concat([cipher.update(secret, 'ascii'), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function decryptSecret(encrypted, adminId) {
  const bytes = Buffer.from(encrypted, 'base64url');
  const cipher = crypto.createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(adminId));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('ascii');
}

function matchingStep(secret, code, now = Date.now()) {
  if (typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) return null;
  const step = Math.floor(now / 30_000);
  const secretBytes = decode(secret);
  const counter = Buffer.alloc(8);
  for (const candidate of [step, step - 1, step + 1]) {
    if (candidate < 0) continue;
    counter.writeBigUInt64BE(BigInt(candidate));
    const mac = crypto.createHmac('sha1', secretBytes).update(counter).digest();
    const offset = mac[mac.length - 1] & 15;
    const number = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    const expected = Buffer.from(String(number).padStart(6, '0'));
    if (crypto.timingSafeEqual(expected, Buffer.from(code))) return candidate;
  }
  return null;
}

module.exports = { enrollmentSecret, encryptSecret, decryptSecret, matchingStep };
