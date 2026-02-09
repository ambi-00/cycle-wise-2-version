import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface MTTradeEnrichment {
  screenshot_url?: string;
  entry_reason?: string;
  rrr?: number;
  position_size?: number;
}

export function useMTTrade() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const enrichMTTrade = async (tradeId: string, data: MTTradeEnrichment) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('mt_trades')
        .update({
          ...data,
          is_enriched: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: 'Trade enriched',
        description: 'Your MT trade has been updated with entry details.',
      });
      return true;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to enrich trade',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadScreenshot = async (file: File, tradeId: string): Promise<string | null> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const fileName = `mt-trade-${tradeId}-${Date.now()}.png`;
      const filePath = `${user.data.user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('mt-screenshots')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('mt-screenshots')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to upload screenshot',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    enrichMTTrade,
    uploadScreenshot,
    isUpdating,
  };
}
