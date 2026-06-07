import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amategeko y'Umuhanda",
  description: "Uburyo Bwiza bwo Kwiga Amategeko y'Umuhanda mu Rwanda. Iga amategeko y'umuhanda, kora imyitozo, kandi unutsinde ibizamini byo kubona uruhushya rwo gutwara ibinyabiziga (Provisoire).",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="rw">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
