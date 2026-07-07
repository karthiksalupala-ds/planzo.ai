import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, IndianRupee, X, SortAsc, TrendingUp, ArrowUpDown, Heart, Sparkles, Loader2, Brain, RefreshCw, Wand2 } from "lucide-react";
import { useEffect } from "react";
import { getAllDestinations } from "@/data/destinations";
import { useToast } from "@/hooks/use-toast";
import SafeImage from "@/components/SafeImage";
import { getPexelsImage } from "@/lib/pexels";
import { getDestinationFallbackImage } from "@/lib/imageFallbacks";
import DestinationCardSkeleton from "@/components/DestinationCardSkeleton";
import { prefetchImage } from "@/lib/prefetch";
import { supabase } from "@/integrations/supabase/client";
import { postOpenRouterProxy } from "@/lib/stream-ai";

const filterTags = ["All", "Culture", "Beach", "Nature", "Adventure", "Romantic"];
const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Rating (High–Low)", value: "rating_desc" },
  { label: "Price (Low–High)", value: "price_asc" },
  { label: "Price (High–Low)", value: "price_desc" },
];

interface AIDestination {
  id: string;
  name: string;
  state?: string;
  rating: number;
  tag?: string;
  price: string;
  days: string;
  category: string;
  description: string;
  bestTime: string;
  highlights: string[];
  lat: number;
  lng: number;
  foodSpots: string[];
  activities: string[];
  image?: string;
}

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("planzo_wishlist") || "[]"); } catch { return []; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);
  const [regeneratingSummaryId, setRegeneratingSummaryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const toggleWishlist = (e: React.MouseEvent, destId: string, destName: string) => {
    e.stopPropagation();
    const isWishlisted = wishlist.includes(destId);
    const updated = isWishlisted ? wishlist.filter(id => id !== destId) : [...wishlist, destId];
    setWishlist(updated);
    localStorage.setItem("planzo_wishlist", JSON.stringify(updated));
    toast({ title: isWishlisted ? `Removed from Wishlist` : `♡ Added to Wishlist`, description: destName });
  };

  const filtered = getAllDestinations()
    .filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === "All" || d.category === activeFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "rating_desc") return b.rating - a.rating;
      if (sortBy === "price_asc") return parseInt(a.price.replace(/\D/g, "")) - parseInt(b.price.replace(/\D/g, ""));
      if (sortBy === "price_desc") return parseInt(b.price.replace(/\D/g, "")) - parseInt(a.price.replace(/\D/g, ""));
      return 0;
    });

  const updateAiDestination = useCallback((id: string, updater: (dest: AIDestination) => AIDestination) => {
    const existingAI = JSON.parse(localStorage.getItem("planzo_ai_destinations") || "[]") as AIDestination[];
    const updated = existingAI.map((dest) => (dest.id === id ? updater(dest) : dest));
    localStorage.setItem("planzo_ai_destinations", JSON.stringify(updated));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const regenerateAiImage = async (dest: AIDestination) => {
    if (!dest?.id || regeneratingImageId) return;
    setRegeneratingImageId(dest.id);
    try {
      const nextImage = await getPexelsImage(`${dest.name} ${dest.state || ""}`, {
        context: "destination",
        destination: `${dest.name} ${dest.state || ""}`,
      });
      updateAiDestination(dest.id, (current) => ({ ...current, image: nextImage }));
      toast({ title: "Image refreshed", description: `${dest.name} image regenerated.` });
    } catch {
      toast({ title: "Image refresh failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setRegeneratingImageId(null);
    }
  };

  const regenerateAiSummary = async (dest: AIDestination) => {
    if (!dest?.id || regeneratingSummaryId) return;
    setRegeneratingSummaryId(dest.id);
    try {
      const resp = await postOpenRouterProxy({
        action: "regenerateSummary",
        destination: dest.name,
        state: dest.state,
        category: dest.category,
      });
      if (!resp.ok) throw new Error("summary failed");
      const data = await resp.json();
      const description = String(data.description || "").trim();
      if (!description) throw new Error("empty summary");
      updateAiDestination(dest.id, (current) => ({ ...current, description }));
      toast({ title: "Summary refreshed", description: `${dest.name} summary updated.` });
    } catch {
      toast({ title: "Summary refresh failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setRegeneratingSummaryId(null);
    }
  };

  const handleGenerateCard = useCallback(async () => {
    if (!searchQuery.trim() || isGenerating) return;

    setIsGenerating(true);
    toast({ title: "✨ AI is Researching", description: `Uncovering secrets of "${searchQuery}"...`, duration: 3000 });

    try {
      // 1. Fetch real imagery from Pexels first or concurrent
      const imageUrl = await getPexelsImage(searchQuery, {
        context: "destination",
        destination: searchQuery,
      });

      // 2. Fetch metadata from AI
      const resp = await postOpenRouterProxy({
        action: "searchDestination",
        query: searchQuery,
      });

      if (!resp.ok) throw new Error("AI research failed");

      const data = await resp.json();
      const newDest = data as AIDestination;

      // Combine AI metadata with real Pexels image
      newDest.image = imageUrl;
      if (!newDest.id.includes("-ai")) newDest.id = `${newDest.id}-ai`;

      const existingAI = JSON.parse(localStorage.getItem("planzo_ai_destinations") || "[]") as AIDestination[];
      localStorage.setItem("planzo_ai_destinations", JSON.stringify([newDest, ...existingAI]));

      setSearchQuery("");
      setRefreshKey(prev => prev + 1);
      toast({ title: "Research Complete! 🎊", description: `${newDest.name} added to your map.` });
      setTimeout(() => navigate(`/destination/${newDest.id}`), 500);
    } catch (error) {
      console.error(error);
      toast({ title: "Research Failed", description: "AI couldn't reach the destination.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, navigate, searchQuery, toast]);

  // Auto-trigger AI research when no static results found
  useEffect(() => {
    if (searchQuery.trim().length > 3 && filtered.length === 0 && !isGenerating) {
      const timer = setTimeout(() => {
        handleGenerateCard();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [filtered.length, handleGenerateCard, isGenerating, searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkeletons(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-5 md:container py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">Explore India</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover incredible destinations across India</p>
      </motion.div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2 mt-5">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-card shadow-card">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Indian destinations..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowSortPanel(!showSortPanel)}
          className={`p-3 rounded-xl shadow-card transition-colors ${showSortPanel ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          title="Sort & Filter"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>

      {/* Sort panel */}
      <AnimatePresence>
        {showSortPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 rounded-xl bg-card shadow-card overflow-hidden"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <SortAsc className="h-3 w-3" /> Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowSortPanel(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${sortBy === opt.value ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tags */}
      <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
        {filterTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeFilter === tag
              ? "gradient-hero text-primary-foreground"
              : "bg-card text-muted-foreground shadow-card hover:text-foreground"
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      {(searchQuery || activeFilter !== "All") && (
        <p className="text-xs text-muted-foreground mt-3 mb-1">
          {filtered.length} {filtered.length === 1 ? "destination" : "destinations"} found
          {sortBy !== "default" && <span className="ml-2 text-primary font-medium flex-inline items-center gap-1"><TrendingUp className="h-3 w-3 inline-block mr-0.5" />{sortOptions.find(s => s.value === sortBy)?.label}</span>}
        </p>
      )}

      {/* AI Intelligence Display */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 shadow-xl overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-display font-black text-primary tracking-tight">AI is researching "{searchQuery}"</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">Our AI scouts are gathering local highlights, food spots, and travel tips for you...</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="h-full w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
                    />
                  </div>
                  <span className="text-[10px] font-black text-primary/60 uppercase whitespace-nowrap">Live Probe</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : searchQuery.trim().length > 1 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 mb-2 overflow-hidden"
          >
            <div
              className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-primary font-display text-sm md:text-base leading-tight">Instant AI Research active</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Keep typing... if we can't find it, our AI will automatically research it for you!</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div key={refreshKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => <DestinationCardSkeleton key={`explore-skeleton-${i}`} />)
          : filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onMouseEnter={() => prefetchImage(d.image)}
            onClick={() => navigate(`/destination/${d.id}`)}
            className="group bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden">
              <SafeImage
                src={d.image}
                fallbackSrc={getDestinationFallbackImage(d.name, d.category)}
                alt={d.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider gradient-warm text-accent-foreground">
                {d.tag}
              </span>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-card/80 backdrop-blur text-foreground">
                {d.category}
              </span>
              {String(d.id).includes("-ai") ? (
                <span className="absolute top-3 right-20 px-2 py-1 rounded-full text-[9px] font-bold bg-primary/80 text-primary-foreground backdrop-blur">
                  AI generated
                </span>
              ) : (
                <span className="absolute top-3 right-20 px-2 py-1 rounded-full text-[9px] font-bold bg-emerald-600/80 text-white backdrop-blur">
                  Verified
                </span>
              )}
              {/* Wishlist button */}
              <button
                onClick={(e) => toggleWishlist(e, String(d.id), d.name)}
                className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${wishlist.includes(String(d.id))
                  ? "bg-red-500 text-white"
                  : "bg-white/30 text-white hover:bg-white/50"
                  }`}
              >
                <Heart className={`h-3.5 w-3.5 ${wishlist.includes(String(d.id)) ? "fill-white" : ""}`} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{d.name}</h3>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {d.state}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-xs font-medium text-foreground">
                  <Star className="h-3.5 w-3.5 fill-sunset text-sunset" />
                  {d.rating}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {d.price.replace("₹", "")}
                </span>
                <span className="text-xs text-muted-foreground">{d.days} · Best: {d.bestTime}</span>
              </div>
              {String(d.id).includes("-ai") && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void regenerateAiImage(d);
                    }}
                    disabled={regeneratingImageId === d.id}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {regeneratingImageId === d.id ? <Loader2 className="h-3 w-3 inline animate-spin" /> : <RefreshCw className="h-3 w-3 inline" />} Image
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void regenerateAiSummary(d);
                    }}
                    disabled={regeneratingSummaryId === d.id}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {regeneratingSummaryId === d.id ? <Loader2 className="h-3 w-3 inline animate-spin" /> : <Wand2 className="h-3 w-3 inline" />} Summary
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No destinations found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or filter</p>
          <button onClick={() => { setSearchQuery(""); setActiveFilter("All"); }} className="mt-3 text-sm font-semibold text-primary hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;
