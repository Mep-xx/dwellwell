export type Room = {
    id: string;
    homeId: string;
    name: string;       // e.g., “Master Bathroom”
    type: string;       // e.g., “Bathroom”, “Bedroom”
    floor?: number;     // optional numeric floor reference
  };
  