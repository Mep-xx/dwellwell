// src/shared/types/home.ts
export type Home = {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  nickname?: string | null;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  numberOfRooms?: number | null;
  architecturalStyle?: string | null;
  features: string[];
  imageUrl?: string | null;
  isChecked: boolean;
  createdAt: string;
};