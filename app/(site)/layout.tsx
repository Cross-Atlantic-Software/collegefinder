// app/(site)/layout.tsx
import { Header, Footer } from "@/components/layouts";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
