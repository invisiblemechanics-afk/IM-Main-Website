import { auth } from '../firebase';
import { Author } from '../community/models';
import { getUserProfile, generateUsernameFromUser } from './userProfile';

export async function getCurrentUser(): Promise<Author | null> {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }

  // Try to get user profile from Firestore
  try {
    const profile = await getUserProfile(user.uid);
    
    if (profile && profile.username) {
      return {
        id: user.uid,
        username: profile.username,
        displayName: user.displayName,
        avatarUrl: user.photoURL
      };
    }
  } catch (error) {
    console.warn('Could not fetch user profile:', error);
  }

  // Fallback: derive username from available data
  const username = generateUsernameFromUser(user);

  return {
    id: user.uid,
    username,
    displayName: user.displayName,
    avatarUrl: user.photoURL
  };
}

// Synchronous version for backwards compatibility (uses cached data only)
export function getCurrentUserSync(): Author | null {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }

  // Use fallback username generation for sync calls
  const username = generateUsernameFromUser(user);

  return {
    id: user.uid,
    username,
    displayName: user.displayName,
    avatarUrl: user.photoURL
  };
}

export async function requireAuth(): Promise<Author> {
  const author = await getCurrentUser();
  
  if (!author) {
    throw new Error('Authentication required');
  }
  
  return author;
}
