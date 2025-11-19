import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ConflictEvent, ConflictType } from '../types';
import { Crosshair, AlertTriangle, Users, Skull, Target, Flag } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default Leaflet marker icons in some build environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  events: ConflictEvent[];
}

// Helper to create custom icons based on event type
const createCustomIcon = (type: ConflictType) => {
  let color = '#ef4444'; // red-500 default
  let IconComponent = AlertTriangle;

  switch (type) {
    case ConflictType.BATTLE:
      color = '#dc2626'; // red-600
      IconComponent = Crosshair;
      break;
    case ConflictType.PROTEST:
      color = '#3b82f6'; // blue-500
      IconComponent = Users;
      break;
    case ConflictType.RIOT:
      color = '#f97316'; // orange-500
      IconComponent = Flag;
      break;
    case ConflictType.EXPLOSION:
      color = '#b91c1c'; // red-700
      IconComponent = Target;
      break;
    case ConflictType.VIOLENCE_AGAINST_CIVILIANS:
      color = '#7f1d1d'; // red-900
      IconComponent = Skull;
      break;
    case ConflictType.STRATEGIC_DEVELOPMENT:
      color = '#10b981'; // emerald-500
      IconComponent = Flag;
      break;
  }

  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8">
      <div className="absolute w-full h-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: color }}></div>
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full shadow-lg border-2 border-white dark:border-zinc-900" style={{ backgroundColor: color }}>
        <IconComponent size={12} color="white" />
      </div>
    </div>
  );

  return new L.DivIcon({
    html: iconMarkup,
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Center
    popupAnchor: [0, -16],
  });
};

// Component to handle auto-zooming to bounds
const MapUpdater: React.FC<{ events: ConflictEvent[] }> = ({ events }) => {
  const map = useMap();

  useEffect(() => {
    if (events.length > 0) {
      const bounds = L.latLngBounds(events.map(e => [e.latitude, e.longitude]));
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 10, duration: 1.5 });
    }
  }, [events, map]);

  return null;
};

const ConflictMap: React.FC<MapProps> = ({ events }) => {
  const defaultCenter: [number, number] = [20.0, 0.0]; // World centerish
  const defaultZoom = 2;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', background: '#18181b' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater events={events} />

        {events.map((event) => (
          <Marker 
            key={event.id} 
            position={[event.latitude, event.longitude]}
            icon={createCustomIcon(event.type)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{event.type}</span>
                    <span className="text-xs text-zinc-400">{event.date}</span>
                </div>
                <h3 className="font-bold text-zinc-900 text-sm mb-1">{event.location}, {event.country}</h3>
                <p className="text-zinc-600 text-xs mb-2 leading-relaxed">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-100 p-2 rounded">
                    <div>
                        <span className="block text-zinc-400 text-[10px]">Fatalities</span>
                        <span className="font-mono font-bold text-red-600">{event.fatalities}</span>
                    </div>
                     <div>
                        <span className="block text-zinc-400 text-[10px]">Source</span>
                        <span className="truncate block">{event.source || 'Unknown'}</span>
                    </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ConflictMap;
