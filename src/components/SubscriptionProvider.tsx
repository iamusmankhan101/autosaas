'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export type Plan = 'FREE' | 'BASIC' | 'PRO';

interface SubscriptionContextType {
  plan: Plan;
  setPlan: (plan: Plan) => Promise<void>;
  isLoading: boolean;
  canUseMultiLocation: boolean;
  canUseBayScheduling: boolean;
  canUseWorkflow: boolean;
  canUsePOS: boolean;
  jobLimit: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const planSetting = useLiveQuery(() => db.settings.get('subscription_plan'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSubscription() {
      const existing = await db.settings.get('subscription_plan');
      if (!existing) {
        await db.settings.put({ key: 'subscription_plan', value: 'FREE' });
      }
      setIsLoading(false);
    }
    initSubscription();
  }, []);

  const plan = (planSetting?.value as Plan) || 'FREE';

  const setPlan = async (newPlan: Plan) => {
    await db.settings.put({ key: 'subscription_plan', value: newPlan });
  };

  const capabilities = {
    plan,
    setPlan,
    isLoading,
    canUseMultiLocation: plan === 'PRO',
    canUseBayScheduling: plan === 'BASIC' || plan === 'PRO',
    canUseWorkflow: plan === 'BASIC' || plan === 'PRO',
    canUsePOS: plan === 'PRO',
    jobLimit: plan === 'FREE' ? 100 : null,
  };

  return (
    <SubscriptionContext.Provider value={capabilities}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
