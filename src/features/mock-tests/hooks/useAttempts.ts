import { useState, useEffect } from 'react';
import { getRecentAttempts, hasUserAttemptedTest, getUserTestAttempt, MockTestAttempt } from '../../../services/mockTestAttempts';
import { useAuth } from '../../../context/AuthContext';

/**
 * Hook to get recent attempts for the current user
 */
export function useRecentAttempts(limitCount: number = 10) {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<MockTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttempts() {
      if (!user) {
        setAttempts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const recentAttempts = await getRecentAttempts(user.uid, limitCount);
        setAttempts(recentAttempts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent attempts');
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAttempts();
  }, [user, limitCount]);

  return { attempts, loading, error, refetch: () => fetchAttempts() };
}

/**
 * Hook to check if user has attempted a specific test
 */
export function useTestAttempt(testId: string) {
  const { user } = useAuth();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [attempt, setAttempt] = useState<MockTestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAttempt() {
      if (!user || !testId) {
        setHasAttempted(false);
        setAttempt(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const [attempted, userAttempt] = await Promise.all([
          hasUserAttemptedTest(testId, user.uid),
          getUserTestAttempt(testId, user.uid)
        ]);
        
        setHasAttempted(attempted);
        setAttempt(userAttempt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check test attempt');
        setHasAttempted(false);
        setAttempt(null);
      } finally {
        setLoading(false);
      }
    }

    checkAttempt();
  }, [user, testId]);

  return { hasAttempted, attempt, loading, error, refetch: () => checkAttempt() };
}
