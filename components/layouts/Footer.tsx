"use client";

import { PiGraduationCapFill } from "react-icons/pi";
import {
    FaFacebookF,
    FaInstagram,
    FaXTwitter,
    FaLinkedinIn,
    FaYoutube,
} from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="relative bg-white dark:bg-[#050816]">
            <Image src="/footercurve.webp" alt="footer curve" width={2000} height={500} className="w-full h-auto" priority />
            {/* Yellow shape */}
            <div className="bg-pink">
                <div className="appContainer">
                    <div className="mx-auto pb-14 lg:pb-20">
                        <Image src="/svgs/logo-white.svg" alt="College Finder" width={264} height={40} priority className="mb-6" />
                    
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

                            <div className="flex gap-3 flex-col">
                                <Link href="/">
                                    <span className="text-sm uppercase text-white tracking-wider hover:text-slate-900 transition duration-500">Services</span>
                                </Link>
                                <Link href="/">
                                    <span className="text-sm uppercase text-white tracking-wider hover:text-slate-900 transition duration-500">Student Network</span>
                                </Link>
                                <Link href="/">
                                    <span className="text-sm uppercase text-white tracking-wider hover:text-slate-900 transition duration-500">Past Projects</span>
                                </Link>
                            </div>
                            <div className="flex gap-3 flex-col">
                                <Link href="/">
                                    <span className="text-sm uppercase text-white tracking-wider hover:text-slate-900 transition duration-500">Schedule a call</span>
                                </Link>
                                <Link href="/">
                                    <span className="text-sm uppercase text-white tracking-wider hover:text-slate-900 transition duration-500">Sign up for Newsletter</span>
                                </Link>
                            </div>
                            <div className="flex gap-3 ">
                                <Link
                                    href="#"
                                    aria-label="Facebook"
                                    className="text-2xl text-white transition hover:text-white/80"
                                >
                                    <FaFacebookF />
                                </Link>
                                <Link
                                    href="#"
                                    aria-label="Instagram"
                                    className="text-2xl text-white transition hover:text-white/80"
                                >
                                    <FaInstagram />
                                </Link>
                                <Link
                                    href="#"
                                    aria-label="X (Twitter)"
                                    className="text-2xl text-white transition hover:text-white/80"
                                >
                                    <FaXTwitter />
                                </Link>
                                <Link
                                    href="#"
                                    aria-label="LinkedIn"
                                    className="text-2xl text-white transition hover:text-white/80"
                                >
                                    <FaLinkedinIn />
                                </Link>
                                <Link
                                    href="#"
                                    aria-label="YouTube"
                                    className="text-2xl text-white transition hover:text-white/80"
                                >
                                    <FaYoutube />
                                </Link>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
