
import React, { useState, useEffect } from 'react';
import {BulkUploadIcon,ChevronDownIcon } from '@/components/icons';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { BulkUploadModal } from '@/components/ui/BulkUploadModal';
import { Program, Department, CountryCode } from '@/lib/types';
import { registrationService, CreateRegistrationDto } from '@/lib/services';

interface AddRegistrationFormProps {
    onCancel: () => void;
    onRegister: () => void;
}

const countryCodes: CountryCode[] = [
    { code: 'IN', dial_code: '+91', flag: '🇮🇳' },
    { code: 'US', dial_code: '+1', flag: '🇺🇸' },
    { code: 'UK', dial_code: '+44', flag: '🇬🇧' },
    { code: 'SG', dial_code: '+65', flag: '🇸🇬' },
    { code: 'AE', dial_code: '+971', flag: '🇦🇪' },
];

const AddRegistrationForm: React.FC<AddRegistrationFormProps> = ({ onCancel, onRegister }) => {
    // Basic Form State
    const [formData, setFormData] = useState<CreateRegistrationDto>({
        name: '',
        gender: '',
        email: '',
        countryCode: '+91',
        mobile: '',
        programType: '',
        groupName: '',
        sendEmail: false, // Default No
        examStart: '',
        examEnd: '',
        schoolLevel: '',
        schoolStream: '',
        currentYear: '',
        departmentId: ''
    });

    // Dropdown Data State
    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Initial Fetch for Programs & Departments
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [progRes, deptRes] = await Promise.all([
                    registrationService.getPrograms(),
                    registrationService.getDepartments()
                ]);
                setPrograms(progRes);
                setDepartments(deptRes);
            } catch (err) {
                console.error("Failed to load form data", err);
            }
        };
        fetchInitialData();
    }, []);

    const handleInputChange = (field: keyof CreateRegistrationDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.name.trim()) return "Full Name is required";
        if (!formData.gender) return "Gender is required";
        if (!formData.email.trim()) return "Email is required";
        if (!formData.mobile.trim()) return "Mobile number is required";
        if (!formData.programType) return "Program type is required";
        if (!formData.examStart || !formData.examEnd) return "Exam schedule is required";

        // Dynamic Validations
        const selectedProgram = programs.find(p => p.id === formData.programType);
        if (selectedProgram?.code === 'SCHOOL') {
            if (!formData.schoolLevel) return "School Level is required";
            if (formData.schoolLevel === 'HSC') {
                if (!formData.schoolStream) return "Stream is required";
                if (!formData.currentYear) return "Current Year is required";
            }
        }
        if (selectedProgram?.code === 'COLLEGE') {
            if (!formData.departmentId) return "Department is required";
            if (!formData.currentYear) return "Current Year is required";
        }

        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await registrationService.createUser(formData);
            onRegister();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create registration. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to check selected program code
    const currentProgramCode = programs.find(p => p.id === formData.programType)?.code;

    return (
        <div className="w-full font-sans animate-fade-in pb-10">
            <BulkUploadModal 
                isOpen={isBulkModalOpen} 
                onClose={() => setIsBulkModalOpen(false)} 
                onSuccess={() => {
                    onRegister(); // Refresh list on bulk success
                }}
            />

            <div className="flex justify-between items-center mb-6">
                 <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                        <span>Dashboard</span>
                        <span className="mx-2">{'>'}</span>
                        <span>My Employees</span>
                        <span className="mx-2">{'>'}</span>
                        <span className="text-brand-green font-medium">Add Registrations</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Add Registrations</h1>
                </div>
                {/* Bulk Registration Trigger */}
                <button 
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#24272B] border border-white/5 rounded-lg text-sm font-medium text-white hover:bg-[#2D3136] transition-colors"
                >
                    <span>Bulk Registration</span>
                    <BulkUploadIcon className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="bg-[#1A1D21] border border-[#24272B] rounded-2xl p-6 sm:p-8">
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Basic Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-200 mb-6 border-b border-white/5 pb-2">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Full Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Example Name" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Gender Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Gender <span className="text-red-500">*</span></label>
                            <div className="flex bg-[#24272B] rounded-lg p-1">
                                {['Male', 'Female', 'Other'].map(gender => (
                                    <button 
                                        key={gender}
                                        type="button"
                                        onClick={() => handleInputChange('gender', gender)}
                                        className={`flex-1 py-2 text-sm rounded transition-colors ${
                                            formData.gender === gender 
                                            ? 'bg-brand-green text-white font-semibold shadow-sm' 
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="example@gmail.com" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Mobile with Country Code */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Mobile Number <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="relative w-28 shrink-0">
                                    <select 
                                        value={formData.countryCode}
                                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                                        className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg pl-3 pr-8 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.dial_code}>{c.flag} {c.dial_code}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-3 h-3 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.mobile}
                                    onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))} // Digits only
                                    placeholder="9876543210" 
                                    className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Enrollment Details Section */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-200 mb-6 border-b border-white/5 pb-2">Enrollment Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Program Type Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Program Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select 
                                    value={formData.programType}
                                    onChange={(e) => handleInputChange('programType', e.target.value)}
                                    className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="" disabled>Select Program</option>
                                    {programs.map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <ChevronDownIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* --- Conditional Fields for School Students --- */}
                        {currentProgramCode === 'SCHOOL' && (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">School Level <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        value={formData.schoolLevel}
                                        onChange={(e) => handleInputChange('schoolLevel', e.target.value)}
                                        className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="" disabled>Select Level</option>
                                        <option value="SSLC">SSLC</option>
                                        <option value="HSC">HSC</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentProgramCode === 'SCHOOL' && formData.schoolLevel === 'HSC' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Stream <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={formData.schoolStream}
                                            onChange={(e) => handleInputChange('schoolStream', e.target.value)}
                                            className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="" disabled>Select Stream</option>
                                            <option value="Science">Science</option>
                                            <option value="Commerce">Commerce</option>
                                            <option value="Humanities">Humanities</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Current Year (Max 2 chars) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.currentYear}
                                        maxLength={2}
                                        onChange={(e) => handleInputChange('currentYear', e.target.value)}
                                        placeholder="e.g. 12" 
                                        className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                                    />
                                </div>
                            </>
                        )}

                        {/* --- Conditional Fields for College Students --- */}
                        {currentProgramCode === 'COLLEGE' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Department <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={formData.departmentId}
                                            onChange={(e) => handleInputChange('departmentId', e.target.value)}
                                            className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="" disabled>Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Current Year <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.currentYear}
                                        onChange={(e) => handleInputChange('currentYear', e.target.value)}
                                        placeholder="e.g. 3rd Year" 
                                        className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                                    />
                                </div>
                            </>
                        )}

                        {/* Standard Fields */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Group Name</label>
                            <input 
                                type="text" 
                                value={formData.groupName}
                                onChange={(e) => handleInputChange('groupName', e.target.value)}
                                placeholder="Enter Group Name" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Send Email Notification</label>
                            <div className="flex bg-[#24272B] rounded-lg p-1 w-32">
                                <button 
                                    type="button"
                                    onClick={() => handleInputChange('sendEmail', true)}
                                    className={`flex-1 py-2 text-sm rounded transition-colors ${formData.sendEmail ? 'bg-brand-green text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Yes
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleInputChange('sendEmail', false)}
                                    className={`flex-1 py-2 text-sm rounded transition-colors ${!formData.sendEmail ? 'bg-brand-green text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs text-gray-400">Schedule Exam <span className="text-red-500">*</span></label>
                             <CustomDatePicker 
                                onChange={(start, end) => {
                                    handleInputChange('examStart', start);
                                    handleInputChange('examEnd', end);
                                }} 
                             />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
                <button 
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-8 py-3 rounded-full border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-3 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-all disabled:opacity-50 flex items-center"
                >
                    {isLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                            Processing...
                        </>
                    ) : 'Register'}
                </button>
            </div>
        </div>
    );
};

export default AddRegistrationForm;
