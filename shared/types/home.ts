// src/shared/types/home.ts
export type Home = {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  nickname?: string;
  zillowId?: string;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  numberOfRooms?: number;
  imageUrl?: string;
  features: string[];
  isChecked: boolean;
  createdAt: string;
};