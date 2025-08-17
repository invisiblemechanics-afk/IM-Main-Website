const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../../invisible-mechanics---2-firebase-adminsdk-fbsvc-a82a0ef6a3.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'invisible-mechanics---2'
});

const db = admin.firestore();

const sampleTests = [
  {
    name: "JEE Main Physics Mock Test #1",
    exam: "JEE Main",
    duration: 180, // 3 hours in minutes
    durationSec: 10800, // 3 hours in seconds
    totalQuestions: 30,
    skillTags: [
      "mechanics",
      "thermodynamics", 
      "electrostatics",
      "optics",
      "modern-physics"
    ],
    syllabusChapters: [
      "Laws of Motion",
      "Thermodynamics", 
      "Electrostatics",
      "Ray Optics",
      "Atoms and Nuclei"
    ],
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    difficulty: {
      easy: 40,
      moderate: 40,
      tough: 20
    }
  },
  {
    name: "NEET Biology Full Syllabus Test",
    exam: "NEET",
    duration: 180,
    durationSec: 10800,
    totalQuestions: 45,
    skillTags: [
      "cell-biology",
      "genetics",
      "ecology",
      "human-physiology",
      "plant-physiology"
    ],
    syllabusChapters: [
      "Cell Biology",
      "Genetics and Evolution",
      "Ecology and Environment", 
      "Human Physiology",
      "Plant Physiology"
    ],
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    difficulty: {
      easy: 30,
      moderate: 50,
      tough: 20
    }
  },
  {
    name: "JEE Advanced Mathematics",
    exam: "JEE Advanced",
    duration: 120,
    durationSec: 7200,
    totalQuestions: 20,
    skillTags: [
      "calculus",
      "algebra",
      "coordinate-geometry",
      "trigonometry",
      "probability"
    ],
    syllabusChapters: [
      "Differential Calculus",
      "Algebra",
      "Coordinate Geometry",
      "Trigonometry",
      "Probability and Statistics"
    ],
    createdBy: "admin", 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    difficulty: {
      easy: 20,
      moderate: 40,
      tough: 40
    }
  },
  {
    name: "JEE Main Chemistry Organic",
    exam: "JEE Main",
    duration: 90,
    durationSec: 5400,
    totalQuestions: 25,
    skillTags: [
      "organic-chemistry",
      "hydrocarbons",
      "alcohols",
      "aldehydes-ketones",
      "carboxylic-acids"
    ],
    syllabusChapters: [
      "Hydrocarbons",
      "Alcohols and Ethers",
      "Aldehydes and Ketones",
      "Carboxylic Acids",
      "Organic Compounds with Nitrogen"
    ],
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    difficulty: {
      easy: 35,
      moderate: 45,
      tough: 20
    }
  },
  {
    name: "NEET Physics Mechanics",
    exam: "NEET",
    duration: 60,
    durationSec: 3600,
    totalQuestions: 15,
    skillTags: [
      "kinematics",
      "dynamics",
      "work-energy",
      "rotational-motion",
      "gravitation"
    ],
    syllabusChapters: [
      "Motion in a Straight Line",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles and Rotational Motion",
      "Gravitation"
    ],
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    difficulty: {
      easy: 50,
      moderate: 35,
      tough: 15
    }
  }
];

async function seedTests() {
  try {
    console.log('🌱 Starting to seed test data...');
    
    // Check if Tests collection already has data
    const existingTests = await db.collection('Tests').limit(1).get();
    if (!existingTests.empty) {
      console.log('ℹ️  Tests collection already has data. Skipping seeding.');
      console.log('   Use --force flag to override existing data.');
      return;
    }
    
    for (const test of sampleTests) {
      console.log(`📝 Adding test: ${test.name}...`);
      
      // Add the test document
      const testRef = await db.collection('Tests').add(test);
      console.log(`✅ Added test with ID: ${testRef.id}`);
      
      // Add sample questions to the test
      const questionsData = [];
      for (let i = 1; i <= test.totalQuestions; i++) {
        questionsData.push({
          questionNumber: i,
          questionText: `Sample question ${i} for ${test.name}. This is a placeholder question for testing purposes.`,
          choices: [
            `Option A for question ${i}`,
            `Option B for question ${i}`, 
            `Option C for question ${i}`,
            `Option D for question ${i}`
          ],
          correctAnswer: Math.floor(Math.random() * 4), // Random correct answer (0-3)
          difficulty: Math.floor(Math.random() * 10) + 1, // Random difficulty 1-10
          skillTag: test.skillTags[Math.floor(Math.random() * test.skillTags.length)],
          explanation: `This is the explanation for question ${i}. The correct answer is based on the fundamental concepts of ${test.exam}.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Add questions to subcollection in batches
      const batch = db.batch();
      questionsData.forEach((questionData) => {
        const questionRef = db.collection('Tests').doc(testRef.id).collection('Questions').doc();
        batch.set(questionRef, questionData);
      });
      
      await batch.commit();
      console.log(`📚 Added ${questionsData.length} questions to test ${testRef.id}`);
    }
    
    console.log('🎉 Successfully seeded all test data!');
    console.log(`📊 Total tests added: ${sampleTests.length}`);
    console.log(`📝 Total questions added: ${sampleTests.reduce((sum, test) => sum + test.totalQuestions, 0)}`);
    
  } catch (error) {
    console.error('❌ Error seeding tests:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { seedTests };

// Run if executed directly
if (require.main === module) {
  seedTests()
    .then(() => {
      console.log('✅ Test seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test seeding failed:', error);
      process.exit(1);
    });
}
