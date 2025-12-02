"use client";

import { useState } from "react";
import Image from "next/image";
import { type IconType } from "react-icons";

import { BiCheck } from "react-icons/bi";
import { LuLock } from "react-icons/lu";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser, FaGraduationCap, FaBullseye } from "react-icons/fa6";

import { Button } from "../../shared";

const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

const inputBase =
  "w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none";

export default function BasicInfoForm() {
  const [selected, setSelected] = useState<string>("Male");

  return (
    <div className="space-y-6 border border-[#ffd6f1] bg-white/95 p-6 text-sm text-slate-600 shadow-[0_20px_60px_-25px_rgba(203,67,145,0.35)] backdrop-blur sm:p-8">

      <div className="space-y-5 rounded-3xl border border-[#ffe1f6] bg-white/70 p-6 shadow-inner">
        <h2 className="text-base font-semibold text-[#d50076] sm:text-lg">
          Basic Information
        </h2>

        {/* Name */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-600">
              First Name <span className="text-pink">*</span>
            </label>
            <input
              type="text"
              placeholder="First name"
              className={`${inputBase} border-[#ffc9eb] bg-[#fff2fb] text-slate-700 placeholder:text-pink/50 focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20`}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-600">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Last name"
              className={`${inputBase} border-[#ffc9eb] bg-[#fff2fb] text-slate-700 placeholder:text-pink/50 focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20`}
            />
          </div>
        </div>

        {/* DOB & Location */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Date of Birth
              <LuLock className="h-4 w-4 text-slate-400" />
            </label>
            <input
              type="date"
              defaultValue="2006-05-15"
              className={`${inputBase} border-[#ffc9eb] bg-[#fff2fb] text-slate-700 focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20`}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Location <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <input
              type="text"
              placeholder="City, State"
              className={`${inputBase} border-[#ffc9eb] bg-[#fff2fb] text-slate-700 placeholder:text-pink/50 focus:border-pink focus:bg-white focus:ring-2 focus:ring-pink/20`}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-600">Email</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ffe3ea] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#d91a46]">
              <CiCircleInfo className="text-xs" />
              Unverified
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="user@gmail.com"
              disabled
              className={`${inputBase} flex-1 cursor-not-allowed border border-[#ffc9eb] bg-[#fff2fb] text-slate-500 placeholder:text-pink/50`}
            />
            <button
              type="button"
              className="rounded-xl bg-[#ff2d20] px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-[#ff4639]"
            >
              Verify Now
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-600">Phone</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d3f8df] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1d9a4a]">
              <BiCheck className="text-xs" />
              Verified
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="(+91) 888 88 88888"
              disabled
              className={`${inputBase} cursor-not-allowed border border-[#c8f1d9] bg-[#f2fff6] pr-14 text-emerald-600`}
            />
            <span className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-emerald-500 text-white shadow">
              <BiCheck className="text-lg" />
            </span>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Gender <FaUser className="text-pink" />
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {genderOptions.map((gender) => {
              const isActive = selected === gender.label;

              return (
                <button
                  key={gender.label}
                  type="button"
                  onClick={() => setSelected(gender.label)}
                  className={`flex w-full items-center gap-3 rounded-full border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-transparent bg-gradient-to-r from-[#a616ff] to-[#ff0f7b] text-white shadow-[0_15px_35px_-20px_rgba(162,22,255,0.75)]"
                      : "border-[#ffd6f1] bg-white text-pink hover:border-pink hover:text-pink"
                  }`}
                >
                  <Image
                    src={gender.icon}
                    width={42}
                    height={42}
                    alt={gender.label}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="text-sm font-semibold">{gender.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          variant="DarkGradient"
          size="md"
          className="w-full flex-1 rounded-full shadow-[0_18px_40px_-20px_rgba(162,22,255,0.8)]"
        >
          Update Details
        </Button>

        <Button
          variant="LightGradient"
          size="md"
          className="w-full flex-1 rounded-full text-pink shadow-inner shadow-white/40"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
