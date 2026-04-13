import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, Polyline, Circle } from '@react-google-maps/api';
import type { TripPlan, TripDay, TripActivity } from '@/types/trip-plan';
import { Loader2, Navigation, Clock, Info, Map } from 'lucide-react';

interface InteractiveMapProps {
  plan: TripPlan;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const premiumMapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

const libraries: ("places")[] = ["places"];

interface MapPoint {
  lat: number;
  lng: number;
  title: string;
  day: number;
  place: string;
}

const isValidCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const InteractiveMap: React.FC<InteractiveMapProps> = ({ plan }) => {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const points = useMemo(() => {
    const activityPoints: MapPoint[] = [];

    plan.itinerary?.forEach((day: TripDay) => {
      day.activities?.forEach((act: TripActivity | string) => {
        if (
          typeof act !== 'string' &&
          isValidCoordinate(act.lat) &&
          isValidCoordinate(act.lng)
        ) {
          activityPoints.push({
            lat: act.lat,
            lng: act.lng,
            title: act.name || 'Activity',
            day: day.day,
            place: act.place || ''
          });
        }
      });
    });

    if (activityPoints.length > 0) return activityPoints;

    if (isValidCoordinate(plan.map?.lat) && isValidCoordinate(plan.map?.lng)) {
      return [{
        lat: plan.map.lat,
        lng: plan.map.lng,
        title: plan.destination || 'Destination',
        day: 1,
        place: 'Center'
      }];
    }

    return [];
  }, [plan]);

  useEffect(() => {
    if (!isLoaded) return;
    if (points.length <= 1) {
      setRouteNotice(null);
      return;
    }

    setRouteNotice('Showing direct path between itinerary stops.');
  }, [isLoaded, points]);

  const onSelect = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
  }, []);

  if (loadError) {
    return (
      <div className="w-full mt-6 mb-8 h-[450px] rounded-3xl overflow-hidden shadow-elevated border border-border/50 bg-card relative">
        {plan.map?.embedUrl ? (
          <div className="h-full w-full relative">
            <iframe
              title={`Map fallback for ${plan.destination || "trip"}`}
              src={plan.map.embedUrl}
              className="h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="absolute top-4 right-4 rounded-xl bg-card/90 backdrop-blur px-3 py-2 border border-border text-[10px] font-semibold text-muted-foreground">
              Interactive route unavailable - showing map preview
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-muted/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 ring-4 ring-primary/5">
              <Map className="h-8 w-8 text-primary/40" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Interactive Travel Map</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Live route mapping is currently unavailable. You can still access full turn-by-turn directions via Google Maps.
            </p>
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(plan.destination || "")}`, '_blank')}
              className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Open in Google Maps
            </button>
          </div>
        )}
        <div className="absolute inset-0 grayscale opacity-20 pointer-events-none bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full mt-6 mb-8 h-[450px] rounded-3xl flex items-center justify-center bg-muted border border-border">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mapping Route</p>
        </div>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="w-full mt-6 mb-8 h-[450px] rounded-3xl overflow-hidden shadow-elevated border border-border/50 bg-card relative">
        {plan.map?.embedUrl ? (
          <iframe
            title={`Map preview for ${plan.destination || "trip"}`}
            src={plan.map.embedUrl}
            className="h-full w-full"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 p-8 text-center">
            <div>
              <Map className="h-8 w-8 text-primary/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Map preview not available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Generate or refresh itinerary to load route points.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full mt-6 mb-8 rounded-3xl overflow-hidden shadow-elevated border border-border/50 bg-card relative">
      {/* Overlay controls */}
      <div className="absolute top-4 left-4 right-4 z-[10] flex flex-col md:flex-row justify-between gap-3 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg border border-border flex items-center gap-3 pointer-events-auto">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Navigation className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-foreground block leading-none">Smart Route</span>
            <span className="text-[10px] text-muted-foreground">{points.length} stops in total</span>
          </div>
        </div>

        <div className="bg-card/90 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-lg border border-border pointer-events-auto self-start">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legacy-free route view</span>
        </div>
      </div>

      {routeNotice && (
        <div className="absolute top-24 left-4 right-4 z-[10] pointer-events-none">
          <div className="bg-amber-50/95 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] font-medium px-3 py-2 rounded-xl shadow-sm">
            {routeNotice}
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={11}
        center={points[0]}
        options={{
          styles: premiumMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
        }}
        onLoad={map => {
          if (points.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            points.forEach(p => bounds.extend(p));
            map.fitBounds(bounds);
          }
        }}
      >
        {points.length > 1 && (
          <Polyline
            path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
            options={{
              strokeColor: "#10b981",
              strokeWeight: 4,
              strokeOpacity: 0.75,
              geodesic: true,
            }}
          />
        )}

        {points.map((point, i) => (
          <Circle
            key={i}
            center={{ lat: point.lat, lng: point.lng }}
            radius={120}
            onClick={() => onSelect(point)}
            options={{
              fillColor: '#6366f1',
              fillOpacity: 0.92,
              strokeColor: '#ffffff',
              strokeOpacity: 0.95,
              strokeWeight: 2,
              clickable: true,
              zIndex: 20,
            }}
          />
        ))}

        {selectedPoint && (
          <InfoWindow
            position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            onCloseClick={() => setSelectedPoint(null)}
          >
            <div className="p-2 min-w-[160px] max-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">Day {selectedPoint.day}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</span>
              </div>
              <p className="font-bold text-sm text-foreground mb-1 leading-tight">{selectedPoint.title}</p>
              <p className="text-[10px] text-muted-foreground italic truncate">{selectedPoint.place}</p>
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                <Info className="h-3 w-3 text-primary" />
                <span className="text-[9px] text-muted-foreground">Click card for more details</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default InteractiveMap;
