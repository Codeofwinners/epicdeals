import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AnalyticsInit } from "@/components/auth/AnalyticsInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://legit.discount"),
  title: {
    default: "Legit.Discount — AI-Verified Deals, Coupons & Promo Codes",
    template: "%s | Legit.Discount",
  },
  description:
    "Every deal AI-verified, community-validated. Real savings on thousands of stores, no dead codes.",
  keywords: "deals, coupons, promo codes, discounts, AI verified, savings",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Legit.Discount",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Legit.Discount",
  url: "https://legit.discount",
  description: "AI-Verified Deals, Coupons & Promo Codes",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://legit.discount/deals?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KVV82B9F4K"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KVV82B9F4K');
            `,
          }}
        />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AuthProvider>
          <AnalyticsInit />
          {children}
        </AuthProvider>
        {/* eBay Partner Network Smart Links */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window._epn = {campaign: 5339142421};`,
          }}
        />
        <script
          src="https://epnt.ebay.com/static/epn-smart-tools.js"
          async
        />
      </body>
    </html>
  );
}
