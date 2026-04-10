import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, Calendar, IndianRupee, Clock, Utensils,
  Mountain, Share2, Heart, Navigation, Plus, Send, User
} from "lucide-react";
import { getAllDestinations } from "@/data/destinations";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const destination = getAllDestinations().find((d) => d.id === id);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Load reviews from localStorage
    const stored = localStorage.getItem(`reviews_${id}`);
    if (stored) {
      try { setReviews(JSON.parse(stored)); } catch {}
    }
    // Check wishlist
    try {
      const wl = JSON.parse(localStorage.getItem("planzo_wishlist") || "[]");
      setIsWishlisted(wl.includes(id));
    } catch {}
  }, [id]);

  const handleSubmitReview = () => {
    if (!reviewName.trim() || !reviewText.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    const review: Review = {
      id: crypto.randomUUID(),
      name: reviewName.trim(),
      rating: reviewRating,
      text: reviewText.trim(),
      date: new Date().toISOString(),
    };
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updated));
    setShowReviewForm(false);
    setReviewName("");
    setReviewText("");
    setReviewRating(5);
    toast({ title: "Review submitted! ⭐", description: "Thanks for sharing your experience." });
  };

  const toggleWishlist = () => {
    try {
      const wl = JSON.parse(localStorage.getItem("planzo_wishlist") || "[]");
      const updated = isWishlisted ? wl.filter((w: string) => w !== id) : [...wl, id];
      localStorage.setItem("planzo_wishlist", JSON.stringify(updated));
      setIsWishlisted(!isWishlisted);
      toast({ title: isWishlisted ? "Removed from wishlist" : "Added to wishlist ♡" });
    } catch {}
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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
    <div className="min-h-screen pb-28">
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
            <button
              onClick={toggleWishlist}
              className={`p-2 rounded-full glass transition-colors ${isWishlisted ? "text-red-500 bg-red-500/20" : "text-foreground hover:bg-card/90"}`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500" : ""}`} />
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
                {avgRating ? `${avgRating} (${reviews.length})` : destination.rating}
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

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-sunset" />
              Reviews {reviews.length > 0 && <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>}
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Write Review
            </button>
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-3">
                  <input
                    type="text"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= reviewRating
                              ? "fill-sunset text-sunset"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{reviewRating}/5</span>
                  </div>

                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    rows={3}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      className="flex-1 py-2.5 rounded-xl gradient-hero text-white text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-2xl bg-card border border-border shadow-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < review.rating ? "fill-sunset text-sunset" : "text-muted-foreground/20"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </motion.div>

      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={toggleWishlist}
            className={`h-12 px-4 rounded-xl border border-border flex items-center gap-2 text-sm font-semibold transition-colors ${
              isWishlisted ? "bg-red-500/10 text-red-500" : "bg-card text-foreground hover:bg-muted/50"
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500" : ""}`} />
            {isWishlisted ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => navigate(`/plan?dest=${destination.name}&days=${parseInt(destination.days)}&budget=${parseInt(destination.price.replace(/\\D/g, ""))}`)}
            className="flex-1 h-12 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-elevated"
          >
            Plan Trip to {destination.name.split(",")[0]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;

