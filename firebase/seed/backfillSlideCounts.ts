/**
 * Idempotent backfill for breakdowns.slideCount
 * Usage:
 *   TS_NODE_TRANSPILE_ONLY=1 ts-node project/firebase/seed/backfillSlideCounts.ts
 */
import * as admin from 'firebase-admin';

init();

async function init() {
  if (!admin.apps.length) admin.initializeApp();
  const db = admin.firestore();

  console.log('Starting slideCount backfill...');

  const snaps = await db.collection('breakdowns').get();
  console.log(`Found ${snaps.docs.length} breakdown documents`);

  for (const doc of snaps.docs) {
    try {
      const slidesSnap = await doc.ref.collection('slides').count().get();
      const total = slidesSnap.data().count || 0;

      const current = (await doc.ref.get()).get('slideCount');
      if (current === total) {
        console.log(`breakdown ${doc.id}: slideCount already up to date (${total})`);
        continue; // idempotent
      }

      await doc.ref.set({ slideCount: total }, { merge: true });
      console.log(`breakdown ${doc.id}: slideCount -> ${total}`);
    } catch (error) {
      console.error(`Error processing breakdown ${doc.id}:`, error);
    }
  }

  console.log('Done.');
}

