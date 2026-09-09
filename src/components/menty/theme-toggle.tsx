"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/hooks/use-client-value";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark switch.
 *
 * The icon cannot be rendered until the theme is known, and the theme is only
 * known on the client — so until then this is a same-sized empty box. Rendering
 * a guessed icon instead would flip on hydration, which is exactly the flicker
 * a theme toggle is judged by.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      // The label depends on the resolved theme, which the server cannot know.
      // Guarding the icon but not this was a real hydration mismatch: the
      // server rendered "Тъмна тема" and the client replaced it.
      aria-label={
        mounted ? (dark ? "Светла тема" : "Тъмна тема") : "Смени темата"
      }
      className="grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      {mounted ? (
        dark ? (
          <Sun className="size-5" strokeWidth={1.5} />
        ) : (
          <Moon className="size-5" strokeWidth={1.5} />
        )
      ) : (
        <span className="size-5" />
      )}
    </button>
  );
}
