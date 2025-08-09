/**
 * Script to update chapter documents using Firebase REST API
 * This approach doesn't require Firebase Admin SDK credentials
 */

import https from 'https';
import fs from 'fs';

const PROJECT_ID = 'invisible-mechanics---2';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Makes a REST API call to Firebase
 */
function makeFirebaseRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}. Response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Converts a JavaScript value to Firestore format
 */
function toFirestoreValue(value) {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    return { integerValue: value.toString() };
  } else if (typeof value === 'boolean') {
    return { booleanValue: value };
  } else if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (value === null || value === undefined) {
    return { nullValue: null };
  }
  return { stringValue: String(value) };
}

/**
 * Converts Firestore format to JavaScript value
 */
function fromFirestoreValue(firestoreValue) {
  if (firestoreValue.stringValue !== undefined) {
    return firestoreValue.stringValue;
  } else if (firestoreValue.integerValue !== undefined) {
    return parseInt(firestoreValue.integerValue);
  } else if (firestoreValue.booleanValue !== undefined) {
    return firestoreValue.booleanValue;
  } else if (firestoreValue.timestampValue !== undefined) {
    return new Date(firestoreValue.timestampValue);
  } else if (firestoreValue.nullValue !== undefined) {
    return null;
  }
  return null;
}

/**
 * Converts a chapter name to a slug format (lowercase with hyphens)
 */
function createSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Gets all chapters from Firestore
 */
async function getAllChapters() {
  try {
    console.log('Fetching chapters from Firestore...');
    const response = await makeFirebaseRequest('GET', '/Chapters');
    
    if (!response.documents) {
      console.log('No chapters found in the Chapters collection');
      return [];
    }
    
    const chapters = response.documents.map(doc => {
      const docId = doc.name.split('/').pop();
      const fields = {};
      
      if (doc.fields) {
        for (const [key, value] of Object.entries(doc.fields)) {
          fields[key] = fromFirestoreValue(value);
        }
      }
      
      return {
        id: docId,
        data: fields,
        fullPath: doc.name
      };
    });
    
    console.log(`Found ${chapters.length} chapters`);
    return chapters;
    
  } catch (error) {
    if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
      console.error('Authentication error. You need to:');
      console.error('1. Get a Firebase token: firebase login:ci');
      console.error('2. Set the token as environment variable: $env:FIREBASE_TOKEN="your-token"');
      console.error('3. Or use Firebase Admin SDK with proper credentials');
    }
    throw error;
  }
}

/**
 * Counts questions in a subcollection
 */
async function countQuestionsInSubcollection(chapterId, subcollectionName) {
  try {
    const path = `/Chapters/${chapterId}/${subcollectionName}`;
    const response = await makeFirebaseRequest('GET', path);
    
    return response.documents ? response.documents.length : 0;
  } catch (error) {
    console.warn(`Error counting questions in ${subcollectionName} for chapter ${chapterId}:`, error.message);
    return 0;
  }
}

/**
 * Updates a chapter document
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
  
  const currentTime = new Date();
  
  // Prepare the update data
  const updateData = {
    fields: {
      // Preserve existing fields
      ...Object.fromEntries(
        Object.entries(existingData).map(([key, value]) => [key, toFirestoreValue(value)])
      ),
      // Add or update new fields
      createdAt: existingData.createdAt ? toFirestoreValue(existingData.createdAt) : toFirestoreValue(currentTime),
      updatedAt: toFirestoreValue(currentTime),
      name: toFirestoreValue(chapterName),
      slug: toFirestoreValue(createSlug(chapterName)),
      questionCountBreakdowns: toFirestoreValue(questionCountBreakdowns),
      questionCountPractice: toFirestoreValue(questionCountPractice),
      questionCountTest: toFirestoreValue(questionCountTest),
      subject: toFirestoreValue('Physics'),
      section: toFirestoreValue(''),
    }
  };
  
  // Update the document
  const path = `/Chapters/${chapterId}`;
  await makeFirebaseRequest('PATCH', path, updateData);
  
  console.log(`✅ Updated chapter: ${chapterName}`);
  console.log(`   - Slug: ${createSlug(chapterName)}`);
  console.log(`   - Breakdown Questions: ${questionCountBreakdowns}`);
  console.log(`   - Practice Questions: ${questionCountPractice}`);
  console.log(`   - Test Questions: ${questionCountTest}`);
  console.log(`   - Subject: Physics`);
  console.log('');
  
  return updateData;
}

/**
 * Main function to update all chapters
 */
async function updateAllChapters() {
  console.log('Starting chapter update process using Firebase REST API...');
  
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
    console.error('Error updating chapters:', error.message);
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
    console.error('Chapter update failed:', error.message);
    process.exit(1);
  });