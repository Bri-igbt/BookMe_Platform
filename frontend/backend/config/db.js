import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://blakechima_db_user:sWGflgK1Z2r77i1G@cluster0.s4bqeph.mongodb.net/?appName=Cluster0/BookME")
        .then(() => {
            console.log("DB CONNECTED")
        })
}