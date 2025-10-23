import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "full" | "plain-english";
}

export function TermsModal({ open, onOpenChange, variant: initialVariant = "plain-english" }: TermsModalProps) {
  const [variant, setVariant] = useState<"full" | "plain-english">(initialVariant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-2xl">
            {variant === "full" ? "Terms of Service" : "Terms of Service (Plain English)"}
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
              Full Legal Terms
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6 overflow-y-auto">
          <div className="pr-4">
            {variant === "full" ? <FullTermsContent /> : <PlainEnglishContent />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FullTermsContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none py-4">
      <p className="text-sm text-muted-foreground mb-6">
        <strong>Last Updated:</strong> 10.23.25<br />
        <strong>Effective Date:</strong> 10.23.25
      </p>

      <section className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Quick Summary (Not Legally Binding - Read Full Terms Below)</h2>
        <ul className="space-y-1 list-none text-sm">
          <li>✅ You own your reviews, but give us broad rights to use them</li>
          <li>✅ Reviews are voluntary and unpaid - no compensation ever</li>
          <li>✅ We show your first name + street (or "Neighbor on [Street]" if anonymous)</li>
          <li>✅ We may share reviews with vendors (with names anonymized)</li>
          <li>✅ We may offer paid services to vendors in the future</li>
          <li>✅ We can transfer your data if we sell the company</li>
          <li>✅ You're responsible for honest, accurate reviews</li>
        </ul>
        <p className="mt-3 font-semibold text-sm">By using Courtney's List, you agree to these Terms.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
        <p className="mb-3 text-sm">
          By accessing or using Courtney's List ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you don't agree, please don't use the Service.
        </p>
        <p className="mb-2 text-sm"><strong>Who We Are:</strong> Courtney's List operates a community-based service provider directory and review platform for residential communities.</p>
        <p className="text-sm"><strong>Who You Are:</strong> "You" and "your" refer to you as a user of the Service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Using the Service</h2>
        
        <h3 className="text-lg font-semibold mb-2">2.1 Eligibility</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li>You must be at least 18 years old</li>
          <li>You must be a resident or property owner in a community we serve</li>
          <li>You provide accurate information about yourself and your address</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">2.2 Account Responsibilities</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li>You're responsible for keeping your account secure</li>
          <li>You can't share your account with others</li>
          <li>You must provide a valid email and address for verification</li>
          <li>We may verify your address before activating your account</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">2.3 Acceptable Use</h3>
        <p className="mb-2 text-sm">You agree NOT to:</p>
        <ul className="space-y-1 text-sm">
          <li>Post fake, fraudulent, or misleading reviews</li>
          <li>Accept payment or incentives to post, remove, or modify reviews</li>
          <li>Review your own business or a business where you have a financial interest</li>
          <li>Harass, threaten, or defame anyone</li>
          <li>Post content that violates any law or third-party rights</li>
          <li>Attempt to manipulate ratings or rankings</li>
          <li>Use the Service for any commercial purpose without our permission</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Content Ownership and License</h2>
        
        <h3 className="text-lg font-semibold mb-2">3.1 Your Content Ownership</h3>
        <p className="mb-2 text-sm"><strong>You own the content you create</strong> ("Your Content"), including:</p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Reviews and ratings</li>
          <li>Comments and feedback</li>
          <li>Cost estimates and vendor information</li>
          <li>Photos or other materials you submit</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.2 License You Grant to Us (IMPORTANT)</h3>
        <p className="mb-3 text-sm">
          By submitting Your Content, you grant Courtney's List and its successors a:
        </p>
        <ul className="mb-3 space-y-1 text-sm">
          <li><strong>Worldwide, perpetual, irrevocable, royalty-free license</strong></li>
          <li>To use, copy, modify, display, distribute, and sublicense Your Content</li>
          <li>For any purpose related to the Service or our business</li>
        </ul>

        <p className="mb-2 text-sm"><strong>This means we can:</strong></p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Display your reviews on our website and mobile apps</li>
          <li>Include reviews in emails, newsletters, and reports</li>
          <li>Share reviews with vendors (with anonymized names)</li>
          <li>Share reviews with community HOA boards and management</li>
          <li>Use reviews in marketing and promotional materials</li>
          <li>Modify or reformat your content for display</li>
          <li>Grant sublicenses to third parties (e.g., data partners, acquirers)</li>
          <li>Continue using your content even if you delete your account</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.3 Display of Your Information</h3>
        <p className="mb-2 text-sm"><strong>Public Display:</strong></p>
        <ul className="mb-3 space-y-1 text-sm">
          <li><strong>Standard:</strong> Reviews show as "[First Name] on [Street Name]"</li>
          <li><strong>Anonymous:</strong> Reviews show as "Neighbor on [Street Name]"</li>
          <li>We NEVER display your full address publicly</li>
          <li>We NEVER display your email publicly</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">3.4 No Compensation</h3>
        <p className="mb-2 text-sm"><strong>CRITICAL:</strong> You will NOT receive any compensation for Your Content, including:</p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>No payment for reviews, ratings, or comments</li>
          <li>No credits, refunds, or discounts</li>
          <li>No equity or ownership interest</li>
          <li>No retroactive payments if we monetize or sell the Service</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Disclaimers and Limitations</h2>
        <p className="mb-2 text-sm">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
        <p className="mb-2 text-sm"><strong>We do NOT guarantee:</strong></p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Accuracy of reviews or vendor information</li>
          <li>Quality or reliability of vendors listed</li>
          <li>Continuous or error-free service operation</li>
        </ul>
        <p className="text-sm"><strong>Maximum Liability:</strong> Limited to $100 or amounts you paid us.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. Contact</h2>
        <p className="text-sm">Questions? Email: help@courtneys-list.com</p>
      </section>
    </article>
  );
}

function PlainEnglishContent() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none py-4">
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-base mb-2">👋 Welcome! We know legal documents are boring, so here's what you're agreeing to in simple terms.</p>
        <p className="text-xs font-semibold">Note: This is just a summary. The full legal Terms of Service apply if there's any conflict.</p>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">🤝 The Basic Deal</h2>
        
        <h3 className="text-lg font-semibold mb-2">What you get:</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Free access to trusted vendor reviews from your neighbors</li>
          <li>Ability to share your own experiences to help the community</li>
          <li>Weekly emails with community updates and vendor highlights</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">What we get:</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Your reviews help build a valuable community resource</li>
          <li>We can use your reviews to operate and grow the service</li>
          <li>If we ever sell the company, your reviews come with it</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">What you DON'T get:</h3>
        <ul className="space-y-1 text-sm">
          <li>❌ No money for reviews (not now, not ever)</li>
          <li>❌ No credits or gift cards</li>
          <li>❌ No ownership stake in Courtney's List</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">📝 Your Reviews</h2>
        
        <h3 className="text-lg font-semibold mb-2">What We Show Publicly</h3>
        <div className="mb-3 p-3 bg-muted/30 rounded text-sm">
          <p className="mb-2"><strong>Standard Review:</strong></p>
          <p className="mb-3">"Hope on Palm Court gave EZ Pool 5 stars"</p>
          <p className="mb-2"><strong>Anonymous Review:</strong></p>
          <p>"Neighbor on Palm Court gave EZ Pool 5 stars"</p>
        </div>

        <p className="mb-2 text-sm"><strong>We NEVER show:</strong></p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Your full address</li>
          <li>Your email address</li>
          <li>Your phone number</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">What Happens to Your Reviews</h3>
        <p className="mb-2 font-semibold text-sm">Forever means forever:</p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Even if you delete your account, we can still use reviews you posted</li>
          <li>If we sell Courtney's List, the new owner can use your reviews</li>
          <li>We can share, modify, or republish your reviews anytime</li>
          <li>You can't ask for payment later if we make money from them</li>
        </ul>
        <p className="text-xs italic">Why? Reviews are more valuable when they're permanent and trustworthy.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">🔒 Your Privacy</h2>
        
        <h3 className="text-lg font-semibold mb-2">What We Collect</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li>Your name, email, and address (for verification)</li>
          <li>Reviews and ratings you submit</li>
          <li>Which pages you visit and features you use</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">Who We Share With</h3>
        <ul className="mb-3 space-y-1 text-sm">
          <li><strong>Your Community:</strong> Anonymized reviews in HOA reports</li>
          <li><strong>Vendors:</strong> Anonymized reviews only</li>
          <li><strong>Service Providers:</strong> Email, database, analytics</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">What We DON'T Share</h3>
        <ul className="space-y-1 text-sm">
          <li>❌ Your full address (only street name publicly)</li>
          <li>❌ Your email or phone with vendors</li>
          <li>❌ Your identity with vendors (unless you opt-in)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">🚫 What You Can't Do</h2>
        <p className="mb-2 font-semibold text-sm">Don't be shady:</p>
        <ul className="mb-3 space-y-1 text-sm">
          <li>❌ No fake reviews</li>
          <li>❌ Don't accept payment to post/remove reviews</li>
          <li>❌ Don't review your own business</li>
          <li>❌ Don't post anything illegal or defamatory</li>
        </ul>
        <p className="font-semibold text-sm">If you do this, we'll ban you. Simple as that.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">⚖️ If Something Goes Wrong</h2>
        <p className="mb-2 font-semibold text-sm">Bottom line:</p>
        <p className="mb-3 text-sm">You use the reviews to make informed decisions, but the final choice is yours. We're just the platform.</p>
        
        <h3 className="text-lg font-semibold mb-2">If You Sue Us:</h3>
        <ul className="space-y-1 text-sm">
          <li>Most disputes go to arbitration (not court)</li>
          <li>Maximum we'd owe you: $100</li>
          <li>You can't join class-action lawsuits against us</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">❓ Quick Questions</h2>
        
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">"Can I delete my account?"</p>
            <p>Yes, anytime. But reviews you posted stay.</p>
          </div>

          <div>
            <p className="font-semibold">"Can vendors see who I am?"</p>
            <p>No, they only see "Resident in [Community]"</p>
          </div>

          <div>
            <p className="font-semibold">"Can I edit my review?"</p>
            <p>Yes, within 30 days. After that, only if there's a factual error.</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">📞 Contact Us</h2>
        <p className="text-sm">Questions? Email: help@courtneys-list.com</p>
      </section>

      <div className="border-t pt-6 mt-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">📄 The Legal Stuff</h2>
        <p className="mb-3 text-sm">
          This plain-English version is just for your convenience. If there's any conflict, the full legal version wins.
        </p>
        <p className="text-sm">Thanks for being part of our community! 🏡</p>
      </div>
    </article>
  );
}
