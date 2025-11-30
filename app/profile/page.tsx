"use client";

import { Footer, Header } from "@/components/layouts";
import { UserDetails, ProfileTabs, ProTipBanner } from "@/components/user";
import {
  EligibleExams,
  QuickShortcuts,
  UpcomingDeadlines,
} from "@/components/widgets";

export default function UserProfile() {
  return (
    <>
      <Header />

      <main className="bg-white dark:bg-slate-950 pb-16">
        {/* Purple hero with stats */}
        <UserDetails />

        {/* Tabs card that overlaps the bottom of UserDetails */}
        <section className="-mt-10 md:-mt-16 relative z-10">
          <div className="appContainer">
            <div className="bg-white rounded-md md:p-6 shadow-lg relative z-10 dark:bg-slate-950">
              {/* MAIN TWO-COLUMN LAYOUT */}
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* LEFT SECTION */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* TABS */}
                  <ProfileTabs />

                  {/* Pro Tip Below Basic Info */}
                  <ProTipBanner
                    title="Pro Tip!"
                    description="Complete all sections to get personalised college recommendations and increase your profile strength to 100%!"
                  />
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="w-full shrink-0 space-y-6 lg:w-80">
                  <EligibleExams />
                  <UpcomingDeadlines />
                  <QuickShortcuts />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
