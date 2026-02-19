const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ serviceAccountKey.json not found in project root.');
  process.exit(1);
}

const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const assessmentId = process.argv[2] || 'school-security-v1';

async function run() {
  console.log(`🔎 Purging Uncategorized docs for assessmentId=${assessmentId}`);

  const nodes = await db.collection('assessmentNodes')
    .where('assessmentId', '==', assessmentId)
    .get();

  const uncategorizedIds = new Set();
  nodes.forEach(doc => {
    const d = doc.data() || {};
    const key = String(d.key || '').toLowerCase();
    const title = String(d.title || '').toLowerCase();
    if (key === 'uncategorized' || title === 'uncategorized') {
      uncategorizedIds.add(doc.id);
    }
  });

  if (!uncategorizedIds.size) {
    console.log('✅ No Uncategorized parent docs found.');
    return;
  }

  // include direct/indirect descendants
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach(doc => {
      if (uncategorizedIds.has(doc.id)) return;
      const d = doc.data() || {};
      const parentId = d.parentId;
      if (parentId && uncategorizedIds.has(String(parentId))) {
        uncategorizedIds.add(doc.id);
        changed = true;
      }
    });
  }

  const ids = Array.from(uncategorizedIds);
  console.log(`🗑️ Deleting ${ids.length} docs...`);

  let batch = db.batch();
  let count = 0;
  for (const id of ids) {
    batch.delete(db.collection('assessmentNodes').doc(id));
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`✅ Deleted ${count}/${ids.length}`);
      batch = db.batch();
    }
  }
  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`🎉 Done. Deleted ${ids.length} Uncategorized docs (with descendants).`);
}

run().catch(err => {
  console.error('❌ purge failed:', err.message || err);
  process.exit(1);
});
