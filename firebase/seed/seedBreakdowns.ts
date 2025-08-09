import admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface BreakdownData {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  type: 'MCQ' | 'MultiAnswer' | 'Numerical';
  slides: {
    kind: 'theory' | 'question';
    title: string;
    content: string;
    imageUrl?: string;
    options?: string[];
    correct?: number[];
    answer?: number;
    hint?: string;
  }[];
}

const breakdowns: BreakdownData[] = [
  {
    id: 'vector-addition-2d',
    title: 'Vector Addition in 2D',
    description: 'Learn how to add vectors in two dimensions using magnitude and angle',
    chapterId: 'vectors',
    type: 'Numerical',
    slides: [
      {
        kind: 'theory',
        title: 'Introduction to Vector Addition',
        content: 'When adding two vectors, we need to consider both their magnitudes and directions. The resultant vector depends on the angle between them.',
      },
      {
        kind: 'question',
        title: 'Calculate Resultant Magnitude',
        content: 'Two vectors A and B are given with magnitudes 5 and 3 respectively. Find the magnitude of their resultant when the angle between them is 60°.',
        answer: 7,
        hint: 'Use the formula: R² = A² + B² + 2AB cos(θ)',
      },
    ],
  },
  {
    id: 'dot-product-applications',
    title: 'Dot Product Applications',
    description: 'Calculate angles between vectors using dot product',
    chapterId: 'vectors',
    type: 'Numerical',
    slides: [
      {
        kind: 'theory',
        title: 'Dot Product Formula',
        content: 'The dot product of two vectors can be used to find the angle between them: A·B = |A||B|cos(θ)',
      },
      {
        kind: 'question',
        title: 'Find the Angle',
        content: 'Given vectors A = 3i + 4j and B = 2i - j, calculate the angle between them.',
        answer: 53,
        hint: 'First calculate A·B, then find |A| and |B|',
      },
    ],
  },
  {
    id: 'cross-product-3d',
    title: 'Cross Product in 3D',
    description: 'Find cross products of vectors in three dimensions',
    chapterId: 'vectors',
    type: 'MultiAnswer',
    slides: [
      {
        kind: 'theory',
        title: 'Cross Product Properties',
        content: 'The cross product of two vectors results in a vector perpendicular to both original vectors.',
      },
      {
        kind: 'question',
        title: 'Calculate Cross Product',
        content: 'Find the cross product of vectors A = i + 2j + 3k and B = 2i - j + k.',
        options: ['5i + 5j - 5k', '5i - 5j + 5k', '-5i + 5j + 5k', '5i + 5j + 5k'],
        correct: [0],
      },
    ],
  },
  {
    id: 'unit-vector-calculation',
    title: 'Unit Vector Calculation',
    description: 'Find unit vectors from given vector components',
    chapterId: 'vectors',
    type: 'MCQ',
    slides: [
      {
        kind: 'theory',
        title: 'What is a Unit Vector?',
        content: 'A unit vector has magnitude 1 and points in the same direction as the original vector.',
      },
      {
        kind: 'question',
        title: 'Find the Unit Vector',
        content: 'A vector has components (6, 8, 0). What is its unit vector?',
        options: ['(0.6, 0.8, 0)', '(0.8, 0.6, 0)', '(6, 8, 0)', '(1, 1, 0)'],
        correct: [0],
      },
    ],
  },
];

export async function seedBreakdowns() {
  console.log('Seeding breakdowns...');
  
  for (const breakdown of breakdowns) {
    try {
      // Create the breakdown document
      const breakdownRef = db.collection('breakdowns').doc(breakdown.id);
      await breakdownRef.set({
        title: breakdown.title,
        description: breakdown.description,
        chapterId: breakdown.chapterId,
        type: breakdown.type,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created breakdown: ${breakdown.title}`);
      
      // Create slides as subcollection
      for (let i = 0; i < breakdown.slides.length; i++) {
        const slide = breakdown.slides[i];
        await breakdownRef.collection('slides').doc(i.toString()).set({
          ...slide,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`  Created slide ${i}: ${slide.title}`);
      }
    } catch (error) {
      console.error(`Error creating breakdown ${breakdown.title}:`, error);
    }
  }
  
  console.log('Breakdowns seeded successfully');
}

// Run if executed directly
if (require.main === module) {
  seedBreakdowns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding breakdowns:', error);
      process.exit(1);
    });
}