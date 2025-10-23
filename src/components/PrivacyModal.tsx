import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6 overflow-y-auto">
          <div className="pr-4">
            <article className="prose prose-slate dark:prose-invert max-w-none py-4">
              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Your Privacy Matters</h2>
                <p className="text-sm mb-4">
                  At Courtney's List, we respect your privacy and are committed to protecting your personal information.
                </p>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">What We Collect</h2>
                <ul className="space-y-2 text-sm">
                  <li><strong>Account Information:</strong> Name, email address, and residential address (for verification)</li>
                  <li><strong>Content:</strong> Reviews, ratings, and comments you submit</li>
                  <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
                </ul>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">What We Show Publicly</h2>
                <div className="p-4 bg-muted/50 rounded-lg mb-3">
                  <p className="text-sm mb-2"><strong>Public Display:</strong></p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Your first name, last initial, and street name (e.g., "Sarah L. on Palm Court")</li>
                    <li>✅ Or "Neighbor on Palm Court" if you choose anonymous display</li>
                    <li>✅ Your reviews and ratings</li>
                  </ul>
                  <p className="text-sm mb-2 mt-3"><strong>Never Shown Publicly:</strong></p>
                  <ul className="space-y-1 text-sm">
                    <li>❌ Your full address or house number</li>
                    <li>❌ Your email address</li>
                    <li>❌ Your phone number</li>
                  </ul>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
                <ul className="space-y-2 text-sm">
                  <li><strong>Service Operation:</strong> Display reviews, manage your account, send notifications</li>
                  <li><strong>Community Reports:</strong> Share anonymized reviews with HOA boards and management</li>
                  <li><strong>Vendor Feedback:</strong> Provide anonymized reviews to service providers</li>
                  <li><strong>Communication:</strong> Send weekly updates, service announcements, and community highlights</li>
                </ul>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Who We Share With</h2>
                <ul className="space-y-2 text-sm">
                  <li><strong>Your Community:</strong> Anonymized reviews in reports to HOA boards</li>
                  <li><strong>Vendors:</strong> Reviews with names anonymized (e.g., "Resident in Boca Bridges")</li>
                  <li><strong>Service Providers:</strong> Email delivery, database hosting, analytics (under strict data protection agreements)</li>
                  <li><strong>Legal Requirements:</strong> If required by law or to protect rights and safety</li>
                </ul>
                <p className="text-sm mt-3">
                  <strong>We do NOT sell your personal information to third parties.</strong>
                </p>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
                <ul className="space-y-2 text-sm">
                  <li><strong>Access:</strong> Request a copy of your data</li>
                  <li><strong>Correction:</strong> Update inaccurate information</li>
                  <li><strong>Deletion:</strong> Delete your account (reviews you've posted remain)</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing emails anytime</li>
                </ul>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Data Security</h2>
                <p className="text-sm">
                  We implement industry-standard security measures to protect your information, including encryption, 
                  secure servers, and access controls. However, no system is 100% secure, and we cannot guarantee 
                  absolute security.
                </p>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
                <p className="text-sm">
                  We may update this Privacy Policy from time to time. We'll notify you of significant changes via 
                  email or through the service.
                </p>
              </section>

              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                <p className="text-sm">
                  Questions about privacy? Email us at: <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
                </p>
              </section>

              <div className="border-t pt-4 mt-6">
                <p className="text-xs text-muted-foreground">
                  <strong>Last Updated:</strong> 10.23.25
                </p>
              </div>
            </article>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
