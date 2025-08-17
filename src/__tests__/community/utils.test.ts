import { describe, it, expect } from '@jest/globals';
import { 
  formatDistanceToNow, 
  generateSlug, 
  extractExcerpt,
  calculateHotScore 
} from '@/lib/community/utils';
import { Timestamp } from 'firebase/firestore';

describe('Community Utils', () => {
  describe('formatDistanceToNow', () => {
    it('should format recent timestamps correctly', () => {
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);
      expect(formatDistanceToNow(timestamp)).toBe('just now');
    });

    it('should format timestamps from minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 30);
      const timestamp = Timestamp.fromDate(date);
      expect(formatDistanceToNow(timestamp)).toBe('30m ago');
    });

    it('should format timestamps from hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 5);
      const timestamp = Timestamp.fromDate(date);
      expect(formatDistanceToNow(timestamp)).toBe('5h ago');
    });

    it('should format timestamps from days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const timestamp = Timestamp.fromDate(date);
      expect(formatDistanceToNow(timestamp)).toBe('3d ago');
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(generateSlug('Hello! World? Test#123')).toBe('hello-world-test123');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world');
    });

    it('should limit slug length', () => {
      const longTitle = 'This is a very long title that should be truncated to fit within the maximum allowed length';
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });

  describe('extractExcerpt', () => {
    it('should extract excerpt from markdown', () => {
      const markdown = '# Hello\n\nThis is a **test** with [link](url) and `code`.';
      const excerpt = extractExcerpt(markdown, 50);
      expect(excerpt).toBe('Hello This is a test with link and code.');
    });

    it('should truncate long text', () => {
      const longText = 'Lorem ipsum '.repeat(50);
      const excerpt = extractExcerpt(longText, 100);
      expect(excerpt.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
    });

    it('should handle code blocks', () => {
      const markdown = 'Text before\n```js\nconst x = 1;\n```\nText after';
      const excerpt = extractExcerpt(markdown);
      expect(excerpt).toBe('Text before Text after');
    });
  });

  describe('calculateHotScore', () => {
    it('should calculate hot score correctly', () => {
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);
      const score = calculateHotScore(100, timestamp);
      
      // Score should be high for recent posts with high score
      expect(score).toBeGreaterThan(40);
    });

    it('should decay score over time', () => {
      const now = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 7);
      
      const recentTimestamp = Timestamp.fromDate(now);
      const oldTimestamp = Timestamp.fromDate(oldDate);
      
      const recentScore = calculateHotScore(100, recentTimestamp);
      const oldScore = calculateHotScore(100, oldTimestamp);
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });
});



