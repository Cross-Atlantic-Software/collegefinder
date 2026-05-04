"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FiCheck, FiCheckCircle } from "react-icons/fi";
import { RoughNotation } from "react-rough-notation";
import type { LandingPageContent } from "@/types/landingPage";
import { useAuth } from "@/contexts/AuthContext";
import {
    getBasicInfo,
    updateBasicInfo,
    getAcademics,
    updateAcademics,
    getUserAddress,
    upsertUserAddress,
    getCareerGoals,
    updateCareerGoals,
    markLandingOnboardingComplete,
    getAllStreamsPublic,
    getAllCareerGoalsPublic,
    checkEmailRegistrationStatus,
    sendOTP,
    verifyOTP,
    type StreamPublic,
} from "@/api";
import { getAllCities } from "@/lib/data/indianStatesDistricts";
import {
    LANDING_FROM_HOME_PARAM,
    LANDING_FROM_HOME_VALUE,
} from "@/lib/landingNav";
import Select from "@/components/shared/Select";

const OTP_LEN = 6;

type CareerOpt = { id: string; label: string; logo?: string | null };

export default function ContactSection({ contact }: { contact: LandingPageContent["contact"] }) {
    const contactPoints = contact.points || [];
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const allowLandingFromWelcome =
        searchParams.get(LANDING_FROM_HOME_PARAM) === LANDING_FROM_HOME_VALUE;

    const { isAuthenticated, user, login, refreshUser } = useAuth();
    const onboardingDone = Boolean(user?.onboarding_completed);

    const [streams, setStreams] = useState<StreamPublic[]>([]);
    const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
    const [interestOptions, setInterestOptions] = useState<CareerOpt[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingInterests, setLoadingInterests] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(
        null,
    );

    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [streamId, setStreamId] = useState("");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailBlocked, setEmailBlocked] = useState(false);
    const [emailCheckedOk, setEmailCheckedOk] = useState(false);

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState<string[]>(() => Array(OTP_LEN).fill(""));
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const cities = useMemo(() => getAllCities(), []);

    const loadStreams = useCallback(async () => {
        const res = await getAllStreamsPublic();
        if (res.success && res.data?.streams?.length) {
            setStreams(res.data.streams.filter((s) => s.status !== false));
        }
    }, []);

    useEffect(() => {
        setCityOptions(cities.map((c) => ({ value: c, label: c })));
    }, [cities]);

    const fetchInterestOptions = useCallback(async (sid: string) => {
        const n = parseInt(sid, 10);
        if (!sid || Number.isNaN(n) || n < 1) {
            setInterestOptions([]);
            return;
        }
        setLoadingInterests(true);
        try {
            const res = await getAllCareerGoalsPublic(n);
            if (res.success && res.data?.careerGoals) {
                setInterestOptions(
                    res.data.careerGoals.map((cg) => ({
                        id: String(cg.id),
                        label: cg.label,
                        logo: cg.logo,
                    })),
                );
            } else {
                setInterestOptions([]);
            }
        } catch {
            setInterestOptions([]);
        } finally {
            setLoadingInterests(false);
        }
    }, []);

    const loadProfile = useCallback(async () => {
        if (!isAuthenticated || onboardingDone) {
            return;
        }
        setLoadingProfile(true);
        setFormMessage(null);
        try {
            const [basicRes, acRes, addrRes, cgRes] = await Promise.all([
                getBasicInfo(),
                getAcademics(),
                getUserAddress(),
                getCareerGoals(),
            ]);
            if (basicRes.success && basicRes.data) {
                const b = basicRes.data;
                setNickname(b.name?.trim() || "");
                setEmail(b.email?.trim() || "");
                setPhone(b.phone_number?.trim() || "");
            }
            if (acRes.success && acRes.data) {
                const a = acRes.data;
                setStreamId(a.stream_id != null && a.stream_id > 0 ? String(a.stream_id) : "");
            }
            if (addrRes.success && addrRes.data?.city_town_village) {
                setCity(addrRes.data.city_town_village);
            }
            if (cgRes.success && cgRes.data?.interests?.length) {
                setSelectedInterests(cgRes.data.interests.map(String));
            }
            setEmailCheckedOk(true);
        } catch {
            setFormMessage({ type: "error", text: "Could not load your profile." });
        } finally {
            setLoadingProfile(false);
        }
    }, [isAuthenticated, onboardingDone]);

    useEffect(() => {
        void loadStreams();
    }, [loadStreams]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (streamId) {
            void fetchInterestOptions(streamId);
        } else {
            setInterestOptions([]);
        }
    }, [streamId, fetchInterestOptions]);

    useEffect(() => {
        if (!isAuthenticated || !onboardingDone || allowLandingFromWelcome) {
            return;
        }
        router.replace("/welcome");
    }, [allowLandingFromWelcome, isAuthenticated, onboardingDone, router]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const resetGuestEmailFlow = () => {
        setEmailBlocked(false);
        setEmailCheckedOk(false);
        setOtpSent(false);
        setOtp(Array(OTP_LEN).fill(""));
        setOtpVerified(false);
    };

    const handleEmailContinue = async () => {
        const em = email.trim().toLowerCase();
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            setFormMessage({ type: "error", text: "Enter a valid email address." });
            return;
        }
        setCheckingEmail(true);
        setFormMessage(null);
        resetGuestEmailFlow();
        try {
            const res = await checkEmailRegistrationStatus(em);
            if (!res.success || !res.data) {
                throw new Error(res.message || "Could not verify email.");
            }
            if (res.data.exists && res.data.onboardingCompleted) {
                setEmailBlocked(true);
                setEmailCheckedOk(false);
                setFormMessage({
                    type: "error",
                    text: "An account with this email already exists and onboarding is complete. Please log in.",
                });
                return;
            }
            setEmailBlocked(false);
            setEmailCheckedOk(true);
            setFormMessage(null);
        } catch (e) {
            setFormMessage({
                type: "error",
                text: e instanceof Error ? e.message : "Could not verify email.",
            });
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleSendOtp = async () => {
        const em = email.trim().toLowerCase();
        if (!em) return;
        setFormMessage(null);
        try {
            const res = await sendOTP(em);
            if (!res.success) {
                throw new Error(res.message || "Could not send code.");
            }
            setOtpSent(true);
            setOtp(Array(OTP_LEN).fill(""));
        } catch (e) {
            setFormMessage({
                type: "error",
                text: e instanceof Error ? e.message : "Could not send verification code.",
            });
        }
    };

    const verifyOtpAndLogin = async () => {
        const em = email.trim().toLowerCase();
        const code = otp.join("");
        if (code.length !== OTP_LEN) {
            setFormMessage({ type: "error", text: "Enter the 6-digit code." });
            return;
        }
        setOtpVerifying(true);
        setFormMessage(null);
        try {
            let pendingRef: string | undefined;
            try {
                pendingRef = sessionStorage.getItem("cf_pending_ref") || undefined;
            } catch {
                pendingRef = undefined;
            }
            const res = await verifyOTP(em, code, pendingRef);
            if (!res.success || !res.data?.token || !res.data.user) {
                throw new Error(res.message || "Invalid code.");
            }
            try {
                sessionStorage.removeItem("cf_pending_ref");
            } catch {
                /* ignore */
            }
            const raw = res.data.user;
            login(res.data.token, {
                id: raw.id,
                user_code: raw.user_code ?? undefined,
                email: raw.email,
                name: raw.name ?? undefined,
                profile_photo: raw.profile_photo ?? undefined,
                onboarding_completed: Boolean(raw.onboarding_completed),
                createdAt: raw.createdAt,
                has_password: (raw as { has_password?: boolean }).has_password,
            });
            setOtpVerified(true);
            await refreshUser();
            setFormMessage({ type: "success", text: "Email verified." });
        } catch (e) {
            setFormMessage({
                type: "error",
                text: e instanceof Error ? e.message : "Verification failed.",
            });
        } finally {
            setOtpVerifying(false);
        }
    };

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 3) {
                setFormMessage({ type: "error", text: "You can select up to 3 interests." });
                return prev;
            }
            return [...prev, id];
        });
    };

    const guestCanFillDetails =
        !isAuthenticated && emailCheckedOk && !emailBlocked && otpVerified;

    const displayFormFields =
        (isAuthenticated && !onboardingDone && !loadingProfile) || guestCanFillDetails;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormMessage(null);

        if (!isAuthenticated) {
            setFormMessage({ type: "error", text: "Verify your email with the code before submitting." });
            return;
        }
        if (!nickname.trim()) {
            setFormMessage({ type: "error", text: "Please enter your nickname." });
            return;
        }
        if (!streamId) {
            setFormMessage({ type: "error", text: "Please select your stream." });
            return;
        }
        if (!city.trim()) {
            setFormMessage({ type: "error", text: "Please select your city." });
            return;
        }
        if (selectedInterests.length === 0) {
            setFormMessage({ type: "error", text: "Select at least one interest." });
            return;
        }

        setSaving(true);
        try {
            const basicRes = await updateBasicInfo({
                name: nickname.trim(),
                phone_number: phone.trim() ? phone.trim() : "",
            });
            if (!basicRes.success) {
                throw new Error(basicRes.message || "Could not update profile.");
            }

            const sid = parseInt(streamId, 10);
            const acRes = await updateAcademics({ stream_id: sid });
            if (!acRes.success) {
                throw new Error(acRes.message || "Could not update stream.");
            }

            const addrRes = await upsertUserAddress({
                city_town_village: city.trim(),
                country: "India",
            });
            if (!addrRes.success) {
                throw new Error(addrRes.message || "Could not save city.");
            }

            const cgRes = await updateCareerGoals({
                interests: selectedInterests.map((x) => x.toString()),
            });
            if (!cgRes.success) {
                throw new Error(cgRes.message || "Could not save interests.");
            }

            const doneRes = await markLandingOnboardingComplete();
            if (!doneRes.success) {
                throw new Error(doneRes.message || "Could not finalize onboarding.");
            }

            await refreshUser();
            router.push("/welcome");
            return;
        } catch (err) {
            setFormMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Save failed.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (isAuthenticated && onboardingDone && !allowLandingFromWelcome) {
        return (
            <section
                id="contact"
                ref={sectionRef}
                className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
                aria-busy="true"
            >
                <div className="appContainer py-16">
                    <p className="sr-only">Continuing…</p>
                </div>
            </section>
        );
    }

    if (isAuthenticated && onboardingDone && allowLandingFromWelcome) {
        return (
            <section
                id="contact"
                ref={sectionRef}
                className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
            >
                <div className="appContainer">
                    <div className="relative landing-grid-gap grid items-start lg:grid-cols-[0.46fr_0.54fr] lg:items-stretch">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/60">
                                {contact.label}
                            </p>
                            <h3 className="mt-4 text-4xl font-extrabold leading-[1.05] text-black md:text-5xl lg:text-[3.2rem]">
                                {contact.titleBefore}
                                <br />
                                {contact.titleBreak}{" "}
                                <RoughNotation
                                    type="underline"
                                    show={isVisible}
                                    color="#f0c544"
                                    strokeWidth={3}
                                    padding={3}
                                    animationDelay={500}
                                    animationDuration={1300}
                                >
                                    {contact.titleUnderline}
                                </RoughNotation>
                                .
                            </h3>
                            <p className="mt-4 max-w-lg whitespace-pre-line text-sm leading-relaxed text-black/60 md:text-base">
                                {contact.subtitle}
                            </p>
                            <ul className="mt-8 space-y-6">
                                {contactPoints.map((point, idx) => (
                                    <li key={`${point.title}-${idx}`} className="flex items-start gap-3">
                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-black">
                                            <FiCheck className="text-sm" />
                                        </span>
                                        <div>
                                            <p className="text-base font-semibold text-black">
                                                <span className="landing-scribble-hover">{point.title}</span>
                                            </p>
                                            <p className="mt-1 whitespace-pre-line text-sm text-black/60">
                                                {point.description}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[460px] items-center justify-center">
                            <div className="landing-card-lift rounded-2xl border border-black/10 bg-gradient-to-b from-amber-50/90 to-white p-6 shadow-sm md:p-8">
                                <p className="text-xl font-bold text-black">Contact us if you have any query</p>
                                <p className="mt-2 text-sm text-black/55">
                                    You&apos;re all set with your profile. For admissions support or questions,
                                    reach out and our team will help.
                                </p>
                                <Link
                                    href="/welcome"
                                    className="landing-cta mt-6 inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85"
                                >
                                    Your journey
                                </Link>
                                <a
                                    href="mailto:admin@unitracko.com"
                                    className="mt-3 block text-center text-sm font-medium text-black/70 underline-offset-4 hover:text-black hover:underline"
                                >
                                    admin@unitracko.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="contact"
            ref={sectionRef}
            className="landing-section scroll-mt-20 bg-white md:scroll-mt-24"
        >
            <div className="appContainer">
                <div className="relative landing-grid-gap grid items-start lg:grid-cols-[0.46fr_0.54fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/60">
                            {contact.label}
                        </p>

                        <h3 className="mt-4 text-4xl font-extrabold leading-[1.05] text-black md:text-5xl lg:text-[3.2rem]">
                            {contact.titleBefore}
                            <br />
                            {contact.titleBreak}{" "}
                            <RoughNotation
                                type="underline"
                                show={isVisible}
                                color="#f0c544"
                                strokeWidth={3}
                                padding={3}
                                animationDelay={500}
                                animationDuration={1300}
                            >
                                {contact.titleUnderline}
                            </RoughNotation>
                            .
                        </h3>

                        <p className="mt-4 max-w-lg whitespace-pre-line text-sm leading-relaxed text-black/60 md:text-base">
                            {contact.subtitle}
                        </p>

                        <ul className="mt-8 space-y-6">
                            {contactPoints.map((point, idx) => (
                                <li key={`${point.title}-${idx}`} className="flex items-start gap-3">
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-black">
                                        <FiCheck className="text-sm" />
                                    </span>
                                    <div>
                                        <p className="text-base font-semibold text-black">
                                            <span className="landing-scribble-hover">{point.title}</span>
                                        </p>
                                        <p className="mt-1 whitespace-pre-line text-sm text-black/60">
                                            {point.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative mx-auto w-full max-w-[460px]">
                        <div className="landing-card-lift rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
                            <p className="text-2xl font-bold text-black">{contact.formTitle}</p>
                            <p className="mt-1 text-sm text-black/50">{contact.formSubtitle}</p>

                            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                        Email
                                    </label>
                                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (!isAuthenticated) resetGuestEmailFlow();
                                            }}
                                            readOnly={isAuthenticated}
                                            className="min-w-0 flex-1 border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 focus:border-black/40 focus:outline-none read-only:text-black/70"
                                        />
                                        {!isAuthenticated && (
                                            <button
                                                type="button"
                                                onClick={handleEmailContinue}
                                                disabled={checkingEmail}
                                                className="shrink-0 rounded-full border border-black/20 px-4 py-2 text-xs font-semibold text-black transition hover:bg-black/5 disabled:opacity-50"
                                            >
                                                {checkingEmail ? "Checking…" : "Continue"}
                                            </button>
                                        )}
                                    </div>
                                    {emailBlocked && (
                                        <p className="mt-2 text-xs font-medium text-amber-800">
                                            This email is already registered with a completed profile.{" "}
                                            <Link href="/login" className="font-semibold underline">
                                                Log in
                                            </Link>{" "}
                                            to continue.
                                        </p>
                                    )}
                                </div>

                                {!isAuthenticated && emailCheckedOk && !emailBlocked && (
                                    <div className="rounded-xl border border-black/10 bg-amber-50/50 p-4">
                                        {!otpVerified ? (
                                            <>
                                                <p className="text-xs font-medium text-black/70">
                                                    We&apos;ll send a one-time code to verify this email.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    className="landing-cta mt-3 w-full rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85"
                                                >
                                                    {otpSent ? "Resend verification code" : "Send verification code"}
                                                </button>
                                                {otpSent && (
                                                    <div className="mt-4">
                                                        <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                            Enter code
                                                        </label>
                                                        <div className="mt-2 flex gap-1.5 justify-center">
                                                            {otp.map((d, i) => (
                                                                <input
                                                                    key={i}
                                                                    ref={(el) => {
                                                                        otpRefs.current[i] = el;
                                                                    }}
                                                                    inputMode="numeric"
                                                                    maxLength={1}
                                                                    value={d}
                                                                    onChange={(ev) => {
                                                                        const v = ev.target.value.replace(/\D/g, "");
                                                                        const next = [...otp];
                                                                        next[i] = v.slice(-1);
                                                                        setOtp(next);
                                                                        if (v && i < OTP_LEN - 1) {
                                                                            otpRefs.current[i + 1]?.focus();
                                                                        }
                                                                    }}
                                                                    onKeyDown={(ev) => {
                                                                        if (
                                                                            ev.key === "Backspace" &&
                                                                            !otp[i] &&
                                                                            i > 0
                                                                        ) {
                                                                            otpRefs.current[i - 1]?.focus();
                                                                        }
                                                                    }}
                                                                    className="h-10 w-9 rounded-lg border border-black/15 text-center text-base font-semibold text-black outline-none focus:border-black/40"
                                                                />
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={verifyOtpAndLogin}
                                                            disabled={otpVerifying || otp.join("").length !== OTP_LEN}
                                                            className="landing-cta mt-4 w-full rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85 disabled:opacity-50"
                                                        >
                                                            {otpVerifying ? "Verifying…" : "Verify email"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                                <FiCheckCircle className="h-5 w-5 shrink-0" />
                                                Email verified — you can complete your details below.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {displayFormFields && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                Nickname
                                            </label>
                                            <input
                                                type="text"
                                                autoComplete="nickname"
                                                placeholder="Your nickname"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                disabled={loadingProfile && isAuthenticated}
                                                className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 focus:border-black/40 focus:outline-none disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder="Your contact number"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                disabled={loadingProfile && isAuthenticated}
                                                className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black placeholder:text-black/35 focus:border-black/40 focus:outline-none disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                City
                                            </label>
                                            <div className="mt-2">
                                                <Select
                                                    options={cityOptions}
                                                    value={city || null}
                                                    onChange={(v) => setCity(v || "")}
                                                    placeholder="Search and select your city"
                                                    disabled={loadingProfile && isAuthenticated}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                Stream
                                            </label>
                                            <select
                                                value={streamId}
                                                onChange={(e) => {
                                                    setStreamId(e.target.value);
                                                    setSelectedInterests([]);
                                                }}
                                                disabled={loadingProfile && isAuthenticated}
                                                className="mt-1 w-full border-b border-black/20 bg-transparent pb-2 text-sm text-black focus:border-black/40 focus:outline-none disabled:opacity-60"
                                            >
                                                <option value="">Select stream</option>
                                                {streams.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide text-black/50">
                                                Interests (up to 3)
                                            </label>
                                            {loadingInterests ? (
                                                <p className="mt-2 text-xs text-black/45">Loading interests…</p>
                                            ) : interestOptions.length === 0 ? (
                                                <p className="mt-2 text-xs text-amber-800">
                                                    Choose a stream to see interests.
                                                </p>
                                            ) : (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {interestOptions.map((opt) => {
                                                        const on = selectedInterests.includes(opt.id);
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => toggleInterest(opt.id)}
                                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                                    on
                                                                        ? "border-black bg-black text-white"
                                                                        : "border-black/15 bg-white text-black/80 hover:border-black/30"
                                                                }`}
                                                            >
                                                                {opt.logo ? (
                                                                    <Image
                                                                        src={opt.logo}
                                                                        alt=""
                                                                        width={18}
                                                                        height={18}
                                                                        className="rounded-sm object-cover"
                                                                        unoptimized
                                                                    />
                                                                ) : null}
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {formMessage && (
                                    <p
                                        className={`text-center text-xs font-semibold ${
                                            formMessage.type === "success"
                                                ? "text-green-700"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {formMessage.text}
                                    </p>
                                )}

                                {displayFormFields && (
                                    <button
                                        type="submit"
                                        disabled={saving || (loadingProfile && isAuthenticated)}
                                        className="landing-cta mt-1 w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/85 disabled:opacity-60"
                                    >
                                        {saving ? "Saving…" : contact.formSubmit}
                                    </button>
                                )}

                                <p className="text-center text-xs font-semibold text-green-700">
                                    {contact.formPrivacy}
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
