const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800";

/**
 * Fetch a single image from Pexels for a given search query.
 * Returns a fallback image if the API key is missing or the request fails.
 */
export async function getPexelsImage(query: string): Promise<string> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) return FALLBACK_IMAGE;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) return FALLBACK_IMAGE;

    const data = await res.json();
    return data.photos?.[0]?.src?.large || FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

/**
 * Check whether an image URL is the fallback or missing.
 */
export function isFallbackOrMissing(url?: string): boolean {
  if (!url) return true;
  if (url === FALLBACK_IMAGE) return true;
  return false;
}
