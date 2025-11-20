"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const urgentItems = [
  {
    id: 1,
    title: "IIT Madras B.Sc. (Bachelor of Science)",
    desc: "Based on your profile, this exam is highly recommended.",
  },
  {
    id: 2,
    title: "BITSAT Registration Closing Soon",
    desc: "Hurry up! Few days left to apply.",
  },
  {
    id: 3,
    title: "VITEEE Slot Booking Starts Soon",
    desc: "Secure your preferred exam slot.",
  },
];

export default function UrgentImportantSwiper() {
  return (
    <section className="rounded-md bg-lightGradient p-4 text-xs text-slate-900 shadow-lg">
      <p className="text-lg font-semibold uppercase tracking-wide text-pink">
        Urgent & Important
      </p>

      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        loop
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        className="!pb-6 mt-3"
      >
        {urgentItems.map((item) => (
          <SwiperSlide key={item.id}>
            <div className=" pb-2">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-800">
                {item.desc}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
