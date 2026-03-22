import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Hotel, Utensils, Compass, IndianRupee, Calendar, Mountain, Sparkles, TrendingUp, Heart, Palmtree, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AISearchBar from "@/components/AISearchBar";
import DestinationCard from "@/components/DestinationCard";
import SmartCard from "@/components/SmartCard";
import CategoryChip from "@/components/CategoryChip";
import { getAllDestinations } from "@/data/destinations";

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

const inspirations = [
  {
    title: "Romantic Scapes",
    subtitle: "Udaipur & Beyond",
    image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=2070&auto=format&fit=crop",
    className: "md:col-span-2 md:row-span-1"
  },
  {
    title: "Adrenaline",
    subtitle: "High Altitude Thrills",
    image: "https://images.unsplash.com/photo-1527664557558-a2b352fcf203?q=80&w=2070&auto=format&fit=crop",
    className: "md:col-span-1 md:row-span-2"
  },
  {
    title: "Tranquil Retreats",
    subtitle: "Kerala Backwaters",
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop",
    className: "md:col-span-1 md:row-span-1"
  },
  {
    title: "Heritage",
    subtitle: "Royal Rajasthan",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
    className: "md:col-span-1 md:row-span-1"
  }
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
  },
  {
    id: 5,
    name: "Taj Lake Palace",
    location: "Udaipur",
    image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=2070&auto=format&fit=crop",
    rating: 4.9,
    price: "₹35,000"
  },
  {
    id: 6,
    name: "The Oberoi Amarvilas",
    location: "Agra",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    rating: 4.8,
    price: "₹40,000"
  },
  {
    id: 7,
    name: "Umaid Bhawan Palace",
    location: "Jodhpur",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop",
    rating: 4.9,
    price: "₹45,000"
  },
  {
    id: 8,
    name: "ITC Grand Chola",
    location: "Chennai",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
    rating: 4.7,
    price: "₹15,000"
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
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Amritsari Kulcha",
    location: "Punjab",
    image: "https://images.unsplash.com/photo-1626779848520-216962f3aabe?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Rogan Josh",
    location: "Kashmir",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356236?q=80&w=1986&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "Dhokla",
    location: "Gujarat",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=2072&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Litti Chokha",
    location: "Bihar",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=2021&auto=format&fit=crop",
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
  },
  {
    id: 6,
    name: "Skiing",
    image: "https://images.unsplash.com/photo-1551524559-8af4e6624178?q=80&w=2026&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "Hot Air Ballooning",
    image: "https://images.unsplash.com/photo-1528629297340-d1d466945dc5?q=80&w=2022&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Surfing",
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=2070&auto=format&fit=crop",
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
    ? getAllDestinations()
    : getAllDestinations().filter((d) => d.category === activeCategory);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section className="relative h-[480px] md:h-[650px] overflow-hidden flex flex-col justify-center">
        {/* Cinematic Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-105"
        >
          <source src="https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4" type="video/mp4" />
          {/* Fallback — Shimla mountains, royalty-free */}
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background z-10" />

        <div className="relative z-20 px-5 md:container w-full h-full flex flex-col justify-center items-center text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center"
          >
            <div className="flex items-center gap-1.5 mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">
                AI-Powered Travel Intelligence
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-xl tracking-tight mb-4">
              Plan incredible trips <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300">in seconds.</span>
            </h1>

            <p className="text-sm md:text-lg text-white/90 max-w-2xl font-medium drop-shadow-md mb-10">
              Discover hidden gems, instantly craft perfect itineraries, and explore India like never before. Tell us your vibe, and our AI does the rest.
            </p>

            <div className="w-full animate-in fade-in zoom-in duration-1000 delay-300 fill-mode-both px-2 md:px-0">
              <AISearchBar />
            </div>
          </motion.div>
        </div>
        {/* Scroll down cue */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 animate-bounce">
          <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
          <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-8 px-5 md:container">
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

      {/* Featured Clone Carousel (Upgraded Trending) */}
      <section className="mt-10 px-5 md:container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Featured AI Trips
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-generated itineraries you can clone & customise instantly</p>
          </div>
          <button onClick={() => navigate("/explore")} className="text-xs font-semibold text-primary">
            See all
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
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



      {/* Travel Inspirations Bento Grid */}
      <section className="mt-12 px-5 md:container">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Travel Inspirations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Discover your next vibe through these curated escapes</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:auto-rows-[160px]">
          {inspirations.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              onClick={() => navigate("/explore")}
              className={`relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm border border-border/50 h-[160px] md:h-auto ${item.className}`}
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute bottom-4 left-4 right-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-1">{item.subtitle}</p>
                <h3 className="text-white font-display text-xl font-bold leading-tight drop-shadow-md">{item.title}</h3>
              </div>
            </motion.div>
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
              <SmartCard
                {...card}
                index={i}
                onClick={() => {
                  if (card.title === "Top Places") navigate("/explore");
                  else if (card.title === "Itinerary") navigate("/plan");
                  else if (card.title === "Food Spots") navigate("/explore");
                  else navigate("/explore");
                }}
              />
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
              onClick={() => navigate(`/plan?dest=${hotel.location}`)}
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
              onClick={() => navigate(`/plan?dest=${food.location}`)}
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
              onClick={() => navigate(`/plan`)}
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
