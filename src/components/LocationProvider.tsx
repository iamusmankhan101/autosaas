'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, Location } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface LocationContextType {
  currentLocationId: string | null;
  setCurrentLocationId: (id: string) => void;
  locations: Location[] | undefined;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocationId, setLocationId] = useState<string | null>(null);
  const locations = useLiveQuery(() => db.locations.toArray());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initLocation() {
      if (locations === undefined) return;

      let activeId = localStorage.getItem('mistry_location_id');

      if (locations.length === 0) {
        // Create default location
        const defaultLocation: Location = {
          id: crypto.randomUUID(),
          name: 'Main Branch',
          address: 'Default Address',
          created_at: Date.now(),
        };
        await db.locations.add(defaultLocation);
        activeId = defaultLocation.id;
      } else if (!activeId || !locations.find(l => l.id === activeId)) {
        activeId = locations[0].id;
      }

      if (activeId) {
        localStorage.setItem('mistry_location_id', activeId);
        setLocationId(activeId);
      }
      setIsLoading(false);
    }

    initLocation();
  }, [locations]);

  const setCurrentLocationId = (id: string) => {
    localStorage.setItem('mistry_location_id', id);
    setLocationId(id);
  };

  return (
    <LocationContext.Provider value={{ currentLocationId, setCurrentLocationId, locations, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
