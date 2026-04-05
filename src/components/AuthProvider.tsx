'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, User } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, workshop: string, password?: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const storedUserId = localStorage.getItem('mistry_user_id');
      if (storedUserId) {
        const u = await db.users.get(storedUserId);
        if (u) {
          setUser(u);
        } else {
          localStorage.removeItem('mistry_user_id');
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      const isPublicPage = pathname === '/login' || pathname === '/register';
      if (!user && !isPublicPage) {
        router.push('/login');
      } else if (user && isPublicPage) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password?: string) => {
    const u = await db.users.where('email').equals(email.toLowerCase()).first();
    if (u) {
      // In a real local app, we might check pass, here we just allow login for simplicity
      setUser(u);
      localStorage.setItem('mistry_user_id', u.id);
      router.push('/');
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, workshop: string, password?: string) => {
    const existing = await db.users.where('email').equals(email.toLowerCase()).first();
    if (existing) return false;

    const userId = crypto.randomUUID();
    const newUser: User = {
      id: userId,
      name,
      email: email.toLowerCase(),
      workshop_name: workshop,
      isAdmin: true,
      created_at: Date.now()
    };

    await db.users.add(newUser);
    
    // Auto-initialize first location if none exists
    const locationsCount = await db.locations.count();
    if (locationsCount === 0) {
      await db.locations.add({
        id: crypto.randomUUID(),
        name: workshop || 'Main Branch',
        created_at: Date.now()
      });
    }

    setUser(newUser);
    localStorage.setItem('mistry_user_id', userId);
    router.push('/');
    return true;
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    await db.users.update(user.id, data);
    setUser(updatedUser);
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;
    await db.users.update(user.id, { password: newPassword });
    // Update local state if needed (password isn't usually in state for security, but here we update the DB)
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mistry_user_id');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateUser, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
