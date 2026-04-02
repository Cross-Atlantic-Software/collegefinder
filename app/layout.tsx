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
  title: "CollegeFinder",
  description: "Your college journey, simplified.",
  // Use real SVG — public/favicon.ico was mislabeled (XML/SVG bytes), which browsers ignore as .ico
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
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
