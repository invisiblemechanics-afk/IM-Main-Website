import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  query,
  where,
  collection,
  getDocs,
  limit
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

// Create or update user profile with phone and username
export async function createOrUpdateUserProfile(
  user: User,
  additionalData: {
    phoneNumber?: string;
    username?: string;
  } = {}
): Promise<UserProfile> {
  const userRef = doc(firestore, 'users', user.uid);
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: additionalData.phoneNumber || user.phoneNumber,
    username: additionalData.username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // If we have a username, check if it's unique
  if (additionalData.username) {
    const isUnique = await isUsernameUnique(additionalData.username, user.uid);
    if (!isUnique) {
      throw new Error('Username is already taken');
    }
  }

  // If we have a phone number, check if it's unique
  if (additionalData.phoneNumber) {
    const isUnique = await isPhoneNumberUnique(additionalData.phoneNumber, user.uid);
    if (!isUnique) {
      throw new Error('Phone number is already registered');
    }
  }

  // Check if user already exists
  const existingDoc = await getDoc(userRef);
  if (existingDoc.exists()) {
    // Update existing user, preserve createdAt
    const existingData = existingDoc.data();
    profile.createdAt = existingData.createdAt;
    
    // Only update fields that are provided
    const updateData: Partial<UserProfile> = {
      updatedAt: serverTimestamp()
    };
    
    if (additionalData.phoneNumber !== undefined) {
      updateData.phoneNumber = additionalData.phoneNumber;
    }
    if (additionalData.username !== undefined) {
      updateData.username = additionalData.username;
    }
    if (user.email !== existingData.email) {
      updateData.email = user.email;
    }
    if (user.displayName !== existingData.displayName) {
      updateData.displayName = user.displayName;
    }
    if (user.photoURL !== existingData.photoURL) {
      updateData.photoURL = user.photoURL;
    }

    await setDoc(userRef, updateData, { merge: true });
    return { ...existingData, ...updateData } as UserProfile;
  } else {
    // Create new user
    await setDoc(userRef, profile);
    return profile;
  }
}

// Get user profile by ID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(firestore, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  return null;
}

// Check if username is unique (excluding current user)
export async function isUsernameUnique(username: string, excludeUid?: string): Promise<boolean> {
  const usersQuery = query(
    collection(firestore, 'users'),
    where('username', '==', username),
    limit(1)
  );
  
  const snapshot = await getDocs(usersQuery);
  
  if (snapshot.empty) {
    return true;
  }
  
  // If there's a result, check if it's the current user
  const doc = snapshot.docs[0];
  return excludeUid ? doc.id === excludeUid : false;
}

// Check if phone number is unique (excluding current user)
export async function isPhoneNumberUnique(phoneNumber: string, excludeUid?: string): Promise<boolean> {
  const usersQuery = query(
    collection(firestore, 'users'),
    where('phoneNumber', '==', phoneNumber),
    limit(1)
  );
  
  const snapshot = await getDocs(usersQuery);
  
  if (snapshot.empty) {
    return true;
  }
  
  // If there's a result, check if it's the current user
  const doc = snapshot.docs[0];
  return excludeUid ? doc.id === excludeUid : false;
}

// Generate a unique username from display name or email
export function generateUsernameFromUser(user: User): string {
  let base = '';
  
  if (user.displayName) {
    base = user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (user.email) {
    base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (user.phoneNumber) {
    base = 'user' + user.phoneNumber.slice(-6);
  } else {
    base = 'user' + user.uid.slice(0, 8);
  }
  
  return base || 'user' + user.uid.slice(0, 8);
}



