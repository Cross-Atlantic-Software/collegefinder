"use client";

import { useState } from "react";
import Image from "next/image";

import { BiCheck } from "react-icons/bi";
import { LuLock } from "react-icons/lu";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";

import { Button } from "../../shared";

const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:border-pink focus:bg-white/10";

export default function BasicInfoForm() {
  const [selected, setSelected] = useState<string>("Male");

  return (
    <div className="space-y-6 rounded-md bg-white/10 p-6 text-sm text-slate-200 shadow-sm">
      <div className="space-y-5 rounded-md bg-white/5 p-6">
        <h2 className="text-base font-semibold text-pink sm:text-lg">
          Basic Information
        </h2>

        {/* Name */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              First Name <span className="text-pink">*</span>
            </label>
            <input
              type="text"
              placeholder="First name"
              className={inputBase}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-medium text-slate-300">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Last name"
              className={inputBase}
            />
          </div>
        </div>

        {/* DOB & Location */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              Date of Birth
              <LuLock className="h-4 w-4 text-slate-400" />
            </label>
            <input
              type="date"
              defaultValue="2006-05-15"
              className={inputBase}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              Location <IoLocationSharp className="h-4 w-4 text-pink" />
            </label>
            <input
              type="text"
              placeholder="City, State"
              className={inputBase}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-300">Email</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              <CiCircleInfo className="text-xs" />
              Unverified
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="user@gmail.com"
              disabled
              className={`${inputBase} flex-1 cursor-not-allowed opacity-50`}
            />
            <button
              type="button"
              className="rounded-md bg-pink-600 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-pink-700"
            >
              Verify Now
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-300">Phone</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <BiCheck className="text-xs" />
              Verified
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="(+91) 888 88 88888"
              disabled
              className={`${inputBase} cursor-not-allowed pr-14 opacity-50`}
            />
            <span className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-emerald-500 text-white shadow">
              <BiCheck className="text-lg" />
            </span>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
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
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-transparent bg-pink-600 text-white shadow"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-pink hover:bg-white/10"
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
          className="w-full flex-1 rounded-full"
        >
          Update Details
        </Button>

        <Button
          variant="LightGradient"
          size="md"
          className="w-full flex-1 rounded-full text-pink"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
