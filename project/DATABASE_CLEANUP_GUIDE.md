# Database Cleanup Guide

This guide will help you clean up your Firestore database to implement the new organized structure.

## ⚠️ IMPORTANT: Backup First!

Before making any changes, **backup your database**:
1. Go to Firebase Console → Firestore Database
2. Click "Export data" 
3. Export all collections to Google Cloud Storage
4. Wait for export to complete before proceeding

## Option 1: Automated Migration (Recommended)

### Using Browser Script

1. **Open Firebase Console** in your browser
2. **Go to Firestore Database**
3. **Open browser developer tools** (F12)
4. **Go to Console tab**
5. **Copy and paste** the contents of `scripts/browser-migration.js`
6. **Run dry run first**:
   ```javascript
   dryRunInBrowser()
   ```
7. **Review the output** to see what will be changed
8. **If everything looks correct, run migration**:
   ```javascript
   migrateDatabaseInBrowser()
   ```

### Using Node.js Script

1. **Install Firebase Admin SDK**:
   ```bash
   cd project
   npm install firebase-admin
   ```

2. **Get service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `serviceAccountKey.json` in `scripts/` folder

3. **Update script** with your credentials (line 17 in `scripts/migrate-database.js`)

4. **Run dry run**:
   ```bash
   node scripts/migrate-database.js --dry-run
   ```

5. **Run migration**:
   ```bash
   node scripts/migrate-database.js --migrate
   ```

## Option 2: Manual Cleanup

If you prefer to do this manually:

### Step 1: Migrate Usernames

For each document in the `usernames` collection:

1. **Note the document ID** (this is the username)
2. **Note the `uid` field** (this is the user ID)
3. **Go to the `users` collection**
4. **Find the document with ID matching the `uid`**
5. **Add a field called `username`** with the value from step 1
6. **Set `updatedAt`** to current timestamp

### Step 2: Delete Unused Collections

Once usernames are migrated:

1. **Delete `usernames` collection**:
   - Select all documents in the collection
   - Delete them (may need to do in batches)

2. **Delete `phone_numbers` collection** (if it exists):
   - This collection appears unused in the code
   - Select all documents and delete

3. **Delete `votes` collection** (if it exists):
   - This collection is not used (votes are stored as subcollections)
   - Select all documents and delete

## Verification

After cleanup, your database should have:

### ✅ Organized Structure:
- `users` collection with username and phoneNumber fields
- `threads` collection with votes as subcollections
- `chapters`, `breakdowns`, etc. (unchanged)

### ❌ Removed Collections:
- `usernames` (data moved to users)
- `phone_numbers` (unused)
- `votes` (unused - votes are in subcollections)

## Testing

After migration:

1. **Test user registration** - verify username uniqueness still works
2. **Test phone verification** - verify phone number uniqueness still works  
3. **Test community features** - verify voting still works
4. **Check user profiles** - verify usernames display correctly

## Rollback Plan

If something goes wrong:

1. **Restore from backup** using Firebase Console → Import data
2. **Revert code changes** by checking out previous commit
3. **Redeploy Firestore rules** from previous version

## New Structure Benefits

✅ **Simplified**: All user data in one collection  
✅ **Organized**: No separate collections for user fields  
✅ **Efficient**: Better queries with proper indexes  
✅ **Maintainable**: Easier to understand and manage  

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify Firebase permissions
3. Ensure backup is complete before retrying
4. Test on development database first

---

**Remember**: Always test database changes on a development environment before applying to production!



