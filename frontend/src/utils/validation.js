/**
 * Form Validation Utilities
 * Production-grade validation functions for user inputs
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }

    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (email.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true, error: '' };
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, error: string, strength: string }
 */
export const validatePassword = (password) => {
    if (!password || password.trim() === '') {
        return { isValid: false, error: 'Password is required', strength: 'none' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long (max 128 characters)', strength: 'weak' };
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strengthScore < 3) {
        return {
            isValid: false,
            error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters',
            strength: 'weak'
        };
    }

    const strength = strengthScore === 4 ? 'strong' : 'medium';
    return { isValid: true, error: '', strength };
};

/**
 * Validates username
 * @param {string} username - Username to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateUsername = (username) => {
    if (!username || username.trim() === '') {
        return { isValid: false, error: 'Username is required' };
    }

    if (username.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters long' };
    }

    if (username.length > 30) {
        return { isValid: false, error: 'Username must be less than 30 characters' };
    }

    // Allow alphanumeric, underscore, and hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    return { isValid: true, error: '' };
};

/**
 * Validates phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return { isValid: true, error: '' }; // Phone is optional
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
        return { isValid: false, error: 'Phone number must be at least 10 digits' };
    }

    if (digitsOnly.length > 15) {
        return { isValid: false, error: 'Phone number is too long' };
    }

    return { isValid: true, error: '' };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .slice(0, 1000); // Limit length to prevent DoS
};

/**
 * Validates OTP code
 * @param {string} otp - OTP code to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateOTP = (otp) => {
    if (!otp || otp.trim() === '') {
        return { isValid: false, error: 'Verification code is required' };
    }

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
        return { isValid: false, error: 'Verification code must be 6 digits' };
    }

    return { isValid: true, error: '' };
};

/**
 * Rate limiting helper (client-side)
 * @param {string} key - Unique key for the action
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} - { allowed: boolean, remainingAttempts: number, resetTime: number }
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const storageKey = `rateLimit_${key}`;

    try {
        const data = JSON.parse(localStorage.getItem(storageKey) || '{"attempts":[],"blocked":false}');

        // Remove old attempts outside the window
        data.attempts = data.attempts.filter(timestamp => now - timestamp < windowMs);

        // Check if blocked
        if (data.blocked && data.blockUntil > now) {
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: data.blockUntil
            };
        }

        // Check if limit exceeded
        if (data.attempts.length >= maxAttempts) {
            data.blocked = true;
            data.blockUntil = now + windowMs;
            localStorage.setItem(storageKey, JSON.stringify(data));

            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: data.blockUntil
            };
        }

        // Add current attempt
        data.attempts.push(now);
        data.blocked = false;
        localStorage.setItem(storageKey, JSON.stringify(data));

        return {
            allowed: true,
            remainingAttempts: maxAttempts - data.attempts.length,
            resetTime: null
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        return { allowed: true, remainingAttempts: maxAttempts, resetTime: null };
    }
};

/**
 * Clears rate limit for a specific key
 * @param {string} key - Unique key for the action
 */
export const clearRateLimit = (key) => {
    const storageKey = `rateLimit_${key}`;
    localStorage.removeItem(storageKey);
};
