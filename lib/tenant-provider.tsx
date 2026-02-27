"use client";

import React, { createContext, useContext } from "react";

type TenantContextType = {
  slug: string | null;
  name: string | null;
  isLoading?: boolean;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  slug,
  name,
}: {
  children: React.ReactNode;
  slug: string | null;
  name: string | null;
}) {
  const value = React.useMemo(() => ({ slug, name }), [slug, name]);

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
