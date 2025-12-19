/**
 * Input validation utilities for production-ready security
 */

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove inline event handlers
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate URL format (HTTPS only)
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate chemical quantity
export function validateQuantity(value: string | number): { valid: boolean; error?: string; value?: number } {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Quantity cannot be negative' };
  }
  
  if (num > 1000000) {
    return { valid: false, error: 'Quantity exceeds maximum limit (1,000,000)' };
  }
  
  return { valid: true, value: num };
}

// Validate CAS number format (e.g., 67-64-1)
export function isValidCASNumber(cas: string): boolean {
  const casRegex = /^\d{2,7}-\d{2}-\d$/;
  return casRegex.test(cas.trim());
}

// Validate chemical formula (basic check)
export function isValidChemicalFormula(formula: string): boolean {
  // Allow letters, numbers, parentheses, and basic symbols
  const formulaRegex = /^[A-Z][a-z]?(\d+)?(\([A-Z][a-z]?\d*\)\d*)*$/;
  return formulaRegex.test(formula.trim()) || formula.trim().length > 0;
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
  
  reset(identifier: string) {
    this.requests.delete(identifier);
  }
}

// Validate file upload (CSV)
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, waitMs);
  };
}

// Validate and sanitize chemical data
export function validateChemicalData(data: any): { valid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required');
  }
  
  const qtyValidation = validateQuantity(data.quantity);
  if (!qtyValidation.valid) {
    errors.push(qtyValidation.error!);
  }
  
  if (data.casNumber && !isValidCASNumber(data.casNumber)) {
    errors.push('Invalid CAS number format');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    sanitized: {
      name: sanitizeString(data.name),
      formula: data.formula ? sanitizeString(data.formula) : '',
      quantity: qtyValidation.value,
      unit: data.unit || 'g',
      casNumber: data.casNumber ? sanitizeString(data.casNumber) : '',
      category: data.category ? sanitizeString(data.category) : 'General',
    }
  };
}
