import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

type Props = {
  addressLine: string;
  className?: string;
};

export default function MapboxAddress({ addressLine, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // ensure container is empty (StrictMode double-mount safe)
    containerRef.current.innerHTML = "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-71.566, 42.319],
      zoom: 12,
      cooperativeGestures: true
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
