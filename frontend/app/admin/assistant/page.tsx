'use client';

export default function AssistantPage() {
    return (
        <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
                <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">AI Assistant Upgraded!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We have moved the AI Assistant to a globally accessible floating widget. You can now access <strong>Ask BI</strong> from anywhere in the portal!
                </p>
                <p className="text-sm font-medium text-brand-green animate-pulse">
                    Look for the Ask AI button in the bottom right corner 👇
                </p>
            </div>
        </div>
    );
}
