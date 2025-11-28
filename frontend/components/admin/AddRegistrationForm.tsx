
import React from 'react';
import {BulkUploadIcon,ChevronDownIcon } from '@/components/icons';
import CustomDatePicker from '@/components/ui/CustomDatePicker';

interface AddRegistrationFormProps {
    onCancel: () => void;
    onRegister: () => void;
}

const AddRegistrationForm: React.FC<AddRegistrationFormProps> = ({ onCancel, onRegister }) => {
    return (
        <div className="w-full font-sans animate-fade-in">
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
                <button className="flex items-center gap-2 px-4 py-2 bg-[#24272B] border border-white/5 rounded-lg text-sm font-medium text-white hover:bg-[#2D3136] transition-colors">
                    <span>Bulk Registration</span>
                    <BulkUploadIcon className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="bg-[#1A1D21] border border-[#24272B] rounded-2xl p-6 sm:p-8">
                {/* Basic Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-200 mb-6">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Full Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                placeholder="Example Name" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Gender <span className="text-red-500">*</span></label>
                            <div className="flex bg-[#24272B] rounded-lg p-1">
                                <button className="flex-1 py-2 text-sm text-gray-400 hover:text-white rounded transition-colors">Male</button>
                                <button className="flex-1 py-2 text-sm bg-brand-green text-white font-semibold rounded shadow-sm">Female</button>
                                <button className="flex-1 py-2 text-sm text-gray-400 hover:text-white rounded transition-colors">Other</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                placeholder="example@gmail.com" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs text-gray-400">Mobile Number (without +91) <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                placeholder="1234567890" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                 {/* Enrollment Details Section */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-200 mb-6">Enrollment Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Program Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select className="w-full appearance-none bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white focus:border-brand-green focus:outline-none transition-colors cursor-pointer">
                                    <option>Student</option>
                                    <option>Employee</option>
                                    <option>CXO</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <ChevronDownIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Group Name</label>
                            <input 
                                type="text" 
                                placeholder="Enter the Group Name" 
                                className="w-full bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Send Email Notification <span className="text-red-500">*</span></label>
                            <div className="flex bg-[#24272B] rounded-lg p-1 w-32">
                                <button className="flex-1 py-2 text-sm text-gray-400 hover:text-white rounded transition-colors">Yes</button>
                                <button className="flex-1 py-2 text-sm bg-brand-green text-white font-semibold rounded shadow-sm">No</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-xs text-gray-400">Schedule Exam <span className="text-red-500">*</span></label>
                             <CustomDatePicker onChange={(start, end) => console.log(start, end)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
                <button 
                    onClick={onCancel}
                    className="px-8 py-3 rounded-full border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onRegister}
                    className="px-8 py-3 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-all"
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default AddRegistrationForm;
