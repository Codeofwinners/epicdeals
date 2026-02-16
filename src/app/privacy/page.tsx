import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Legit.Discount — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Privacy Policy</span>
        </nav>

        <h1 className="text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Information We Collect</h2>
          <p>
            When you use Legit.Discount, we may collect information you provide directly (such as when you create an account, submit a deal, or post a comment) and usage data collected automatically through cookies and similar technologies.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve our services, including displaying deals, enabling community features, and personalizing your experience.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share anonymized, aggregated data with partners to improve our deal verification and discovery services.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8">Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please reach out at privacy@legit.discount.
          </p>
        </div>
      </div>
    </main>
  );
}
