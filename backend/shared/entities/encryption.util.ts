import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In a real app, this should come from process.env.ENCRYPTION_KEY and be exactly 32 bytes (256 bits).
// We use a fallback strictly for safety during initialization if the env is missing, but it should throw.
const getEncryptionKey = () => {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be set and exactly 32 characters long in your .env file.');
  }
  return Buffer.from(key, 'utf8');
};

export class EncryptionUtil {
  /**
   * Encrypts a plain text string using AES-256-GCM
   * Returns a payload containing the IV, Auth Tag, and Encrypted Data separated by colons.
   */
  static encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted payload using AES-256-GCM
   */
  static decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return encryptedPayload;
    
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format. Expected iv:authTag:encryptedData');
    }
    
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
