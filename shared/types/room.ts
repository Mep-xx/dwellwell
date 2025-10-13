// shared/types/room.ts
import { Task } from "./task";

export type Room = {
  id: string;
  name: string;
  type: string;
  floor?: number | null;
  hasFireplace?: boolean;
  hasBoiler?: boolean;
  hasSmokeDetector?: boolean;
  homeId: string;
  userTasks?: Task[];
};
