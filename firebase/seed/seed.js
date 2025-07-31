"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seedChapters_1 = require("./seedChapters");
const seedBreakdowns_1 = require("./seedBreakdowns");
async function seedAll() {
    console.log('Starting database seeding...');
    try {
        // Seed chapters first
        await (0, seedChapters_1.seedChapters)();
        // Then seed breakdowns (which reference chapters)
        await (0, seedBreakdowns_1.seedBreakdowns)();
        console.log('All data seeded successfully!');
    }
    catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    }
}
// Run if executed directly
if (require.main === module) {
    seedAll()
        .then(() => {
        console.log('Seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
