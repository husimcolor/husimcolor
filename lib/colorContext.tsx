import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ColorData } from '@/constants/colorData';

interface ColorContextType {
  selectedColors: (ColorData | null)[];
  setSelectedColor: (index: number, color: ColorData | null) => void;
  resetColors: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const [selectedColors, setSelectedColors] = useState<(ColorData | null)[]>([null, null, null]);

  const setSelectedColor = (index: number, color: ColorData | null) => {
    setSelectedColors((prev) => {
      const next = [...prev];
      next[index] = color;
      return next;
    });
  };

  const resetColors = () => {
    setSelectedColors([null, null, null]);
  };

  return (
    <ColorContext.Provider value={{ selectedColors, setSelectedColor, resetColors }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColorContext() {
  const ctx = useContext(ColorContext);
  if (!ctx) throw new Error('useColorContext must be used within ColorProvider');
  return ctx;
}
