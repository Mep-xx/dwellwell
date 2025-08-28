//shared/types/home.ts
export type Home = {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  apartment?: string;
  nickname?: string;
  squareFeet?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  imageUrl?: string | null;
  isChecked: boolean;

  // ✅ Add these fields to support editing:
  roofType?: string | null;
  sidingType?: string | null;
  boilerType?: string | null;
  heatingCoolingTypes?: string[]; // assuming string[] is the intended type
  features?: string[];
  architecturalStyle?: string | null;
};
