import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using the URI defined in the environment.
 * Exits the process on failure so the server never runs without a database.
 *
 * @returns {Promise<void>} Resolves once the connection is open.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Fail fast with a clear message rather than a cryptic driver error.
    throw new Error('MONGODB_URI is not configured. Check backend/.env');
  }

  // Mongoose 7+ uses sensible defaults; strictQuery keeps queries predictable.
  mongoose.set('strictQuery', true);

  // Connection tuning for resilience against transient network drops:
  // - serverSelectionTimeoutMS: fail fast (10s) instead of hanging ~30s when
  //   the cluster is unreachable.
  // - socketTimeoutMS: give slow queries room but don't block forever.
  // - retryWrites/retryReads: let the driver automatically retry an operation
  //   once if the connection is reset mid-request (handles ECONNRESET).
  // - maxPoolSize/minPoolSize: keep a small warm pool of connections.
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  console.log('[db] Connected to MongoDB Atlas');

  // Surface connection drops/recoveries in the logs for easier debugging.
  mongoose.connection.on('disconnected', () =>
    console.warn('[db] Disconnected from MongoDB — the driver will try to reconnect')
  );
  mongoose.connection.on('reconnected', () =>
    console.log('[db] Reconnected to MongoDB')
  );
  mongoose.connection.on('error', (err) =>
    console.error('[db] Connection error:', err.message)
  );
}
