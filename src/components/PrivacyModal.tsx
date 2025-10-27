import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "full" | "plain-english";
}

export function PrivacyModal({ open, onOpenChange, variant: initialVariant = "plain-english" }: PrivacyModalProps) {
  const [variant, setVariant] = useState<"full" | "plain-english">(initialVariant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-2xl">
            {variant === "full" ? "Privacy Policy" : "Privacy Policy (Plain English)"}
          </DialogTitle>
          <div className="flex gap-2 pt-3">
            <Button
              variant={variant === "plain-english" ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant("plain-english")}
            >
              Plain English
            </Button>
            <Button
              variant={variant === "full" ? "default" : "outline"}
              size="sm"
              onClick={() => setVariant("full")}
            >
              Full Privacy Policy
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6 overflow-y-auto">
          <div className="pr-4">
            {variant === "full" ? <FullPrivacyContent /> : <PlainEnglishContent />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FullPrivacyContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none py-4">
      <p className="text-sm text-muted-foreground mb-6">
        <strong>Effective Date:</strong> October 27, 2025<br />
        <strong>Last Updated:</strong> October 27, 2025
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Introduction</h2>
        <p className="text-sm mb-3">
          Welcome to BridgeList ("we," "our," or "us"). We are committed to protecting your privacy and being transparent about how we collect, use, and share your information. This Privacy Policy explains our data practices for the BridgeList platform (bridgelist.org and courtneys-list.com).
        </p>
        <p className="text-sm">
          BridgeList is a hyperlocal service provider review platform that connects residential community members with trusted local vendors. We take your privacy seriously and have designed our platform to protect your personal information while enabling meaningful neighbor-to-neighbor recommendations.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
        
        <h3 className="text-lg font-semibold mb-2">1.1 Information You Provide Directly</h3>
        
        <p className="text-sm mb-2"><strong>Account Registration:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Email address</li>
          <li>Name (first and last)</li>
          <li>Home address</li>
          <li>Community/HOA name</li>
        </ul>

        <p className="text-sm mb-2"><strong>Reviews and Ratings:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Service provider reviews and ratings</li>
          <li>Cost information you share</li>
          <li>Comments and feedback</li>
          <li>Photos (if you choose to upload them)</li>
        </ul>

        <p className="text-sm mb-2"><strong>Communications:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Messages you send to us</li>
          <li>Survey responses</li>
          <li>Feedback and support requests</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">1.2 Information Collected Automatically</h3>
        
        <p className="text-sm mb-2"><strong>Usage Data:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Pages you visit on our platform</li>
          <li>Features you use</li>
          <li>Time spent on pages</li>
          <li>Click patterns and navigation paths</li>
        </ul>

        <p className="text-sm mb-2"><strong>Device and Browser Information:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Device type (mobile, desktop)</li>
          <li>Operating system</li>
          <li>Referring website</li>
        </ul>

        <p className="text-sm mb-2"><strong>Session Data:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Login times</li>
          <li>Session duration</li>
          <li>Unique session identifiers</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">1.3 Information from Third Parties</h3>
        
        <p className="text-sm mb-2"><strong>Address Verification:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>We may use Google Places API to verify and standardize addresses</li>
          <li>This helps ensure accurate community assignment</li>
        </ul>

        <p className="text-sm mb-2"><strong>Authentication Services:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>When you sign in via email magic links, we receive confirmation of email delivery and opens</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
        
        <h3 className="text-lg font-semibold mb-2">2.1 Primary Uses</h3>
        
        <p className="text-sm mb-2"><strong>Community Verification:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Verify you live in the community you're joining</li>
          <li>Match you with neighbors in your HOA/community</li>
          <li>Prevent unauthorized access to community reviews</li>
        </ul>

        <p className="text-sm mb-2"><strong>Platform Services:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Display your reviews to other verified community members</li>
          <li>Calculate vendor ratings and statistics</li>
          <li>Show cost estimates based on community data</li>
          <li>Enable vendor contact features</li>
        </ul>

        <p className="text-sm mb-2"><strong>Communications:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Send magic link authentication emails</li>
          <li>Send weekly community digest emails</li>
          <li>Send notifications about your reviews and activity</li>
          <li>Respond to your support requests</li>
        </ul>

        <p className="text-sm mb-2"><strong>Platform Improvement:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Analyze usage patterns to improve features</li>
          <li>Identify bugs and technical issues</li>
          <li>Understand which features are most valuable</li>
          <li>Plan new community expansions</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">2.2 Privacy-Protective Display Logic</h3>
        <p className="text-sm mb-3">
          We implement tiered privacy controls based on user authentication and community membership:
        </p>

        <p className="text-sm mb-2"><strong>For Logged-Out Visitors:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Reviews show "Neighbor on [Street Name]" without personal names</li>
          <li>This protects reviewer identity from public internet access</li>
        </ul>

        <p className="text-sm mb-2"><strong>For Logged-In Members of the SAME Community:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Reviews show first name and last initial (e.g., "John S. on Main St")</li>
          <li>Only if the reviewer chose to show their name in settings</li>
          <li>Reviewers who choose "Hide Name" show as "Neighbor on [Street Name]"</li>
        </ul>

        <p className="text-sm mb-2"><strong>For Logged-In Members of OTHER Communities:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Reviews always show "Neighbor on [Street Name]"</li>
          <li>This protects cross-community privacy even for verified users</li>
        </ul>

        <p className="text-sm mb-2"><strong>Street Names:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Street names are always visible to demonstrate hyperlocal authenticity</li>
          <li>They prove reviews come from real neighbors in the community</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. How We Share Your Information</h2>
        
        <h3 className="text-lg font-semibold mb-2">3.1 Within Your Community</h3>
        
        <p className="text-sm mb-2"><strong>Verified Community Members:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Your reviews are visible to other verified members of your community</li>
          <li>Your name (if you choose to display it) is visible to community members</li>
          <li>Your street name is visible to demonstrate you're a real neighbor</li>
        </ul>

        <p className="text-sm mb-2"><strong>Privacy Controls:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>You can choose to hide your name on reviews (shows as "Neighbor")</li>
          <li>Your full address is never displayed publicly</li>
          <li>Only street names are shown</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.2 Cross-Community Sharing</h3>
        
        <p className="text-sm mb-2"><strong>Members of Other Communities:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Can see your review content and ratings</li>
          <li>Cannot see your name (always shows as "Neighbor")</li>
          <li>Can see your street name and community name</li>
        </ul>

        <p className="text-sm mb-2"><strong>Why We Do This:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Helps users research vendors when considering a move</li>
          <li>Demonstrates platform legitimacy across communities</li>
          <li>Protects your identity outside your immediate neighborhood</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.3 Service Providers</h3>
        <p className="text-sm mb-3">
          We share limited information with trusted third-party service providers:
        </p>

        <p className="text-sm mb-2"><strong>Supabase (Database & Hosting):</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Stores all platform data securely</li>
          <li>Provides authentication services</li>
          <li>Located in US data centers</li>
          <li>SOC 2 Type II certified</li>
        </ul>

        <p className="text-sm mb-2"><strong>Resend (Email Delivery):</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Sends authentication emails and newsletters</li>
          <li>Receives your email address and name</li>
          <li>Tracks email opens and clicks for analytics</li>
        </ul>

        <p className="text-sm mb-2"><strong>Google Analytics (Usage Analytics):</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Receives anonymized usage data</li>
          <li>Tracks page views and user flows</li>
          <li>Does not receive your name or address</li>
          <li>Uses cookies to track sessions</li>
        </ul>

        <p className="text-sm mb-2"><strong>Looker Studio (Analytics Dashboard):</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>May access aggregated, anonymized data from Supabase</li>
          <li>Used for internal analytics and reporting</li>
          <li>Does not receive personally identifiable information</li>
        </ul>

        <p className="text-sm mb-2"><strong>Google Places API (Address Verification):</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Receives addresses you enter for verification</li>
          <li>Returns standardized address format</li>
          <li>Subject to Google's privacy policy</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.4 We Do NOT Sell Your Data</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>We never sell your personal information to third parties</li>
          <li>We never share your data with advertisers</li>
          <li>We never provide your contact information to vendors (unless you choose to contact them directly)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.5 Legal Requirements</h3>
        <p className="text-sm mb-2">We may disclose your information if required by law:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>In response to court orders or subpoenas</li>
          <li>To comply with legal processes</li>
          <li>To protect our rights or property</li>
          <li>To prevent fraud or abuse</li>
          <li>To protect user safety</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
        
        <h3 className="text-lg font-semibold mb-2">4.1 Security Measures</h3>
        
        <p className="text-sm mb-2"><strong>Technical Safeguards:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Data encrypted in transit (SSL/TLS)</li>
          <li>Data encrypted at rest in databases</li>
          <li>Secure authentication via magic links</li>
          <li>Row-level security policies in database</li>
          <li>Regular security audits</li>
        </ul>

        <p className="text-sm mb-2"><strong>Access Controls:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Limited employee access to personal data</li>
          <li>Role-based access controls</li>
          <li>Audit logs of data access</li>
        </ul>

        <p className="text-sm mb-2"><strong>Infrastructure:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Hosted on secure, SOC 2 certified platforms</li>
          <li>Regular backups</li>
          <li>Disaster recovery procedures</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">4.2 Your Responsibility</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>Keep your email account secure (magic links sent there)</li>
          <li>Don't share your account access with others</li>
          <li>Report suspicious activity immediately</li>
          <li>Log out on shared devices</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. Your Privacy Rights</h2>
        
        <h3 className="text-lg font-semibold mb-2">5.1 Access and Control</h3>
        
        <p className="text-sm mb-2"><strong>View Your Data:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Access your profile and all reviews you've written</li>
          <li>See your activity history and points</li>
          <li>View your account settings</li>
        </ul>

        <p className="text-sm mb-2"><strong>Edit Your Information:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Update your name and address</li>
          <li>Edit or delete your reviews</li>
          <li>Change your privacy preferences</li>
          <li>Update your email address</li>
        </ul>

        <p className="text-sm mb-2"><strong>Delete Your Account:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Request complete account deletion</li>
          <li>All personal data removed immediately (name, email, address, contact info)</li>
          <li>Reviews are kept but anonymized (attributed to "Former Member")</li>
          <li>Why: Preserves review ecosystem and prevents vendors from pressuring users to delete bad reviews</li>
          <li>Deletion is permanent and cannot be undone</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">5.2 Privacy Settings</h3>
        
        <p className="text-sm mb-2"><strong>Name Display:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Choose to show your name on reviews (First name + Last initial)</li>
          <li>Or hide your name (shows as "Neighbor")</li>
          <li>Change this setting anytime in your profile</li>
        </ul>

        <p className="text-sm mb-2"><strong>Email Preferences:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Opt in/out of weekly digest emails</li>
          <li>Opt in/out of notification emails</li>
          <li>You cannot opt out of critical account emails (authentication)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">5.3 Data Portability</h3>
        <p className="text-sm mb-2">Upon request, we will provide:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>A copy of all your reviews and ratings</li>
          <li>Your account information</li>
          <li>Your activity history</li>
          <li>Delivered in machine-readable format (CSV or JSON)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">5.4 How to Exercise Your Rights</h3>
        <p className="text-sm mb-3">
          Contact us at: <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
        <p className="text-sm">
          We will respond within 30 days of your request.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
        
        <h3 className="text-lg font-semibold mb-2">6.1 Cookies We Use</h3>
        
        <p className="text-sm mb-2"><strong>Essential Cookies:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Authentication session cookies (required for login)</li>
          <li>Security tokens (prevent attacks)</li>
          <li>Cannot be disabled without losing site functionality</li>
        </ul>

        <p className="text-sm mb-2"><strong>Analytics Cookies:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Google Analytics tracking</li>
          <li>Session tracking for usage analytics</li>
          <li>Help us understand how users navigate the site</li>
        </ul>

        <p className="text-sm mb-2"><strong>Preference Cookies:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Remember your community selection</li>
          <li>Store your display preferences</li>
          <li>Remember your consent choices</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">6.2 Managing Cookies</h3>
        
        <p className="text-sm mb-2"><strong>Browser Controls:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>You can disable cookies in your browser settings</li>
          <li>Note: Essential cookies are required for site functionality</li>
          <li>Analytics cookies can be disabled without affecting core features</li>
        </ul>

        <p className="text-sm mb-2"><strong>Do Not Track:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>We respect Do Not Track browser signals</li>
          <li>When enabled, we disable analytics tracking</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
        <p className="text-sm mb-3">
          BridgeList is not intended for users under 18 years of age. We do not knowingly collect information from children. If we discover we have collected information from a child under 18, we will delete it immediately.
        </p>
        <p className="text-sm">
          If you believe we have collected information from a child, please contact us at <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">8. California Privacy Rights</h2>
        <p className="text-sm mb-3">
          If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
        </p>

        <p className="text-sm mb-2"><strong>Right to Know:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>What personal information we collect</li>
          <li>How we use and share it</li>
          <li>Categories of third parties we share with</li>
        </ul>

        <p className="text-sm mb-2"><strong>Right to Delete:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Request deletion of your personal information</li>
          <li>Subject to certain legal exceptions</li>
        </ul>

        <p className="text-sm mb-2"><strong>Right to Opt-Out:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>We do not sell personal information</li>
          <li>No opt-out required</li>
        </ul>

        <p className="text-sm mb-2"><strong>Right to Non-Discrimination:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>We will not discriminate against you for exercising your rights</li>
        </ul>

        <p className="text-sm">
          To exercise these rights, contact: <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">9. International Users</h2>
        <p className="text-sm mb-3">
          BridgeList primarily serves communities in the United States. Our servers are located in the United States, and your data is processed according to US privacy laws.
        </p>
        <p className="text-sm mb-2">If you access BridgeList from outside the US, you consent to:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Transfer of your data to the United States</li>
          <li>Processing under US privacy laws</li>
          <li>Storage on US-based servers</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">10. Changes to This Privacy Policy</h2>
        <p className="text-sm mb-3">
          We may update this Privacy Policy periodically to reflect:
        </p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Changes to our data practices</li>
          <li>New features or services</li>
          <li>Legal or regulatory requirements</li>
          <li>User feedback and improvements</li>
        </ul>

        <p className="text-sm mb-2"><strong>Notice of Changes:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>We will post the updated policy on this page</li>
          <li>We will update the "Last Updated" date</li>
          <li>For material changes, we will send email notification</li>
          <li>Continued use after changes constitutes acceptance</li>
        </ul>

        <p className="text-sm mb-2"><strong>Your Options:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Review changes when notified</li>
          <li>Contact us with questions or concerns</li>
          <li>Delete your account if you disagree with changes</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">11. Third-Party Links</h2>
        <p className="text-sm mb-3">
          BridgeList may contain links to vendor websites or other third-party sites. This Privacy Policy does not apply to those sites. We are not responsible for:
        </p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Third-party privacy practices</li>
          <li>Content on external websites</li>
          <li>Data collection by vendors</li>
        </ul>
        <p className="text-sm">
          Please review the privacy policies of any third-party sites you visit.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">12. Business Transfers</h2>
        <p className="text-sm mb-2">If BridgeList is involved in a merger, acquisition, or sale of assets:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>User data may be transferred to the new owner</li>
          <li>This Privacy Policy will continue to apply</li>
          <li>You will be notified of any ownership change</li>
          <li>You may delete your account before the transfer</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
        <p className="text-sm mb-2"><strong>Privacy Questions or Concerns:</strong></p>
        <p className="text-sm mb-3">
          Email: <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>

        <p className="text-sm mb-2"><strong>Data Requests:</strong></p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Access your data</li>
          <li>Delete your account</li>
          <li>Exercise your privacy rights</li>
          <li>Report privacy concerns</li>
        </ul>

        <p className="text-sm mb-2"><strong>Response Time:</strong></p>
        <p className="text-sm">We will respond to all privacy requests within 30 days.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">14. Your Consent</h2>
        <p className="text-sm mb-2">By using BridgeList, you consent to:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>Collection of information as described</li>
          <li>Use of information as described</li>
          <li>Sharing of information as described</li>
          <li>This Privacy Policy</li>
        </ul>
        <p className="text-sm">
          If you do not agree, please do not use BridgeList.
        </p>
      </section>

      <section className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Summary</h2>
        <p className="text-sm">
          We collect your contact information, address, and reviews to provide a trusted neighbor-to-neighbor recommendation platform. We protect your privacy through tiered display controls, never sell your data, and give you full control over your information. We share data only with essential service providers and within your verified community. You can view, edit, or delete your data anytime.
        </p>
        <p className="text-sm mt-3">
          Questions? Contact <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
      </section>

      <div className="border-t pt-4 mt-6">
        <p className="text-xs text-muted-foreground">
          <strong>Last Updated:</strong> October 27, 2025<br />
          <strong>Effective Date:</strong> October 27, 2025<br />
          <strong>Version:</strong> 1.0
        </p>
      </div>
    </article>
  );
}

function PlainEnglishContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none py-4">
      <p className="text-sm text-muted-foreground mb-6">
        <strong>Last Updated:</strong> October 27, 2025
      </p>

      <p className="text-sm mb-4 italic">
        This is a plain-English summary of our Privacy Policy. For the complete legal version, see our Full Privacy Policy.
      </p>

      <section className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">The Short Version</h2>
        <p className="text-sm mb-2">
          <strong>We collect:</strong> Your email, name, address, and the reviews you write.
        </p>
        <p className="text-sm mb-2">
          <strong>We use it to:</strong> Verify you're a real neighbor, show your reviews to your community, and send you helpful emails.
        </p>
        <p className="text-sm mb-2">
          <strong>We protect it by:</strong> Only showing your name to verified neighbors in your community (if you choose), keeping your data secure, and never selling your information.
        </p>
        <p className="text-sm">
          <strong>You control it:</strong> View, edit, or delete your data anytime. Choose whether to show your name on reviews.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">What Information Do We Collect?</h2>
        
        <h3 className="text-lg font-semibold mb-2">When You Sign Up</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li><strong>Email address</strong> - For login and weekly updates</li>
          <li><strong>Your name</strong> - So neighbors know who's reviewing</li>
          <li><strong>Home address</strong> - To verify you live in the community</li>
          <li><strong>Community name</strong> - Which HOA/neighborhood you're in</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">When You Use BridgeList</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li><strong>Reviews you write</strong> - Ratings, comments, cost info</li>
          <li><strong>Pages you visit</strong> - Helps us improve the platform</li>
          <li><strong>Your device info</strong> - Mobile vs desktop, browser type</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">We Don't Collect</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>❌ Credit card information (the site is free)</li>
          <li>❌ Social security numbers</li>
          <li>❌ Driver's license numbers</li>
          <li>❌ Any sensitive financial data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">How Do We Use Your Information?</h2>
        
        <h3 className="text-lg font-semibold mb-2">The Main Stuff</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>✅ <strong>Verify you're a real neighbor</strong> - Match your address to your community</li>
          <li>✅ <strong>Show your reviews</strong> - Display them to other verified community members</li>
          <li>✅ <strong>Send weekly emails</strong> - Digest of new reviews and vendors in your area</li>
          <li>✅ <strong>Calculate ratings</strong> - Average vendor scores from all reviews</li>
          <li>✅ <strong>Improve the platform</strong> - See which features people use most</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">We Never</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>❌ Sell your data to anyone</li>
          <li>❌ Share your email with vendors</li>
          <li>❌ Send spam or promotional emails (only community updates)</li>
          <li>❌ Show your reviews to random internet strangers</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Who Can See Your Reviews?</h2>
        <p className="text-sm mb-3">This is important! We have smart privacy controls:</p>

        <div className="space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm mb-1"><strong>🌐 Random Internet Visitors (Not Logged In)</strong></p>
            <p className="text-sm mb-1"><strong>What they see:</strong> "Neighbor on Rosella Rd gave 5 stars"</p>
            <p className="text-sm mb-1"><strong>What they DON'T see:</strong> Your name</p>
            <p className="text-sm"><strong>Why:</strong> Protects you from being identified by strangers online</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm mb-1"><strong>🏘️ Your Verified Neighbors (Logged In, Same Community)</strong></p>
            <p className="text-sm mb-1"><strong>What they see:</strong> "John S. on Rosella Rd gave 5 stars"</p>
            <p className="text-sm mb-1"><strong>Or:</strong> "Neighbor on Rosella Rd" (if you chose to hide your name)</p>
            <p className="text-sm"><strong>Why:</strong> Neighbors deserve to know who's recommending vendors</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm mb-1"><strong>🏠 People From Other Communities (Logged In, Different Community)</strong></p>
            <p className="text-sm mb-1"><strong>What they see:</strong> "Neighbor on Rosella Rd in Boca Bridges gave 5 stars"</p>
            <p className="text-sm mb-1"><strong>What they DON'T see:</strong> Your name, even if you show it to your own community</p>
            <p className="text-sm"><strong>Why:</strong> Protects your identity from people you don't live near</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm mb-1"><strong>📍 What Everyone Always Sees</strong></p>
            <p className="text-sm mb-1"><strong>Street names</strong> are always visible (e.g., "on Rosella Rd")</p>
            <p className="text-sm"><strong>Why:</strong> Proves reviews are from real neighbors in your area</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Your Privacy Controls</h2>
        
        <h3 className="text-lg font-semibold mb-2">You Decide</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>✅ <strong>Show your name</strong> on reviews (First name + Last initial, like "John S.")</li>
          <li>✅ <strong>Hide your name</strong> (shows as "Neighbor")</li>
          <li>✅ Change this setting anytime in your profile</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Your Rights</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>✅ <strong>See all your data</strong> - Download everything we have about you</li>
          <li>✅ <strong>Edit your reviews</strong> - Change ratings or delete them anytime</li>
          <li>✅ <strong>Update your info</strong> - Change name, email, or address</li>
          <li>✅ <strong>Delete your account</strong> - Gone immediately, forever</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">How We Protect Your Data</h2>
        
        <h3 className="text-lg font-semibold mb-2">Security Measures</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>🔒 <strong>Encrypted connections</strong> - All data sent securely (https://)</li>
          <li>🔒 <strong>Secure database</strong> - Hosted on SOC 2 certified servers (Supabase)</li>
          <li>🔒 <strong>Limited access</strong> - Only essential staff can view personal data</li>
          <li>🔒 <strong>Magic link login</strong> - No passwords to steal or leak</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Where Your Data Lives</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>📍 <strong>Servers in the USA</strong> (Supabase data centers)</li>
          <li>📧 <strong>Email provider</strong> - Resend (also US-based)</li>
          <li>📊 <strong>Analytics</strong> - Google Analytics (anonymized data only)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Who Do We Share Your Data With?</h2>
        
        <h3 className="text-lg font-semibold mb-2">Service Providers We Trust</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li><strong>Supabase</strong> - Database hosting (they store your account info and reviews)</li>
          <li><strong>Resend</strong> - Email delivery (they send your magic links and weekly digests)</li>
          <li><strong>Google Analytics</strong> - Usage tracking (they get anonymized page view data)</li>
          <li><strong>Google Places</strong> - Address verification (standardizes addresses)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">We Give Them Only What's Necessary</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>They can't sell your data</li>
          <li>They can't use it for their own purposes</li>
          <li>They must keep it secure</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">We Never Share With</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>❌ Advertisers</li>
          <li>❌ Marketing companies</li>
          <li>❌ Data brokers</li>
          <li>❌ Vendors on the platform (unless you contact them yourself)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Cookies & Tracking</h2>
        
        <h3 className="text-lg font-semibold mb-2">Cookies We Use</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>🍪 <strong>Login cookies</strong> - Keep you signed in (required)</li>
          <li>🍪 <strong>Analytics cookies</strong> - Track page views to improve site (optional)</li>
          <li>🍪 <strong>Preference cookies</strong> - Remember your settings (optional)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">You Can Control Them</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>Disable analytics cookies in browser settings</li>
          <li>Site still works without analytics cookies</li>
          <li>Login cookies are required (can't use site without them)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Your Email Preferences</h2>
        
        <h3 className="text-lg font-semibold mb-2">What We Send</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>📧 <strong>Magic link emails</strong> - For login (required, can't opt out)</li>
          <li>📧 <strong>Weekly digest</strong> - New reviews and vendors (opt-in, default ON)</li>
          <li>📧 <strong>Important updates</strong> - Terms changes, security alerts (required)</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">How to Manage</h3>
        <p className="text-sm">Go to your profile → Email preferences → Toggle on/off</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">If You Want to Leave</h2>
        
        <h3 className="text-lg font-semibold mb-2">Delete Your Account</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm mb-3">
          <li>Go to Settings → Delete Account</li>
          <li>Confirm deletion</li>
          <li><strong>Everything is deleted immediately:</strong>
            <ul className="ml-6 mt-1 space-y-1">
              <li>• Your email and name</li>
              <li>• Your address</li>
              <li>• Your login access</li>
              <li>• Your personal data</li>
            </ul>
          </li>
          <li><strong>What stays (anonymized):</strong>
            <ul className="ml-6 mt-1 space-y-1">
              <li>• Your reviews (attributed to "Former Member")</li>
              <li>• Vendor ratings you contributed to</li>
              <li>• <strong>Why:</strong> Keeps the platform useful for remaining neighbors AND prevents vendors from pressuring users to delete bad reviews</li>
            </ul>
          </li>
        </ol>

        <h3 className="text-lg font-semibold mb-2">Download Your Data First</h3>
        <p className="text-sm mb-2">Before deleting, you can download:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>All your reviews (CSV format)</li>
          <li>Your account info</li>
          <li>Your activity history</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Kids' Privacy</h2>
        <p className="text-sm">
          BridgeList is for homeowners 18 and older. We don't knowingly collect information from children. If we discover we have data from someone under 18, we delete it immediately.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">California Residents</h2>
        <p className="text-sm mb-2">You have extra rights under California law:</p>
        <ul className="space-y-1 text-sm mb-3">
          <li>✅ Request what data we have about you</li>
          <li>✅ Request deletion of your data</li>
          <li>✅ We won't discriminate if you exercise these rights</li>
          <li>✅ We don't sell your data (so no need to opt-out)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
        
        <h3 className="text-lg font-semibold mb-2">When We Update It</h3>
        <p className="text-sm mb-3">
          We'll notify you by email if we make important changes. The "Last Updated" date at the top will change. You can always see the latest version at bridgelist.org/privacy.
        </p>

        <h3 className="text-lg font-semibold mb-2">Your Options</h3>
        <ul className="space-y-1 text-sm mb-3">
          <li>✅ Review changes when notified</li>
          <li>✅ Keep using BridgeList (means you accept)</li>
          <li>✅ Delete your account if you disagree</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Questions?</h2>
        <p className="text-sm mb-1">
          <strong>Privacy concerns:</strong> <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
        <p className="text-sm mb-1">
          <strong>Want to delete your data:</strong> <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
        <p className="text-sm mb-3">
          <strong>Report a privacy issue:</strong> <a href="mailto:help@courtneys-list.com" className="text-primary underline">help@courtneys-list.com</a>
        </p>
        <p className="text-sm">We respond within 30 days.</p>
      </section>

      <section className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">The Bottom Line</h2>
        <p className="text-sm">
          <strong>We only collect what we need to verify you're a neighbor and show your reviews to your community. We protect your privacy with smart display controls. We never sell your data. You can view, edit, or delete everything anytime.</strong>
        </p>
        <p className="text-sm mt-3">
          That's it! For the legal details, see our Full Privacy Policy.
        </p>
      </section>

      <div className="border-t pt-4 mt-6">
        <p className="text-xs text-muted-foreground">
          <strong>Version 1.0</strong> | <strong>Last Updated:</strong> October 27, 2025
        </p>
      </div>
    </article>
  );
}
