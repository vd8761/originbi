'use client';

import React, { useState, useRef, useEffect, useMemo, FormEvent, FocusEvent } from 'react';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon, ChevronDownIcon } from '@/components/icons';
import ReactCountryFlag from "react-country-flag";
import { SECTOR_OPTIONS, SectorCode } from "@/lib/sectors";
import { COUNTRY_CODES } from "@/lib/countryCodes";

// Reusing Error Icon from LoginForm style
const ErrorMessage = ({ message }: { message: string }) => {
    if (!message) return null;
    return (
        <div className="flex items-center gap-2 px-1 animate-fade-in text-red-500 dark:text-red-400 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

const RegistrationForm: React.FC = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        password: '',
        countryCode: '+91',
        mobile: '',
        sector: '' as SectorCode | '',
        businessLocations: '',
        jobTitle: '',
        employeeCode: '',
        linkedinUrl: '',
        gender: 'MALE',
    });

    // Validation State
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [passwordCriteria, setPasswordCriteria] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasSpecial: false
    });

    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dropdown states
    const [isSectorOpen, setIsSectorOpen] = useState(false);
    const [sectorSearch, setSectorSearch] = useState("");
    const sectorDropdownRef = useRef<HTMLDivElement>(null);

    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const countrySearchRef = useRef<HTMLInputElement>(null);

    // Helpers
    const getSelectedCountry = (dialCode: string) => {
        return COUNTRY_CODES.find(c => c.dial_code === dialCode) || COUNTRY_CODES.find(c => c.code === 'IN')!;
    };

    // --- Validation Logic ---
    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'name':
            case 'companyName':
            case 'businessLocations':
                if (!value.trim()) error = 'This field is required.';
                break;
            case 'email':
                if (!value.trim()) error = 'Email ID is required.';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address.';
                break;
            case 'mobile':
                if (!value.trim()) error = 'Mobile Number is required.';
                else {
                    const country = getSelectedCountry(formData.countryCode);
                    const cleanNumber = value.replace(/\D/g, '');
                    // Validate against strict length from CountryCode definition
                    if (country.maxLength && cleanNumber.length !== country.maxLength) {
                        error = `Mobile number must be ${country.maxLength} digits for ${country.name}.`;
                    }
                }
                break;
            case 'sector':
                if (!value) error = 'Please select a sector.';
                break;
            case 'password':
                if (!value) error = 'Password is required.';
                else {
                    const isComplete = validatePasswordCriteria(value);
                    if (!isComplete) error = 'Password does not meet requirements.';
                }
                break;
        }
        return error;
    };

    const validatePasswordCriteria = (pwd: string) => {
        const criteria = {
            minLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
        };
        setPasswordCriteria(criteria);
        return Object.values(criteria).every(Boolean);
    };

    // --- Handlers ---

    // Close dropdowns outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) setIsSectorOpen(false);
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) setIsCountryOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus country search
    useEffect(() => {
        if (isCountryOpen && countrySearchRef.current) countrySearchRef.current.focus();
        else setCountrySearch("");
    }, [isCountryOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') validatePasswordCriteria(value);

        // Clear error on change if already touched
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, mobile: val }));

        // Immediate validation feedback for mobile length
        if (touched.mobile) {
            setErrors(prev => ({ ...prev, mobile: validateField('mobile', val) }));
        }
    };

    const handleSectorChange = (sectorValue: SectorCode) => {
        setFormData(prev => ({ ...prev, sector: sectorValue }));
        setTouched(prev => ({ ...prev, sector: true }));
        setErrors(prev => ({ ...prev, sector: '' })); // clear error
        setIsSectorOpen(false);
        setSectorSearch("");
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Validate all fields
        const newTouched: Record<string, boolean> = {};
        const newErrors: Record<string, string> = {};
        let isValid = true;

        ['name', 'companyName', 'email', 'mobile', 'sector', 'businessLocations', 'password'].forEach(field => {
            newTouched[field] = true;
            const error = validateField(field, (formData as any)[field]);
            if (error) isValid = false;
            newErrors[field] = error;
        });

        setTouched(prev => ({ ...prev, ...newTouched }));
        setErrors(prev => ({ ...prev, ...newErrors }));

        if (!isValid) {
            setFormError("Please fix the errors below.");
            // Focus the first error field
            setTimeout(() => {
                const firstError = document.querySelector('.border-red-500');
                if (firstError) (firstError as HTMLElement).focus();
            }, 100);
            return;
        }

        setIsSubmitting(true);

        try {
            const corporateServiceUrl = process.env.NEXT_PUBLIC_CORPORATE_SERVICE_URL || 'http://localhost:4003';
            const res = await fetch(`${corporateServiceUrl}/dashboard/register-corporate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Registration failed.');
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Registration error:', err);
            setFormError(err.message || 'An error occurred during registration.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helpers ---
    const filteredSectors = SECTOR_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(sectorSearch.toLowerCase()));

    const filteredCountries = useMemo(() => {
        const lowerSearch = countrySearch.toLowerCase();
        return COUNTRY_CODES.filter(country =>
            country.name.toLowerCase().includes(lowerSearch) ||
            country.dial_code.includes(lowerSearch) ||
            country.code.toLowerCase().includes(lowerSearch)
        );
    }, [countrySearch]);

    const getSectorLabel = (value: SectorCode | '') => {
        if (!value) return "Select Sector";
        const item = SECTOR_OPTIONS.find((s) => s.value === value);
        return item?.label ?? value;
    };

    const selectedCountry = useMemo(() => {
        return getSelectedCountry(formData.countryCode);
    }, [formData.countryCode]);


    // --- Styles ---
    const getFieldClass = (fieldName: string) => {
        const hasError = touched[fieldName] && !!errors[fieldName];
        const base = "bg-brand-light-secondary dark:bg-brand-dark-tertiary border text-brand-text-light-primary dark:text-brand-text-primary rounded-full block w-full focus:outline-none transition-all placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary font-sans text-[clamp(14px,0.83vw,16px)] font-normal leading-normal tracking-[0px]";
        const border = hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-brand-light-tertiary dark:border-brand-dark-tertiary focus:border-brand-green focus:ring-brand-green";
        return `${base} ${border}`;
    };

    const baseLabelClasses = "block font-sans text-[clamp(13px,0.85vw,16px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none";

    const commonInputPadding = "px-5 py-3"; // Standard padding used across fields

    if (success) {
        return (
            <div className="flex flex-col gap-6 animate-fade-in text-center justify-center h-full">
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-brand-text-light-primary dark:text-white mb-2">Registration Successful!</h3>
                    <p className="text-brand-text-light-secondary dark:text-brand-text-secondary">
                        Your account has been created successfully.
                        <br />
                        Please wait for admin approval before you can log in.
                    </p>
                </div>
                <Link href="/corporate/login" className="inline-flex items-center justify-center px-8 py-3 bg-brand-green text-white rounded-full font-semibold hover:bg-brand-green/90 transition-colors">
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-in pb-8" noValidate>
            {formError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg mb-2">
                    {formError}
                </div>
            )}

            {/* --- NAME (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Full Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="John Doe"
                    className={`${getFieldClass('name')} ${commonInputPadding}`}
                />
                <ErrorMessage message={touched.name ? errors.name || '' : ''} />
            </div>

            {/* --- GENDER (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Gender <span className="text-red-500">*</span></label>
                <div className="flex w-full bg-brand-light-secondary dark:bg-brand-dark-tertiary rounded-full p-1 border border-brand-light-tertiary dark:border-brand-dark-tertiary h-[48px] sm:h-[50px]">
                    {["MALE", "FEMALE", "OTHER"].map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                            className={`flex-1 text-sm rounded-full transition-all duration-300 font-medium ${formData.gender === g ? "bg-brand-green text-white shadow-md" : "text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-text-light-primary dark:hover:text-white"}`}
                        >
                            {g.charAt(0) + g.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- EMAIL (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Work Email <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="name@company.com"
                    className={`${getFieldClass('email')} ${commonInputPadding}`}
                />
                <ErrorMessage message={touched.email ? errors.email || '' : ''} />
            </div>

            {/* --- MOBILE (Full Width) --- */}
            <div className="relative z-20" ref={countryDropdownRef}>
                <label className={baseLabelClasses}>Mobile Number <span className="text-red-500">*</span></label>

                {/* Unified Mobile Input Pill */}
                <div className={`${getFieldClass('mobile')} relative flex items-center p-0 h-[48px] sm:h-[50px]`}>

                    {/* Country Selector */}
                    <div className="relative h-full flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsCountryOpen(!isCountryOpen)}
                            className="h-full flex items-center gap-2 pl-5 pr-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-l-full"
                        >
                            <ReactCountryFlag
                                countryCode={selectedCountry.code}
                                svg
                                style={{ width: "20px", height: "15px", borderRadius: "2px", objectFit: "cover" }}
                            />
                            <span className="text-[clamp(14px,0.83vw,16px)] font-medium">{selectedCountry.dial_code}</span>
                            <ChevronDownIcon className={`w-3 h-3 text-gray-500 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {isCountryOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-60">
                                <div className="p-2 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#24272B] z-10">
                                    <input
                                        ref={countrySearchRef}
                                        type="text"
                                        placeholder="Search country..."
                                        value={countrySearch}
                                        onChange={(e) => setCountrySearch(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#1A1D21] text-black dark:text-white text-xs rounded-lg px-3 py-2 outline-none"
                                    />
                                </div>
                                <div className="overflow-y-auto custom-scrollbar flex-1">
                                    {filteredCountries.map((country) => (
                                        <button
                                            key={`${country.code}-${country.dial_code}`}
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, countryCode: country.dial_code }));
                                                setIsCountryOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${formData.countryCode === country.dial_code ? "bg-brand-green/10 text-brand-green" : "text-black dark:text-gray-200"}`}
                                        >
                                            <ReactCountryFlag countryCode={country.code} svg style={{ width: "20px", height: "14px", borderRadius: "2px", objectFit: "cover" }} />
                                            <span className="flex-1 truncate">{country.name}</span>
                                            <span className="text-xs opacity-70">{country.dial_code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visible Vertical Divider Component */}
                    <div className="w-[1px] h-[60%] bg-brand-light-tertiary dark:bg-brand-dark-tertiary/50 mx-1"></div>

                    {/* Input */}
                    <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleMobileChange}
                        onBlur={handleBlur}
                        placeholder="9876543210"
                        className="bg-transparent border-none focus:ring-0 flex-1 h-full pl-2 pr-5 rounded-r-full text-brand-text-light-primary dark:text-brand-text-primary placeholder:text-brand-text-light-secondary dark:placeholder:text-brand-text-secondary font-sans text-[clamp(14px,0.83vw,16px)] outline-none"
                    />
                </div>
                <ErrorMessage message={touched.mobile ? errors.mobile || '' : ''} />
            </div>

            {/* --- COMPANY (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Company Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="Acme Corp"
                    className={`${getFieldClass('companyName')} ${commonInputPadding}`}
                />
                <ErrorMessage message={touched.companyName ? errors.companyName || '' : ''} />
            </div>

            {/* --- SECTOR (Full Width) --- */}
            <div className="relative z-10" ref={sectorDropdownRef}>
                <label className={baseLabelClasses}>Sector <span className="text-red-500">*</span></label>
                <button
                    type="button"
                    onClick={() => setIsSectorOpen((prev) => !prev)}
                    className={`${getFieldClass('sector')} ${commonInputPadding} flex items-center justify-between text-left`}
                >
                    <span className="truncate">{getSectorLabel(formData.sector)}</span>
                    <ChevronDownIcon className="w-4 h-4 ml-2 opacity-50" />
                </button>
                <ErrorMessage message={touched.sector ? errors.sector || '' : ''} />

                {isSectorOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-2 max-h-60 overflow-hidden flex flex-col z-50">
                        <input
                            type="text"
                            value={sectorSearch}
                            onChange={(e) => setSectorSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full mb-2 px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-[#1A1D21] text-black dark:text-white outline-none"
                            autoFocus
                        />
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {filteredSectors.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSectorChange(opt.value)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${formData.sector === opt.value ? "bg-brand-green/10 text-brand-green font-semibold" : "text-black dark:text-white"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            {filteredSectors.length === 0 && (
                                <div className="p-2 text-center text-sm text-gray-500">No results</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- JOB & EMP CODE (2 Column) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={baseLabelClasses}>Job Title</label>
                    <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder="HR Manager"
                        className={`${getFieldClass('jobTitle')} ${commonInputPadding}`}
                    />
                </div>

                <div>
                    <label className={baseLabelClasses}>Employee ID (Optional)</label>
                    <input
                        type="text"
                        name="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleChange}
                        placeholder="EMP123"
                        className={`${getFieldClass('employeeCode')} ${commonInputPadding}`}
                    />
                </div>
            </div>

            {/* --- LINKEDIN (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>LinkedIn URL (Optional)</label>
                <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                    className={`${getFieldClass('linkedinUrl')} ${commonInputPadding}`}
                />
            </div>

            {/* --- LOCATIONS (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Business Locations <span className="text-red-500">*</span></label>
                <textarea
                    name="businessLocations"
                    value={formData.businessLocations}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="List key operating locations..."
                    className={`${getFieldClass('businessLocations')} px-5 py-4 min-h-[100px] resize-none rounded-2xl`}
                />
                <ErrorMessage message={touched.businessLocations ? errors.businessLocations || '' : ''} />
            </div>

            {/* --- PASSWORD (Full Width) --- */}
            <div>
                <label className={baseLabelClasses}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input
                        type={passwordVisible ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        placeholder="Create a password"
                        className={`${getFieldClass('password')} ${commonInputPadding} pr-12`}
                    />
                    <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute inset-y-0 right-4 flex items-center text-brand-green hover:text-brand-green/80"
                    >
                        {passwordVisible ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                    </button>
                </div>
                <ErrorMessage message={touched.password ? errors.password || '' : ''} />

                {/* Password Criteria Checklist */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`}>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${passwordCriteria.minLength ? 'border-brand-green bg-brand-green' : 'border-gray-400 dark:border-gray-500'}`}>
                            {passwordCriteria.minLength && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        Min 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`}>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${passwordCriteria.hasUpper ? 'border-brand-green bg-brand-green' : 'border-gray-400 dark:border-gray-500'}`}>
                            {passwordCriteria.hasUpper && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`}>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${passwordCriteria.hasLower ? 'border-brand-green bg-brand-green' : 'border-gray-400 dark:border-gray-500'}`}>
                            {passwordCriteria.hasLower && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-brand-green' : 'text-gray-400 dark:text-gray-500'}`}>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${passwordCriteria.hasSpecial ? 'border-brand-green bg-brand-green' : 'border-gray-400 dark:border-gray-500'}`}>
                            {passwordCriteria.hasSpecial && <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        Special character
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full text-white bg-brand-green hover:bg-brand-green/90 font-semibold rounded-full py-4 text-[clamp(16px,1vw,20px)] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isSubmitting ? (
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Register Account'}
            </button>
            <div className="text-center mt-2">
                <Link href="/corporate/login" className="text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-green transition-colors">
                    Already have an account? Login
                </Link>
            </div>
        </form>
    );
};

export default RegistrationForm;
