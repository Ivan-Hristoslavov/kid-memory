/**
 * `server-only` is provided by the Next.js compiler, not by a package on disk,
 * so importing a module that guards itself with it fails under a plain Node
 * runner. The scripts tsconfig maps the specifier here so CLI tools can reuse
 * the real server modules instead of keeping a second copy of poster logic that
 * would drift from production.
 */
export {};
