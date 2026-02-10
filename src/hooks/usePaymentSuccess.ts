import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const usePaymentSuccess = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const paymentSuccess = searchParams.get("payment") === "success";
  const tier = searchParams.get("tier") as "premium" | "pro" | null;

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!paymentSuccess || !tier) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: user.id,
            tier: tier,
            status: "active",
          }, {
            onConflict: "user_id"
          });

        if (error) throw error;

        toast({
          title: "🎉 Zahlung erfolgreich!",
          description: `Ihr ${tier === "pro" ? "Pro" : "Premium"}-Zugang wurde aktiviert.`,
        });

        setSearchParams((prev) => {
          prev.delete("payment");
          prev.delete("tier");
          return prev;
        });

        setTimeout(() => window.location.reload(), 1000);

      } catch (error) {
        console.error("Payment error:", error);
        toast({
          title: "Fehler",
          description: "Subscription konnte nicht aktiviert werden.",
          variant: "destructive",
        });
      }
    };

    handlePaymentSuccess();
  }, [paymentSuccess, tier, toast, setSearchParams]);

  return { paymentSuccess };
};
