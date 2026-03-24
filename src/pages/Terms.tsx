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
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Pricing, Payment &amp; Right of Withdrawal</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  <strong className="text-foreground">4.1 Prices:</strong> All prices are quoted in Euros (€) and are{" "}
                  <strong className="text-foreground">inclusive of applicable VAT</strong> (inkl. MwSt.) unless stated
                  otherwise. The exact VAT amount is shown at checkout.
                </p>
                <p>
                  <strong className="text-foreground">4.2 Payment:</strong> Payments are processed by Stripe, Inc. By
                  subscribing, you authorise Stripe to charge your payment method on a recurring basis according to
                  the selected billing cycle.
                </p>
                <p>
                  <strong className="text-foreground">4.3 Cancellation:</strong> You may cancel your subscription at any
                  time via Settings → Manage Subscription. Your access continues until the end of the current billing
                  period.
                </p>
                <div className="rounded-xl border border-blue-300 bg-blue-50 dark:bg-blue-950/20 p-4 mt-2">
                  <p className="font-semibold text-foreground mb-2">
                    4.4 EU Right of Withdrawal (§ 312g BGB / Directive 2011/83/EU)
                  </p>
                  <p className="text-sm">
                    As a consumer in the EU, you have the right to withdraw from this contract within{" "}
                    <strong>14 days</strong> without giving any reason (Widerrufsrecht). The withdrawal period begins on
                    the day the contract is concluded.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Loss of withdrawal right upon immediate service commencement (§ 356 (5) BGB):</strong>{" "}
                    By completing your subscription purchase, you expressly request that we begin providing the digital
                    service <strong>immediately</strong> — before the 14-day withdrawal period has expired. You
                    acknowledge and agree that your right of withdrawal expires once we have fully commenced the service.
                    By proceeding with payment, you confirm this agreement.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>How to exercise your withdrawal right</strong> (if service has not yet fully commenced):
                    Notify us by email at{" "}
                    <a href="mailto:privacy@cyclewise-trades.com" className="underline">
                      privacy@cyclewise-trades.com
                    </a>{" "}
                    with a clear declaration of your decision to withdraw (e.g. "I hereby withdraw from my contract").
                    We will confirm receipt promptly and process any eligible refund within 14 days.
                  </p>
                  <p className="text-sm mt-3 italic text-muted-foreground">
                    Model withdrawal form (not required): "I/We (*) hereby give notice that I/We (*) withdraw from my/our
                    (*) contract of sale of the following goods (*)/for the provision of the following service (*),
                    ordered on (*)/received on (*), Name of consumer(s), Address of consumer(s), Signature (only if
                    notified on paper), Date. (*) Delete as appropriate."
                  </p>
                </div>
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
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Applicable Law &amp; Jurisdiction</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  These Terms are governed by the law of the <strong className="text-foreground">Federal Republic of Germany</strong>,
                  excluding its conflict-of-law provisions. The UN Convention on Contracts for the International Sale of
                  Goods (CISG) does not apply.
                </p>
                <p>
                  If you are a consumer resident in the EU, you also benefit from any mandatory protective provisions of
                  the law of your country of residence.
                </p>
                <p>
                  The exclusive place of jurisdiction for disputes arising from these Terms is the registered office of
                  CycleWise Trades, Germany, to the extent permitted by applicable law.
                </p>
                <p>
                  The European Commission provides an Online Dispute Resolution (ODR) platform at{" "}
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline">
                    ec.europa.eu/consumers/odr
                  </a>. We are not obligated to participate in ADR proceedings.
                </p>
              </div>
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
