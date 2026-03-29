"use client";
import { UserDetails, ProfileTabs } from "@/components/user";

export default function UserProfile() {
  return (
    <main className="profile-premium min-h-screen bg-[#f5f9ff] pb-20 text-black">
      <UserDetails />
      <section className="appContainer mt-8">
        <ProfileTabs />
      </section>
    </main>
  );
}
