import { Suspense } from 'react';

export default function AdminExamsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
