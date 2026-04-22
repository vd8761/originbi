"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { studentService } from "../../lib/services/student.service";
import { capitalizeWords } from "../../lib/utils";

declare global {
    interface Window {
        Razorpay: any;
    }
}

// --- Constants (Matching PickMyCareer labels) ---
const BOARD_LABELS: Record<string, string> = {
    STATE_BOARD: "State Board",
    CBSE: "CBSE",
    ICSE: "ICSE",
    IGCSE: "IGCSE",
    IB: "IB",
    OTHER: "Other",
};

const STREAM_LABELS: Record<string, string> = {
    PCMB: "PCMB (Physics, Chemistry, Maths, Biology)",
    PCB: "PCB (Physics, Chemistry, Biology)",
    PCM: "PCM (Physics, Chemistry, Mathematics)",
    PCBZ: "PCBZ (Physics, Chemistry, Botany, Zoology)",
    COMMERCE: "Commerce Stream",
    HUMANITIES: "Humanities / Arts Stream",
};

const LEVEL_LABELS: Record<string, string> = {
    SSLC: "SSLC (10th Standard)",
    HSC: "HSC (12th Standard)",
};

const STANDARD_LABELS: Record<string, string> = {
    "1": "11th Standard",
    "2": "12th Standard",
};

// --- Components ---

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1ED36A]">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

function ReadOnlyField({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={`space-y-1.5 ${className || ""}`}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    readOnly
                    disabled
                    value={value || "N/A"}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-full px-6 text-sm font-medium text-slate-600 outline-none cursor-not-allowed select-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <LockIcon />
                </div>
            </div>
        </div>
    );
}

