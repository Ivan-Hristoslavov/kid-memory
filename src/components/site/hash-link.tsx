"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * In-page anchors ("/#how", "/#pricing").
 *
 * A plain <Link> could not do this job here: every navigation remounts
 * `app/template.tsx`, so the whole page tree is torn down and rebuilt. Next
 * tries to scroll to the anchor while the new tree is still mounting, finds
 * nothing, and the click appears to do nothing at all.
 *
 * On the home page we therefore skip routing entirely and scroll natively. From
 * another route we navigate normally and let <HashScroll> finish the job once
 * the target exists.
 */
export function HashLink({
  href,
  children,
  className,
  onNavigate,
}: {
  /** Always the absolute form, e.g. "/#pricing". */
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const id = href.split("#")[1] ?? "";
  const isHome = pathname === "/";

  if (!isHome || !id) {
    return (
      <Link href={href} className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        const target = document.getElementById(id);
        if (!target) return; // let the browser handle it
        e.preventDefault();
        onNavigate?.();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Keep the URL shareable without triggering a route change.
        history.replaceState(null, "", `#${id}`);
      }}
    >
      {children}
    </a>
  );
}

/**
 * Scrolls to the hash after the page has actually mounted — covers a shared
 * link opened directly, a cross-route click, and browser back/forward.
 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      // Two frames: the first lets the remounted tree paint, the second runs
      // after layout so the target's final position is known.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        })
      );
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

  return null;
}
