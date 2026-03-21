import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import type { TripPlan, TripDay, TripActivity } from '@/types/trip-plan';
import { MapPin, Loader2, Navigation, Clock, Info, Map } from 'lucide-react';

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

const InteractiveMap: React.FC<InteractiveMapProps> = ({ plan }) => {
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(window.google?.maps.TravelMode.DRIVING || 'DRIVING' as any);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const points = useMemo(() => {
    const validPoints: { lat: number, lng: number, title: string, day: number, place: string }[] = [];
    plan.itinerary?.forEach((day: TripDay) => {
      day.activities?.forEach((act: TripActivity | string) => {
        if (typeof act !== 'string' && act.lat && act.lng) {
          validPoints.push({
            lat: act.lat,
            lng: act.lng,
            title: act.name || 'Activity',
            day: day.day,
            place: act.place || ''
          });
        }
      });
    });
    return validPoints;
  }, [plan]);

  useEffect(() => {
    if (isLoaded && points.length > 1) {
      const directionsService = new google.maps.DirectionsService();
      
      const origin = points[0];
      const destination = points[points.length - 1];
      const waypoints = points.slice(1, -1).map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true
      }));

      directionsService.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints: waypoints,
          travelMode: travelMode,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`Directions request failed: ${status}`);
          }
        }
      );
    }
  }, [isLoaded, points, travelMode]);

  const onSelect = useCallback((point: any) => {
    setSelectedPoint(point);
  }, []);

  if (loadError) {
    return (
      <div className="w-full mt-6 mb-8 h-[450px] rounded-3xl overflow-hidden shadow-elevated border border-border/50 bg-card relative">
        <div className="absolute inset-0 bg-muted/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 ring-4 ring-primary/5">
            <Map className="h-8 w-8 text-primary/40" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">Interactive Travel Map</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Live route mapping is currently in preview mode. You can still access full turn-by-turn directions via the Google Maps link for this trip.
          </p>
          <button 
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(plan.destination)}`, '_blank')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            Open in Google Maps
          </button>
        </div>
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

  if (points.length === 0) return null;

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

        <div className="bg-card/90 backdrop-blur-xl p-1 rounded-2xl shadow-lg border border-border flex items-center gap-1 pointer-events-auto self-start">
          {(['DRIVING', 'WALKING', 'TRANSIT'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTravelMode(google.maps.TravelMode[mode])}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider ${
                travelMode === google.maps.TravelMode[mode]
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {mode.charAt(0) + mode.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

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
        {directions ? (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#10b981",
                strokeWeight: 5,
                strokeOpacity: 0.7
              }
            }}
          />
        ) : (
          points.map((point, i) => (
            <Marker
              key={i}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => onSelect(point)}
              label={{
                text: `${point.day}`,
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
              icon={{
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: '#6366f1',
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#ffffff',
                rotation: 90
              }}
            />
          ))
        )}

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

