'use client';

import React from 'react';
import { SessionItem as SessionItemType } from '../../lib/types';

// Close icon component
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Session row item component for the modal
const SessionRow: React.FC<{ session: SessionItemType; isLast?: boolean }> = ({ session, isLast }) => (
    <div className={`flex justify-between items-center py-4 sm:py-5 ${!isLast ? 'border-b border-gray-200 dark:border-white/10' : ''}`}>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#19211C] dark:text-white text-sm sm:text-base">
                {session.title}
            </p>
            <p className="text-[#19211C]/60 dark:text-white/50 text-xs sm:text-sm mt-0.5">
                {session.duration}
            </p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
            <p className="font-semibold text-[#19211C] dark:text-white text-xs sm:text-sm">
                {session.date}
            </p>
            <p className="text-[#19211C]/60 dark:text-white/50 text-xs mt-0.5">
                {session.time}
            </p>
        </div>
    </div>
);

interface SessionProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: SessionItemType[];
    completedSessions?: number;
    totalSessions?: number;
}

const SessionProgressModal: React.FC<SessionProgressModalProps> = ({
    isOpen,
    onClose,
    sessions,
    completedSessions = 5,
    totalSessions = 10,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 sm:p-6 lg:p-8">
            {/* Backdrop - subtle, no blur */}
            <div
                className="absolute inset-0 bg-black/40 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Container - positioned on the right */}
            <div
                className="relative w-full max-w-sm sm:max-w-md mt-16 sm:mt-20 lg:mt-24 mr-0 lg:mr-4 animate-fade-in"
                style={{ animationDuration: '200ms' }}
            >
                {/* Modal with solid dark background */}
                <div className="relative bg-white dark:bg-[#1A1D21] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="flex justify-between items-center px-5 sm:px-6 py-4 sm:py-5">
                        <h2 className="text-lg sm:text-xl font-semibold text-[#19211C] dark:text-white">
                            Session Progress{' '}
                            <span className="text-[#19211C]/60 dark:text-white/60">
                                {String(completedSessions).padStart(2, '0')}/{totalSessions}
                            </span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#19211C] dark:text-white" />
                        </button>
                    </div>

                    {/* Sessions List */}
                    <div className="px-5 sm:px-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {sessions.length > 0 ? (
                            sessions.map((session, index) => (
                                <SessionRow
                                    key={index}
                                    session={session}
                                    isLast={index === sessions.length - 1}
                                />
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[#19211C]/60 dark:text-white/50 text-sm">
                                    No sessions available
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom padding for visual balance */}
                    <div className="h-4 sm:h-5"></div>
                </div>
            </div>
        </div>
    );
};

export default SessionProgressModal;
