import { CareerGuidanceSection, Features, Hero, InfoSection, SmartShortlistSection } from "@/components/containers";
import { Stats } from "@/components/shared";
import Heading from "@/components/shared/Typography";
import Image from "next/image";

export default function Home() {
  return (
    <main className="dark:bg-[#050816]">
      <Hero />
      <section className="appContainer py-20">
        <Heading align="center" subHead="A Hub of Excellence" head="Education, Research, and Innovation"/>
        <Stats className="mt-10" />
      </section>
      <InfoSection />
      <Features />
      <CareerGuidanceSection />
      <SmartShortlistSection />
      <section className="appContainer py-20">
        <Heading align="center" head="Easy application in 1-click" description="Explore how our university serves as a hub of excellence, bringing together top-tier education, cutting-edge research, and groundbreaking innovation to transform the world."/>
        <Image src="/easy-application.webp" alt="easy-application" width={1600} height={788} className="mt-8 max-w-5xl mx-auto" />
      </section>
    </main>
  );
}
