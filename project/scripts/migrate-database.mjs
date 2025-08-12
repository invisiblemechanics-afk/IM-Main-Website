#!/usr/bin/env node

/**
 * Database Migration Script for Terminal
 * 
 * This script will:
 * 1. Move username data from 'usernames' collection to 'users' collection
 * 2. Delete the 'usernames' collection
 * 3. Delete unused 'phone_numbers' and 'votes' collections
 * 
 * Usage:
 *   npm run migrate:dry-run    # Preview changes
 *   npm run migrate:execute    # Run migration
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.blue;
  let emoji = 'ℹ️';
  
  switch (type) {
    case 'success':
      color = colors.green;
      emoji = '✅';
      break;
    case 'error':
      color = colors.red;
      emoji = '❌';
      break;
    case 'warning':
      color = colors.yellow;
      emoji = '⚠️';
      break;
    case 'info':
      color = colors.cyan;
      emoji = 'ℹ️';
      break;
  }
  
  console.log(`${color}${emoji} [${timestamp}] ${message}${colors.reset}`);
}

async function initializeFirebase() {
  try {
    let app;
    
    // Try to use service account key first
    const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
    
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      log('Firebase Admin initialized with service account key', 'success');
    } catch (serviceKeyError) {
      // Fallback to default credentials
      try {
        app = initializeApp();
        log('Firebase Admin initialized with default credentials', 'success');
      } catch (defaultError) {
        log('Failed to initialize Firebase with both methods', 'error');
        log('Please do one of the following:', 'info');
        log('1. Download service account key and save as scripts/serviceAccountKey.json', 'info');
        log('2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable', 'info');
        log('3. Run: gcloud auth application-default login', 'info');
        throw defaultError;
      }
    }
    
    const db = getFirestore(app);
    return db;
  } catch (error) {
    log(`Failed to initialize Firebase: ${error.message}`, 'error');
    throw error;
  }
}

async function dryRun() {
  log('🔍 Starting dry run - no changes will be made...', 'info');
  
  try {
    const db = await initializeFirebase();
    
    // Check usernames collection
    const usernamesSnapshot = await db.collection('usernames').get();
    log(`📊 Usernames collection: ${usernamesSnapshot.size} documents`, 'info');
    
    if (usernamesSnapshot.size > 0) {
      log('📝 Usernames that would be migrated:', 'info');
      usernamesSnapshot.forEach(doc => {
        const username = doc.id;
        const data = doc.data();
        log(`  - Username: ${username} → User ID: ${data.uid || 'NO UID'}`, 'info');
      });
    }
    
    // Check other collections
    const collectionsToCheck = ['phone_numbers', 'votes'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await db.collection(collectionName).get();
        log(`📊 ${collectionName} collection: ${snapshot.size} documents`, 'info');
        
        if (snapshot.size > 0 && snapshot.size <= 10) {
          snapshot.forEach(doc => {
            log(`  - Document ID: ${doc.id}`, 'info');
          });
        }
      } catch (error) {
        log(`📊 ${collectionName} collection: not accessible or empty`, 'info');
      }
    }
    
    log('✅ Dry run completed successfully', 'success');
    log('', 'info');
    log('📋 Summary of what will happen:', 'info');
    log(`  - ${usernamesSnapshot.size} usernames will be moved to users collection`, 'info');
    log('  - usernames collection will be deleted', 'info');
    log('  - phone_numbers collection will be deleted (if exists)', 'info');
    log('  - votes collection will be deleted (if exists)', 'info');
    log('', 'info');
    log('To run the actual migration, use: npm run migrate:execute', 'info');
    
  } catch (error) {
    log(`Dry run failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function migrate() {
  log('🚀 Starting database migration...', 'info');
  
  try {
    const db = await initializeFirebase();
    
    // Step 1: Migrate usernames
    await migrateUsernames(db);
    
    // Step 2: Clean up collections
    await cleanupCollections(db);
    
    log('🎉 Migration completed successfully!', 'success');
    log('📋 Database structure is now organized', 'success');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    process.exit(1);
  }
}

async function migrateUsernames(db) {
  log('📝 Migrating usernames from usernames collection to users collection...', 'info');
  
  try {
    const usernamesSnapshot = await db.collection('usernames').get();
    
    if (usernamesSnapshot.empty) {
      log('No usernames found to migrate', 'info');
      return;
    }
    
    log(`Found ${usernamesSnapshot.size} usernames to migrate`, 'info');
    
    const batch = db.batch();
    let count = 0;
    
    usernamesSnapshot.forEach(doc => {
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
        updatedAt: FieldValue.serverTimestamp()
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
  log('🧹 Cleaning up unused collections...', 'info');
  
  const collectionsToDelete = ['usernames', 'phone_numbers', 'votes'];
  
  for (const collectionName of collectionsToDelete) {
    try {
      await deleteCollection(db, collectionName);
    } catch (error) {
      log(`Could not delete ${collectionName}: ${error.message}`, 'warning');
    }
  }
}

async function deleteCollection(db, collectionName) {
  log(`Checking ${collectionName} collection...`, 'info');
  
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    log(`${collectionName} collection is empty`, 'info');
    return;
  }
  
  log(`Deleting ${snapshot.size} documents from ${collectionName}`, 'info');
  
  // Delete in batches (Firestore has a 500 operation limit per batch)
  const batchSize = 450;
  let deletedCount = 0;
  
  while (deletedCount < snapshot.size) {
    const batch = db.batch();
    const docsToDelete = snapshot.docs.slice(deletedCount, deletedCount + batchSize);
    
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += docsToDelete.length;
    
    log(`Deleted ${deletedCount}/${snapshot.size} documents from ${collectionName}`, 'info');
  }
  
  log(`Successfully deleted all documents from ${collectionName}`, 'success');
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--dry-run') || args.includes('dry-run')) {
  dryRun();
} else if (args.includes('--migrate') || args.includes('migrate')) {
  // Confirmation prompt
  console.log('\n⚠️  WARNING: This will permanently delete collections!');
  console.log('Make sure you have a backup of your database.');
  console.log('\nCollections that will be deleted:');
  console.log('  - usernames (after moving data to users)');
  console.log('  - phone_numbers (if exists)');
  console.log('  - votes (if exists)');
  console.log('\nTo continue, type "CONFIRM" and press Enter:');
  
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (input) => {
    const confirmation = input.trim();
    if (confirmation === 'CONFIRM') {
      console.log('\nStarting migration...\n');
      migrate();
    } else {
      console.log('\nMigration cancelled.');
      process.exit(0);
    }
    process.stdin.pause();
  });
} else {
  console.log(`
📖 Database Migration Script

Usage:
  node scripts/migrate-database.mjs --dry-run     # Preview changes
  node scripts/migrate-database.mjs --migrate     # Run migration

Or use npm scripts:
  npm run migrate:dry-run      # Preview changes
  npm run migrate:execute      # Run migration

⚠️  Important: Make sure to backup your database before running migration!
  `);
}
