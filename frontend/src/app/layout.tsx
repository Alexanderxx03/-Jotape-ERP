import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald, Lilita_One } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lilita = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "JOTAPE | URBAN WEAR",
  description: "Premium reactive flannel joggers & oversized tees. Uncompromising streetwear quality.",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth bg-white dark:bg-black content-visibility-auto">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${lilita.variable} antialiased min-h-screen font-sans selection:bg-orange-500 selection:text-white bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="fixed inset-0 z-[-1] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}></div>
            <Toaster richColors position="top-right" expand={true} theme="system" />
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
