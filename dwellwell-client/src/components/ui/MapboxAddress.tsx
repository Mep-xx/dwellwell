// dwellwell-client/src/components/MapboxAddress.tsx
import React, { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import "mapbox-gl/dist/mapbox-gl.css";

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
if (typeof window !== "undefined" && token) {
  mapboxgl.accessToken = token;
}

const geocoder =
  token && typeof window !== "undefined"
    ? mbxGeocoding({ accessToken: token })
    : null;

type Props = {
  addressLine: string;
  className?: string;
};

export default function MapboxAddress({ addressLine, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const enabled = useMemo(() => Boolean(token) && typeof window !== "undefined", []);

  // Init once
  useEffect(() => {
    if (!enabled) return;
    if (!containerRef.current || mapRef.current) return;

    // Reset container (hot reload / remount safety)
    containerRef.current.innerHTML = "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.566, 42.319],
      zoom: 13,
      scrollZoom: false,
      dragRotate: false,
      touchZoomRotate: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [enabled]);

  // Geocode on address change
  useEffect(() => {
    if (!enabled || !geocoder) return;
    const map = mapRef.current;
    const q = addressLine?.trim();
    if (!map || !q) return;

    let cancelled = false;

    geocoder
      .forwardGeocode({
        query: q,
        limit: 1,
        autocomplete: false,
        types: ["address", "place", "locality"],
      })
      .send()
      .then(({ body }) => {
        if (cancelled) return;
        const feat = body?.features?.[0];
        if (!feat) return;

        const [lng, lat] = feat.center;

        if (!markerRef.current) markerRef.current = new mapboxgl.Marker();
        markerRef.current.setLngLat([lng, lat]).addTo(map);

        if (feat.bbox && feat.bbox.length === 4) {
          map.fitBounds(feat.bbox as [number, number, number, number], {
            padding: 24,
            maxZoom: 16,
            duration: 0,
          });
        } else {
          map.setCenter([lng, lat]);
          map.setZoom(15);
        }
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.warn("Geocode failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [addressLine, enabled]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label={enabled ? "Map showing address" : "Map unavailable"}
    />
  );
}
