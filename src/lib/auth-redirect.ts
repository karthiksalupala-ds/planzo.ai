const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

export const getAppBaseUrl = () => {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return "";
};

export const buildAuthRedirectUrl = (path = "") => {
  const base = getAppBaseUrl();
  if (!base) return "";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};
