import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, IndianRupee, X, SortAsc, TrendingUp, ArrowUpDown, Heart } from "lucide-react";
import { indianDestinations } from "@/data/destinations";
import { useToast } from "@/hooks/use-toast";

const filterTags = ["All", "Culture", "Beach", "Nature", "Adventure", "Romantic"];
const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Rating (High–Low)", value: "rating_desc" },
  { label: "Price (Low–High)", value: "price_asc" },
  { label: "Price (High–Low)", value: "price_desc" },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("planzo_wishlist") || "[]"); } catch { return []; }
  });
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

  const filtered = indianDestinations
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tag
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

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/destination/${d.id}`)}
            className="group bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={d.image}
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
              {/* Wishlist button */}
              <button
                onClick={(e) => toggleWishlist(e, String(d.id), d.name)}
                className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
                  wishlist.includes(String(d.id))
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
