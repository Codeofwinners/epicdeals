import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Legit.Discount.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Terms of Service</span>
        </nav>

        <h1 className="text-3xl font-black text-gray-900 mb-6">Terms of Service</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Acceptance of Terms</h2>
          <p>
            By accessing and using Legit.Discount, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Use of Service</h2>
          <p>
            Legit.Discount provides a platform for discovering and sharing deals, coupons, and promo codes. We strive to verify deals using AI and community feedback, but we cannot guarantee that all deals will work at all times. Deal availability and terms are determined by the respective retailers.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">User Conduct</h2>
          <p>
            You agree not to submit false deals, spam, or misleading content. We reserve the right to remove content and suspend accounts that violate these terms.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Limitation of Liability</h2>
          <p>
            Legit.Discount is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of our services or reliance on deals listed on the platform.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Contact</h2>
          <p>
            Questions about these Terms? Contact us at legal@legit.discount.
          </p>
        </div>
      </div>
    </main>
  );
}
