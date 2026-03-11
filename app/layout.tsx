// app/layout.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Manrope } from "next/font/google";
import "./globals.css";

const Providers = dynamic(() => import("./Providers"), {
  ssr: true,
});

const manropeSans = Manrope({
  variable: "--font-manrope-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollegeFinder",
  description: "Your college journey, simplified.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={`${manropeSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
