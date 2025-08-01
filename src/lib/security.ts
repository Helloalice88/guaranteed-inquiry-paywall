import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input validation schemas
export const emailSchema = z
  .string()
  .email('Email invalide')
  .min(5, 'Email trop court')
  .max(254, 'Email trop long')
  .refine(
    (email) => {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    'Format d\'email invalide'
  );

export const messageSchema = z
  .string()
  .min(10, 'Le message doit contenir au moins 10 caractères')
  .max(10000, 'Le message ne peut pas dépasser 10 000 caractères')
  .refine(
    (content) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(content));
    },
    'Contenu non autorisé détecté'
  );

export const fileValidationSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(25 * 1024 * 1024, 'Fichier trop volumineux (max 25MB)'),
  type: z.string().refine(
    (type) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      return allowedTypes.includes(type);
    },
    'Type de fichier non autorisé'
  )
});

// Content sanitization
export const sanitizeHtml = (content: string): string => {
  if (typeof window === 'undefined') {
    // Server-side fallback - basic escaping
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Client-side sanitization with DOMPurify
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

export const sanitizeText = (text: string): string => {
  // Remove any potential XSS vectors from plain text
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
    .trim();
};

// Email validation with additional security checks
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    const sanitizedEmail = sanitizeText(email);
    emailSchema.parse(sanitizedEmail);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Email invalide' };
  }
};

// Message validation with content sanitization
export const validateMessage = (message: string): { isValid: boolean; sanitized?: string; error?: string } => {
  try {
    const sanitized = sanitizeHtml(message);
    messageSchema.parse(sanitized);
    return { isValid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Message invalide' };
  }
};

// File validation
export const validateFiles = (files: File[]): { isValid: boolean; errors?: string[] } => {
  if (files.length > 2) {
    return { isValid: false, errors: ['Maximum 2 fichiers autorisés'] };
  }

  const errors: string[] = [];
  
  for (const file of files) {
    try {
      fileValidationSchema.parse({
        name: file.name,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`${file.name}: ${error.errors[0]?.message}`);
      } else {
        errors.push(`${file.name}: Fichier invalide`);
      }
    }
  }

  return errors.length > 0 
    ? { isValid: false, errors }
    : { isValid: true };
};

// Rate limiting storage (client-side basic protection)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimit.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security headers for fetch requests
export const getSecureHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
});