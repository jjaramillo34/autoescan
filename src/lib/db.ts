import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

function getMongoUri(): string | undefined {
  // Leer en cada llamada: en scripts, dotenv puede cargar después del import.
  const uri = process.env.MONGODB_URI;
  return uri && uri.length > 0 ? uri : undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getMongoUri());
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = getMongoUri();
  if (!MONGODB_URI) {
    throw new Error(
      "Falta MONGODB_URI. Configúrala en .env.local para conectar a MongoDB.",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
