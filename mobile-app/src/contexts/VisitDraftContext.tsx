import React, { createContext, useContext, useState } from 'react';

interface VehicleDraft {
  plateNumber: string;
  type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'OTHER';
  brand?: string;
  color?: string;
  passengerCount?: number;
}

interface VisitDraft {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  visitorTypeId?: string;
  visitorId?: string;
  hostId?: string;
  departmentId?: string;
  purpose?: string;
  vehicle: VehicleDraft | null;
  visitorPhotoUrl?: string;
  vehiclePhotoUrl?: string;
  signatureData?: string;
}

interface VisitDraftContextType {
  draft: VisitDraft;
  setDraft: (draft: VisitDraft) => void;
  updateDraft: (partial: Partial<VisitDraft>) => void;
  setVehicle: (vehicle: VehicleDraft | null) => void;
  resetDraft: () => void;
}

const initialDraft: VisitDraft = { vehicle: null };

const VisitDraftContext = createContext<VisitDraftContextType | undefined>(undefined);

export function VisitDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VisitDraft>(initialDraft);

  function updateDraft(partial: Partial<VisitDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function setVehicle(vehicle: VehicleDraft | null) {
    setDraft((prev) => ({ ...prev, vehicle }));
  }

  function resetDraft() {
    setDraft(initialDraft);
  }

  return (
    <VisitDraftContext.Provider
      value={{ draft, setDraft, updateDraft, setVehicle, resetDraft }}
    >
      {children}
    </VisitDraftContext.Provider>
  );
}

export function useVisitDraft() {
  const context = useContext(VisitDraftContext);
  if (context === undefined) {
    throw new Error('useVisitDraft must be used within VisitDraftProvider');
  }
  return context;
}
