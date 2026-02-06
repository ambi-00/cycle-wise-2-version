import { useEffect } from 'react';
import { showXPNotification } from '@/components/XPToast';

export function useXPNotifications() {
  useEffect(() => {
    const handleXPEarned = (event: CustomEvent) => {
      const { amount, reason, reasons } = event.detail;
      showXPNotification({ amount, reason, reasons });
    };

    window.addEventListener('xp-earned' as any, handleXPEarned as any);
    return () => {
      window.removeEventListener('xp-earned' as any, handleXPEarned as any);
    };
  }, []);
}
