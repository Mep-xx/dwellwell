import { Task } from './task';

  export type Room = {
    id: string;
    name: string;     // e.g., “Master Bathroom”
    type: string;     // e.g., “Bathroom”, “Bedroom”
    floor?: number;   // optional numeric floor reference
    hasFireplace?: boolean;
    hasBoiler?: boolean;
    hasSmokeDetector?: boolean;
    homeId: string;
    userTasks?: Task[];
  };
  