// dwellwell-client/src/types/mapbox-geocoding.d.ts
declare module "@mapbox/mapbox-sdk/services/geocoding" {
  export interface GeocodeFeature {
    center: [number, number];
    bbox?: [number, number, number, number];
  }

  export interface GeocodeResponse {
    features?: GeocodeFeature[];
  }

  // Minimal surface we need
  export default function geocoding(config: {
    accessToken: string;
  }): {
    forwardGeocode(options: {
      query: string;
      limit?: number;
      autocomplete?: boolean;
      types?: string[];
    }): {
      send(): Promise<{ body: GeocodeResponse }>;
    };
  };
}
