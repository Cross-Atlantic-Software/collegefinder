import type { Metadata } from "next";
import LegalPageClient from "./LegalPageClient";

export const metadata: Metadata = {
    title: "Legal | UniTracko",
    description:
        "Privacy Policy, Terms of Use, Cookie Policy, Disclaimer, Our Data Promise, and Refund Policy for UniTracko.",
};

export default function LegalPage() {
    return <LegalPageClient />;
}
