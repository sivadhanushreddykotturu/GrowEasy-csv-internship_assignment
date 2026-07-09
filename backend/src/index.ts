import "dotenv/config";
import express from "express";
import cors from "cors";
import importRouter from "./routes/import";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api", importRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   GrowEasy CSV Importer API              ║
  ║   Running on http://localhost:${PORT}       ║
  ║   Groq API: ${process.env.GROQ_API_KEY ? "✓ Configured" : "✗ NOT SET — add to .env"}  ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
