import { createHash } from "crypto";

type Entry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, Entry<unknown>>();

export function cacheKey(scope: string, value: string | Buffer) {
  const hash = createHash("sha256").update(value).digest("hex");
  return `${scope}:${hash}`;
}

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = 60 * 60 * 1000) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
