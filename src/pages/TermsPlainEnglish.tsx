import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const TermsPlainEnglish = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  return (
    <main className="min-h-screen bg-background">
      <SEO 
        title="Terms of Service (Plain English) — Courtney's List" 
        description="An easy-to-understand version of Courtney's List Terms of Service." 
        canonical={canonical} 
      />
      <article className="container max-w-4xl py-12 prose prose-slate dark:prose-invert max-w-none">
        <div className="mb-6">
          <Link to="/terms" className="text-sm text-primary hover:underline">
            → View Full Legal Terms
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Courtney's List - Terms of Service (Plain English Version)</h1>
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last Updated:</strong> 10.23.25
        </p>

        <div className="mb-8 p-6 bg-muted/50 rounded-lg">
          <p className="text-lg mb-2">👋 Welcome! We know legal documents are boring, so here's what you're agreeing to in simple terms.</p>
          <p className="text-sm font-semibold">Note: This is just a summary. The full legal Terms of Service apply if there's any conflict.</p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🤝 The Basic Deal</h2>
          
          <h3 className="text-xl font-semibold mb-3">What you get:</h3>
          <ul className="mb-4 space-y-1">
            <li>Free access to trusted vendor reviews from your neighbors</li>
            <li>Ability to share your own experiences to help the community</li>
            <li>Weekly emails with community updates and vendor highlights</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What we get:</h3>
          <ul className="mb-4 space-y-1">
            <li>Your reviews help build a valuable community resource</li>
            <li>We can use your reviews to operate and grow the service</li>
            <li>If we ever sell the company, your reviews come with it</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What you DON'T get:</h3>
          <ul className="space-y-1">
            <li>❌ No money for reviews (not now, not ever)</li>
            <li>❌ No credits or gift cards</li>
            <li>❌ No ownership stake in Courtney's List</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📝 Your Reviews</h2>
          
          <h3 className="text-xl font-semibold mb-3">What We Show Publicly</h3>
          <div className="mb-4 p-4 bg-muted/30 rounded">
            <p className="mb-2"><strong>Standard Review:</strong></p>
            <p className="mb-4">"Hope on Palm Court gave EZ Pool 5 stars"</p>
            <p className="mb-2"><strong>Anonymous Review:</strong></p>
            <p>"Neighbor on Palm Court gave EZ Pool 5 stars"</p>
          </div>

          <p className="mb-2"><strong>We NEVER show:</strong></p>
          <ul className="mb-4 space-y-1">
            <li>Your full address</li>
            <li>Your email address</li>
            <li>Your phone number</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Where Your Reviews Appear</h3>
          <ul className="mb-4 space-y-1">
            <li>✅ On our website (courtneys-list.com)</li>
            <li>✅ In weekly community emails</li>
            <li>✅ In reports to your HOA board (anonymized)</li>
            <li>✅ Shared with vendors (anonymized - they see "Resident in Boca Bridges rated you 4 stars")</li>
            <li>✅ In marketing materials to promote the service</li>
            <li>✅ Potentially on partner platforms in the future</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What Happens to Your Reviews</h3>
          <p className="mb-2 font-semibold">Forever means forever:</p>
          <ul className="mb-4 space-y-1">
            <li>Even if you delete your account, we can still use reviews you posted</li>
            <li>If we sell Courtney's List, the new owner can use your reviews</li>
            <li>We can share, modify, or republish your reviews anytime</li>
            <li>You can't ask for payment later if we make money from them</li>
          </ul>
          <p className="text-sm italic">Why? Reviews are more valuable when they're permanent and trustworthy. If anyone could delete reviews whenever they wanted, the system wouldn't work.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🔒 Your Privacy</h2>
          
          <h3 className="text-xl font-semibold mb-3">What We Collect</h3>
          <ul className="mb-4 space-y-1">
            <li>Your name, email, and address (for verification)</li>
            <li>Reviews and ratings you submit</li>
            <li>Which pages you visit and features you use</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Who We Share With</h3>
          <ul className="mb-4 space-y-1">
            <li><strong>Your Community:</strong> Anonymized reviews in HOA reports</li>
            <li><strong>Vendors:</strong> Anonymized reviews only ("Neighbor in Boca Bridges")</li>
            <li><strong>Service Providers:</strong> Email service (Resend), database (Supabase), analytics (Google)</li>
            <li><strong>Law Enforcement:</strong> Only if legally required</li>
            <li><strong>Future Owner:</strong> If we sell the company</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What We DON'T Share</h3>
          <ul className="space-y-1">
            <li>❌ Your full address (only street name publicly)</li>
            <li>❌ Your email or phone with vendors</li>
            <li>❌ Your identity with vendors (unless you opt-in for contact)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">💼 Future Business Plans (So You Know)</h2>
          <p className="mb-4">We're building a free community service, but we may make money in the future by:</p>
          
          <h3 className="text-xl font-semibold mb-3">Possible Revenue Sources:</h3>
          <ul className="mb-4 space-y-1">
            <li>Vendors paying for highlighted listings</li>
            <li>Vendors paying for customer leads (with your consent)</li>
            <li>Display advertising</li>
            <li>Premium features for communities or vendors</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What WON'T Change:</h3>
          <ul className="space-y-1">
            <li>❌ Vendors can't pay to remove bad reviews</li>
            <li>❌ Vendors can't buy better ratings</li>
            <li>❌ You'll never be compensated for reviews</li>
            <li>❌ Reviews remain honest and community-driven</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🚫 What You Can't Do</h2>
          <p className="mb-2 font-semibold">Don't be shady:</p>
          <ul className="mb-4 space-y-1">
            <li>❌ No fake reviews</li>
            <li>❌ Don't accept payment to post/remove reviews</li>
            <li>❌ Don't review your own business</li>
            <li>❌ Don't review competitors if you work in that industry</li>
            <li>❌ Don't post anything illegal or defamatory</li>
          </ul>
          <p className="font-semibold">If you do this, we'll ban you. Simple as that.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📊 Vendor Information Sharing</h2>
          
          <h3 className="text-xl font-semibold mb-3">Example: How We Share Your Review</h3>
          
          <div className="space-y-4 mb-4">
            <div className="p-4 bg-muted/30 rounded">
              <p className="font-semibold mb-2">You post:</p>
              <p>"Hope on Palm Court: EZ Pool did great work! $150/month for weekly service. Would hire again! ⭐⭐⭐⭐⭐"</p>
            </div>

            <div className="p-4 bg-muted/30 rounded">
              <p className="font-semibold mb-2">Vendors see (anonymized):</p>
              <p>"Resident in Boca Bridges: 5-star rating. Pool Service. Cost: $150/month. Comment: [redacted for privacy]"</p>
            </div>

            <div className="p-4 bg-muted/30 rounded">
              <p className="font-semibold mb-2">HOA sees (in aggregate):</p>
              <p>"EZ Pool: 4.8 stars (12 reviews), Average cost: $145/month"</p>
            </div>

            <div className="p-4 bg-muted/30 rounded">
              <p className="font-semibold mb-2">Community sees (on website):</p>
              <p>"Hope on Palm Court: ⭐⭐⭐⭐⭐ - EZ Pool did great work! $150/month for weekly service. Would hire again!"</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">⚖️ If Something Goes Wrong</h2>
          
          <h3 className="text-xl font-semibold mb-3">We're Not Responsible For:</h3>
          <ul className="mb-4 space-y-1">
            <li>Bad service from a vendor you hire</li>
            <li>Inaccurate information in reviews</li>
            <li>Website downtime or glitches</li>
            <li>Security breaches (though we try our best)</li>
            <li>Your decision to hire any vendor</li>
          </ul>
          <p className="mb-4 font-semibold">Bottom line: You use the reviews to make informed decisions, but the final choice is yours. We're just the platform.</p>

          <h3 className="text-xl font-semibold mb-3">If You Sue Us:</h3>
          <ul className="space-y-1">
            <li>Most disputes go to arbitration (not court)</li>
            <li>Maximum we'd owe you: $100 (or fees you paid us, if any)</li>
            <li>You can't join class-action lawsuits against us</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🔄 If We Sell Courtney's List</h2>
          <p className="mb-2 font-semibold">Here's what happens:</p>
          <ul className="mb-4 space-y-1">
            <li>We'll email you 30 days before the sale</li>
            <li>New owner gets all your reviews (under these same terms)</li>
            <li>You can delete your account if you don't like it</li>
            <li>But reviews you already posted stay (that's the deal)</li>
          </ul>
          <p className="text-sm italic">Why? A review platform is only valuable if reviews are permanent. Buyers need to know the reviews won't disappear.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">✏️ Changes to These Terms</h2>
          <ul className="space-y-1">
            <li>We can update these Terms anytime</li>
            <li>We'll email you when we make big changes</li>
            <li>If you keep using the site after changes, you accept them</li>
            <li>You should check back periodically</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🏠 Community Guidelines</h2>
          <p className="mb-4">Remember, this is a neighborhood platform:</p>
          
          <h3 className="text-xl font-semibold mb-3">Be a good neighbor:</h3>
          <ul className="mb-4 space-y-1">
            <li>✅ Be honest and constructive</li>
            <li>✅ Help others make good decisions</li>
            <li>✅ Remember vendors are often small local businesses</li>
            <li>✅ Balance candor with kindness</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Don't be a jerk:</h3>
          <ul className="space-y-1">
            <li>❌ Don't post out of spite or revenge</li>
            <li>❌ Don't pile on with negative reviews</li>
            <li>❌ Don't use reviews to harass anyone</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">❓ Questions?</h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold">"Can I delete my account?"</p>
              <p>Yes, anytime. But reviews you posted stay.</p>
            </div>

            <div>
              <p className="font-semibold">"Can I delete just one review?"</p>
              <p>Yes, before someone else rates that vendor. After that, only we can remove it (for fraud/violations).</p>
            </div>

            <div>
              <p className="font-semibold">"What if a vendor disputes my review?"</p>
              <p>We may investigate, but we rarely remove honest reviews.</p>
            </div>

            <div>
              <p className="font-semibold">"Can vendors see who I am?"</p>
              <p>No, they only see "Resident in [Community]" or "Neighbor on [Street]"</p>
            </div>

            <div>
              <p className="font-semibold">"What if I move out of the community?"</p>
              <p>Your reviews stay, but we may mark them as "Former Resident"</p>
            </div>

            <div>
              <p className="font-semibold">"Can I edit my review?"</p>
              <p>Yes, within 30 days. After that, only if there's a factual error.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📞 Contact Us</h2>
          <p className="mb-2">Questions or concerns? Reach us at:</p>
          <ul className="space-y-1">
            <li>Email: help@courtneys-list.com</li>
            <li>Or through the Contact form on the website</li>
          </ul>
        </section>

        <div className="border-t pt-8 mt-12 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">📄 The Legal Stuff</h2>
          <p className="mb-4">
            This plain-English version is just for your convenience. If there's any conflict between this and the full Terms of Service, the full legal version wins.
          </p>
          <p className="font-semibold mb-4">By using Courtney's List, you agree to both versions.</p>
          <p className="text-lg">Thanks for being part of our community! Your reviews help neighbors make better decisions. 🏡</p>
        </div>
      </article>
    </main>
  );
};

export default TermsPlainEnglish;
