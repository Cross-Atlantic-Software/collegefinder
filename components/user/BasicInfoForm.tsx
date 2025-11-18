"use client";

import { useState } from "react";
import Image from "next/image";

import { BiCheck } from "react-icons/bi";
import { Button } from "../shared";
import { LuLock } from "react-icons/lu";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaRegLightbulb, FaUser } from "react-icons/fa6";
import ProTipBanner from "./ProTipBanner";

const genderOptions = [
    { label: "Male", icon: "/icons/male.png" },
    { label: "Female", icon: "/icons/female.png" },
    { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

export default function BasicInfoForm() {
    const [selected, setSelected] = useState<string>("Male");

    return (
        <>
        <div className="rounded border border-white/10 bg-pink/5 px-4 py-6 text-sm text-slate-100 sm:px-6 sm:py-7">
            {/* Section title */}
            <h2 className="mb-4 text-base font-semibold text-pink sm:text-lg">
                Basic Information
            </h2>

            <div className="space-y-5">
                {/* Name */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            First Name
                        </label>
                        <input
                            type="text"
                            className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                            placeholder="First name"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Last Name
                        </label>
                        <input
                            type="text"
                            className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                            placeholder="Last name"
                        />
                    </div>
                </div>

                {/* DOB */}
                <div>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span>Date of Birth</span>
                        <LuLock className="h-3 w-3 text-white/50" />
                    </div>
                    <input
                        type="date"
                        className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                        placeholder="Last name"
                    />
                </div>

                {/* Email */}
                <div className="space-y-1">
                    {/* Label + status */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Email
                        </label>
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700 dark:border-red-400/70 dark:bg-red-500/10 dark:text-red-300">
                            <CiCircleInfo /> Unverified
                        </span>
                    </div>

                    {/* Value + CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <input
                            type="text"
                            className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white dark:placeholder:text-white"
                            placeholder="dinesh@gmail.com" disabled
                        />
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded border bg-red-500 border-red-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-500 hover:text-white dark:text-white dark:hover:bg-red-500"
                        >
                            Verify Now
                        </button>
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                    {/* Label + status */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Phone
                        </label>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-700 dark:border-green-400/70 dark:bg-green-500/10 dark:text-green-300">
                            <BiCheck/> Verified
                        </span>
                    </div>

                    {/* Value + CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <input
                            type="text"
                            className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500dark:text-white dark:placeholder:text-white"
                            placeholder="(+91) 888 88 88888" disabled
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 flex gap-1 items-center">
                        Location <IoLocationSharp className="text-pink"/>
                    </label>
                    <input
                        type="text"
                        className="w-full rounded border border-pink/10 bg-pink/5 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-pink/50 focus:outline-none focus:border-pink transition duration-500 dark:text-white"
                        placeholder="City, State"
                    />
                </div>

                {/* Gender */}

                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        Gender <FaUser className="text-pink" />
                    </p>

                    <div className="md:grid grid-cols-3 gap-3 space-y-3">
                        {genderOptions.map((g) => {
                            const isActive = selected === g.label;

                            return (
                                <button
                                    key={g.label}
                                    onClick={() => setSelected(g.label)}
                                    type="button"
                                    className={[
                                        "flex items-center gap-2 w-full rounded-full px-3 py-2 border transition duration-500",
                                        isActive
                                            ? "bg-pink text-white border-pink-600"
                                            : "border-pink/10 bg-pink/5 text-slate-800 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-200 dark:border-pink-400/50 dark:hover:text-slate-800",
                                    ].join(" ")}
                                >
                                    <Image
                                        src={g.icon}
                                        width={40}
                                        height={40}
                                        alt={g.label}
                                        className="rounded-full"
                                    />
                                    <span className="text-md font-medium">
                                        {g.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                {/* Update Button - Full Gradient Pill */}
                <Button
                    variant="DarkGradient"
                    size="lg"
                    className="w-full sm:w-2/3 flex items-center justify-center gap-2 rounded-full"
                >
                    <span className="text-lg">⬇️</span>
                    Update Details
                </Button>


                {/* Skip for Now - Soft Glass Gradient */}
                <Button
                    variant="LightGradient"
                    size="md"
                    className="w-full sm:w-1/3 text-pink font-medium rounded-full"
                >
                    Skip for Now
                </Button>

            </div>
        </div>

            <ProTipBanner
                icon={<FaRegLightbulb className="w-10 h-10 text-white text-yellow-400" />}
                title="Pro Tip!"
                description="Complete all sections to get personalised college recommendations and increase your profile strength to 100%!"
            />

        </>
    );
}
