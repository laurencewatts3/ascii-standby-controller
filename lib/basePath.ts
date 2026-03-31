/**
 * Returns the basePath for asset loading.
 * Empty string in dev, "/ascii-standby-controller" in production.
 */
export function getBasePath(): string {
  if (typeof window === "undefined") return "";
  const { origin } = window.location;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "";
  }
  return "/ascii-standby-controller";
}
