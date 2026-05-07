/** True when DATABASE_URL is missing or still matches .env.example placeholders. */
export function databaseUrlLooksPlaceholder(url: string | undefined): boolean {
  if (!url?.trim()) return true;
  return (
    url.includes("YOUR-NEON-HOST") ||
    url.includes("USER:PASSWORD@") ||
    /REPLACE[_-]?ME/i.test(url)
  );
}
