import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, Calendar, IndianRupee, Clock, Utensils,
  Mountain, Share2, Heart, Navigation
} from "lucide-react";
import { indianDestinations } from "@/data/destinations";

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const destination = indianDestinations.find((d) => d.id === id);

  if (!destination) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Destination not found</p>
          <button onClick={() => navigate("/")} className="mt-2 text-primary text-sm font-semibold">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(destination.name + ", India")}&zoom=12`;

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/20" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 md:container">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full glass text-foreground hover:bg-card/90 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full glass text-foreground hover:bg-card/90 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full glass text-foreground hover:bg-card/90 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {destination.tag && (
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider gradient-warm text-accent-foreground mb-2">
                {destination.tag}
              </span>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">{destination.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-primary-foreground/80">
                <MapPin className="h-3.5 w-3.5" />
                {destination.state}
              </span>
              <span className="flex items-center gap-1 text-sm text-primary-foreground/80">
                <Star className="h-3.5 w-3.5 fill-sunset text-sunset" />
                {destination.rating}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-5 md:container max-w-3xl mx-auto">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mt-5 overflow-x-auto scrollbar-hide"
        >
          {[
            { icon: IndianRupee, label: "From", value: destination.price },
            { icon: Clock, label: "Duration", value: destination.days },
            { icon: Calendar, label: "Best Time", value: destination.bestTime },
          ].map((stat) => (
            <div key={stat.label} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl bg-card shadow-card">
              <stat.icon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground">About</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{destination.description}</p>
        </motion.div>

        {/* Google Maps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Location
            </h2>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary"
            >
              Open in Maps
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-card border border-border">
            <iframe
              title={`Map of ${destination.name}`}
              src={mapEmbedUrl}
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground">Top Highlights</h2>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {destination.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card shadow-card">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Food Spots */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 text-coral" />
            Must-Try Food Spots
          </h2>
          <div className="flex flex-col gap-2 mt-3">
            {destination.foodSpots.map((f, i) => (
              <div key={f} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card shadow-card">
                <span className="h-7 w-7 rounded-lg bg-coral/10 flex items-center justify-center text-xs font-bold text-coral">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activities */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Mountain className="h-5 w-5 text-ocean" />
            Activities & Experiences
          </h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {destination.activities.map((a) => (
              <span
                key={a}
                className="px-3 py-2 rounded-full bg-ocean/10 text-ocean text-xs font-semibold"
              >
                {a}
              </span>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate(`/plan?dest=${destination.name}&days=${parseInt(destination.days)}&budget=${parseInt(destination.price.replace(/\\D/g, ""))}`)}
            className="w-full py-4 rounded-2xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-elevated"
          >
            Plan Trip to {destination.name.split(",")[0]}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default DestinationDetail;
