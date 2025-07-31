import admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Converts a chapter name to a slug format (lowercase with hyphens)
 * @param name - The chapter name to convert
 * @returns The slug format of the name
 */
function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Counts questions in a specific subcollection for a chapter
 * @param chapterId - The chapter document ID
 * @param subcollectionName - The name of the subcollection to count
 * @returns The number of documents in the subcollection
 */
async function countQuestionsInSubcollection(chapterId: string, subcollectionName: string): Promise<number> {
  try {
    const subcollectionRef = db.collection('Chapters').doc(chapterId).collection(subcollectionName);
    const snapshot = await subcollectionRef.get();
    return snapshot.size;
  } catch (error) {
    console.warn(`Error counting questions in ${subcollectionName} for chapter ${chapterId}:`, error);
    return 0;
  }
}

/**
 * Updates all chapter documents with the new required fields
 */
export async function updateChapters() {
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
    
    const currentTime = admin.firestore.FieldValue.serverTimestamp();
    
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

// Run if executed directly
if (require.main === module) {
  updateChapters()
    .then(() => {
      console.log('Chapter update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Chapter update failed:', error);
      process.exit(1);
    });
}