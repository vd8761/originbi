import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
};

const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove();
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg w-full max-w-sm animate-in slide-in-from-right-full transition-transform bg-white dark:bg-[#1e293b] ${bgColors[toast.type]} backdrop-blur-sm`}>
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1">
                {toast.title && (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {toast.title}
                    </h3>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </div>,
        document.body
    );
};
