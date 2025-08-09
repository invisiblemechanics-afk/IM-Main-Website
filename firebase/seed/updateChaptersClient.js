/**
 * Script to update chapter documents using Firebase Client SDK
 * This uses the same Firebase configuration as the frontend app
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Firebase configuration (same as in your frontend)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'invisible-mechanics---2.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'invisible-mechanics---2',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'invisible-mechanics---2.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456789012345678',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

/**
 * Converts a chapter name to a slug format (lowercase with hyphens)
 */
function createSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Counts questions in a specific subcollection for a chapter
 */
async function countQuestionsInSubcollection(chapterId, subcollectionName) {
  try {
    const chapterDocRef = doc(firestore, 'Chapters', chapterId);
    const subcollectionRef = collection(chapterDocRef, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    return snapshot.size;
  } catch (error) {
    console.warn(`Error counting questions in ${subcollectionName} for chapter ${chapterId}:`, error.message);
    return 0;
  }
}

/**
 * Gets all chapters from Firestore
 */
async function getAllChapters() {
  try {
    console.log('Fetching chapters from Firestore...');
    
    const chaptersCollection = collection(firestore, 'Chapters');
    const querySnapshot = await getDocs(chaptersCollection);

    console.log(`Found ${querySnapshot.docs.length} chapters in Firestore`);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
      ref: doc.ref
    }));
    
  } catch (error) {
    console.error('Failed to fetch chapters from Firestore:', error);
    throw error;
  }
}

/**
 * Updates a single chapter document
 */
async function updateChapter(chapter) {
  const chapterId = chapter.id;
  const existingData = chapter.data;
  
  console.log(`Processing chapter: ${chapterId}`);
  
  // Get chapter name from existing data or use document ID as fallback
  const chapterName = existingData.name || chapterId;
  
  // Count questions in each type of subcollection
  const [
    questionCountBreakdowns,
    questionCountPractice,
    questionCountTest
  ] = await Promise.all([
    countQuestionsInSubcollection(chapterId, `${chapterName}-Breakdowns`),
    countQuestionsInSubcollection(chapterId, `${chapterName}-Practice-Questions`),
    countQuestionsInSubcollection(chapterId, `${chapterName}-Test-Questions`)
  ]);
  
  // Prepare the update data
  const updateData = {
    // Only add createdAt if it doesn't already exist
    updatedAt: serverTimestamp(), // Always update this field
    name: chapterName,
    slug: createSlug(chapterName),
    questionCountBreakdowns,
    questionCountPractice,
    questionCountTest,
    subject: 'Physics',
    section: '', // Leave blank as requested
  };
  
  // Add createdAt only if it doesn't exist
  if (!existingData.createdAt) {
    updateData.createdAt = serverTimestamp();
  }
  
  // Update the document
  await updateDoc(chapter.ref, updateData);
  
  console.log(`✅ Updated chapter: ${chapterName}`);
  console.log(`   - Slug: ${updateData.slug}`);
  console.log(`   - Breakdown Questions: ${questionCountBreakdowns}`);
  console.log(`   - Practice Questions: ${questionCountPractice}`);
  console.log(`   - Test Questions: ${questionCountTest}`);
  console.log(`   - Subject: ${updateData.subject}`);
  console.log('');
}

/**
 * Main function to update all chapters
 */
async function updateAllChapters() {
  console.log('Starting chapter update process using Firebase Client SDK...');
  
  try {
    const chapters = await getAllChapters();
    
    if (chapters.length === 0) {
      console.log('No chapters to update');
      return;
    }
    
    console.log(`Updating ${chapters.length} chapters...`);
    
    for (const chapter of chapters) {
      await updateChapter(chapter);
    }
    
    console.log('All chapters updated successfully!');
    
  } catch (error) {
    console.error('Error updating chapters:', error);
    throw error;
  }
}

// Run the function
updateAllChapters()
  .then(() => {
    console.log('Chapter update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Chapter update failed:', error);
    process.exit(1);
  });