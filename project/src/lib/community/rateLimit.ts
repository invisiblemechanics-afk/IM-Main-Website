interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor() {
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime < now) {
        this.limits.delete(key);
      }
    }
  }

  check(userId: string, action: string, limit: number, windowMs: number): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingTime(userId: string, action: string): number {
    const key = `${userId}:${action}`;
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }
}

export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  THREAD_CREATE: { limit: 5, window: 60 * 60 * 1000 }, // 5 per hour
  COMMENT_CREATE: { limit: 20, window: 60 * 60 * 1000 }, // 20 per hour
  VOTE: { limit: 100, window: 60 * 60 * 1000 }, // 100 per hour
  IMAGE_UPLOAD: { limit: 10, window: 60 * 60 * 1000 }, // 10 per hour
};



