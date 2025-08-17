/**
 * Browser-based Database Migration Script
 * 
 * Copy and paste this script into your browser console while on your Firebase project
 * to clean up the database structure.
 * 
 * IMPORTANT: 
 * 1. Make sure you have admin access to your Firebase project
 * 2. Backup your database before running this script
 * 3. Test on a development database first
 */

// Helper function to log with timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function migrateDatabaseInBrowser() {
  log('Starting database migration in browser...', 'info');
  
  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      throw new Error('Firebase is not available. Make sure you are on the Firebase console or a page with Firebase loaded.');
    }
    
    const db = firebase.firestore();
    
    // Step 1: Migrate usernames
    await migrateUsernames(db);
    
    // Step 2: Clean up collections
    await cleanupCollections(db);
    
    log('Migration completed successfully!', 'success');
    log('Database structure is now organized', 'success');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    console.error(error);
  }
}

async function migrateUsernames(db) {
  log('Migrating usernames from usernames collection to users collection...', 'info');
  
  try {
    const usernamesSnapshot = await db.collection('usernames').get();
    
    if (usernamesSnapshot.empty) {
      log('No usernames found to migrate', 'info');
      return;
    }
    
    log(`Found ${usernamesSnapshot.docs.length} usernames to migrate`, 'info');
    
    const batch = db.batch();
    let count = 0;
    
    usernamesSnapshot.docs.forEach(doc => {
      const username = doc.id;
      const data = doc.data();
      const uid = data.uid;
      
      if (!uid) {
        log(`Skipping username '${username}' - no uid found`, 'warning');
        return;
      }
      
      // Update user document with username
      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, {
        username: username,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      count++;
      log(`Queued username '${username}' for user ${uid}`, 'info');
    });
    
    if (count > 0) {
      await batch.commit();
      log(`Successfully migrated ${count} usernames`, 'success');
    }
    
  } catch (error) {
    log(`Failed to migrate usernames: ${error.message}`, 'error');
    throw error;
  }
}

async function cleanupCollections(db) {
  log('Cleaning up unused collections...', 'info');
  
  const collectionsToDelete = ['usernames', 'phone_numbers', 'votes'];
  
  for (const collectionName of collectionsToDelete) {
    try {
      await deleteCollectionBrowser(db, collectionName);
    } catch (error) {
      log(`Could not delete ${collectionName}: ${error.message}`, 'warning');
    }
  }
}

async function deleteCollectionBrowser(db, collectionName) {
  log(`Checking ${collectionName} collection...`, 'info');
  
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    log(`${collectionName} collection is empty`, 'info');
    return;
  }
  
  log(`Deleting ${snapshot.docs.length} documents from ${collectionName}`, 'info');
  
  // Delete in batches (browser has limitations)
  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  log(`Successfully deleted ${count} documents from ${collectionName}`, 'success');
}

// Dry run function
async function dryRunInBrowser() {
  log('Starting dry run - no changes will be made...', 'info');
  
  try {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      throw new Error('Firebase is not available');
    }
    
    const db = firebase.firestore();
    
    // Check usernames
    const usernamesSnapshot = await db.collection('usernames').get();
    log(`Usernames collection: ${usernamesSnapshot.docs.length} documents`, 'info');
    
    usernamesSnapshot.docs.forEach(doc => {
      const username = doc.id;
      const data = doc.data();
      log(`  - Username: ${username} → User ID: ${data.uid || 'NO UID'}`, 'info');
    });
    
    // Check other collections
    const collectionsToCheck = ['phone_numbers', 'votes'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await db.collection(collectionName).get();
        log(`${collectionName} collection: ${snapshot.docs.length} documents`, 'info');
        
        if (snapshot.docs.length > 0 && snapshot.docs.length <= 5) {
          snapshot.docs.forEach(doc => {
            log(`  - Document ID: ${doc.id}`, 'info');
          });
        }
      } catch (error) {
        log(`${collectionName} collection: not accessible or empty`, 'info');
      }
    }
    
    log('Dry run completed', 'success');
    
  } catch (error) {
    log(`Dry run failed: ${error.message}`, 'error');
  }
}

// Export functions for manual execution
window.migrateDatabaseInBrowser = migrateDatabaseInBrowser;
window.dryRunInBrowser = dryRunInBrowser;

// Instructions
console.log(`
📖 Database Migration Script (Browser Version)

To use this script:

1. BACKUP YOUR DATABASE FIRST! 
2. Make sure you're on the Firebase Console or a page with Firebase loaded
3. Run a dry run first to see what will be changed:
   
   dryRunInBrowser()

4. If everything looks good, run the migration:
   
   migrateDatabaseInBrowser()

⚠️  IMPORTANT: This will permanently delete the usernames, phone_numbers, and votes collections!
⚠️  Make sure you have a backup before proceeding!
`);



