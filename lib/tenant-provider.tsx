"use client";

import React, { createContext, useContext } from "react";

type TenantContextType = {
  slug: string | null;
  name: string | null;
  logoUrl: string | null;
  isLoading?: boolean;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  slug,
  name,
  logoUrl,
}: {
  children: React.ReactNode;
  slug: string | null;
  name: string | null;
  logoUrl: string | null;
}) {
  const value = React.useMemo(() => ({ slug, name, logoUrl }), [slug, name, logoUrl]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
