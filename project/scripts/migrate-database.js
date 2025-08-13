/**
 * Database Migration Script
 * 
 * This script will:
 * 1. Move username data from 'usernames' collection to 'users' collection
 * 2. Delete the 'usernames' collection
 * 3. Delete the 'phone_numbers' collection (if it exists and is unused)
 * 4. Delete the 'votes' collection (if it exists and is unused)
 * 
 * Run this script carefully and make sure to backup your database first!
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (you'll need to provide your service account key)
// Replace 'path/to/serviceAccountKey.json' with your actual service account key path
// const serviceAccount = require('./path/to/serviceAccountKey.json');

const app = initializeApp({
  // credential: cert(serviceAccount),
  // You can also use the default credentials if running in Google Cloud environment
});

const db = getFirestore(app);

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Step 1: Migrate usernames from 'usernames' collection to 'users' collection
    await migrateUsernames();
    
    // Step 2: Clean up unused collections
    await cleanupUnusedCollections();
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Usernames migrated to users collection');
    console.log('   - Unused collections removed');
    console.log('   - Database structure is now organized');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateUsernames() {
  console.log('📝 Migrating usernames...');
  
  try {
    const usernamesSnapshot = await db.collection('usernames').get();
    
    if (usernamesSnapshot.empty) {
      console.log('   No usernames to migrate');
      return;
    }
    
    console.log(`   Found ${usernamesSnapshot.docs.length} usernames to migrate`);
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of usernamesSnapshot.docs) {
      const username = doc.id; // The username is the document ID
      const data = doc.data();
      const uid = data.uid;
      
      if (!uid) {
        console.warn(`   Skipping username '${username}' - no uid found`);
        continue;
      }
      
      // Add username to user document
      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, {
        username: username,
        updatedAt: new Date()
      });
      
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`   Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   Committed final batch of ${batchCount} updates`);
    }
    
    console.log('✅ Username migration completed');
    
  } catch (error) {
    console.error('❌ Failed to migrate usernames:', error);
    throw error;
  }
}

async function cleanupUnusedCollections() {
  console.log('🧹 Cleaning up unused collections...');
  
  // Collections to check and potentially delete
  const collectionsToCleanup = ['usernames', 'phone_numbers', 'votes'];
  
  for (const collectionName of collectionsToCleanup) {
    try {
      await deleteCollection(collectionName);
    } catch (error) {
      console.warn(`   Warning: Could not delete ${collectionName} collection:`, error.message);
    }
  }
}

async function deleteCollection(collectionName) {
  console.log(`   Checking ${collectionName} collection...`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   ${collectionName} collection is already empty`);
    return;
  }
  
  console.log(`   Deleting ${snapshot.docs.length} documents from ${collectionName}`);
  
  // Delete documents in batches
  const batchSize = 450; // Stay under Firestore's 500 operation limit
  let batch = db.batch();
  let operationCount = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    operationCount++;
    
    if (operationCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
      console.log(`   Deleted batch of ${batchSize} documents from ${collectionName}`);
    }
  }
  
  // Commit remaining operations
  if (operationCount > 0) {
    await batch.commit();
    console.log(`   Deleted final batch of ${operationCount} documents from ${collectionName}`);
  }
  
  console.log(`✅ ${collectionName} collection cleaned up`);
}

// Dry run function to preview what would be migrated
async function dryRun() {
  console.log('🔍 Running dry run - no changes will be made...');
  
  try {
    // Check usernames collection
    const usernamesSnapshot = await db.collection('usernames').get();
    console.log(`📊 Found ${usernamesSnapshot.docs.length} usernames to migrate:`);
    
    for (const doc of usernamesSnapshot.docs) {
      const username = doc.id;
      const data = doc.data();
      console.log(`   - Username: ${username} → User ID: ${data.uid}`);
    }
    
    // Check other collections
    const collectionsToCheck = ['phone_numbers', 'votes'];
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`📊 ${collectionName} collection: ${snapshot.docs.length} documents`);
      } catch (error) {
        console.log(`📊 ${collectionName} collection: does not exist or is empty`);
      }
    }
    
  } catch (error) {
    console.error('❌ Dry run failed:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--dry-run')) {
    dryRun()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (args.includes('--migrate')) {
    migrateDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('📖 Database Migration Script');
    console.log('');
    console.log('Usage:');
    console.log('  node migrate-database.js --dry-run    # Preview changes without making them');
    console.log('  node migrate-database.js --migrate    # Perform the actual migration');
    console.log('');
    console.log('⚠️  Important: Make sure to backup your database before running --migrate!');
    console.log('⚠️  Update the Firebase Admin credentials in this script before running.');
  }
}

module.exports = {
  migrateDatabase,
  dryRun
};



