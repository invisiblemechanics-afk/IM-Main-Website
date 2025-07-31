# Firebase Configuration for Breakdowns Feature

This directory contains the Firebase configuration for the Breakdowns feature, including Firestore security rules, indexes, and seed data.

## Schema Overview

### Collections

1. **chapters** - Top-level topics
   - `name`: string (e.g., "Vectors")
   - `slug`: string (e.g., "vectors")
   - `questionCount`: number
   - `createdAt`, `updatedAt`: timestamps

2. **breakdowns** - Individual breakdown sessions
   - `title`: string
   - `description`: string
   - `chapterId`: string (reference to chapters)
   - `type`: "MCQ" | "MultiAnswer" | "Numerical"
   - `createdAt`, `updatedAt`: timestamps
   - **Subcollection: slides**
     - `kind`: "theory" | "question"
     - `title`: string
     - `content`: string
     - `imageUrl?`: string
     - `options?`: string[] (for MCQ/MultiAnswer)
     - `correct?`: number[] (correct answer indexes)
     - `answer?`: number (for numerical questions)
     - `hint?`: string
     - `createdAt`: timestamp

3. **userAnswers** - Stores user responses
   - `userId`: string
   - `breakdownId`: string
   - `answers`: Record of slide answers
   - `createdAt`, `updatedAt`: timestamps

## Setup Instructions

### 1. Install Dependencies

```bash
npm install firebase-admin ts-node @types/node
```

### 2. Initialize Firebase

```bash
firebase init firestore functions
```

### 3. Deploy Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Seed Data

```bash
# Seed all data
npm run seed

# Or seed individually
npm run seed:chapters
npm run seed:breakdowns
```

### 5. Test with Emulators

```bash
npm run emulators:start
```

## Security Rules

- **chapters**: Public read-only
- **breakdowns**: Public read-only
- **slides**: Public read-only
- **userAnswers**: Users can only read/write their own data

## Development

The seed scripts create sample data for:
- 4 chapters: Vectors, Rotation, Thermodynamics, Waves
- 4 breakdown examples with theory and question slides
- No difficulty field (removed as per requirements)

## TypeScript Types

All TypeScript interfaces are defined in `/src/types/firebase.d.ts`