import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
  connectDB().catch((error) =>
    console.error("Database connection failed:", error.message)
  );
});
