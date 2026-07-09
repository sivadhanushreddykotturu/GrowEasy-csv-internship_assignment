import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer — AI-Powered CRM Lead Extraction",
  description:
    "Upload any CSV and let AI intelligently map your leads to GrowEasy CRM fields. Supports Facebook, Google Ads, Excel, real estate CRMs and more.",
  keywords: "CRM, CSV importer, AI, lead extraction, GrowEasy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('groweasy-theme');document.documentElement.setAttribute('data-theme',s||'light');})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
