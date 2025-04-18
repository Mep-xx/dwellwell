// src/shared/types/home.ts
export type Home = {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  nickname?: string | null;
  zillowId?: string | null;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  numberOfRooms?: number | null;
  imageUrl?: string | null;
  createdAt: string; // or Date if you convert it on fetch
  features?: string[] | null;
};
