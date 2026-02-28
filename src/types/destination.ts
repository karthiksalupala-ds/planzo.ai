export interface Destination {
  id: string;
  image: string;
  name: string;
  state: string;
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
}
