/**
 * Script to update chapter documents using Firebase CLI
 * This approach uses the Firebase Admin SDK with the project configuration
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Try to initialize with Firebase CLI credentials
const projectId = 'invisible-mechanics---2';

// Initialize app
let app;
try {
  app = initializeApp({
    projectId: projectId
  });
} catch (error) {
  console.log('Error initializing Firebase:', error.message);
  console.log('\nPlease ensure you have the proper credentials set up.');
  console.log('You can try one of these options:');
  console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.log('2. Use Firebase emulator: firebase emulators:exec --only firestore "node this-script.js"');
  console.log('3. Set up a service account key');
  process.exit(1);
}

const db = getFirestore(app);

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
    const subcollectionRef = db.collection('Chapters').doc(chapterId).collection(subcollectionName);
    const snapshot = await subcollectionRef.get();
    return snapshot.size;
  } catch (error) {
    console.warn(`Error counting questions in ${subcollectionName} for chapter ${chapterId}:`, error.message);
    return 0;
  }
}

/**
 * Updates all chapter documents with the new required fields
 */
async function updateChapters() {
  console.log('Starting chapter update process...');
  
  try {
    // Get all existing chapter documents
    const chaptersRef = db.collection('Chapters');
    const snapshot = await chaptersRef.get();
    
    if (snapshot.empty) {
      console.log('No chapters found in the Chapters collection');
      return;
    }
    
    console.log(`Found ${snapshot.size} chapters to update`);
    
    const currentTime = new Date();
    
    for (const doc of snapshot.docs) {
      const chapterId = doc.id;
      const existingData = doc.data();
      
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
        // Only add these fields if they don't already exist
        createdAt: existingData.createdAt || currentTime,
        updatedAt: currentTime, // Always update this field
        name: chapterName,
        slug: createSlug(chapterName),
        questionCountBreakdowns,
        questionCountPractice,
        questionCountTest,
        subject: 'Physics',
        section: '', // Leave blank as requested
      };
      
      // Update the document
      await doc.ref.update(updateData);
      
      console.log(`✅ Updated chapter: ${chapterName}`);
      console.log(`   - Slug: ${updateData.slug}`);
      console.log(`   - Breakdown Questions: ${questionCountBreakdowns}`);
      console.log(`   - Practice Questions: ${questionCountPractice}`);
      console.log(`   - Test Questions: ${questionCountTest}`);
      console.log(`   - Subject: ${updateData.subject}`);
      console.log('');
    }
    
    console.log('All chapters updated successfully!');
    
  } catch (error) {
    console.error('Error updating chapters:', error);
    throw error;
  }
}

// Run the function
updateChapters()
  .then(() => {
    console.log('Chapter update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Chapter update failed:', error);
    process.exit(1);
  });