// Rate limiting utility for security
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  isAllowed(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = identifier;

    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return true;
    }

    if (this.store[key].count >= limit) {
      return false;
    }

    this.store[key].count++;
    return true;
  }

  getRemainingAttempts(identifier: string, windowMs: number): number {
    const now = Date.now();
    const key = identifier;

    if (!this.store[key] || this.store[key].resetTime <= now) {
      return 0;
    }

    return Math.max(0, this.store[key].count);
  }

  getResetTime(identifier: string): number | null {
    return this.store[identifier]?.resetTime || null;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instances for different use cases
export const authRateLimiter = new RateLimiter(); // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(); // 100 requests per minute
export const passwordResetRateLimiter = new RateLimiter(); // 3 attempts per hour

// Helper functions
export const isAuthAllowed = (identifier: string) => 
  authRateLimiter.isAllowed(identifier, 5, 15 * 60 * 1000);

export const isApiAllowed = (identifier: string) => 
  apiRateLimiter.isAllowed(identifier, 100, 60 * 1000);

export const isPasswordResetAllowed = (identifier: string) => 
  passwordResetRateLimiter.isAllowed(identifier, 3, 60 * 60 * 1000);
