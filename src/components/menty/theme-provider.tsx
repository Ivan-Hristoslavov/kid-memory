"use client";

import { ThemeProvider as NextThemes } from "next-themes";

/**
 * Dark mode.
 *
 * `next-themes` was already a dependency — the toast component reads the theme
 * from it — but nothing ever mounted the provider, so `useTheme()` always
 * returned "system" and the `.dark` block in globals.css was dead code. It has
 * been written and maintained all along; this is what turns it on.
 *
 * Defaults to the operating system's setting rather than forcing light: a shop
 * that ignores a phone set to dark at night is a shop that glares.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  );
}
