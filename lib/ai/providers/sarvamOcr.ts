import { createStoredZip } from "@/lib/archive/zip";
import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type OcrProvider,
  type OcrRequest,
  type OcrResult,
} from "@/lib/ai/types";

type Config = {
  apiKey: string;
  baseUrl?: string;
};

type JobResponse = {
  job_id?: string;
  job_state?: string;
  download_urls?: Record<string, { file_url?: string; url?: string }>;
  upload_urls?: Record<string, { file_url?: string; url?: string; upload_url?: string }>;
};

export class SarvamOcrProvider implements OcrProvider {
  constructor(private readonly config: Config) {}

  async extractText(input: OcrRequest): Promise<OcrResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("Sarvam API key is not configured.");
    }

    const baseUrl = this.config.baseUrl || "https://api.sarvam.ai";
    const image = dataUrlToBuffer(input.imageBase64);
    const zip = createStoredZip([{ name: image.fileName, data: image.data }]);
    const zipName = "sanskrit-page.zip";

    const job = await this.sarvamFetch<JobResponse>(`${baseUrl}/doc-digitization/job/v1`, {
      method: "POST",
      body: JSON.stringify({
        job_parameters: {
          language: input.languageHint || "sa-IN",
          output_format: "json",
        },
      }),
    });

    if (!job.job_id) throw new Error("Sarvam OCR did not return a job id.");

    const upload = await this.sarvamFetch<JobResponse>(`${baseUrl}/doc-digitization/job/v1/upload-files`, {
      method: "POST",
      body: JSON.stringify({
        job_id: job.job_id,
        files: [zipName],
      }),
    });

    const uploadUrl = pickUrl(upload.upload_urls);
    if (!uploadUrl) throw new Error("Sarvam OCR did not return an upload URL.");

    await uploadToSignedUrl(uploadUrl, zip, "application/zip");

    await this.sarvamFetch<JobResponse>(`${baseUrl}/doc-digitization/job/v1/${job.job_id}/start`, {
      method: "POST",
      body: "{}",
    });

    const completed = await this.waitForJob(baseUrl, job.job_id);
    if (completed.job_state !== "Completed" && completed.job_state !== "PartiallyCompleted") {
      throw new Error(`Sarvam OCR job failed with state ${completed.job_state || "unknown"}.`);
    }

    const downloads = await this.sarvamFetch<JobResponse>(`${baseUrl}/doc-digitization/job/v1/${job.job_id}/download-files`, {
      method: "POST",
      body: "{}",
    });

    const resultUrl = pickJsonUrl(downloads.download_urls) || pickUrl(downloads.download_urls);
    if (!resultUrl) throw new Error("Sarvam OCR did not return a download URL.");

    const result = await fetch(resultUrl);
    if (!result.ok) throw new Error(`Sarvam OCR download failed with status ${result.status}.`);

    const contentType = result.headers.get("content-type") || "";
    const text = contentType.includes("json")
      ? extractTextFromJson(await result.json())
      : await result.text();

    return {
      provider: "sarvam",
      text: normalizeOcrText(text),
    };
  }

  private async waitForJob(baseUrl: string, jobId: string) {
    for (let i = 0; i < 24; i++) {
      await wait(i < 4 ? 1000 : 2500);
      const status = await this.sarvamFetch<JobResponse>(`${baseUrl}/doc-digitization/job/v1/${jobId}/status`, {
        method: "GET",
      });
      if (["Completed", "PartiallyCompleted", "Failed"].includes(status.job_state || "")) {
        return status;
      }
    }
    throw new Error("Sarvam OCR timed out.");
  }

  private async sarvamFetch<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": this.config.apiKey,
        ...init.headers,
      },
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("Sarvam OCR rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sarvam OCR failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
  }
}

function dataUrlToBuffer(value: string) {
  const match = value.match(/^data:(.*?);base64,(.*)$/);
  const mimeType = match?.[1] || "image/jpeg";
  const data = Buffer.from(match?.[2] || value, "base64");
  const fileName = mimeType.includes("png") ? "page.png" : "page.jpg";
  return { data, fileName };
}

function pickUrl(map?: Record<string, { file_url?: string; url?: string; upload_url?: string }>) {
  if (!map) return "";
  for (const value of Object.values(map)) {
    if (value.upload_url || value.file_url || value.url) return value.upload_url || value.file_url || value.url || "";
  }
  return "";
}

function pickJsonUrl(map?: Record<string, { file_url?: string; url?: string }>) {
  if (!map) return "";
  for (const [name, value] of Object.entries(map)) {
    const url = value.file_url || value.url || "";
    if (name.toLowerCase().endsWith(".json") || url.toLowerCase().includes(".json")) return url;
  }
  return "";
}

async function uploadToSignedUrl(url: string, body: Buffer, contentType: string) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-ms-blob-type": "BlockBlob",
    },
    body: new Blob([new Uint8Array(body)], { type: contentType }),
  });

  if (!response.ok) {
    throw new Error(`Sarvam OCR upload failed with status ${response.status}.`);
  }
}

function extractTextFromJson(value: unknown): string {
  const pieces: string[] = [];
  walk(value);
  return pieces.join("\n");

  function walk(node: unknown) {
    if (!node) return;
    if (typeof node === "string") {
      if (hasIndicText(node)) pieces.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      Object.entries(node as Record<string, unknown>).forEach(([key, child]) => {
        if (/text|content|markdown|html/i.test(key)) walk(child);
      });
    }
  }
}

function hasIndicText(text: string) {
  return /[\u0900-\u097F\u0D00-\u0D7F]/.test(text);
}

function normalizeOcrText(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
