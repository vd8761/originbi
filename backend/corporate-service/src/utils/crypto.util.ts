import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;

// Use a secure key from environment, or fallback for dev/testing
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'originbi-super-secret-key-32chars';

export class CryptoUtil {
  /**
   * Encrypts a plain text string using AES-256-GCM.
   */
  static encrypt(text: string): string {
    if (!text) return text;
    
    // Create a 32-byte key
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Format: iv:tag:encryptedData
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted string.
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText; // Not our format, return as-is
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // If decryption fails (e.g. wrong key, or wasn't encrypted), return the original text
      // This is a safety mechanism so old plain-text passwords still work if they haven't been re-saved!
      console.warn('Decryption failed, treating as plain text. Error:', error.message);
      return encryptedText;
    }
  }
}
