import { Timestamp } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function formatDistanceToNow(timestamp: Timestamp): string {
  const now = new Date();
  const date = timestamp.toDate();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .slice(0, 50); // Limit length
}

export function sanitizeMarkdown(markdown: string): string {
  // Convert markdown to HTML
  const html = marked(markdown, {
    breaks: true,
    gfm: true,
  });

  // Sanitize HTML
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_PROTOCOLS: ['http', 'https', 'mailto'],
  });
}

export function calculateHotScore(score: number, createdAt: Timestamp): number {
  const hours = (Date.now() - createdAt.toMillis()) / (1000 * 60 * 60);
  return score / Math.pow(hours + 2, 0.8);
}

export function extractExcerpt(markdown: string, maxLength: number = 200): string {
  // Remove markdown syntax for preview
  const text = markdown
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[^`]*```/g, '') // Code blocks
    .replace(/\n+/g, ' ') // Multiple newlines
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}



