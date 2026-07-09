import Groq from "groq-sdk";
import { CRMRecord, RawRow, AIRecord } from "../types/crm";
import {
  buildSchemaDiscoveryPrompt,
  buildBatchExtractionPrompt,
} from "./promptBuilder";
import { getSampleRows } from "./csvService";

const MODEL = "llama-3.3-70b-versatile";
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 600; // Stay well under 30 req/min
const MAX_RETRIES = 3;

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY environment variable is not set. Please add it to your .env file."
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Sleep helper for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Groq API with retry + exponential backoff.
 */
async function callGroqWithRetry(
  prompt: string,
  retries = MAX_RETRIES
): Promise<string> {
  const client = getGroqClient();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a precise data extraction AI. Always respond with valid JSON only. Never include markdown code blocks, explanations, or any text outside the JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent structured output
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || "";
      // Strip markdown code blocks if model accidentally includes them
      return content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("rate_limit") ||
          error.message.includes("429") ||
          error.message.includes("Rate limit"));

      if (attempt === retries) {
        throw error;
      }

      const backoffMs = isRateLimit
        ? 60000 // Wait 60s on rate limit
        : Math.pow(2, attempt) * 1000; // 2s, 4s, 8s

      console.log(
        `[Groq] Attempt ${attempt} failed. Retrying in ${backoffMs}ms...`,
        error instanceof Error ? error.message : error
      );
      await sleep(backoffMs);
    }
  }

  throw new Error("All retry attempts exhausted");
}

/**
 * Phase 1: Discover schema mapping from CSV headers + sample rows.
 */
async function discoverSchema(
  rows: RawRow[]
): Promise<Record<string, string | null>> {
  console.log("[Groq] Phase 1: Schema discovery...");
  const headers = Object.keys(rows[0] || {});
  const sampleRows = getSampleRows(rows, 3);

  const prompt = buildSchemaDiscoveryPrompt(headers, sampleRows);
  const response = await callGroqWithRetry(prompt);

  try {
    const mapping = JSON.parse(response) as Record<string, string | null>;
    console.log("[Groq] Schema mapping:", mapping);
    return mapping;
  } catch {
    console.warn("[Groq] Schema discovery parse failed, using empty mapping");
    return {};
  }
}

/**
 * Phase 2: Extract CRM records from a batch of raw rows.
 */
async function extractBatch(
  batch: RawRow[],
  columnMapping: Record<string, string | null>
): Promise<AIRecord[]> {
  const prompt = buildBatchExtractionPrompt(batch, columnMapping);
  const response = await callGroqWithRetry(prompt);

  try {
    const parsed = JSON.parse(response) as AIRecord[];
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }
    return parsed;
  } catch (e) {
    console.error("[Groq] Batch parse failed:", response.slice(0, 200));
    // Return all as skipped on parse failure
    return batch.map(() => ({ _skip: true as const, reason: "Parse failed" }));
  }
}

/**
 * Main entry point: process all rows with Groq AI.
 * Returns extracted CRM records + skipped count.
 */
export async function processWithGroq(
  rows: RawRow[],
  onProgress?: (processed: number, total: number) => void
): Promise<{ data: CRMRecord[]; skipped: number }> {
  if (rows.length === 0) {
    return { data: [], skipped: 0 };
  }

  // Phase 1: Schema discovery (1 API call)
  const columnMapping = await discoverSchema(rows);
  await sleep(BATCH_DELAY_MS);

  // Phase 2: Batch extraction
  const results: CRMRecord[] = [];
  let skipped = 0;
  const batches: RawRow[][] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `[Groq] Processing ${rows.length} rows in ${batches.length} batches...`
  );

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `[Groq] Batch ${i + 1}/${batches.length} (${batch.length} rows)`
    );

    const batchResults = await extractBatch(batch, columnMapping);

    for (const record of batchResults) {
      if ("_skip" in record && record._skip) {
        skipped++;
      } else {
        results.push(record as CRMRecord);
      }
    }

    onProgress?.(Math.min((i + 1) * BATCH_SIZE, rows.length), rows.length);

    // Rate limit guard: wait between batches (except after last batch)
    if (i < batches.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(
    `[Groq] Done. Extracted: ${results.length}, Skipped: ${skipped}`
  );
  return { data: results, skipped };
}
