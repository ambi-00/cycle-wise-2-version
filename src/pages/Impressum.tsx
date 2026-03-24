import { motion } from "framer-motion";
import { Building2, Mail, MapPin } from "lucide-react";

export default function Impressum() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl p-4 lg:p-8"
      >
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Legal Notice</h1>
            <p className="text-muted-foreground">Information according to applicable law</p>
          </div>

          <div className="space-y-8">
            {/* Company Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Company Information</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">CycleWise Trades</p>
                <p>[Your Name / Company Name]</p>
                <p>[Street and Number]</p>
                <p>[ZIP and City]</p>
                <p>[Country]</p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-500/10 p-2.5">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Contact</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>Phone: [Your Phone Number]</p>
                <p>Email: [Your Email Address]</p>
                <p>Website: cyclewise-trades.com</p>
              </div>
            </section>

            {/* Optional: Business Registration */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Business Registration (if applicable)</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>Register court: [Court]</p>
                <p>Register number: [Number]</p>
                <p>VAT ID: [VAT Number]</p>
              </div>
            </section>

            {/* Responsible Content */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Responsible for Content</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>[Your Name]</p>
                <p>[Address]</p>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Disclaimer</h2>
              <div className="space-y-4 text-muted-foreground text-sm">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Liability for Content</h3>
                  <p>
                    The contents of our pages were created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Liability for Links</h3>
                  <p>
                    Our website contains links to external third-party websites over whose content we have no control. We therefore cannot accept any liability for this external content.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Trading Disclaimer</h3>
                  <p>
                    CycleWise Trades is a trading journal tool and does not provide financial advice.
                    Trading financial instruments involves risks and is not suitable for every investor.
                    Past results are no guarantee of future performance.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
