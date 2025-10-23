import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const Terms = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  return (
    <main className="min-h-screen bg-background">
      <SEO title="Terms of Service — Courtney's List" description="The terms that govern the use of Courtney's List." canonical={canonical} />
      <article className="container max-w-4xl py-12 prose prose-slate dark:prose-invert max-w-none">
        <div className="mb-6">
          <Link to="/terms/plain-english" className="text-sm text-primary hover:underline">
            → View Plain English Version
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Courtney's List - Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated:</strong> 10.23.25<br />
          <strong>Effective Date:</strong> 10.23.25
        </p>

        <section className="mb-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Quick Summary (Not Legally Binding - Read Full Terms Below)</h2>
          <ul className="space-y-2 list-none">
            <li>✅ You own your reviews, but give us broad rights to use them</li>
            <li>✅ Reviews are voluntary and unpaid - no compensation ever</li>
            <li>✅ We show your first name + street (or "Neighbor on [Street]" if anonymous)</li>
            <li>✅ We may share reviews with vendors (with names anonymized)</li>
            <li>✅ We may offer paid services to vendors in the future</li>
            <li>✅ We can transfer your data if we sell the company</li>
            <li>✅ You're responsible for honest, accurate reviews</li>
          </ul>
          <p className="mt-4 font-semibold">By using Courtney's List, you agree to these Terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            By accessing or using Courtney's List ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you don't agree, please don't use the Service.
          </p>
          <p className="mb-2"><strong>Who We Are:</strong> Courtney's List operates a community-based service provider directory and review platform for residential communities.</p>
          <p><strong>Who You Are:</strong> "You" and "your" refer to you as a user of the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Using the Service</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 Eligibility</h3>
          <ul className="mb-4 space-y-1">
            <li>You must be at least 18 years old</li>
            <li>You must be a resident or property owner in a community we serve</li>
            <li>You provide accurate information about yourself and your address</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Account Responsibilities</h3>
          <ul className="mb-4 space-y-1">
            <li>You're responsible for keeping your account secure</li>
            <li>You can't share your account with others</li>
            <li>You must provide a valid email and address for verification</li>
            <li>We may verify your address before activating your account</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.3 Acceptable Use</h3>
          <p className="mb-2">You agree NOT to:</p>
          <ul className="space-y-1">
            <li>Post fake, fraudulent, or misleading reviews</li>
            <li>Accept payment or incentives to post, remove, or modify reviews</li>
            <li>Review your own business or a business where you have a financial interest</li>
            <li>Harass, threaten, or defame anyone</li>
            <li>Post content that violates any law or third-party rights</li>
            <li>Attempt to manipulate ratings or rankings</li>
            <li>Use the Service for any commercial purpose without our permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Content Ownership and License</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 Your Content Ownership</h3>
          <p className="mb-2"><strong>You own the content you create</strong> ("Your Content"), including:</p>
          <ul className="mb-4 space-y-1">
            <li>Reviews and ratings</li>
            <li>Comments and feedback</li>
            <li>Cost estimates and vendor information</li>
            <li>Photos or other materials you submit</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 License You Grant to Us (IMPORTANT)</h3>
          <p className="mb-4">
            By submitting Your Content, you grant Courtney's List and its successors a:
          </p>
          <ul className="mb-4 space-y-1">
            <li><strong>Worldwide, perpetual, irrevocable, royalty-free license</strong></li>
            <li>To use, copy, modify, display, distribute, and sublicense Your Content</li>
            <li>For any purpose related to the Service or our business</li>
          </ul>

          <p className="mb-2"><strong>This means we can:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Display your reviews on our website and mobile apps</li>
            <li>Include reviews in emails, newsletters, and reports</li>
            <li>Share reviews with vendors (with anonymized names)</li>
            <li>Share reviews with community HOA boards and management</li>
            <li>Use reviews in marketing and promotional materials</li>
            <li>Modify or reformat your content for display</li>
            <li>Grant sublicenses to third parties (e.g., data partners, acquirers)</li>
            <li>Continue using your content even if you delete your account</li>
          </ul>

          <p className="mb-2"><strong>What This Covers:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>If we sell or transfer Courtney's List, your content comes with it</li>
            <li>If we partner with other platforms, we can share your reviews</li>
            <li>If we create reports or analytics, we can include your data</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 Display of Your Information</h3>
          <p className="mb-2"><strong>Public Display:</strong></p>
          <ul className="mb-4 space-y-1">
            <li><strong>Standard:</strong> Reviews show as "[First Name] [Last Initial]. on [Street Name]" (e.g., "Hope L. on Palm Court")</li>
            <li><strong>Anonymous:</strong> Reviews show as "Neighbor on [Street Name]" (you choose this option)</li>
            <li>We NEVER display your full address publicly</li>
            <li>We NEVER display your email publicly</li>
          </ul>

          <p className="mb-2"><strong>When Shared with Vendors:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Names are ALWAYS anonymized</li>
            <li>Reviews show only as "Resident in [Community Name]" or "Neighbor on [Street Name]"</li>
            <li>Cost data may be shared in aggregate only</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.4 No Compensation</h3>
          <p className="mb-2"><strong>CRITICAL:</strong> You will NOT receive any compensation for Your Content, including:</p>
          <ul className="mb-4 space-y-1">
            <li>No payment for reviews, ratings, or comments</li>
            <li>No credits, refunds, or discounts</li>
            <li>No equity or ownership interest</li>
            <li>No retroactive payments if we monetize or sell the Service</li>
          </ul>
          <p>Your reviews are <strong>voluntary contributions</strong> to help your community.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Our Rights and Content</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 Platform Content</h3>
          <p className="mb-2">Courtney's List owns all:</p>
          <ul className="mb-4 space-y-1">
            <li>Website design, code, and features</li>
            <li>Logos, trademarks, and branding</li>
            <li>Aggregate data and analytics</li>
            <li>Vendor databases and categories</li>
            <li>Algorithms and rating systems</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 Our Right to Moderate</h3>
          <p className="mb-2">We may, but are not obligated to:</p>
          <ul className="mb-4 space-y-1">
            <li>Review, edit, or remove any content</li>
            <li>Suspend or ban users who violate these Terms</li>
            <li>Remove reviews that appear fake, fraudulent, or misleading</li>
            <li>Verify or flag vendor information</li>
            <li>Display "pending" or "unverified" labels on content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 No Endorsement</h3>
          <ul className="space-y-1">
            <li>Reviews reflect individual user opinions only</li>
            <li>We don't endorse or guarantee any vendor</li>
            <li>We don't verify all vendor information</li>
            <li>Users should conduct their own due diligence</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Vendor Services and Monetization</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 Future Paid Services</h3>
          <p className="mb-2">We reserve the right to offer paid services, including but not limited to:</p>
          <ul className="mb-4 space-y-1">
            <li>Vendor advertising and promoted listings</li>
            <li>Lead generation and referral fees</li>
            <li>Premium vendor profiles</li>
            <li>Featured placements</li>
            <li>Data and analytics subscriptions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.2 No Influence on Reviews</h3>
          <p className="mb-2"><strong>IMPORTANT:</strong> Vendors who purchase services will NOT receive:</p>
          <ul className="mb-4 space-y-1">
            <li>Ability to remove or edit negative reviews</li>
            <li>Preferential treatment in search results or ratings</li>
            <li>Access to reviewer identities (beyond anonymous data)</li>
            <li>Control over review content or display</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.3 Vendor Data Sharing</h3>
          <p className="mb-2">We may share with vendors:</p>
          <ul className="mb-4 space-y-1">
            <li><strong>Anonymized reviews</strong> ("Resident in Boca Bridges rated you 4 stars")</li>
            <li><strong>Aggregate statistics</strong> (average rating, total reviews, cost ranges)</li>
            <li><strong>Lead information</strong> if a user requests contact (with user's explicit consent)</li>
          </ul>

          <p className="mb-2">We will NOT share:</p>
          <ul className="space-y-1">
            <li>Reviewer names or identities (unless user explicitly opts in)</li>
            <li>Full addresses or contact information</li>
            <li>Individual user data without consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data Protection</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 Information We Collect</h3>
          <ul className="mb-4 space-y-1">
            <li>Account info (name, email, address)</li>
            <li>Reviews, ratings, and comments</li>
            <li>Usage data (pages visited, features used)</li>
            <li>Device and browser information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.2 How We Use Your Data</h3>
          <ul className="mb-4 space-y-1">
            <li>Operate and improve the Service</li>
            <li>Verify community membership</li>
            <li>Send notifications and newsletters</li>
            <li>Generate community reports and analytics</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.3 Data Sharing</h3>
          <p className="mb-2">We may share your data with:</p>
          <ul className="mb-4 space-y-1">
            <li>Community HOA boards (anonymized or aggregate data)</li>
            <li>Vendors (anonymized reviews only)</li>
            <li>Service providers (email, hosting, analytics)</li>
            <li>Law enforcement (if required by law)</li>
            <li>Acquirers (if we sell the company - see Section 7)</li>
          </ul>
          <p><strong>See our separate Privacy Policy for complete details.</strong></p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Transfer of Rights (Company Sale)</h2>
          
          <h3 className="text-xl font-semibold mb-3">7.1 Business Transfer</h3>
          <p className="mb-2">If Courtney's List is sold, merged, or acquired:</p>
          <ul className="mb-4 space-y-1">
            <li>These Terms and all licenses you granted transfer to the new owner</li>
            <li>Your Content and data may be transferred as part of the transaction</li>
            <li>The new owner may continue using your reviews under these Terms</li>
            <li>We will notify you of any ownership change</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">7.2 Your Options After Transfer</h3>
          <ul className="space-y-1">
            <li>You may delete your account after notification</li>
            <li>Content posted before deletion remains under the license you granted</li>
            <li>New owner must honor your anonymity preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. User Responsibilities and Warranties</h2>
          
          <h3 className="text-xl font-semibold mb-3">8.1 You Represent and Warrant That:</h3>
          <ul className="mb-4 space-y-1">
            <li>Your reviews are based on your genuine personal experience</li>
            <li>You have no financial relationship with reviewed vendors (unless disclosed)</li>
            <li>Your content is accurate and not misleading</li>
            <li>You own or have rights to any photos or content you submit</li>
            <li>You're not violating any confidentiality agreements</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8.2 Prohibited Content</h3>
          <p className="mb-2">You may NOT post:</p>
          <ul className="mb-4 space-y-1">
            <li>Fake or fraudulent reviews</li>
            <li>Reviews of businesses where you have undisclosed financial interest</li>
            <li>Defamatory, harassing, or threatening content</li>
            <li>Copyrighted material without permission</li>
            <li>Private or confidential information</li>
            <li>Spam or promotional content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8.3 Vendor Disputes</h3>
          <p className="mb-2">If a vendor disputes your review:</p>
          <ul className="space-y-1">
            <li>We may investigate but are not required to</li>
            <li>We may request additional information from you</li>
            <li>We may remove content that violates these Terms</li>
            <li>Final decision on content removal is at our sole discretion</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations of Liability</h2>
          
          <h3 className="text-xl font-semibold mb-3">9.1 Service "AS IS"</h3>
          <p className="mb-4">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
          <p className="mb-2"><strong>We do NOT guarantee:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Accuracy of reviews or vendor information</li>
            <li>Quality or reliability of vendors listed</li>
            <li>Continuous or error-free service operation</li>
            <li>Security of your data (though we use reasonable measures)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">9.2 Limitation of Liability</h3>
          <p className="mb-4"><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
          <p className="mb-2">Courtney's List is NOT liable for:</p>
          <ul className="mb-4 space-y-1">
            <li>Indirect, incidental, or consequential damages</li>
            <li>Lost profits or business opportunities</li>
            <li>Poor service from vendors you hire</li>
            <li>Inaccurate reviews or information</li>
            <li>Data breaches or security incidents</li>
            <li>Service interruptions or data loss</li>
          </ul>
          <p className="mb-4"><strong>Maximum Liability:</strong> If we are found liable, our total liability is limited to the greater of:</p>
          <ul className="mb-4 space-y-1">
            <li>(a) $100, or</li>
            <li>(b) Amounts you paid us in the past 12 months (if any)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">9.3 Third-Party Vendors</h3>
          <ul className="space-y-1">
            <li>We are NOT responsible for vendors' actions or services</li>
            <li>Your relationship with vendors is separate from Courtney's List</li>
            <li>You hire vendors at your own risk</li>
            <li>Vendors are independent businesses, not our employees or partners</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Courtney's List and its owners, employees, and partners from:</p>
          <ul className="space-y-1">
            <li>Claims arising from Your Content</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Your interactions with vendors</li>
            <li>Your use of the Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Dispute Resolution</h2>
          
          <h3 className="text-xl font-semibold mb-3">11.1 Informal Resolution</h3>
          <p className="mb-4">Before filing any legal claim, you agree to contact us at help@courtneys-list.com to resolve the dispute informally.</p>

          <h3 className="text-xl font-semibold mb-3">11.2 Arbitration Agreement (For US Users)</h3>
          <p className="mb-2"><strong>YOU AND COURTNEY'S LIST AGREE:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Most disputes will be resolved through binding arbitration</li>
            <li>You waive the right to a jury trial</li>
            <li>You waive the right to participate in class actions</li>
            <li>Arbitration will be conducted by the American Arbitration Association (AAA)</li>
          </ul>
          <p className="mb-2"><strong>Exceptions (Can Be Brought in Court):</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Small claims court disputes</li>
            <li>Intellectual property disputes</li>
            <li>Violations of Section 8 (User Responsibilities)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">11.3 Governing Law</h3>
          <ul className="space-y-1">
            <li>These Terms are governed by the laws of Florida</li>
            <li>Any court proceedings must be in Palm Beach County, Florida</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          
          <h3 className="text-xl font-semibold mb-3">12.1 Modifications</h3>
          <ul className="mb-4 space-y-1">
            <li>We may modify these Terms at any time</li>
            <li>We'll notify you by email or Service notice</li>
            <li>Continued use after changes means you accept the new Terms</li>
            <li>Material changes become effective 30 days after notice</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">12.2 Reviewing Terms</h3>
          <p>You should review these Terms regularly at courtneys-list.com/terms</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
          
          <h3 className="text-xl font-semibold mb-3">13.1 Your Right to Terminate</h3>
          <ul className="mb-4 space-y-1">
            <li>You may delete your account anytime</li>
            <li>Some data may remain in backups or as required by law</li>
            <li>Content you posted remains under the license you granted</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">13.2 Our Right to Terminate</h3>
          <p className="mb-2">We may suspend or terminate your account if:</p>
          <ul className="mb-4 space-y-1">
            <li>You violate these Terms</li>
            <li>You post fraudulent or fake reviews</li>
            <li>You engage in prohibited conduct</li>
            <li>We discontinue the Service</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">13.3 Effect of Termination</h3>
          <p className="mb-2">Upon termination:</p>
          <ul className="space-y-1">
            <li>Your license to use the Service ends immediately</li>
            <li>Our license to use Your Content continues (Section 3.2)</li>
            <li>Sections 3, 8-12 survive termination</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. General Terms</h2>
          
          <h3 className="text-xl font-semibold mb-3">14.1 Entire Agreement</h3>
          <p className="mb-4">These Terms constitute the entire agreement between you and Courtney's List.</p>

          <h3 className="text-xl font-semibold mb-3">14.2 Severability</h3>
          <p className="mb-4">If any provision is found invalid, the rest of the Terms remain in effect.</p>

          <h3 className="text-xl font-semibold mb-3">14.3 No Waiver</h3>
          <p className="mb-4">Our failure to enforce any right doesn't waive that right.</p>

          <h3 className="text-xl font-semibold mb-3">14.4 Assignment</h3>
          <ul className="mb-4 space-y-1">
            <li>You cannot transfer your rights under these Terms</li>
            <li>We may transfer our rights (e.g., in a sale) without your consent</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">14.5 Contact Information</h3>
          <p>Questions about these Terms? Contact us at:</p>
          <ul className="space-y-1">
            <li>Email: help@courtneys-list.com</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. Special Provisions for Community Focus</h2>
          
          <h3 className="text-xl font-semibold mb-3">15.1 Community Standards</h3>
          <p className="mb-2">Courtney's List is designed to help neighbors help neighbors:</p>
          <ul className="mb-4 space-y-1">
            <li>Be respectful and constructive in reviews</li>
            <li>Focus on helping community members make informed decisions</li>
            <li>Remember vendors are often small businesses run by individuals</li>
            <li>Balance honest feedback with community spirit</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">15.2 HOA and Community Management</h3>
          <ul className="space-y-1">
            <li>We may share aggregate data with HOA boards</li>
            <li>Individual reviews may be included in community reports</li>
            <li>Your community may have additional guidelines we enforce</li>
          </ul>
        </section>

        <div className="border-t pt-8 mt-12">
          <p className="text-center font-semibold mb-4">
            By using Courtney's List, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="text-center mb-8">
            <strong>Questions?</strong> Contact us at help@courtneys-list.com
          </p>
        </div>

        <section className="mb-8 bg-muted/30 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Appendix: Key Definitions</h2>
          <ul className="space-y-2">
            <li><strong>Your Content:</strong> Reviews, ratings, comments, photos, and other materials you submit</li>
            <li><strong>Service:</strong> The Courtney's List website, mobile apps, and all related services</li>
            <li><strong>Vendor:</strong> Any service provider, business, or professional listed on the Service</li>
            <li><strong>Community:</strong> A residential neighborhood, HOA, or community we serve</li>
            <li><strong>Anonymized:</strong> Data that doesn't identify you personally (shows only "Neighbor on [Street]")</li>
          </ul>
        </section>

        <div className="text-center text-sm text-muted-foreground mt-12">
          <p><strong>Last Updated:</strong> 10.23.25</p>
          <p><strong>Version:</strong> 1.0</p>
        </div>
      </article>
    </main>
  );
};

export default Terms;
