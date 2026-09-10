/**
 * Prints MongoDB explain() output for the common place-search query.
 * Run: node scripts/explainPlacesQuery.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Place = require('../models/Place');

async function main() {
  dotenv.config();
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing MONGO_URI in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const filter = {
    city: 'Jaipur',
    category: 'historical',
    priceLevel: { $lte: 2 }
  };

  console.log('Indexes on places:');
  console.log(await Place.collection.indexes());

  const explanation = await Place.find(filter).sort({ rating: -1 }).explain('executionStats');
  const winning = explanation.queryPlanner?.winningPlan;
  const stats = explanation.executionStats;

  console.log('\nWinning plan:');
  console.log(JSON.stringify(winning, null, 2));
  console.log('\nDocs examined:', stats?.totalDocsExamined);
  console.log('Keys examined:', stats?.totalKeysExamined);
  console.log('Documents returned:', stats?.nReturned);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
