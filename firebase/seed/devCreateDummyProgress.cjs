/**
 * Creates a dummy videoProgress & practiceSession for the current dev user.
 * Run only against emulator or test project.
 */
const admin = require('firebase-admin');

const UID = process.env.DEV_UID || 'test-user';

init();

async function init() {
  if (!admin.apps.length) {
    // Initialize with service account key
    const serviceAccount = require('../../../invisible-mechanics---2-firebase-adminsdk-fbsvc-a82a0ef6a3.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  console.log(`Creating dummy progress for user: ${UID}`);

  try {
    // Create dummy video progress
    await db.collection('users').doc(UID).collection('videoProgress').doc('sample-video').set({
      videoId: 'sample-video',
      topicId: 'mechanics-kinematics',
      title: 'Kinematics: Relative Motion',
      positionSec: 420,
      durationSec: 1800,
      progressPct: Math.round((420/1800)*100),
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    console.log('✓ Created dummy video progress');

    // Create dummy practice session
    await db.collection('users').doc(UID).collection('practiceSessions').doc('mechanics-kinematics').set({
      topicId: 'mechanics-kinematics',
      mode: 'practice',
      lastQuestionId: 'q_123',
      answeredCount: 12,
      totalCount: 40,
      status: 'in_progress',
      topicName: 'Mechanics: Kinematics',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    console.log('✓ Created dummy practice session');

    // Create another video progress for variety
    await db.collection('users').doc(UID).collection('videoProgress').doc('sample-video-2').set({
      videoId: 'sample-video-2',
      topicId: 'thermodynamics-basics',
      title: 'Thermodynamics: First Law',
      positionSec: 180,
      durationSec: 1200,
      progressPct: Math.round((180/1200)*100),
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    console.log('✓ Created second dummy video progress');

    console.log(`Dummy progress created for ${UID}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating dummy progress:', error);
    process.exit(1);
  }
}
