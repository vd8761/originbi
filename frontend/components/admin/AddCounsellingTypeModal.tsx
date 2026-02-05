'use client';
import React, { useState, useEffect } from 'react';
// import { adminCounsellingService } from '@/lib/services';

interface AddCounsellingTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    editType?: any | null; // Pass existing type for editing
}

const AddCounsellingTypeModal: React.FC<AddCounsellingTypeModalProps> = ({ isOpen, onClose, onRefresh, editType }) => {
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [courseDetails, setCourseDetails] = useState('{}');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editType) {
            setName(editType.name);
            setPrompt(editType.prompt);
            setIsActive(editType.isActive);
            setCourseDetails(JSON.stringify(editType.courseDetails || {}, null, 2));
        } else {
            // Reset for new
            setName('');
            setPrompt('');
            setIsActive(true);
            setCourseDetails('{\n  "basic_courses": [],\n  "advance_courses": [],\n  "international_courses": []\n}');
        }
    }, [editType, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let parsedDetails = {};
            try {
                parsedDetails = JSON.parse(courseDetails);
            } catch (err) {
                alert("Invalid JSON in Course Details");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                name,
                prompt,
                isActive,
                courseDetails: parsedDetails
            };

            const token = localStorage.getItem('token');
            const url = `${process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:3002'}/admin/counselling/types${editType ? `/${editType.id}` : ''}`;
            const method = editType ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onRefresh();
                onClose();
            } else {
                alert("Failed to save.");
            }
        } catch (error) {
            console.error("Error saving type", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-24">
            <div className="bg-white dark:bg-brand-dark-secondary w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-brand-dark-tertiary overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-brand-dark-tertiary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editType ? 'Edit Counselling Type' : 'Add New Counselling Type'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="counselling-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-brand-dark-tertiary/50 border border-gray-200 dark:border-brand-dark-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/50 dark:text-white"
                                placeholder="e.g. Student Counselling"
                                required
                            />
                        </div>

                        {/* Prompt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                AI Prompt / Description
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-brand-dark-tertiary/50 border border-gray-200 dark:border-brand-dark-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/50 dark:text-white"
                                placeholder="Describe the purpose or AI prompt for this counselling type..."
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 text-brand-green rounded focus:ring-brand-green"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Active Status
                            </label>
                        </div>

                        {/* Course Details JSON */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Course Details (JSON Configuration)
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Define courses, eligibility, and fees structure here.</p>
                            <textarea
                                value={courseDetails}
                                onChange={(e) => setCourseDetails(e.target.value)}
                                rows={10}
                                className="w-full px-4 py-2 font-mono text-xs bg-gray-900 text-green-400 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                                placeholder="{ ... }"
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-brand-dark-tertiary bg-gray-50 dark:bg-brand-dark-tertiary/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="counselling-form"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCounsellingTypeModal;
