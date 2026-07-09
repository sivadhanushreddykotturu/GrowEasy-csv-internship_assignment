import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { parseCSV } from "../services/csvService";
import { processWithGroq } from "../services/groqService";

const router = Router();

// Store file in memory (stateless — no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

/**
 * POST /api/import
 * Accepts a CSV file, processes it with Groq AI, returns CRM records.
 */
router.post(
  "/import",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please attach a CSV file with field name 'file'.",
        });
        return;
      }

      console.log(
        `[Import] Received file: ${req.file.originalname} (${req.file.size} bytes)`
      );

      // Step 1: Parse CSV
      const rows = parseCSV(req.file.buffer);

      if (rows.length === 0) {
        res.status(400).json({
          success: false,
          error: "The CSV file appears to be empty or could not be parsed.",
        });
        return;
      }

      console.log(`[Import] Parsed ${rows.length} rows`);

      // Step 2: AI Extraction
      const { data, skipped } = await processWithGroq(rows);

      res.json({
        success: true,
        data,
        skipped,
        total: rows.length,
        processed: data.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/health
 * Health check endpoint.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "GrowEasy CSV Importer API is running",
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
  });
});

export default router;
