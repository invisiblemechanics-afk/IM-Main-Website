/**
 * Derive lightweight per-user practiceSessions from userAnswers.
 * Heuristics:
 *  - considers userAnswers where mode == 'practice' OR source == 'practice'
 *  - groups by (userId, topicId)
 *  - sets answeredCount = distinct(answer keys)
 *  - leaves totalCount undefined if unknown
 */
import * as admin from 'firebase-admin';

init();

async function init() {
  if (!admin.apps.length) admin.initializeApp();
  const db = admin.firestore();

  console.log('Starting practice sessions migration...');

  // Try to find userAnswers with practice mode
  let ua = await db.collection('userAnswers')
    .where('mode', '==', 'practice')
    .get();

  // If no results with mode, try looking for any userAnswers and filter by source
  if (ua.empty) {
    console.log('No userAnswers with mode=practice found, checking for source=practice...');
    const allUA = await db.collection('userAnswers').get();
    const practiceUA = allUA.docs.filter(doc => {
      const data = doc.data();
      return data.source === 'practice' || (data.breakdownId && data.breakdownId.includes('practice'));
    });
    
    if (practiceUA.length === 0) {
      console.log('No practice-related userAnswers found. Migration complete (no data to migrate).');
      return;
    }
    
    // Create a mock QuerySnapshot-like object
    ua = { docs: practiceUA, empty: false } as any;
  }

  console.log(`Found ${ua.docs.length} practice-related userAnswers documents`);

  const byUserTopic = new Map<string, any[]>();
  for (const d of ua.docs) {
    const data: any = d.data();
    const topicId = data.topicId || data.breakdownId || 'unknown';
    const key = `${data.userId}::${topicId}`;
    if (!byUserTopic.has(key)) byUserTopic.set(key, []);
    byUserTopic.get(key)!.push({ id: d.id, ...data });
  }

  console.log(`Grouped into ${byUserTopic.size} user-topic combinations`);

  for (const [key, items] of byUserTopic) {
    const [userId, topicId] = key.split('::');
    const answered = new Set<string>();
    let updatedAt = 0;

    for (const it of items) {
      const answers = it.answers ? Object.keys(it.answers) : [];
      answers.forEach(a => answered.add(a));
      const ts = (it.updatedAt?.toMillis?.() ?? new Date(it.updatedAt).getTime?.() ?? Date.now());
      if (ts > updatedAt) updatedAt = ts;
    }

    try {
      const sessionRef = db.collection('users').doc(userId).collection('practiceSessions').doc(topicId);
      const snap = await sessionRef.get();
      
      const next = {
        topicId: topicId === 'unknown' ? undefined : topicId,
        mode: 'practice' as const,
        answeredCount: answered.size,
        status: 'in_progress' as const,
        updatedAt: new admin.firestore.Timestamp(Math.floor(updatedAt/1000), 0),
        createdAt: snap.exists ? snap.get('createdAt') ?? admin.firestore.FieldValue.serverTimestamp()
                               : admin.firestore.FieldValue.serverTimestamp(),
      };

      await sessionRef.set(next, { merge: true });
      console.log(`session upserted for user=${userId}, topic=${topicId}, answered=${answered.size}`);
    } catch (error) {
      console.error(`Error creating session for user=${userId}, topic=${topicId}:`, error);
    }
  }

  console.log('Done.');
}

