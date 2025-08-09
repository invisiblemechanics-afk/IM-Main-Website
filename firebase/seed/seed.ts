import { seedChapters } from './seedChapters';
import { seedBreakdowns } from './seedBreakdowns';

async function seedAll() {
  console.log('Starting database seeding...');
  
  try {
    // Seed chapters first
    await seedChapters();
    
    // Then seed breakdowns (which reference chapters)
    await seedBreakdowns();
    
    console.log('All data seeded successfully!');
  } catch (error) {
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