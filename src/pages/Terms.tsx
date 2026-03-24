import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl p-4 lg:p-8"
      >
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US')}</p>
          </div>

          <div className="space-y-8">
            {/* Scope */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">1. Scope</h2>
              </div>
              <p className="text-muted-foreground">
                These Terms of Service apply to the use of the CycleWise Trades platform.
                By registering and using our services, you accept these terms.
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Services</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>CycleWise Trades provides the following services:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Trading journal with AI-powered insights</li>
                  <li>Cycle tracking and cycle phase analysis</li>
                  <li>Performance statistics and trading analytics</li>
                  <li>Prop firm account management (optional)</li>
                  <li>Strategy management and optimization</li>
                </ul>
                <p className="mt-4">
                  The platform is intended as a self-organization tool and does not provide financial advice.
                </p>
              </div>
            </section>

            {/* Registration & Account */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Registration and Account</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">3.1 Registration:</strong> A valid email address is required to use the platform.
                </p>
                <p>
                  <strong className="text-foreground">3.2 Credentials:</strong> You are responsible for keeping your login credentials confidential and protecting them from unauthorized access.
                </p>
                <p>
                  <strong className="text-foreground">3.3 Account suspension:</strong> We reserve the right to suspend accounts in case of misuse or violation of these Terms.
                </p>
              </div>
            </section>

            {/* Pricing & Payment */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Pricing and Payment</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">4.1 Free use:</strong> The platform is currently available free of charge.
                </p>
                <p>
                  <strong className="text-foreground">4.2 Future pricing:</strong> We reserve the right to offer premium features for a fee in the future. Existing users will be notified in advance.
                </p>
              </div>
            </section>

            {/* Usage Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-green-500/10 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">5. Usage Rights</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">5.1 Permitted use:</strong> You receive a non-exclusive, non-transferable right to use the platform for personal purposes.
                </p>
                <p>
                  <strong className="text-foreground">5.2 Prohibited use:</strong> The following is prohibited:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Reverse engineering or decompiling the software</li>
                  <li>Automated data queries (scraping)</li>
                  <li>Sharing login credentials with third parties</li>
                  <li>Use for illegal purposes</li>
                </ul>
              </div>
            </section>

            {/* Data & Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Data and Privacy</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">6.1 Your data:</strong> You retain all rights to the trading and cycle data you enter.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong className="text-foreground">6.2 Privacy:</strong> The processing of personal data is governed by our Privacy Policy.
              </p>
            </section>

            {/* Liability */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">7. Liability and Disclaimer</h2>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">7.1 No financial advice:</strong> CycleWise Trades does not provide investment advice. All trading decisions are made at your own risk.
                </p>
                <p>
                  <strong className="text-foreground">7.2 Trading risks:</strong> Trading financial instruments carries significant risk of loss. You acknowledge that you understand and accept these risks.
                </p>
                <p>
                  <strong className="text-foreground">7.3 Technical availability:</strong> We strive for high availability but cannot guarantee 100% uptime.
                </p>
                <p>
                  <strong className="text-foreground">7.4 Limitation of liability:</strong> We are only liable for intent and gross negligence to the extent permitted by law.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Termination</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong className="text-foreground">8.1 Your termination:</strong> You can delete your account at any time in the settings.
                </p>
                <p>
                  <strong className="text-foreground">8.2 Our termination:</strong> We may terminate your account immediately for serious violations of these Terms.
                </p>
                <p>
                  <strong className="text-foreground">8.3 Data export:</strong> You can export your data before account deletion.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to update these Terms. Material changes will be communicated to you by email.
                If you do not agree to the changes, you may terminate your account.
              </p>
            </section>

            {/* Applicable Law */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Applicable Law</h2>
              <p className="text-muted-foreground">
                The laws of the applicable jurisdiction govern these Terms. The place of jurisdiction is [your location], to the extent permitted by law.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Severability</h2>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be invalid, the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            {/* Contact */}
            <section className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: [Support Email]<br />
                Address: [Your Address]
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
