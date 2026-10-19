/** Path prefixes that require a signed-in user. */
export const APP_PATH_PREFIXES = [
  "/ideas",
  "/scripts",
  "/hooks",
  "/seo",
  "/aesthetics",
  "/repurpose",
  "/calendar",
  "/library",
  "/settings",
  "/onboarding",
] as const;

export function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
