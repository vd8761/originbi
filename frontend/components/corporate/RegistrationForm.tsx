'use client';

import React, { useState, FormEvent, FocusEvent } from 'react';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

const RegistrationForm: React.FC = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        password: '',
        countryCode: '+91',
        mobile: '',
        sector: '',
        businessLocations: '',
        jobTitle: '',
        employeeCode: '',
        linkedinUrl: '',
        gender: 'MALE',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputs = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
        { name: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Acme Corp' },
        { name: 'email', label: 'Work Email', type: 'email', required: true, placeholder: 'name@company.com' },
        { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Create a password' },
        { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '9876543210' }, // Country code separate or combined? I'll keep separate in state but maybe UI combined? Simplify to one field for now or 2.
        { name: 'sector', label: 'Sector', type: 'text', required: true, placeholder: 'IT / Manufacturing / etc.' },
        { name: 'businessLocations', label: 'Business Locations', type: 'text', required: true, placeholder: 'Mumbai, Bangalore' },
        { name: 'jobTitle', label: 'Job Title', type: 'text', required: false, placeholder: 'HR Manager' },
        { name: 'employeeCode', label: 'Employee ID (Optional)', type: 'text', required: false, placeholder: 'EMP123' },
        { name: 'linkedinUrl', label: 'LinkedIn URL (Optional)', type: 'url', required: false, placeholder: 'https://linkedin.com/in/...' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
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
            setError(err.message || 'An error occurred during registration.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <Link
                    href="/corporate/login"
                    className="inline-flex items-center justify-center px-8 py-3 bg-brand-green text-white rounded-full font-semibold hover:bg-brand-green/90 transition-colors"
                >
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-in" noValidate>
            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {/* Render Fields */}
            {inputs.map((field) => (
                <div key={field.name}>
                    <label className="block font-sans text-[clamp(13px,0.85vw,16px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={field.name === 'password' ? (passwordVisible ? 'text' : 'password') : field.type}
                            name={field.name}
                            value={(formData as any)[field.name]}
                            onChange={handleChange}
                            required={field.required}
                            placeholder={field.placeholder}
                            className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary px-5 py-3 rounded-full block w-full focus:ring-brand-green focus:border-brand-green outline-none transition-all placeholder:text-gray-400"
                        />
                        {field.name === 'password' && (
                            <button
                                type="button"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-brand-green"
                            >
                                {passwordVisible ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Gender Select */}
            <div>
                <label className="block font-sans text-[clamp(13px,0.85vw,16px)] font-semibold text-brand-text-light-secondary dark:text-white mb-2 leading-none">
                    Gender <span className="text-red-500">*</span>
                </label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="bg-brand-light-secondary dark:bg-brand-dark-tertiary border border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-brand-text-primary px-5 py-3 rounded-full block w-full focus:ring-brand-green focus:border-brand-green outline-none transition-all appearance-none cursor-pointer"
                >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full text-white bg-brand-green hover:bg-brand-green/90 font-semibold rounded-full py-3 text-[clamp(16px,1vw,20px)] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
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
