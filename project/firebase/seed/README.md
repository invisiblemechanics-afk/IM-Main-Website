# Firebase Seed Scripts

This directory contains scripts for seeding and updating Firebase Firestore data.

## Scripts

### updateChapters.js / updateChapters.ts
Updates all existing chapter documents in the `Chapters` collection with the following fields:

- `createdAt` - Current timestamp (only if not already set)
- `updatedAt` - Current timestamp (always updated)
- `name` - Chapter name (from existing data or document ID)
- `slug` - Slugified version of chapter name (lowercase with hyphens)
- `questionCountBreakdowns` - Count of questions in `{ChapterName}-Breakdowns` subcollection
- `questionCountPractice` - Count of questions in `{ChapterName}-Practice-Questions` subcollection
- `questionCountTest` - Count of questions in `{ChapterName}-Test-Questions` subcollection
- `subject` - Set to "Physics" for all chapters
- `section` - Left blank for now

### seedChapters.js / seedChapters.ts
Creates new chapter documents (used for initial seeding).

### seedBreakdowns.js / seedBreakdowns.ts
Seeds breakdown questions data.

## Usage

Make sure you have Firebase Admin credentials configured (either through environment variables or service account key).

### Update existing chapters
```bash
# From the project root directory
npm run update:chapters

# Or run directly
node firebase/seed/updateChapters.js
```

### Seed new chapters
```bash
npm run seed:chapters
```

### Seed breakdowns
```bash
npm run seed:breakdowns
```

## Prerequisites

1. Firebase Admin SDK configured
2. Proper Firebase project credentials
3. Node.js installed

## Notes

- The update script will automatically count questions in each subcollection
- It preserves existing `createdAt` values if they already exist
- The script is safe to run multiple times
- All operations use server timestamps for consistency