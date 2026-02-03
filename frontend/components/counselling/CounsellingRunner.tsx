'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Types
interface Option {
    id: number;
    text_en: string;
    text_ta: string | null;
    order: number;
}
interface Question {
    id: number;
    text_en: string;
    text_ta: string | null;
    options: Option[];
}

export default function CounsellingRunner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [completed, setCompleted] = useState(false);

    // Verification State
    const [isVerified, setIsVerified] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [identifier, setIdentifier] = useState(''); // Email or Mobile
    const [verifyError, setVerifyError] = useState('');
    const [verifyingAccess, setVerifyingAccess] = useState(false);

    // Initial Load: Validate Token
    useEffect(() => {
        if (!token) {
            setLoading(false);
            setVerifying(false);
            return;
        }

        const init = async () => {
            try {
                // 1. Validate Token
                const validateRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/validate-token?token=${token}`);
                if (!validateRes.ok) throw new Error('Invalid Session');
                const session = await validateRes.json();
                setSessionData(session);

                if (session.status === 'COMPLETED') {
                    setCompleted(true);
                    setLoading(false);
                    return;
                }

                // 2. Check Verification Status
                if (session.is_verified) {
                    setIsVerified(true);
                    await fetchQuestions(session.session_id);
                } else {
                    setIsVerified(false);
                    setLoading(false); // Stop loading to show verify form
                }

            } catch (err) {
                console.error(err);
                alert('Invalid or expired link.');
                setLoading(false);
            } finally {
                setVerifying(false);
            }
        };

        const fetchQuestions = async (sessionId: number) => {
            try {
                const questionsRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/questions?session_id=${sessionId}`);
                const questionsData = await questionsRes.json();
                setQuestions(questionsData);
                setLoading(false);
            } catch (e) {
                console.error("Failed to load questions", e);
            }
        };

        init();
    }, [token]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError('');

        if (!identifier.trim()) {
            setVerifyError("Please enter your Mobile Number or Email.");
            return;
        }
        if (!accessCode.trim()) {
            setVerifyError("Please enter your Access Code.");
            return;
        }

        setVerifyingAccess(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/verify-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    access_code: accessCode,
                    identifier: identifier.trim()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Verification failed');
            }

            // Success
            setIsVerified(true);
            setLoading(true); // Show loading while fetching questions

            // Fetch questions
            const questionsRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/questions?session_id=${sessionData.session_id}`);
            const questionsData = await questionsRes.json();
            setQuestions(questionsData);
            setLoading(false);

        } catch (err: any) {
            setVerifyError(err.message);
        } finally {
            setVerifyingAccess(false);
        }
    };

    const handleOptionSelect = async (questionId: number, optionId: number) => {
        // Save locally
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        // Auto-save to backend
        try {
            await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionData.session_id,
                    question_id: questionId,
                    option_id: optionId
                })
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const handleNext = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Mark as completed in backend
            try {
                await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3002'}/public/counselling/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionData.session_id })
                });
            } catch (e) {
                console.error("Completion save failed", e);
            }
            setCompleted(true);
        }
    };

    if (loading || verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] text-[#4A5568]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#1ED36A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Preparing your safe space...</p>
                </div>
            </div>
        );
    }

    if (!token || !sessionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <h1 className="text-xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-gray-600">This link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    // Verification Screen
    if (!isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/Origin-BI-Logo-01.png"
                            alt="Origin BI"
                            className="h-12 w-auto" // Adjusted height for logo
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-[#2D3748] text-center mb-2">Security Verification</h2>
                    <p className="text-gray-500 text-center mb-8 text-sm">
                        Please verify your identity to access the confidential assessment.
                    </p>

                    <form onSubmit={handleVerify} className="space-y-5" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile Number or Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => {
                                    setIdentifier(e.target.value);
                                    if (verifyError) setVerifyError('');
                                }}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${verifyError && !identifier
                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-[#1ED36A] focus:border-[#1ED36A]'
                                    }`}
                                placeholder="Registered Mobile or Email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Access Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => {
                                    setAccessCode(e.target.value);
                                    if (verifyError) setVerifyError('');
                                }}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${verifyError && !accessCode
                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-[#1ED36A] focus:border-[#1ED36A]'
                                    }`}
                                placeholder="Enter the 6-digit code"
                            />
                        </div>

                        {verifyError && (
                            <div className="text-red-500 text-sm flex items-center animate-shake mt-2">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {verifyError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={verifyingAccess}
                            className="w-full py-3 bg-[#1ED36A] text-white rounded-lg font-semibold hover:bg-[#16b058] transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {verifyingAccess ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : "Verify & Start"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg text-center">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/Origin-BI-Logo-01.png"
                            alt="Origin BI"
                            className="h-12 w-auto"
                        />
                    </div>
                    <div className="w-20 h-20 bg-green-100 text-[#1ED36A] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                        ✓
                    </div>
                    <h2 className="text-3xl font-bold text-[#2D3748] mb-4">Thank You, {sessionData.student_name}</h2>
                    <p className="text-[#4A5568] text-lg mb-8">
                        Your responses have been recorded. Our counselors will review them and reach out if necessary.
                    </p>
                    <p className="text-sm text-gray-400">You may close this window now.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
        <div className="h-screen bg-[#F0F4F8] font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <img
                        src="/Origin-BI-Logo-01.png"
                        alt="Origin BI"
                        className="h-8 w-auto mr-2"
                    />
                    <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
                    <div>
                        <h1 className="text-lg font-bold text-[#2D3748]">{sessionData.counselling_type}</h1>
                        <p className="text-xs text-gray-500">Confidential Assessment</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-[#2D3748]">{sessionData.student_name}</p>
                    <p className="text-xs text-gray-500">
                        {completed ? 'Completed' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                    </p>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 flex-shrink-0">
                <div
                    className="h-full bg-[#1ED36A] transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-start px-4 py-5 overflow-y-auto">
                <div
                    key={currentQuestion.id}
                    className="w-full max-w-4xl lg:max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ zoom: '90%' }}
                >
                    <h2 className="text-2xl md:text-3xl font-medium text-[#2D3748] text-left mb-6 leading-snug sticky top-0 z-10 bg-[#F0F4F8] pb-4">
                        {currentQuestion.text_en}
                        {currentQuestion.text_ta && (
                            <span className="block text-lg text-gray-500 mt-2 font-normal">{currentQuestion.text_ta}</span>
                        )}
                    </h2>

                    <div className="space-y-4 mb-4">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                                    ${answers[currentQuestion.id] === option.id
                                        ? 'border-[#1ED36A] bg-[#1ED36A] text-white shadow-lg transform scale-[1.01]'
                                        : 'border-white bg-white hover:border-[#1ED36A] hover:bg-green-50/20 hover:shadow-md text-[#4A5568]'
                                    }`}
                            >
                                <span className="text-lg font-medium pr-4">
                                    {option.text_en}
                                    {option.text_ta && <span className={`text-base ml-2 inline-block ${answers[currentQuestion.id] === option.id ? 'text-green-50' : 'text-gray-500'}`}>({option.text_ta})</span>}
                                </span>

                                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                                    ${answers[currentQuestion.id] === option.id
                                        ? 'border-white bg-white'
                                        : 'border-gray-300 group-hover:border-[#1ED36A]'}`}>
                                    {answers[currentQuestion.id] === option.id && (
                                        <div className="w-3 h-3 rounded-full bg-[#1ED36A]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleNext}
                            disabled={!answers[currentQuestion.id]}
                            className={`px-10 py-3 rounded-full text-lg font-semibold transition-all duration-300 shadow-md
                                ${!answers[currentQuestion.id]
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#1ED36A] text-white hover:bg-[#16b058] hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                        >
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 text-center text-xs text-gray-400 flex-shrink-0">
                <p>Your responses are private and secure.</p>
            </footer>
        </div>
    );
}
