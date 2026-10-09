import express from 'express';
import cors from 'cors'
import 'dotenv/config';
import http from 'http';
import { connectDB } from './config/db.js';


const PORT = process.env.PORT || 8000;
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DATABASE
connectDB();

// ROUTES

app.get("/", (req, res) => {
    res.send("API WORKING");
});

const server = http.createServer(app);

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
    }

    throw error;
});

server.listen(PORT, () => {
    console.log(`Server Started on http://localhost:${PORT}`)
})