
import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { LayoutProvider } from '@/components/layout-provider';
import { CouponModal } from '@/components/modals/coupon-modal';
import { RedirectModal } from '@/components/modals/redirect-modal';
import { TermsModal } from '@/components/modals/terms-modal';
import { PrivacyPolicyModal } from '@/components/modals/privacy-modal';
import type { Metadata } from 'next';
import Script from 'next/script';
import SiteFooter from '@/components/site-footer';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'https://offerbae.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: {
    default: 'OfferBae - Find the Best Deals & Coupons',
    template: `%s | OfferBae`,
  },
  description: 'Your one-stop shop for comparing prices and finding the best deals and coupon codes across your favorite brands.',
  openGraph: {
    title: 'OfferBae - Find the Best Deals & Coupons',
    description: 'Your one-stop shop for comparing prices and finding the best deals and coupon codes across your favorite brands.',
    url: siteURL,
    siteName: 'OfferBae',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// The Google Analytics tracking ID is configured in your .env.local file.
// See the comments in next.config.js for more details.
const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {gaTrackingId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaTrackingId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen font-body antialiased">
        <CouponModal />
        <RedirectModal />
        <TermsModal />
        <PrivacyPolicyModal />
        <LayoutProvider footer={<SiteFooter />}>{children}</LayoutProvider>
        <Toaster />
      </body>
    </html>
  );
}
