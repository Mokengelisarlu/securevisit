import React, { createContext, useContext, useState } from 'react';

type KioskMode = 'IN' | 'OUT' | null;
type VisitorMode = 'new' | 'existing' | null;

interface KioskContextType {
  mode: KioskMode;
  visitorMode: VisitorMode;
  step: number;
  justPaired: boolean;
  setMode: (mode: KioskMode) => void;
  setVisitorMode: (mode: VisitorMode) => void;
  setStep: (step: number) => void;
  setJustPaired: (val: boolean) => void;
  resetState: () => void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<KioskMode>(null);
  const [visitorMode, setVisitorMode] = useState<VisitorMode>(null);
  const [step, setStep] = useState(1);
  const [justPaired, setJustPaired] = useState(false);

  function resetState() {
    setMode(null);
    setVisitorMode(null);
    setStep(1);
    setJustPaired(false);
  }

  return (
    <KioskContext.Provider
      value={{
        mode,
        visitorMode,
        step,
        justPaired,
        setMode,
        setVisitorMode,
        setStep,
        setJustPaired,
        resetState,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKiosk must be used within KioskProvider');
  }
  return context;
}
