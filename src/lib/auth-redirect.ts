const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

export const getAppBaseUrl = () => {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
  if (typeof window !== "undefined" && window.location?.origin) {
    const currentOrigin = normalizeBaseUrl(window.location.origin);
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || "");

    // In local development, use current origin to avoid Supabase redirect URL validation mismatches.
    if (isLocalhost) {
      return currentOrigin;
    }

    if (configured && /^https?:\/\//i.test(configured)) {
      return normalizeBaseUrl(configured);
    }

    return currentOrigin;
  }

  if (configured && /^https?:\/\//i.test(configured)) {
    return normalizeBaseUrl(configured);
  }

  return "";
};

export const buildAuthRedirectUrl = (path = "") => {
  const base = getAppBaseUrl();
  if (!base) return "";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};
