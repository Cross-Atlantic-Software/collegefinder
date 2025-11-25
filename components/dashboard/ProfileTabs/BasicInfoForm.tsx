"use client";

import { useState } from "react";
import Image from "next/image";

import { BiCheck } from "react-icons/bi";
import { Button } from "../../shared";
import { LuLock } from "react-icons/lu";
import { CiCircleInfo } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";

const genderOptions = [
  { label: "Male", icon: "/icons/male.png" },
  { label: "Female", icon: "/icons/female.png" },
  { label: "Prefer not to say", icon: "/icons/not-say.png" },
];

export default function BasicInfoForm() {
  const [selected, setSelected] = useState<string>("Male");

  return (
    <div className="rounded bg-white/5 text-sm text-slate-100 p-4">
      <h2 className="mb-4 text-base font-semibold text-pink sm:text-lg">
        Basic Information
      </h2>

      <div className="space-y-5">
        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              First Name
            </label>
            <input
              type="text"
              className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Last Name
            </label>
            <input
              type="text"
              className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
              placeholder="Last name"
            />
          </div>
        </div>

        {/* DOB */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-200">
            <span>Date of Birth</span>
            <LuLock className="h-3 w-3 text-white/50" />
          </div>
          <input
            type="date"
            className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-200">Email</label>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 text-[10px] text-red-700">
              <CiCircleInfo /> Unverified
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
              placeholder="dinesh@gmail.com"
              disabled
            />

            <button className="rounded bg-red-500 px-4 py-1.5 text-xs font-semibold">
              Verify Now
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-200">Phone</label>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-[10px] text-green-700">
              <BiCheck /> Verified
            </span>
          </div>

          <input
            type="text"
            className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
            placeholder="(+91) 888 88 88888"
            disabled
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-slate-200 mb-1 flex gap-1 items-center">
            Location <IoLocationSharp className="text-pink" />
          </label>
          <input
            type="text"
            className="w-full rounded border border-pink/10 bg-white/10 px-3 py-3 text-sm"
            placeholder="City, State"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-200 flex items-center gap-1">
            Gender <FaUser className="text-pink" />
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            {genderOptions.map((g) => {
              const isActive = selected === g.label;

              return (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setSelected(g.label)}
                  className={`flex items-center gap-2 w-full rounded-full px-3 py-2 border transition ${
                    isActive
                      ? "bg-pink text-white border-pink-600"
                      : "border-pink/10 bg-white/10 hover:bg-pink/20"
                  }`}
                >
                  <Image
                    src={g.icon}
                    width={40}
                    height={40}
                    alt={g.label}
                    className="rounded-full"
                  />
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-7 flex flex-col sm:flex-row gap-4">
        <Button
          variant="DarkGradient"
          size="md"
          className="w-full sm:w-1/2 rounded-full"
        >
          Update Details
        </Button>

        <Button
          variant="LightGradient"
          size="md"
          className="w-full sm:w-1/2 rounded-full"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
