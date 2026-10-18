// import mongoose from "mongoose";

// export const connectDB = async () => {
//     await mongoose.connect("mongodb+srv://blakechima_db_user:sWGflgK1Z2r77i1G@cluster0.s4bqeph.mongodb.net/?appName=Cluster0/BookME")
//         .then(() => {
//             console.log("DB CONNECTED")
//         })
// }
// Boniface123;


import mongoose from "mongoose";

const cache = global.mongooseCache || { connection: null, promise: null };
global.mongooseCache = cache;

export const connectDB = async () => {
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }

    try {
      if (!new URL(uri).pathname.replace("/", "")) {
        console.warn(
          "MONGODB_URI has no database name, so MongoDB will use the default database called test."
        );
      }
    } catch (error) {
      console.warn(
        "MONGODB_URI could not be checked. Special characters in the password must be URL-encoded."
      );
    }

    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((instance) => {
        console.log("DB CONNECTED");
        return instance;
      });
  }

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
};