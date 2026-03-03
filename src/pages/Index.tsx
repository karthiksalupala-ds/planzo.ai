import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Hotel, Utensils, Compass, IndianRupee, Calendar, Mountain, Sparkles, TrendingUp, Heart, Palmtree, Star } from "lucide-react";
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

const famousHotels = [
  {
    id: 1,
    name: "The Taj Mahal Palace",
    location: "Mumbai",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    rating: 4.9,
    price: "₹25,000"
  },
  {
    id: 2,
    name: "Rambagh Palace",
    location: "Jaipur",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
    rating: 4.8,
    price: "₹30,000"
  },
  {
    id: 3,
    name: "Wildflower Hall",
    location: "Shimla",
    image: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?q=80&w=2070&auto=format&fit=crop",
    rating: 4.7,
    price: "₹22,000"
  },
  {
    id: 4,
    name: "Kumarakom Lake Resort",
    location: "Kerala",
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop",
    rating: 4.6,
    price: "₹18,000"
  }
];

const topFoods = [
  {
    id: 1,
    name: "Hyderabadi Biryani",
    location: "Hyderabad",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Vada Pav",
    location: "Mumbai",
    image: "https://images.unsplash.com/photo-1603208776066-2422643a5324?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Butter Chicken",
    location: "Delhi",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Masala Dosa",
    location: "South India",
    image: "https://images.unsplash.com/photo-1668236543090-d2f89695343e?q=80&w=1888&auto=format&fit=crop",
  }
];

const popularActivities = [
  {
    id: 1,
    name: "Hiking",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Scuba Diving",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Paragliding",
    image: "https://images.unsplash.com/photo-1527664557558-a2b352fcf203?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Camping",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "River Rafting",
    image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1976&auto=format&fit=crop",
  }
];

const howItWorks = [
  {
    icon: MapPin,
    title: "Choose Destination",
    desc: "Select from popular spots or search any place in India."
  },
  {
    icon: Sparkles,
    title: "AI Planning",
    desc: "Our AI creates a personalized itinerary based on your mood."
  },
  {
    icon: IndianRupee,
    title: "Budget Smart",
    desc: "Get cost estimates and manage expenses effortlessly."
  },
  {
    icon: Heart,
    title: "Enjoy Your Trip",
    desc: "Save your plan, share with friends, and make memories."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filteredDestinations = activeCategory === "All"
    ? indianDestinations
    : indianDestinations.filter((d) => d.category === activeCategory);

  return (
    <div className="min-h-screen pb-20">
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

      {/* Quick Access */}
      <section className="mt-8 px-5 md:container">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">
          Quick Access
        </h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {smartCards.map((card, i) => (
            <motion.div key={card.title} variants={itemVariants}>
              <SmartCard {...card} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Famous Hotels */}
      <section className="mt-10 px-5 md:container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Hotel className="h-5 w-5 text-primary" />
              Famous Hotels
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Luxury stays for your next trip</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 md:mx-0 md:px-0">
          {famousHotels.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-64 group cursor-pointer"
            >
              <div className="relative h-40 rounded-2xl overflow-hidden mb-3">
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-white">{hotel.rating}</span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground truncate">{hotel.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {hotel.location}
                </p>
                <p className="text-sm font-bold text-primary">{hotel.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Foods */}
      <section className="mt-8 px-5 md:container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-coral" />
              Must-Try Foods
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Local delicacies you can't miss</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topFoods.map((food, i) => (
            <motion.div
              key={food.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="relative h-32 rounded-2xl overflow-hidden group cursor-pointer"
            >
              <img src={food.image} alt={food.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <h3 className="text-white font-bold text-sm">{food.name}</h3>
                <p className="text-white/80 text-[10px]">{food.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Activities */}
      <section className="mt-10 px-5 md:container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Mountain className="h-5 w-5 text-ocean" />
              Popular Activities
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Experiences you'll remember forever</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 md:mx-0 md:px-0">
          {popularActivities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-40 group cursor-pointer"
            >
              <div className="relative h-56 rounded-2xl overflow-hidden mb-2 shadow-card">
                <img src={activity.image} alt={activity.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-white font-bold text-sm">{activity.name}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-12 px-5 md:container mb-10">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground">How It Works</h2>
          <p className="text-sm text-muted-foreground mt-2">Plan your perfect trip in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {howItWorks.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-elevated transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
