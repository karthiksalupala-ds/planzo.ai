import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ExploreMapProps {
  destinations: {
    id: string | number;
    name: string;
    state?: string;
    image?: string;
    lat?: number;
    lng?: number;
  }[];
}

const ExploreMap: React.FC<ExploreMapProps> = ({ destinations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current, {
      center: [22.9734, 78.6569],
      zoom: 4.5,
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add markers
    const markerGroup = L.featureGroup().addTo(mapInstance.current);

    destinations.forEach((dest) => {
      if (!dest.lat || !dest.lng) return;

      const popupContent = document.createElement('div');
      popupContent.className = 'w-48 overflow-hidden rounded-xl';
      
      let imageHtml = '';
      if (dest.image) {
        imageHtml = `<div class="h-24 w-full relative"><img src="${dest.image}" alt="${dest.name}" class="w-full h-full object-cover" /></div>`;
      }

      popupContent.innerHTML = `
        ${imageHtml}
        <div class="p-3 bg-card border-t border-border">
          <div class="font-bold text-sm text-foreground mb-0.5">${dest.name}</div>
          <div class="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
             ${dest.state || "India"}
          </div>
          <button id="btn-${dest.id}" class="w-full py-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Plan a trip here
          </button>
        </div>
      `;

      const marker = L.marker([dest.lat, dest.lng], { icon: defaultIcon })
        .bindPopup(popupContent)
        .addTo(markerGroup);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${dest.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/plan?q=${encodeURIComponent(dest.name + ", " + (dest.state || "India"))}`);
          };
        }
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [destinations, navigate]);

  return (
    <div className="w-full h-[450px] rounded-3xl overflow-hidden shadow-card border border-border/50 bg-card relative z-0">
      <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-border flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-bold text-sm text-foreground">Explore Map</span>
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default ExploreMap;
