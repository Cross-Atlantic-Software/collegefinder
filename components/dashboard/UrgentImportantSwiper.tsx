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
    <section className="rounded-lg bg-gradient-to-r from-highlight-100 to-action-100 p-4 text-xs text-slate-900 shadow-sm border border-action-100 overflow-hidden">
      <p className="type-label text-brand-ink">
        Urgent & Important
      </p>

      <div className="mt-3 w-full">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={12}
          slidesPerView={1}
          loop
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          className="w-full !pb-6"
          style={{ width: "100%" }}
        >
          {urgentItems.map((item) => (
            <SwiperSlide key={item.id} className="!w-full">
              <div className="pb-2">
                <p className="type-subheading">{item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-800">
                  {item.desc}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
