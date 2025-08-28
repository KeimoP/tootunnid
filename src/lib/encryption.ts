import crypto from 'crypto';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'default-key-for-development-only!!';
const ALGORITHM = 'aes-256-gcm';

// Ensure key is 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt sensitive data
 */
export function encryptData(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipher(ALGORITHM, key);
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data for database storage (one-way)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data + key).digest('hex');
}

/**
 * Encrypt salary data
 */
export function encryptSalary(wage: number): string {
  const encrypted = encryptData(wage.toString());
  return JSON.stringify(encrypted);
}

/**
 * Decrypt salary data
 */
export function decryptSalary(encryptedWage: string): number {
  try {
    const encryptedData = JSON.parse(encryptedWage) as EncryptedData;
    const decrypted = decryptData(encryptedData);
    return parseFloat(decrypted);
  } catch {
    return 0; // Default wage if decryption fails
  }
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'hourlyWage', 'wage', 'salary', 'earnings', 
    'sharingCode', 'code', 'password', 'token',
    'duration', 'hours', 'clockIn', 'clockOut'
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Generate secure sharing code
 */
export function generateSecureCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return result;
}
