'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// State center coordinates for fallback (examiners without airport coords)
const STATE_COORDS: Record<string, [number, number]> = {
  AL: [32.806671, -86.791130],
  AK: [61.370716, -152.404419],
  AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123],
  CA: [36.116203, -119.681564],
  CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371],
  DE: [39.318523, -75.507141],
  FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643074],
  HI: [21.094318, -157.498337],
  ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137],
  IN: [39.849426, -86.258278],
  IA: [42.011539, -93.210526],
  KS: [38.526600, -96.726486],
  KY: [37.668140, -84.670067],
  LA: [31.169546, -91.867805],
  ME: [44.693947, -69.381927],
  MD: [39.063946, -76.802101],
  MA: [42.230171, -71.530106],
  MI: [43.326618, -84.536095],
  MN: [45.694454, -93.900192],
  MS: [32.741646, -89.678696],
  MO: [38.456085, -92.288368],
  MT: [46.921925, -110.454353],
  NE: [41.125370, -98.268082],
  NV: [38.313515, -117.055374],
  NH: [43.452492, -71.563896],
  NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482],
  NY: [42.165726, -74.948051],
  NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012],
  OH: [40.388783, -82.764915],
  OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938],
  PA: [40.590752, -77.209755],
  RI: [41.680893, -71.511780],
  SC: [33.856892, -80.945007],
  SD: [44.299782, -99.438828],
  TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461],
  UT: [40.150032, -111.862434],
  VT: [44.045876, -72.710686],
  VA: [37.769337, -78.169968],
  WA: [47.400902, -121.490494],
  WV: [38.491226, -80.954453],
  WI: [44.268543, -89.616508],
  WY: [42.755966, -107.302490],
};

interface Examiner {
  id: number;
  name: string;
  airport_id: string | null;
  location: string;
  state: string;
  lat: number | null;
  lng: number | null;
  avg_quality: number | null;
  total_gouges: number;
}

interface ExaminerMapProps {
  examiners: Examiner[];
}

// Dynamically import the map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

function MapContent({ examiners }: ExaminerMapProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  if (!L) return null;

  // Create custom icon
  const createIcon = (rating: number | null) => {
    const color = !rating ? '#9CA3AF' : rating >= 4 ? '#22C55E' : rating >= 2.5 ? '#EAB308' : '#EF4444';
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Get coordinates - use airport coords if available, fallback to state center
  const getCoords = (examiner: Examiner, index: number): [number, number] => {
    if (examiner.lat && examiner.lng) {
      return [examiner.lat, examiner.lng];
    }
    // Fallback for examiners without coordinates
    const base = STATE_COORDS[examiner.state] || [39.8283, -98.5795];
    const offset = (index * 0.1) % 1;
    return [base[0] + offset - 0.5, base[1] + offset - 0.5];
  };

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {examiners.map((examiner, index) => {
        const coords = getCoords(examiner, index);
        return (
          <Marker
            key={examiner.id}
            position={coords}
            icon={createIcon(examiner.avg_quality)}
          >
            <Popup>
              <div className="text-sm">
                <a href={`/examiner/${examiner.id}`} className="font-bold text-blue-600 hover:underline">
                  {examiner.name}
                </a>
                {examiner.airport_id && (
                  <p className="font-mono text-[#00a67c]">{examiner.airport_id}</p>
                )}
                <p className="text-gray-600">{examiner.location}, {examiner.state}</p>
                {examiner.avg_quality && (
                  <p className="mt-1">
                    Rating: <span className="font-bold">{examiner.avg_quality.toFixed(1)}</span>/5
                  </p>
                )}
                <p className="text-gray-500">{examiner.total_gouges} review{examiner.total_gouges !== 1 ? 's' : ''}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function ExaminerMap({ examiners }: ExaminerMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContent examiners={examiners} />
      </MapContainer>
    </div>
  );
}
