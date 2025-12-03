import React, { useState, useEffect } from 'react';
import { BulkUploadIcon } from '@/components/icons';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import CustomSelect from '@/components/ui/CustomSelect';
import MobileInput from '@/components/ui/MobileInput';
import { registrationService, CreateRegistrationDto } from '@/lib/services';
import { Program, Department } from '@/lib/types';
import { BulkUploadModal } from '@/components/ui/BulkUploadModal';
interface AddRegistrationFormProps {
    onCancel: () => void;
    onRegister: () => void;
}

const AddRegistrationForm: React.FC<AddRegistrationFormProps> = ({ onCancel, onRegister }) => {
    // --- State ---
    const [formData, setFormData] = useState<CreateRegistrationDto>({
        name: '',
        gender: 'Female', 
        email: '',
        countryCode: '+91',
        mobile: '',
        programType: '', 
        groupName: '',
        sendEmail: false, 
        examStart: '',
        examEnd: '',
        schoolLevel: '',
        schoolStream: '',
        currentYear: '',
        departmentId: ''
    });

    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    
    // Track active field for Z-Index management
    const [activeField, setActiveField] = useState<string | null>(null);

    // Static Options
    const schoolLevels = [
        { value: 'SSLC', label: 'SSLC' },
        { value: 'HSC', label: 'HSC' }
    ];

    const schoolStreams = [
        { value: 'Science', label: 'Science' },
        { value: 'Commerce', label: 'Commerce' },
        { value: 'Humanities', label: 'Humanities' }
    ];

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

    // --- Handlers ---

    const handleInputChange = (field: keyof CreateRegistrationDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Required";
        if (!formData.email.trim()) errors.email = "Required";
        if (!formData.mobile.trim()) errors.mobile = "Required";
        if (!formData.programType) errors.programType = "Required";
        if (!formData.examStart || !formData.examEnd) errors.examStart = "Required";
        
        const selectedProgram = programs.find(p => p.id === formData.programType);
        if (selectedProgram?.code === 'SCHOOL') {
             if (!formData.schoolLevel) errors.schoolLevel = "Required";
             if (formData.schoolLevel === 'HSC') {
                 if (!formData.schoolStream) errors.schoolStream = "Required";
                 if (!formData.currentYear) errors.currentYear = "Required";
             }
        }
        if (selectedProgram?.code === 'COLLEGE') {
             if (!formData.departmentId) errors.departmentId = "Required";
             if (!formData.currentYear) errors.currentYear = "Required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setError("Please fill in all required fields.");
            return;
        }
        setIsLoading(true);
        try {
            await registrationService.createUser(formData);
            onRegister();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const currentProgramCode = programs.find(p => p.id === formData.programType)?.code;
    const programOptions = programs.map(p => ({ value: p.id, label: p.name }));
    const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

    return (
        <div className="w-full font-sans animate-fade-in pb-12">
            {/* Bulk Upload Modal */}
            <BulkUploadModal 
                isOpen={isBulkModalOpen} 
                onClose={() => setIsBulkModalOpen(false)} 
                onSuccess={onRegister}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
                 <div>
                    <div className="flex items-center text-xs text-brand-text-light-secondary dark:text-gray-500 mb-1.5 font-medium flex-wrap">
                        <span>Dashboard</span>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">{'>'}</span>
                        <button onClick={onCancel} className="hover:text-brand-text-light-primary dark:hover:text-white hover:underline">My Employees</button>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">{'>'}</span>
                        <span className="text-brand-green font-semibold">Add Registrations</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-light-primary dark:text-white tracking-tight">Add Registrations</h1>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-[#24272B] rounded-3xl p-5 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-300 relative">
                {error && <div className="mb-6 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">{error}</div>}

                {/* --- Section 1: Basic Information --- */}
                <div className="mb-8"> 
                    <h2 className="text-base font-bold text-brand-text-light-primary dark:text-white mb-6">Basic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                        
                        {/* Full Name */}
                        <div className="space-y-2 z-0">
                            <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Full Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Example Name" 
                                className={`w-full h-[50px] bg-gray-50 dark:bg-[#24272B] border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-brand-green focus:outline-none transition-all ${formErrors.name ? 'border-red-500/50' : ''}`}
                            />
                        </div>

                        {/* Gender Toggle */}
                        <div className="space-y-2 z-0">
                            <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Gender <span className="text-red-500">*</span></label>
                            <div className="flex bg-gray-200 dark:bg-[#303438] rounded-full p-1 h-[50px]">
                                {['Male', 'Female', 'Other'].map(gender => (
                                    <button 
                                        key={gender}
                                        type="button"
                                        onClick={() => handleInputChange('gender', gender)}
                                        className={`flex-1 text-sm font-bold rounded-full transition-all duration-300 cursor-pointer ${
                                            formData.gender === gender 
                                            ? 'bg-brand-green text-white shadow-lg shadow-green-900/20' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2 z-0">
                            <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="example@gmail.com" 
                                className={`w-full h-[50px] bg-gray-50 dark:bg-[#24272B] border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-brand-green focus:outline-none transition-all ${formErrors.email ? 'border-red-500/50' : ''}`}
                            />
                        </div>

                        {/* Mobile Input - High Z-Index on Interaction */}
                        <div 
                            className={`space-y-2 relative ${activeField === 'mobile' ? 'z-50' : 'z-0'}`}
                            onMouseEnter={() => setActiveField('mobile')}
                            onMouseLeave={() => setActiveField(null)}
                        >
                             <MobileInput 
                                countryCode={formData.countryCode}
                                phoneNumber={formData.mobile}
                                onCountryChange={(code) => handleInputChange('countryCode', code)}
                                onPhoneChange={(num) => handleInputChange('mobile', num)}
                                label="Mobile Number (without +91)"
                                required
                                error={formErrors.mobile}
                            />
                        </div>
                    </div>
                </div>

                 {/* --- Section 2: Enrollment Details --- */}
                <div className="mb-4">
                    <h2 className="text-base font-bold text-brand-text-light-primary dark:text-white mb-6">Enrollment Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                        
                        {/* 1. Program Type */}
                        <div 
                            className={`relative ${activeField === 'program' ? 'z-50' : 'z-auto'}`}
                            onMouseEnter={() => setActiveField('program')}
                            onMouseLeave={() => setActiveField(null)}
                        >
                            <CustomSelect 
                                label="Program Type"
                                required
                                options={programOptions}
                                value={formData.programType}
                                onChange={(val) => {
                                    handleInputChange('programType', val);
                                    handleInputChange('schoolLevel', '');
                                    handleInputChange('schoolStream', '');
                                    handleInputChange('currentYear', '');
                                    handleInputChange('departmentId', '');
                                }}
                                placeholder="Choose Program Type"
                            />
                            {formErrors.programType && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.programType}</p>}
                        </div>

                        {/* --- Conditional Fields --- */}
                        
                        {currentProgramCode === 'SCHOOL' && (
                            <div 
                                className={`relative animate-fade-in ${activeField === 'schoolLevel' ? 'z-50' : 'z-auto'}`}
                                onMouseEnter={() => setActiveField('schoolLevel')}
                                onMouseLeave={() => setActiveField(null)}
                            >
                                <CustomSelect 
                                    label="School Level"
                                    required
                                    options={schoolLevels}
                                    value={formData.schoolLevel || ''}
                                    onChange={(val) => handleInputChange('schoolLevel', val)}
                                    placeholder="Select Level"
                                />
                                {formErrors.schoolLevel && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.schoolLevel}</p>}
                            </div>
                        )}

                        {currentProgramCode === 'SCHOOL' && formData.schoolLevel === 'HSC' && (
                            <div 
                                className={`relative animate-fade-in ${activeField === 'stream' ? 'z-50' : 'z-auto'}`}
                                onMouseEnter={() => setActiveField('stream')}
                                onMouseLeave={() => setActiveField(null)}
                            >
                                <CustomSelect 
                                    label="Stream"
                                    required
                                    options={schoolStreams}
                                    value={formData.schoolStream || ''}
                                    onChange={(val) => handleInputChange('schoolStream', val)}
                                    placeholder="Select Stream"
                                />
                                {formErrors.schoolStream && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.schoolStream}</p>}
                            </div>
                        )}

                        {currentProgramCode === 'COLLEGE' && (
                            <div 
                                className={`relative animate-fade-in ${activeField === 'dept' ? 'z-50' : 'z-auto'}`}
                                onMouseEnter={() => setActiveField('dept')}
                                onMouseLeave={() => setActiveField(null)}
                            >
                                <CustomSelect 
                                    label="Department"
                                    required
                                    options={departmentOptions}
                                    value={formData.departmentId || ''}
                                    onChange={(val) => handleInputChange('departmentId', val)}
                                    placeholder="Select Department"
                                />
                                {formErrors.departmentId && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.departmentId}</p>}
                            </div>
                        )}

                        {/* (SCHOOL + HSC) OR COLLEGE -> Current Year */}
                        {((currentProgramCode === 'SCHOOL' && formData.schoolLevel === 'HSC') || currentProgramCode === 'COLLEGE') && (
                            <div className="space-y-2 animate-fade-in relative z-0">
                                <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Current Year <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    maxLength={currentProgramCode === 'SCHOOL' ? 2 : 4}
                                    value={formData.currentYear || ''}
                                    onChange={(e) => handleInputChange('currentYear', e.target.value.replace(/\D/g,''))}
                                    placeholder={currentProgramCode === 'SCHOOL' ? "12" : "2025"} 
                                    className="w-full h-[50px] bg-gray-50 dark:bg-[#24272B] border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-brand-green focus:outline-none transition-all"
                                />
                                {formErrors.currentYear && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.currentYear}</p>}
                            </div>
                        )}

                        {/* Group Name */}
                        <div className="space-y-2 relative z-0">
                            <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Group Name</label>
                            <input 
                                type="text" 
                                value={formData.groupName}
                                onChange={(e) => handleInputChange('groupName', e.target.value)}
                                placeholder="Enter the Group Name" 
                                className="w-full h-[50px] bg-gray-50 dark:bg-[#24272B] border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:border-brand-green focus:outline-none transition-all"
                            />
                        </div>

                        {/* Send Email Notification Toggle */}
                        <div className="space-y-2 relative z-0">
                            <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Send Email Notification <span className="text-red-500">*</span></label>
                            <div className="flex bg-gray-200 dark:bg-[#303438] rounded-full p-1 w-full h-[50px]">
                                <button 
                                    type="button"
                                    onClick={() => handleInputChange('sendEmail', true)}
                                    className={`flex-1 text-sm font-bold rounded-full transition-all duration-300 cursor-pointer ${
                                        formData.sendEmail 
                                        ? 'bg-brand-green text-white shadow-lg shadow-green-900/20' 
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleInputChange('sendEmail', false)}
                                    className={`flex-1 text-sm font-bold rounded-full transition-all duration-300 cursor-pointer ${
                                        !formData.sendEmail 
                                        ? 'bg-brand-green text-white shadow-lg shadow-green-900/20' 
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {/* Schedule Exam */}
                        <div 
                            className={`space-y-2 relative lg:col-span-2 ${activeField === 'exam' ? 'z-50' : 'z-auto'}`}
                            onMouseEnter={() => setActiveField('exam')}
                            onMouseLeave={() => setActiveField(null)}
                        >
                             <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">Schedule Exam <span className="text-red-500">*</span></label>
                             <CustomDatePicker 
                                value={formData.examStart ? { start: formData.examStart, end: formData.examEnd || '' } : undefined}
                                onChange={(start, end) => {
                                    handleInputChange('examStart', start);
                                    handleInputChange('examEnd', end);
                                }} 
                             />
                             {formErrors.examStart && <p className="text-xs text-red-500 ml-1 mt-1">{formErrors.examStart}</p>}
                        </div>

                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
                <button 
                    onClick={onCancel}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-10 py-3.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-12 py-3.5 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 text-sm flex justify-center items-center"
                >
                    {isLoading ? 'Processing...' : 'Register'}
                </button>
            </div>
        </div>
    );
};

export default AddRegistrationForm;