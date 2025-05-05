  export type Room = {
    id: string;
    name: string;     // e.g., “Master Bathroom”
    type: string;     // e.g., “Bathroom”, “Bedroom”
    floor?: number;   // optional numeric floor reference
    homeId: string;
    hasFireplace?: boolean;
    hasBoiler?: boolean;
    hasSmokeDetector?: boolean;
  };
  