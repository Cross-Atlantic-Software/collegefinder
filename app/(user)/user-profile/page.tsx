import { UserDetails, ProfileTabs } from "@/components/user";
import { EligibleExams, QuickShortcuts, UpcomingDeadlines } from "@/components/widgets";

export default function UserProfile() {
  return (
    <main className="dark:bg-[#050816] pb-16">
      <UserDetails />
      <section className="relative md:mx-4">
          <div className="bg-darkGradient hidden md:block dark:bg-none dark:bg-slate-900/80 rounded-b-md w-full h-30 absolute left-0 top-0 z-0" />
          <div className="appContainer">
            <div className="bg-white rounded-md md:p-6 relative z-10 dark:bg-slate-950">
              <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="flex-1 min-w-0">
                    <ProfileTabs/>
                  </div>
                  <div className="w-full shrink-0 space-y-6 lg:w-80">
                    <EligibleExams/>
                    <UpcomingDeadlines/>
                    <QuickShortcuts/>
                  </div>
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}
