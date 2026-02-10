import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "premium" | "pro";

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from("subscriptions")
            .select("tier, status")
            .eq("user_id", user.id)
            .single();

          if (data?.status === "active") {
            setTier((data.tier as SubscriptionTier) || "free");
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const hasAccess = (requiredTier: SubscriptionTier) => {
    const tierOrder: Record<SubscriptionTier, number> = {
      free: 0,
      premium: 1,
      pro: 2,
    };
    return tierOrder[tier] >= tierOrder[requiredTier];
  };

  return { tier, loading, hasAccess };
};
