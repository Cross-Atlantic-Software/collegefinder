// app/layout.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Providers = dynamic(() => import("./Providers"), {
  ssr: true,
});

// Avoid next/font/google here: production builds fetch Google Fonts at compile time and fail
// on servers with no outbound HTTPS (e.g. locked-down EC2). Typography uses globals.css
// --font-inter-sans + system fallbacks.

export const metadata: Metadata = {
  title: "UniTracko",
  description: "Your college journey, simplified.",
  // SVG for modern browsers; app/favicon.ico is the UniTracko mark (generated from final logo-16).
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
