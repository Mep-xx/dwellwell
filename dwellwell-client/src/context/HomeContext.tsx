// dwellwell-client/src/context/homecontext.tsx

import { createContext, useContext, useState } from 'react';

export type Home = {
  id: string;
  address: string;
  nickname?: string;
  zillowId?: string;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  photoUrl?: string;
  hasPool?: boolean;
  roomCount?: number;
  // You can add more fields as needed
};

type HomeContextType = {
  selectedHomeId: string | null;
  setSelectedHomeId: (id: string) => void;
  selectedHome: Home | null;
  setSelectedHome: (home: Home | null) => void;
};

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);

  return (
    <HomeContext.Provider
      value={{
        selectedHomeId,
        setSelectedHomeId,
        selectedHome,
        setSelectedHome,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export const useHome = (): HomeContextType => {
  const ctx = useContext(HomeContext);
  if (!ctx) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return ctx;
};
