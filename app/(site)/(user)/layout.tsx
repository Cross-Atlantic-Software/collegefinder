import DashboardQueryProvider from "@/components/dashboard/DashboardQueryProvider";

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardQueryProvider>{children}</DashboardQueryProvider>;
}
