import { z } from 'zod';

// Thread schemas
export const createThreadSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  bodyMarkdown: z.string()
    .min(10, 'Body must be at least 10 characters')
    .max(10000, 'Body must be less than 10,000 characters'),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  // For embedded breakdown context
  problemId: z.string().optional(),
  slideId: z.string().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  threadId: z.string(),
  bodyMarkdown: z.string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5,000 characters'),
  parentId: z.string().nullable().optional(),
});

// Vote schemas
export const voteSchema = z.object({
  targetType: z.enum(['thread', 'comment']),
  targetId: z.string(),
  value: z.literal(1).or(z.literal(-1)),
});

// Query schemas
export const threadsQuerySchema = z.object({
  sort: z.enum(['hot', 'new', 'top']).default('hot'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  timeFilter: z.enum(['today', 'week', 'month', 'year', 'all']).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

// Image upload schema
export const imageUploadSchema = z.object({
  fileName: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024, 'Image must be less than 5MB'),
});



