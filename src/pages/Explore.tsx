import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Star, Filter, IndianRupee } from "lucide-react";
import { indianDestinations } from "@/data/destinations";

const filterTags = ["All", "Culture", "Beach", "Nature", "Adventure", "Romantic"];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();

  const filtered = indianDestinations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || d.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="px-5 md:container py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">Explore India</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover incredible destinations across India</p>
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-2 mt-5">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-card shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Indian destinations..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button className="p-3 rounded-xl bg-card shadow-card text-muted-foreground hover:text-foreground transition-colors">
          <Filter className="h-4 w-4" />
        </button>
      </div>

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

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">No destinations found. Try a different search.</p>
        </div>
      )}
    </div>
  );
};

export default Explore;
