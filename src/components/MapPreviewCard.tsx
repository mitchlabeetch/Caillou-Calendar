import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { geocodeLocation, type MapPreview } from '../lib/geocoder';

interface Props {
  location: string;
}

/**
 * Map preview card for an event's location. Lazy-loads the geocode
 * result on mount; gracefully hides itself when no result is available.
 */
export function MapPreviewCard({ location }: Props) {
  const [preview, setPreview] = useState<MapPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    geocodeLocation(location).then((res) => {
      if (!cancelled) setPreview(res);
    });
    return () => { cancelled = true; };
  }, [location]);

  if (!preview) return null;
  return (
    <a
      href={`https://www.openstreetmap.org/?mlat=${preview.lat}&mlon=${preview.lon}#map=15/${preview.lat}/${preview.lon}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 border-[2px] border-ink rounded-xl overflow-hidden shadow-neo-sm hover:shadow-neo-md transition-shadow"
    >
      <img src={preview.staticImageUrl} alt={preview.label} className="w-full h-32 object-cover" />
      <div className="px-3 py-2 bg-bg-light flex items-center gap-2 text-xs font-bold">
        <MapPin className="w-3.5 h-3.5 opacity-60" />
        <span className="truncate">{preview.label}</span>
      </div>
    </a>
  );
}