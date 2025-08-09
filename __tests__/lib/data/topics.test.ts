import { getDocs, collection, orderBy, query } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { getAllTopicsWithURLs, TopicWithURL } from '../../../src/lib/data/topics';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
}));

jest.mock('../../../src/lib/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock console methods to avoid noise in tests
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('getAllTopicsWithURLs', () => {
  const mockCollection = collection as jest.MockedFunction<typeof collection>;
  const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
  const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
  const mockQuery = query as jest.MockedFunction<typeof query>;
  const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>;
  const mockRef = ref as jest.MockedFunction<typeof ref>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('should return topics ordered by order field with resolved URLs', async () => {
    // Mock Firestore response
    const mockDocs = [
      {
        id: 'topic1',
        data: () => ({
          title: 'Introduction to Vectors',
          order: 1,
          storagePath: 'videos/topic1.mp4',
          thumbnailPath: 'thumbnails/topic1.jpg',
          durationSec: 300,
          prereq: [],
        }),
      },
      {
        id: 'topic2',
        data: () => ({
          title: 'Vector Addition',
          order: 2,
          storagePath: 'videos/topic2.mp4',
          thumbnailPath: 'thumbnails/topic2.jpg',
          durationSec: 450,
          prereq: ['topic1'],
        }),
      },
    ];

    mockCollection.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockGetDocs.mockResolvedValue({
      docs: mockDocs,
    } as any);

    // Mock storage URL resolution
    mockRef.mockReturnValue({} as any);
    mockGetDownloadURL
      .mockResolvedValueOnce('https://storage.example.com/videos/topic1.mp4')
      .mockResolvedValueOnce('https://storage.example.com/thumbnails/topic1.jpg')
      .mockResolvedValueOnce('https://storage.example.com/videos/topic2.mp4')
      .mockResolvedValueOnce('https://storage.example.com/thumbnails/topic2.jpg');

    const result = await getAllTopicsWithURLs();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'topic1',
      title: 'Introduction to Vectors',
      order: 1,
      videoURL: 'https://storage.example.com/videos/topic1.mp4',
      thumbnailURL: 'https://storage.example.com/thumbnails/topic1.jpg',
      durationSec: 300,
      prereq: [],
    });
    expect(result[1]).toEqual({
      id: 'topic2',
      title: 'Vector Addition',
      order: 2,
      videoURL: 'https://storage.example.com/videos/topic2.mp4',
      thumbnailURL: 'https://storage.example.com/thumbnails/topic2.jpg',
      durationSec: 450,
      prereq: ['topic1'],
    });

    // Verify Firestore query was constructed correctly
    expect(mockCollection).toHaveBeenCalledWith({}, 'topics');
    expect(mockOrderBy).toHaveBeenCalledWith('order', 'asc');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should handle missing prereq field gracefully', async () => {
    const mockDocs = [
      {
        id: 'topic1',
        data: () => ({
          title: 'Topic without prereqs',
          order: 1,
          storagePath: 'videos/topic1.mp4',
          thumbnailPath: 'thumbnails/topic1.jpg',
          durationSec: 300,
          // Note: no prereq field
        }),
      },
    ];

    mockGetDocs.mockResolvedValue({ docs: mockDocs } as any);
    mockGetDownloadURL
      .mockResolvedValueOnce('https://storage.example.com/videos/topic1.mp4')
      .mockResolvedValueOnce('https://storage.example.com/thumbnails/topic1.jpg');

    const result = await getAllTopicsWithURLs();

    expect(result).toHaveLength(1);
    expect(result[0].prereq).toEqual([]);
  });

  it('should skip topics with failed storage URL resolution and log warning', async () => {
    const mockDocs = [
      {
        id: 'topic1',
        data: () => ({
          title: 'Working Topic',
          order: 1,
          storagePath: 'videos/topic1.mp4',
          thumbnailPath: 'thumbnails/topic1.jpg',
          durationSec: 300,
          prereq: [],
        }),
      },
      {
        id: 'topic2',
        data: () => ({
          title: 'Broken Topic',
          order: 2,
          storagePath: 'videos/missing.mp4',
          thumbnailPath: 'thumbnails/missing.jpg',
          durationSec: 450,
          prereq: [],
        }),
      },
    ];

    mockGetDocs.mockResolvedValue({ docs: mockDocs } as any);

    // First topic succeeds, second fails
    mockGetDownloadURL
      .mockResolvedValueOnce('https://storage.example.com/videos/topic1.mp4')
      .mockResolvedValueOnce('https://storage.example.com/thumbnails/topic1.jpg')
      .mockRejectedValueOnce(new Error('File not found'))
      .mockRejectedValueOnce(new Error('File not found'));

    const result = await getAllTopicsWithURLs();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('topic1');
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      'Failed to resolve storage URLs for topic topic2:',
      expect.any(Error)
    );
  });

  it('should return empty array if Firestore query fails', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore connection failed'));

    const result = await getAllTopicsWithURLs();

    expect(result).toEqual([]);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Failed to fetch topics from Firestore:',
      expect.any(Error)
    );
  });

  it('should handle empty collection gracefully', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] } as any);

    const result = await getAllTopicsWithURLs();

    expect(result).toEqual([]);
  });
});