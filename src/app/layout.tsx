import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Analytics from "@/components/Analytics";
import HistoryNavButtons from "@/components/ui/HistoryNavButtons";
import SpiceyChat from "@/components/chatbot/SpiceyChat";
import FloatingActions from "@/components/ui/FloatingActions";
import { ToastProvider } from "@/components/ui/ToastProvider";
import MaintenanceGate from "@/components/MaintenanceGate";
import { site } from "@/config/site";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.website),
  title: "Spice Crowd – Premium Indian Spices",
  description: "Spice Crowd delivers clean, farm-fresh spices from Kolli Hills to your kitchen.",
  openGraph: {
    title: 'Spice Crowd – Premium Indian Spices',
    description: 'Spice Crowd delivers clean, farm-fresh spices from Kolli Hills to your kitchen.',
    url: site.website,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased bg-slate-50 text-slate-900",
        dmSans.variable,
        dmSerif.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: site.name,
              description: "Premium Indian spices from Kolli Hills.",
              url: site.website,
              telephone: site.phone,
              priceRange: "₹₹",
              address: {
                "@type": "PostalAddress",
                streetAddress: site.address.line1,
                addressLocality: site.address.city,
                addressRegion: site.address.state,
                postalCode: site.address.postcode,
                addressCountry: site.address.country,
              },
              geo: { "@type": "GeoCoordinates", latitude: 11.3105924, longitude: 78.3503254 },
              sameAs: [site.website, site.mapUrl],
            }),
          }}
        />
        <CartProvider>
          <AuthProvider>
            <WishlistProvider>
              <Analytics />
              <ToastProvider>
                <MaintenanceGate>{children}</MaintenanceGate>
              </ToastProvider>
              <HistoryNavButtons />
              <SpiceyChat />
              <FloatingActions />
            </WishlistProvider>
          </AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}