export default function DebriefPage() {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hasExistingBooking, setHasExistingBooking] = useState(false);
    const [isAssessmentCompleted, setIsAssessmentCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const DEBRIEF_AMOUNT = Number(process.env.NEXT_PUBLIC_DEBRIEF_AMOUNT) || 2500;

    const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
            if (window.Razorpay) { resolve(true); return; }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

    useEffect(() => {
        const fetchProfile = async () => {
            const email =
                sessionStorage.getItem("userEmail") ||
                localStorage.getItem("userEmail");

            if (!email) {
                setError("You must be logged in to book a debrief session.");
                setLoading(false);
                return;
            }

            try {
                const [profile, debriefStatus] = await Promise.all([
                    studentService.getProfile(email),
                    studentService.getDebriefStatus(email),
                ]);

                if (profile) {
                    setUserProfile(profile);
                    
                    // Check assessment completion status
                    const assessmentStatus = await studentService.getAssessmentStatus(profile.id);
                    setIsAssessmentCompleted(assessmentStatus.isCompleted);

                    if (debriefStatus?.booked || profile.metadata?.debrief) {
                        setHasExistingBooking(true);
                        // Don't set isSuccess=true here anymore, as we want to show the form
                    }
                } else {
                    setError("Unable to load your profile. Please try again.");
                }
            } catch (err) {
                console.error("Failed to load profile", err);
                setError("Something went wrong. Please refresh the page.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handlePayment = async () => {
        if (!userProfile?.email) return;
        setProcessing(true);
        setError(null);

        try {
            const loaded = await loadRazorpay();
            if (!loaded) {
                setError("Payment SDK failed to load. Please check your internet connection.");
                setProcessing(false);
                return;
            }

            const orderData = await studentService.createDebriefOrder(userProfile.email);

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "OriginBI",
                description: "Debrief Session Booking",
                image: "/Origin-BI-Logo-01.png",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const verification = await studentService.verifyDebriefPayment({
                            email: userProfile.email,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verification.success) {
                            setIsSuccess(true);
                        } else {
                            setError("Payment verification failed. Please contact support.");
                        }
                    } catch {
                        setError("An error occurred during verification. Please contact support.");
                    }
                },
                prefill: {
                    name: capitalizeWords(userProfile.fullName || userProfile.metadata?.name || ""),
                    email: userProfile.email,
                    contact: userProfile.mobileNumber || "",
                },
                notes: { address: "Origin BI Corporate Office" },
                theme: { color: "#1ED36A" },
                modal: { ondismiss: () => setProcessing(false) },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (res: any) => {
                setError("Payment failed: " + res.error.description);
                setProcessing(false);
            });
            rzp.open();
        } catch (err: any) {
            console.error("Payment error", err);
            setError(err.message || "Unable to initiate payment. Please try again.");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#1ED36A] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (error && !userProfile) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Session Required</h2>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <a 
                        href="/student/login" 
                        className="inline-block px-8 py-3 bg-[#1ED36A] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    if (isSuccess && !hasExistingBooking) {
        return (
            <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1ED36A]/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1ED36A]/5 rounded-full blur-3xl" />
                </div>
                <div className="flex-1 flex items-center justify-center px-4 z-10">
                    <div className="text-center max-w-md animate-in fade-in-0 zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-[#1ED36A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1ED36A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">
                            {hasExistingBooking ? "You have already booked!" : "Debrief Booked!"}
                        </h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            {hasExistingBooking 
                                ? "Our records show that you have already booked an expert debrief session. Our team will be in touch soon to schedule it."
                                : "Your debrief session has been successfully booked. Our expert team will review your assessment report and reach out to schedule your session."
                            }
                        </p>
                        <div className="bg-[#1ED36A]/10 border border-[#1ED36A]/20 rounded-2xl px-5 py-4 text-sm text-[#156e35] font-medium">
                            📩 You will receive a confirmation on <span className="font-bold">{userProfile?.email}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const fullName = capitalizeWords(
        userProfile?.metadata?.fullName || 
        userProfile?.metadata?.name || 
        userProfile?.fullName || 
        ""
    );
    const gender = userProfile?.metadata?.gender || userProfile?.gender;
    const mobileNumber = userProfile?.metadata?.mobileNumber || userProfile?.mobileNumber;
    
    // Academic details are nested in academicDetails object from backend
    const academic = userProfile?.academicDetails || {};
    
    const board = BOARD_LABELS[academic.studentBoard] || academic.studentBoard;
    const level = LEVEL_LABELS[academic.schoolLevel] || academic.schoolLevel;
    const stream = STREAM_LABELS[academic.schoolStream] || academic.schoolStream;
    const standard = STANDARD_LABELS[academic.currentYear] || academic.currentYear;

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
            {/* PickMyCareer Background Art */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
                <div
                    className="absolute -top-40 -left-40 w-96 md:w-[600px] h-96 md:h-[600px]"
                    style={{ background: "radial-gradient(circle, rgba(30,211,106,0.15) 0%, transparent 70%)" }}
                />
                <div
                    className="absolute -bottom-40 -right-40 w-96 md:w-[600px] h-96 md:h-[600px]"
                    style={{ background: "radial-gradient(circle, rgba(21,0,137,0.08) 0%, transparent 70%)" }}
                />
            </div>

            <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 pt-8 pb-4">
                <img src="/Origin-BI-Logo-01.png" alt="OriginBI" className="h-7 w-auto" />
                <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Secure Checkout
                </div>
            </header>

            <div className="relative z-10 flex-1 flex items-start justify-center pt-8 pb-20 px-4 sm:px-6">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Expert <span className="text-[#1ED36A]">Debrief</span>
                        </h1>
                        <p className="text-slate-500 font-semibold max-w-lg mx-auto leading-relaxed">
                            Book a one-on-one session with our expert career counsellors. 
                            They will deeply analyse your assessment report and explain the results to help you build a clear roadmap.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)]">
                        <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <div className="bg-[#1ED36A]/10 p-2 rounded-lg">
                                <CheckIcon />
                            </div>
                            <p className="text-xs text-emerald-800 font-semibold leading-tight">
                                These details are pre-filled from your registration and cannot be edited.
                            </p>
                        </div>

                        {hasExistingBooking && (
                            <div className="mb-8 p-6 bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-200 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="bg-[#1ED36A] p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-emerald-900 mb-1">Expert Debrief Confirmed</h4>
                                    <p className="text-xs text-emerald-800/80 font-bold leading-relaxed">
                                        Our records show that you have already booked your expert debrief session. 
                                        Our counsellors are reviewing your report and will reach out to you soon.
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-8">
                            {/* Personal Details */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-3 ml-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Personal Details</h3>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                
                                <ReadOnlyField label="Email Address" value={userProfile?.email || ""} />

                                <ReadOnlyField label="Full Name" value={fullName} />
                                
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <ReadOnlyField label="Gender" value={capitalizeWords(gender || "")} />
                                    <ReadOnlyField label="Mobile Number" value={mobileNumber || ""} />
                                </div>
                            </div>

                            {/* Academic Details - NEW */}
                            <div className="space-y-5 pt-2">
                                <div className="flex items-center gap-3 ml-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Profile</h3>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    <ReadOnlyField label="Student Board" value={board} />
                                    <ReadOnlyField label="School Level" value={level} />
                                </div>

                                {academic?.schoolLevel === "HSC" && (
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <ReadOnlyField label="Stream" value={stream} />
                                        <ReadOnlyField label="Current Grade" value={standard} />
                                    </div>
                                )}
                            </div>

                            {/* Pracing Summary */}
                            <div className="pt-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-inner">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-[#1ED36A] mb-1">Total Fee</p>
                                        <p className="text-xs text-slate-500 font-medium leading-tight">One-time debrief session booking</p>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900">
                                        ₹{DEBRIEF_AMOUNT.toLocaleString("en-IN")}
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            {!isAssessmentCompleted && (
                                <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                                    <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-amber-900 font-bold mb-1">Assessment Incomplete</p>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            You must complete all levels of your career assessment before you can book a debrief session. 
                                            This allows our experts to have your full report ready for discussion.
                                        </p>
                                        <a href="/student/assessment" className="inline-block mt-3 text-xs font-black text-[#1ED36A] hover:text-[#18c562] transition-colors">
                                            Continue Assessment →
                                        </a>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={processing || !isAssessmentCompleted || hasExistingBooking}
                                className={`w-full h-16 rounded-full font-black text-lg text-white shadow-2xl transition-all relative overflow-hidden group flex items-center justify-center gap-3 ${
                                    (processing || !isAssessmentCompleted || hasExistingBooking) ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-[#1ED36A] hover:bg-[#18c562] hover:-translate-y-1 active:translate-y-0"
                                }`}
                            >
                                <span className="relative z-10">
                                    {hasExistingBooking ? "Already Booked" : !isAssessmentCompleted ? "Complete Assessment to Book" : processing ? "Processing..." : `Pay ₹${DEBRIEF_AMOUNT.toLocaleString("en-IN")} & Book`}
                                </span>
                                {!processing && isAssessmentCompleted && !hasExistingBooking && (
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                )}
                            </button>

                            <p className="text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                                <LockIcon /> SECURE PAYMENT POWERED BY RAZORPAY
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
