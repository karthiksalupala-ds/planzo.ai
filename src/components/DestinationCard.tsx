import { MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

interface DestinationCardProps {
  image: string;
  name: string;
  country: string;
  rating: number;
  tag?: string;
  onClick?: () => void;
  index?: number;
}

const DestinationCard = ({ image, name, country, rating, tag, onClick, index = 0 }: DestinationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={onClick}
      className="group relative flex-shrink-0 w-44 md:w-56 cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
        {tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider gradient-warm text-accent-foreground">
            {tag}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display font-semibold text-primary-foreground text-sm">{name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="flex items-center gap-1 text-primary-foreground/80 text-xs">
              <MapPin className="h-3 w-3" />
              {country}
            </span>
            <span className="flex items-center gap-0.5 text-primary-foreground/90 text-xs">
              <Star className="h-3 w-3 fill-sunset text-sunset" />
              {rating}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationCard;
