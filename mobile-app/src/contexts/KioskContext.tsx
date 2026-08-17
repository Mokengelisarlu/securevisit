import React, { createContext, useContext, useState } from 'react';
import type { Visitor } from '@/src/types/api';

type KioskMode = 'IN' | 'OUT' | null;
type VisitorMode = 'new' | 'existing' | null;

interface KioskContextType {
  mode: KioskMode;
  visitorMode: VisitorMode;
  step: number;
  justPaired: boolean;
  preselectedVisitor: Visitor | null;
  setMode: (mode: KioskMode) => void;
  setVisitorMode: (mode: VisitorMode) => void;
  setStep: (step: number) => void;
  setJustPaired: (val: boolean) => void;
  setPreselectedVisitor: (visitor: Visitor | null) => void;
  resetState: () => void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<KioskMode>(null);
  const [visitorMode, setVisitorMode] = useState<VisitorMode>(null);
  const [step, setStep] = useState(1);
  const [justPaired, setJustPaired] = useState(false);
  const [preselectedVisitor, setPreselectedVisitor] = useState<Visitor | null>(null);

  function resetState() {
    setMode(null);
    setVisitorMode(null);
    setStep(1);
    setJustPaired(false);
    setPreselectedVisitor(null);
  }

  return (
    <KioskContext.Provider
      value={{
        mode,
        visitorMode,
        step,
        justPaired,
        preselectedVisitor,
        setMode,
        setVisitorMode,
        setStep,
        setJustPaired,
        setPreselectedVisitor,
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
