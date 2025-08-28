// Privacy and Logging Policy for TimeTracker Application

/**
 * PRIVACY PROTECTION GUIDELINES
 * 
 * This file documents our commitment to protecting user privacy and sensitive data.
 * All developers and administrators must follow these guidelines.
 */

/**
 * SENSITIVE DATA CLASSIFICATION
 * 
 * CRITICAL (Must be encrypted at rest):
 * - Hourly wages and salary information
 * - Calculated earnings
 * - Work duration and hours
 * - Sharing codes (temporary but sensitive)
 * 
 * PRIVATE (Access restricted to owner only):
 * - Clock-in/out timestamps
 * - Time entries and sessions
 * - Personal work patterns
 * 
 * PERSONAL (Standard protection):
 * - Names and email addresses
 * - Profile information
 * - Connection relationships
 */

/**
 * LOGGING POLICY
 * 
 * NEVER LOG:
 * - Hourly wages, salaries, or earnings amounts
 * - Sharing codes or authentication tokens
 * - Work duration or time calculations
 * - Personal financial information
 * 
 * SAFE TO LOG:
 * - User IDs (for debugging)
 * - API endpoints accessed
 * - Error types (without sensitive details)
 * - General system events
 */

/**
 * DATA ACCESS RULES
 * 
 * 1. Users can only access their OWN sensitive data
 * 2. Sharing codes must rotate automatically for security
 * 3. Wage information must be encrypted in database
 * 4. All API responses must be sanitized
 * 5. Logs must not contain sensitive information
 * 6. Developers cannot access user financial data
 */

export const PRIVACY_POLICY = {
  DATA_RETENTION: {
    SHARING_CODES: '5 minutes (auto-rotation)',
    TIME_ENTRIES: 'Until user deletion',
    WAGE_DATA: 'Encrypted, user-controlled'
  },
  
  ACCESS_CONTROL: {
    OWN_DATA_ONLY: true,
    ADMIN_ACCESS_TO_SENSITIVE: false,
    DEVELOPER_ACCESS_TO_WAGES: false
  },
  
  ENCRYPTION: {
    REQUIRED_FOR: ['wages', 'earnings', 'salaryData'],
    ALGORITHM: 'AES-256-GCM',
    KEY_ROTATION: 'Manual (on security incidents)'
  }
};

/**
 * COMPLIANCE CHECKLIST
 * 
 * ✅ Wage data encrypted at rest
 * ✅ Sharing codes rotate automatically
 * ✅ Logs sanitized of sensitive data
 * ✅ API responses filtered by user ownership
 * ✅ No developer access to financial info
 * ✅ Privacy headers on all responses
 * ✅ Secure code generation (crypto random)
 * ✅ Input validation and sanitization
 */
