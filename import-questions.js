const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Usage:
// node import-questions.js ./questions-import.json
const inputPath = process.argv[2] || "./questions-import.json";
const resolvedInput = path.resolve(inputPath);
const keyPath = path.resolve("./serviceAccountKey.json");

if (!fs.existsSync(resolvedInput)) {
  console.error(`❌ JSON file not found: ${resolvedInput}`);
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error("❌ serviceAccountKey.json not found in project root.");
  process.exit(1);
}

const serviceAccount = require(keyPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function writeInBatches(docs, chunkSize = 400) {
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = db.batch();

    chunk.forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });

    await batch.commit();
    console.log(`✅ Committed ${Math.min(i + chunkSize, docs.length)} / ${docs.length}`);
  }
}

async function run() {
  const payload = JSON.parse(fs.readFileSync(resolvedInput, "utf8"));
  const assessmentId = payload.assessmentId || "school-security-v1";
  const categories = payload.categories || [];

  if (!categories.length) {
    throw new Error("No categories found in JSON.");
  }

  // Upsert assessment doc
  await db.collection("assessments").doc(assessmentId).set(
    {
      title: "School Security Assessment",
      version: "1.0.0",
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const docsToWrite = [];
  let categoryCount = 0;
  let subcategoryCount = 0;
  let questionCount = 0;

  for (const cat of categories) {
    categoryCount++;
    const catId = cat.key;

    docsToWrite.push({
      ref: db.collection("assessmentNodes").doc(catId),
      data: {
        assessmentId,
        type: "category",
        parentId: null,
        key: cat.key,
        title: cat.title,
        order: cat.order ?? 1,
        active: true,
      },
    });

    for (const sub of cat.subcategories || []) {
      subcategoryCount++;
      const subId = sub.key;

      docsToWrite.push({
        ref: db.collection("assessmentNodes").doc(subId),
        data: {
          assessmentId,
          type: "subcategory",
          parentId: catId,
          key: sub.key,
          title: sub.title,
          order: sub.order ?? 1,
          active: true,
        },
      });

      for (const q of sub.questions || []) {
        questionCount++;

        docsToWrite.push({
          ref: db.collection("assessmentNodes").doc(q.key),
          data: {
            assessmentId,
            type: "question",
            parentId: subId,
            key: q.key,
            text: q.text,
            questionType: q.questionType || "boolean",
            required: !!q.required,
            order: q.order ?? 1,
            hasCommentField: !!q.hasCommentField,
            active: true,
          },
        });
      }
    }
  }

  console.log(`📦 Preparing import:\n  Categories: ${categoryCount}\n  Subcategories: ${subcategoryCount}\n  Questions: ${questionCount}\n  Total docs: ${docsToWrite.length}`);

  await writeInBatches(docsToWrite, 400);

  console.log("🎉 Import complete.");
}

run().catch((err) => {
  console.error("❌ Import failed:", err.message);
  process.exit(1);
});
