import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripPlan, TripDay, TripActivity } from '@/types/trip-plan';
import { MapPin } from 'lucide-react';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface InteractiveMapProps {
  plan: TripPlan;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ plan }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !plan.itinerary || plan.itinerary.length === 0) return;

    // Clean up if already exists
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Extract points
    const validPoints: [number, number][] = [];
    const pointDetails: { title: string, day: number }[] = [];

    plan.itinerary.forEach((day: TripDay) => {
      day.activities?.forEach((act: TripActivity | string) => {
        if (typeof act !== 'string' && act.lat && act.lng) {
          validPoints.push([act.lat, act.lng]);
          pointDetails.push({ title: act.name || 'Activity', day: day.day });
        }
      });
    });

    if (validPoints.length === 0) return;

    // Initialize Map
    mapInstance.current = L.map(mapRef.current, {
      center: validPoints[0],
      zoom: 11,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    const markerGroup = L.featureGroup().addTo(mapInstance.current);

    validPoints.forEach((point, i) => {
      const details = pointDetails[i];
      const popupHtml = `
        <div class="px-1 py-0.5">
          <div class="text-[10px] uppercase font-bold text-indigo-600 mb-1">Day ${details.day}</div>
          <div class="font-bold text-sm text-slate-800">${details.title}</div>
        </div>
      `;
      L.marker(point, { icon: defaultIcon })
        .bindPopup(popupHtml)
        .addTo(markerGroup);
    });

    if (validPoints.length > 1) {
      L.polyline(validPoints, {
        color: '#6366f1',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.7
      }).addTo(mapInstance.current);
    }

    // Fit bounds
    const bounds = L.latLngBounds(validPoints);
    mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [plan]);

  return (
    <div className="w-full mt-6 mb-8 rounded-2xl overflow-hidden shadow-card border border-border/50 bg-card relative">
      <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-border flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-bold text-sm text-foreground">Interactive Route Map</span>
      </div>
      <div ref={mapRef} className="h-[400px] w-full" />
    </div>
  );
};

export default InteractiveMap;
