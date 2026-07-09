import { ImportResult } from "@/types/crm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Upload a CSV file to the backend and get AI-extracted CRM records.
 */
export async function importCSV(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  // Simulate progress for UX while waiting for API
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let currentProgress = 5;

  if (onProgress) {
    onProgress(5);
    progressInterval = setInterval(() => {
      // Increment slowly up to 85% while waiting
      if (currentProgress < 85) {
        currentProgress += Math.random() * 3;
        onProgress(Math.min(currentProgress, 85));
      }
    }, 800);
  }

  try {
    const response = await fetch(`${API_BASE}/api/import`, {
      method: "POST",
      body: formData,
    });

    if (progressInterval) clearInterval(progressInterval);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error || `Server error: ${response.status} ${response.statusText}`
      );
    }

    onProgress?.(100);
    const data: ImportResult = await response.json();
    return data;
  } catch (error) {
    if (progressInterval) clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Health check to verify backend is running.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
