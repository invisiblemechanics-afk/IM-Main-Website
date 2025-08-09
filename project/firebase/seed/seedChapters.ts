import admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const chapters = [
  { id: 'vectors', name: 'Vectors', questionCount: 12 },
  { id: 'rotation', name: 'Rotation', questionCount: 8 },
  { id: 'thermodynamics', name: 'Thermodynamics', questionCount: 15 },
  { id: 'waves', name: 'Waves', questionCount: 10 },
];

export async function seedChapters() {
  console.log('Seeding chapters...');
  
  for (const chapter of chapters) {
    try {
      await db.collection('Chapters').doc(chapter.id).set({
        name: chapter.name,
        slug: chapter.id,
        questionCount: chapter.questionCount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created chapter: ${chapter.name}`);
    } catch (error) {
      console.error(`Error creating chapter ${chapter.name}:`, error);
    }
  }
  
  console.log('Chapters seeded successfully');
}

// Run if executed directly
if (require.main === module) {
  seedChapters()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding chapters:', error);
      process.exit(1);
    });
}