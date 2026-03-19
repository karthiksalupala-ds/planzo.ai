import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripPlan, TripDay, TripActivity } from '@/types/trip-plan';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet marker icons in React (Nextjs/Vite issue)
// We will use standard leaflet icons 
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A component to auto-fit the map bounds to our markers
const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, points]);
  return null;
};

interface InteractiveMapProps {
  plan: TripPlan;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ plan }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-[400px] w-full rounded-2xl bg-muted animate-pulse" />;
  
  if (!plan.itinerary || plan.itinerary.length === 0) return null;

  // Extract all valid coordinates from the itinerary
  const validPoints: { lat: number, lng: number, title: string, day: number, type: string }[] = [];
  
  plan.itinerary.forEach((day: TripDay) => {
    day.activities?.forEach((act: TripActivity | string) => {
      if (typeof act !== 'string' && act.lat && act.lng) {
        validPoints.push({
           lat: act.lat, 
           lng: act.lng, 
           title: act.name || 'Activity',
           day: day.day,
           type: 'activity'
        });
      }
    });
  });

  // If no points, fallback to destination coords or center the world
  const centerLat = validPoints.length > 0 ? validPoints[0].lat : plan.map?.lat || 20;
  const centerLng = validPoints.length > 0 ? validPoints[0].lng : plan.map?.lng || 0;
  
  const polylinePositions = validPoints.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="w-full mt-6 mb-8 rounded-2xl overflow-hidden shadow-card border border-border/50 bg-card relative">
      <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-border flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-bold text-sm text-foreground">Interactive Route Map</span>
      </div>
      
      <div className="h-[400px] w-full">
        {/* Leaflet map container must have explicit height */}
        <MapContainer 
           center={[centerLat, centerLng]} 
           zoom={11} 
           style={{ height: '100%', width: '100%', zIndex: 10 }}
           scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {validPoints.map((point, index) => (
            <Marker key={index} position={[point.lat, point.lng]} icon={defaultIcon}>
              <Popup className="rounded-xl overflow-hidden">
                <div className="px-1 py-0.5">
                  <div className="text-[10px] uppercase font-bold text-primary mb-1">Day {point.day}</div>
                  <div className="font-bold text-sm">{point.title}</div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {polylinePositions.length > 1 && (
            <Polyline 
               positions={polylinePositions} 
               pathOptions={{ color: '#6366f1', weight: 3, dashArray: '8, 8', opacity: 0.7 }} 
            />
          )}

          {polylinePositions.length > 0 && <FitBounds points={polylinePositions} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;
