// dwellwell-client/src/components/MapboxAddress.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;
const geocoder = mbxGeocoding({ accessToken: mapboxgl.accessToken! });

type Props = {
  addressLine: string;
  className?: string;
};

export default function MapboxAddress({ addressLine, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    containerRef.current.innerHTML = "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-71.566, 42.319],
      zoom: 13,
      // keep the embed quiet, and remove the “use two fingers” overlay
      scrollZoom: false,
      dragRotate: false,
      touchZoomRotate: false,
      // cooperativeGestures: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Geocode on address change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !addressLine?.trim()) return;

    let cancelled = false;

    geocoder
      .forwardGeocode({
        query: addressLine,
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
          map.fitBounds(feat.bbox, { padding: 24, maxZoom: 16, duration: 0 });
        } else {
          map.setCenter([lng, lat]);
          map.setZoom(15);
        }
      })
      .catch((err: unknown) => {
        console.warn("Geocode failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [addressLine]);

  return <div ref={containerRef} className={className} />;
}
