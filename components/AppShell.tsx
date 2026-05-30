"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { IconHistory } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const onHistory = pathname.startsWith("/history");

  useEffect(() => { void requestPersistentStorage(); }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="wordmark" aria-label={ml.appName}>
            <span>സംസ്കൃതം</span>
            <span className="wordmark__rule" aria-hidden />
            <span>ഗുരു</span>
          </Link>
          <Link
            href="/history"
            className="topbar__link"
            data-active={onHistory}
            aria-label={ml.shell.tabs.history}
          >
            <IconHistory size={16} />
            <span>{ml.shell.tabs.history}</span>
          </Link>
        </div>
      </header>

      <main className="shell__main">{children}</main>
    </div>
  );
}

async function requestPersistentStorage() {
  if (typeof navigator === "undefined") return;
  if (!navigator.storage?.persist || !navigator.storage.persisted) return;
  try {
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    /* older browsers: nothing to do — IndexedDB still works, just without the eviction guarantee */
  }
}
