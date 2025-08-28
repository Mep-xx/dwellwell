//dwellwell-client/src/components/MapboxAddress.tsx
import { useEffect, useRef } from "react";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // ← add this so the map styles load

type Props = { addressLine: string; className?: string };

export default function MapboxAddress({ addressLine, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  useEffect(() => {
    if (!ref.current || !token || !addressLine?.trim()) return;

    mapboxgl.accessToken = token;
    const geocoder = mbxGeocoding({ accessToken: token });

    let map: mapboxgl.Map | null = null;
    let marker: mapboxgl.Marker | null = null;

    geocoder
      .forwardGeocode({ query: addressLine, limit: 1 })
      .send()
      .then((resp) => {
        const match = resp.body?.features?.[0];
        if (!match) return;
        const [lng, lat] = match.center as [number, number];

        map = new mapboxgl.Map({
          container: ref.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom: 14,
        });

        marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      marker?.remove();
      map?.remove();
    };
  }, [addressLine, token]);

  if (!token) return null;
  return <div ref={ref} className={className ?? "h-64 w-full rounded border"} />;
}
