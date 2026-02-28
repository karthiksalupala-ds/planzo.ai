import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Hotel, Utensils, Compass, IndianRupee, Calendar, Mountain, Sparkles, TrendingUp, Heart, Palmtree } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AISearchBar from "@/components/AISearchBar";
import DestinationCard from "@/components/DestinationCard";
import SmartCard from "@/components/SmartCard";
import CategoryChip from "@/components/CategoryChip";
import { indianDestinations } from "@/data/destinations";
import heroImg from "@/assets/hero-travel.jpg";

const categories = [
  { icon: Compass, label: "All" },
  { icon: Mountain, label: "Adventure" },
  { icon: Utensils, label: "Food" },
  { icon: Heart, label: "Romantic" },
  { icon: IndianRupee, label: "Budget" },
  { icon: Palmtree, label: "Beach" },
];

const smartCards = [
  { icon: MapPin, title: "Top Places", description: "Discover India's most iconic destinations", color: "teal" as const },
  { icon: Utensils, title: "Food Spots", description: "Street food, thalis, and local delicacies", color: "coral" as const },
  { icon: Hotel, title: "Hotels", description: "Best rated stays matching your budget", color: "ocean" as const },
  { icon: Calendar, title: "Itinerary", description: "AI-generated day-wise travel plans", color: "sunset" as const },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filteredDestinations = activeCategory === "All"
    ? indianDestinations
    : indianDestinations.filter((d) => d.category === activeCategory);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[420px] md:h-[500px] overflow-hidden">
        <img src={heroImg} alt="Travel hero" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background" />
        <div className="relative h-full flex flex-col justify-end px-5 pb-8 md:container md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-sunset" />
              <span className="text-xs font-semibold text-primary-foreground/90 uppercase tracking-wider">
                AI-Powered · Explore India
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight">
              Smart Trip
              <br />
              Planner
            </h1>
            <p className="text-sm md:text-base text-primary-foreground/80 mt-2 max-w-md">
              Discover incredible India – from the Taj Mahal to Kerala backwaters, plan your perfect trip with AI.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Search */}
      <div className="px-5 md:container -mt-6 relative z-10">
        <AISearchBar />
      </div>

      {/* Categories */}
      <section className="mt-6 px-5 md:container">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((c) => (
            <CategoryChip
              key={c.label}
              icon={c.icon}
              label={c.label}
              isActive={activeCategory === c.label}
              onClick={() => setActiveCategory(c.label)}
            />
          ))}
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="mt-8 px-5 md:container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trending in India
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top destinations this season</p>
          </div>
          <button onClick={() => navigate("/explore")} className="text-xs font-semibold text-primary">
            See all
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {filteredDestinations.map((d, i) => (
            <DestinationCard
              key={d.id}
              image={d.image}
              name={d.name}
              country={d.state}
              rating={d.rating}
              tag={d.tag}
              index={i}
              onClick={() => navigate(`/destination/${d.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Smart Cards */}
      <section className="mt-8 px-5 md:container pb-8">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {smartCards.map((card, i) => (
            <SmartCard key={card.title} {...card} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
