const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Use a dedicated test database to avoid affecting development data
const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/express_auth_test';

async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
}

async function closeTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function clearCollections() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = {
  connectTestDb,
  closeTestDb,
  clearCollections,
  TEST_MONGO_URI
};
