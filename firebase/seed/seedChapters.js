"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedChapters = seedChapters;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize admin if not already initialized
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp();
}
const db = firebase_admin_1.default.firestore();
const chapters = [
    { id: 'vectors', name: 'Vectors', questionCount: 12 },
    { id: 'rotation', name: 'Rotation', questionCount: 8 },
    { id: 'thermodynamics', name: 'Thermodynamics', questionCount: 15 },
    { id: 'waves', name: 'Waves', questionCount: 10 },
];
async function seedChapters() {
    console.log('Seeding chapters...');
    for (const chapter of chapters) {
        try {
            await db.collection('chapters').doc(chapter.id).set({
                name: chapter.name,
                slug: chapter.id,
                questionCount: chapter.questionCount,
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Created chapter: ${chapter.name}`);
        }
        catch (error) {
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
