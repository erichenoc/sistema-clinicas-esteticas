import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MED LUXE - Sistema de Gestion",
  description: "Sistema completo de gestion para clinicas esteticas - MED LUXE Aesthetics & Wellness",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://medluxe.vercel.app'),
  openGraph: {
    title: "MED LUXE - Sistema de Gestion",
    description: "Sistema completo de gestion para clinicas esteticas",
    type: "website",
    locale: "es_DO",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
