import React, { useMemo, useCallback, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, Search, Navigation } from 'lucide-react';

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

type ExploreDestination = ExploreMapProps["destinations"][number];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 22.9734,
  lng: 78.6569,
};

// Premium "Silver" map style from Google Maps
const premiumMapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

const libraries: ("places")[] = ["places"];

const ExploreMap: React.FC<ExploreMapProps> = ({ destinations }) => {
  const [selectedDest, setSelectedDest] = useState<ExploreDestination | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchResult, setSearchResult] = useState<google.maps.places.Autocomplete | null>(null);
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const validDestinations = useMemo(() => 
    destinations.filter(d => d.lat && d.lng),
    [destinations]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setSearchResult(autocomplete);
  }, []);

  const onPlaceChanged = () => {
    if (searchResult !== null) {
      const place = searchResult.getPlace();
      if (place.geometry && place.geometry.location) {
        map?.panTo(place.geometry.location);
        map?.setZoom(12);
      }
    }
  };

  const onSelect = useCallback((dest: ExploreDestination) => {
    setSelectedDest(dest);
    if (map) {
      map.panTo({ lat: dest.lat, lng: dest.lng });
      map.setZoom(10);
    }
  }, [map]);

  if (loadError) {
    return (
      <div className="w-full h-[500px] rounded-3xl flex items-center justify-center bg-muted text-muted-foreground border border-dashed border-border p-8 text-center">
        <div>
          <MapPin className="h-10 w-10 mx-auto mb-4 opacity-20" />
          <p className="font-semibold">Map currently unavailable</p>
          <p className="text-xs opacity-70">Please verify your API key and connection.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] rounded-3xl flex items-center justify-center bg-muted border border-border">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initializing Explorer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-elevated border border-border/50 bg-card relative">
      {/* HUD Header */}
      <div className="absolute top-4 left-4 right-4 z-[10] flex flex-col md:flex-row gap-3">
        <div className="bg-card/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg border border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Navigation className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-foreground block leading-none">Global Explorer</span>
            <span className="text-[10px] text-muted-foreground">{validDestinations.length} curated spots</span>
          </div>
        </div>

        {/* Search Integration */}
        <div className="flex-1 max-w-sm">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search any destination..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </Autocomplete>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={4.5}
        center={center}
        onLoad={onMapLoad}
        options={{
          styles: premiumMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative'
        }}
      >
        {validDestinations.map((dest) => (
          <Marker
            key={dest.id}
            position={{ lat: dest.lat!, lng: dest.lng! }}
            onClick={() => onSelect(dest)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: selectedDest?.id === dest.id ? 10 : 7,
              fillColor: selectedDest?.id === dest.id ? '#10b981' : '#f43f5e',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
            animation={selectedDest?.id === dest.id ? window.google.maps.Animation.BOUNCE : undefined}
          />
        ))}

        {selectedDest && (
          <InfoWindow
            position={{ lat: selectedDest.lat!, lng: selectedDest.lng! }}
            onCloseClick={() => setSelectedDest(null)}
          >
            <div className="w-56 overflow-hidden rounded-xl p-0 bg-card border-none">
              {selectedDest.image && (
                <div className="h-28 w-full relative">
                  <img src={selectedDest.image} alt={selectedDest.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white font-bold text-sm leading-tight">{selectedDest.name}</p>
                    <p className="text-white/80 text-[10px]">{selectedDest.state || "India"}</p>
                  </div>
                </div>
              )}
              <div className="p-3">
                <button 
                  onClick={() => navigate(`/plan?q=${encodeURIComponent(selectedDest.name + ", " + (selectedDest.state || "India"))}`)}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Navigation className="h-3 w-3" /> Start Planning
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default ExploreMap;
