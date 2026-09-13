/**
 * Injects automatic Cloudinary transformations for compression, modern format delivery,
 * and dimension constraints (f_auto, q_auto, w_1200, c_limit).
 */
export function optimizeCloudinaryUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Verify Cloudinary URL
  if (trimmed.includes("cloudinary.com") && trimmed.includes("/upload/")) {
    // If it already has compression params (e.g. q_auto or f_auto), leave as is
    if (trimmed.includes("/f_auto") || trimmed.includes("/q_auto")) {
      return trimmed;
    }

    // Inject /f_auto,q_auto,w_1200,c_limit/ into the /upload/ path
    return trimmed.replace(/\/upload\/(?:v\d+\/)?/, (match) => {
      if (match.includes("/v")) {
        const vPart = match.slice(match.indexOf("v"));
        return `/upload/f_auto,q_auto,w_1200,c_limit/${vPart}`;
      }
      return `/upload/f_auto,q_auto,w_1200,c_limit/`;
    });
  }

  return trimmed;
}
