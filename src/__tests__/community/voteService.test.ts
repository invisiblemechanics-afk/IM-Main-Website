import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { voteService } from '@/services/community';
import { runTransaction } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
  increment: jest.fn((value) => ({ _increment: value })),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
}));

jest.mock('../../lib/firebase', () => ({
  firestore: {},
}));

describe('Vote Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('vote', () => {
    it('should create a new vote when none exists', async () => {
      const mockTransaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref.path?.includes('votes')) {
            return { exists: () => false };
          }
          return { exists: () => true };
        }),
        set: jest.fn(),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation((db, callback) => 
        callback(mockTransaction)
      );

      await voteService.vote('user123', 'thread', 'thread456', 1);

      expect(mockTransaction.set).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: { _increment: 1 }
        })
      );
    });

    it('should remove vote when voting the same value', async () => {
      const mockTransaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref.path?.includes('votes')) {
            return { 
              exists: () => true,
              data: () => ({ value: 1, userId: 'user123' })
            };
          }
          return { exists: () => true };
        }),
        delete: jest.fn(),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation((db, callback) => 
        callback(mockTransaction)
      );

      await voteService.vote('user123', 'thread', 'thread456', 1);

      expect(mockTransaction.delete).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: { _increment: -1 }
        })
      );
    });

    it('should change vote when voting opposite value', async () => {
      const mockTransaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref.path?.includes('votes')) {
            return { 
              exists: () => true,
              data: () => ({ value: -1, userId: 'user123' })
            };
          }
          return { exists: () => true };
        }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation((db, callback) => 
        callback(mockTransaction)
      );

      await voteService.vote('user123', 'thread', 'thread456', 1);

      // First update is for the vote
      expect(mockTransaction.update).toHaveBeenNthCalledWith(1,
        expect.anything(),
        expect.objectContaining({
          value: 1
        })
      );

      // Second update is for the score (from -1 to 1 is a +2 change)
      expect(mockTransaction.update).toHaveBeenNthCalledWith(2,
        expect.anything(),
        expect.objectContaining({
          score: { _increment: 2 }
        })
      );
    });

    it('should throw error when target does not exist', async () => {
      const mockTransaction = {
        get: jest.fn().mockImplementation(() => ({
          exists: () => false
        })),
      };

      (runTransaction as jest.Mock).mockImplementation((db, callback) => 
        callback(mockTransaction)
      );

      await expect(
        voteService.vote('user123', 'thread', 'thread456', 1)
      ).rejects.toThrow('thread not found');
    });
  });
});



