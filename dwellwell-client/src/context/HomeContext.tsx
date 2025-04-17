import { createContext, useContext, useState } from 'react';

type HomeContextType = {
  selectedHomeId: string | null;
  setSelectedHomeId: (id: string) => void;
};

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const HomeProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);

  return (
    <HomeContext.Provider value={{ selectedHomeId, setSelectedHomeId }}>
      {children}
    </HomeContext.Provider>
  );
};

export const useHome = () => {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome must be used within a HomeProvider");
  return ctx;
};
