const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800";

type ImageContext = "destination" | "day" | "activity";

interface PexelsImageOptions {
  context?: ImageContext;
  destination?: string;
  dayTitle?: string;
}

interface PexelsPhoto {
  width?: number;
  height?: number;
  alt?: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
  };
}

const QUALITY_RULES: Record<ImageContext, { minWidth: number; minHeight: number }> = {
  destination: { minWidth: 1600, minHeight: 900 },
  day: { minWidth: 1400, minHeight: 800 },
  activity: { minWidth: 900, minHeight: 600 },
};

const NEGATIVE_TERMS = ["illustration", "logo", "vector", "poster", "icon"];
const NEGATIVE_QUERY = NEGATIVE_TERMS.map((term) => `-${term}`).join(" ");

const addImageParams = (url?: string) => {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}auto=compress&cs=tinysrgb&fit=crop`;
};

const sanitizeQuery = (query: string) => query.replace(/\s+/g, " ").trim();

const buildQueries = (query: string, options?: PexelsImageOptions): string[] => {
  const base = sanitizeQuery(query);
  const destination = sanitizeQuery(options?.destination || "");
  const dayTitle = sanitizeQuery(options?.dayTitle || "");
  const context = options?.context || "activity";
  const locationContext = destination || base;

  const activityQueries = [
    `${base} ${destination} india travel place photography ${NEGATIVE_QUERY}`,
    `${base} ${destination} india landmark tourism ${NEGATIVE_QUERY}`,
    `${destination} ${base} india destination photo ${NEGATIVE_QUERY}`,
  ];

  const dayQueries = [
    `${dayTitle} ${destination} india travel landscape photography ${NEGATIVE_QUERY}`,
    `${destination} india scenic attractions travel photography ${NEGATIVE_QUERY}`,
    `${destination} india city travel panorama ${NEGATIVE_QUERY}`,
  ];

  const destinationQueries = [
    `${base} india travel destination landscape photography ${NEGATIVE_QUERY}`,
    `${base} india city skyline landmark travel ${NEGATIVE_QUERY}`,
    `${base} india tourism scenic view ${NEGATIVE_QUERY}`,
  ];

  const fallbackQueries = [
    `${locationContext} india travel ${NEGATIVE_QUERY}`,
    `${locationContext} india landscape ${NEGATIVE_QUERY}`,
  ];

  if (context === "destination") return [...destinationQueries, ...fallbackQueries];
  if (context === "day") return [...dayQueries, ...fallbackQueries];
  return [...activityQueries, ...fallbackQueries];
};

const isHighEnoughQuality = (photo: PexelsPhoto, context: ImageContext) => {
  const { minWidth, minHeight } = QUALITY_RULES[context];
  const width = photo.width || 0;
  const height = photo.height || 0;
  return width >= minWidth && height >= minHeight;
};

const relevanceScore = (photo: PexelsPhoto, query: string, options?: PexelsImageOptions) => {
  const haystack = `${photo.alt || ""}`.toLowerCase();
  const tokens = sanitizeQuery(`${query} ${options?.destination || ""} ${options?.dayTitle || ""}`)
    .toLowerCase()
    .split(" ")
    .filter((t) => t.length > 2);

  let score = 0;
  tokens.forEach((token) => {
    if (haystack.includes(token)) score += 2;
  });
  if (haystack.includes("travel")) score += 1;
  if (haystack.includes("landscape") || haystack.includes("city")) score += 1;
  return score;
};

/**
 * Fetch a single image from Pexels for a given search query.
 * Returns a fallback image if the API key is missing or the request fails.
 */
export async function getPexelsImage(query: string, options?: PexelsImageOptions): Promise<string> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) return FALLBACK_IMAGE;

  const tryQuery = async (searchQuery: string) => {
    try {
      const context = options?.context || "activity";
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=12&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const photos: PexelsPhoto[] = data.photos || [];
      if (!photos.length) return null;

      const qualified = photos.filter((photo) => isHighEnoughQuality(photo, context));
      const ranked = (qualified.length ? qualified : photos)
        .map((photo) => ({ photo, score: relevanceScore(photo, searchQuery, options) }))
        .sort((a, b) => b.score - a.score);

      const best = ranked[0]?.photo;
      return (
        addImageParams(best?.src?.large2x) ||
        addImageParams(best?.src?.large) ||
        addImageParams(best?.src?.original) ||
        addImageParams(best?.src?.medium) ||
        null
      );
    } catch {
      return null;
    }
  };

  const queries = buildQueries(query, options);
  for (const candidate of queries) {
    const result = await tryQuery(candidate);
    if (result) return result;
  }

  // Ultimate Fallback
  return FALLBACK_IMAGE;
}

/**
 * Check whether an image URL is the fallback or missing.
 */
export function isFallbackOrMissing(url?: string): boolean {
  if (!url) return true;
  if (url === FALLBACK_IMAGE) return true;
  return false;
}
