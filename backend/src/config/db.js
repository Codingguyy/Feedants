const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    // sensible defaults for a production-facing pool; tune per load testing
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error', err);
  });
}

module.exports = connectDB;
