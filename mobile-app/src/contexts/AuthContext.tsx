import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'kiosk_device_token';

interface AuthContextType {
  deviceToken: string | null;
  isCheckingToken: boolean;
  saveToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEY);
      if (token) {
        setDeviceToken(token);
      }
    } catch (err) {
      console.error('Failed to load token:', err);
    } finally {
      setIsCheckingToken(false);
    }
  }

  async function saveToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, token);
      setDeviceToken(token);
    } catch (err) {
      console.error('Failed to save token:', err);
      throw err;
    }
  }

  async function clearToken() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setDeviceToken(null);
    } catch (err) {
      console.error('Failed to clear token:', err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        deviceToken,
        isCheckingToken,
        saveToken,
        clearToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
