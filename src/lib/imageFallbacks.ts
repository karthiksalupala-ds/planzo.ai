import goa from "@/assets/dest-goa.jpg";
import jaipur from "@/assets/dest-jaipur.jpg";
import kerala from "@/assets/dest-kerala.jpg";
import ladakh from "@/assets/dest-ladakh.jpg";
import manali from "@/assets/dest-manali.jpg";
import tajmahal from "@/assets/dest-tajmahal.jpg";
import udaipur from "@/assets/dest-udaipur.jpg";
import varanasi from "@/assets/dest-varanasi.jpg";

const CATEGORY_FALLBACKS: Record<string, string[]> = {
  Beach: [goa, kerala],
  Nature: [kerala, manali, ladakh],
  Adventure: [ladakh, manali, goa],
  Culture: [tajmahal, jaipur, varanasi],
  Romantic: [udaipur, kerala],
};

const GENERAL_FALLBACKS = [goa, jaipur, kerala, ladakh, manali, tajmahal, udaipur, varanasi];

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

export const getDestinationFallbackImage = (seed: string, category?: string) => {
  const pool = (category && CATEGORY_FALLBACKS[category]) || GENERAL_FALLBACKS;
  return pool[hash(seed) % pool.length];
};
