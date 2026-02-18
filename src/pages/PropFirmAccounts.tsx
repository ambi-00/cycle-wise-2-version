import { motion } from "framer-motion";
import PropFirmConnect from "@/components/PropFirmConnect";
import { usePaymentSuccess } from "@/hooks/use-payment-success";

export default function PropFirmAccounts() {
  usePaymentSuccess();

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl p-4 lg:p-8"
      >
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">My Trading Accounts</h1>
          <p className="mt-1 text-muted-foreground">Connect and manage your prop firm and MetaTrader accounts</p>
        </div>
        
        <PropFirmConnect />
      </motion.div>
    </main>
  );
}
